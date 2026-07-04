import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useClient } from "@/contexts/client-context";
import { useTheme } from "@/contexts/theme-context";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import CreateClientDialog from "@/components/create-client-dialog";
import {
  Search,
  LogOut,
  Sun,
  Moon,
  User,
  ArrowRight,
  Building2,
} from "lucide-react";

export default function ClientHubPage() {
  const { user, logout } = useAuth();
  const { clients, clientsLoading, setSelectedClient } = useClient();
  const { actualTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase().trim();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.razon_social && c.razon_social.toLowerCase().includes(q)),
    );
  }, [clients, search]);

  function handleSelect(clientId: number) {
    const client = clients.find((c) => c.id === clientId);
    if (client) setSelectedClient(client);
    navigate(`/app/${clientId}/dashboard`);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex h-12 items-center justify-between border-border border-b px-4 sm:px-6">
        <span className="text-sm font-semibold">ContaIA</span>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            {actualTheme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>
          <button
            onClick={() => navigate("/app/me")}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <User className="size-3.5" />
            {user?.name}
          </button>
          <button
            onClick={logout}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Mis clientes</h1>
            <CreateClientDialog />
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente por nombre o razón social..."
              className="h-10 pl-10"
            />
          </div>

          {clientsLoading ? (
            <div className="flex justify-center py-16">
              <Spinner className="size-6" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="mb-4 size-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {search
                  ? "No se encontraron clientes con ese nombre"
                  : "No tienes clientes aún. Crea tu primer cliente para comenzar."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelect(client.id)}
                  className="text-left"
                >
                  <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                    <CardHeader className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="truncate text-base">
                            {client.name}
                          </CardTitle>
                          {client.industry && (
                            <CardDescription className="mt-1 truncate">
                              {client.industry}
                            </CardDescription>
                          )}
                        </div>
                        <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      {client.razon_social && (
                        <p className="mt-1.5 truncate text-xs text-muted-foreground">
                          {client.razon_social}
                        </p>
                      )}
                    </CardHeader>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
