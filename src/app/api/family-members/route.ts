import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

// Mapear relationship do frontend para o enum do Prisma
const relationshipMap: Record<string, "TITULAR" | "CONJUGE" | "FILHO" | "FILHA" | "PAI" | "MAE" | "IRMAO"> = {
  "Titular": "TITULAR",
  "Cônjuge": "CONJUGE",
  "Filho(a)": "FILHO",
  "Filho": "FILHO",
  "Filha": "FILHA",
  "Pai": "PAI",
  "Mãe": "MAE",
  "Irmão(ã)": "IRMAO",
  "Irmão": "IRMAO",
  "Irmã": "IRMAO",
}

// Mapear relationship do enum para o frontend
const relationshipReverseMap: Record<string, string> = {
  "TITULAR": "Titular",
  "CONJUGE": "Cônjuge",
  "FILHO": "Filho(a)",
  "FILHA": "Filha",
  "PAI": "Pai",
  "MAE": "Mãe",
  "IRMAO": "Irmão(ã)",
}

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
        username: true,
        dateOfBirth: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    })

    // Converter para o formato do frontend
    const formattedMembers = members.map((member) => ({
      id: member.id,
      fullName: member.fullName,
      relationship: relationshipReverseMap[member.relationship] || member.relationship,
      username: member.username,
      dateOfBirth: member.dateOfBirth,
      resetPassword: false, // FamilyMember não tem resetPassword no schema
      createdAt: member.createdAt,
    }))

    return NextResponse.json(formattedMembers)
  } catch (error) {
    console.error("Erro ao buscar membros da família:", error)
    return NextResponse.json(
      { error: "Erro ao buscar membros da família" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const { fullName, relationship, username, dateOfBirth } = body

    if (!fullName || typeof fullName !== "string" || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome completo é obrigatório" },
        { status: 400 }
      )
    }

    if (!relationship || !relationshipMap[relationship]) {
      return NextResponse.json(
        { error: "Parentesco é obrigatório e deve ser válido" },
        { status: 400 }
      )
    }

    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json(
        { error: "Username é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se o username já existe
    const existingMember = await prisma.familyMember.findUnique({
      where: { username: username.trim() },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "Username já está em uso" },
        { status: 400 }
      )
    }

    const prismaRelationship = relationshipMap[relationship]
    const dateOfBirthObj = dateOfBirth ? new Date(dateOfBirth) : null
    const now = new Date()


    // Criar membro da família usando $runCommandRaw para MongoDB
    try {
      const memberData: Record<string, unknown> = {
        fullName: fullName.trim(),
        relationship: prismaRelationship,
        username: username.trim(),
        dateOfBirth: dateOfBirthObj ? { $date: dateOfBirthObj.toISOString() } : null,
        userId: { $oid: userId },
        userLinkId: { $oid: userId },
        createdAt: { $date: now.toISOString() },
        updatedAt: { $date: now.toISOString() },
      }

      await prisma.$runCommandRaw({
        insert: "family_members",
        documents: [memberData],
      })
    } catch (insertError) {
      console.error("Erro ao inserir no MongoDB:", insertError)
      // Fallback: tentar com create normal do Prisma
      try {
        await prisma.familyMember.create({
          data: {
            fullName: fullName.trim(),
            relationship: prismaRelationship,
            username: username.trim(),
            dateOfBirth: dateOfBirthObj || undefined,
            userId,
            userLinkId: userId,
          },
        })
      } catch (fallbackError) {
        console.error("Erro no fallback create:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Membro da família criado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao criar membro da família:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao criar membro da família"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
