"use client"

import { MainLayout } from "../components/main-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Camera, Save, User } from "lucide-react"

export default function ProfilePage() {
  // Dados estáticos (mock)
  const profile = {
    fullName: "João da Silva",
    imageUrl: "",
    username: "joaosilva",
    role: "Usuário",
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <MainLayout
      headerTitle="Perfil"
      headerDescription="Gerencie suas informações pessoais"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <form className="space-y-6">
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={profile.imageUrl || undefined}
                  alt={profile.fullName}
                />
                <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                  {getInitials(profile.fullName)}
                </AvatarFallback>
              </Avatar>

              <div className="text-center">
                <p className="mb-1 text-sm font-medium">Foto de Perfil</p>
                <p className="text-xs text-muted-foreground">
                  Cole o link da imagem abaixo
                </p>
              </div>
            </div>

            {/* Campos */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  Nome Completo
                </label>
                <Input
                  value={profile.fullName}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Camera className="h-4 w-4" />
                  URL da Foto de Perfil
                </label>
                <Input
                  value="https://exemplo.com/foto.jpg"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Cole o link completo da imagem
                </p>
              </div>

              {/* Informações do Usuário */}
              <div className="space-y-3 border-t pt-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">
                    Username
                  </label>
                  <p className="font-mono text-sm">{profile.username}</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">
                    Cargo
                  </label>
                  <Badge
                    variant="outline"
                    className="border-primary/20 bg-primary/10 text-primary"
                  >
                    {profile.role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Botão */}
            <Button type="button" className="w-full" disabled>
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}
