import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

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
    const costId = params.id

    // Verificar se o custo pertence ao usuário
    const existingCost = await prisma.cost.findFirst({
      where: { id: costId, userId },
    })

    if (!existingCost) {
      return NextResponse.json(
        { error: "Custo não encontrado" },
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

    const {
      name,
      description,
      imageUrl,
      category,
      currency,
      quantity,
      unitValue,
      tax,
      fee,
      deliveryFee,
      documentIds,
      taskId,
    } = body

    const updateData: Record<string, unknown> = {
      updatedAt: { $date: new Date().toISOString() },
    }

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Nome inválido" },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl?.trim() || null
    }

    if (category !== undefined) {
      if (typeof category !== "string") {
        return NextResponse.json(
          { error: "Categoria inválida" },
          { status: 400 }
        )
      }
      updateData.category = category
    }

    if (currency !== undefined) {
      if (typeof currency !== "string") {
        return NextResponse.json(
          { error: "Moeda inválida" },
          { status: 400 }
        )
      }
      updateData.currency = currency
    }

    if (quantity !== undefined) {
      if (
        typeof quantity !== "number" ||
        quantity <= 0 ||
        !Number.isInteger(quantity)
      ) {
        return NextResponse.json(
          { error: "Quantidade inválida" },
          { status: 400 }
        )
      }
      updateData.quantity = quantity
    }

    if (unitValue !== undefined) {
      if (typeof unitValue !== "number" || unitValue <= 0) {
        return NextResponse.json(
          { error: "Valor unitário inválido" },
          { status: 400 }
        )
      }
      updateData.unitValue = unitValue
    }

    if (tax !== undefined) {
      updateData.tax = tax && tax > 0 ? tax : null
    }

    if (fee !== undefined) {
      updateData.fee = fee && fee > 0 ? fee : null
    }

    if (deliveryFee !== undefined) {
      updateData.deliveryFee = deliveryFee && deliveryFee > 0 ? deliveryFee : null
    }

    if (documentIds !== undefined) {
      if (Array.isArray(documentIds)) {
        // Validar que não há mais de 3 documentos
        if (documentIds.length > 3) {
          return NextResponse.json(
            { error: "Máximo de 3 documentos permitidos por item de custo" },
            { status: 400 }
          )
        }
        updateData.documentIds = documentIds
          .filter((id: string) => id && id.trim())
          .map((id: string) => ({ $oid: id.trim() }))
      } else {
        return NextResponse.json(
          { error: "documentIds deve ser um array" },
          { status: 400 }
        )
      }
    }

    if (taskId !== undefined) {
      updateData.taskId = taskId && taskId.trim() ? { $oid: taskId } : null
    }

    // Atualizar usando $runCommandRaw para MongoDB
    try {
      await prisma.$runCommandRaw({
        update: "costs",
        updates: [
          {
            q: { _id: { $oid: costId } },
            u: {
              $set: updateData,
            },
          },
        ] as any,
      })
    } catch (updateError) {
      console.error("Erro ao atualizar no MongoDB:", updateError)
      // Fallback: tentar com update normal do Prisma
      try {
        const prismaUpdateData: {
          name?: string
          description?: string | null
          imageUrl?: string | null
          category?: string
          currency?: string
          quantity?: number
          unitValue?: number
          tax?: number | null
          fee?: number | null
          deliveryFee?: number | null
          documentIds?: string[]
          taskId?: string | null
        } = {}

        if (name !== undefined) prismaUpdateData.name = name.trim()
        if (description !== undefined) prismaUpdateData.description = description?.trim() || null
        if (imageUrl !== undefined) prismaUpdateData.imageUrl = imageUrl?.trim() || null
        if (category !== undefined) prismaUpdateData.category = category
        if (currency !== undefined) prismaUpdateData.currency = currency
        if (quantity !== undefined) prismaUpdateData.quantity = quantity
        if (unitValue !== undefined) prismaUpdateData.unitValue = unitValue
        if (tax !== undefined) prismaUpdateData.tax = tax && tax > 0 ? tax : null
        if (fee !== undefined) prismaUpdateData.fee = fee && fee > 0 ? fee : null
        if (deliveryFee !== undefined) prismaUpdateData.deliveryFee = deliveryFee && deliveryFee > 0 ? deliveryFee : null
        if (documentIds !== undefined) {
          if (Array.isArray(documentIds)) {
            if (documentIds.length > 3) {
              return NextResponse.json(
                { error: "Máximo de 3 documentos permitidos por item de custo" },
                { status: 400 }
              )
            }
            prismaUpdateData.documentIds = documentIds.filter((id: string) => id && id.trim())
          } else {
            return NextResponse.json(
              { error: "documentIds deve ser um array" },
              { status: 400 }
            )
          }
        }
        if (taskId !== undefined) prismaUpdateData.taskId = taskId && taskId.trim() ? taskId : null

        await prisma.cost.update({
          where: { id: costId },
          data: prismaUpdateData,
        })
      } catch (fallbackError) {
        console.error("Erro no fallback update:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Custo atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar custo:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao atualizar custo"
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
    const costId = params.id

    // Verificar se o custo pertence ao usuário
    const existingCost = await prisma.cost.findFirst({
      where: { id: costId, userId },
    })

    if (!existingCost) {
      return NextResponse.json(
        { error: "Custo não encontrado" },
        { status: 404 }
      )
    }

    // Deletar usando $runCommandRaw para MongoDB
    try {
      // Deletar pagamentos primeiro (cascade)
      await prisma.$runCommandRaw({
        delete: "payments",
        deletes: [
          {
            q: { costId: { $oid: costId } },
            limit: 0,
          },
        ] as any,
      })

      // Deletar o custo
      await prisma.$runCommandRaw({
        delete: "costs",
        deletes: [
          {
            q: { _id: { $oid: costId } },
            limit: 1,
          },
        ] as any,
      })
    } catch (deleteError) {
      console.error("Erro ao deletar no MongoDB:", deleteError)
      // Fallback: tentar com delete normal do Prisma (cascade automático)
      try {
        await prisma.cost.delete({
          where: { id: costId },
        })
      } catch (fallbackError) {
        console.error("Erro no fallback delete:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Custo excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao deletar custo:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao deletar custo"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
