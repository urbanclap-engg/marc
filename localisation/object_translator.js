'use strict';

const _ = require('lodash');
const helper = require("./helper")
const constants = require("./constants")
const TranslatedObjectCreator = {};

TranslatedObjectCreator.createTranslatedObject = (responseObject, valueToTranslationMap) => {
  const recursionCount = 0
  traverse(valueToTranslationMap, responseObject, recursionCount)
}

function traverse(valueToTranslationMap, responseObject, recursionCount) {
  if(recursionCount ===  constants.RECURSION_BREAKER_COUNT){
    return
  }
  recursionCount++
  _.forEach(responseObject, (value, key) => {
    const type = typeof(value);
    switch(type){
      case constants.OBJECT_TYPE:
        traverse(valueToTranslationMap, value, recursionCount);
        break
      case constants.STRING_TYPE:
        if(!helper.doesStringContainsPlaceholder(value)){
          return
        }
        let string = (helper.removeQueryStringAndPlaceholders(value)).value
        if(valueToTranslationMap[string]){
          let translatedValue = valueToTranslationMap[string].value
          string = helper.replaceParameters(value, translatedValue)
        } else {
          string = helper.replaceParameters(value, string)
        }
        responseObject[key] = string.split(constants.NEW_LINE_WITH_ESCAPING_CHARACTER).join(constants.NEW_LINE)
        break
    }
  });
}

module.exports = TranslatedObjectCreator;