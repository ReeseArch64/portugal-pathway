import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, CheckCircle2, FileCheck, DollarSign, ListTodo } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Custos Totais</CardDescription>
              <CardTitle className="text-4xl font-bold">€5,329</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">+25% do último mês</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Documentos Enviados</CardDescription>
              <CardTitle className="text-4xl font-bold">12 / 20</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">8 restantes</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tarefas Concluídas</CardDescription>
              <CardTitle className="text-4xl font-bold">78</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">+10 desde a semana passada</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Progresso Geral</CardDescription>
              <CardTitle className="text-4xl font-bold">65%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={65} aria-label="65% de progresso" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Tarefas Recentes</CardTitle>
              <CardDescription>
                Tarefas que precisam de sua atenção.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/tasks">
                Ver Todas
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarefa</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">Data de Vencimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Obter NIF</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge className="text-xs" variant="outline">
                      Pendente
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">2024-08-15</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Abrir conta bancária</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge className="text-xs" variant="secondary">
                      Em Andamento
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">2024-08-20</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Apostilar certidão</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge className="text-xs" variant="default">
                      Concluída
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">2024-07-30</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Checklist de Imigração</CardTitle>
          <CardDescription>Passos essenciais para sua mudança.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 flex-1">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="h-6 w-6 text-green-500 mt-1" />
            <div>
              <p className="font-medium">Visto e Residência</p>
              <p className="text-sm text-muted-foreground">Consulado, SEF, e agendamentos.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <FileCheck className="h-6 w-6 text-blue-500 mt-1" />
            <div>
              <p className="font-medium">Documentação Essencial</p>
              <p className="text-sm text-muted-foreground">NIF, NISS, e Atestado de Morada.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <DollarSign className="h-6 w-6 text-yellow-500 mt-1" />
            <div>
              <p className="font-medium">Finanças e Banco</p>
              <p className="text-sm text-muted-foreground">Abrir conta, transferência de fundos.</p>
            </div>
          </div>
           <div className="flex items-start gap-4">
            <ListTodo className="h-6 w-6 text-orange-500 mt-1" />
            <div>
              <p className="font-medium">Vida Cotidiana</p>
              <p className="text-sm text-muted-foreground">Moradia, transporte, e saúde.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
