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
import ReactMarkdown from "react-markdown"

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
  {
    id: "9",
    title: "Analise meus Documentos Atuais",
    description: "Analise quais documentos estão faltando para o Visto D1",
    prompt: "ANALISE_DOCUMENTOS",
    icon: "📋",
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

  const SYSTEM_PROMPT = `Você é um assistente especializado em imigração para Portugal. Você é um especialista experiente que ajuda pessoas a entenderem o processo de imigração, obtenção de vistos, cidadania e todos os aspectos relacionados a se mudar para Portugal.

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

Responda de forma clara, detalhada e útil, sempre em português brasileiro.`

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
      // Construir o prompt completo no frontend
      let fullPrompt = SYSTEM_PROMPT

      // Adicionar histórico se existir
      if (messages.length > 0) {
        const historyContext = messages
          .map((m) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
          .join('\n')
        fullPrompt = `${SYSTEM_PROMPT}\n\nHistórico da conversa:\n${historyContext}\n\nNova mensagem do usuário: ${textToSend}`
      } else {
        fullPrompt = `${SYSTEM_PROMPT}\n\n${textToSend}`
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: fullPrompt,
        }),
      })

      // Verificar se a resposta é JSON antes de fazer parse
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Resposta não é JSON:", text.substring(0, 200))
        throw new Error("Resposta inválida do servidor")
      }

      const data = await response.json()

      if (!response.ok) {
        // Extrair mensagem de erro da resposta
        const errorMsg = data.error || data.details || "Erro ao processar sua mensagem"
        const errorDetails = data.details ? `\n\nDetalhes: ${data.details}` : ""
        console.error("Erro na API:", errorMsg, "Status:", response.status, errorDetails)
        throw new Error(errorMsg + errorDetails)
      }

      if (!data.response) {
        throw new Error("Resposta vazia do servidor")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido"
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Desculpe, ocorreu um erro ao processar sua mensagem: ${errorMsg}. Por favor, tente novamente.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleCommandClick = async (command: Command) => {
    // Se for a análise de documentos, buscar dados primeiro
    if (command.prompt === "ANALISE_DOCUMENTOS") {
      await handleAnalyzeDocuments()
    } else {
      handleSendMessage(command.prompt)
    }
  }

  const handleAnalyzeDocuments = async () => {
    setIsLoading(true)
    setShowCommands(false)

    try {
      // Buscar documentos e membros da família
      const [documentsResponse, familyMembersResponse] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/family-members"),
      ])

      if (!documentsResponse.ok || !familyMembersResponse.ok) {
        throw new Error("Erro ao carregar dados")
      }

      const documents = await documentsResponse.json()
      const familyMembers = await familyMembersResponse.json()

      // Calcular idade dos membros
      const membersWithAge = familyMembers.map((member: any) => {
        let age = null
        if (member.dateOfBirth) {
          const birthDate = new Date(member.dateOfBirth)
          const today = new Date()
          age = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
          }
        }
        return {
          ...member,
          age,
        }
      })

      // Preparar metadados dos documentos (sem os arquivos)
      const documentsMetadata = documents.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        description: doc.description || "",
        type: doc.type || "",
        status: doc.status,
        fileName: doc.fileName || "",
        fileType: doc.fileType || "",
        fileSize: doc.fileSize || 0,
        familyMemberName: doc.familyMemberName || "",
        taskTitle: doc.taskTitle || "",
        uploadedAt: doc.uploadedAt || "",
      }))

      // Criar prompt para análise
      const analysisPrompt = `Você é um especialista em imigração para Portugal, focado especificamente no Visto D1 (Visto de Residência para Atividade Profissional).

Analise os documentos atuais do usuário e os membros da família para determinar quais documentos estão faltando para o processo de solicitação do Visto D1.

INFORMAÇÕES DA FAMÍLIA:
${membersWithAge.map((member: any) => `
- Nome: ${member.fullName}
- Parentesco: ${member.relationship}
- Data de Nascimento: ${member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString("pt-PT") : "Não informada"}
- Idade: ${member.age !== null ? `${member.age} anos` : "Não calculada"}
- Username: ${member.username}
`).join("")}

DOCUMENTOS ATUAIS (apenas metadados):
${documentsMetadata.length > 0 ? documentsMetadata.map((doc: any) => `
- Nome: ${doc.name}
- Descrição: ${doc.description || "Sem descrição"}
- Tipo: ${doc.type || "Não especificado"}
- Status: ${doc.status}
- Arquivo: ${doc.fileName || "Sem arquivo"}
- Tipo de Arquivo: ${doc.fileType || "Não especificado"}
- Tamanho: ${doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : "Desconhecido"}
- Membro da Família: ${doc.familyMemberName || "Não vinculado"}
- Tarefa: ${doc.taskTitle || "Não vinculado"}
- Data de Upload: ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("pt-PT") : "Não informada"}
`).join("") : "Nenhum documento cadastrado"}

DOCUMENTOS NECESSÁRIOS PARA VISTO D1:
Para o Visto D1 (Residência para Atividade Profissional), são necessários os seguintes documentos:

PARA O TITULAR:
1. Passaporte válido (com validade mínima de 3 meses)
2. Formulário de solicitação de visto preenchido
3. Contrato de trabalho ou promessa de contrato de trabalho em Portugal
4. Certidão de antecedentes criminais (do país de origem e de todos os países onde residiu por mais de 1 ano nos últimos 5 anos)
5. Certidão de nascimento (autenticada e traduzida)
6. Comprovante de residência em Portugal
7. Seguro de saúde válido em Portugal
8. Comprovante de meios de subsistência
9. Comprovante de qualificações profissionais (diplomas, certificados)
10. Fotografias recentes

PARA CÔNJUGE E FILHOS:
1. Passaporte válido
2. Certidão de casamento (para cônjuge) ou certidão de nascimento (para filhos)
3. Certidão de antecedentes criminais (se maior de 16 anos)
4. Comprovante de dependência financeira
5. Seguro de saúde
6. Fotografias recentes

ANÁLISE SOLICITADA:
Com base nos documentos atuais listados acima (apenas metadados), analise e informe:

1. Quais documentos JÁ POSSUEM (identifique pelos nomes/tipos)
2. Quais documentos ESTÃO FALTANDO (organize por membro da família)
3. Prioridade de obtenção (quais são mais urgentes)
4. Observações importantes sobre o status dos documentos (se algum está "Pendente", "Rejeitado", etc.)
5. Próximos passos recomendados

Responda de forma clara, organizada e em português brasileiro, focando especificamente no Visto D1.`

      // Enviar para análise
      await handleSendMessage(analysisPrompt)
    } catch (error) {
      console.error("Erro ao analisar documentos:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Desculpe, ocorreu um erro ao carregar seus documentos e informações da família: ${error instanceof Error ? error.message : "Erro desconhecido"}. Por favor, tente novamente.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setIsLoading(false)
    }
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
                      {message.role === "assistant" ? (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none break-words">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-2 first:mt-0">{children}</h3>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="ml-2">{children}</li>,
                              code: ({ children, className }) => {
                                const isInline = !className?.includes('language-');
                                return isInline ? (
                                  <code className="bg-muted-foreground/20 px-1 py-0.5 rounded text-xs font-mono">
                                    {children}
                                  </code>
                                ) : (
                                  <code className="block bg-muted-foreground/20 p-2 rounded text-xs font-mono overflow-x-auto whitespace-pre">
                                    {children}
                                  </code>
                                );
                              },
                              pre: ({ children }) => (
                                <pre className="mb-2 bg-muted-foreground/10 p-2 rounded overflow-x-auto">
                                  {children}
                                </pre>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-primary pl-4 italic my-2">
                                  {children}
                                </blockquote>
                              ),
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              a: ({ href, children }) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline hover:text-primary/80"
                                >
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}
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
