import { useEffect } from "react";
import { Navigate, Outlet, useNavigate, useParams } from "react-router-dom";
import { useClient } from "@/contexts/client-context";
import { Button } from "@/components/ui/button";
import MainTabs from "@/components/main-tabs";
import { ArrowLeft } from "lucide-react";

export default function ClientLayout() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients, clientsLoading, selectedClient, setSelectedClient } =
    useClient();

  useEffect(() => {
    if (!clientId || clientsLoading || clients.length === 0) return;
    const id = parseInt(clientId, 10);
    if (isNaN(id)) return;
    if (selectedClient?.id === id) return;
    const client = clients.find((c) => c.id === id);
    if (client) {
      setSelectedClient(client);
    }
  }, [clientId, clients, clientsLoading, selectedClient, setSelectedClient]);

  if (clientsLoading) return null;

  const id = clientId ? parseInt(clientId, 10) : NaN;
  if (isNaN(id) || !clients.find((c) => c.id === id)) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-10 items-center gap-2 border-border border-b px-2 sm:px-4 overflow-x-auto no-scrollbar">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedClient(null);
            navigate("/app");
          }}
          className="gap-1 text-muted-foreground shrink-0"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Volver</span>
        </Button>
        <span className="shrink-0 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {selectedClient?.name}
          </span>
        </span>
        <MainTabs inline />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
