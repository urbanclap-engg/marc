import { getSingleton } from "../singleton";
import * as Error from '../error';
import { uploadDataToS3, logError, logInfo } from './utils';
import _ from 'lodash';
import * as Pprof from 'pprof';
import PROFILER_CONSTANTS from './constants';
import CONSTANTS from '../constants';
import { ProfileType } from "./interface";
const Singleton = getSingleton();
async function triggerCpuOnDemandProfiler(duration, fileName) {
  const profile = await Pprof.time.profile({
    durationMillis: duration || PROFILER_CONSTANTS.DEFAULT_CPU_PROFILE_TIME,    // time in milliseconds for which to collect profile.
  });
  const buf = await Pprof.encode(profile);
  const s3Path = `${ProfileType.CPU}/${fileName}`;
  uploadDataToS3(buf, s3Path);
}

function triggerCpuContinuousProfiler() {
  const profilerCredentials = getContinuousProfilerCredentials();

  if (!validateCredentials(profilerCredentials)) {
    return logError(Error.DEPENDENCY_INITIALIZATION_ERROR, 'Cpu continuous profiler credentials are invalid');
  }

  startContinuousProfiler(profilerCredentials);
}

function getContinuousProfilerCredentials() {
  return _.get(Singleton.Config, `CUSTOM.${CONSTANTS.CMS.GLOBAL_CREDENTIALS_PATH}.continuousProfiler`, {});
}

function validateCredentials(credentials) {
  return _.has(credentials, 'projectId')
    && _.has(credentials, 'email')
    && _.has(credentials, 'key');
}

function startContinuousProfiler(credentials) {
  require('@google-cloud/profiler').start({
    serviceContext: {
      service: process.env.CONTINUOUS_PROFILER_SERVICE_NAME
    },
    projectId: credentials.projectId,
    credentials: {
      client_email: credentials.email,
      private_key: credentials.key
    },
    disableHeap: true
  });
}

export default {
  triggerCpuOnDemandProfiler,
  triggerCpuContinuousProfiler
}