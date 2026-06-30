import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Database, LayoutDashboard, MessageSquare, Upload } from "lucide-react";
import DashboardPage from "@/pages/dashboard-page";
import ChatsPage from "@/pages/chats-page";
import UploadPage from "@/pages/upload-page";
import DataPage from "@/pages/data-page";

const tabs = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "chat", label: "Chat", icon: MessageSquare },
  { value: "data", label: "Datos", icon: Database },
  { value: "upload", label: "Subir datos", icon: Upload },
] as const;

export default function MainTabs() {
  const [tab, setTab] = useState("dashboard");

  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      className="flex flex-1 flex-col min-h-0"
    >
      <div className="border-border border-b  overflow-x-auto overflow-y-hidden no-scrollbar">
        <TabsList variant="line">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-2 px-3">
              <t.icon className="size-4" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className="flex flex-1 flex-col min-h-0">
        <div
          className={cn(
            "flex flex-1 flex-col min-h-0",
            tab !== "dashboard" && "hidden",
          )}
        >
          <DashboardPage />
        </div>
        <div
          className={cn(
            "flex flex-1 flex-col min-h-0",
            tab !== "chat" && "hidden",
          )}
        >
          <ChatsPage />
        </div>
        <div
          className={cn(
            "flex flex-1 flex-col min-h-0",
            tab !== "upload" && "hidden",
          )}
        >
          <UploadPage />
        </div>
        <div
          className={cn(
            "flex flex-1 flex-col min-h-0",
            tab !== "data" && "hidden",
          )}
        >
          <DataPage />
        </div>
      </div>
    </Tabs>
  );
}
