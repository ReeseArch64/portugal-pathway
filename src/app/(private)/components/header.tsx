"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";

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

  // Fazer logout se a sessão não estiver autenticada
  useEffect(() => {
    if (status === "unauthenticated") {
      signOut({ callbackUrl: "/login" });
    }
  }, [status]);

  // Dados do usuário da sessão
  const user = {
    name: session?.user?.name || "",
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
      <div className="w-full px-2 sm:px-4 py-4 sm:py-6 md:py-8 lg:pl-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 md:gap-6">
          {isLoading ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20 sm:h-4 sm:w-24" />
                <Skeleton className="h-4 w-14 sm:h-5 sm:w-16" />
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
              className="flex items-center gap-2 sm:gap-3"
            >
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-border" key={`avatar-${imageKey}-${user.image || user.name}`}>
                <AvatarImage src={user.image} alt="Avatar" key={user.image} />
                <AvatarFallback className="text-xs sm:text-sm">{getInitials(user.name)}</AvatarFallback>
              </Avatar>

              <div className="flex flex-col min-w-0">
                <p className="font-semibold text-xs sm:text-sm md:text-base truncate">
                  {user.name}
                </p>
                <Badge variant="secondary" className="w-fit mt-1 text-[10px] sm:text-xs">
                  {user.role}
                </Badge>
              </div>
            </motion.div>
          )}

          {isLoading ? (
            <div className="flex-1 space-y-2 sm:space-y-3">
              <Skeleton className="h-6 sm:h-8 w-3/4 md:h-10" />
              {description && <Skeleton className="h-4 sm:h-6 w-full md:h-7" />}
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
              className="flex-1 min-w-0"
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight break-words">
                {title}
              </h1>
              {description && (
                <p className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground break-words">
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
