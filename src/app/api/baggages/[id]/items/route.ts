import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
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
    const { name, description, imageUrl, quantity } = body

    if (!name) {
      return NextResponse.json(
        { error: "Nome do item é obrigatório" },
        { status: 400 }
      )
    }

    // Criar item usando $runCommandRaw para MongoDB
    try {
      const itemData: Record<string, unknown> = {
        baggageId: { $oid: baggageId },
        name: name.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        quantity: quantity || 1,
        createdAt: { $date: new Date().toISOString() },
        updatedAt: { $date: new Date().toISOString() },
      }

      await prisma.$runCommandRaw({
        insert: "baggage_items",
        documents: [itemData] as any,
      })
    } catch (insertError) {
      console.error("Erro ao inserir no MongoDB:", insertError)
      // Fallback: tentar com create normal do Prisma
      try {
        await prisma.baggageItem.create({
          data: {
            baggageId,
            name: name.trim(),
            description: description?.trim() || undefined,
            imageUrl: imageUrl?.trim() || undefined,
            quantity: quantity || 1,
          },
        })
      } catch (fallbackError) {
        console.error("Erro no fallback create:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Item adicionado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao adicionar item:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao adicionar item"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
