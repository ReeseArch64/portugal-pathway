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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  AlertCircle,
  CheckSquare,
  Edit,
  Eye,
  Filter,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import { useEffect, useState } from "react"
import { MainLayout } from "../components/main-layout"

interface Task {
  id: string
  title: string
  description?: string
  status: "Pendente" | "Em andamento" | "Concluída" | "Cancelada"
  priority: "Baixa" | "Média" | "Alta"
  dueDate?: Date | null
  familyMemberId?: string
  familyMemberName?: string
  createdAt: Date
  completedAt?: Date | null
}

interface FamilyMember {
  id: string
  fullName: string
  relationship: string
}

const statusColors = {
  Pendente: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  "Em andamento": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Concluída: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  Cancelada: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

const priorityColors = {
  Baixa: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  Média: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  Alta: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

export default function TasksPage() {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterMember, setFilterMember] = useState("all")
  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [creatingTask, setCreatingTask] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Pendente" as Task["status"],
    priority: "Média" as Task["priority"],
    dueDate: "",
    familyMemberId: "",
  })

  // Carregar tarefas e membros da família
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Carregar tarefas
        const tasksResponse = await fetch("/api/tasks")
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setTasks(
            tasksData.map((task: any) => ({
              ...task,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              createdAt: new Date(task.createdAt),
              completedAt: task.completedAt ? new Date(task.completedAt) : null,
            }))
          )
        }

        // Carregar membros da família
        const membersResponse = await fetch("/api/family-members")
        if (membersResponse.ok) {
          const membersData = await membersResponse.json()
          setFamilyMembers(membersData)
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar tarefas e membros da família",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  const filteredTasks = tasks.filter((task) => {
    const statusMatch = filterStatus === "all" || task.status === filterStatus
    const priorityMatch =
      filterPriority === "all" || task.priority === filterPriority
    const memberMatch =
      filterMember === "all" || task.familyMemberId === filterMember
    return statusMatch && priorityMatch && memberMatch
  })

  const stats = {
    total: tasks.length,
    pendente: tasks.filter((t) => t.status === "Pendente").length,
    emAndamento: tasks.filter((t) => t.status === "Em andamento").length,
    concluida: tasks.filter((t) => t.status === "Concluída").length,
    cancelada: tasks.filter((t) => t.status === "Cancelada").length,
  }

  const handleCreateTask = () => {
    setFormData({
      title: "",
      description: "",
      status: "Pendente",
      priority: "Média",
      dueDate: "",
      familyMemberId: "",
    })
    setCreatingTask(true)
  }

  const handleEditTask = (task: Task) => {
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      familyMemberId: task.familyMemberId || "",
    })
    setEditingTask(task)
  }

  const handleSaveTask = async () => {
    if (!formData.title) {
      toast({
        title: "Erro",
        description: "O título é obrigatório",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      if (editingTask) {
        // Atualizar tarefa existente
        const response = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            status: formData.status,
            priority: formData.priority,
            dueDate: formData.dueDate || null,
            familyMemberId: formData.familyMemberId || null,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao atualizar tarefa")
        }

        // Recarregar tarefas
        const tasksResponse = await fetch("/api/tasks")
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setTasks(
            tasksData.map((task: any) => ({
              ...task,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              createdAt: new Date(task.createdAt),
              completedAt: task.completedAt ? new Date(task.completedAt) : null,
            }))
          )
        }

        toast({
          title: "Sucesso",
          description: "Tarefa atualizada com sucesso",
        })
        setEditingTask(null)
      } else {
        // Criar nova tarefa
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            status: formData.status,
            priority: formData.priority,
            dueDate: formData.dueDate || null,
            familyMemberId: formData.familyMemberId || null,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao criar tarefa")
        }

        // Recarregar tarefas
        const tasksResponse = await fetch("/api/tasks")
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setTasks(
            tasksData.map((task: any) => ({
              ...task,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              createdAt: new Date(task.createdAt),
              completedAt: task.completedAt ? new Date(task.completedAt) : null,
            }))
          )
        }

        toast({
          title: "Sucesso",
          description: "Tarefa criada com sucesso",
        })
        setCreatingTask(false)
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        status: "Pendente",
        priority: "Média",
        dueDate: "",
        familyMemberId: "",
      })
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao salvar tarefa. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!deletingTask) return

    try {
      const response = await fetch(`/api/tasks/${deletingTask.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao deletar tarefa")
      }

      // Recarregar tarefas
      const tasksResponse = await fetch("/api/tasks")
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        setTasks(
          tasksData.map((task: any) => ({
            ...task,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            createdAt: new Date(task.createdAt),
            completedAt: task.completedAt ? new Date(task.completedAt) : null,
          }))
        )
      }

      toast({
        title: "Sucesso",
        description: "Tarefa excluída com sucesso",
      })
      setDeletingTask(null)
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao deletar tarefa. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingTask(null)
    setCreatingTask(false)
    setFormData({
      title: "",
      description: "",
      status: "Pendente",
      priority: "Média",
      dueDate: "",
      familyMemberId: "",
    })
  }

  const isOverdue = (dueDate: Date | null | undefined, status: Task["status"]) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && status !== "Concluída"
  }

  return (
    <MainLayout
      headerTitle="Tarefas"
      headerDescription="Gerencie todas as tarefas da família"
    >
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-5">
          {[
            { label: "Total", value: stats.total },
            { label: "Pendente", value: stats.pendente },
            { label: "Em Andamento", value: stats.emAndamento },
            { label: "Concluída", value: stats.concluida },
            { label: "Cancelada", value: stats.cancelada },
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

        {/* Filtros e Botão de Adicionar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMember} onValueChange={setFilterMember}>
              <SelectTrigger className="w-[180px]">
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
          </div>
          <Button onClick={handleCreateTask}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Tarefa
          </Button>
        </div>

        {/* Lista de Tarefas */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-lg border bg-card p-6 shadow-sm ${
                isOverdue(task.dueDate, task.status) ? "border-red-500/50" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{task.title}</h3>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <Badge
                        variant="outline"
                        className={statusColors[task.status]}
                      >
                        {task.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={priorityColors[task.priority]}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="space-y-2 text-sm mb-4">
                {task.familyMemberName && (
                  <p>
                    <strong>Responsável:</strong> {task.familyMemberName}
                  </p>
                )}
                {task.dueDate && (
                  <p
                    className={
                      isOverdue(task.dueDate, task.status)
                        ? "text-red-600 dark:text-red-400 font-semibold"
                        : ""
                    }
                  >
                    <strong>Prazo:</strong>{" "}
                    {new Date(task.dueDate).toLocaleDateString("pt-PT")}
                    {isOverdue(task.dueDate, task.status) && " (Atrasado)"}
                  </p>
                )}
                {task.completedAt && (
                  <p className="text-xs text-muted-foreground">
                    Concluída em:{" "}
                    {new Date(task.completedAt).toLocaleDateString("pt-PT")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Criada em: {task.createdAt.toLocaleDateString("pt-PT")}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setViewingTask(task)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditTask(task)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingTask(task)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            ))}
          </div>
        )}

        {!isLoading && filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma tarefa encontrada.
            </p>
          </div>
        )}

        {/* Dialog de Visualização */}
        <Dialog
          open={!!viewingTask}
          onOpenChange={(open) => !open && setViewingTask(null)}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes da Tarefa</DialogTitle>
              <DialogDescription>
                Informações completas da tarefa
              </DialogDescription>
            </DialogHeader>
            {viewingTask && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-muted-foreground">Título</Label>
                  <p className="text-base font-semibold">{viewingTask.title}</p>
                </div>
                {viewingTask.description && (
                  <div>
                    <Label className="text-muted-foreground">Descrição</Label>
                    <p className="text-base">{viewingTask.description}</p>
                  </div>
                )}
                <div className="flex gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={statusColors[viewingTask.status]}
                      >
                        {viewingTask.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Prioridade</Label>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={priorityColors[viewingTask.priority]}
                      >
                        {viewingTask.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
                {viewingTask.familyMemberName && (
                  <div>
                    <Label className="text-muted-foreground">
                      Responsável
                    </Label>
                    <p className="text-base">
                      {viewingTask.familyMemberName}
                    </p>
                  </div>
                )}
                {viewingTask.dueDate && (
                  <div>
                    <Label className="text-muted-foreground">Prazo</Label>
                    <p
                      className={`text-base ${
                        isOverdue(viewingTask.dueDate, viewingTask.status)
                          ? "text-red-600 dark:text-red-400 font-semibold"
                          : ""
                      }`}
                    >
                      {new Date(viewingTask.dueDate).toLocaleDateString(
                        "pt-PT"
                      )}
                      {isOverdue(viewingTask.dueDate, viewingTask.status) && " (Atrasado)"}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">
                    Data de Criação
                  </Label>
                  <p className="text-base">
                    {viewingTask.createdAt.toLocaleDateString("pt-PT")}
                  </p>
                </div>
                {viewingTask.completedAt && (
                  <div>
                    <Label className="text-muted-foreground">
                      Data de Conclusão
                    </Label>
                    <p className="text-base">
                      {new Date(viewingTask.completedAt).toLocaleDateString(
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
                onClick={() => setViewingTask(null)}
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  if (viewingTask) {
                    handleEditTask(viewingTask)
                    setViewingTask(null)
                  }
                }}
              >
                Editar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Criar/Editar */}
        <Dialog
          open={creatingTask || !!editingTask}
          onOpenChange={(open) => {
            if (!open) {
              handleCancelEdit()
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Editar Tarefa" : "Adicionar Nova Tarefa"}
              </DialogTitle>
              <DialogDescription>
                {editingTask
                  ? "Atualize as informações da tarefa"
                  : "Preencha os dados da nova tarefa"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Renovar passaporte"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descrição detalhada da tarefa"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        status: value as Task["status"],
                      })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Em andamento">Em andamento</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                      <SelectItem value="Cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        priority: value as Task["priority"],
                      })
                    }
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="familyMember">Responsável</Label>
                <Select
                  value={formData.familyMemberId || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, familyMemberId: value || "" })
                  }
                >
                  <SelectTrigger id="familyMember">
                    <SelectValue placeholder="Selecione um responsável (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum (opcional)</SelectItem>
                    {familyMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTask}
                disabled={!formData.title || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : editingTask ? (
                  "Salvar Alterações"
                ) : (
                  "Adicionar Tarefa"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog
          open={!!deletingTask}
          onOpenChange={(open) => !open && setDeletingTask(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a tarefa{" "}
                <strong>{deletingTask?.title}</strong>? Esta ação não pode ser
                desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTask}
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
