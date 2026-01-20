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

    const { amount, date, receipt, description } = body

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Valor do pagamento deve ser um número positivo" },
        { status: 400 }
      )
    }

    if (!date || typeof date !== "string") {
      return NextResponse.json(
        { error: "Data é obrigatória" },
        { status: 400 }
      )
    }

    const paymentDate = new Date(date)
    const now = new Date()

    // Criar pagamento usando $runCommandRaw para MongoDB
    try {
      const paymentData: Record<string, unknown> = {
        costId: { $oid: costId },
        amount: amount,
        date: { $date: paymentDate.toISOString() },
        receipt: receipt?.trim() || null,
        description: description?.trim() || null,
        createdAt: { $date: now.toISOString() },
        updatedAt: { $date: now.toISOString() },
      }

      await prisma.$runCommandRaw({
        insert: "payments",
        documents: [paymentData] as any,
      })
    } catch (insertError) {
      console.error("Erro ao inserir no MongoDB:", insertError)
      // Fallback: tentar com create normal do Prisma
      try {
        await prisma.payment.create({
          data: {
            costId,
            amount,
            date: paymentDate,
            receipt: receipt?.trim() || undefined,
            description: description?.trim() || undefined,
          },
        })
      } catch (fallbackError) {
        console.error("Erro no fallback create:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pagamento adicionado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao criar pagamento:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao criar pagamento"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
