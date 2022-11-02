export interface AutoUpdateCache {
  id: string;
  cacheKey?: string;
  cronTime?: string;
  updateActivationDelayInSeconds?: number;
  dataSource?: {
    type: "SERVICE";
    serviceName?: string;
    api?: {
      name: string;
      params: {
        [k: string]: unknown;
      };
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  cacheOptions?: {
    useClones?: boolean;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}