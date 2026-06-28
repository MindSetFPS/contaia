import { Component } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
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

function TableChart({ config }: { config: ChartConfig }) {
  const headers = ["", ...config.datasets.map((d) => d.label)];
  const rows = config.labels.map((label, i) => [
    label,
    ...config.datasets.map((d) => d.data[i]?.toLocaleString() ?? ""),
  ]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left py-1.5 pr-4 font-normal text-muted-foreground last:text-right">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className={`py-1 pr-4 ${ci === 0 ? "" : "text-right"} ${ci === 0 ? "text-foreground" : "text-muted-foreground"}`}>
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

function ChartInner({ config }: Props) {
  if (config.chart_type === "table") {
    return <TableChart config={config} />;
  }

  const chartData = config.labels.map((label, i) => {
    const point: Record<string, string | number> = { name: label };
    for (const ds of config.datasets) {
      point[ds.label] = ds.data[i] ?? 0;
    }
    return point;
  });

  const sharedAxisProps = {
    tick: { fontSize: 12, fill: "var(--muted-foreground)" },
    axisLine: false,
    tickLine: false,
  };

  if (config.chart_type === "pie") {
    const ds = config.datasets[0];
    if (!ds) return null;
    return (
      <div className="min-h-0" style={{ height: 260 }}>
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
              outerRadius={90}
              innerRadius={45}
            >
              {config.labels.map((_, i) => (
                <Cell
                  key={i}
                  fill={ds.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (config.chart_type === "bar") {
    return (
      <div className="min-h-0" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4} barCategoryGap="20%">
            <XAxis dataKey="name" {...sharedAxisProps} />
            <YAxis {...sharedAxisProps} />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: 13,
              }}
            />
            {config.datasets.map((ds, i) => (
              <Bar
                key={ds.label}
                dataKey={ds.label}
                fill={ds.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]}
                radius={[3, 3, 0, 0]}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="min-h-0" style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis dataKey="name" {...sharedAxisProps} />
          <YAxis {...sharedAxisProps} />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontSize: 13,
            }}
          />
          {config.datasets.map((ds, i) => (
            <Line
              key={ds.label}
              type="monotone"
              dataKey={ds.label}
              stroke={ds.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
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
