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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Edit,
  Image as ImageIcon,
  Loader2,
  Luggage,
  Plus,
  Trash2,
  X
} from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { MainLayout } from "../components/main-layout"

interface BaggageItem {
  id: string
  name: string
  description?: string
  weight?: number
  imageUrl?: string
  quantity: number
  createdAt: string
  updatedAt: string
}

interface Baggage {
  id: string
  type: string
  variant: string
  name: string
  imageUrl?: string
  familyMemberId: string
  maxWeight?: number
  estimatedWeight?: number
  items: BaggageItem[]
  createdAt: string
  updatedAt: string
}

interface FamilyMember {
  id: string
  fullName: string
}

const BAGGAGE_TYPES = ["Mochila", "Mala", "Bolsa"]
const BAGGAGE_VARIANTS = ["Maternidade", "Comum", "Esporte"]
const MAX_WEIGHTS = [5, 10, 20]

export default function BaggagePage() {
  const { toast } = useToast()
  const [baggages, setBaggages] = useState<Baggage[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [filterMember, setFilterMember] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [selectedBaggage, setSelectedBaggage] = useState<Baggage | null>(null)
  const [editingBaggage, setEditingBaggage] = useState<Baggage | null>(null)
  const [editingItem, setEditingItem] = useState<BaggageItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<BaggageItem | null>(null)
  const [creatingBaggage, setCreatingBaggage] = useState(false)
  const [addingItem, setAddingItem] = useState(false)
  const [baggageImageFile, setBaggageImageFile] = useState<File | null>(null)
  const [itemImageFile, setItemImageFile] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const [baggageFormData, setBaggageFormData] = useState({
    type: "",
    variant: "",
    name: "",
    imageUrl: "",
    familyMemberId: "",
    maxWeight: undefined as number | undefined,
  })

  const [itemFormData, setItemFormData] = useState({
    name: "",
    description: "",
    weight: undefined as number | undefined,
    imageUrl: "",
    quantity: 1,
  })

  // Carregar bagagens e membros da família
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Carregar bagagens
        const baggagesResponse = await fetch("/api/baggages")
        if (baggagesResponse.ok) {
          const data = await baggagesResponse.json()
          setBaggages(
            data.map((baggage: any) => ({
              ...baggage,
              items: baggage.items.map((item: any) => ({
                ...item,
                createdAt: new Date(item.createdAt),
                updatedAt: new Date(item.updatedAt),
              })),
            }))
          )
        }

        // Carregar membros da família
        const membersResponse = await fetch("/api/family-members")
        if (membersResponse.ok) {
          const data = await membersResponse.json()
          setFamilyMembers(data)
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

  const filteredBaggages = baggages.filter((baggage) => {
    const memberMatch =
      filterMember === "all" || baggage.familyMemberId === filterMember
    const typeMatch = filterType === "all" || baggage.type === filterType
    return memberMatch && typeMatch
  })

  const handleCreateBaggage = () => {
    setBaggageFormData({
      type: "",
      variant: "",
      name: "",
      imageUrl: "",
      familyMemberId: "",
      maxWeight: undefined,
    })
    setBaggageImageFile(null)
    setEditingBaggage(null)
    setCreatingBaggage(true)
  }

  const handleEditBaggage = (baggage: Baggage) => {
    setBaggageFormData({
      type: baggage.type,
      variant: baggage.variant,
      name: baggage.name,
      imageUrl: baggage.imageUrl || "",
      familyMemberId: baggage.familyMemberId,
      maxWeight: baggage.maxWeight,
    })
    setBaggageImageFile(null)
    setEditingBaggage(baggage)
    setCreatingBaggage(true)
  }

  const handleSaveBaggage = async () => {
    if (!baggageFormData.type || !baggageFormData.familyMemberId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o tipo de bagagem e o membro da família",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      let imageUrl = baggageFormData.imageUrl

      // Se houver arquivo para upload, fazer upload primeiro
      if (baggageImageFile) {
        setIsUploadingImage(true)
        const uploadFormData = new FormData()
        uploadFormData.append("file", baggageImageFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          throw new Error(uploadData.error || "Erro ao fazer upload da imagem")
        }

        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.url
        setIsUploadingImage(false)
      }

      const url = editingBaggage
        ? `/api/baggages/${editingBaggage.id}`
        : "/api/baggages"

      const method = editingBaggage ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...baggageFormData,
          imageUrl,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao criar bagagem")
      }

      // Recarregar bagagens
      const baggagesResponse = await fetch("/api/baggages")
      if (baggagesResponse.ok) {
        const data = await baggagesResponse.json()
        setBaggages(
          data.map((baggage: any) => ({
            ...baggage,
            items: baggage.items.map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
            })),
          }))
        )
      }

      toast({
        title: "Sucesso",
        description: editingBaggage
          ? "Bagagem atualizada com sucesso"
          : "Bagagem criada com sucesso",
      })

      setCreatingBaggage(false)
      setEditingBaggage(null)
      setBaggageFormData({
        type: "",
        variant: "",
        name: "",
        imageUrl: "",
        familyMemberId: "",
        maxWeight: undefined,
      })
      setBaggageImageFile(null)
    } catch (error) {
      console.error("Erro ao criar bagagem:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao criar bagagem. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddItem = (baggage: Baggage) => {
    setItemFormData({
      name: "",
      description: "",
      weight: undefined,
      imageUrl: "",
      quantity: 1,
    })
    setItemImageFile(null)
    setSelectedBaggage(baggage)
    setAddingItem(true)
  }

  const handleSaveItem = async () => {
    if (!selectedBaggage || !itemFormData.name) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o nome do item",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      let imageUrl = itemFormData.imageUrl

      // Se houver arquivo para upload, fazer upload primeiro
      if (itemImageFile) {
        setIsUploadingImage(true)
        const uploadFormData = new FormData()
        uploadFormData.append("file", itemImageFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          throw new Error(uploadData.error || "Erro ao fazer upload da imagem")
        }

        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.url
        setIsUploadingImage(false)
      }

      const url = editingItem
        ? `/api/baggages/${selectedBaggage.id}/items/${editingItem.id}`
        : `/api/baggages/${selectedBaggage.id}/items`

      const method = editingItem ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...itemFormData,
          imageUrl,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao salvar item")
      }

      // Recarregar bagagens
      const baggagesResponse = await fetch("/api/baggages")
      if (baggagesResponse.ok) {
        const data = await baggagesResponse.json()
        setBaggages(
          data.map((baggage: any) => ({
            ...baggage,
            items: baggage.items.map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
            })),
          }))
        )
      }

      toast({
        title: "Sucesso",
        description: editingItem
          ? "Item atualizado com sucesso"
          : "Item adicionado com sucesso",
      })

      setAddingItem(false)
      setEditingItem(null)
      setSelectedBaggage(null)
      setItemFormData({
        name: "",
        description: "",
        weight: undefined,
        imageUrl: "",
        quantity: 1,
      })
      setItemImageFile(null)
    } catch (error) {
      console.error("Erro ao salvar item:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao salvar item. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setIsUploadingImage(false)
    }
  }

  const handleEditItem = (baggage: Baggage, item: BaggageItem) => {
    setItemFormData({
      name: item.name,
      description: item.description || "",
      weight: item.weight,
      imageUrl: item.imageUrl || "",
      quantity: item.quantity,
    })
    setItemImageFile(null)
    setSelectedBaggage(baggage)
    setEditingItem(item)
    setAddingItem(true)
  }

  const handleDeleteItem = async () => {
    if (!deletingItem || !selectedBaggage) return

    setIsSaving(true)

    try {
      const response = await fetch(
        `/api/baggages/${selectedBaggage.id}/items/${deletingItem.id}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao deletar item")
      }

      // Recarregar bagagens
      const baggagesResponse = await fetch("/api/baggages")
      if (baggagesResponse.ok) {
        const data = await baggagesResponse.json()
        setBaggages(
          data.map((baggage: any) => ({
            ...baggage,
            items: baggage.items.map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
            })),
          }))
        )
      }

      toast({
        title: "Sucesso",
        description: "Item excluído com sucesso",
      })

      setDeletingItem(null)
      setSelectedBaggage(null)
    } catch (error) {
      console.error("Erro ao deletar item:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao deletar item. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getMemberName = (memberId: string) => {
    return familyMembers.find((m) => m.id === memberId)?.fullName || "Desconhecido"
  }

  return (
    <MainLayout
      headerTitle="Bagagens"
      headerDescription="Organize as bagagens de cada membro da família"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Filtros e Botão */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filterMember} onValueChange={setFilterMember}>
                <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                  <SelectValue placeholder="Membro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Membros</SelectItem>
                  {familyMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  {BAGGAGE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleCreateBaggage}
            className="w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Criar Bagagem</span>
            <span className="sm:hidden">Criar</span>
          </Button>
        </div>

        {/* Lista de Bagagens */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredBaggages.length === 0 ? (
          <div className="rounded-lg border p-8 text-center bg-muted/40">
            <Luggage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {baggages.length === 0
                ? "Nenhuma bagagem criada ainda"
                : "Nenhuma bagagem encontrada com os filtros selecionados"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBaggages.map((baggage) => (
              <div
                key={baggage.id}
                className="rounded-lg border bg-card p-4 sm:p-6 space-y-4"
              >
                <div className="flex items-start gap-4">
                  {baggage.imageUrl ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={baggage.imageUrl}
                        alt={baggage.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Luggage className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{baggage.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {baggage.type} • {baggage.variant}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getMemberName(baggage.familyMemberId)}
                        </p>
                        {baggage.maxWeight && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Peso máximo: {baggage.maxWeight}kg
                          </p>
                        )}
                        {baggage.estimatedWeight && (
                          <p className="text-xs text-primary mt-1">
                            Peso estimado: {baggage.estimatedWeight.toFixed(2)}kg
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditBaggage(baggage)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Badge variant="secondary" className="ml-1">
                          {baggage.items.length} {baggage.items.length === 1 ? "item" : "itens"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {baggage.items.length > 0 ? (
                  <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-2">
                      {baggage.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-2 rounded border bg-muted/40 hover:bg-muted/60 transition-colors"
                        >
                          {item.imageUrl ? (
                            <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {item.name}
                            </p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>Qtd: {item.quantity}</span>
                              {item.weight && (
                                <>
                                  <span>•</span>
                                  <span>Peso: {item.weight}kg</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditItem(baggage, item)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => {
                                setSelectedBaggage(baggage)
                                setDeletingItem(item)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Nenhum item adicionado
                  </div>
                )}

                <Button
                  onClick={() => handleAddItem(baggage)}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Dialog de Criar/Editar Bagagem */}
        <Dialog open={creatingBaggage} onOpenChange={(open) => {
          if (!open) {
            setCreatingBaggage(false)
            setEditingBaggage(null)
            setBaggageFormData({
              type: "",
              variant: "",
              name: "",
              imageUrl: "",
              familyMemberId: "",
              maxWeight: undefined,
            })
            setBaggageImageFile(null)
          }
        }}>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBaggage ? "Editar Bagagem" : "Criar Bagagem"}</DialogTitle>
              <DialogDescription>
                {editingBaggage
                  ? "Edite as informações da bagagem"
                  : "Crie uma nova bagagem para um membro da família"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="baggageImage">Foto da Bagagem</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="baggageImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setBaggageImageFile(file)
                          setBaggageFormData({ ...baggageFormData, imageUrl: "" })
                        }
                      }}
                      className="cursor-pointer min-h-[44px] text-base flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({
                            video: { facingMode: "environment" },
                          })
                          const video = document.createElement("video")
                          video.srcObject = stream
                          video.play()

                          const canvas = document.createElement("canvas")
                          const ctx = canvas.getContext("2d")

                          video.addEventListener("loadedmetadata", () => {
                            canvas.width = video.videoWidth
                            canvas.height = video.videoHeight
                          })

                          const capturePhoto = () => {
                            ctx?.drawImage(video, 0, 0)
                            canvas.toBlob((blob) => {
                              if (blob) {
                                const file = new File([blob], "photo.jpg", {
                                  type: "image/jpeg",
                                })
                                setBaggageImageFile(file)
                                setBaggageFormData({ ...baggageFormData, imageUrl: "" })
                              }
                              stream.getTracks().forEach((track) => track.stop())
                            }, "image/jpeg", 0.9)
                          }

                          const dialog = document.createElement("div")
                          dialog.style.cssText =
                            "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;"

                          const videoElement = document.createElement("video")
                          videoElement.srcObject = stream
                          videoElement.style.cssText = "max-width: 90%; max-height: 70%; border-radius: 8px;"
                          videoElement.autoplay = true
                          videoElement.playsInline = true

                          const captureBtn = document.createElement("button")
                          captureBtn.textContent = "Capturar Foto"
                          captureBtn.style.cssText =
                            "padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;"
                          captureBtn.onclick = () => {
                            capturePhoto()
                            document.body.removeChild(dialog)
                          }

                          const cancelBtn = document.createElement("button")
                          cancelBtn.textContent = "Cancelar"
                          cancelBtn.style.cssText =
                            "padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;"
                          cancelBtn.onclick = () => {
                            stream.getTracks().forEach((track) => track.stop())
                            document.body.removeChild(dialog)
                          }

                          const btnContainer = document.createElement("div")
                          btnContainer.style.cssText = "display: flex; gap: 12px;"
                          btnContainer.appendChild(captureBtn)
                          btnContainer.appendChild(cancelBtn)

                          dialog.appendChild(videoElement)
                          dialog.appendChild(btnContainer)
                          document.body.appendChild(dialog)
                        } catch (error) {
                          console.error("Erro ao acessar câmera:", error)
                          toast({
                            title: "Erro",
                            description: "Não foi possível acessar a câmera",
                            variant: "destructive",
                          })
                        }
                      }}
                      className="min-h-[44px]"
                    >
                      📷 Tirar Foto
                    </Button>
                  </div>
                  {baggageImageFile && (
                    <div className="flex items-center gap-2 p-2 rounded border bg-muted/40">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">
                        {baggageImageFile.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setBaggageImageFile(null)
                          const input = document.getElementById(
                            "baggageImage"
                          ) as HTMLInputElement
                          if (input) input.value = ""
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {!baggageImageFile && baggageFormData.imageUrl && (
                    <div className="relative w-full h-32 rounded border overflow-hidden">
                      <Image
                        src={baggageFormData.imageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="baggageName">
                  Nome da Bagagem <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="baggageName"
                  value={baggageFormData.name}
                  onChange={(e) =>
                    setBaggageFormData({
                      ...baggageFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Ex: Mochila Principal, Mala Grande..."
                  className="min-h-[44px] text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baggageType">
                  Tipo de Bagagem <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={baggageFormData.type}
                  onValueChange={(value) =>
                    setBaggageFormData({
                      ...baggageFormData,
                      type: value,
                      maxWeight: value === "Mala" ? undefined : undefined,
                    })
                  }
                >
                  <SelectTrigger id="baggageType" className="min-h-[44px]">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {BAGGAGE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="baggageVariant">
                  Variante <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={baggageFormData.variant}
                  onValueChange={(value) =>
                    setBaggageFormData({ ...baggageFormData, variant: value })
                  }
                >
                  <SelectTrigger id="baggageVariant" className="min-h-[44px]">
                    <SelectValue placeholder="Selecione a variante" />
                  </SelectTrigger>
                  <SelectContent>
                    {BAGGAGE_VARIANTS.map((variant) => (
                      <SelectItem key={variant} value={variant}>
                        {variant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {baggageFormData.type === "Mala" && (
                <div className="space-y-2">
                  <Label htmlFor="baggageMaxWeight">
                    Peso Máximo (kg) <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={
                      baggageFormData.maxWeight
                        ? baggageFormData.maxWeight.toString()
                        : ""
                    }
                    onValueChange={(value) =>
                      setBaggageFormData({
                        ...baggageFormData,
                        maxWeight: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger id="baggageMaxWeight" className="min-h-[44px]">
                      <SelectValue placeholder="Selecione o peso máximo" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAX_WEIGHTS.map((weight) => (
                        <SelectItem key={weight} value={weight.toString()}>
                          {weight}kg
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="baggageMember">
                  Membro da Família <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={baggageFormData.familyMemberId}
                  onValueChange={(value) =>
                    setBaggageFormData({
                      ...baggageFormData,
                      familyMemberId: value,
                    })
                  }
                >
                  <SelectTrigger id="baggageMember" className="min-h-[44px]">
                    <SelectValue placeholder="Selecione o membro" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setCreatingBaggage(false)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveBaggage}
                disabled={isSaving || isUploadingImage}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {isSaving || isUploadingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploadingImage ? "Enviando..." : editingBaggage ? "Salvando..." : "Criando..."}
                  </>
                ) : editingBaggage ? (
                  "Salvar Alterações"
                ) : (
                  "Criar Bagagem"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Adicionar/Editar Item */}
        <Dialog open={addingItem} onOpenChange={(open) => !open && setAddingItem(false)}>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Item" : "Adicionar Item"}
              </DialogTitle>
              <DialogDescription>
                {selectedBaggage &&
                  `${selectedBaggage.type} - ${getMemberName(selectedBaggage.familyMemberId)}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="itemName"
                  value={itemFormData.name}
                  onChange={(e) =>
                    setItemFormData({ ...itemFormData, name: e.target.value })
                  }
                  placeholder="Ex: Roupas, Eletrônicos..."
                  className="min-h-[44px] text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemDescription">Descrição</Label>
                <Textarea
                  id="itemDescription"
                  value={itemFormData.description}
                  onChange={(e) =>
                    setItemFormData({
                      ...itemFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Descrição do item..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemWeight">Peso (kg)</Label>
                <Input
                  id="itemWeight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemFormData.weight || ""}
                  onChange={(e) =>
                    setItemFormData({
                      ...itemFormData,
                      weight: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="0.00"
                  className="min-h-[44px] text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemQuantity">Quantidade</Label>
                <Input
                  id="itemQuantity"
                  type="number"
                  min="1"
                  value={itemFormData.quantity}
                  onChange={(e) =>
                    setItemFormData({
                      ...itemFormData,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  className="min-h-[44px] text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemImage">Foto do Item</Label>
                <div className="space-y-2">
                  <Input
                    id="itemImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setItemImageFile(file)
                        setItemFormData({ ...itemFormData, imageUrl: "" })
                      }
                    }}
                    className="cursor-pointer min-h-[44px] text-base"
                  />
                  {itemImageFile && (
                    <div className="flex items-center gap-2 p-2 rounded border bg-muted/40">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">
                        {itemImageFile.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setItemImageFile(null)
                          const input = document.getElementById(
                            "itemImage"
                          ) as HTMLInputElement
                          if (input) input.value = ""
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {!itemImageFile && itemFormData.imageUrl && (
                    <div className="relative w-full h-32 rounded border overflow-hidden">
                      <Image
                        src={itemFormData.imageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setAddingItem(false)
                  setEditingItem(null)
                  setSelectedBaggage(null)
                  setItemFormData({
                    name: "",
                    description: "",
                    weight: undefined,
                    imageUrl: "",
                    quantity: 1,
                  })
                  setItemImageFile(null)
                }}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveItem}
                disabled={!itemFormData.name || isSaving || isUploadingImage}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {isSaving || isUploadingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploadingImage ? "Enviando..." : "Salvando..."}
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

        {/* Dialog de Confirmar Exclusão */}
        <AlertDialog
          open={!!deletingItem}
          onOpenChange={(open) => !open && setDeletingItem(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este item? Esta ação não pode
                ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="min-h-[44px]">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteItem}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[44px]"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  )
}
