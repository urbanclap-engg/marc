import RPC_CONSTANTS from '../constants';
const constants  = {
  STRATEGY: {
    ON_DEMAND: 'on-demand',
    CONTINUOUS: 'continuous'
  },
  TYPE: {
    MEMORY: 'memory',
    CPU: 'cpu'
  },
  EXTENSION: {
    MEMORY: '.heapsnapshot',
    CPU: '.pb.gz'
  },
  S3_PROFILE_BUCKET: RPC_CONSTANTS.PROFILER.S3_PROFILE_BUCKET,
  AWS_REGION: RPC_CONSTANTS.PROFILER.AWS_REGION,
  DEFAULT_CPU_PROFILE_TIME: 300000,
  S3_PROFILE_BUCKET_URL: RPC_CONSTANTS.PROFILER.S3_PROFILE_BUCKET_URL,
  S3_UPLOAD_FAILED_ERROR: 's3_upload_failed'
};

export default constants;