import _ from 'lodash';

export const RequestHeadersUtil = {
  getDeviceType: (headers) => {
    let deviceType = _.get(headers, 'x-device-os');
    if (!deviceType) {
      if (_.includes(_.get(headers, 'user-agent'), 'Android')) {
        deviceType = 'android';
      } else if (_.includes(_.get(headers, 'user-agent'), 'iPhone')) {
        deviceType = 'ios';
      } else if (_.includes(_.get(headers, 'user-agent'), 'Mozilla')) {
        deviceType = 'web';
      }
    }
    if (_.has(headers, 'x-redirection-client-id')) {
      deviceType = _.get(headers, 'x-redirection-client-id') + ':' + (deviceType || '');
    }
    return deviceType;
  }  
}
