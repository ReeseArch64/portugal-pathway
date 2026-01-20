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

    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        resetPassword: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Buscar imagem usando comando raw do MongoDB
    let image: string | null = null
    try {
      const result = (await prisma.$runCommandRaw({
        find: "users",
        filter: { _id: { $oid: user.id } },
        projection: { image: 1 },
        limit: 1,
      })) as {
        cursor?: {
          firstBatch?: Array<{
            image?: string | null
          }>
        }
      }

      image = result.cursor?.firstBatch?.[0]?.image ?? null
    } catch {
      image = null
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      image,
    })
  } catch (error) {
    console.error("Erro ao buscar perfil:", error)
    return NextResponse.json(
      { error: "Erro ao buscar perfil" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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

    const { fullName, image } = body

    const updateData: { fullName?: string; image?: string | null } = {}

    if (fullName !== undefined) {
      if (typeof fullName !== "string" || fullName.trim().length === 0) {
        return NextResponse.json(
          { error: "Nome completo é obrigatório" },
          { status: 400 }
        )
      }
      updateData.fullName = fullName.trim()
    }

    if (image !== undefined) {
      updateData.image = image === "" ? null : image
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo para atualizar" },
        { status: 400 }
      )
    }

    const now = new Date()

    // Atualizar usando $runCommandRaw para MongoDB
    try {
      const updateFields: Record<string, unknown> = {
        updatedAt: { $date: now.toISOString() },
      }

      if (updateData.fullName) {
        updateFields.fullName = updateData.fullName
      }

      if (updateData.image !== undefined) {
        updateFields.image = updateData.image
      }

      await prisma.$runCommandRaw({
        update: "users",
        updates: [
          {
            q: { _id: { $oid: userId } },
            u: {
              $set: updateFields,
            },
          },
        ] as any,
      })
    } catch (updateError) {
      console.error("Erro ao atualizar no MongoDB:", updateError)
      // Fallback: tentar com update normal do Prisma
      try {
        await prisma.user.update({
          where: { id: userId },
          data: updateData,
        })
      } catch (fallbackError) {
        console.error("Erro no fallback update:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao atualizar perfil"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
