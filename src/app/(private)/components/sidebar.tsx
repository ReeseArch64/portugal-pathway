"use client";

import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bot,
  CheckSquare,
  FileText,
  Home,
  Settings,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  className?: string;
}

const menuItems = [
  { icon: Home, label: "Início", href: "/dashboard" },
  { icon: BarChart, label: "Gráficos", href: "/dashboard" },
  { icon: TrendingUp, label: "Estatísticas", href: "/dashboard" },
  { icon: Users, label: "Usuários", href: "/users" },
  { icon: FileText, label: "Documentos", href: "/documents" },
  { icon: CheckSquare, label: "Tarefas", href: "/tasks" },
  { icon: Bot, label: "IA", href: "/ai" },
  { icon: User, label: "Perfil", href: "/profile" },
  { icon: Settings, label: "Configurações", href: "/dashboard" },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <ShadcnSidebar
      variant="sidebar"
      collapsible="offcanvas"
      className={cn("hidden lg:flex", className)}
    >
      <SidebarHeader>
        <SidebarGroupLabel className="text-lg font-semibold">
          Menu
        </SidebarGroupLabel>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;

                let isActive = false;
                if (item.label === "Início") {
                  isActive = pathname === "/dashboard";
                } else {
                  isActive =
                    pathname === item.href && pathname !== "/dashboard";
                }

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="transition-all"
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <div className="text-xs text-muted-foreground text-center py-2 px-2">
          <p>© {new Date().getFullYear()} Rumo Portugal</p>
        </div>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
