import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api-client";
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
  const { token } = useAuth();
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
    <div className="flex flex-1 items-center justify-center p-6">
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
                <dt className="text-sm text-muted-foreground">ID de usuario</dt>
                <dd className="text-base font-medium">{profile.id}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Cuenta creada</dt>
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
  );
}
