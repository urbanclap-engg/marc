
export interface ConfigInterface {
    initConfig: (service_id: string, options: object) => object,
    getSourceType: () => string
  }