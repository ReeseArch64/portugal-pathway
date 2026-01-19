'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { chatAssistantProvidesPersonalizedImmigrationGuidance } from '@/ai/flows/chat-assistant-immigration-guidance';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const formSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

type Message = {
  role: 'user' | 'assistant' | 'loading';
  content: string;
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou seu assistente de imigração para Portugal. Como posso ajudar hoje?' },
  ]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setMessages((prev) => [...prev, { role: 'user', content: values.message }]);
    setMessages((prev) => [...prev, { role: 'loading', content: '' }]);
    form.reset();

    try {
      const { response } = await chatAssistantProvidesPersonalizedImmigrationGuidance({
        message: values.message,
      });
      setMessages((prev) => {
        const newMessages = prev.filter(msg => msg.role !== 'loading');
        return [...newMessages, { role: 'assistant', content: response }];
      });
    } catch (error) {
      setMessages((prev) => {
        const newMessages = prev.filter(msg => msg.role !== 'loading');
        return [...newMessages, { role: 'assistant', content: "Desculpe, ocorreu um erro. Tente novamente." }];
      });
    }
  };
  
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
        <div className="mb-4">
            <h1 className="text-lg font-semibold md:text-2xl font-headline">Assistente de Imigração</h1>
            <p className="text-muted-foreground">Tire suas dúvidas sobre o processo de imigração.</p>
        </div>
        <Card className="flex-1 flex flex-col">
            <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                    {messages.map((message, index) => (
                        <div
                        key={index}
                        className={cn(
                            'flex items-start gap-4',
                            message.role === 'user' && 'justify-end'
                        )}
                        >
                        {message.role !== 'user' && (
                            <Avatar>
                            <AvatarFallback>
                                <Bot />
                            </AvatarFallback>
                            </Avatar>
                        )}
                        {message.role === 'loading' ? (
                            <div className="bg-muted rounded-lg p-3 flex items-center">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div
                                className={cn(
                                'rounded-lg p-3 max-w-md',
                                message.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                )}
                            >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                        )}
                        
                        {message.role === 'user' && (
                            <Avatar>
                                <AvatarFallback>
                                    <User />
                                </AvatarFallback>
                            </Avatar>
                        )}
                        </div>
                    ))}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
                    <Textarea
                        {...form.register('message')}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 resize-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                form.handleSubmit(onSubmit)();
                            }
                        }}
                    />
                    <Button type="submit" size="icon" disabled={form.formState.isSubmitting}>
                        <Send className="h-4 w-4" />
                    </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
