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

    // Buscar tarefas do usuário
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    // Buscar informações dos membros da família atribuídos
    const tasksWithMembers = await Promise.all(
      tasks.map(async (task) => {
        let assignedToName: string | undefined = undefined

        if (task.assignedTo) {
          try {
            const member = await prisma.familyMember.findUnique({
              where: { id: task.assignedTo },
              select: { fullName: true },
            })
            assignedToName = member?.fullName
          } catch {
            // Se não encontrar membro, continua sem nome
          }
        }

        return {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          familyMemberId: task.assignedTo,
          familyMemberName: assignedToName,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
        }
      })
    )

    return NextResponse.json(tasksWithMembers)
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar tarefas" },
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

    const { title, description, status, priority, dueDate, familyMemberId } = body

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      )
    }

    const now = new Date()
    const dueDateObj = dueDate ? new Date(dueDate) : null
    const completedAt = status === "Concluída" ? now : null

    // Criar tarefa usando $runCommandRaw para MongoDB
    try {
      const taskData: Record<string, unknown> = {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || "Pendente",
        priority: priority || "Média",
        userId: { $oid: userId },
        assignedTo: familyMemberId ? { $oid: familyMemberId } : null,
        dueDate: dueDateObj ? { $date: dueDateObj.toISOString() } : null,
        completedAt: completedAt ? { $date: completedAt.toISOString() } : null,
        createdAt: { $date: now.toISOString() },
        updatedAt: { $date: now.toISOString() },
      }

      await prisma.$runCommandRaw({
        insert: "tasks",
        documents: [taskData],
      })
    } catch (insertError) {
      console.error("Erro ao inserir no MongoDB:", insertError)
      // Fallback: tentar com create normal do Prisma
      try {
        await prisma.task.create({
          data: {
            title: title.trim(),
            description: description?.trim() || undefined,
            status: status || "Pendente",
            priority: priority || "Média",
            userId,
            assignedTo: familyMemberId || undefined,
            dueDate: dueDateObj || undefined,
            completedAt: completedAt || undefined,
          },
        })
      } catch (fallbackError) {
        console.error("Erro no fallback create:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tarefa criada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao criar tarefa:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao criar tarefa"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
