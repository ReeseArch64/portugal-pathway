import { Role } from "@prisma/client"
import { DefaultSession, DefaultUser } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user?: {
      id: string
      username: string
      role: Role
      resetPassword: boolean
      image: string | null
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    username: string
    role: Role
    resetPassword: boolean
    image: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    username: string
    role: Role
    resetPassword: boolean
    image: string | null
  }
}
