import MemoryProfiler from './memory-profiler';
import PROFILER_CONSTANTS from './constants';
import CpuProfiler from './cpu-profiler';
import { GetFileName, ProfilerInterface, ProfileType, Strategy, TriggerContinuousProfiler, TriggerOnDemandProfiler } from './interface'
const SERVICE_ID = require(process.cwd() + '/package.json').name;
export const Profiler: ProfilerInterface = {
  triggerProfiler: (startegy: Strategy, profileType: ProfileType, duration?: number) => {
    switch (startegy) {
      case Strategy.ON_DEMAND:
        return triggerOnDemandProfiler(profileType, duration)
      case Strategy.CONTINUOUS:
        return triggerContinuousProfiler(profileType)
    }
  }

};

const triggerOnDemandProfiler: TriggerOnDemandProfiler = (profileType: ProfileType, duration: number) => {
  const fileName = getFileName(profileType);
  const s3Url = PROFILER_CONSTANTS.S3_PROFILE_BUCKET_URL + profileType + `/${fileName}`;

  switch (profileType) {
    case ProfileType.MEMORY: {
      MemoryProfiler.takeSnapshot(fileName);
      break;
    }
    case ProfileType.CPU: {
      CpuProfiler.triggerCpuOnDemandProfiler(duration, fileName);
      break;
    }
  }

  return s3Url;
}

const triggerContinuousProfiler: TriggerContinuousProfiler = (profileType: ProfileType) => {
  switch (profileType) {
    case ProfileType.CPU:
      return CpuProfiler.triggerCpuContinuousProfiler();
  }
}

const getFileName: GetFileName = (profileType: ProfileType) => {
  const profilerTypeKey = profileType.toUpperCase();
  return `${SERVICE_ID}-${Date.now() + PROFILER_CONSTANTS.EXTENSION[profilerTypeKey]}`;
}
