import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

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
    const taskId = resolvedParams.id

    // Verificar se a tarefa pertence ao usuário
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, userId },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: "Tarefa não encontrada" },
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

    const { title, description, status, priority, dueDate, familyMemberId } = body

    const updateData: Record<string, unknown> = {
      updatedAt: { $date: new Date().toISOString() },
    }

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json(
          { error: "Título inválido" },
          { status: 400 }
        )
      }
      updateData.title = title.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (status !== undefined) {
      updateData.status = status
      // Se mudou para Concluída, definir completedAt
      if (status === "Concluída" && existingTask.status !== "Concluída") {
        updateData.completedAt = { $date: new Date().toISOString() }
      } else if (status !== "Concluída") {
        updateData.completedAt = null
      }
    }

    if (priority !== undefined) {
      updateData.priority = priority
    }

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? { $date: new Date(dueDate).toISOString() } : null
    }

    if (familyMemberId !== undefined) {
      updateData.assignedTo = familyMemberId ? { $oid: familyMemberId } : null
    }

    // Atualizar usando $runCommandRaw para MongoDB
    try {
      await prisma.$runCommandRaw({
        update: "tasks",
        updates: [
          {
            q: { _id: { $oid: taskId } },
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
          title?: string
          description?: string | null
          status?: string
          priority?: string
          dueDate?: Date | null
          assignedTo?: string | null
          completedAt?: Date | null
        } = {}

        if (title !== undefined) prismaUpdateData.title = title.trim()
        if (description !== undefined) prismaUpdateData.description = description?.trim() || null
        if (status !== undefined) {
          prismaUpdateData.status = status
          if (status === "Concluída" && existingTask.status !== "Concluída") {
            prismaUpdateData.completedAt = new Date()
          } else if (status !== "Concluída") {
            prismaUpdateData.completedAt = null
          }
        }
        if (priority !== undefined) prismaUpdateData.priority = priority
        if (dueDate !== undefined) prismaUpdateData.dueDate = dueDate ? new Date(dueDate) : null
        if (familyMemberId !== undefined) prismaUpdateData.assignedTo = familyMemberId || null

        await prisma.task.update({
          where: { id: taskId },
          data: prismaUpdateData,
        })
      } catch (fallbackError) {
        console.error("Erro no fallback update:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tarefa atualizada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao atualizar tarefa"
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
    const taskId = resolvedParams.id

    // Verificar se a tarefa pertence ao usuário
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, userId },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: "Tarefa não encontrada" },
        { status: 404 }
      )
    }

    // Deletar usando $runCommandRaw para MongoDB
    try {
      await prisma.$runCommandRaw({
        delete: "tasks",
        deletes: [
          {
            q: { _id: { $oid: taskId } },
            limit: 1,
          },
        ],
      })
    } catch (deleteError) {
      console.error("Erro ao deletar no MongoDB:", deleteError)
      // Fallback: tentar com delete normal do Prisma
      try {
        await prisma.task.delete({
          where: { id: taskId },
        })
      } catch (fallbackError) {
        console.error("Erro no fallback delete:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tarefa excluída com sucesso",
    })
  } catch (error) {
    console.error("Erro ao deletar tarefa:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao deletar tarefa"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
