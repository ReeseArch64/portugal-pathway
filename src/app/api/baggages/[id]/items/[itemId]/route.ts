import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
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
    const itemId = params.itemId

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

    // Verificar se o item pertence à bagagem
    const existingItem = await prisma.baggageItem.findFirst({
      where: { id: itemId, baggageId },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description, imageUrl, quantity } = body

    const updateFields: Record<string, unknown> = {}
    if (name !== undefined) updateFields.name = name.trim()
    if (description !== undefined)
      updateFields.description = description?.trim() || null
    if (imageUrl !== undefined) updateFields.imageUrl = imageUrl?.trim() || null
    if (quantity !== undefined) updateFields.quantity = quantity || 1
    updateFields.updatedAt = { $date: new Date().toISOString() }

    // Atualizar item usando $runCommandRaw para MongoDB
    try {
      await prisma.$runCommandRaw({
        update: "baggage_items",
        updates: [
          {
            q: { _id: { $oid: itemId } },
            u: { $set: updateFields },
          },
        ] as any,
      })
    } catch (updateError) {
      console.error("Erro ao atualizar no MongoDB:", updateError)
      // Fallback: tentar com update normal do Prisma
      try {
        await prisma.baggageItem.update({
          where: { id: itemId },
          data: {
            name: name?.trim(),
            description: description?.trim() || undefined,
            imageUrl: imageUrl?.trim() || undefined,
            quantity: quantity || 1,
          },
        })
      } catch (fallbackError) {
        console.error("Erro no fallback update:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Item atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar item:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao atualizar item"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
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
    const itemId = params.itemId

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

    // Verificar se o item pertence à bagagem
    const existingItem = await prisma.baggageItem.findFirst({
      where: { id: itemId, baggageId },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      )
    }

    // Deletar item
    await prisma.baggageItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({
      success: true,
      message: "Item excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao deletar item:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao deletar item"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
