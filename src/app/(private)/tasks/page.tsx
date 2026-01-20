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
import {
  AlertCircle,
  CheckSquare,
  Edit,
  Eye,
  Filter,
  Plus,
  Trash2,
} from "lucide-react"
import { useState } from "react"
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

const STATIC_MEMBERS = [
  { id: "1", fullName: "João Silva" },
  { id: "2", fullName: "Maria Silva" },
  { id: "3", fullName: "Pedro Silva" },
]

const STATIC_TASKS: Task[] = [
  {
    id: "1",
    title: "Renovar passaporte",
    description: "Renovar passaporte de todos os membros da família",
    status: "Concluída",
    priority: "Alta",
    dueDate: new Date(2024, 2, 15),
    familyMemberId: "1",
    familyMemberName: "João Silva",
    createdAt: new Date(2024, 0, 10),
    completedAt: new Date(2024, 2, 10),
  },
  {
    id: "2",
    title: "Traduzir documentos",
    description: "Traduzir certidões de nascimento e casamento",
    status: "Em andamento",
    priority: "Média",
    dueDate: new Date(2024, 3, 1),
    familyMemberId: "2",
    familyMemberName: "Maria Silva",
    createdAt: new Date(2024, 1, 5),
  },
  {
    id: "3",
    title: "Agendar entrevista",
    description: "Agendar entrevista no consulado",
    status: "Pendente",
    priority: "Alta",
    dueDate: new Date(2024, 3, 20),
    createdAt: new Date(2024, 2, 1),
  },
  {
    id: "4",
    title: "Obter certidão de nascimento",
    description: "Solicitar certidão de nascimento atualizada",
    status: "Pendente",
    priority: "Média",
    dueDate: new Date(2024, 2, 30),
    familyMemberId: "3",
    familyMemberName: "Pedro Silva",
    createdAt: new Date(2024, 2, 5),
  },
]

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
  const [tasks, setTasks] = useState<Task[]>(STATIC_TASKS)
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

  const handleSaveTask = () => {
    if (!formData.title) {
      return
    }

    if (editingTask) {
      // Atualizar tarefa existente
      setTasks(
        tasks.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: formData.title,
                description: formData.description,
                status: formData.status,
                priority: formData.priority,
                dueDate: formData.dueDate
                  ? new Date(formData.dueDate)
                  : null,
                familyMemberId: formData.familyMemberId || undefined,
                familyMemberName: formData.familyMemberId
                  ? STATIC_MEMBERS.find((m) => m.id === formData.familyMemberId)
                      ?.fullName
                  : undefined,
                completedAt:
                  formData.status === "Concluída" && t.status !== "Concluída"
                    ? new Date()
                    : formData.status === "Concluída"
                      ? t.completedAt
                      : null,
              }
            : t
        )
      )
      setEditingTask(null)
    } else {
      // Criar nova tarefa
      const newTask: Task = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        familyMemberId: formData.familyMemberId || undefined,
        familyMemberName: formData.familyMemberId
          ? STATIC_MEMBERS.find((m) => m.id === formData.familyMemberId)?.fullName
          : undefined,
        createdAt: new Date(),
        completedAt: formData.status === "Concluída" ? new Date() : null,
      }
      setTasks([...tasks, newTask])
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
  }

  const handleDeleteTask = () => {
    if (deletingTask) {
      setTasks(tasks.filter((t) => t.id !== deletingTask.id))
      setDeletingTask(null)
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

  const isOverdue = (dueDate: Date | null | undefined) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && !tasks.find((t) => t.dueDate === dueDate && t.status === "Concluída")
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
                {STATIC_MEMBERS.map((member) => (
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-lg border bg-card p-6 shadow-sm ${
                isOverdue(task.dueDate) ? "border-red-500/50" : ""
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
                      isOverdue(task.dueDate)
                        ? "text-red-600 dark:text-red-400 font-semibold"
                        : ""
                    }
                  >
                    <strong>Prazo:</strong>{" "}
                    {new Date(task.dueDate).toLocaleDateString("pt-PT")}
                    {isOverdue(task.dueDate) && " (Atrasado)"}
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

        {filteredTasks.length === 0 && (
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
                        isOverdue(viewingTask.dueDate)
                          ? "text-red-600 dark:text-red-400 font-semibold"
                          : ""
                      }`}
                    >
                      {new Date(viewingTask.dueDate).toLocaleDateString(
                        "pt-PT"
                      )}
                      {isOverdue(viewingTask.dueDate) && " (Atrasado)"}
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
                    {STATIC_MEMBERS.map((member) => (
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
              <Button onClick={handleSaveTask} disabled={!formData.title}>
                {editingTask ? "Salvar Alterações" : "Adicionar Tarefa"}
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
