import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/signup") return NextResponse.redirect(new URL("/login", request.url))
  if (pathname === "/login") return NextResponse.next()
  const cookie = request.headers.get("cookie")
  if (!request.cookies.has("quire_session") || !cookie) {
    const loginUrl = new URL("/login", request.url)
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }
  const apiOrigin = (process.env.QUIRE_API_ORIGIN ?? "http://127.0.0.1:4000").replace(/\/$/, "")
  const session = await fetch(`${apiOrigin}/api/v1/auth/me`, { headers: { cookie }, cache: "no-store" }).catch(() => undefined)
  if (!session?.ok) return NextResponse.redirect(new URL("/login", request.url))
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/|_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)"],
}
