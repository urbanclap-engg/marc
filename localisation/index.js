'use strict';

const Localisation = require('./service');

function initLocalisationService(serviceId){
  let localisation = {
    /*
      How to use the below methods from SM or any micro service
      1.) const Singleton = require('@uc-engg/marc').getSingleton();
      2.) const L = Singleton.Localisation;
      3.) const R = require('/resources/localization.strings')
      4.)
        const Resources = {
              "order_date" : {source: "resource", value: "Order Date"},
              "delivery_date" : {source: "resource", value: "Order will get delivered on {{time}}"},
          }
      5.) L.getLocalizedString(R.order_date) // constant with out parameters
      6.) L.getLocalizedString(R.delivery_date,{ time : "5 pm"}) // constant with out parameters
     */

    getLocalizedString       : function (stringObject, parameterMap) {
      return Localisation.getLocalizedString(stringObject, serviceId, parameterMap)
    },

    /*
      How to use the below methods from SM or any micro service
      Note : Here type is dynamic inside Resources. Below method will get called if strings are coming from database
      1.) const Singleton = require('@uc-engg/marc').getSingleton();
      2.) const L = Singleton.Localisation;
      3.) const R = require('/resources/localization.strings')
      4.)
        const Resources = {
              "order_date" : {source: "code", context: "context of Order Date"},
              "delivery_date" : {source: "code", value: "context of Order delivery"},
          }
      5.) L.getDynamicLocalizedString("order data", R.order_date) // constant with out parameters
      6.) L.getDynamicLocalizedString("Order will get delivered on {{time}}", R.delivery_date, { time : "5 pm"}) // constant with out parameters
     */

    getDynamicLocalizedString: function (value, parameterMap, contextObject) {
      return Localisation.getDynamicLocalizedString(value, parameterMap, serviceId, contextObject)
    },

    /*
       This method will get called from API middle layer. Please don't call it from your micro service until
       and unless you have a specific use case

       1.) const Singleton = require('@uc-engg/marc').getSingleton();
       2.) const L = Singleton.Localisation;
       3.) L.getLocalizedResponse(response, options)
          a.) here response is the api response which we sent to clients
          b.) options can have the following parameters as of now {entity_id : [provider_id or customer_id], entity_type: [PROVIDER, CUSTOMER], language: ""}
     */

    getLocalizedResponse     : function (response, options) {
      return Promise.resolve(Localisation.getLocalizedResponse(response, options))
    }
  }
  return localisation
}


module.exports = {
  initLocalisationService: initLocalisationService
}