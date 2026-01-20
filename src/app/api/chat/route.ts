import { chatAssistantProvidesPersonalizedImmigrationGuidance } from '@/ai/flows/chat-assistant-immigration-guidance';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Construir contexto do histórico de conversa
    let contextMessage = message;
    if (history && history.length > 0) {
      const historyContext = history
        .map((msg: { role: string; content: string }) =>
          `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`
        )
        .join('\n');
      contextMessage = `Histórico da conversa:\n${historyContext}\n\nNova mensagem do usuário: ${message}`;
    }

    const result = await chatAssistantProvidesPersonalizedImmigrationGuidance({
      message: contextMessage,
    });

    return NextResponse.json({
      response: result.response,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
