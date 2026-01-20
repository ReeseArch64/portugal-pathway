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
    const documentId = params.id

    // Verificar se o documento pertence ao usuário
    const existingDocument = await prisma.document.findFirst({
      where: { id: documentId, userId },
    })

    if (!existingDocument) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
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
      type,
      status,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      familyMemberId,
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

    if (type !== undefined) {
      updateData.type = type
    }

    if (status !== undefined) {
      if (typeof status !== "string") {
        return NextResponse.json(
          { error: "Status inválido" },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    if (fileUrl !== undefined) {
      updateData.fileUrl = fileUrl || null
    }

    if (fileName !== undefined) {
      updateData.fileName = fileName || null
    }

    if (fileSize !== undefined) {
      updateData.fileSize = fileSize ? parseInt(fileSize.toString()) : null
    }

    if (fileType !== undefined) {
      updateData.fileType = fileType || null
    }

    if (familyMemberId !== undefined) {
      updateData.familyMemberId = familyMemberId && familyMemberId.trim() ? { $oid: familyMemberId } : null
    }

    if (taskId !== undefined) {
      updateData.taskId = taskId && taskId.trim() ? { $oid: taskId } : null
    }

    // Atualizar usando $runCommandRaw para MongoDB
    try {
      await prisma.$runCommandRaw({
        update: "documents",
        updates: [
          {
            q: { _id: { $oid: documentId } },
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
          type?: string
          status?: string
          fileUrl?: string | null
          fileName?: string | null
          fileSize?: number | null
          fileType?: string | null
          familyMemberId?: string | null
          taskId?: string | null
        } = {}

        if (name !== undefined) prismaUpdateData.name = name.trim()
        if (description !== undefined) prismaUpdateData.description = description?.trim() || null
        if (type !== undefined) prismaUpdateData.type = type
        if (status !== undefined) prismaUpdateData.status = status
        if (fileUrl !== undefined) prismaUpdateData.fileUrl = fileUrl || null
        if (fileName !== undefined) prismaUpdateData.fileName = fileName || null
        if (fileSize !== undefined) prismaUpdateData.fileSize = fileSize ? parseInt(fileSize.toString()) : null
        if (fileType !== undefined) prismaUpdateData.fileType = fileType || null
        if (familyMemberId !== undefined) prismaUpdateData.familyMemberId = familyMemberId && familyMemberId.trim() ? familyMemberId : null
        if (taskId !== undefined) prismaUpdateData.taskId = taskId && taskId.trim() ? taskId : null

        await prisma.document.update({
          where: { id: documentId },
          data: prismaUpdateData,
        })
      } catch (fallbackError) {
        console.error("Erro no fallback update:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Documento atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar documento:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao atualizar documento"
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
    const documentId = params.id

    // Verificar se o documento pertence ao usuário
    const existingDocument = await prisma.document.findFirst({
      where: { id: documentId, userId },
    })

    if (!existingDocument) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      )
    }

    // Deletar usando $runCommandRaw para MongoDB
    try {
      await prisma.$runCommandRaw({
        delete: "documents",
        deletes: [
          {
            q: { _id: { $oid: documentId } },
            limit: 1,
          },
        ] as any,
      })
    } catch (deleteError) {
      console.error("Erro ao deletar no MongoDB:", deleteError)
      // Fallback: tentar com delete normal do Prisma
      try {
        await prisma.document.delete({
          where: { id: documentId },
        })
      } catch (fallbackError) {
        console.error("Erro no fallback delete:", fallbackError)
        throw fallbackError
      }
    }

    return NextResponse.json({
      success: true,
      message: "Documento excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao deletar documento:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao deletar documento"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
