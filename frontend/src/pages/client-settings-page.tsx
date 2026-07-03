import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useClient } from "@/contexts/client-context";
import { apiRequest } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ClientSettingsPage() {
  const { token } = useAuth();
  const { selectedClient, clients, setClients, setSelectedClient } =
    useClient();
  const navigate = useNavigate();
  const client = selectedClient;

  const [name, setName] = useState(client?.name ?? "");
  const [razonSocial, setRazonSocial] = useState(
    client?.razon_social ?? "",
  );
  const [rfc, setRfc] = useState(selectedClient?.rfc ?? "");
  const [industry, setIndustry] = useState(
    selectedClient?.industry ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!client) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("El nombre del cliente es requerido");
      return;
    }

    setSaving(true);
    try {
      const updated = await apiRequest<{
        id: number;
        name: string;
        razon_social?: string;
        rfc?: string;
        industry?: string;
      }>(
        "PUT",
        `/clients/${client!.id}`,
        {
          name: trimmedName,
          razon_social: razonSocial.trim() || null,
          rfc: rfc.trim() || null,
          industry: industry.trim() || null,
        },
        token ?? undefined,
      );
      setClients(
        clients.map((c) => (c.id === updated.id ? updated : c)),
      );
      setSelectedClient(updated);
      setSuccess("Datos del cliente actualizados");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiRequest(
        "DELETE",
        `/clients/${client!.id}`,
        undefined,
        token ?? undefined,
      );
      setClients(clients.filter((c) => c.id !== client!.id));
      setSelectedClient(null);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-y-auto">
    <div className="mx-auto max-w-lg space-y-8 p-6">
      <div>
        <h2 className="text-lg font-semibold">Configuración del cliente</h2>
        <p className="text-sm text-muted-foreground">
          Edita la información del cliente o elimínalo.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Nombre <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre comercial"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="razonSocial">Razón social</Label>
          <Input
            id="razonSocial"
            value={razonSocial}
            onChange={(e) => setRazonSocial(e.target.value)}
            placeholder="Razón social (nombre legal)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rfc">RFC</Label>
          <Input
            id="rfc"
            value={rfc}
            onChange={(e) => setRfc(e.target.value)}
            placeholder="Ej. ABC123456XYZ"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industria</Label>
          <Input
            id="industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Ej. Retail, Servicios, Manufactura"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Spinner />}
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>

      <hr className="border-border" />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-destructive">Zona de peligro</h3>
        <p className="text-xs text-muted-foreground">
          Al eliminar el cliente se borrarán todos sus datos (ventas, gastos,
          nóminas, conversaciones e insights). Esta acción no se puede deshacer.
        </p>
        <Button
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="mr-2 size-4" />
          Eliminar cliente
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cliente?</DialogTitle>
            <DialogDescription>
              Estás a punto de eliminar a <strong>{client!.name}</strong>{" "}
              y todos sus datos. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Spinner />}
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}
