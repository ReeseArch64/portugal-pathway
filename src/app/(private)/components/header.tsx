"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

interface HeaderProps {
  title?: string;
  description?: string;
}

export function Header({ title = "Bem-vindo", description }: HeaderProps) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [imageKey, setImageKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Atualizar quando a sessão ou imagem mudar
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setImageKey(prev => prev + 1);
    }
  }, [session?.user?.image, session?.user?.name, status]);

  // Dados do usuário da sessão
  const user = {
    name: session?.user?.name || "Usuário",
    role: session?.user?.role === "ADMIN" ? "Administrador" : "Usuário",
    image: session?.user?.image || undefined,
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      className="border-b bg-muted/40 w-full"
    >
      <div className="w-full px-4 py-6 md:py-8 lg:pl-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                delay: 0.2,
                duration: 0.6,
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3"
            >
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Avatar className="h-12 w-12 border-2 border-border" key={`avatar-${imageKey}-${user.image || user.name}`}>
                  <AvatarImage src={user.image} alt="Avatar" key={user.image} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </motion.div>

              <div className="flex flex-col">
                <p className="font-semibold text-sm md:text-base">
                  {user.name}
                </p>
                <Badge variant="secondary" className="w-fit mt-1">
                  {user.role}
                </Badge>
              </div>
            </motion.div>
          )}

          {isLoading ? (
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-3/4 md:h-10" />
              {description && <Skeleton className="h-6 w-full md:h-7" />}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                delay: 0.3,
                duration: 0.6,
                type: "spring",
                stiffness: 150,
              }}
              className="flex-1"
            >
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                {title}
              </h1>
              {description && (
                <p className="mt-4 text-lg text-muted-foreground md:text-xl">
                  {description}
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
