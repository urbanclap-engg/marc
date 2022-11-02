export interface WorkflowMetrics {
  id: string;
  workflowMetrics?: WorkflowMetric[];
}
interface WorkflowMetric {
  metricName?: string;
  help?: string;
  labelNames?: string[];
  metricType?: "counter" | "gauge";
  enabled?: boolean;
}