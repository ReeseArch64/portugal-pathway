"use client"

import { signOut } from "next-auth/react"
import { useEffect, useRef } from "react"

export function useAuthInterceptor() {
  const isLoggingOut = useRef(false)

  useEffect(() => {
    // Interceptar fetch para detectar 401
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      const response = await originalFetch(...args)

      // Se a resposta for 401 e for uma chamada para nossa API
      if (response.status === 401) {
        const url = args[0]?.toString() || ""
        // Verificar se não é a rota de auth (login/logout)
        if (url.includes("/api/") && !url.includes("/api/auth/")) {
          // Evitar múltiplos logouts simultâneos
          if (!isLoggingOut.current) {
            isLoggingOut.current = true
            // Fazer logout automático
            signOut({ callbackUrl: "/login" })
          }
        }
      }

      return response
    }

    // Cleanup: restaurar fetch original quando o componente desmontar
    return () => {
      window.fetch = originalFetch
    }
  }, [])
}
