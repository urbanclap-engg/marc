'use strict';

import * as _ from 'lodash';
import { Logger } from './logging/standard_logger';
import { LOG_CONSTANTS } from './logging/constants';
import { Config } from './config';
import RequestPromise from 'request-promise';
import * as Singleton from './singleton';
import CONSTANTS from './constants';

const LOOKUP_USER_BY_EMAIL = 'https://slack.com/api/users.lookupByEmail';


export const Slack = {
  sendSlackMessage: (senderName, msg, channelName, iconEmoji = ':incoming-webhook:') => {
    if (process.env.NODE_ENV !== CONSTANTS.ENVIRONMENT.PRODUCTION) return Promise.resolve();
  
    return sendSlackRequest(CONSTANTS.SLACK.API.WEB_HOOK, {
      channel: channelName,
      username: senderName,
      icon_emoji: iconEmoji,
      text: (((typeof msg) === 'string') ? msg : JSON.stringify(msg)),
    });
  },

  sendSlackBlockMessage: (senderName, blocks, channelName, iconEmoji = ':bulb:') => {
    return sendSlackRequest(CONSTANTS.SLACK.API.POST_MESSAGE, {
      channel: channelName,
      username: senderName,
      icon_emoji: iconEmoji,
      blocks,
    });
  },

  serverRestartAlert: async (serviceId, err) => {
    const config = Config.initConfig(serviceId, {});
    const channelName = _.get(config, 'CUSTOM.slack_channel_exception') || '#engg-exceptions-sm';
    return Slack.sendSlackMessage(serviceId, err, channelName);
  },

  serverExceptionAlert: (serviceId, err) => {
    const config = Config.initConfig(serviceId, {});
    const channelName = _.get(config, 'CUSTOM.slack_channel_exception') || '#engg-exceptions-sm';
    return Slack.sendSlackMessage(serviceId, err, channelName);
  },

  sendCustomMessage: (serviceId, message) => {
    const config = Config.initConfig(serviceId, {});
    const channelName = _.get(config, 'CUSTOM.slack_channel_exception') || '#engg-exceptions-sm';
    return Slack.sendSlackMessage(serviceId, message, channelName);
  },

  // Reason as custom message is also sending alert on CUSTOM.slack_channel_exception 
  sendCustomMessageOnChannel: (serviceId, message, configKey) => {
    const config = Config.initConfig(serviceId, {});
    const channelName = _.get(config, 'CUSTOM.'+ configKey);
    if(channelName)
      return Slack.sendSlackMessage(serviceId, message, channelName);
  },

  lookupUserByEmail: async (emailId, slackToken) => {
    const url = `${LOOKUP_USER_BY_EMAIL}?email=${emailId}`;
    const options = createOptions('GET', url, slackToken);
    return RequestPromise(options)
      .promise()
      .then(response => {
        return {
          username: _.get(response, 'user.name'),
          name: _.get(response, 'user.profile.real_name'),
          phone: _.get(response, 'user.profile.phone'),
        }
      })
      .catch(err => Logger.error({
        [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1]: 'senderName',
        [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE]: 'lookupUserByEmail',
        [LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR]: err
      }));
  },

  initSlack: (service_id) => {
    const slackObject = {
      sendCustomMessage: (message) => Slack.sendCustomMessage(service_id, message),

      // This method will be deprecated soon as this requires the channel to be present in service-config file. Please use sendSlackMessage().
      sendCustomMessageOnChannel: (message, channel) => Slack.sendCustomMessageOnChannel(service_id, message, channel),
      
      sendSlackMessage: Slack.sendSlackMessage,
      sendSlackBlockMessage: Slack.sendSlackBlockMessage,
      lookupUserByEmail: Slack.lookupUserByEmail
    };
    Singleton.addToSingleton('Slack', slackObject);
    return slackObject;
  }
}

//Logic for internal use

function sendSlackRequest(uri, body) {
  const token = _.get(Singleton.getSingleton(), `Config.CUSTOM.${CONSTANTS.CMS.GLOBAL_CREDENTIALS_PATH}.slackToken`);
  const options = {
    method: 'POST',
    uri,
    headers: { Authorization: `Bearer ${token}` },
    json: true,
    body
  };

  return RequestPromise(options)
    .promise()
    .then(response => _.get(response, 'data'))
    .catch(err => logSlackError(body.username, err));
}

function logSlackError(senderName, err) { 
  Logger.error({
    [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1]: 'senderName',
    [LOG_CONSTANTS.SERVICE_LEVEL_PARAMS.KEY_1_VALUE]: senderName,
    [LOG_CONSTANTS.STRINGIFY_OBJECTS.ERROR]: err
  });
}

function createOptions(method, url, token) {
  return {
    method,
    url,
    headers: {
      Authorization: `Bearer ${token}`
    },
    json: true
  };
}
