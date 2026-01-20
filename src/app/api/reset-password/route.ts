import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    // Obter o token JWT da sessão
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      console.error("Token não encontrado na requisição")
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    if (!token.id) {
      console.error("Token sem ID do usuário:", token)
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      )
    }

    const userId = token.id as string

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Erro ao fazer parse do body:", parseError)
      return NextResponse.json(
        { error: "Formato de requisição inválido" },
        { status: 400 }
      )
    }

    const { newPassword, confirmPassword } = body

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Senha e confirmação são obrigatórias" },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "As senhas não coincidem" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const now = new Date()

    // Atualizar senha e resetPassword no banco usando $runCommandRaw para MongoDB
    try {
      await prisma.$runCommandRaw({
        update: "users",
        updates: [
          {
            q: { _id: { $oid: userId } },
            u: {
              $set: {
                password: hashedPassword,
                resetPassword: false,
                updatedAt: { $date: now.toISOString() },
              },
            },
          },
        ],
      })
    } catch (updateError) {
      console.error("Erro ao atualizar no MongoDB:", updateError)
      // Fallback: tentar com update normal do Prisma
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            password: hashedPassword,
            resetPassword: false,
          },
        })
      } catch (fallbackError) {
        console.error("Erro no fallback update:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Senha atualizada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao resetar senha:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao atualizar senha"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
