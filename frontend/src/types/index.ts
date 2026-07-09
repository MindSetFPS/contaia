export type User = {
  id: number;
  email: string;
  name: string;
};

export type Client = {
  id: number;
  name: string;
  razon_social?: string;
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

export type Conversation = {
  id: number;
  client_id: number;
  title: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
};

export type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  chart_config?: ChartConfig | null;
  created_at: string;
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
