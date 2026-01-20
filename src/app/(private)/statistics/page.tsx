"use client"

import { MainLayout } from "../components/main-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  FileText,
  CheckSquare,
  Users,
  TrendingUp,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Dados estáticos (mesmos das outras páginas)
const STATIC_DOCUMENTS = [
  { status: "Aprovado", count: 2 },
  { status: "Pendente", count: 1 },
  { status: "Rejeitado", count: 0 },
]

const STATIC_TASKS = [
  { status: "Concluída", count: 1 },
  { status: "Em andamento", count: 1 },
  { status: "Pendente", count: 2 },
  { status: "Cancelada", count: 0 },
]

const STATIC_TASKS_PRIORITY = [
  { priority: "Alta", count: 2 },
  { priority: "Média", count: 2 },
  { priority: "Baixa", count: 0 },
]

const STATIC_MEMBERS_DOCS = [
  { member: "João Silva", documents: 1, tasks: 1 },
  { member: "Maria Silva", documents: 1, tasks: 0 },
  { member: "Pedro Silva", documents: 1, tasks: 1 },
]

const MONTHLY_PROGRESS = [
  { month: "Jan", documentos: 0, tarefas: 0 },
  { month: "Fev", documentos: 1, tarefas: 1 },
  { month: "Mar", documentos: 2, tarefas: 2 },
  { month: "Abr", documentos: 0, tarefas: 1 },
]

const chartConfig = {
  documentos: {
    label: "Documentos",
    color: "hsl(var(--chart-1))",
  },
  tarefas: {
    label: "Tarefas",
    color: "hsl(var(--chart-2))",
  },
  aprovado: {
    label: "Aprovado",
    color: "hsl(142, 76%, 36%)",
  },
  pendente: {
    label: "Pendente",
    color: "hsl(38, 92%, 50%)",
  },
  rejeitado: {
    label: "Rejeitado",
    color: "hsl(0, 84%, 60%)",
  },
  concluida: {
    label: "Concluída",
    color: "hsl(142, 76%, 36%)",
  },
  emAndamento: {
    label: "Em Andamento",
    color: "hsl(217, 91%, 60%)",
  },
  cancelada: {
    label: "Cancelada",
    color: "hsl(0, 84%, 60%)",
  },
  alta: {
    label: "Alta",
    color: "hsl(0, 84%, 60%)",
  },
  media: {
    label: "Média",
    color: "hsl(38, 92%, 50%)",
  },
  baixa: {
    label: "Baixa",
    color: "hsl(217, 91%, 60%)",
  },
}

const COLORS = {
  aprovado: "#22c55e",
  pendente: "#eab308",
  rejeitado: "#ef4444",
  concluida: "#22c55e",
  emAndamento: "#3b82f6",
  cancelada: "#ef4444",
  alta: "#ef4444",
  media: "#eab308",
  baixa: "#3b82f6",
}

export default function StatisticsPage() {
  const totalDocuments = STATIC_DOCUMENTS.reduce((acc, doc) => acc + doc.count, 0)
  const totalTasks = STATIC_TASKS.reduce((acc, task) => acc + task.count, 0)
  const totalMembers = STATIC_MEMBERS_DOCS.length
  const completedTasks = STATIC_TASKS.find((t) => t.status === "Concluída")?.count || 0
  const approvedDocuments = STATIC_DOCUMENTS.find((d) => d.status === "Aprovado")?.count || 0

  const documentsData = STATIC_DOCUMENTS.map((doc) => ({
    status: doc.status,
    count: doc.count,
    fill: COLORS[doc.status.toLowerCase() as keyof typeof COLORS] || "#8884d8",
  }))

  const tasksData = STATIC_TASKS.map((task) => ({
    status: task.status,
    count: task.count,
    fill: COLORS[task.status.toLowerCase().replace(" ", "") as keyof typeof COLORS] || "#8884d8",
  }))

  const priorityData = STATIC_TASKS_PRIORITY.map((priority) => ({
    priority: priority.priority,
    count: priority.count,
    fill: COLORS[priority.priority.toLowerCase() as keyof typeof COLORS] || "#8884d8",
  }))

  const progressPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0

  const documentsPercentage = totalDocuments > 0
    ? Math.round((approvedDocuments / totalDocuments) * 100)
    : 0

  return (
    <MainLayout
      headerTitle="Estatísticas"
      headerDescription="Visão geral do progresso da imigração"
    >
      <div className="space-y-6">
        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Documentos
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                {approvedDocuments} aprovados ({documentsPercentage}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Tarefas
              </CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {completedTasks} concluídas ({progressPercentage}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Membros da Família
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                Ativos no processo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Progresso Geral
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((progressPercentage + documentsPercentage) / 2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Média de conclusão
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Status de Documentos */}
          <Card>
            <CardHeader>
              <CardTitle>Status dos Documentos</CardTitle>
              <CardDescription>
                Distribuição por status de aprovação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={documentsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {documentsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Status de Tarefas */}
          <Card>
            <CardHeader>
              <CardTitle>Status das Tarefas</CardTitle>
              <CardDescription>
                Distribuição por status de conclusão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tasksData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {tasksData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Prioridade das Tarefas */}
          <Card>
            <CardHeader>
              <CardTitle>Prioridade das Tarefas</CardTitle>
              <CardDescription>
                Distribuição por nível de prioridade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="priority"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Distribuição por Membro */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Membro</CardTitle>
              <CardDescription>
                Documentos e tarefas por membro da família
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={STATIC_MEMBERS_DOCS}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="member"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="documents"
                      fill="hsl(var(--chart-1))"
                      radius={[8, 8, 0, 0]}
                      name="Documentos"
                    />
                    <Bar
                      dataKey="tasks"
                      fill="hsl(var(--chart-2))"
                      radius={[8, 8, 0, 0]}
                      name="Tarefas"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Progresso Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Progresso Mensal</CardTitle>
            <CardDescription>
              Evolução de documentos e tarefas ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MONTHLY_PROGRESS}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="documentos"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    name="Documentos"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tarefas"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="Tarefas"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Resumo Detalhado */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resumo de Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {STATIC_DOCUMENTS.map((doc) => (
                  <div
                    key={doc.status}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={
                          doc.status === "Aprovado"
                            ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                            : doc.status === "Pendente"
                              ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                              : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                        }
                      >
                        {doc.status}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{doc.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Resumo de Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {STATIC_TASKS.map((task) => (
                  <div
                    key={task.status}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={
                          task.status === "Concluída"
                            ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                            : task.status === "Em andamento"
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                              : task.status === "Pendente"
                                ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                                : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                        }
                      >
                        {task.status}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{task.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
