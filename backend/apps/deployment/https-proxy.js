import { request as httpRequest } from "node:http"
import { createServer } from "node:https"
import { readFileSync, statSync } from "node:fs"
import { createSecureContext } from "node:tls"

const host = process.env.PROXY_HOST ?? "127.0.0.1"
const port = Number(process.env.PROXY_PORT ?? 9444)
const frontendOrigin = new URL(process.env.FRONTEND_ORIGIN ?? "http://127.0.0.1:4001")
const certificatePath = process.env.TLS_CERT_PATH
const privateKeyPath = process.env.TLS_KEY_PATH

if (!certificatePath || !privateKeyPath) throw new Error("TLS_CERT_PATH and TLS_KEY_PATH are required.")

function readTlsOptions() {
  return { cert: readFileSync(certificatePath), key: readFileSync(privateKeyPath) }
}

const initialTlsOptions = readTlsOptions()
const server = createServer({
  ...initialTlsOptions,
  SNICallback(_serverName, callback) {
    try {
      const options = readTlsOptions()
      callback(null, createSecureContext(options))
    } catch (error) {
      callback(error)
    }
  },
}, (incoming, outgoing) => {
  const forwardedFor = incoming.socket.remoteAddress ?? ""
  const headers = {
    ...incoming.headers,
    host: `${frontendOrigin.hostname}:${frontendOrigin.port || 80}`,
    "x-forwarded-host": incoming.headers.host ?? "",
    "x-forwarded-proto": "https",
    "x-forwarded-for": forwardedFor,
  }
  const upstream = httpRequest({
    hostname: frontendOrigin.hostname,
    port: frontendOrigin.port || 80,
    path: incoming.url,
    method: incoming.method,
    headers,
  }, (response) => {
    outgoing.writeHead(response.statusCode ?? 502, response.headers)
    response.pipe(outgoing)
  })
  upstream.on("error", () => {
    if (!outgoing.headersSent) outgoing.writeHead(502, { "content-type": "text/plain; charset=utf-8" })
    outgoing.end("Quire application is temporarily unavailable.")
  })
  incoming.pipe(upstream)
})

// The host renews its short-lived IP certificate daily. Refresh the default
// TLS context after the certificate symlink points at a renewed certificate.
let certificateStamp = `${statSync(certificatePath).mtimeMs}:${statSync(privateKeyPath).mtimeMs}`
const refreshTimer = setInterval(() => {
  try {
    const certStat = statSync(certificatePath)
    const keyStat = statSync(privateKeyPath)
    const nextStamp = `${certStat.mtimeMs}:${keyStat.mtimeMs}`
    if (nextStamp === certificateStamp) return
    server.setSecureContext(readTlsOptions())
    certificateStamp = nextStamp
  } catch (error) {
    console.error("Unable to refresh Quire TLS certificate:", error.message)
  }
}, 60_000)
refreshTimer.unref()

server.listen(port, host, () => console.log(`Quire HTTPS proxy listening at https://${host}:${port}`))
