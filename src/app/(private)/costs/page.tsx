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
  Edit,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Loader2,
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
  documentId?: string | null
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
        date: new Date(2024, 1, 5),
      },
      {
        id: "p3",
        amount: 530,
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
  return `${currencySymbols[currency]} ${value.toFixed(2).replace(".", ",")}`
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
  const extras = (item.tax || 0) + (item.fee || 0) + (item.deliveryFee || 0)
  const total = subtotal + extras
  return convertCurrency(total, item.currency, targetCurrency, exchangeRates)
}

function calculatePaid(
  item: CostItem,
  targetCurrency: Currency,
  exchangeRates: ExchangeRates
): number {
  const totalPaid = item.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  )
  return convertCurrency(totalPaid, item.currency, targetCurrency, exchangeRates)
}

function getPaymentStatus(
  item: CostItem,
  targetCurrency: Currency,
  exchangeRates: ExchangeRates
): PaymentStatus {
  const total = calculateTotal(item, targetCurrency, exchangeRates)
  const paid = calculatePaid(item, targetCurrency, exchangeRates)

  if (paid === 0) return "Não pago"
  if (paid >= total) return "Pago"
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
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({})

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
    documentId: "",
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
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
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
              payments: item.payments.map((payment: any) => ({
                ...payment,
                date: new Date(payment.date),
              })),
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
      documentId: "",
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
      documentId: item.documentId || "",
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
            documentId: formData.documentId || null,
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
            documentId: formData.documentId || null,
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
        documentId: "",
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
      const response = await fetch(`/api/costs/${addingPayment.id}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          date: paymentData.date,
          receipt: paymentData.receipt || null,
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
      documentId: "",
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] sm:w-[80px]">Imagem</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="hidden sm:table-cell">Moeda</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="hidden lg:table-cell">Situação</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Valor Unitário</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Valor Pago</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Valor Restante</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
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
                      {filteredItems.map((item) => {
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
                          <TableRow key={item.id}>
                            <TableCell>
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
                            <TableCell>
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
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline">{item.currency}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="secondary">{item.category}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
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
                            <TableCell className="text-right hidden lg:table-cell text-sm">
                              {formatCurrency(unitTotal, selectedCurrency.code)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm sm:text-base">
                              {formatCurrency(total, selectedCurrency.code)}
                            </TableCell>
                            <TableCell className="text-right text-green-600 hidden md:table-cell text-sm">
                              {formatCurrency(paid, selectedCurrency.code)}
                            </TableCell>
                            <TableCell className="text-right text-orange-600 hidden md:table-cell text-sm">
                              {formatCurrency(remaining, selectedCurrency.code)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1 sm:gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setViewingItem(item)}
                                  className="h-9 w-9 sm:h-10 sm:w-10"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditItem(item)}
                                  className="h-9 w-9 sm:h-10 sm:w-10"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleAddPayment(item)}
                                  className="h-9 w-9 sm:h-10 sm:w-10"
                                >
                                  <Wallet className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeletingItem(item)}
                                  className="text-destructive h-9 w-9 sm:h-10 sm:w-10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
                {(viewingItem.documentId || viewingItem.taskId) && (
                  <div>
                    <Label className="text-muted-foreground">Vinculações</Label>
                    <div className="space-y-1 mt-1">
                      {viewingItem.documentId && (
                        <p className="text-sm">
                          Documento: {documents.find((d) => d.id === viewingItem.documentId)?.name || "Documento vinculado"}
                        </p>
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
                  <Label className="text-muted-foreground">Pagamentos</Label>
                  {viewingItem.payments.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {viewingItem.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-2 rounded border"
                        >
                          <div>
                            <p className="font-semibold">
                              {formatCurrency(payment.amount, viewingItem.currency)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payment.date.toLocaleDateString("pt-PT")}
                            </p>
                          </div>
                          {payment.receipt && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={payment.receipt} target="_blank" rel="noopener noreferrer">
                                <Receipt className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">Nenhum pagamento registrado</p>
                  )}
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
                  <Label htmlFor="documentId">Vincular a Documento (opcional)</Label>
                  <Select
                    value={formData.documentId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, documentId: value === "none" ? "" : value })
                    }
                  >
                    <SelectTrigger id="documentId" className="min-h-[44px]">
                      <SelectValue placeholder="Selecione um documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {documents.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <SelectContent>
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
                {addingPayment && (
                  <p className="text-xs text-muted-foreground">
                    Restante: {formatCurrency(
                      calculateTotal(
                        addingPayment,
                        selectedCurrency.code,
                        exchangeRates
                      ) -
                      calculatePaid(
                        addingPayment,
                        selectedCurrency.code,
                        exchangeRates
                      ),
                      selectedCurrency.code
                    )}
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
                  Comprovante de Pagamento <span className="text-destructive">*</span>
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
                disabled={paymentData.amount <= 0 || isSaving || isUploadingReceipt || !receiptFile}
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
      </div>
    </MainLayout>
  )
}
