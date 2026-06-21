import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import AppSidebar from "@/components/app-sidebar";

export default function AppLayout() {
  const { token, loading } = useAuth();

  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
