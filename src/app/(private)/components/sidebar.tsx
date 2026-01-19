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
import { motion } from "framer-motion";
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
import { useState } from "react";

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
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <ShadcnSidebar
        variant="sidebar"
        collapsible="offcanvas"
        className="hidden lg:flex"
      >
        <SidebarHeader>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <SidebarGroupLabel className="text-lg font-semibold">
              Menu
            </SidebarGroupLabel>
          </motion.div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item, index) => {
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
                      <motion.div
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{
                          delay: 0.1 * index,
                          type: "spring",
                          stiffness: 200,
                        }}
                      >
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="transition-all"
                        >
                          <Link
                            href={item.href}
                            className="flex items-center gap-2"
                          >
                            <motion.div
                              whileHover={{ rotate: 5 }}
                              transition={{ type: "spring", stiffness: 400 }}
                            >
                              <Icon className="h-4 w-4" />
                            </motion.div>
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </motion.div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-muted-foreground text-center py-2 px-2"
          >
            <p>© {new Date().getFullYear()} Rumo Portugal</p>
          </motion.div>
        </SidebarFooter>
      </ShadcnSidebar>
    </motion.div>
  );
}
