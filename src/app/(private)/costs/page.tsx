"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useCurrency } from "@/contexts/currency-context"
import { useToast } from "@/hooks/use-toast"
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Loader2,
  MoreVertical,
  Plus,
  Receipt,
  Trash2,
  Wallet,
  X
} from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { MainLayout } from "../components/main-layout"

type Category =
  | "Transporte"
  | "Passagem"
  | "Comida"
  | "Lazer"
  | "Reserva"
  | "Vestimenta"
  | "Documentação"
  | "Acessório"

type Currency = "BRL" | "USD" | "EUR"

type PaymentStatus = "Pago" | "Não pago" | "Pago Parcialmente"

interface Payment {
  id: string
  amount: number
  currency: Currency
  date: Date
  receipt?: string
  description?: string
}

interface CostItem {
  id: string
  name: string
  description?: string
  imageUrl?: string
  category: Category
  currency: Currency
  quantity: number
  unitValue: number
  tax?: number
  fee?: number
  deliveryFee?: number
  documentIds?: string[]
  taskId?: string | null
  payments: Payment[]
  createdAt: Date
}

const CATEGORIES: Category[] = [
  "Transporte",
  "Passagem",
  "Comida",
  "Lazer",
  "Reserva",
  "Vestimenta",
  "Documentação",
  "Acessório",
]

const CURRENCIES: Currency[] = ["BRL", "USD", "EUR"]

const STATIC_COSTS: CostItem[] = [
  {
    id: "1",
    name: "Passagem Aérea - Lisboa",
    description: "Passagem aérea para toda a família",
    imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400",
    category: "Passagem",
    currency: "EUR",
    quantity: 3,
    unitValue: 800,
    tax: 50,
    fee: 25,
      payments: [
        {
          id: "p1",
          amount: 1200,
          currency: "EUR",
          date: new Date(2024, 0, 15),
          receipt: "https://example.com/receipt1.pdf",
        },
    ],
    createdAt: new Date(2024, 0, 10),
  },
  {
    id: "2",
    name: "Malas de Viagem",
    description: "Malas grandes para mudança",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
    category: "Acessório",
    currency: "BRL",
    quantity: 4,
    unitValue: 250,
    deliveryFee: 30,
    payments: [
      {
        id: "p2",
        amount: 500,
        currency: "BRL",
        date: new Date(2024, 1, 5),
      },
      {
        id: "p3",
        amount: 530,
        currency: "BRL",
        date: new Date(2024, 1, 20),
      },
    ],
    createdAt: new Date(2024, 0, 20),
  },
  {
    id: "3",
    name: "Renovação de Passaporte",
    description: "Taxa de renovação de passaporte",
    category: "Documentação",
    currency: "BRL",
    quantity: 3,
    unitValue: 257,
    payments: [],
    createdAt: new Date(2024, 1, 1),
  },
]

const currencySymbols: Record<Currency, string> = {
  BRL: "R$",
  USD: "$",
  EUR: "€",
}

interface ExchangeRates {
  USD?: number
  BRL?: number
}

function formatCurrency(value: number, currency: Currency): string {
  // Formatar número com separador de milhar e decimal
  const formattedValue = value.toFixed(2)
    .split('.')
    .map((part, index) => {
      if (index === 0) {
        // Parte inteira: adicionar pontos como separadores de milhar
        return part.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      }
      return part
    })
    .join(',')
  
  return `${currencySymbols[currency]} ${formattedValue}`
}

function convertCurrency(
  value: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRates: ExchangeRates
): number {
  // Se as moedas são iguais, não precisa converter
  if (fromCurrency === toCurrency) {
    return value
  }

  // Se não há taxas de câmbio disponíveis, retorna o valor original
  if (!exchangeRates.USD || !exchangeRates.BRL) {
    return value
  }

  // Converter para EUR primeiro (moeda base)
  let valueInEUR = value
  if (fromCurrency === "USD") {
    valueInEUR = value / exchangeRates.USD
  } else if (fromCurrency === "BRL") {
    valueInEUR = value / exchangeRates.BRL
  }
  // Se já está em EUR, mantém o valor

  // Converter de EUR para a moeda de destino
  if (toCurrency === "USD") {
    return valueInEUR * exchangeRates.USD
  } else if (toCurrency === "BRL") {
    return valueInEUR * exchangeRates.BRL
  }
  // Se destino é EUR, retorna o valor já convertido
  return valueInEUR
}

function calculateTotal(
  item: CostItem,
  targetCurrency: Currency,
  exchangeRates: ExchangeRates
): number {
  const subtotal = item.unitValue * item.quantity
  // Garantir que os valores extras sejam números (tratar null, undefined, etc)
  const tax = typeof item.tax === 'number' ? item.tax : 0
  const fee = typeof item.fee === 'number' ? item.fee : 0
  const deliveryFee = typeof item.deliveryFee === 'number' ? item.deliveryFee : 0
  const extras = tax + fee + deliveryFee
  const total = subtotal + extras
  return convertCurrency(total, item.currency, targetCurrency, exchangeRates)
}

function calculatePaid(
  item: CostItem,
  targetCurrency: Currency,
  exchangeRates: ExchangeRates
): number {
  // Somar pagamentos na moeda original de cada pagamento e converter
  const totalPaid = item.payments.reduce((sum, payment) => {
    // Converter cada pagamento da sua moeda original para a moeda alvo
    const convertedAmount = convertCurrency(
      payment.amount,
      payment.currency,
      targetCurrency,
      exchangeRates
    )
    return sum + convertedAmount
  }, 0)
  return totalPaid
}

function getPaymentStatus(
  item: CostItem,
  targetCurrency: Currency,
  exchangeRates: ExchangeRates
): PaymentStatus {
  const total = calculateTotal(item, targetCurrency, exchangeRates)
  const paid = calculatePaid(item, targetCurrency, exchangeRates)

  // Usar tolerância para evitar problemas de precisão de ponto flutuante
  const tolerance = 0.01 // Tolerância de 1 centavo
  const difference = Math.abs(paid - total)

  if (paid === 0 || (paid < tolerance && total > 0)) return "Não pago"
  if (paid >= total || difference < tolerance) return "Pago"
  return "Pago Parcialmente"
}

export default function CostsPage() {
  const { toast } = useToast()
  const { selectedCurrency } = useCurrency()
  const [items, setItems] = useState<CostItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [viewingItem, setViewingItem] = useState<CostItem | null>(null)
  const [editingItem, setEditingItem] = useState<CostItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<CostItem | null>(null)
  const [addingItem, setAddingItem] = useState(false)
  const [addingPayment, setAddingPayment] = useState<CostItem | null>(null)
  const [editingPayment, setEditingPayment] = useState<{ payment: Payment; costItem: CostItem } | null>(null)
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({})
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/EUR"
      )
      if (response.ok) {
        const data = await response.json()
        if (data?.rates) {
          setExchangeRates({
            USD: data.rates.USD,
            BRL: data.rates.BRL,
          })
        }
      }
    } catch (error) {
      console.error("Erro ao buscar câmbio:", error)
    }
  }, [])

  useEffect(() => {
    fetchExchangeRates()
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchExchangeRates, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchExchangeRates])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    category: "Transporte" as Category,
    currency: "BRL" as Currency,
    quantity: 1,
    unitValue: 0,
    tax: 0,
    fee: 0,
    deliveryFee: 0,
    documentIds: [] as string[],
    taskId: "",
  })

  const [documents, setDocuments] = useState<Array<{ id: string; name: string }>>([])
  const [tasks, setTasks] = useState<Array<{ id: string; title: string }>>([])

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    receipt: "",
    description: "",
  })
  const [editingPaymentData, setEditingPaymentData] = useState({
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    receipt: "",
    description: "",
  })
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [editingReceiptFile, setEditingReceiptFile] = useState<File | null>(null)
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)

  // Carregar custos, documentos e tarefas
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Carregar custos
        const costsResponse = await fetch("/api/costs")
        if (costsResponse.ok) {
          const data = await costsResponse.json()
          setItems(
            data.map((item: any) => ({
              ...item,
              // Garantir que valores extras sejam números
              tax: typeof item.tax === 'number' ? item.tax : null,
              fee: typeof item.fee === 'number' ? item.fee : null,
              deliveryFee: typeof item.deliveryFee === 'number' ? item.deliveryFee : null,
              // Garantir que documentIds seja um array (compatibilidade com dados antigos)
              documentIds: Array.isArray(item.documentIds) ? item.documentIds : (item.documentId ? [item.documentId] : []),
              payments: Array.isArray(item.payments) 
                ? item.payments.map((payment: any) => ({
                    ...payment,
                    date: new Date(payment.date),
                    description: payment.description || null,
                    receipt: payment.receipt || null,
                  }))
                : [],
              createdAt: new Date(item.createdAt),
            }))
          )
        } else {
          toast({
            title: "Erro",
            description: "Erro ao carregar custos",
            variant: "destructive",
          })
        }

        // Carregar documentos (se a API existir)
        try {
          const documentsResponse = await fetch("/api/documents")
          if (documentsResponse.ok) {
            const docsData = await documentsResponse.json()
            setDocuments(Array.isArray(docsData) ? docsData.map((doc: any) => ({ id: doc.id, name: doc.name })) : [])
          }
        } catch (error) {
          console.warn("API de documentos não disponível:", error)
        }

        // Carregar tarefas
        try {
          const tasksResponse = await fetch("/api/tasks")
          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json()
            setTasks(Array.isArray(tasksData) ? tasksData.map((task: any) => ({ id: task.id, title: task.title })) : [])
          }
        } catch (error) {
          console.warn("Erro ao carregar tarefas:", error)
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar dados",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  const filteredItems = items.filter((item) => {
    const categoryMatch = filterCategory === "all" || item.category === filterCategory
    const status = getPaymentStatus(item, selectedCurrency.code, exchangeRates)
    const statusMatch = filterStatus === "all" || status === filterStatus
    return categoryMatch && statusMatch
  })

  // Lógica de paginação
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filteredItems.slice(startIndex, endIndex)

  // Resetar para página 1 quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [filterCategory, filterStatus])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll para o topo da tabela
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const stats = {
    total: items.length,
    totalValue: items.reduce(
      (sum, item) =>
        sum + calculateTotal(item, selectedCurrency.code, exchangeRates),
      0
    ),
    totalPaid: items.reduce(
      (sum, item) =>
        sum + calculatePaid(item, selectedCurrency.code, exchangeRates),
      0
    ),
    totalRemaining: items.reduce(
      (sum, item) =>
        sum +
        (calculateTotal(item, selectedCurrency.code, exchangeRates) -
          calculatePaid(item, selectedCurrency.code, exchangeRates)),
      0
    ),
  }

  const handleCreateItem = () => {
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
      category: "Transporte",
      currency: "BRL",
      quantity: 1,
      unitValue: 0,
      tax: 0,
      fee: 0,
      deliveryFee: 0,
      documentIds: [] as string[],
      taskId: "",
    })
    setAddingItem(true)
  }

  const handleEditItem = (item: CostItem) => {
    setFormData({
      name: item.name,
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      category: item.category,
      currency: item.currency,
      quantity: item.quantity,
      unitValue: item.unitValue,
      tax: item.tax || 0,
      fee: item.fee || 0,
      deliveryFee: item.deliveryFee || 0,
      documentIds: item.documentIds || [],
      taskId: item.taskId || "",
    })
    setEditingItem(item)
  }

  const handleSaveItem = async () => {
    if (!formData.name || formData.unitValue <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o nome e valor unitário",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      if (editingItem) {
        // Atualizar item existente
        const response = await fetch(`/api/costs/${editingItem.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            imageUrl: formData.imageUrl,
            category: formData.category,
            currency: formData.currency,
            quantity: formData.quantity,
            unitValue: formData.unitValue,
            tax: formData.tax || null,
            fee: formData.fee || null,
            deliveryFee: formData.deliveryFee || null,
            documentIds: formData.documentIds || [],
            taskId: formData.taskId || null,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao atualizar custo")
        }

        // Recarregar custos
        const costsResponse = await fetch("/api/costs")
        if (costsResponse.ok) {
          const data = await costsResponse.json()
          setItems(
            data.map((item: any) => ({
              ...item,
              // Garantir que valores extras sejam números
              tax: typeof item.tax === 'number' ? item.tax : null,
              fee: typeof item.fee === 'number' ? item.fee : null,
              deliveryFee: typeof item.deliveryFee === 'number' ? item.deliveryFee : null,
              payments: Array.isArray(item.payments) 
                ? item.payments.map((payment: any) => ({
                    ...payment,
                    date: new Date(payment.date),
                    description: payment.description || null,
                    receipt: payment.receipt || null,
                  }))
                : [],
              createdAt: new Date(item.createdAt),
            }))
          )
        }

        toast({
          title: "Sucesso",
          description: "Custo atualizado com sucesso",
        })
        setEditingItem(null)
      } else {
        // Criar novo item
        const response = await fetch("/api/costs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            imageUrl: formData.imageUrl,
            category: formData.category,
            currency: formData.currency,
            quantity: formData.quantity,
            unitValue: formData.unitValue,
            tax: formData.tax || null,
            fee: formData.fee || null,
            deliveryFee: formData.deliveryFee || null,
            documentIds: formData.documentIds || [],
            taskId: formData.taskId || null,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao criar custo")
        }

        // Recarregar custos
        const costsResponse = await fetch("/api/costs")
        if (costsResponse.ok) {
          const data = await costsResponse.json()
          setItems(
            data.map((item: any) => ({
              ...item,
              // Garantir que valores extras sejam números
              tax: typeof item.tax === 'number' ? item.tax : null,
              fee: typeof item.fee === 'number' ? item.fee : null,
              deliveryFee: typeof item.deliveryFee === 'number' ? item.deliveryFee : null,
              payments: Array.isArray(item.payments) 
                ? item.payments.map((payment: any) => ({
                    ...payment,
                    date: new Date(payment.date),
                    description: payment.description || null,
                    receipt: payment.receipt || null,
                  }))
                : [],
              createdAt: new Date(item.createdAt),
            }))
          )
        }

        toast({
          title: "Sucesso",
          description: "Custo criado com sucesso",
        })
        setAddingItem(false)
      }

      // Reset form
      setFormData({
        name: "",
        description: "",
        imageUrl: "",
        category: "Transporte",
        currency: "BRL",
        quantity: 1,
        unitValue: 0,
        tax: 0,
        fee: 0,
        deliveryFee: 0,
        documentIds: [] as string[],
        taskId: "",
      })
    } catch (error) {
      console.error("Erro ao salvar custo:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao salvar custo. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddPayment = (item: CostItem) => {
    setPaymentData({
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      receipt: "",
      description: "",
    })
    setReceiptFile(null)
    setAddingPayment(item)
  }

  const handleEditPayment = (payment: Payment, costItem: CostItem) => {
    setEditingPaymentData({
      amount: payment.amount,
      date: payment.date.toISOString().split("T")[0],
      receipt: payment.receipt || "",
      description: payment.description || "",
    })
    setEditingReceiptFile(null)
    setEditingPayment({ payment, costItem })
  }

  const handleSavePayment = async () => {
    if (!addingPayment || paymentData.amount <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, informe um valor válido",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      let receiptUrl = paymentData.receipt || null

      // Se houver arquivo para upload, fazer upload primeiro
      if (receiptFile) {
        setIsUploadingReceipt(true)
        const formData = new FormData()
        formData.append("file", receiptFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json()
          throw new Error(uploadError.error || "Erro ao fazer upload do comprovante")
        }

        const uploadData = await uploadResponse.json()
        receiptUrl = uploadData.url
        setIsUploadingReceipt(false)
      }

      // Criar o pagamento com a URL do comprovante
      const response = await fetch(`/api/costs/${addingPayment.id}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          date: paymentData.date,
          receipt: receiptUrl,
          description: paymentData.description || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao adicionar pagamento")
      }

      // Recarregar custos
      const costsResponse = await fetch("/api/costs")
      if (costsResponse.ok) {
        const data = await costsResponse.json()
        setItems(
          data.map((item: any) => ({
            ...item,
            payments: Array.isArray(item.payments) 
              ? item.payments.map((payment: any) => ({
                  ...payment,
                  date: new Date(payment.date),
                  description: payment.description || null,
                  receipt: payment.receipt || null,
                }))
              : [],
            createdAt: new Date(item.createdAt),
          }))
        )
      }

      toast({
        title: "Sucesso",
        description: "Pagamento adicionado com sucesso",
      })

      setAddingPayment(null)
      setPaymentData({
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        receipt: "",
        description: "",
      })
      setReceiptFile(null)
    } catch (error) {
      console.error("Erro ao adicionar pagamento:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao adicionar pagamento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setIsUploadingReceipt(false)
    }
  }

  const handleUpdatePayment = async () => {
    if (!editingPayment || editingPaymentData.amount <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, informe um valor válido",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      let receiptUrl = editingPaymentData.receipt || null

      // Se houver novo arquivo para upload, fazer upload primeiro
      if (editingReceiptFile) {
        setIsUploadingReceipt(true)
        const formData = new FormData()
        formData.append("file", editingReceiptFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json()
          throw new Error(uploadError.error || "Erro ao fazer upload do comprovante")
        }

        const uploadData = await uploadResponse.json()
        receiptUrl = uploadData.url
        setIsUploadingReceipt(false)
      }

      // Atualizar o pagamento com a URL do comprovante
      const response = await fetch(`/api/costs/${editingPayment.costItem.id}/payments/${editingPayment.payment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: editingPaymentData.amount,
          date: editingPaymentData.date,
          receipt: receiptUrl,
          description: editingPaymentData.description || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao atualizar pagamento")
      }

      // Recarregar custos
      const costsResponse = await fetch("/api/costs")
      if (costsResponse.ok) {
        const data = await costsResponse.json()
        setItems(
          data.map((item: any) => ({
            ...item,
            payments: Array.isArray(item.payments) 
              ? item.payments.map((payment: any) => ({
                  ...payment,
                  date: new Date(payment.date),
                  description: payment.description || null,
                  receipt: payment.receipt || null,
                }))
              : [],
            createdAt: new Date(item.createdAt),
          }))
        )
      }

      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso",
      })

      setEditingPayment(null)
      setEditingPaymentData({
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        receipt: "",
        description: "",
      })
      setEditingReceiptFile(null)
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar pagamento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setIsUploadingReceipt(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!deletingItem) return

    try {
      const response = await fetch(`/api/costs/${deletingItem.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao deletar custo")
      }

      // Recarregar custos
      const costsResponse = await fetch("/api/costs")
      if (costsResponse.ok) {
        const data = await costsResponse.json()
        setItems(
          data.map((item: any) => ({
            ...item,
            payments: item.payments.map((payment: any) => ({
              ...payment,
              date: new Date(payment.date),
            })),
            createdAt: new Date(item.createdAt),
          }))
        )
      }

      toast({
        title: "Sucesso",
        description: "Custo excluído com sucesso",
      })
      setDeletingItem(null)
    } catch (error) {
      console.error("Erro ao deletar custo:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao deletar custo. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
    setAddingItem(false)
    setAddingPayment(null)
    setEditingPayment(null)
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
      category: "Transporte",
      currency: "BRL",
      quantity: 1,
      unitValue: 0,
      tax: 0,
      fee: 0,
      deliveryFee: 0,
      documentIds: [] as string[],
      taskId: "",
    })
  }

  return (
    <MainLayout
      headerTitle="Custos"
      headerDescription="Gerencie todos os custos do processo de imigração"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="rounded-lg border p-3 sm:p-4 bg-muted/40">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total de Itens</div>
          </div>
          <div className="rounded-lg border p-3 sm:p-4 bg-muted/40">
            <div className="text-xl sm:text-2xl font-bold">
              {formatCurrency(stats.totalValue, selectedCurrency.code)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Valor Total</div>
          </div>
          <div className="rounded-lg border p-3 sm:p-4 bg-muted/40">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPaid, selectedCurrency.code)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total Pago</div>
          </div>
          <div className="rounded-lg border p-3 sm:p-4 bg-muted/40">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {formatCurrency(stats.totalRemaining, selectedCurrency.code)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Restante</div>
          </div>
        </div>

        {/* Filtros e Botão */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Situações</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Não pago">Não pago</SelectItem>
                  <SelectItem value="Pago Parcialmente">Pago Parcialmente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCreateItem} className="w-full sm:w-auto min-h-[44px]">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Adicionar Item</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>
        </div>

        {/* Tabela */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] sm:w-[100px] px-4">Imagem</TableHead>
                    <TableHead className="min-w-[200px] px-4">Item</TableHead>
                    <TableHead className="hidden sm:table-cell min-w-[100px] px-4">Moeda</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[130px] px-4">Categoria</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[150px] px-4">Situação</TableHead>
                    <TableHead className="text-right hidden lg:table-cell min-w-[130px] px-4">Valor Unitário</TableHead>
                    <TableHead className="text-right min-w-[130px] px-4">Valor Total</TableHead>
                    <TableHead className="text-right hidden md:table-cell min-w-[130px] px-4">Valor Pago</TableHead>
                    <TableHead className="text-right hidden md:table-cell min-w-[130px] px-4">Valor Restante</TableHead>
                    <TableHead className="text-right w-[60px] px-4">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Nenhum item encontrado.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {paginatedItems.map((item) => {
                        const total = calculateTotal(
                          item,
                          selectedCurrency.code,
                          exchangeRates
                        )
                        const paid = calculatePaid(
                          item,
                          selectedCurrency.code,
                          exchangeRates
                        )
                        const remaining = total - paid
                        const status = getPaymentStatus(
                          item,
                          selectedCurrency.code,
                          exchangeRates
                        )
                        const unitTotal = convertCurrency(
                          item.unitValue,
                          item.currency,
                          selectedCurrency.code,
                          exchangeRates
                        )

                        return (
                          <TableRow 
                            key={item.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setViewingItem(item)}
                          >
                            <TableCell className="px-4">
                              {item.imageUrl ? (
                                <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded overflow-hidden">
                                  <Image
                                    src={item.imageUrl}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded bg-muted flex items-center justify-center">
                                  <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="px-4">
                              <div>
                                <div className="font-semibold text-sm sm:text-base">{item.name}</div>
                                {item.description && (
                                  <div className="text-xs text-muted-foreground hidden sm:block">
                                    {item.description}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1 sm:hidden">
                                  <Badge variant="outline" className="text-xs">{item.currency}</Badge>
                                  <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${status === "Pago"
                                      ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                      : status === "Pago Parcialmente"
                                        ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                                        : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                                      }`}
                                  >
                                    {status}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell px-4">
                              <Badge variant="outline">{item.currency}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell px-4">
                              <Badge variant="secondary">{item.category}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell px-4">
                              <Badge
                                variant="outline"
                                className={
                                  status === "Pago"
                                    ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                    : status === "Pago Parcialmente"
                                      ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                                      : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                                }
                              >
                                {status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right hidden lg:table-cell text-sm px-4">
                              {formatCurrency(unitTotal, selectedCurrency.code)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm sm:text-base px-4">
                              {formatCurrency(total, selectedCurrency.code)}
                            </TableCell>
                            <TableCell className="text-right text-green-600 hidden md:table-cell text-sm px-4">
                              {formatCurrency(paid, selectedCurrency.code)}
                            </TableCell>
                            <TableCell className="text-right text-orange-600 hidden md:table-cell text-sm px-4">
                              {formatCurrency(remaining, selectedCurrency.code)}
                            </TableCell>
                            <TableCell className="px-4">
                              <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu modal={false}>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 sm:h-10 sm:w-10"
                                      title="Ações"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setViewingItem(item)
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      Ver detalhes
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEditItem(item)
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar item
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleAddPayment(item)
                                      }}
                                    >
                                      <Wallet className="h-4 w-4 mr-2" />
                                      Adicionar pagamento
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setDeletingItem(item)
                                      }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir item
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Controles de Paginação */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredItems.length)} de {filteredItems.length} itens
              </span>
              <span className="hidden sm:inline">|</span>
              <div className="flex items-center gap-2">
                <Label htmlFor="itemsPerPage" className="text-sm">Itens por página:</Label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger id="itemsPerPage" className="w-[80px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Mostrar apenas algumas páginas ao redor da página atual
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-9 h-9 p-0"
                      >
                        {page}
                      </Button>
                    )
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    )
                  }
                  return null
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="gap-1"
              >
                <span className="hidden sm:inline">Próxima</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Dialog de Visualização */}
        <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Detalhes do Item</DialogTitle>
            </DialogHeader>
            {viewingItem && (
              <div className="space-y-4 py-4">
                {viewingItem.imageUrl && (
                  <div className="relative h-48 w-full rounded-lg overflow-hidden">
                    <Image
                      src={viewingItem.imageUrl}
                      alt={viewingItem.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Nome</Label>
                  <p className="font-semibold">{viewingItem.name}</p>
                </div>
                {viewingItem.description && (
                  <div>
                    <Label className="text-muted-foreground">Descrição</Label>
                    <p>{viewingItem.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Categoria</Label>
                    <p>{viewingItem.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Moeda</Label>
                    <p>{viewingItem.currency}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Quantidade</Label>
                    <p>{viewingItem.quantity}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Valor Unitário</Label>
                    <p>
                      {formatCurrency(
                        convertCurrency(
                          viewingItem.unitValue,
                          viewingItem.currency,
                          selectedCurrency.code,
                          exchangeRates
                        ),
                        selectedCurrency.code
                      )}
                    </p>
                  </div>
                </div>
                {(viewingItem.tax || viewingItem.fee || viewingItem.deliveryFee) && (
                  <div>
                    <Label className="text-muted-foreground">Valores Extras</Label>
                    <div className="space-y-1 mt-1">
                      {viewingItem.tax && (
                        <p className="text-sm">
                          Imposto:{" "}
                          {formatCurrency(
                            convertCurrency(
                              viewingItem.tax,
                              viewingItem.currency,
                              selectedCurrency.code,
                              exchangeRates
                            ),
                            selectedCurrency.code
                          )}
                        </p>
                      )}
                      {viewingItem.fee && (
                        <p className="text-sm">
                          Taxa:{" "}
                          {formatCurrency(
                            convertCurrency(
                              viewingItem.fee,
                              viewingItem.currency,
                              selectedCurrency.code,
                              exchangeRates
                            ),
                            selectedCurrency.code
                          )}
                        </p>
                      )}
                      {viewingItem.deliveryFee && (
                        <p className="text-sm">
                          Taxa de Entrega:{" "}
                          {formatCurrency(
                            convertCurrency(
                              viewingItem.deliveryFee,
                              viewingItem.currency,
                              selectedCurrency.code,
                              exchangeRates
                            ),
                            selectedCurrency.code
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Valor Total</Label>
                  <p className="text-xl font-bold">
                    {formatCurrency(
                      calculateTotal(
                        viewingItem,
                        selectedCurrency.code,
                        exchangeRates
                      ),
                      selectedCurrency.code
                    )}
                  </p>
                </div>
                {((viewingItem.documentIds && viewingItem.documentIds.length > 0) || viewingItem.taskId) && (
                  <div>
                    <Label className="text-muted-foreground">Vinculações</Label>
                    <div className="space-y-1 mt-1">
                      {viewingItem.documentIds && viewingItem.documentIds.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Documentos ({viewingItem.documentIds.length}):</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            {viewingItem.documentIds.map((docId) => {
                              const doc = documents.find((d) => d.id === docId)
                              return doc ? (
                                <li key={docId} className="text-sm">
                                  {doc.name}
                                </li>
                              ) : null
                            })}
                          </ul>
                        </div>
                      )}
                      {viewingItem.taskId && (
                        <p className="text-sm">
                          Tarefa: {tasks.find((t) => t.id === viewingItem.taskId)?.title || "Tarefa vinculada"}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground mb-2 block">Histórico de Pagamentos</Label>
                  
                  {/* Resumo de Pagamentos */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-lg border p-3 bg-muted/40">
                      <div className="text-sm text-muted-foreground mb-1">Total Pago</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(
                          calculatePaid(
                            viewingItem,
                            selectedCurrency.code,
                            exchangeRates
                          ),
                          selectedCurrency.code
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg border p-3 bg-muted/40">
                      <div className="text-sm text-muted-foreground mb-1">Restante</div>
                      <div className="text-lg font-bold text-orange-600">
                        {formatCurrency(
                          calculateTotal(
                            viewingItem,
                            selectedCurrency.code,
                            exchangeRates
                          ) -
                            calculatePaid(
                              viewingItem,
                              selectedCurrency.code,
                              exchangeRates
                            ),
                          selectedCurrency.code
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Progresso do Pagamento</span>
                      <span>
                        {Math.round(
                          (calculatePaid(
                            viewingItem,
                            selectedCurrency.code,
                            exchangeRates
                          ) /
                            calculateTotal(
                              viewingItem,
                              selectedCurrency.code,
                              exchangeRates
                            )) *
                            100
                        )}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (calculatePaid(
                              viewingItem,
                              selectedCurrency.code,
                              exchangeRates
                            ) /
                              calculateTotal(
                                viewingItem,
                                selectedCurrency.code,
                                exchangeRates
                              )) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Status do Pagamento */}
                  <div className="mb-4">
                    <Badge
                      variant={
                        getPaymentStatus(
                          viewingItem,
                          selectedCurrency.code,
                          exchangeRates
                        ) === "Pago"
                          ? "default"
                          : getPaymentStatus(
                              viewingItem,
                              selectedCurrency.code,
                              exchangeRates
                            ) === "Pago Parcialmente"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-sm"
                    >
                      {getPaymentStatus(
                        viewingItem,
                        selectedCurrency.code,
                        exchangeRates
                      )}
                    </Badge>
                  </div>

                  {/* Lista de Pagamentos */}
                  {viewingItem.payments.length > 0 ? (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Pagamentos Realizados</Label>
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-3">
                          {[...viewingItem.payments]
                            .sort((a, b) => b.date.getTime() - a.date.getTime())
                            .map((payment, index) => {
                              const paymentAmount = convertCurrency(
                                payment.amount,
                                payment.currency || viewingItem.currency,
                                selectedCurrency.code as Currency,
                                exchangeRates
                              )
                              const originalAmount = payment.amount
                              const originalCurrency = payment.currency || viewingItem.currency
                              
                              return (
                                <div
                                  key={payment.id}
                                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors space-y-3"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold flex-shrink-0">
                                        {viewingItem.payments.length - index}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <p className="font-bold text-lg">
                                            {formatCurrency(
                                              paymentAmount,
                                              selectedCurrency.code
                                            )}
                                          </p>
                                          {(originalCurrency !== selectedCurrency.code) && (
                                            <Badge variant="outline" className="text-xs">
                                              {formatCurrency(originalAmount, originalCurrency as Currency)}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <Label className="text-xs text-muted-foreground font-medium">Data:</Label>
                                            <p className="text-sm font-medium">
                                              {payment.date.toLocaleDateString("pt-PT", {
                                                day: "2-digit",
                                                month: "long",
                                                year: "numeric",
                                              })}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Label className="text-xs text-muted-foreground font-medium">Moeda Original:</Label>
                                            <Badge variant="secondary" className="text-xs">
                                              {originalCurrency}
                                            </Badge>
                                          </div>
                                          {payment.description ? (
                                            <div className="mt-2">
                                              <Label className="text-xs text-muted-foreground font-medium block mb-1">Descrição:</Label>
                                              <p className="text-sm text-foreground bg-muted/50 p-2 rounded border">
                                                {payment.description}
                                              </p>
                                            </div>
                                          ) : (
                                            <div className="mt-2">
                                              <p className="text-xs text-muted-foreground italic">
                                                Sem descrição adicional
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditPayment(payment, viewingItem)
                                        }}
                                        className="gap-2"
                                        title="Editar pagamento"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      {payment.receipt ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setViewingReceipt(payment.receipt || null)
                                          }}
                                          className="gap-2"
                                        >
                                          <Receipt className="h-4 w-4" />
                                          <span className="hidden sm:inline">Ver Comprovante</span>
                                        </Button>
                                      ) : (
                                        <Badge variant="outline" className="text-xs text-muted-foreground">
                                          Sem comprovante
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="rounded-lg border p-6 text-center bg-muted/40">
                      <Receipt className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum pagamento registrado ainda
                      </p>
                    </div>
                  )}

                  {/* Botão para adicionar pagamento */}
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        setViewingItem(null)
                        handleAddPayment(viewingItem)
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Pagamento
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewingItem(null)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Criar/Editar Item */}
        <Dialog open={addingItem || !!editingItem} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingItem ? "Editar Item" : "Adicionar Novo Item"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome do Item <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Passagem Aérea"
                  className="min-h-[44px] text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do item"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Link da Imagem</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value as Category })
                    }
                  >
                    <SelectTrigger id="category" className="min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currency: value as Currency })
                    }
                  >
                    <SelectTrigger id="currency" className="min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr} value={curr}>
                          {curr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade <span className="text-destructive">*</span></Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                    }
                    className="min-h-[44px] text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitValue">
                    Valor Unitário <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="unitValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitValue}
                    onChange={(e) =>
                      setFormData({ ...formData, unitValue: parseFloat(e.target.value) || 0 })
                    }
                    className="min-h-[44px] text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Valores Extras (opcional)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax" className="text-xs">Imposto</Label>
                    <Input
                      id="tax"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.tax}
                      onChange={(e) =>
                        setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fee" className="text-xs">Taxa</Label>
                    <Input
                      id="fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.fee}
                      onChange={(e) =>
                        setFormData({ ...formData, fee: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryFee" className="text-xs">Taxa de Entrega</Label>
                    <Input
                      id="deliveryFee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.deliveryFee}
                      onChange={(e) =>
                        setFormData({ ...formData, deliveryFee: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documentIds">
                    Vincular a Documentos (opcional, máximo 3)
                    {formData.documentIds.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({formData.documentIds.length}/3)
                      </span>
                    )}
                  </Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && value !== "none") {
                        if (formData.documentIds.length < 3) {
                          if (!formData.documentIds.includes(value)) {
                            setFormData({
                              ...formData,
                              documentIds: [...formData.documentIds, value],
                            })
                          }
                        } else {
                          toast({
                            title: "Limite atingido",
                            description: "Você pode vincular no máximo 3 documentos por item de custo.",
                            variant: "destructive",
                          })
                        }
                      }
                    }}
                    disabled={formData.documentIds.length >= 3}
                  >
                    <SelectTrigger id="documentIds" className="min-h-[44px]">
                      <SelectValue placeholder={
                        formData.documentIds.length >= 3
                          ? "Máximo de 3 documentos atingido"
                          : "Selecione um documento"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {documents
                        .filter((doc) => !formData.documentIds.includes(doc.id))
                        .map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.name}
                          </SelectItem>
                        ))}
                      {documents.filter((doc) => !formData.documentIds.includes(doc.id)).length === 0 && (
                        <SelectItem value="none" disabled>
                          Nenhum documento disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {formData.documentIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.documentIds.map((docId) => {
                        const doc = documents.find((d) => d.id === docId)
                        return doc ? (
                          <Badge
                            key={docId}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {doc.name}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  documentIds: formData.documentIds.filter((id) => id !== docId),
                                })
                              }}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskId">Vincular a Tarefa (opcional)</Label>
                  <Select
                    value={formData.taskId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, taskId: value === "none" ? "" : value })
                    }
                  >
                    <SelectTrigger id="taskId" className="min-h-[44px]">
                      <SelectValue placeholder="Selecione uma tarefa" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveItem}
                disabled={!formData.name || formData.unitValue <= 0 || isSaving}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : editingItem ? (
                  "Salvar Alterações"
                ) : (
                  "Adicionar Item"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Adicionar Pagamento */}
        <Dialog open={!!addingPayment} onOpenChange={(open) => !open && setAddingPayment(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Adicionar Pagamento</DialogTitle>
              <DialogDescription className="text-sm">
                {addingPayment && `Registrar pagamento para: ${addingPayment.name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">
                  Valor <span className="text-destructive">*</span>
                  {addingPayment && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (em {addingPayment.currency})
                    </span>
                  )}
                </Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentData.amount}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="min-h-[44px] text-base"
                />
                {addingPayment && paymentData.amount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Equivale a: {formatCurrency(
                      convertCurrency(
                        paymentData.amount,
                        addingPayment.currency,
                        selectedCurrency.code as Currency,
                        exchangeRates
                      ),
                      selectedCurrency.code as Currency
                    )} ({selectedCurrency.code})
                  </p>
                )}
                {addingPayment && (
                  <p className="text-xs text-muted-foreground">
                    Restante: {formatCurrency(
                      calculateTotal(
                        addingPayment,
                        selectedCurrency.code as Currency,
                        exchangeRates
                      ) -
                      calculatePaid(
                        addingPayment,
                        selectedCurrency.code as Currency,
                        exchangeRates
                      ),
                      selectedCurrency.code as Currency
                    )} ({selectedCurrency.code})
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">Data <span className="text-destructive">*</span></Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                  className="min-h-[44px] text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentReceipt">
                  Comprovante de Pagamento
                </Label>
                <div className="space-y-2">
                  <Input
                    id="paymentReceipt"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setReceiptFile(file)
                        setPaymentData({ ...paymentData, receipt: "" })
                      }
                    }}
                    className="cursor-pointer min-h-[44px] text-base"
                  />
                  {receiptFile && (
                    <div className="flex items-center gap-2 p-2 rounded border bg-muted/40">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{receiptFile.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setReceiptFile(null)
                          const input = document.getElementById("paymentReceipt") as HTMLInputElement
                          if (input) input.value = ""
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {!receiptFile && paymentData.receipt && (
                    <div className="text-sm text-muted-foreground">
                      Comprovante atual: <a href={paymentData.receipt} target="_blank" rel="noopener noreferrer" className="text-primary underline">Ver comprovante</a>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: Imagens (JPG, PNG, WEBP) ou PDF (máx. 10MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDescription">Descrição</Label>
                <Textarea
                  id="paymentDescription"
                  value={paymentData.description}
                  onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                  placeholder="Observações sobre o pagamento"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setAddingPayment(null)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSavePayment}
                disabled={paymentData.amount <= 0 || isSaving || isUploadingReceipt}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {isSaving || isUploadingReceipt ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploadingReceipt ? "Enviando arquivo..." : "Salvando..."}
                  </>
                ) : (
                  "Adicionar Pagamento"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Editar Pagamento */}
        <Dialog open={!!editingPayment} onOpenChange={(open) => !open && setEditingPayment(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Editar Pagamento</DialogTitle>
              <DialogDescription className="text-sm">
                {editingPayment && `Editar pagamento para: ${editingPayment.costItem.name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              <div className="space-y-2">
                <Label htmlFor="editingPaymentAmount">
                  Valor <span className="text-destructive">*</span>
                  {editingPayment && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (em {editingPayment.costItem.currency})
                    </span>
                  )}
                </Label>
                <Input
                  id="editingPaymentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingPaymentData.amount}
                  onChange={(e) =>
                    setEditingPaymentData({ ...editingPaymentData, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="min-h-[44px] text-base"
                />
                {editingPayment && editingPaymentData.amount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Equivale a: {formatCurrency(
                      convertCurrency(
                        editingPaymentData.amount,
                        editingPayment.costItem.currency,
                        selectedCurrency.code as Currency,
                        exchangeRates
                      ),
                      selectedCurrency.code as Currency
                    )} ({selectedCurrency.code})
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editingPaymentDate">Data <span className="text-destructive">*</span></Label>
                <Input
                  id="editingPaymentDate"
                  type="date"
                  value={editingPaymentData.date}
                  onChange={(e) => setEditingPaymentData({ ...editingPaymentData, date: e.target.value })}
                  className="min-h-[44px] text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editingPaymentReceipt">
                  Comprovante de Pagamento
                </Label>
                <div className="space-y-2">
                  {editingPayment?.payment.receipt && !editingReceiptFile && (
                    <div className="flex items-center gap-2 p-2 rounded border bg-muted/40 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">Comprovante atual existe</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (editingPayment.payment.receipt) {
                            setViewingReceipt(editingPayment.payment.receipt)
                          }
                        }}
                        className="gap-2"
                      >
                        <Eye className="h-3 w-3" />
                        Ver
                      </Button>
                    </div>
                  )}
                  <Input
                    id="editingPaymentReceipt"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setEditingReceiptFile(file)
                      }
                    }}
                    className="cursor-pointer min-h-[44px] text-base"
                  />
                  {editingReceiptFile && (
                    <div className="flex items-center gap-2 p-2 rounded border bg-muted/40">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{editingReceiptFile.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setEditingReceiptFile(null)
                          const input = document.getElementById("editingPaymentReceipt") as HTMLInputElement
                          if (input) input.value = ""
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {editingReceiptFile 
                    ? "Novo arquivo será enviado e substituirá o atual" 
                    : "Deixe em branco para manter o comprovante atual ou selecione um novo arquivo"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editingPaymentDescription">Descrição</Label>
                <Textarea
                  id="editingPaymentDescription"
                  value={editingPaymentData.description}
                  onChange={(e) => setEditingPaymentData({ ...editingPaymentData, description: e.target.value })}
                  placeholder="Observações sobre o pagamento"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setEditingPayment(null)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdatePayment}
                disabled={editingPaymentData.amount <= 0 || isSaving || isUploadingReceipt}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {isSaving || isUploadingReceipt ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploadingReceipt ? "Enviando arquivo..." : "Salvando..."}
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-[500px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o item{" "}
                <strong>{deletingItem?.name}</strong>? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel className="w-full sm:w-auto min-h-[44px]">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteItem}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto min-h-[44px]"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de Visualização do Comprovante */}
        <Dialog open={!!viewingReceipt} onOpenChange={(open) => !open && setViewingReceipt(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Comprovante de Pagamento</DialogTitle>
            </DialogHeader>
            {viewingReceipt && (
              <div className="space-y-4 py-4">
                <div className="relative w-full rounded-lg overflow-hidden border bg-muted/40">
                  {viewingReceipt.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div className="relative w-full aspect-[4/3] min-h-[400px]">
                      <Image
                        src={viewingReceipt}
                        alt="Comprovante de pagamento"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : viewingReceipt.match(/\.pdf$/i) ? (
                    <div className="w-full h-[600px]">
                      <iframe
                        src={viewingReceipt}
                        className="w-full h-full border-0 rounded-lg"
                        title="Comprovante de pagamento PDF"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/3] min-h-[400px] flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Visualizando comprovante</p>
                        <Button
                          variant="outline"
                          asChild
                          className="mt-4"
                        >
                          <a
                            href={viewingReceipt}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Abrir em nova aba
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    asChild
                  >
                    <a
                      href={viewingReceipt}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Baixar Comprovante
                    </a>
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewingReceipt(null)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
