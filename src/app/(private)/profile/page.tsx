"use client"

import { MainLayout } from "../components/main-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  AlertCircle,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Save,
  User,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface ProfileData {
  fullName: string
  image: string | null
  username: string
  role: string
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPassword, setIsLoadingPassword] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: session?.user?.name || "",
    image: session?.user?.image || null,
    username: session?.user?.username || "",
    role: session?.user?.role || "USER",
  })

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user) {
      setProfileData({
        fullName: session.user.name || "",
        image: session.user.image || null,
        username: session.user.username || "",
        role: session.user.role || "USER",
      })
      setIsLoadingProfile(false)
    }
  }, [session])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: profileData.fullName,
          image: profileData.image || "",
        }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Resposta não é JSON:", text.substring(0, 200))
        setError("Erro ao comunicar com o servidor. Tente novamente.")
        toast({
          title: "Erro",
          description: "Resposta inválida do servidor",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || "Erro ao atualizar perfil"
        setError(errorMessage)
        toast({
          title: "Erro ao atualizar perfil",
          description: errorMessage,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Atualizar a sessão
      await update()
      
      // Forçar atualização da página para atualizar o header
      router.refresh()

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram atualizadas com sucesso.",
      })

      setError(null)
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      setError("Ocorreu um erro ao atualizar o perfil. Tente novamente.")
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingPassword(true)
    setPasswordError(null)

    // Validações
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("Por favor, preencha todos os campos")
      setIsLoadingPassword(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("A senha deve ter pelo menos 6 caracteres")
      setIsLoadingPassword(false)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("As senhas não coincidem")
      setIsLoadingPassword(false)
      return
    }

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Resposta não é JSON:", text.substring(0, 200))
        setPasswordError("Erro ao comunicar com o servidor. Tente novamente.")
        toast({
          title: "Erro",
          description: "Resposta inválida do servidor",
          variant: "destructive",
        })
        setIsLoadingPassword(false)
        return
      }

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || "Erro ao atualizar senha"
        setPasswordError(errorMessage)
        toast({
          title: "Erro ao atualizar senha",
          description: errorMessage,
          variant: "destructive",
        })
        setIsLoadingPassword(false)
        return
      }

      // Atualizar a sessão
      await update()

      // Limpar formulário
      setPasswordData({
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi alterada com sucesso.",
      })

      setPasswordError(null)
    } catch (error) {
      console.error("Erro ao atualizar senha:", error)
      setPasswordError("Ocorreu um erro ao atualizar a senha. Tente novamente.")
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPassword(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <MainLayout
        headerTitle="Perfil"
        headerDescription="Gerencie suas informações pessoais"
      >
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      headerTitle="Perfil"
      headerDescription="Gerencie suas informações pessoais"
    >
      <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
        {/* Informações do Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Informações do Perfil</CardTitle>
            <CardDescription className="text-sm">
              Atualize suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-6">
              {/* Foto de Perfil */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={profileData.image || undefined}
                    alt={profileData.fullName}
                  />
                  <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                    {getInitials(profileData.fullName)}
                  </AvatarFallback>
                </Avatar>

                <div className="text-center">
                  <p className="mb-1 text-sm font-medium">Foto de Perfil</p>
                  <p className="text-xs text-muted-foreground">
                    Cole o link da imagem abaixo
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Campos */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome Completo
                  </Label>
                  <Input
                    value={profileData.fullName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, fullName: e.target.value })
                    }
                    placeholder="Seu nome completo"
                    required
                    className="min-h-[44px] text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    URL da Foto de Perfil
                  </Label>
                  <Input
                    value={profileData.image || ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        image: e.target.value || null,
                      })
                    }
                    placeholder="https://exemplo.com/foto.jpg"
                    type="url"
                    className="min-h-[44px] text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole o link completo da imagem
                  </p>
                </div>

                {/* Informações do Usuário */}
                <div className="space-y-3 border-t pt-4">
                  <div>
                    <Label className="mb-1 block text-sm font-medium text-muted-foreground">
                      Username
                    </Label>
                    <p className="font-mono text-sm">{profileData.username}</p>
                  </div>

                  <div>
                    <Label className="mb-1 block text-sm font-medium text-muted-foreground">
                      Cargo
                    </Label>
                    <Badge
                      variant="outline"
                      className="border-primary/20 bg-primary/10 text-primary"
                    >
                      {profileData.role === "ADMIN" ? "Administrador" : "Usuário"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Botão */}
              <Button type="submit" className="w-full min-h-[44px]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Alteração de Senha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Atualize sua senha para manter sua conta segura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    className="min-h-[44px] text-base"
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Digite sua nova senha"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    className="min-h-[44px] text-base"
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirme sua nova senha"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full min-h-[44px]"
                disabled={isLoadingPassword}
              >
                {isLoadingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Alterar Senha
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
