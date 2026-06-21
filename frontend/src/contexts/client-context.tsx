import { createContext, useContext, useState, type ReactNode } from "react";

type Client = {
  id: number;
  name: string;
  razon_social?: string;
  rfc?: string;
  industry?: string;
};

type Period = {
  id: string;
  year: number;
  month: number;
  label: string;
};

type ClientContextType = {
  selectedClient: Client | null;
  selectedPeriod: Period | null;
  setSelectedClient: (client: Client | null) => void;
  setSelectedPeriod: (period: Period | null) => void;
};

const ClientContext = createContext<ClientContextType | null>(null);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

  return (
    <ClientContext.Provider
      value={{
        selectedClient,
        selectedPeriod,
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
