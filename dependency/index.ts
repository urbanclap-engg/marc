import { Microservice } from './microservice';
import { Mongodb } from './mongodb';
import { Mysql } from './mysql';
import { Events } from './events';
import { Cache } from './cache';
import { Redshift } from './redshift';
import { Snowflake } from './snowflake';
import { ElasticSearch } from './elasticsearch';
import { ExternalService } from './external_service';
import { DistributedLock } from './distributed_lock';
import { AuthService } from './auth_service';
import { MediaUtils } from './media_utils';
import { LocalizationService } from './localization';
import { AuditContext } from './audit_context';
import { FeatureConfigManager } from './feature_config_manager';
import { MycroftMonitoring } from './mycroft_monitoring';
import { Coachmarks } from './coachmarks';
import { RateLimit } from './rate_limit';
import { AutoUpdateCache } from './auto_update_cache';
import { Securitas } from './securitas';
import { XpLib } from './xp_lib';

const DEPENDENCY_TYPE = require('../constants').DEPENDENCY.TYPE;


export = {
  [DEPENDENCY_TYPE.INTERNAL_SERVICE]: Microservice.initMicroserviceClient,
  [DEPENDENCY_TYPE.MONGODB]: Mongodb.initMongodbClient,
  [DEPENDENCY_TYPE.MYSQL]: Mysql.initMysqlClient,
  [DEPENDENCY_TYPE.EVENT_PRODUCER]: Events.initEventProducer,
  [DEPENDENCY_TYPE.EVENT_CONSUMER]: Events.initEventConsumer,
  [DEPENDENCY_TYPE.CACHE]: Cache.initCacheClient,
  [DEPENDENCY_TYPE.AUTH_SERVICE]: AuthService.initAuthService,
  [DEPENDENCY_TYPE.MEDIA_UTILS]: MediaUtils.initMediaUtils,
  [DEPENDENCY_TYPE.REDSHIFT]: Redshift.initRedshiftClient,
  [DEPENDENCY_TYPE.SNOWFLAKE]: Snowflake.initSnowflakeClient,
  [DEPENDENCY_TYPE.ELASTICSEARCH]: ElasticSearch.initElasticSearchClient,
  [DEPENDENCY_TYPE.EXTERNAL_SERVICE]: ExternalService.initExternalServiceClient,
  [DEPENDENCY_TYPE.DISTRIBUTED_LOCK_MANAGER]: DistributedLock.initDistributedLockManager,
  [DEPENDENCY_TYPE.LOCALIZATION]: LocalizationService.initLocalizationClient,
  [DEPENDENCY_TYPE.AUDIT_CONTEXT]: AuditContext.initAuditContext,
  [DEPENDENCY_TYPE.FEATURE_CONFIG_MANAGER]: FeatureConfigManager.initFeatureConfigManager,
  [DEPENDENCY_TYPE.COACHMARKS]: Coachmarks.initCoachmarks,
  [DEPENDENCY_TYPE.APPLICATION_METRICS]: MycroftMonitoring.initApplicationMonitoringClient,
  [DEPENDENCY_TYPE.RATE_LIMIT]: RateLimit.initRateLimit,
  [DEPENDENCY_TYPE.SECURITAS]: Securitas.initSecuritasClient,
  [DEPENDENCY_TYPE.XP_LIB]: XpLib.initXp,
  [DEPENDENCY_TYPE.AUTO_UPDATE_CACHE]: AutoUpdateCache.initiate,
}
