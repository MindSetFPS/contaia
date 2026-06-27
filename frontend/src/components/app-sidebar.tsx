import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useClient } from "@/contexts/client-context";
import { useTheme } from "@/contexts/theme-context";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import CreateClientDialog from "@/components/create-client-dialog";
import { Search, LogOut, Sun, Moon } from "lucide-react";
import type { Client } from "@/types";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Chats", path: "/chats" },
  { label: "Subir datos", path: "/upload" },
  { label: "Mi Perfil", path: "/me" },
];

export default function AppSidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { clients, clientsLoading, selectedClient, setSelectedClient } =
    useClient();
  const { actualTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
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

  function handleSelect(client: Client) {
    setSelectedClient(client);
    navigate("/dashboard");
    onClose?.();
  }

  return (
    <aside className="flex w-64 flex-col border-border md:border bg-sidebar text-sidebar-foreground min-h-screen">
      <div className="border-border border-b px-4 py-3">
        <span className="text-sm font-semibold">ContaIA</span>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-border border-b px-3 py-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-medium text-muted-foreground">
              Clientes
            </span>
            <CreateClientDialog minimal />
          </div>

          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="space-y-0.5 max-h-[35vh] overflow-y-auto">
            {clientsLoading ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-muted-foreground text-center">
                {search ? "Sin resultados" : "No hay clientes aún"}
              </p>
            ) : (
              filtered.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelect(client)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors ${selectedClient?.id === client.id
                      ? "bg-muted font-medium"
                      : "text-sidebar-foreground hover:bg-muted"
                    }`}
                >
                  <span className="truncate">{client.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); onClose?.(); }}
                className={`flex w-full items-center rounded-md px-3 py-1.5 text-left text-sm transition-colors ${isActive
                    ? "bg-muted font-medium"
                    : "text-sidebar-foreground hover:bg-muted"
                  }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-border border-t px-3 py-3 space-y-1">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-sidebar-foreground hover:bg-muted transition-colors"
        >
          {actualTheme === "dark" ? (
            <Sun className="size-3.5" />
          ) : (
            <Moon className="size-3.5" />
          )}
          {actualTheme === "dark" ? "Modo claro" : "Modo oscuro"}
        </button>
        <div className="px-3 py-1 text-xs text-muted-foreground truncate">
          {user?.name}
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-sidebar-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="size-3.5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
