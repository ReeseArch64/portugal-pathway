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
  AlertCircle,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Plus,
  Trash2,
  X
} from "lucide-react"
import { useState } from "react"
import { MainLayout } from "../components/main-layout"

interface Document {
  id: string
  name: string
  description?: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: Date
  familyMemberId?: string
  familyMemberName?: string
  taskId?: string
  taskTitle?: string
  status: "Pendente" | "Aprovado" | "Rejeitado"
}

const STATIC_MEMBERS = [
  { id: "1", fullName: "João Silva" },
  { id: "2", fullName: "Maria Silva" },
  { id: "3", fullName: "Pedro Silva" },
]

const STATIC_TASKS = [
  { id: "1", title: "Renovar passaporte" },
  { id: "2", title: "Traduzir documentos" },
  { id: "3", title: "Agendar entrevista" },
  { id: "4", title: "Obter certidão de nascimento" },
]

const STATIC_DOCUMENTS: Document[] = [
  {
    id: "1",
    name: "Passaporte",
    description: "Passaporte válido",
    fileName: "passaporte.pdf",
    fileSize: 2048576,
    fileType: "application/pdf",
    uploadedAt: new Date(2024, 0, 15),
    familyMemberId: "1",
    familyMemberName: "João Silva",
    taskId: "1",
    taskTitle: "Renovar passaporte",
    status: "Aprovado",
  },
  {
    id: "2",
    name: "Visto",
    description: "Documento de visto",
    fileName: "visto.pdf",
    fileSize: 1536000,
    fileType: "application/pdf",
    uploadedAt: new Date(2024, 1, 20),
    familyMemberId: "2",
    familyMemberName: "Maria Silva",
    status: "Pendente",
  },
  {
    id: "3",
    name: "Certidão de Nascimento",
    description: "Certidão de nascimento traduzida",
    fileName: "certidao.pdf",
    fileSize: 1024000,
    fileType: "application/pdf",
    uploadedAt: new Date(2024, 2, 10),
    familyMemberId: "3",
    familyMemberName: "Pedro Silva",
    taskId: "2",
    taskTitle: "Traduzir documentos",
    status: "Aprovado",
  },
]

const statusColors = {
  Pendente: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  Aprovado: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  Rejeitado: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(STATIC_DOCUMENTS)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterMember, setFilterMember] = useState("all")
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null)
  const [creatingDocument, setCreatingDocument] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    familyMemberId: "",
    taskId: "",
    status: "Pendente" as Document["status"],
  })

  const filteredDocuments = documents.filter((doc) => {
    const statusMatch = filterStatus === "all" || doc.status === filterStatus
    const memberMatch = filterMember === "all" || doc.familyMemberId === filterMember
    return statusMatch && memberMatch
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const stats = {
    total: documents.length,
    pendente: documents.filter((d) => d.status === "Pendente").length,
    aprovado: documents.filter((d) => d.status === "Aprovado").length,
    rejeitado: documents.filter((d) => d.status === "Rejeitado").length,
  }

  const handleCreateDocument = () => {
    setFormData({
      name: "",
      description: "",
      familyMemberId: "",
      taskId: "",
      status: "Pendente",
    })
    setUploadedFile(null)
    setCreatingDocument(true)
  }

  const handleEditDocument = (document: Document) => {
    setFormData({
      name: document.name,
      description: document.description || "",
      familyMemberId: document.familyMemberId || "",
      taskId: document.taskId || "",
      status: document.status,
    })
    setUploadedFile(null)
    setEditingDocument(document)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)

      if (!formData.name) {
        setFormData({ ...formData, name: file.name.replace(/\.[^/.]+$/, "") })
      }
    }
  }

  const handleSaveDocument = () => {
    if (!formData.name || !uploadedFile) {
      return
    }

    if (editingDocument) {
      // Atualizar documento existente
      const updatedFile = uploadedFile || {
        name: editingDocument.fileName,
        size: editingDocument.fileSize,
        type: editingDocument.fileType,
      } as File

      setDocuments(
        documents.map((d) =>
          d.id === editingDocument.id
            ? {
              ...d,
              name: formData.name,
              description: formData.description,
              familyMemberId: formData.familyMemberId || undefined,
              familyMemberName: formData.familyMemberId
                ? STATIC_MEMBERS.find((m) => m.id === formData.familyMemberId)?.fullName
                : undefined,
              taskId: formData.taskId || undefined,
              taskTitle: formData.taskId
                ? STATIC_TASKS.find((t) => t.id === formData.taskId)?.title
                : undefined,
              status: formData.status,
              fileName: updatedFile.name,
              fileSize: updatedFile.size,
              fileType: updatedFile.type,
            }
            : d
        )
      )
      setEditingDocument(null)
    } else {
      // Criar novo documento
      const newDocument: Document = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        fileType: uploadedFile.type,
        uploadedAt: new Date(),
        familyMemberId: formData.familyMemberId || undefined,
        familyMemberName: formData.familyMemberId
          ? STATIC_MEMBERS.find((m) => m.id === formData.familyMemberId)?.fullName
          : undefined,
        taskId: formData.taskId || undefined,
        taskTitle: formData.taskId
          ? STATIC_TASKS.find((t) => t.id === formData.taskId)?.title
          : undefined,
        status: formData.status,
      }
      setDocuments([...documents, newDocument])
      setCreatingDocument(false)
    }

    // Reset form
    setFormData({
      name: "",
      description: "",
      familyMemberId: "",
      taskId: "",
      status: "Pendente",
    })
    setUploadedFile(null)
  }

  const handleDeleteDocument = () => {
    if (deletingDocument) {
      setDocuments(documents.filter((d) => d.id !== deletingDocument.id))
      setDeletingDocument(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingDocument(null)
    setCreatingDocument(false)
    setFormData({
      name: "",
      description: "",
      familyMemberId: "",
      taskId: "",
      status: "Pendente",
    })
    setUploadedFile(null)
  }

  return (
    <MainLayout
      headerTitle="Documentos"
      headerDescription="Gerencie todos os documentos da família"
    >
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total", value: stats.total },
            { label: "Pendente", value: stats.pendente },
            { label: "Aprovado", value: stats.aprovado },
            { label: "Rejeitado", value: stats.rejeitado },
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
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMember} onValueChange={setFilterMember}>
              <SelectTrigger className="w-full">
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
          <Button onClick={handleCreateDocument}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Documento
          </Button>
        </div>

        {/* Lista de Documentos */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              className="rounded-lg border bg-card p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{document.name}</h3>
                    <Badge
                      variant="outline"
                      className={statusColors[document.status]}
                    >
                      {document.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {document.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {document.description}
                </p>
              )}

              <div className="space-y-2 text-sm mb-4">
                <p>
                  <strong>Arquivo:</strong> {document.fileName}
                </p>
                <p>
                  <strong>Tamanho:</strong> {formatFileSize(document.fileSize)}
                </p>
                {document.familyMemberName && (
                  <p>
                    <strong>Membro:</strong> {document.familyMemberName}
                  </p>
                )}
                {document.taskTitle && (
                  <p>
                    <strong>Tarefa:</strong> {document.taskTitle}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {document.uploadedAt.toLocaleDateString("pt-PT")}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setViewingDocument(document)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditDocument(document)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingDocument(document)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum documento encontrado.
            </p>
          </div>
        )}

        {/* Dialog de Visualização */}
        <Dialog
          open={!!viewingDocument}
          onOpenChange={(open) => !open && setViewingDocument(null)}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Documento</DialogTitle>
              <DialogDescription>
                Informações completas do documento
              </DialogDescription>
            </DialogHeader>
            {viewingDocument && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-muted-foreground">Nome</Label>
                  <p className="text-base font-semibold">
                    {viewingDocument.name}
                  </p>
                </div>
                {viewingDocument.description && (
                  <div>
                    <Label className="text-muted-foreground">Descrição</Label>
                    <p className="text-base">{viewingDocument.description}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Arquivo</Label>
                  <p className="text-base">{viewingDocument.fileName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tamanho</Label>
                  <p className="text-base">
                    {formatFileSize(viewingDocument.fileSize)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p className="text-base">{viewingDocument.fileType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={statusColors[viewingDocument.status]}
                    >
                      {viewingDocument.status}
                    </Badge>
                  </div>
                </div>
                {viewingDocument.familyMemberName && (
                  <div>
                    <Label className="text-muted-foreground">
                      Membro da Família
                    </Label>
                    <p className="text-base">
                      {viewingDocument.familyMemberName}
                    </p>
                  </div>
                )}
                {viewingDocument.taskTitle && (
                  <div>
                    <Label className="text-muted-foreground">Tarefa Vinculada</Label>
                    <p className="text-base">{viewingDocument.taskTitle}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">
                    Data de Upload
                  </Label>
                  <p className="text-base">
                    {viewingDocument.uploadedAt.toLocaleDateString("pt-PT")}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewingDocument(null)}
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  if (viewingDocument) {
                    handleEditDocument(viewingDocument)
                    setViewingDocument(null)
                  }
                }}
              >
                Editar
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Criar/Editar */}
        <Dialog
          open={creatingDocument || !!editingDocument}
          onOpenChange={(open) => {
            if (!open) {
              handleCancelEdit()
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingDocument
                  ? "Editar Documento"
                  : "Adicionar Novo Documento"}
              </DialogTitle>
              <DialogDescription>
                {editingDocument
                  ? "Atualize as informações do documento"
                  : "Faça upload e configure o novo documento"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">
                  Arquivo <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadedFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{uploadedFile.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setUploadedFile(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {editingDocument && !uploadedFile && (
                    <div className="text-sm text-muted-foreground">
                      Arquivo atual: {editingDocument.fileName}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome do Documento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Passaporte"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descrição opcional do documento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="familyMember">Membro da Família</Label>
                <Select
                  value={formData.familyMemberId || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, familyMemberId: value || "" })
                  }
                >
                  <SelectTrigger id="familyMember">
                    <SelectValue placeholder="Selecione um membro (opcional)" />
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

              <div className="space-y-2">
                <Label htmlFor="task">Tarefa Vinculada</Label>
                <Select
                  value={formData.taskId || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, taskId: value || "" })
                  }
                >
                  <SelectTrigger id="task">
                    <SelectValue placeholder="Selecione uma tarefa (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATIC_TASKS.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as Document["status"],
                    })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Aprovado">Aprovado</SelectItem>
                    <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveDocument}
                disabled={!formData.name || (!uploadedFile && !editingDocument)}
              >
                {editingDocument ? "Salvar Alterações" : "Adicionar Documento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog
          open={!!deletingDocument}
          onOpenChange={(open) => !open && setDeletingDocument(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o documento{" "}
                <strong>{deletingDocument?.name}</strong>? Esta ação não pode
                ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDocument}
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
