import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useClient } from "@/contexts/client-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import CreateClientDialog from "@/components/create-client-dialog";

export default function DashboardPage() {
  const { user, token, loading, logout } = useAuth();
  const { selectedClient } = useClient();

  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">ContaIA</h1>
        <div className="flex items-center gap-4">
          {selectedClient && (
            <span className="text-sm font-medium text-blue-600">
              {selectedClient.name}
            </span>
          )}
          <span className="text-sm text-muted-foreground">{user?.name}</span>
          <CreateClientDialog />
          <Button variant="outline" size="sm" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>
              Bienvenido, {user?.name}. Aquí verás los indicadores clave de tus
              clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedClient ? (
              <p className="text-sm text-muted-foreground">
                Cliente seleccionado: <strong>{selectedClient.name}</strong>.
                Selecciona un período para comenzar.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Aún no tienes un cliente seleccionado. Crea un nuevo cliente
                  para comenzar.
                </p>
                <CreateClientDialog />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
