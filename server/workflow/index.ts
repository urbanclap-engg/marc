import _ from 'lodash';
import { DependencyLoader } from '../common/dependency_loader';
import RPC_CONSTANTS from '../../constants';
import cronParser from 'cron-parser';
import Error from '../../error';
import { Slack } from '../../slack';
import { Logger } from '../../logging/standard_logger';
import { LOG_CONSTANTS, LOG_TYPE } from '../../logging/constants';
import {Profiler} from '../../profiler';
import PROFILER_CONSTANTS from '../../profiler/constants';
import { MycroftMonitoring } from '../../dependency/mycroft_monitoring';
import { OpenApiSchema } from '../../schema/services';
import { Securitas } from "../../dependency/securitas";
import * as CredentialManagement from '../../credential_management';
import { startTransaction as BackgroundTransactionTracker } from '../../monitoring/background-transaction-tracker';
import { Strategy, ProfileType } from '../../profiler/interface';

let TASK_NAME;
let SERVICE_ID;
let alertChannel = RPC_CONSTANTS.WORKFLOW.DEFAULT_ALERT_CHANNEL;
const WORKFLOW = 'workflow';
const IS_CONTINUOUS_PROFILER_ENABLED = process.env.CONTINUOUS_PROFILER_ENABLED == 'true' ? true : false;
const SERVICE_PACKAGE_JSON = require(RPC_CONSTANTS.REPO_DIR_PATH + '/package.json');
const ERROR_TYPES = RPC_CONSTANTS.WORKFLOW.ERROR_TYPES;


export class Workflow {
  SERVICE_ID: string;
  rpcFramework: any;
  config: ClientMap;
  Logger: ClientMap;
  SERVICE_TYPE: string;
  DEPENDENCY_CONFIG_PATH: string;
  startTime: any;
  TASK_NAME: string;
  TASK_PARAMS: any;
  TASK_EXECUTION_TIME: any;
  TASK_CRON_TIME: any;
  TASK_TRY_COUNT: any;

  constructor(rpc_framework) {
    SERVICE_ID = this.SERVICE_ID = SERVICE_PACKAGE_JSON.name;
    this.rpcFramework = rpc_framework;
    let options = {
      source_type : RPC_CONSTANTS.SOURCE_TYPE.WORKFLOW
    }
    this.config = this.rpcFramework.initConfig(this.SERVICE_ID, options);
    
    Slack.initSlack(this.SERVICE_ID);
    Error.initUCError();
    Error.initRPCError();
    this.Logger = this.rpcFramework.initLogger(this.SERVICE_ID);
    const ucServiceType = _.get(SERVICE_PACKAGE_JSON, 'urbanclap.service_type', null);
    this.SERVICE_TYPE = (ucServiceType === null) ? _.get(SERVICE_PACKAGE_JSON, 'service_type', 'javascript') : ucServiceType;
    this.rpcFramework.SERVICE_TYPE = this.SERVICE_TYPE;
    this.startTime = new Date();
    TASK_NAME = this.TASK_NAME = process.argv[2];
    this.TASK_PARAMS = process.argv[3] ? JSON.parse(process.argv[3]) : undefined;

    this.DEPENDENCY_CONFIG_PATH = RPC_CONSTANTS.REPO_DIR_PATH + RPC_CONSTANTS.DEPENDENCY.CONFIG_PATH;
    this.TASK_EXECUTION_TIME = process.argv[4];
    this.TASK_CRON_TIME = process.argv[5];
    // process.argv[6] is task try count. Also, TASK_EXECUTION_TIME remains same for all retries
    this.TASK_TRY_COUNT = process.argv[6];
    this.rpcFramework.addToSingleton('task_params', this.TASK_PARAMS);

    /* Log all uncaught exceptions properly and exit gracefully */
    process.on("uncaughtException", function (err) {
      logExitInfo(err, ERROR_TYPES.UNCAUGHT_EXCEPTION)
      exitWorkflow(1);
    });
  
    /* Log all uncaught rejection properly and exit gracefully */
    process.on("unhandledRejection", function (reason, p) {
      logExitInfo(reason, ERROR_TYPES.UNCAUGHT_REJECTION)
      exitWorkflow(1);
    });
  }

  initDependency = async () => {
    let self = this;
    const DEPENDENCY_CONFIG = _.get(require(this.DEPENDENCY_CONFIG_PATH), `Config.workflow.${this.TASK_NAME}`)
    if(!DEPENDENCY_CONFIG) {
      throw new Error.RPCError({err_type: Error.RPC_REQUEST_INVALID_ERROR, err_message: 
        `Aborting. dependency.config.json is wrongly configured. Cannot find this path: Config.workflow.${this.TASK_NAME}`});
    }
    alertChannel = _.get(DEPENDENCY_CONFIG, `${RPC_CONSTANTS.DEPENDENCY.TYPE.OPTIONS}.alert_channel`, RPC_CONSTANTS.WORKFLOW.DEFAULT_ALERT_CHANNEL)
    const isValidateTaskExecutionTime = (this.TASK_PARAMS && (this.TASK_PARAMS.validateTaskExecutionTime === false)) ? false : true;
    if(isValidateTaskExecutionTime) {
      validateTaskExecutionTime(this.TASK_EXECUTION_TIME, this.TASK_CRON_TIME);
    } 
    
    let logData = {}
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'server_type';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = WORKFLOW;
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'task_name';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = this.TASK_NAME;
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_3] = 'status';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_3_VALUE] = 'loading';
    logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
    this.Logger.info(logData)

    OpenApiSchema.init(this.SERVICE_ID);

    try {
      await Securitas.initSecuritasClient({id: 'Securitas'}, self.rpcFramework);

      const updatedConfig = await CredentialManagement.initCredentials(this.SERVICE_ID);

      if (updatedConfig) self.config = updatedConfig;

      await DependencyLoader.init(self.rpcFramework, DEPENDENCY_CONFIG);

      if (IS_CONTINUOUS_PROFILER_ENABLED) Profiler.triggerProfiler(Strategy.CONTINUOUS, ProfileType.CPU);

      MycroftMonitoring.initMonitoringClient(this.SERVICE_ID, self.rpcFramework);

    } catch (err) {
      logExitInfo(err, ERROR_TYPES.WORKFLOW_DEPENDENCY_ERROR, self);
      exitWorkflow(1);
    }
  }
  
  initServer = async (taskController ?: any) => {
    let self = this;
    try {
      let task = taskController? taskController: require(getWorkflowPath(self.SERVICE_TYPE) + self.TASK_NAME);
      let runFunc = task.run.bind(task); // This is done to preserve 'this' context in run function
      let runTaskMonitored = getMonitoredTaskRunFunc(runFunc, self.TASK_NAME, WORKFLOW);
      const result = await runTaskMonitored(self.rpcFramework.getSingleton());

      const date: any = new Date();
      let logData = {}
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'server_type';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = WORKFLOW;
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'task_name';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = self.TASK_NAME;
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_3] = 'status';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_3_VALUE] = 'success';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_1] = 'time_in_ms';
      logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_1_VALUE] = date - self.startTime;
      logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
      self.Logger.info(logData)

      exitWorkflow(0);
    } catch (err) {
      logExitInfo(err, ERROR_TYPES.WORKFLOW_SERVER_ERROR, self);
      exitWorkflow(1);
    }
  }
}

//Logic for internal use

const getMonitoredTaskRunFunc = (runTask, taskName, taskType) => {
  return async function decoratedFunction(...args){
      return await BackgroundTransactionTracker(taskType, taskName, runTask, ...args);
  }
}

const getWorkflowPath = (SERVICE_TYPE) => {
  if (SERVICE_TYPE === 'typescript') {
    return RPC_CONSTANTS.REPO_DIR_PATH + RPC_CONSTANTS.DEPENDENCY.TYPESCRIPT_WORKFLOW_PATH;
  }
  return RPC_CONSTANTS.REPO_DIR_PATH + RPC_CONSTANTS.DEPENDENCY.JAVASCRIPT_WORKFLOW_PATH;
}

const areUTCDateEqual = (date1, date2) => {
  if(date1.getUTCDate() == date2.getUTCDate() 
    && date1.getUTCMonth() == date2.getUTCMonth() 
    && date1.getUTCFullYear() == date2.getUTCFullYear()) {
    return true;
  }
  return false
}

const validateTaskExecutionTime = (execution_time, cron_time) => {
  if(!execution_time || !cron_time)
    return;
  
  let taskInterval;
  try {
    taskInterval = cronParser.parseExpression(cron_time, {utc: true});
  } catch(err) {
    let logData = {}
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'cron_parse_failed';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = 
      `cron parser was unable to parse the task cron time : ${cron_time}. This can happen for airflow specific cron time like @once`;
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'task_name';
    logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = TASK_NAME;
    Logger.info(logData)
    return;
  }
  
  let lastScheduledExecutionTime = taskInterval.prev();
  let executionTime = new Date(execution_time);
  // validate if the received task was scheduled in the current day only
  if(!areUTCDateEqual(new Date(), executionTime)) {
    throw new Error.RPCError({err_type: Error.RPC_REQUEST_INVALID_ERROR, err_message: `Aborting. Task execution time (dateOfMonth = ${executionTime.getUTCDate()}) is not of today`});
  }

  // validate if there is any task scheduled for the current date
  if(!areUTCDateEqual(new Date(), new Date(lastScheduledExecutionTime.toString()))) {
    throw new Error.RPCError({err_type: Error.RPC_REQUEST_INVALID_ERROR, err_message: `Aborting. Last scheduled execution time
    (dateOfMonth = ${lastScheduledExecutionTime.getUTCDate()}) is not of today`});
  }

  // validate if the received task was triggered after the last scheduled execution time of the task.
  let executionTimeDiffInMins = (executionTime.getTime() - lastScheduledExecutionTime.getTime()) / 60000;
  if(executionTimeDiffInMins < RPC_CONSTANTS.WORKFLOW.EXECUTION_TIME_DIFF_THRESHOLD) {
    throw new Error.RPCError({err_type: Error.RPC_REQUEST_INVALID_ERROR, err_message: `Aborting. Task execution time ${executionTime.toUTCString()} is expired. 
      Execution time should be of current date(UTC) and after the last scheduled execution time: ${lastScheduledExecutionTime.toString()}`});
  }
}

const logExitInfo = (err, error_type, self ?: any) => {
  let runTime;
  if (_.get(self, 'startTime'))  {
    const date: any = new Date();
    runTime = date - self.startTime;
  }

  let logData = {}
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'server_type';
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = WORKFLOW;
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2] = 'task_name';
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_2_VALUE] = TASK_NAME;
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_3] = 'status';
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_3_VALUE] = 'failed';
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_1] = 'time_in_ms';
  logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.NUMKEY_1_VALUE] = runTime;
  logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
  logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = error_type;
  logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = (err ? (err.message || err.err_message) : 'NA');
  logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = (err ? (err.stack || err.err_stack) : 'NA');
  logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR] = JSON.stringify(err);
  
  Logger.error(logData)
  return logData;
}

const exitWorkflow = (status) => {
  setInterval((function() {
    process.exit(status);
  }), 2000);
}