import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useClient } from "@/contexts/client-context";
import AppSidebar from "@/components/app-sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function AppLayout() {
  const { token, loading } = useAuth();
  const { selectedClient } = useClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-dvh bg-background text-foreground font-sans overflow-hidden">
      <div className="hidden md:flex">
        <AppSidebar />
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent>
          <AppSidebar onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-10 items-center justify-between px-2 sm:px-4 text-sm text-muted-foreground">
          <button
            className="flex md:hidden size-7 items-center justify-center rounded-md hover:bg-muted transition-colors -ml-1"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-4" />
          </button>
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
          <div className="flex-1" />
        </header>
        <main className="flex flex-1 flex-col overflow-hidden h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
