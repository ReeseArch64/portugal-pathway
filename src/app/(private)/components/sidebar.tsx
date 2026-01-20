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
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  Bot,
  CheckSquare,
  DollarSign,
  FileText,
  Home,
  Luggage,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface SidebarProps {
  className?: string;
}

const menuItems = [
  { icon: Home, label: "Início", href: "/" },
  { icon: TrendingUp, label: "Estatísticas", href: "/statistics" },
  { icon: DollarSign, label: "Custos", href: "/costs" },
  { icon: Users, label: "Usuários", href: "/users" },
  { icon: FileText, label: "Documentos", href: "/documents" },
  { icon: CheckSquare, label: "Tarefas", href: "/tasks" },
  { icon: Luggage, label: "Bagagens", href: "/baggage" },
  { icon: Bot, label: "IA", href: "/ai" },
  { icon: User, label: "Perfil", href: "/profile" },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100, delay: 0.1 }}
    >
      <ShadcnSidebar
        variant="sidebar"
        collapsible="offcanvas"
        className={cn(className)}
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
                          onClick={() => {
                            if (isMobile) {
                              // Fechar sidebar mobile ao clicar em um item
                              const sidebar = document.querySelector('[data-sidebar="sidebar"]');
                              if (sidebar) {
                                const closeButton = sidebar.querySelector('button[aria-label="Close"]') as HTMLButtonElement;
                                closeButton?.click();
                              }
                            }
                          }}
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
    </motion.div>
  );
}