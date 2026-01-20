import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

const baggageTypeMap: Record<string, "MOCHILA" | "MALA" | "BOLSA"> = {
  "Mochila": "MOCHILA",
  "Mala": "MALA",
  "Bolsa": "BOLSA",
}

const baggageVariantMap: Record<string, "MATERNIDADE" | "COMUM" | "ESPORTE"> = {
  "Maternidade": "MATERNIDADE",
  "Comum": "COMUM",
  "Esporte": "ESPORTE",
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
    const params = await context.params
    const baggageId = params.id

    // Verificar se a bagagem pertence ao usuário
    const existingBaggage = await prisma.baggage.findFirst({
      where: { id: baggageId, userId },
    })

    if (!existingBaggage) {
      return NextResponse.json(
        { error: "Bagagem não encontrada" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { type, variant, name, imageUrl, maxWeight } = body

    const updateFields: Record<string, unknown> = {}
    if (type !== undefined) {
      const prismaType = baggageTypeMap[type]
      if (!prismaType) {
        return NextResponse.json(
          { error: "Tipo de bagagem inválido" },
          { status: 400 }
        )
      }
      updateFields.type = prismaType
    }
    if (variant !== undefined) {
      const prismaVariant = baggageVariantMap[variant]
      if (!prismaVariant) {
        return NextResponse.json(
          { error: "Variante de bagagem inválida" },
          { status: 400 }
        )
      }
      updateFields.variant = prismaVariant
    }
    if (name !== undefined) updateFields.name = name.trim()
    if (imageUrl !== undefined) updateFields.imageUrl = imageUrl?.trim() || null
    if (maxWeight !== undefined) {
      updateFields.maxWeight = maxWeight || null
    }
    updateFields.updatedAt = { $date: new Date().toISOString() }

    // Atualizar bagagem usando $runCommandRaw para MongoDB
    try {
      await prisma.$runCommandRaw({
        update: "baggages",
        updates: [
          {
            q: { _id: { $oid: baggageId } },
            u: { $set: updateFields },
          },
        ] as any,
      })
    } catch (updateError) {
      console.error("Erro ao atualizar no MongoDB:", updateError)
      // Fallback: tentar com update normal do Prisma
      try {
        const updateData: any = {}
        if (type !== undefined) {
          const prismaType = baggageTypeMap[type]
          if (prismaType) updateData.type = prismaType
        }
        if (variant !== undefined) {
          const prismaVariant = baggageVariantMap[variant]
          if (prismaVariant) updateData.variant = prismaVariant
        }
        if (name !== undefined) updateData.name = name.trim()
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || undefined
        if (maxWeight !== undefined) updateData.maxWeight = maxWeight || undefined

        await prisma.baggage.update({
          where: { id: baggageId },
          data: updateData,
        })
      } catch (fallbackError) {
        console.error("Erro no fallback update:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Bagagem atualizada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar bagagem:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao atualizar bagagem"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
    const params = await context.params
    const baggageId = params.id

    // Verificar se a bagagem pertence ao usuário
    const existingBaggage = await prisma.baggage.findFirst({
      where: { id: baggageId, userId },
    })

    if (!existingBaggage) {
      return NextResponse.json(
        { error: "Bagagem não encontrada" },
        { status: 404 }
      )
    }

    // Deletar bagagem (os itens serão deletados em cascade)
    await prisma.baggage.delete({
      where: { id: baggageId },
    })

    return NextResponse.json({
      success: true,
      message: "Bagagem excluída com sucesso",
    })
  } catch (error) {
    console.error("Erro ao deletar bagagem:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao deletar bagagem"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
