import type { NextAuthConfig } from "next-auth"

// Edge-safe config (no Prisma, no bcrypt). Used by middleware.
export default {
  providers: [],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = request.nextUrl
      const isLoginPage = pathname === "/login"

      // Allow login page when logged out; require auth for everything else.
      if (isLoginPage) {
        return isLoggedIn ? Response.redirect(new URL("/", request.nextUrl)) : true
      }
      return isLoggedIn
    },
  },
} satisfies NextAuthConfig
