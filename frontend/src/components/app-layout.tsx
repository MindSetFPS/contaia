import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";

export default function AppLayout() {
  const { token, loading } = useAuth();

  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-dvh bg-background text-foreground font-sans overflow-hidden">
      <Outlet />
    </div>
  );
}
