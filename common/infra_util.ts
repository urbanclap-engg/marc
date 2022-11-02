import _ from 'lodash';
import { getSingleton } from '../singleton';
import { ConfigUtils } from './config_utils';
import PrometheusServiceUtil from '../monitoring/prometheus-service-util';

const ENV = ConfigUtils.getCurrentEnv();
const ECSClusterMap = {
  'development': 'dev-cluster',
  'staging': 'stage-cluster-private',
  'production': 'prod-cluster-private'
};
const Singleton = getSingleton();


export const InfraUtil = {
  getContainerCount: async (serviceId?: string) => {
    serviceId = serviceId || Singleton.Config['SERVICE_ID']
    const ecsLabels = {
      service: serviceId + '-' + ENV,
      cluster: _.get(Singleton.Config.INFRA_CONF, `${serviceId}.deployment.ecs_cluster`) || ECSClusterMap[ENV]
    }
    const result = await PrometheusServiceUtil.getQueryResult('ecs_service_desired_tasks', ecsLabels);
    return (_.size(result) > 0 ? Number(_.get(result[0], 'value[1]')) : undefined);
  }
}