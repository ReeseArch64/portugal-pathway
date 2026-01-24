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

    // Buscar documentos do usuário
    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    // Buscar membros da família e tarefas para popular os nomes
    const familyMembers = await prisma.familyMember.findMany({
      where: { userId },
      select: { id: true, fullName: true },
    })

    const tasks = await prisma.task.findMany({
      where: { userId },
      select: { id: true, title: true },
    })

    // Formatar para o frontend
    const formattedDocuments = documents.map((doc) => {
      const familyMember = familyMembers.find((m) => m.id === doc.familyMemberId)
      const task = tasks.find((t) => t.id === doc.taskId)

      return {
        id: doc.id,
        name: doc.name,
        description: doc.description,
        fileName: doc.fileName || doc.fileUrl?.split("/").pop() || "arquivo",
        fileSize: doc.fileSize || 0,
        fileType: doc.fileType || "application/octet-stream",
        fileUrl: doc.fileUrl,
        uploadedAt: doc.uploadedAt,
        familyMemberId: doc.familyMemberId,
        familyMemberName: familyMember?.fullName,
        taskId: doc.taskId,
        taskTitle: task?.title,
        status: doc.status,
      }
    })

    return NextResponse.json(formattedDocuments)
  } catch (error) {
    console.error("Erro ao buscar documentos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar documentos" },
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
      type,
      status,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      familyMemberId,
      taskId,
    } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      )
    }

    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { error: "Status é obrigatório" },
        { status: 400 }
      )
    }

    if (!fileUrl && !fileName) {
      return NextResponse.json(
        { error: "Arquivo é obrigatório (fileUrl ou fileName)" },
        { status: 400 }
      )
    }

    const now = new Date()

    let createdDocument

    // Criar documento usando $runCommandRaw para MongoDB
    try {
      const documentData: Record<string, unknown> = {
        name: name.trim(),
        description: description?.trim() || null,
        type: type || "Documento",
        status: status,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize ? parseInt(fileSize.toString()) : null,
        fileType: fileType || null,
        familyMemberId: familyMemberId && familyMemberId.trim() ? { $oid: familyMemberId } : null,
        taskId: taskId && taskId.trim() ? { $oid: taskId } : null,
        userId: { $oid: userId },
        uploadedAt: { $date: now.toISOString() },
        createdAt: { $date: now.toISOString() },
        updatedAt: { $date: now.toISOString() },
      }

      await prisma.$runCommandRaw({
        insert: "documents",
        documents: [documentData] as any,
      })

      // Buscar o documento recém-criado para obter o ID
      createdDocument = await prisma.document.findFirst({
        where: {
          userId,
          name: name.trim(),
          createdAt: {
            gte: new Date(now.getTime() - 5000), // Buscar documentos criados nos últimos 5 segundos
          },
        },
        orderBy: { createdAt: "desc" },
      })
    } catch (insertError) {
      console.error("Erro ao inserir no MongoDB:", insertError)
      // Fallback: tentar com create normal do Prisma
      try {
        createdDocument = await prisma.document.create({
          data: {
            name: name.trim(),
            description: description?.trim() || undefined,
            type: type || "Documento",
            status: status,
            fileUrl: fileUrl || undefined,
            fileName: fileName || undefined,
            fileSize: fileSize ? parseInt(fileSize.toString()) : undefined,
            fileType: fileType || undefined,
            familyMemberId: familyMemberId && familyMemberId.trim() ? familyMemberId : undefined,
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
      message: "Documento criado com sucesso",
      id: createdDocument?.id,
    })
  } catch (error) {
    console.error("Erro ao criar documento:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao criar documento"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
