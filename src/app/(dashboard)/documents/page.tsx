import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, MoreVertical, UploadCloud, File, Eye, Download } from "lucide-react"

const documents = [
  { id: 1, name: "Passaporte_Scaneado.pdf", type: "Identificação", status: "Aprovado" },
  { id: 2, "name": "Certidao_Nascimento_Apostilada.pdf", type: "Certidão", status: "Aprovado" },
  { id: 3, name: "Comprovante_Financeiro.pdf", type: "Finanças", status: "Em Análise" },
  { id: 4, name: "Contrato_Trabalho.docx", type: "Trabalho", status: "Pendente" },
  { id: 5, name: "Seguro_Saude.pdf", type: "Saúde", status: "Aprovado" },
  { id: 6, name: "Foto_3x4.jpg", type: "Foto", status: "Em Análise" },
]

const statusVariant: { [key: string]: "default" | "secondary" | "outline" | "destructive" } = {
  "Aprovado": "default",
  "Em Análise": "secondary",
  "Pendente": "outline",
}

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Documentos</h1>
        <p className="text-muted-foreground">Faça o upload e gerencie seus documentos de imigração.</p>
      </div>

      <Card className="border-2 border-dashed shadow-none">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <UploadCloud className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 font-semibold">Arraste e solte seus arquivos aqui</p>
            <p className="text-sm text-muted-foreground">ou</p>
            <Button variant="outline" className="mt-2">Selecione os Arquivos</Button>
            <p className="text-xs text-muted-foreground mt-4">Tamanho máximo do arquivo: 10MB</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold font-headline mb-4">Seus Documentos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <File className="w-8 h-8 text-muted-foreground" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem><Eye className="mr-2 h-4 w-4"/>Visualizar</DropdownMenuItem>
                    <DropdownMenuItem><Download className="mr-2 h-4 w-4"/>Baixar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="font-medium truncate">{doc.name}</p>
                <p className="text-sm text-muted-foreground">{doc.type}</p>
                <Badge variant={statusVariant[doc.status]} className="mt-2">
                  {doc.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
