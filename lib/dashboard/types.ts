export type MetricTone = "positive" | "negative" | "warning" | "neutral";

export type Metric = {
  label: string;
  value: string;
  change?: string;
  tone?: MetricTone;
};

export type TimelineStatus = "success" | "warning" | "error" | "info";

export type TimelineItem = {
  id: string;
  title: string;
  description: string;
  at: string;
  status?: TimelineStatus;
};

export type TaskItem = {
  id: string;
  title: string;
  detail?: string;
  at?: string;
};

export type AdminDashboardSnapshot = {
  metrics: Metric[];
  timeline: TimelineItem[];
  tasks: TaskItem[];
};

export type InventoryRow = {
  bloodType: string;
  credits: number;
  units: number;
  expiresSoon?: boolean;
};

export type OrganizationDashboardSnapshot = {
  organization?: {
    organizationId: string;
    name?: string;
    status?: string;
    city?: string;
  };
  metrics: Metric[];
  inventory: InventoryRow[];
  timeline: TimelineItem[];
};

export type DonorDashboardSnapshot = {
  donor?: {
    userId: string;
    name?: string;
    bloodType?: string;
  };
  metrics: Metric[];
  timeline: TimelineItem[];
  upcoming: TaskItem[];
};

export type RiskLevel = "low" | "medium" | "high";

export type RiskItem = {
  id: string;
  title: string;
  detail?: string;
  severity: RiskLevel;
};

export type InventoryOverviewRow = {
  bloodType: string;
  totalCredits: number;
  organizations: number;
  lowStock?: boolean;
};

export type GovernmentDashboardSnapshot = {
  metrics: Metric[];
  timeline: TimelineItem[];
  risks: RiskItem[];
  inventory: InventoryOverviewRow[];
};
