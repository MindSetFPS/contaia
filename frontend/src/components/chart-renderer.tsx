import { Component } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { ChartConfig } from "@/types";

const DEFAULT_PALETTE = [
  "#2563EB",
  "#16A34A",
  "#EA580C",
  "#DC2626",
  "#7C3AED",
  "#0891B2",
  "#CA8A04",
  "#BE185D",
];

type Props = {
  config: ChartConfig;
};

function tableConfig(config: ChartConfig) {
  const headers = ["label", ...config.datasets.map((d) => d.label)];
  const rows = config.labels.map((label, i) => [
    label,
    ...config.datasets.map((d) => d.data[i]?.toLocaleString() ?? ""),
  ]);
  return { title: config.title, headers, rows };
}

function ChartInner({ config }: Props) {
  if (config.chart_type === "table") {
    const { title, headers, rows } = tableConfig(config);
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <caption className="text-sm font-medium mb-2 text-left">
            {title}
          </caption>
          <thead>
            <tr className="border-b">
              {headers.map((h) => (
                <th
                  key={h}
                  className="text-left py-2 px-3 font-medium text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b last:border-0">
                {row.map((cell, ci) => (
                  <td key={ci} className="py-2 px-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const chartData = config.labels.map((label, i) => {
    const point: Record<string, string | number> = { name: label };
    for (const ds of config.datasets) {
      point[ds.label] = ds.data[i] ?? 0;
    }
    return point;
  });

  if (config.chart_type === "pie") {
    const ds = config.datasets[0];
    if (!ds) return null;
    return (
      <div className="min-h-0" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={config.labels.map((label, i) => ({
                name: label,
                value: ds.data[i] ?? 0,
              }))}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, value }: { name: string; value: number }) =>
                `${name}: ${value}`
              }
            >
              {config.labels.map((_, i) => (
                <Cell
                  key={i}
                  fill={ds.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (config.chart_type === "bar") {
    return (
      <div className="min-h-0" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {config.datasets.map((ds, i) => (
              <Bar
                key={ds.label}
                dataKey={ds.label}
                fill={ds.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="min-h-0" style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {config.datasets.map((ds, i) => (
            <Line
              key={ds.label}
              type="monotone"
              dataKey={ds.label}
              stroke={ds.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

type ChartErrorState = { error: Error | null };

class ChartErrorBoundary extends Component<
  { children: React.ReactNode; title: string },
  ChartErrorState
> {
  constructor(props: { children: React.ReactNode; title: string }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="text-sm text-muted-foreground italic py-2">
          No se pudo renderizar el gráfico: {this.props.title}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ChartRenderer({ config }: Props) {
  return (
    <ChartErrorBoundary title={config.title}>
      <div className="my-4">
        <ChartInner config={config} />
      </div>
    </ChartErrorBoundary>
  );
}
