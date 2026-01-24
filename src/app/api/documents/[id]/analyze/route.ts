import { GoogleGenerativeAI } from "@google/generative-ai"
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
    const documentId = params.id

    // Buscar o documento diretamente do banco
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId },
    })

    if (!document) {
      console.error(`[Análise IA] Documento não encontrado: ${documentId} para usuário ${userId}`)
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      )
    }

    console.log(`[Análise IA] Documento encontrado: ${document.name} (ID: ${documentId}, Status atual: ${document.status})`)

    if (!document.fileUrl) {
      return NextResponse.json(
        { error: "Arquivo do documento não encontrado" },
        { status: 400 }
      )
    }

    // Verificar se é PDF
    const isPDF = document.fileType?.includes("pdf") || 
                  document.fileUrl.includes(".pdf") ||
                  document.fileName?.toLowerCase().endsWith(".pdf")

    if (!isPDF) {
      return NextResponse.json(
        { error: "A análise de IA só está disponível para arquivos PDF" },
        { status: 400 }
      )
    }

    // Verificar se a chave da API está configurada
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GEMINI_TOKEN
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chave da API do Google AI não configurada" },
        { status: 500 }
      )
    }

    // Inicializar o Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    // Usar gemini-2.5-flash (mesmo modelo usado no chat)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // Preparar o arquivo para análise
    let fileData: Buffer
    const mimeType = "application/pdf"
    const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB - limite do Gemini

    try {
      // Se o fileUrl é base64, converter
      if (document.fileUrl.startsWith("data:")) {
        const base64Data = document.fileUrl.split(",")[1]
        if (!base64Data) {
          return NextResponse.json(
            { error: "Dados do arquivo inválidos" },
            { status: 400 }
          )
        }
        fileData = Buffer.from(base64Data, "base64")
      } else {
        // Se é URL (Vercel Blob), fazer fetch
        const fileResponse = await fetch(document.fileUrl, {
          headers: {
            'Accept': 'application/pdf',
          },
        })
        
        if (!fileResponse.ok) {
          console.error(`[Análise IA] Erro ao baixar arquivo: ${fileResponse.status} ${fileResponse.statusText}`)
          return NextResponse.json(
            { error: `Erro ao baixar arquivo para análise: ${fileResponse.statusText}` },
            { status: 500 }
          )
        }

        const contentLength = fileResponse.headers.get("content-length")
        if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
            { status: 400 }
          )
        }

        const arrayBuffer = await fileResponse.arrayBuffer()
        fileData = Buffer.from(arrayBuffer)

        // Verificar tamanho após download
        if (fileData.length > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
            { status: 400 }
          )
        }

        if (fileData.length === 0) {
          return NextResponse.json(
            { error: "Arquivo vazio ou inválido" },
            { status: 400 }
          )
        }
      }
    } catch (fetchError) {
      console.error("[Análise IA] Erro ao preparar arquivo:", fetchError)
      const errorMessage = fetchError instanceof Error ? fetchError.message : "Erro desconhecido"
      return NextResponse.json(
        { error: `Erro ao acessar arquivo para análise: ${errorMessage}` },
        { status: 500 }
      )
    }

    // Criar o prompt para análise
    const prompt = `Você é um especialista em imigração para Portugal. Analise este documento PDF e determine se ele é um documento válido e necessário para o processo de imigração para Portugal.

Documentos válidos incluem:
- Passaportes
- Certidões de nascimento, casamento, óbito
- Comprovantes de residência
- Comprovantes de renda
- Extratos bancários
- Contratos de trabalho
- Diplomas e certificados de escolaridade
- Certidões de antecedentes criminais
- Seguros de saúde
- Documentos de identidade
- Vistos e autorizações de residência
- Outros documentos oficiais relevantes para imigração

Analise o documento e responda APENAS com uma das seguintes opções:
- "APROVADO" - se o documento é válido e necessário para imigração
- "REJEITADO" - se o documento não é válido, não é necessário, ou não está relacionado à imigração

Responda apenas com "APROVADO" ou "REJEITADO", sem explicações adicionais.`

    try {
      // Converter para base64
      const base64Data = fileData.toString("base64")
      
      console.log(`[Análise IA] Enviando arquivo para análise. Tamanho: ${fileData.length} bytes (${(fileData.length / 1024 / 1024).toFixed(2)}MB)`)

      // Enviar para análise com Gemini
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        prompt,
      ])

      const response = result.response
      const text = response.text().trim().toUpperCase()
      
      console.log(`[Análise IA] Resposta da IA recebida: "${text}"`)

      // Determinar o status baseado na resposta
      let status: "Aprovado" | "Rejeitado" = "Rejeitado"
      if (text.includes("APROVADO")) {
        status = "Aprovado"
      }

      console.log(`[Análise IA] Documento ${documentId}: Status determinado como "${status}" (resposta da IA: "${text}")`)

      // Atualizar o status do documento no banco
      let updateSuccess = false
      try {
        // Tentar primeiro com Prisma (mais confiável)
        const updated = await prisma.document.update({
          where: { id: documentId },
          data: { status },
        })
        console.log(`[Análise IA] Status atualizado com sucesso via Prisma:`, updated)
        updateSuccess = true
      } catch (prismaError) {
        console.error("[Análise IA] Erro ao atualizar com Prisma:", prismaError)
        // Fallback: tentar com $runCommandRaw para MongoDB
        try {
          await prisma.$runCommandRaw({
            update: "documents",
            updates: [
              {
                q: { _id: { $oid: documentId } },
                u: {
                  $set: {
                    status: status,
                    updatedAt: { $date: new Date().toISOString() },
                  },
                },
              },
            ] as any,
          })
          console.log(`[Análise IA] Status atualizado com sucesso via MongoDB raw command`)
          updateSuccess = true
        } catch (mongoError) {
          console.error("[Análise IA] Erro ao atualizar status no MongoDB:", mongoError)
          // Se ambos falharem, retornar erro mas ainda retornar o status
          return NextResponse.json(
            { 
              status,
              analysis: text,
              warning: "Status analisado, mas houve erro ao atualizar no banco de dados"
            },
            { status: 200 }
          )
        }
      }

      // Verificar se a atualização foi bem-sucedida
      let finalStatus = status
      if (updateSuccess) {
        // Buscar o documento atualizado para confirmar
        const updatedDocument = await prisma.document.findFirst({
          where: { id: documentId },
        })
        console.log(`[Análise IA] Documento após atualização:`, updatedDocument)
        
        if (updatedDocument) {
          finalStatus = updatedDocument.status as "Aprovado" | "Rejeitado"
          if (updatedDocument.status !== status) {
            console.warn(`[Análise IA] AVISO: Status não corresponde! Esperado: "${status}", Atual: "${updatedDocument.status}"`)
            // Usar o status atual do banco
            finalStatus = updatedDocument.status as "Aprovado" | "Rejeitado"
          }
        }
      }

      return NextResponse.json({
        success: true,
        status: finalStatus,
        analysis: text,
      })
    } catch (aiError) {
      console.error("[Análise IA] Erro na análise da IA:", aiError)
      const errorMessage = aiError instanceof Error ? aiError.message : "Erro desconhecido"
      
      // Verificar se é erro de tamanho de arquivo
      if (errorMessage.includes("file size") || errorMessage.includes("too large") || errorMessage.includes("illegal")) {
        return NextResponse.json(
          { 
            error: "Arquivo muito grande para análise. O tamanho máximo é 20MB.",
            details: errorMessage
          },
          { status: 400 }
        )
      }
      
      // Em caso de erro na IA, manter como Pendente
      return NextResponse.json(
        { 
          error: "Erro ao analisar documento com IA",
          details: errorMessage,
          status: "Pendente" 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[Análise IA] Erro geral ao analisar documento:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json(
      { 
        error: "Erro ao analisar documento",
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
