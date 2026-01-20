import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"

type MongoImageResult = {
  cursor?: {
    firstBatch?: Array<{
      image?: string | null
    }>
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (
          !credentials ||
          typeof credentials.username !== "string" ||
          typeof credentials.password !== "string"
        ) {
          throw new Error("Usuário ou senha inválidos")
        }

        const { username, password } = credentials

        let user = await prisma.user.findUnique({
          where: { username },
        })

        if (!user) {
          const familyMember = await prisma.familyMember.findUnique({
            where: { username },
          })

          if (familyMember) {
            user = await prisma.user.findUnique({
              where: { id: familyMember.userLinkId },
            })
          }
        }

        if (!user) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        let image: string | null = null

        try {
          const result = (await prisma.$runCommandRaw({
            find: "users",
            filter: { _id: { $oid: user.id } },
            projection: { image: 1 },
            limit: 1,
          })) as MongoImageResult

          image = result.cursor?.firstBatch?.[0]?.image ?? null
        } catch {
          return null
        }

        return {
          id: user.id,
          username: user.username,
          name: user.fullName,
          role: user.role,
          resetPassword: user.resetPassword,
          image,
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.resetPassword = user.resetPassword
        token.image = user.image
      }

      if (trigger === "update") {
        try {
          // Busca dados básicos do usuário
          const updatedUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              username: true,
              role: true,
              resetPassword: true,
              fullName: true,
            },
          })

          if (updatedUser) {
            token.resetPassword = updatedUser.resetPassword
            token.role = updatedUser.role
            token.username = updatedUser.username
          }

          try {
            const imageResult = (await prisma.$runCommandRaw({
              find: "users",
              filter: { _id: { $oid: token.id as string } },
              projection: { image: 1 },
              limit: 1,
            })) as MongoImageResult

            token.image = imageResult.cursor?.firstBatch?.[0]?.image ?? null
          } catch (imageError) {
            console.log("Erro ao buscar imagem no update:", imageError)
          }
        } catch (error) {
          console.error("Erro ao atualizar token:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as Role
        session.user.resetPassword = token.resetPassword as boolean
        session.user.image = token.image as string | null
      }
      return session
    },
  },

  pages: {
    signIn: "/signin",
  },

  secret: process.env.NEXTAUTH_SECRET,
}
