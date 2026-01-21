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

    // Buscar custos do usuário com pagamentos
    const costs = await prisma.cost.findMany({
      where: { userId },
      include: {
        payments: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Formatar para o frontend
    const formattedCosts = costs.map((cost) => ({
      id: cost.id,
      name: cost.name,
      description: cost.description,
      imageUrl: cost.imageUrl,
      category: cost.category,
      currency: cost.currency,
      quantity: cost.quantity,
      unitValue: cost.unitValue,
      tax: cost.tax,
      fee: cost.fee,
      deliveryFee: cost.deliveryFee,
      documentId: cost.documentId,
      taskId: cost.taskId,
      payments: cost.payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency || cost.currency, // Fallback para moeda do custo se não tiver
        date: payment.date,
        receipt: payment.receipt,
        description: payment.description,
      })),
      createdAt: cost.createdAt,
    }))

    return NextResponse.json(formattedCosts)
  } catch (error) {
    console.error("Erro ao buscar custos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar custos" },
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
      documentId,
      taskId,
    } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      )
    }

    if (!category || typeof category !== "string") {
      return NextResponse.json(
        { error: "Categoria é obrigatória" },
        { status: 400 }
      )
    }

    if (!currency || typeof currency !== "string") {
      return NextResponse.json(
        { error: "Moeda é obrigatória" },
        { status: 400 }
      )
    }

    if (
      !quantity ||
      typeof quantity !== "number" ||
      quantity <= 0 ||
      !Number.isInteger(quantity)
    ) {
      return NextResponse.json(
        { error: "Quantidade deve ser um número inteiro positivo" },
        { status: 400 }
      )
    }

    if (
      !unitValue ||
      typeof unitValue !== "number" ||
      unitValue <= 0
    ) {
      return NextResponse.json(
        { error: "Valor unitário deve ser um número positivo" },
        { status: 400 }
      )
    }

    const now = new Date()

    // Criar custo usando $runCommandRaw para MongoDB
    try {
      const costData: Record<string, unknown> = {
        name: name.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        category: category,
        currency: currency,
        quantity: quantity,
        unitValue: unitValue,
        tax: tax && tax > 0 ? tax : null,
        fee: fee && fee > 0 ? fee : null,
        deliveryFee: deliveryFee && deliveryFee > 0 ? deliveryFee : null,
        documentId: documentId && documentId.trim() ? { $oid: documentId } : null,
        taskId: taskId && taskId.trim() ? { $oid: taskId } : null,
        userId: { $oid: userId },
        createdAt: { $date: now.toISOString() },
        updatedAt: { $date: now.toISOString() },
      }

      await prisma.$runCommandRaw({
        insert: "costs",
        documents: [costData] as any,
      })
    } catch (insertError) {
      console.error("Erro ao inserir no MongoDB:", insertError)
      // Fallback: tentar com create normal do Prisma
      try {
        await prisma.cost.create({
          data: {
            name: name.trim(),
            description: description?.trim() || undefined,
            imageUrl: imageUrl?.trim() || undefined,
            category: category,
            currency: currency,
            quantity: quantity,
            unitValue: unitValue,
            tax: tax && tax > 0 ? tax : undefined,
            fee: fee && fee > 0 ? fee : undefined,
            deliveryFee: deliveryFee && deliveryFee > 0 ? deliveryFee : undefined,
            documentId: documentId && documentId.trim() ? documentId : undefined,
            taskId: taskId && taskId.trim() ? taskId : undefined,
            userId,
          },
        })
      } catch (fallbackError) {
        console.error("Erro no fallback create:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Custo criado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao criar custo:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao criar custo"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
