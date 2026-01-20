import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

const baggageTypeMap: Record<string, "MOCHILA" | "MALA" | "BOLSA"> = {
  "Mochila": "MOCHILA",
  "Mala": "MALA",
  "Bolsa": "BOLSA",
}

const baggageTypeReverseMap: Record<string, string> = {
  "MOCHILA": "Mochila",
  "MALA": "Mala",
  "BOLSA": "Bolsa",
}

const baggageVariantMap: Record<string, "MATERNIDADE" | "COMUM" | "ESPORTE"> = {
  "Maternidade": "MATERNIDADE",
  "Comum": "COMUM",
  "Esporte": "ESPORTE",
}

const baggageVariantReverseMap: Record<string, string> = {
  "MATERNIDADE": "Maternidade",
  "COMUM": "Comum",
  "ESPORTE": "Esporte",
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

    // Buscar todas as bagagens do usuário com seus itens
    const baggages = await prisma.baggage.findMany({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Mapear para o formato do frontend
    const formattedBaggages = baggages.map((baggage) => ({
      id: baggage.id,
      type: baggageTypeReverseMap[baggage.type] || baggage.type,
      variant: baggageVariantReverseMap[baggage.variant] || baggage.variant,
      name: baggage.name,
      imageUrl: baggage.imageUrl,
      familyMemberId: baggage.familyMemberId,
      maxWeight: baggage.maxWeight,
      estimatedWeight: baggage.estimatedWeight,
      items: baggage.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        weight: item.weight,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      createdAt: baggage.createdAt.toISOString(),
      updatedAt: baggage.updatedAt.toISOString(),
    }))

    return NextResponse.json(formattedBaggages)
  } catch (error) {
    console.error("Erro ao buscar bagagens:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao buscar bagagens"
    return NextResponse.json(
      { error: errorMessage },
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
    const body = await request.json()
    const { type, variant, name, imageUrl, familyMemberId, maxWeight } = body

    if (!type || !variant || !name || !familyMemberId) {
      return NextResponse.json(
        { error: "Tipo, variante, nome e membro da família são obrigatórios" },
        { status: 400 }
      )
    }

    const prismaType = baggageTypeMap[type]
    if (!prismaType) {
      return NextResponse.json(
        { error: "Tipo de bagagem inválido" },
        { status: 400 }
      )
    }

    const prismaVariant = baggageVariantMap[variant]
    if (!prismaVariant) {
      return NextResponse.json(
        { error: "Variante de bagagem inválida" },
        { status: 400 }
      )
    }

    // Se for mala, maxWeight é obrigatório
    if (prismaType === "MALA" && !maxWeight) {
      return NextResponse.json(
        { error: "Peso máximo é obrigatório para malas" },
        { status: 400 }
      )
    }

    // Verificar se já existe uma bagagem deste tipo e variante para este membro
    const existing = await prisma.baggage.findUnique({
      where: {
        type_variant_familyMemberId: {
          type: prismaType,
          variant: prismaVariant,
          familyMemberId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma bagagem deste tipo e variante para este membro" },
        { status: 400 }
      )
    }

    // Criar bagagem usando $runCommandRaw para MongoDB
    try {
      const baggageData: Record<string, unknown> = {
        type: prismaType,
        variant: prismaVariant,
        name: name.trim(),
        imageUrl: imageUrl?.trim() || null,
        familyMemberId: { $oid: familyMemberId },
        userId: { $oid: userId },
        maxWeight: prismaType === "MALA" ? maxWeight : null,
        estimatedWeight: null,
        items: [],
        createdAt: { $date: new Date().toISOString() },
        updatedAt: { $date: new Date().toISOString() },
      }

      await prisma.$runCommandRaw({
        insert: "baggages",
        documents: [baggageData] as any,
      })
    } catch (insertError) {
      console.error("Erro ao inserir no MongoDB:", insertError)
      // Fallback: tentar com create normal do Prisma
      try {
        await prisma.baggage.create({
          data: {
            type: prismaType,
            variant: prismaVariant,
            name: name.trim(),
            imageUrl: imageUrl?.trim() || undefined,
            familyMemberId,
            userId,
            maxWeight: prismaType === "MALA" ? maxWeight : null,
          },
        })
      } catch (fallbackError) {
        console.error("Erro no fallback create:", fallbackError)
        throw fallbackError
      }
    }

    // Buscar a bagagem criada
    const createdBaggage = await prisma.baggage.findUnique({
      where: {
        type_variant_familyMemberId: {
          type: prismaType,
          variant: prismaVariant,
          familyMemberId,
        },
      },
      include: {
        items: true,
      },
    })

    if (!createdBaggage) {
      return NextResponse.json(
        { error: "Erro ao criar bagagem" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: createdBaggage.id,
      type: baggageTypeReverseMap[createdBaggage.type] || createdBaggage.type,
      variant: baggageVariantReverseMap[createdBaggage.variant] || createdBaggage.variant,
      name: createdBaggage.name,
      imageUrl: createdBaggage.imageUrl,
      familyMemberId: createdBaggage.familyMemberId,
      maxWeight: createdBaggage.maxWeight,
      estimatedWeight: createdBaggage.estimatedWeight,
      items: [],
      createdAt: createdBaggage.createdAt.toISOString(),
      updatedAt: createdBaggage.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Erro ao criar bagagem:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao criar bagagem"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
