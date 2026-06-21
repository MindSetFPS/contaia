import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useClient } from "@/contexts/client-context";
import { apiRequest } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CreateClientDialog() {
  const { token } = useAuth();
  const { setSelectedClient } = useClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [rfc, setRfc] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("El nombre del cliente es requerido");
      return;
    }

    setSubmitting(true);
    try {
      const client = await apiRequest<{
        id: number;
        name: string;
        razon_social?: string;
        rfc?: string;
        industry?: string;
      }>(
        "POST",
        "/clients/",
        {
          name: trimmedName,
          razon_social: razonSocial.trim() || null,
          rfc: rfc.trim() || null,
          industry: industry.trim() || null,
        },
        token ?? undefined,
      );
      setSelectedClient(client);
      setOpen(false);
      setName("");
      setRazonSocial("");
      setRfc("");
      setIndustry("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear cliente");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Nuevo cliente</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
          <DialogDescription>
            Registra un nuevo cliente para comenzar a cargar su información
            contable.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
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
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner />}
              {submitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
