import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export default async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  const pathname = request.nextUrl.pathname

  const publicRoutes = ["/", "/signin", "/terms"]

  const isPublicRoute = publicRoutes.includes(pathname)

  if (!isPublicRoute && !token) {
    const signInUrl = new URL("/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(signInUrl)
  }

  if (token && (token.resetPassword as boolean) === true && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", request.url))
  }

  if (token && (token.resetPassword as boolean) !== true && pathname === "/change-password") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
      * Match all request paths except for the ones starting with:
      * - api (all API routes)
      * - _next/static (static files)
      * - _next/image (image optimization files)
      * - favicon.ico (favicon file)
      * - login (login page)
      * - root path (/)
      * - reset-password (password reset page)
      */
    "/((?!api|_next/static|_next/image|favicon.ico|login|reset-password).*)",
  ],
}
