import { openDatabase } from "./database.js"
import { createAuthRepository } from "./apps/auth/auth-repository.js"

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    const input = process.stdin
    if (!input.isTTY || typeof input.setRawMode !== "function") {
      reject(new Error("Run this command in an interactive terminal so the password can be entered without echo."))
      return
    }

    process.stdout.write(prompt)
    let value = ""
    const finish = (error) => {
      input.setRawMode(false)
      input.pause()
      input.removeListener("data", onData)
      process.stdout.write("\n")
      error ? reject(error) : resolve(value)
    }
    const onData = (chunk) => {
      for (const character of String(chunk)) {
        if (character === "\u0003") return finish(new Error("Cancelled."))
        if (character === "\r" || character === "\n") return finish()
        if (character === "\u007f" || character === "\b") value = value.slice(0, -1)
        else if (character >= " ") value += character
      }
    }
    input.setRawMode(true)
    input.resume()
    input.on("data", onData)
  })
}

const database = openDatabase({ seed: false })
try {
  const auth = createAuthRepository(database)
  const count = database.prepare("SELECT count(*) AS count FROM users").get().count
  if (count > 0) throw new Error("An account already exists. This command only creates the first account.")
  const password = await readHidden("Initial account password (at least 12 characters): ")
  const created = auth.ensureInitialUser({
    email: process.env.INITIAL_ADMIN_EMAIL ?? "ywenssalimi@gmail.com",
    name: process.env.INITIAL_ADMIN_NAME ?? "Younes Salimi",
    password,
  })
  if (created) console.log("Initial account created. The password is stored only as a salted scrypt hash.")
} finally {
  database.close()
}
