import { AuditContext, Localization, Mongodb, ApplicationMatrics, InternalService, FeatureConfigManager, AuthService, AutoUpdateCache, Cache, DistributedLockManager, Coachmarks, CommunicationModule, ElasticSearch, EventConsumer, EventProducer, ExternalService, LoadShed, MediaUtils, Mysql, Options, RateLimit, Redshift, Securitas, Snowflake, WorkflowMetrics, XpLib} from './index'
import { DependencyType } from './dependency_constants'
const RPC_CONSTANTS = require('../../constants');
export interface DependencyConfigType {
    service: ServiceType,
    workflow?: any
}

const DEPENDENCY: DependencyType = RPC_CONSTANTS.DEPENDENCY;
 
interface ServiceType {
    [DEPENDENCY.TYPE.APPLICATION_METRICS]?: ApplicationMatrics[],
    [DEPENDENCY.TYPE.AUDIT_CONTEXT]?: AuditContext[],
    [DEPENDENCY.TYPE.AUTH_SERVICE]?: AuthService[],
    [DEPENDENCY.TYPE.AUTO_UPDATE_CACHE]?: AutoUpdateCache[],
    [DEPENDENCY.TYPE.CACHE]?: Cache[],
    [DEPENDENCY.TYPE.COACHMARKS]?: Coachmarks[],
    [DEPENDENCY.TYPE.DISTRIBUTED_LOCK_MANAGER]?: DistributedLockManager[],
    [DEPENDENCY.TYPE.ELASTICSEARCH]?: ElasticSearch[],
    [DEPENDENCY.TYPE.EVENT_CONSUMER]?: EventConsumer[],
    [DEPENDENCY.TYPE.EVENT_PRODUCER]?: EventProducer[],
    [DEPENDENCY.TYPE.EXTERNAL_SERVICE]?: ExternalService[],
    [DEPENDENCY.TYPE.FEATURE_CONFIG_MANAGER]?: FeatureConfigManager[],
    [DEPENDENCY.TYPE.INTERNAL_SERVICE]?: InternalService[],
    [DEPENDENCY.TYPE.LOCALIZATION]?: Localization[],
    [DEPENDENCY.TYPE.MEDIA_UTILS]?: MediaUtils[],
    [DEPENDENCY.TYPE.MONGODB]?: Mongodb[],
    [DEPENDENCY.TYPE.MYSQL]?: Mysql[],
    [DEPENDENCY.TYPE.OPTIONS]?: Options[],
    [DEPENDENCY.TYPE.RATE_LIMIT]?: RateLimit[],
    [DEPENDENCY.TYPE.REDSHIFT]?: Redshift[],
    [DEPENDENCY.TYPE.SECURITAS]?: Securitas[],
    [DEPENDENCY.TYPE.SNOWFLAKE]?: Snowflake[],
    [DEPENDENCY.TYPE.XP_LIB]?: XpLib[]
}
