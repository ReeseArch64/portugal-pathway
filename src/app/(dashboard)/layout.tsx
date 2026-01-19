import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { Icons } from '@/components/icons';
import { LayoutDashboard, Users, GanttChartSquare, FileText, CircleDollarSign, MessageCircle, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader className="p-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Icons.logo className="w-7 h-7 text-primary" />
              <span className="font-headline font-semibold text-xl text-primary-foreground group-data-[collapsible=icon]:hidden">
                Portugal
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link href="/dashboard"><LayoutDashboard /><span>Dashboard</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Usuários">
                  <Link href="/users"><Users /><span>Usuários</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Tarefas">
                  <Link href="/tasks"><GanttChartSquare /><span>Tarefas</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Documentos">
                  <Link href="/documents"><FileText /><span>Documentos</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Custos">
                  <Link href="/costs"><CircleDollarSign /><span>Custos</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Assistente">
                  <Link href="/assistant"><MessageCircle /><span>Assistente AI</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-col w-full">
            <header className="sticky top-0 z-10 flex h-[57px] items-center gap-4 border-b bg-background px-4">
                <SidebarTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SidebarTrigger>
                <div className='flex-1'>
                    <h1 className="font-semibold text-lg font-headline">Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <UserNav />
                </div>
            </header>
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
                {children}
            </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
