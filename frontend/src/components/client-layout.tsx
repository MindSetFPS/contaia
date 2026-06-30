import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useClient } from "@/contexts/client-context";
import MainTabs from "@/components/main-tabs";

export default function ClientLayout() {
  const { clientId } = useParams();
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
    <>
      <MainTabs />
      <Outlet />
    </>
  );
}
