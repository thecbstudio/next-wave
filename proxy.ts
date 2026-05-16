import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC = ["/login", "/api/auth", "/landing", "/api/stats", "/api/live-trends/callback", "/api/live-trends/status"]
const API_KEY_ROUTES = ["/api/n8n"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()

  if (API_KEY_ROUTES.some(p => pathname.startsWith(p))) {
    const apiKey = process.env.N8N_API_KEY
    const provided = request.headers.get("x-api-key")
    if (!apiKey || provided !== apiKey)
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.next()
  }

  const token = request.cookies.get("tp_auth")?.value
  if (token !== "ok") {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
}
