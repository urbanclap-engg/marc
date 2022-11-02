export interface InternalService {
  id: string;
  branch?: string;
  version: number;
  sub_service_ids?: unknown[];
  isotope?: {
    [k: string]: unknown;
  };
  singleton_id?: string;
  api_configs?: {
    [k: string]: unknown;
  }[];
}