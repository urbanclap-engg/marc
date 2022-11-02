import _ from 'lodash';
import fs from 'fs';
import Error from '../../error';
import { Logger } from '../standard_logger';
import { LOG_CONSTANTS, LOG_TYPE } from '../constants';
import { ConfigUtils } from "../../common/config_utils"

let ECSMetadata = null;


export const LoggingUtils = {
	getTaskId: () => {
		let taskArn = getECSMetaData().TaskARN;
		return taskArn && _.isString(taskArn) && taskArn.split('/')[1] ? taskArn.split('/')[1] : 'unknown';
	},
	getContainerId: () => {
		let containerID = getECSMetaData().ContainerID;
		return containerID && _.isString(containerID) ? containerID.substr(0, 12) : 'unknown';
	},
	getContainerIp : () => {
		return getECSMetaData().HostPrivateIPv4Address;
	},
	getBuildVersion: () => {
		return getECSMetaData().TaskDefinitionRevision;
	},
	getContainerPort: () => {
		let portMappings = getECSMetaData().PortMappings;
		if (portMappings && _.isArray(portMappings)) {
			let mapping = portMappings[0];
			return mapping && mapping.HostPort ? mapping.HostPort : 'unknown';
		}
	},
	getServicePort: () => {
		let portMappings = getECSMetaData().PortMappings;
		if (portMappings && _.isArray(portMappings)) {
			let mapping = portMappings[0];
			return mapping && mapping.ContainerPort ? mapping.ContainerPort : 'unknown';
		}
	}
}

const getECSMetaData = () => {
	if (!ECSMetadata) {
		if (process.env.ECS_CONTAINER_METADATA_FILE && fs.existsSync(process.env.ECS_CONTAINER_METADATA_FILE)) {
			try {
					ECSMetadata = ConfigUtils.readJsonFile(process.env.ECS_CONTAINER_METADATA_FILE);
			} catch (err) {
					let logData = {};
					logData[LOG_CONSTANTS.SYSTEM_LOGS.LOG_TYPE] = LOG_TYPE.RPC_SYSTEM;
					logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1] = 'ecs_metadata_status';
					logData[LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE] = "failed";
					logData[LOG_CONSTANTS.SYSTEM_LOGS.ERROR_TYPE] = Error.RPC_FILE_LOAD_ERROR;
					logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_MESSAGE] = "Failed to fetch and load ECS Metadata. "
					+ (err ? (err.message || err.err_message) : 'NA');
					logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR_STACK] = err ? (err.stack || err.err_stack) : "NA";
					logData[LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR] = err;
					Logger.error(logData);
			}
		} else {
				ECSMetadata = {};
		}
	}
	return ECSMetadata;
}
