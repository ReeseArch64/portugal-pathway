'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoreHorizontal } from "lucide-react"

const tasks = [
    { id: 1, name: 'Obter NIF (Número de Identificação Fiscal)', status: 'Concluída', dueDate: '2024-07-15' },
    { id: 2, name: 'Apostilamento da Certidão de Nascimento', status: 'Concluída', dueDate: '2024-07-20' },
    { id: 3, name: 'Abrir conta bancária em Portugal', status: 'Em andamento', dueDate: '2024-08-01' },
    { id: 4, name: 'Agendar entrevista no consulado', status: 'Pendente', dueDate: '2024-08-10' },
    { id: 5, name: 'Contratar seguro de saúde privado', status: 'Pendente', dueDate: '2024-08-15' },
    { id: 6, name: 'Tradução juramentada de documentos', status: 'Em andamento', dueDate: '2024-08-05' },
    { id: 7, name: 'Pesquisar opções de moradia', status: 'Em andamento', dueDate: '2024-09-01' },
    { id: 8, name: 'Obter NISS (Número de Identificação da Segurança Social)', status: 'Pendente', dueDate: '2024-09-10' },
];

const statusVariant = {
    'Pendente': 'outline',
    'Em andamento': 'secondary',
    'Concluída': 'default',
} as const;

export default function TasksPage() {
    return (
        <Tabs defaultValue="all">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Tarefas</h1>
                <div className="ml-auto">
                    <TabsList>
                        <TabsTrigger value="all">Todas</TabsTrigger>
                        <TabsTrigger value="Pendente">Pendente</TabsTrigger>
                        <TabsTrigger value="Em andamento">Em Andamento</TabsTrigger>
                        <TabsTrigger value="Concluída">Concluída</TabsTrigger>
                    </TabsList>
                </div>
            </div>
            
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Gerenciamento de Tarefas</CardTitle>
                    <CardDescription>Acompanhe o progresso de todas as suas tarefas de imigração.</CardDescription>
                </CardHeader>
                <CardContent>
                    {['all', 'Pendente', 'Em andamento', 'Concluída'].map(status => (
                        <TabsContent key={status} value={status}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tarefa</TableHead>
                                        <TableHead className="w-[150px]">Status</TableHead>
                                        <TableHead className="w-[180px]">Data de Vencimento</TableHead>
                                        <TableHead className="w-[50px]"><span className="sr-only">Ações</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks
                                        .filter(task => status === 'all' || task.status === status)
                                        .map(task => (
                                            <TableRow key={task.id}>
                                                <TableCell className="font-medium">{task.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariant[task.status as keyof typeof statusVariant]}>
                                                        {task.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{task.dueDate}</TableCell>
                                                <TableCell>
                                                     <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Toggle menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem>Editar</DropdownMenuItem>
                                                            <DropdownMenuItem>Marcar como concluída</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    ))}
                </CardContent>
            </Card>
        </Tabs>
    )
}
