import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api-client";
import type { Client, Period } from "@/types";

type ClientContextType = {
  clients: Client[];
  clientsLoading: boolean;
  selectedClient: Client | null;
  selectedPeriod: Period | null;
  setClients: (clients: Client[]) => void;
  setSelectedClient: (client: Client | null) => void;
  setSelectedPeriod: (period: Period | null) => void;
};

const ClientContext = createContext<ClientContextType | null>(null);

export function ClientProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

  useEffect(() => {
    if (!token) {
      setClients([]);
      setClientsLoading(false);
      return;
    }
    setClientsLoading(true);
    apiRequest<Client[]>("GET", "/clients/", undefined, token)
      .then(setClients)
      .catch(() => {})
      .finally(() => setClientsLoading(false));
  }, [token]);

  return (
    <ClientContext.Provider
      value={{
        clients,
        clientsLoading,
        selectedClient,
        selectedPeriod,
        setClients,
        setSelectedClient,
        setSelectedPeriod,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error("useClient must be used within ClientProvider");
  return ctx;
}
