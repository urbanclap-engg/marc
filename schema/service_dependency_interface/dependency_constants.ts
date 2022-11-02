import { RootObject as IdType } from "./dependency_id"
export interface DependencyType {
    readonly SLACK_ALERT_CHANNEL: string,
    readonly CONFIG_PATH: string,
    readonly JAVASCRIPT_WORKFLOW_PATH: string,
    readonly TYPESCRIPT_WORKFLOW_PATH: string,
    ID: IdType,
    TYPE: {
      readonly AUDIT_CONTEXT: unique symbol,
      readonly EVENT_PRODUCER: unique symbol,
      readonly EVENT_CONSUMER: unique symbol,
      readonly CACHE: unique symbol,
      readonly REDSHIFT: unique symbol,
      readonly ELASTICSEARCH: unique symbol,
      readonly DISTRIBUTED_LOCK_MANAGER: unique symbol,
      readonly FEATURE_CONFIG_MANAGER: unique symbol,
      readonly AUTH_SERVICE: unique symbol,
      readonly MEDIA_UTILS: unique symbol,
      readonly OPTIONS: unique symbol,
      readonly LOCALIZATION: unique symbol,
      readonly COACHMARKS: unique symbol,
      readonly RATE_LIMIT: unique symbol,
      readonly XP_LIB: unique symbol,
      readonly SECURITAS: unique symbol,
      readonly TEST: unique symbol,
      readonly AUTO_UPDATE_CACHE: unique symbol,
      readonly MONGODB: unique symbol,
      readonly MYSQL: unique symbol,
      readonly INTERNAL_SERVICE: unique symbol,
      readonly SNOWFLAKE: unique symbol,
      readonly EXTERNAL_SERVICE: unique symbol,
      readonly APPLICATION_METRICS: unique symbol,
      readonly COMMUNICATION_MODULE?: unique symbol,
      readonly LOAD_SHED?: unique symbol,
      readonly WORKFLOW_METRICS?: unique symbol
    },
    CONNECTION:  { readonly MONGODB_CONNECTION: string  }
  }
  