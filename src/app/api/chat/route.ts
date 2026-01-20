import { GoogleGenerativeAI } from "@google/generative-ai";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const MODEL_NAME = "gemini-2.5-flash";

function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return jsonError("Não autenticado", 401);
    }

    const apiKey =
      process.env.GOOGLE_GEMINI_TOKEN ??
      process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      return jsonError(
        "Serviço de IA não configurado. Entre em contato com o administrador."
      );
    }

    let prompt: unknown;

    try {
      const body = await request.json();
      prompt = body?.prompt;
    } catch {
      return jsonError("Formato de requisição inválido", 400);
    }

    if (typeof prompt !== "string" || !prompt.trim()) {
      return jsonError("Prompt é obrigatório", 400);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    let result;
    let text: string | null = null;
    let lastError: Error | null = null;
    const maxRetries = 3;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await model.generateContent(prompt);
        text = result.response.text();
        lastError = null;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = lastError.message;

        if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('Service Unavailable')) {
          if (attempt < maxRetries) {
            console.log(`Tentativa ${attempt} falhou (503). Tentando novamente em ${retryDelay * attempt}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            continue;
          } else {
            throw new Error('O serviço de IA está temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.');
          }
        } else {
          throw lastError;
        }
      }
    }

    if (lastError || !text) {
      throw lastError || new Error('Falha ao obter resposta do serviço de IA');
    }

    if (!text.trim()) {
      return jsonError(
        "Resposta vazia do serviço de IA. Tente novamente."
      );
    }

    return NextResponse.json({ response: text });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    console.error('Error in chat API:', errorMessage);

    if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('401') || errorMessage.includes('403')) {
      return jsonError(
        'Erro de autenticação com o serviço de IA. Verifique a configuração do token.',
        500
      );
    }

    if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('Service Unavailable')) {
      return jsonError(
        'O serviço de IA está temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.',
        503
      );
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
      return jsonError(
        'Erro de conexão com o serviço de IA. Tente novamente em alguns instantes.',
        500
      );
    }

    return jsonError(
      'Erro ao processar sua mensagem. Tente novamente.'
    );
  }
}
