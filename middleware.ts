import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

const PUBLIC_ROUTES = ["/login"]
const PROTECTED_PREFIX = ["/contacts", "/finance", "/inventory", "/admin", "/marketing"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  const isProtected = PROTECTED_PREFIX.some((r) => pathname.startsWith(r))

  const token = req.cookies.get("session")?.value

  // Redirect authenticated users away from login
  if (isPublic && token) {
    const user = await verifyToken(token)
    if (user) {
      return NextResponse.redirect(new URL("/contacts", req.url))
    }
  }

  // Protect dashboard routes
  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    const user = await verifyToken(token)

    if (!user) {
      const response = NextResponse.redirect(new URL("/login", req.url))
      response.cookies.delete("session")
      return response
    }

    // Attach user info to headers for server components to read
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-user-id", user.id)
    requestHeaders.set("x-user-role", user.role)
    requestHeaders.set("x-user-name", user.name)
    requestHeaders.set("x-user-email", user.email)

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons).*)",
  ],
}