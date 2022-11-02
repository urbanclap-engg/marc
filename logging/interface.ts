type LoggingObject = Partial<{
  //SERVICE_LEVEL_PARAMS
  key_1: string;
  key_1_value: string;
  key_2: string;
  key_2_value: string;
  key_3: string;
  key_3_value: string;
  numkey_1: string;
  numkey_1_value: number;
  numkey_2: string;
  numkey_2_value: number;
  numkey_3: string;
  numkey_3_value: number;

  //COMMON_PARAMS
  customer_request_id: string;
  provider_id: string;
  customer_id: string;
  lead_id: string;
  method_name: string;

  //STRINGIFY_OBJECTS
  message: string;
  error_stack: string;
  error_payload: string;
  error: {err_type: string, err_message: string};
  error_message: string;
  error_type: string;
}> | Record<string, any>

export type LoggerInterface = {
  info: (log: LoggingObject) => void;
  error: (log: LoggingObject) => void;
  debug: (log: LoggingObject) => void;
}

export interface StandardLoggerInterface {
  system (port: any, message: any): void;
  info (data: LoggingObject): void;
  error (data: LoggingObject): void;
  debug (options: any, data: LoggingObject): void;
  api_success (response: any, extra: any): void;
  api_error (response: any, extra: any, error: any): void;
  exitAfterFlush (): void;
}
