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
  Loader2,
  Plus,
  Trash2,
  X
} from "lucide-react"
import { useEffect, useState } from "react"
import { MainLayout } from "../components/main-layout"
import { useToast } from "@/hooks/use-toast"

interface Document {
  id: string
  name: string
  description?: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl?: string
  uploadedAt: Date
  familyMemberId?: string
  familyMemberName?: string
  taskId?: string
  taskTitle?: string
  status: "Pendente" | "Aprovado" | "Rejeitado"
}

const statusColors = {
  Pendente: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  Aprovado: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  Rejeitado: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

export default function DocumentsPage() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<Document[]>([])
  const [familyMembers, setFamilyMembers] = useState<Array<{ id: string; fullName: string }>>([])
  const [tasks, setTasks] = useState<Array<{ id: string; title: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

  // Carregar documentos, membros da família e tarefas
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Carregar documentos
        const documentsResponse = await fetch("/api/documents")
        if (documentsResponse.ok) {
          const data = await documentsResponse.json()
          setDocuments(
            data.map((doc: any) => ({
              ...doc,
              uploadedAt: new Date(doc.uploadedAt),
            }))
          )
        } else {
          toast({
            title: "Erro",
            description: "Erro ao carregar documentos",
            variant: "destructive",
          })
        }

        // Carregar membros da família
        const membersResponse = await fetch("/api/family-members")
        if (membersResponse.ok) {
          const membersData = await membersResponse.json()
          setFamilyMembers(membersData.map((m: any) => ({ id: m.id, fullName: m.fullName })))
        }

        // Carregar tarefas
        const tasksResponse = await fetch("/api/tasks")
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setTasks(tasksData.map((t: any) => ({ id: t.id, title: t.title })))
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

  const handleSaveDocument = async () => {
    if (!formData.name) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o nome do documento",
        variant: "destructive",
      })
      return
    }

    if (!editingDocument && !uploadedFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Para upload de arquivo, vamos usar uma URL temporária ou base64
      // Em produção, você deve fazer upload para um serviço de storage (S3, Cloudinary, etc.)
      let fileUrl: string | null = null
      let fileName: string | null = null
      let fileSize: number | null = null
      let fileType: string | null = null

      if (uploadedFile) {
        // Converter arquivo para base64 (solução temporária)
        const reader = new FileReader()
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string
            resolve(result)
          }
          reader.onerror = reject
          reader.readAsDataURL(uploadedFile)
        })

        fileUrl = await base64Promise
        fileName = uploadedFile.name
        fileSize = uploadedFile.size
        fileType = uploadedFile.type
      } else if (editingDocument) {
        // Manter os valores existentes se não houver novo arquivo
        fileUrl = editingDocument.fileName // Usar fileName como referência
        fileName = editingDocument.fileName
        fileSize = editingDocument.fileSize
        fileType = editingDocument.fileType
      }

      if (editingDocument) {
        // Atualizar documento existente
        const response = await fetch(`/api/documents/${editingDocument.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description || null,
            type: "Documento",
            status: formData.status,
            fileUrl: fileUrl,
            fileName: fileName,
            fileSize: fileSize,
            fileType: fileType,
            familyMemberId: formData.familyMemberId || null,
            taskId: formData.taskId || null,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao atualizar documento")
        }

        // Recarregar documentos
        const documentsResponse = await fetch("/api/documents")
        if (documentsResponse.ok) {
          const data = await documentsResponse.json()
          setDocuments(
            data.map((doc: any) => ({
              ...doc,
              uploadedAt: new Date(doc.uploadedAt),
            }))
          )
        }

        toast({
          title: "Sucesso",
          description: "Documento atualizado com sucesso",
        })
        setEditingDocument(null)
      } else {
        // Criar novo documento
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description || null,
            type: "Documento",
            status: formData.status,
            fileUrl: fileUrl,
            fileName: fileName,
            fileSize: fileSize,
            fileType: fileType,
            familyMemberId: formData.familyMemberId || null,
            taskId: formData.taskId || null,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao criar documento")
        }

        // Recarregar documentos
        const documentsResponse = await fetch("/api/documents")
        if (documentsResponse.ok) {
          const data = await documentsResponse.json()
          setDocuments(
            data.map((doc: any) => ({
              ...doc,
              uploadedAt: new Date(doc.uploadedAt),
            }))
          )
        }

        toast({
          title: "Sucesso",
          description: "Documento criado com sucesso",
        })
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
    } catch (error) {
      console.error("Erro ao salvar documento:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao salvar documento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteDocument = async () => {
    if (!deletingDocument) return

    try {
      const response = await fetch(`/api/documents/${deletingDocument.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao deletar documento")
      }

      // Recarregar documentos
      const documentsResponse = await fetch("/api/documents")
      if (documentsResponse.ok) {
        const data = await documentsResponse.json()
        setDocuments(
          data.map((doc: any) => ({
            ...doc,
            uploadedAt: new Date(doc.uploadedAt),
          }))
        )
      }

      toast({
        title: "Sucesso",
        description: "Documento excluído com sucesso",
      })
      setDeletingDocument(null)
    } catch (error) {
      console.error("Erro ao deletar documento:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao deletar documento. Tente novamente.",
        variant: "destructive",
      })
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
      <div className="space-y-4 sm:space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: "Total", value: stats.total },
            { label: "Pendente", value: stats.pendente },
            { label: "Aprovado", value: stats.aprovado },
            { label: "Rejeitado", value: stats.rejeitado },
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

        {/* Filtros e Botão de Adicionar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
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
            </div>
          </div>
          <Button onClick={handleCreateDocument} className="w-full sm:w-auto min-h-[44px]">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Adicionar Documento</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>
        </div>

        {/* Lista de Documentos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        )}

        {!isLoading && filteredDocuments.length === 0 && (
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
          <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Detalhes do Documento</DialogTitle>
              <DialogDescription className="text-sm">
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
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setViewingDocument(null)}
                className="w-full sm:w-auto min-h-[44px]"
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
                className="w-full sm:w-auto min-h-[44px]"
              >
                Editar
              </Button>
              {viewingDocument?.fileUrl && (
                <Button 
                  variant="outline"
                  asChild
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  <a href={viewingDocument.fileUrl} download={viewingDocument.fileName} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              )}
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
          <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingDocument
                  ? "Editar Documento"
                  : "Adicionar Novo Documento"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingDocument
                  ? "Atualize as informações do documento"
                  : "Faça upload e configure o novo documento"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
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
                  className="min-h-[44px] text-base"
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
                  className="min-h-[44px] text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="familyMember">Membro da Família</Label>
                <Select
                  value={formData.familyMemberId || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, familyMemberId: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger id="familyMember" className="min-h-[44px]">
                    <SelectValue placeholder="Selecione um membro (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {familyMembers.map((member) => (
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
                  value={formData.taskId || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, taskId: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger id="task" className="min-h-[44px]">
                    <SelectValue placeholder="Selecione uma tarefa (opcional)" />
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
                  <SelectTrigger id="status" className="min-h-[44px]">
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
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={handleCancelEdit}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveDocument}
                disabled={!formData.name || (!uploadedFile && !editingDocument) || isSaving}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : editingDocument ? (
                  "Salvar Alterações"
                ) : (
                  "Adicionar Documento"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog
          open={!!deletingDocument}
          onOpenChange={(open) => !open && setDeletingDocument(null)}
        >
          <AlertDialogContent className="max-w-[95vw] sm:max-w-[500px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o documento{" "}
                <strong>{deletingDocument?.name}</strong>? Esta ação não pode
                ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel className="w-full sm:w-auto min-h-[44px]">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDocument}
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
