import { Authentication } from './authentication';
import { clientAuthorisation as Authorisation } from './authorisation';
import RPC_CONSTANTS from '../constants';
import {AuthMetricUtility as AuthMetricUtils} from './auth_metric_utils';
AuthMetricUtils.initAuthMetric();

export = {
  [RPC_CONSTANTS.GATEWAY.MIDDLEWARE.AUTH_METHOD.CAPTCHA_AUTHENTICATION]: Authentication.isCaptchaAuthenticated,
  [RPC_CONSTANTS.GATEWAY.MIDDLEWARE.AUTH_METHOD.CLIENT_AUTHENTICATION]: Authentication.isClientAuthenticatedAndAuthorized,
  [RPC_CONSTANTS.GATEWAY.MIDDLEWARE.AUTH_METHOD.CLIENT_AUTHORISATION]: Authorisation.isAuthorised,
  [RPC_CONSTANTS.GATEWAY.MIDDLEWARE.AUTH_METHOD.GOOGLE_AUTHENTICATION]: Authentication.isGoogleAuthenticated
}