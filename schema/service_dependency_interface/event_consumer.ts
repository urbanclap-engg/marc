export interface EventConsumer {
  id: string;
  whitelisted_id?: string;
  options?: {
    eventProcessingWaitTimeMs?: number;
    concurrency?: number;
    [k: string]: unknown;
  };
  message_handler: string;
  error_handler?: string;
}