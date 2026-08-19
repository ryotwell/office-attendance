import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

import { prisma } from "@/lib/prisma"
import authConfig from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined
        const password = credentials?.password as string | undefined
        if (!username || !password) return null

        const user = await prisma.user.findUnique({
          where: { username },
        })
        if (!user || !user.isActive) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          username: user.username,
          name: user.name,
          image: user.imageUrl,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role
        token.username = (user as { username?: string }).username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { id: true, name: true, username: true, imageUrl: true, role: true, isActive: true },
        })
        if (!user || !user.isActive) return session

        session.user.id = user.id
        session.user.name = user.name
        session.user.image = user.imageUrl
        session.user.username = user.username
        session.user.role = user.role
      }
      return session
    },
  },
})
