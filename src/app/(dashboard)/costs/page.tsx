import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, PlusCircle, UploadCloud } from "lucide-react"

const costs = [
  { id: 1, category: "Taxas de Visto", amount: 180.50, date: "2024-07-10", status: "Pago" },
  { id: 2, category: "Apostilamento", amount: 75.00, date: "2024-07-12", status: "Pago" },
  { id: 3, category: "Passagens Aéreas", amount: 1250.00, date: "2024-07-20", status: "Pendente" },
  { id: 4, category: "Seguro Viagem", amount: 350.00, date: "2024-07-25", status: "Pago" },
  { id: 5, category: "Aluguel (Caução)", amount: 2000.00, date: "2024-08-01", status: "Pendente" },
  { id: 6, category: "Tradução Juramentada", amount: 120.00, date: "2024-07-18", status: "Pago" },
]

const totalCost = costs.reduce((acc, cost) => acc + (cost.status === 'Pago' ? cost.amount : 0), 0);

export default function CostsPage() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                <CardTitle>Custos e Pagamentos</CardTitle>
                <CardDescription>Acompanhe todas as suas despesas.</CardDescription>
            </div>
            <Button size="sm" className="ml-auto gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Adicionar Custo</span>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="w-[120px]">Valor</TableHead>
                        <TableHead className="w-[120px]">Data</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[50px]"><span className="sr-only">Ações</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {costs.map(cost => (
                        <TableRow key={cost.id}>
                            <TableCell className="font-medium">{cost.category}</TableCell>
                            <TableCell>€{cost.amount.toFixed(2)}</TableCell>
                            <TableCell>{cost.date}</TableCell>
                            <TableCell>
                                <Badge variant={cost.status === 'Pago' ? 'default' : 'outline'}>{cost.status}</Badge>
                            </TableCell>
                            <TableCell>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Editar</DropdownMenuItem>
                                        <DropdownMenuItem>Anexar Comprovante</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Total Pago</CardTitle>
                <CardDescription>Soma de todas as despesas pagas.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">€{totalCost.toFixed(2)}</p>
            </CardContent>
        </Card>
        <Card className="border-2 border-dashed shadow-none">
            <CardHeader>
                <CardTitle>Comprovantes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center p-6">
                <UploadCloud className="w-10 h-10 text-muted-foreground" />
                <p className="mt-2 text-sm font-semibold">Anexar comprovantes</p>
                <Button variant="outline" size="sm" className="mt-2">Selecionar</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
