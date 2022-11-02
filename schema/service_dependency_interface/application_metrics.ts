
export interface ApplicationMatrics {
  id: string;
  applicationMetrics?: ApplicationMetric[];
} 

interface ApplicationMetric {
  metricName: string;
  help: string;
  labelNames: string[];
  metricType?: "counter" | "gauge" | "histogram";
  buckets?: number[];
  enabled: boolean;
}
  