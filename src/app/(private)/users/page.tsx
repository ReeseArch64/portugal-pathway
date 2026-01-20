"use client"

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
  AlertCircle,
  Edit,
  Eye,
  Filter,
  Plus,
  Users,
} from "lucide-react"
import { useState } from "react"
import { MainLayout } from "../components/main-layout"

interface FamilyMember {
  id: string
  fullName: string
  relationship: string
  username: string
  dateOfBirth?: Date | null
  resetPassword: boolean
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

const STATIC_MEMBERS: FamilyMember[] = [
  {
    id: "1",
    fullName: "João Silva",
    relationship: "Titular",
    username: "joao.silva",
    dateOfBirth: new Date(1988, 4, 10),
    resetPassword: false,
    createdAt: new Date(),
  },
  {
    id: "2",
    fullName: "Maria Silva",
    relationship: "Cônjuge",
    username: "maria.silva",
    dateOfBirth: new Date(1990, 8, 22),
    resetPassword: true,
    createdAt: new Date(),
  },
  {
    id: "3",
    fullName: "Pedro Silva",
    relationship: "Filho(a)",
    username: "pedro.silva",
    dateOfBirth: new Date(2015, 2, 5),
    resetPassword: false,
    createdAt: new Date(),
  },
]

export default function UsersPage() {
  const [members, setMembers] = useState<FamilyMember[]>(STATIC_MEMBERS)
  const [filterRelationship, setFilterRelationship] = useState("all")
  const [viewingMember, setViewingMember] = useState<FamilyMember | null>(null)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [creatingMember, setCreatingMember] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    relationship: "",
    username: "",
    dateOfBirth: "",
    resetPassword: false,
  })

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
      resetPassword: member.resetPassword,
    })
    setEditingMember(member)
  }

  const handleSaveMember = () => {
    if (!formData.fullName || !formData.relationship || !formData.username) {
      return
    }

    if (editingMember) {
      // Atualizar membro existente
      setMembers(
        members.map((m) =>
          m.id === editingMember.id
            ? {
              ...m,
              fullName: formData.fullName,
              relationship: formData.relationship,
              username: formData.username,
              dateOfBirth: formData.dateOfBirth
                ? new Date(formData.dateOfBirth)
                : null,
              resetPassword: formData.resetPassword,
            }
            : m
        )
      )
      setEditingMember(null)
    } else {
      // Criar novo membro
      const newMember: FamilyMember = {
        id: Date.now().toString(),
        fullName: formData.fullName,
        relationship: formData.relationship,
        username: formData.username,
        dateOfBirth: formData.dateOfBirth
          ? new Date(formData.dateOfBirth)
          : null,
        resetPassword: formData.resetPassword,
        createdAt: new Date(),
      }
      setMembers([...members, newMember])
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
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total", value: stats.total },
            { label: "Titular", value: stats.titular },
            { label: "Cônjuges", value: stats.conjuges },
            { label: "Filhos", value: stats.filhos },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border p-4 bg-muted/40"
            >
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterRelationship} onValueChange={setFilterRelationship}>
              <SelectTrigger className="w-[200px]">
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
          <Button onClick={handleCreateMember}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Membro
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-lg border bg-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{member.fullName}</h3>
                  <Badge
                    variant="outline"
                    className={getRelationshipColor(member.relationship)}
                  >
                    {member.relationship}
                  </Badge>
                </div>
              </div>
              <p className="text-sm">
                <strong>Username:</strong> {member.username}
              </p>
              {member.dateOfBirth && (
                <p className="text-sm">
                  <strong>Idade:</strong> {calculateAge(member.dateOfBirth)} anos
                </p>
              )}

              <div className="flex gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setViewingMember(member)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditMember(member)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
        {filteredMembers.length === 0 && (
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Membro</DialogTitle>
              <DialogDescription>
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
                <div>
                  <Label className="text-muted-foreground">
                    Reset de Senha
                  </Label>
                  <p className="text-base">
                    {viewingMember.resetPassword ? "Sim" : "Não"}
                  </p>
                </div>
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
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewingMember(null)}
              >
                Fechar
              </Button>
              <Button onClick={() => {
                if (viewingMember) {
                  handleEditMember(viewingMember)
                  setViewingMember(null)
                }
              }}>
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
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? "Editar Membro" : "Adicionar Novo Membro"}
              </DialogTitle>
              <DialogDescription>
                {editingMember
                  ? "Atualize as informações do membro da família"
                  : "Preencha os dados do novo membro da família"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
                  <SelectTrigger id="relationship">
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
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="resetPassword"
                  checked={formData.resetPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      resetPassword: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="resetPassword" className="cursor-pointer">
                  Requer reset de senha
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveMember}
                disabled={
                  !formData.fullName ||
                  !formData.relationship ||
                  !formData.username
                }
              >
                {editingMember ? "Salvar Alterações" : "Adicionar Membro"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
