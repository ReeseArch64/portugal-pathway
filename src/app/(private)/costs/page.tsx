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
import {
  AlertCircle,
  DollarSign,
  Edit,
  Eye,
  Filter,
  Image as ImageIcon,
  Plus,
  Receipt,
  Trash2,
  Wallet,
} from "lucide-react"
import Image from "next/image"
import { useState } from "react"
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

function formatCurrency(value: number, currency: Currency): string {
  return `${currencySymbols[currency]} ${value.toFixed(2).replace(".", ",")}`
}

function calculateTotal(item: CostItem): number {
  const subtotal = item.unitValue * item.quantity
  const extras = (item.tax || 0) + (item.fee || 0) + (item.deliveryFee || 0)
  return subtotal + extras
}

function calculatePaid(item: CostItem): number {
  return item.payments.reduce((sum, payment) => sum + payment.amount, 0)
}

function getPaymentStatus(item: CostItem): PaymentStatus {
  const total = calculateTotal(item)
  const paid = calculatePaid(item)
  
  if (paid === 0) return "Não pago"
  if (paid >= total) return "Pago"
  return "Pago Parcialmente"
}

export default function CostsPage() {
  const [items, setItems] = useState<CostItem[]>(STATIC_COSTS)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [viewingItem, setViewingItem] = useState<CostItem | null>(null)
  const [editingItem, setEditingItem] = useState<CostItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<CostItem | null>(null)
  const [addingItem, setAddingItem] = useState(false)
  const [addingPayment, setAddingPayment] = useState<CostItem | null>(null)

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
  })

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    receipt: "",
    description: "",
  })

  const filteredItems = items.filter((item) => {
    const categoryMatch = filterCategory === "all" || item.category === filterCategory
    const status = getPaymentStatus(item)
    const statusMatch = filterStatus === "all" || status === filterStatus
    return categoryMatch && statusMatch
  })

  const stats = {
    total: items.length,
    totalValue: items.reduce((sum, item) => sum + calculateTotal(item), 0),
    totalPaid: items.reduce((sum, item) => sum + calculatePaid(item), 0),
    totalRemaining: items.reduce(
      (sum, item) => sum + (calculateTotal(item) - calculatePaid(item)),
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
    })
    setEditingItem(item)
  }

  const handleSaveItem = () => {
    if (!formData.name || formData.unitValue <= 0) return

    if (editingItem) {
      setItems(
        items.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                ...formData,
                tax: formData.tax || undefined,
                fee: formData.fee || undefined,
                deliveryFee: formData.deliveryFee || undefined,
              }
            : item
        )
      )
      setEditingItem(null)
    } else {
      const newItem: CostItem = {
        id: Date.now().toString(),
        ...formData,
        tax: formData.tax || undefined,
        fee: formData.fee || undefined,
        deliveryFee: formData.deliveryFee || undefined,
        payments: [],
        createdAt: new Date(),
      }
      setItems([...items, newItem])
      setAddingItem(false)
    }

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
    })
  }

  const handleAddPayment = (item: CostItem) => {
    setPaymentData({
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      receipt: "",
      description: "",
    })
    setAddingPayment(item)
  }

  const handleSavePayment = () => {
    if (!addingPayment || paymentData.amount <= 0) return

    const newPayment: Payment = {
      id: Date.now().toString(),
      amount: paymentData.amount,
      date: new Date(paymentData.date),
      receipt: paymentData.receipt || undefined,
      description: paymentData.description || undefined,
    }

    setItems(
      items.map((item) =>
        item.id === addingPayment.id
          ? { ...item, payments: [...item.payments, newPayment] }
          : item
      )
    )

    setAddingPayment(null)
    setPaymentData({
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      receipt: "",
      description: "",
    })
  }

  const handleDeleteItem = () => {
    if (deletingItem) {
      setItems(items.filter((item) => item.id !== deletingItem.id))
      setDeletingItem(null)
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
    })
  }

  return (
    <MainLayout
      headerTitle="Custos"
      headerDescription="Gerencie todos os custos do processo de imigração"
    >
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4 bg-muted/40">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total de Itens</div>
          </div>
          <div className="rounded-lg border p-4 bg-muted/40">
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalValue, "BRL")}
            </div>
            <div className="text-sm text-muted-foreground">Valor Total</div>
          </div>
          <div className="rounded-lg border p-4 bg-muted/40">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPaid, "BRL")}
            </div>
            <div className="text-sm text-muted-foreground">Total Pago</div>
          </div>
          <div className="rounded-lg border p-4 bg-muted/40">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.totalRemaining, "BRL")}
            </div>
            <div className="text-sm text-muted-foreground">Restante</div>
          </div>
        </div>

        {/* Filtros e Botão */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[180px]">
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
          <Button onClick={handleCreateItem}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </div>

        {/* Tabela */}
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Imagem</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Moeda</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Valor Unitário</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">Valor Pago</TableHead>
                  <TableHead className="text-right">Valor Restante</TableHead>
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
                  filteredItems.map((item) => {
                    const total = calculateTotal(item)
                    const paid = calculatePaid(item)
                    const remaining = total - paid
                    const status = getPaymentStatus(item)
                    const unitTotal = item.unitValue

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.imageUrl ? (
                            <div className="relative h-12 w-12 rounded overflow-hidden">
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-semibold">{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.currency}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
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
                        <TableCell className="text-right">
                          {formatCurrency(unitTotal, item.currency)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(total, item.currency)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(paid, item.currency)}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {formatCurrency(remaining, item.currency)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewingItem(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAddPayment(item)}
                            >
                              <Wallet className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingItem(item)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Dialog de Visualização */}
        <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Item</DialogTitle>
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
                    <p>{formatCurrency(viewingItem.unitValue, viewingItem.currency)}</p>
                  </div>
                </div>
                {(viewingItem.tax || viewingItem.fee || viewingItem.deliveryFee) && (
                  <div>
                    <Label className="text-muted-foreground">Valores Extras</Label>
                    <div className="space-y-1 mt-1">
                      {viewingItem.tax && (
                        <p className="text-sm">Imposto: {formatCurrency(viewingItem.tax, viewingItem.currency)}</p>
                      )}
                      {viewingItem.fee && (
                        <p className="text-sm">Taxa: {formatCurrency(viewingItem.fee, viewingItem.currency)}</p>
                      )}
                      {viewingItem.deliveryFee && (
                        <p className="text-sm">Taxa de Entrega: {formatCurrency(viewingItem.deliveryFee, viewingItem.currency)}</p>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Valor Total</Label>
                  <p className="text-xl font-bold">
                    {formatCurrency(calculateTotal(viewingItem), viewingItem.currency)}
                  </p>
                </div>
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
              <Button variant="outline" onClick={() => setViewingItem(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Criar/Editar Item */}
        <Dialog open={addingItem || !!editingItem} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Item" : "Adicionar Novo Item"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome do Item <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Passagem Aérea"
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
                    <SelectTrigger id="category">
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
                    <SelectTrigger id="currency">
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSaveItem} disabled={!formData.name || formData.unitValue <= 0}>
                {editingItem ? "Salvar Alterações" : "Adicionar Item"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Adicionar Pagamento */}
        <Dialog open={!!addingPayment} onOpenChange={(open) => !open && setAddingPayment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Pagamento</DialogTitle>
              <DialogDescription>
                {addingPayment && `Registrar pagamento para: ${addingPayment.name}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
                />
                {addingPayment && (
                  <p className="text-xs text-muted-foreground">
                    Restante: {formatCurrency(
                      calculateTotal(addingPayment) - calculatePaid(addingPayment),
                      addingPayment.currency
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentReceipt">Link do Comprovante</Label>
                <Input
                  id="paymentReceipt"
                  value={paymentData.receipt}
                  onChange={(e) => setPaymentData({ ...paymentData, receipt: e.target.value })}
                  placeholder="https://exemplo.com/comprovante.pdf"
                />
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddingPayment(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePayment} disabled={paymentData.amount <= 0}>
                Adicionar Pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o item{" "}
                <strong>{deletingItem?.name}</strong>? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteItem}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
