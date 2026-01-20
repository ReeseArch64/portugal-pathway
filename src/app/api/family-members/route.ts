import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const userId = token.id as string

    // Buscar membros da família do usuário
    const members = await prisma.familyMember.findMany({
      where: { userId },
      select: {
        id: true,
        fullName: true,
        relationship: true,
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error("Erro ao buscar membros da família:", error)
    return NextResponse.json(
      { error: "Erro ao buscar membros da família" },
      { status: 500 }
    )
  }
}
