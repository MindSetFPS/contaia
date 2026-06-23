import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useClient } from "@/contexts/client-context";
import { apiRequest } from "@/lib/api-client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadPage() {
  const { token } = useAuth();
  const { selectedClient } = useClient();
  const [tableType, setTableType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [result, setResult] = useState<{
    processed: number;
    skipped: number;
    unused_columns: string[];
    period: string;
  } | null>(null);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setStatus("idle");
    setError("");
  }

  async function handleSubmit() {
    if (!selectedClient || !tableType || !file) return;

    setStatus("uploading");
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_id", String(selectedClient.id));
    formData.append("table_type", tableType);

    try {
      const res = await apiRequest<{
        processed: number;
        skipped: number;
        unused_columns: string[];
        period: string;
      }>("POST", "/upload", formData, token ?? undefined);
      setResult(res);
      setStatus("success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al subir el archivo",
      );
      setStatus("error");
    }
  }

  const isValid = selectedClient && tableType && file;

  return (
    <div className="flex flex-1 items-start justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Subir datos</CardTitle>
          <CardDescription>
            Carga un archivo Excel con datos financieros de tu cliente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedClient ? (
            <div className="rounded-lg bg-muted px-4 py-3 text-sm">
              Cliente:{" "}
              <span className="font-medium">{selectedClient.name}</span>
            </div>
          ) : (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
              <AlertCircle className="size-4" />
              Selecciona un cliente del menú lateral antes de subir datos.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="table-type">Tipo de tabla</Label>
            <Select value={tableType} onValueChange={setTableType}>
              <SelectTrigger id="table-type">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ventas">Ventas</SelectItem>
                <SelectItem value="gastos">Gastos</SelectItem>
                <SelectItem value="nomina">Nómina</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Archivo Excel</Label>
            <div className="flex items-center gap-3">
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="file:cursor-pointer file:border-0 file:rounded file:bg-gray-100 file:px-3 file:py-1 file:text-xs  hover:file:bg-primary/10"
              />
            </div>
            {file && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileSpreadsheet className="size-3.5" />
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isValid || status === "uploading"}
            className="w-full"
          >
            {status === "uploading" ? (
              <>
                <Spinner className="mr-2 size-4" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="mr-2 size-4" />
                Subir archivo
              </>
            )}
          </Button>

          {status === "success" && result && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 space-y-1">
              <p className="flex items-center gap-2 font-medium">
                <CheckCircle className="size-4" />
                Datos subidos correctamente
              </p>
              <p>Filas procesadas: {result.processed}</p>
              {result.skipped > 0 && <p>Filas omitidas: {result.skipped}</p>}
              <p>Período: {result.period}</p>
              {result.unused_columns.length > 0 && (
                <p>
                  Columnas no utilizadas: {result.unused_columns.join(", ")}
                </p>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
