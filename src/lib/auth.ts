import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/en/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key",
  debug: process.env.NODE_ENV === "development",
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            driverProfile: true,
            customerProfile: true,
            accountantProfile: true,
            customsBrokerProfile: true,
          },
        })

        if (!user || !user.isActive) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          driverProfile: user.driverProfile,
          customerProfile: user.customerProfile,
          accountantProfile: user.accountantProfile,
          customsBrokerProfile: user.customsBrokerProfile,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.driverProfile = user.driverProfile
        token.customerProfile = user.customerProfile
        token.accountantProfile = user.accountantProfile
        token.customsBrokerProfile = user.customsBrokerProfile
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.driverProfile = token.driverProfile
        session.user.customerProfile = token.customerProfile
        session.user.accountantProfile = token.accountantProfile
        session.user.customsBrokerProfile = token.customsBrokerProfile
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // If user is signing in, redirect to our custom auth-redirect page with default locale
      if (url === baseUrl) {
        return `${baseUrl}/en/auth-redirect`
      }
      // If it's a relative URL, make it absolute
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // If it's the same origin, allow it
      if (new URL(url).origin === baseUrl) {
        return url
      }
      // Otherwise redirect to auth-redirect page with default locale
      return `${baseUrl}/en/auth-redirect`
    },
  },
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      driverProfile?: any
      customerProfile?: any
      accountantProfile?: any
      customsBrokerProfile?: any
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    driverProfile?: any
    customerProfile?: any
    accountantProfile?: any
    customsBrokerProfile?: any
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    driverProfile?: any
    customerProfile?: any
    accountantProfile?: any
    customsBrokerProfile?: any
  }
}