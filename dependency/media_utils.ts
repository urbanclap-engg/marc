export const MediaUtils = {
  initMediaUtils: (params, RPCFramework) => {
    const MediaUtils = require('@uc-engg/media-utils');
    MediaUtils.configure({env: process.env.NODE_ENV});
  }
}