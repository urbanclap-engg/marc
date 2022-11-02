export interface RootObject {
  INTERNAL_SERVICE: INTERNALSERVICE;
  MONGODB: MONGODB;
  MYSQL: MYSQL;
  REDSHIFT: REDSHIFT;
  SNOWFLAKE: SNOWFLAKE;
  ELASTICSEARCH: ELASTICSEARCH;
  KAFKA: KAFKA;
  CACHE: CACHE;
  auth_service: string;
  media_utils: string;
  event_producer: string;
  event_consumer: string;
  avro_event_producer: string;
  distributed_lock_manager: string;
  feature_config_manager: string;
  localization: string;
  coachmarks: string;
  AuditContext: string;
  AuditContextConstants: string;
  application_metrics: string;
  rate_limit: string;
  load_shed: string;
}
interface CACHE {
  cache_platform: string;
}
interface KAFKA {
  event_producer: string;
  event_consumer: string;
  event_producer_data: string;
  event_consumer_data: string;
}
interface ELASTICSEARCH {
  'test-elasticsearch-1': string;
  'test-elasticsearch-2': string;
}
interface SNOWFLAKE {
  'test-snowflake-1': string;
  'test-snowflake-2': string;
}
interface REDSHIFT {
  'test-redshift-1': string;
  'test-redshift-2': string;
}
interface MYSQL {
  'test-mysql-1': string;
  'test-mysql-2': string;
}
interface MONGODB {
  mongo_test: string;
}
interface INTERNALSERVICE {
  'test-service-1': string;
  'test-service-2': string;
}
