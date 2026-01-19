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
  prompt: `You are an AI-powered chat assistant specializing in Portugal immigration planning.

You will assess the user's input and provide information or redirect them to relevant tools for specific topics, simplifying immigration planning and offering personalized guidance.

User message: {{{message}}}
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
