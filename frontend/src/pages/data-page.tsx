import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useClient } from "@/contexts/client-context";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Database, AlertCircle, DollarSign, Receipt, Users } from "lucide-react";

const TABLE_TYPES = [
  { value: "ventas", label: "Ventas", icon: DollarSign },
  { value: "gastos", label: "Gastos", icon: Receipt },
  { value: "nomina", label: "Nómina", icon: Users },
] as const;

const COLUMN_LABELS: Record<string, Record<string, string>> = {
  ventas: {
    fecha: "Fecha",
    cliente_nombre: "Cliente",
    producto: "Producto",
    cantidad: "Cantidad",
    precio_unitario: "Precio Unitario",
    monto_neto: "Monto Neto",
    iva: "IVA",
    monto_total: "Monto Total",
  },
  gastos: {
    fecha: "Fecha",
    categoria: "Categoría",
    descripcion: "Descripción",
    monto: "Monto",
    iva: "IVA",
  },
  nomina: {
    fecha: "Fecha",
    empleado: "Empleado",
    puesto: "Puesto",
    salario_bruto: "Salario Bruto",
    deducciones: "Deducciones",
    salario_neto: "Salario Neto",
    isr: "ISR",
    imss: "IMSS",
  },
};

type DataResponse = {
  columns: string[];
  rows: unknown[][];
  total: number;
  table_type: string;
  limit: number;
  offset: number;
};

const PAGE_SIZE = 50;

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "string") return val;
  if (typeof val === "number") {
    if (Number.isInteger(val)) return val.toLocaleString("es-MX");
    return val.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (val instanceof Date || (typeof val === "string" && val.includes("-"))) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("es-MX");
    }
  }
  return String(val);
}

export default function DataPage() {
  const { token } = useAuth();
  const { selectedClient } = useClient();
  const [tableType, setTableType] = useState("ventas");
  const currentTable = TABLE_TYPES.find((t) => t.value === tableType);
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const fetchData = useCallback(async () => {
    if (!selectedClient || !token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/data?client_id=${selectedClient.id}&table_type=${tableType}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error" }));
        throw new Error(err.detail || "Error al cargar datos");
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedClient, token, tableType, page]);

  useEffect(() => {
    setPage(0);
  }, [tableType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const labels = COLUMN_LABELS[tableType] ?? {};

  return (
    <div className="flex flex-1 flex-col min-h-0 p-4 sm:p-6">
      {!selectedClient ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <AlertCircle className="size-4" />
            Selecciona un cliente para explorar sus datos.
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col min-h-0">
          <div className="mb-4">
            <Tabs value={tableType} onValueChange={setTableType}>
              <TabsList>
                {TABLE_TYPES.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="gap-2">
                    <t.icon className="size-4" />
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner />
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                <AlertCircle className="size-4" />
                {error}
              </div>
            </div>
          ) : !data || data.rows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
              <Database className="size-10" />
              <p className="text-sm">
                No hay datos de{" "}
                <span className="font-medium text-foreground">
                  {currentTable?.label ?? tableType}
                </span>{" "}
                para este cliente.
              </p>
              <p className="text-xs">
                Sube un archivo Excel en la pestaña "Subir datos".
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col min-h-0">
              <div className="mb-2 text-xs text-muted-foreground">
                {data.total} registro{data.total !== 1 ? "s" : ""}
              </div>
              <div className="flex-1 overflow-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      {data.columns.map((col) => (
                        <TableHead
                          key={col}
                          className="sticky top-0 z-10 whitespace-nowrap bg-muted/50 backdrop-blur"
                        >
                          {labels[col] ?? col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={data.columns.length}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No hay registros
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.rows.map((row, i) => (
                        <TableRow
                          key={i}
                          className={cn(
                            "border-border transition-colors hover:bg-muted/50",
                            i % 2 === 0 && "bg-background",
                            i % 2 === 1 && "bg-muted/20",
                          )}
                        >
                          {row.map((cell, j) => (
                            <TableCell key={j} className="whitespace-nowrap">
                              {formatValue(cell)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-1 py-3">
                  <p className="text-xs text-muted-foreground">
                    Página {page + 1} de {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="size-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Siguiente
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
