import NextAuth, { type NextAuthOptions } from "next-auth"
import { authOptions as authOptionsConfig } from "@/lib/auth"

export const authOptions: NextAuthOptions = authOptionsConfig;

const handler = NextAuth(authOptionsConfig)

export { handler as GET, handler as POST }