import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const PROTECTED_PREFIX = ["/contacts", "/finance", "/inventory", "/admin", "/marketing","/dashboard" ]
const PUBLIC_ROUTES = ["/login"]

async function verifySession(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    return payload as {
      id: string
      name: string
      email: string
      role: string
    }
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get("session")?.value

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  const isProtected = PROTECTED_PREFIX.some((r) => pathname.startsWith(r))

  if (isPublic && token) {
    const user = await verifySession(token)
    if (user) {
      return NextResponse.redirect(new URL("/contacts", req.url))
    }
  }

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    const user = await verifySession(token)

    if (!user) {
      const res = NextResponse.redirect(new URL("/login", req.url))
      res.cookies.delete("session")
      return res
    }

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