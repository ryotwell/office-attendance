import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE"
      username: string
    } & DefaultSession["user"]
  }

  interface User {
    role?: "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE"
    username?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE"
    username?: string
  }
}
