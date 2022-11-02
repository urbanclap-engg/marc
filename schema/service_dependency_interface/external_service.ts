export interface ExternalService {
  id: string;
  options: Options;
  isotope?: {
    [k: string]: unknown;
  };
}
interface Options {
  CIRCUIT_BREAKER_OPTIONS?: {
    ENABLE?: boolean;
    TIMEOUT?: number;
    CIRCUIT_BREAKER_FORCE_CLOSED?: boolean;
    CIRCUIT_BREAKER_ERROR_THRESHOLD_PERCENTAGE?: number;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}