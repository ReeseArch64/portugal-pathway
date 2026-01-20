'use server';
/**
 * @fileOverview An AI-powered chat assistant for immigration planning.
 *
 * - chatAssistantProvidesPersonalizedImmigrationGuidance - A function that handles the chat assistant process.
 * - ChatAssistantInput - The input type for the chatAssistantProvidesPersonalizedImmigrationGuidance function.
 * - ChatAssistantOutput - The return type for the chatAssistantProvidesPersonalizedImmigrationGuidance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatAssistantInputSchema = z.object({
  message: z.string().describe('The user message to the chat assistant.'),
});
export type ChatAssistantInput = z.infer<typeof ChatAssistantInputSchema>;

const ChatAssistantOutputSchema = z.object({
  response: z.string().describe('The response from the chat assistant.'),
});
export type ChatAssistantOutput = z.infer<typeof ChatAssistantOutputSchema>;

export async function chatAssistantProvidesPersonalizedImmigrationGuidance(
  input: ChatAssistantInput
): Promise<ChatAssistantOutput> {
  return chatAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatAssistantPrompt',
  input: {schema: ChatAssistantInputSchema},
  output: {schema: ChatAssistantOutputSchema},
  prompt: `Você é um assistente especializado em imigração para Portugal. Você é um especialista experiente que ajuda pessoas a entenderem o processo de imigração, obtenção de vistos, cidadania e todos os aspectos relacionados a se mudar para Portugal.

Sua função é:
- Fornecer informações precisas e atualizadas sobre imigração para Portugal
- Explicar processos, requisitos e documentação necessária
- Oferecer orientação personalizada baseada nas perguntas do usuário
- Ser claro, objetivo e útil em suas respostas
- Responder sempre em português brasileiro
- Se não souber algo específico, seja honesto e sugira onde o usuário pode encontrar a informação

Áreas de especialização:
- Tipos de visto (Golden Visa, D7, D2, trabalho, estudo, etc.)
- Processo de cidadania portuguesa
- Documentação necessária
- Requisitos financeiros
- Trabalho e mercado de trabalho
- Moradia e custo de vida
- Educação e saúde
- Integração cultural

Mensagem do usuário: {{{message}}}

Responda de forma clara, detalhada e útil, sempre em português brasileiro.
`,
});

const chatAssistantFlow = ai.defineFlow(
  {
    name: 'chatAssistantFlow',
    inputSchema: ChatAssistantInputSchema,
    outputSchema: ChatAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
