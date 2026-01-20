"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MainLayout } from "../components/main-layout"
import {
  Bot,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface Command {
  id: string
  title: string
  description: string
  prompt: string
  icon: string
}

const COMMANDS: Command[] = [
  {
    id: "1",
    title: "Tipos de Visto",
    description: "Conheça os diferentes tipos de visto para Portugal",
    prompt: "Quais são os principais tipos de visto para imigração em Portugal? Explique cada um deles e seus requisitos.",
    icon: "📋",
  },
  {
    id: "2",
    title: "Documentos Necessários",
    description: "Lista completa de documentos para imigração",
    prompt: "Quais documentos são necessários para o processo de imigração para Portugal? Forneça uma lista completa e detalhada.",
    icon: "📄",
  },
  {
    id: "3",
    title: "Processo de Cidadania",
    description: "Como obter a cidadania portuguesa",
    prompt: "Explique o processo completo para obter a cidadania portuguesa, incluindo requisitos, tempo de espera e passos necessários.",
    icon: "🇵🇹",
  },
  {
    id: "4",
    title: "Requisitos Financeiros",
    description: "Quanto dinheiro preciso para imigrar?",
    prompt: "Quais são os requisitos financeiros para imigração em Portugal? Inclua valores mínimos, comprovação de renda e custos de vida.",
    icon: "💰",
  },
  {
    id: "5",
    title: "Trabalho em Portugal",
    description: "Como encontrar trabalho em Portugal",
    prompt: "Como posso encontrar trabalho em Portugal? Explique o mercado de trabalho, requisitos e processos para trabalhar legalmente.",
    icon: "💼",
  },
  {
    id: "6",
    title: "Moradia",
    description: "Como encontrar moradia em Portugal",
    prompt: "Como encontrar moradia em Portugal? Inclua informações sobre aluguel, compra, áreas recomendadas e custos.",
    icon: "🏠",
  },
  {
    id: "7",
    title: "Educação",
    description: "Sistema educacional português",
    prompt: "Explique o sistema educacional português, incluindo escolas para crianças, universidades e requisitos de matrícula.",
    icon: "🎓",
  },
  {
    id: "8",
    title: "Saúde",
    description: "Sistema de saúde em Portugal",
    prompt: "Como funciona o sistema de saúde em Portugal? Explique o SNS, seguros privados e como acessar serviços médicos.",
    icon: "🏥",
  },
]

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showCommands, setShowCommands] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when new message arrives
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setShowCommands(false)
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleCommandClick = (command: Command) => {
    handleSendMessage(command.prompt)
  }

  const handleClearChat = () => {
    setMessages([])
    setShowCommands(true)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <MainLayout
      headerTitle="Assistente de IA - Especialista em Imigração"
      headerDescription="Obtenha orientação personalizada sobre imigração para Portugal"
    >
      <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px]">
        {/* Chat Container */}
        <div className="flex-1 flex flex-col border rounded-lg bg-background overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Assistente de Imigração</h3>
                <p className="text-xs text-muted-foreground">
                  Especialista em imigração para Portugal
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                className="text-muted-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Messages Area */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.length === 0 && showCommands && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="text-center space-y-2 py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      Como posso ajudá-lo hoje?
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Escolha um comando abaixo ou faça sua própria pergunta
                      sobre imigração para Portugal
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {COMMANDS.map((command) => (
                      <motion.button
                        key={command.id}
                        onClick={() => handleCommandClick(command)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="text-left p-4 rounded-lg border bg-card hover:bg-accent transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{command.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                              {command.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {command.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p
                        className={`text-xs mt-2 ${
                          message.role === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Pensando...
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4 bg-muted/40">
            <div className="max-w-4xl mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex gap-2"
              >
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua pergunta sobre imigração para Portugal..."
                    className="pr-10"
                    disabled={isLoading}
                  />
                  {input && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setInput("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                O assistente pode cometer erros. Verifique informações
                importantes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
