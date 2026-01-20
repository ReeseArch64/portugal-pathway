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
import { useToast } from "@/hooks/use-toast"
import {
  AlertCircle,
  Edit,
  Eye,
  Filter,
  Loader2,
  Plus,
  Trash2,
  Users,
} from "lucide-react"
import { useEffect, useState } from "react"
import { MainLayout } from "../components/main-layout"

interface FamilyMember {
  id: string
  fullName: string
  relationship: string
  username: string
  dateOfBirth?: Date | null
  resetPassword?: boolean
  createdAt?: Date
}

const relationships = [
  "Titular",
  "Cônjuge",
  "Filho(a)",
  "Pai",
  "Mãe",
  "Irmão(ã)",
]

export default function UsersPage() {
  const { toast } = useToast()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [filterRelationship, setFilterRelationship] = useState("all")
  const [viewingMember, setViewingMember] = useState<FamilyMember | null>(null)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [deletingMember, setDeletingMember] = useState<FamilyMember | null>(null)
  const [creatingMember, setCreatingMember] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    relationship: "",
    username: "",
    dateOfBirth: "",
    resetPassword: false,
  })

  // Carregar membros da família
  useEffect(() => {
    const loadMembers = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/family-members")
        if (response.ok) {
          const data = await response.json()
          setMembers(
            data.map((member: any) => ({
              ...member,
              dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
              createdAt: member.createdAt ? new Date(member.createdAt) : undefined,
            }))
          )
        } else {
          toast({
            title: "Erro",
            description: "Erro ao carregar membros da família",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Erro ao carregar membros:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar membros da família",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadMembers()
  }, [toast])

  const filteredMembers =
    filterRelationship === "all"
      ? members
      : members.filter((m) => m.relationship === filterRelationship)

  const calculateAge = (date: Date | null | undefined) => {
    if (!date) return null
    const diff = new Date().getTime() - date.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  const getRelationshipColor = (relationship: string) => {
    if (relationship === "Titular")
      return "bg-primary/10 text-primary border-primary/20"
    if (relationship === "Cônjuge")
      return "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20"
    if (relationship.includes("Filho"))
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
    return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
  }

  const stats = {
    total: members.length,
    titular: members.filter((m) => m.relationship === "Titular").length,
    conjuges: members.filter((m) => m.relationship === "Cônjuge").length,
    filhos: members.filter((m) => m.relationship.includes("Filho")).length,
  }

  const handleCreateMember = () => {
    setFormData({
      fullName: "",
      relationship: "",
      username: "",
      dateOfBirth: "",
      resetPassword: false,
    })
    setCreatingMember(true)
  }

  const handleEditMember = (member: FamilyMember) => {
    setFormData({
      fullName: member.fullName,
      relationship: member.relationship,
      username: member.username,
      dateOfBirth: member.dateOfBirth
        ? new Date(member.dateOfBirth).toISOString().split("T")[0]
        : "",
      resetPassword: member.resetPassword || false,
    })
    setEditingMember(member)
  }

  const handleSaveMember = async () => {
    if (!formData.fullName || !formData.relationship || !formData.username) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      if (editingMember) {
        // Atualizar membro existente
        const response = await fetch(`/api/family-members/${editingMember.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            relationship: formData.relationship,
            username: formData.username,
            dateOfBirth: formData.dateOfBirth || null,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao atualizar membro")
        }

        // Recarregar membros
        const membersResponse = await fetch("/api/family-members")
        if (membersResponse.ok) {
          const data = await membersResponse.json()
          setMembers(
            data.map((member: any) => ({
              ...member,
              dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
              createdAt: member.createdAt ? new Date(member.createdAt) : undefined,
            }))
          )
        }

        toast({
          title: "Sucesso",
          description: "Membro da família atualizado com sucesso",
        })
        setEditingMember(null)
      } else {
        // Criar novo membro
        const response = await fetch("/api/family-members", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            relationship: formData.relationship,
            username: formData.username,
            dateOfBirth: formData.dateOfBirth || null,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao criar membro")
        }

        // Recarregar membros
        const membersResponse = await fetch("/api/family-members")
        if (membersResponse.ok) {
          const data = await membersResponse.json()
          setMembers(
            data.map((member: any) => ({
              ...member,
              dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
              createdAt: member.createdAt ? new Date(member.createdAt) : undefined,
            }))
          )
        }

        toast({
          title: "Sucesso",
          description: "Membro da família criado com sucesso",
        })
        setCreatingMember(false)
      }

      // Reset form
      setFormData({
        fullName: "",
        relationship: "",
        username: "",
        dateOfBirth: "",
        resetPassword: false,
      })
    } catch (error) {
      console.error("Erro ao salvar membro:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao salvar membro. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteMember = async () => {
    if (!deletingMember) return

    try {
      const response = await fetch(`/api/family-members/${deletingMember.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao deletar membro")
      }

      // Recarregar membros
      const membersResponse = await fetch("/api/family-members")
      if (membersResponse.ok) {
        const data = await membersResponse.json()
        setMembers(
          data.map((member: any) => ({
            ...member,
            dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
            createdAt: member.createdAt ? new Date(member.createdAt) : undefined,
          }))
        )
      }

      toast({
        title: "Sucesso",
        description: "Membro da família excluído com sucesso",
      })
      setDeletingMember(null)
    } catch (error) {
      console.error("Erro ao deletar membro:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao deletar membro. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingMember(null)
    setCreatingMember(false)
    setFormData({
      fullName: "",
      relationship: "",
      username: "",
      dateOfBirth: "",
      resetPassword: false,
    })
  }

  return (
    <MainLayout
      headerTitle="Membros da Família"
      headerDescription="Visualização estática dos membros"
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: "Total", value: stats.total },
            { label: "Titular", value: stats.titular },
            { label: "Cônjuges", value: stats.conjuges },
            { label: "Filhos", value: stats.filhos },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border p-3 sm:p-4 bg-muted/40"
            >
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={filterRelationship} onValueChange={setFilterRelationship}>
              <SelectTrigger className="w-full sm:w-[200px] min-h-[44px]">
                <SelectValue placeholder="Parentesco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {relationships.map((rel) => (
                  <SelectItem key={rel} value={rel}>
                    {rel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateMember} className="w-full sm:w-auto min-h-[44px]">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Adicionar Membro</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="rounded-lg border bg-card p-4 sm:p-6 shadow-sm"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{member.fullName}</h3>
                    <Badge
                      variant="outline"
                      className={`${getRelationshipColor(member.relationship)} text-xs mt-1`}
                    >
                      {member.relationship}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs sm:text-sm truncate">
                  <strong>Username:</strong> {member.username}
                </p>
                {member.dateOfBirth && (
                  <p className="text-xs sm:text-sm">
                    <strong>Idade:</strong> {calculateAge(member.dateOfBirth)} anos
                  </p>
                )}

                <div className="flex gap-2 mt-3 sm:mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 min-h-[44px] text-xs sm:text-sm"
                    onClick={() => setViewingMember(member)}
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Ver</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 min-h-[44px] text-xs sm:text-sm"
                    onClick={() => handleEditMember(member)}
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingMember(member)}
                    className="text-destructive hover:text-destructive min-h-[44px] min-w-[44px]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum membro encontrado.
            </p>
          </div>
        )}

        {/* Dialog de Visualização */}
        <Dialog
          open={!!viewingMember}
          onOpenChange={(open) => !open && setViewingMember(null)}
        >
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Detalhes do Membro</DialogTitle>
              <DialogDescription className="text-sm">
                Informações completas do membro da família
              </DialogDescription>
            </DialogHeader>
            {viewingMember && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-muted-foreground">Nome Completo</Label>
                  <p className="text-base font-semibold">
                    {viewingMember.fullName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Parentesco</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={getRelationshipColor(viewingMember.relationship)}
                    >
                      {viewingMember.relationship}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Username</Label>
                  <p className="text-base">{viewingMember.username}</p>
                </div>
                {viewingMember.dateOfBirth && (
                  <div>
                    <Label className="text-muted-foreground">
                      Data de Nascimento
                    </Label>
                    <p className="text-base">
                      {new Date(viewingMember.dateOfBirth).toLocaleDateString(
                        "pt-PT"
                      )}{" "}
                      ({calculateAge(viewingMember.dateOfBirth)} anos)
                    </p>
                  </div>
                )}
                {viewingMember.createdAt && (
                  <div>
                    <Label className="text-muted-foreground">
                      Data de Criação
                    </Label>
                    <p className="text-base">
                      {new Date(viewingMember.createdAt).toLocaleDateString(
                        "pt-PT"
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setViewingMember(null)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  if (viewingMember) {
                    handleEditMember(viewingMember)
                    setViewingMember(null)
                  }
                }}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Editar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Criar/Editar */}
        <Dialog
          open={creatingMember || !!editingMember}
          onOpenChange={(open) => {
            if (!open) {
              handleCancelEdit()
            }
          }}
        >
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingMember ? "Editar Membro" : "Adicionar Novo Membro"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingMember
                  ? "Atualize as informações do membro da família"
                  : "Preencha os dados do novo membro da família"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="João Silva"
                  className="min-h-[44px] text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship">
                  Parentesco <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.relationship}
                  onValueChange={(value) =>
                    setFormData({ ...formData, relationship: value })
                  }
                >
                  <SelectTrigger id="relationship" className="min-h-[44px]">
                    <SelectValue placeholder="Selecione o parentesco" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationships.map((rel) => (
                      <SelectItem key={rel} value={rel}>
                        {rel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="joao.silva"
                  className="min-h-[44px] text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                  className="min-h-[44px] text-base"
                />
              </div>

            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveMember}
                disabled={
                  !formData.fullName ||
                  !formData.relationship ||
                  !formData.username ||
                  isSaving
                }
                className="w-full sm:w-auto min-h-[44px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : editingMember ? (
                  "Salvar Alterações"
                ) : (
                  "Adicionar Membro"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog
          open={!!deletingMember}
          onOpenChange={(open) => !open && setDeletingMember(null)}
        >
          <AlertDialogContent className="max-w-[95vw] sm:max-w-[500px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o membro{" "}
                <strong>{deletingMember?.fullName}</strong>? Esta ação não pode ser
                desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel className="w-full sm:w-auto min-h-[44px]">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteMember}
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
