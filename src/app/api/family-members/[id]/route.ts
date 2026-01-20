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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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
    const resolvedParams = await Promise.resolve(params)
    const memberId = resolvedParams.id

    // Verificar se o membro pertence ao usuário
    const existingMember = await prisma.familyMember.findFirst({
      where: { id: memberId, userId },
    })

    if (!existingMember) {
      return NextResponse.json(
        { error: "Membro da família não encontrado" },
        { status: 404 }
      )
    }

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

    const updateData: Record<string, unknown> = {
      updatedAt: { $date: new Date().toISOString() },
    }

    if (fullName !== undefined) {
      if (typeof fullName !== "string" || fullName.trim().length === 0) {
        return NextResponse.json(
          { error: "Nome completo inválido" },
          { status: 400 }
        )
      }
      updateData.fullName = fullName.trim()
    }

    if (relationship !== undefined) {
      if (!relationshipMap[relationship]) {
        return NextResponse.json(
          { error: "Parentesco inválido" },
          { status: 400 }
        )
      }
      updateData.relationship = relationshipMap[relationship]
    }

    if (username !== undefined) {
      if (typeof username !== "string" || username.trim().length === 0) {
        return NextResponse.json(
          { error: "Username inválido" },
          { status: 400 }
        )
      }

      // Verificar se o username já está em uso por outro membro
      const usernameTaken = await prisma.familyMember.findFirst({
        where: {
          username: username.trim(),
          id: { not: memberId },
        },
      })

      if (usernameTaken) {
        return NextResponse.json(
          { error: "Username já está em uso" },
          { status: 400 }
        )
      }

      updateData.username = username.trim()
    }

    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? { $date: new Date(dateOfBirth).toISOString() } : null
    }

    // Atualizar usando $runCommandRaw para MongoDB
    try {
      await prisma.$runCommandRaw({
        update: "family_members",
        updates: [
          {
            q: { _id: { $oid: memberId } },
            u: {
              $set: updateData,
            },
          },
        ],
      })
    } catch (updateError) {
      console.error("Erro ao atualizar no MongoDB:", updateError)
      // Fallback: tentar com update normal do Prisma
      try {
        const prismaUpdateData: {
          fullName?: string
          relationship?: "TITULAR" | "CONJUGE" | "FILHO" | "FILHA" | "PAI" | "MAE" | "IRMAO"
          username?: string
          dateOfBirth?: Date | null
        } = {}

        if (fullName !== undefined) prismaUpdateData.fullName = fullName.trim()
        if (relationship !== undefined) prismaUpdateData.relationship = relationshipMap[relationship]
        if (username !== undefined) prismaUpdateData.username = username.trim()
        if (dateOfBirth !== undefined) prismaUpdateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null

        await prisma.familyMember.update({
          where: { id: memberId },
          data: prismaUpdateData,
        })
      } catch (fallbackError) {
        console.error("Erro no fallback update:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Membro da família atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar membro da família:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao atualizar membro da família"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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
    const resolvedParams = await Promise.resolve(params)
    const memberId = resolvedParams.id

    // Verificar se o membro pertence ao usuário
    const existingMember = await prisma.familyMember.findFirst({
      where: { id: memberId, userId },
    })

    if (!existingMember) {
      return NextResponse.json(
        { error: "Membro da família não encontrado" },
        { status: 404 }
      )
    }

    // Deletar usando $runCommandRaw para MongoDB
    try {
      await prisma.$runCommandRaw({
        delete: "family_members",
        deletes: [
          {
            q: { _id: { $oid: memberId } },
            limit: 1,
          },
        ],
      })
    } catch (deleteError) {
      console.error("Erro ao deletar no MongoDB:", deleteError)
      // Fallback: tentar com delete normal do Prisma
      try {
        await prisma.familyMember.delete({
          where: { id: memberId },
        })
      } catch (fallbackError) {
        console.error("Erro no fallback delete:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Membro da família excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao deletar membro da família:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao deletar membro da família"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
