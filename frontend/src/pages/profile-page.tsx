import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

type ProfileData = {
  id: number;
  email: string;
  name: string;
  created_at: string;
};

export default function ProfilePage() {
  const { token, loading, logout } = useAuth();
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

  if (loading || fetching) return null;
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">ContaIA</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{profile?.name}</span>
          <Button variant="outline" size="sm" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Mi Perfil</CardTitle>
            <CardDescription>Tus datos de cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
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
      </main>
    </div>
  );
}
