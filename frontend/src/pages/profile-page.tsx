import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api-client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/user-menu";
import { ArrowLeft } from "lucide-react";

type ProfileData = {
  id: number;
  email: string;
  name: string;
  created_at: string;
};

export default function ProfilePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setFetching(false);
      return;
    }
    apiRequest<ProfileData>("GET", "/auth/me", undefined, token)
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setFetching(false));
  }, [token]);

  if (fetching) return null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex h-12 items-center justify-between border-border border-b px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app")}
            className="gap-1 text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <span className="text-sm font-semibold">ContaIA</span>
        </div>
        <UserMenu />
      </header>
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Mi Perfil</CardTitle>
            <CardDescription>Tus datos de cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {profile && (
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Nombre</dt>
                  <dd className="text-base font-medium">{profile.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Correo electrónico
                  </dt>
                  <dd className="text-base font-medium">{profile.email}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    ID de usuario
                  </dt>
                  <dd className="text-base font-medium">{profile.id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Cuenta creada
                  </dt>
                  <dd className="text-base font-medium">
                    {new Date(profile.created_at).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
