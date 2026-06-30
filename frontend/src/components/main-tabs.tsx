import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, LayoutDashboard, MessageSquare, Upload } from "lucide-react";

const tabs = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "chat", label: "Chat", icon: MessageSquare },
  { value: "data", label: "Datos", icon: Database },
  { value: "upload", label: "Subir datos", icon: Upload },
] as const;

const parentRoutes = new Set<string>(tabs.map((t) => t.value));

export default function MainTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId } = useParams();

  const match = location.pathname.match(/^\/app\/[^/]+\/([^/]+)/);
  const baseSegment = match?.[1] ?? "";
  const currentTab = parentRoutes.has(baseSegment) ? baseSegment : "dashboard";

  function handleTabChange(value: string) {
    navigate(`/app/${clientId}/${value}`);
  }

  return (
    <div className="border-border border-b overflow-x-auto overflow-y-hidden no-scrollbar">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList variant="line">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-2 px-3">
              <t.icon className="size-4" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
