export interface EventProducer {
  id: string;
  whitelisted_id?: string;
  event_config?: {
    [k: string]: unknown;
  };
  error_handler?: string;
  schema_type?: "avro" | "json";
}