import { useClient } from "@/contexts/client-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import CreateClientDialog from "@/components/create-client-dialog";

export default function DashboardPage() {
  const { selectedClient } = useClient();

  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            Aquí verás los indicadores clave de tus clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedClient ? (
            <p className="text-sm text-muted-foreground">
              Cliente seleccionado: <strong>{selectedClient.name}</strong>.
              Selecciona un período para comenzar.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Aún no tienes un cliente seleccionado. Crea un nuevo cliente
                para comenzar.
              </p>
              <CreateClientDialog />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
