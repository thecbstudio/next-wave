import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC = ["/login", "/api/auth", "/landing"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let public routes through
  if (PUBLIC.some(p => pathname.startsWith(p))) {
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
