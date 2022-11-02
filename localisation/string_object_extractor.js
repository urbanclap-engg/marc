'use strict';

const _ = require('lodash');
const helper = require("./helper")
const constants = require("./constants")

const StringExtractor = {};


StringExtractor.extractStringObjects = (responseObject) => {
  let stringsObject = []
  const recursionCount = 0
  traverse(stringsObject, responseObject, recursionCount)
  return stringsObject
}

function traverse(stringsObject, responseObject, recursionCount) {
  if(recursionCount ===  constants.RECURSION_BREAKER_COUNT){
    return
  }
  recursionCount++
  _.forEach(responseObject, (value, _) => {
    const type = typeof(value);
    switch(type){
      case constants.OBJECT_TYPE:
        traverse(stringsObject, value, recursionCount);
        break
      case constants.STRING_TYPE:
        if(helper.doesStringContainsPlaceholder(value)){
          stringsObject.push(helper.removeQueryStringAndPlaceholders(value))
        }
        break
    }
  });
}

module.exports = StringExtractor;