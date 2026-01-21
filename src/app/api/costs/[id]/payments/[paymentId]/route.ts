import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; paymentId: string }> }
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
    const paymentId = params.paymentId

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

    // Verificar se o pagamento existe e pertence ao custo
    const existingPayment = await prisma.payment.findFirst({
      where: { id: paymentId, costId },
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
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

    const { amount, date, receipt, description } = body

    const updateData: Record<string, unknown> = {
      updatedAt: { $date: new Date().toISOString() },
    }

    if (amount !== undefined) {
      if (typeof amount !== "number" || amount <= 0) {
        return NextResponse.json(
          { error: "Valor do pagamento deve ser um número positivo" },
          { status: 400 }
        )
      }
      updateData.amount = amount
    }

    if (date !== undefined) {
      if (typeof date !== "string") {
        return NextResponse.json(
          { error: "Data inválida" },
          { status: 400 }
        )
      }
      updateData.date = { $date: new Date(date).toISOString() }
    }

    if (receipt !== undefined) {
      updateData.receipt = receipt?.trim() || null
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    // Atualizar usando $runCommandRaw para MongoDB
    try {
      await prisma.$runCommandRaw({
        update: "payments",
        updates: [
          {
            q: { _id: { $oid: paymentId } },
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
          amount?: number
          date?: Date
          receipt?: string | null
          description?: string | null
        } = {}

        if (amount !== undefined) prismaUpdateData.amount = amount
        if (date !== undefined) prismaUpdateData.date = new Date(date)
        if (receipt !== undefined) prismaUpdateData.receipt = receipt?.trim() || null
        if (description !== undefined) prismaUpdateData.description = description?.trim() || null

        await prisma.payment.update({
          where: { id: paymentId },
          data: prismaUpdateData,
        })
      } catch (fallbackError) {
        console.error("Erro no fallback update:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pagamento atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar pagamento:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao atualizar pagamento"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
