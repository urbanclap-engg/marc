const Mycroft = require('@uc-engg/mycroft');

const MycroftInitUtil = {}

MycroftInitUtil.storeInitialisation = (storeName, defaultLabels) => {
  Mycroft.createStore({
    storeName: storeName,
    defaultLabels: defaultLabels
  });
}

module.exports = MycroftInitUtil;



