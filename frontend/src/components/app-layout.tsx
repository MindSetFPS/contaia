import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useClient } from "@/contexts/client-context";
import AppSidebar from "@/components/app-sidebar";

export default function AppLayout() {
  const { token, loading } = useAuth();
  const { selectedClient } = useClient();

  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-10 items-center justify-between border-b px-4 text-sm text-muted-foreground">
          <span>
            {selectedClient ? (
              <>
                Cliente:{" "}
                <span className="font-medium text-foreground">
                  {selectedClient.name}
                </span>
              </>
            ) : (
              "Cliente: No seleccionado"
            )}
          </span>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
