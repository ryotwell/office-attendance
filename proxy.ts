import NextAuth from "next-auth"
import authConfig from "./auth.config"

const { auth } = NextAuth(authConfig)

// Next.js 16 calls proxy(request, event); route through NextAuth's middleware.
const handleAuth = auth as unknown as (
  request: Request,
  event: unknown
) => Promise<Response | void>

export function proxy(request: Request, event: unknown) {
  return handleAuth(request, event)
}

export const config = {
  // Auth API routes and login page pass through; everything else requires auth.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets|login).*)"],
}