export type User = {
  id: number;
  email: string;
  name: string;
};

export type Client = {
  id: number;
  name: string;
  rfc?: string;
  industry?: string;
};

export type Period = {
  id: string;
  year: number;
  month: number;
  label: string;
};

export type ChartConfig = {
  chart_type: "line" | "bar" | "pie" | "table";
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
  period_label?: string;
};

export type ChatResponse = {
  answer_text: string;
  chart_config: ChartConfig | null;
};

export type Insight = {
  id: number;
  question: string;
  answer_text: string;
  chart_config: string;
  is_refreshable: boolean;
  created_at: string;
  period_date: string;
};
