'use strict';

const _ = require('lodash');
const constants = require("./constants")
const helper = require("./helper")

const Marker = {};

Marker.markForTranslation = (text, keyValueMap) => {
  let resultValue = text

  // This snippet of code is to handle markForTranslation calling multiple times on a string
  if(helper.doesStringContainsPlaceholder(text)){
    resultValue = helper.removePlaceHolders(text)
    _.assign(keyValueMap, helper.getParametersMap(resultValue))
    resultValue = helper.removeQueryString(resultValue)
  } else {
    resultValue = resultValue.split(constants.NEW_LINE).join(constants.NEW_LINE_WITH_ESCAPING_CHARACTER)
  }

  if(!_.isUndefined(keyValueMap)){
    const value = constructQueryString(keyValueMap)
    resultValue  = resultValue + constants.QUERY_STRING_START_PLACEHOLDER + value
  }
  return constants.PLACEHOLDER_OPEN + resultValue + constants.PLACEHOLDER_CLOSE
}

Marker.resolveParametersForDefaultLanguage = (text, keyValueMap) => {
  return helper.replaceParametersWithoutPlaceholders(text, keyValueMap);
}

function constructQueryString(keyValueMap){
  var queryString = ""
  let keys = _.keys(keyValueMap)
  _.forEach(keys, function(key){
    queryString += key + constants.QUERY_STRING_ASSIGNMENT_PLACEHOLDER +
      keyValueMap[key] + constants.QUERY_STRING_END_PLACEHOLDER
  })
  return queryString
}


module.exports = Marker;