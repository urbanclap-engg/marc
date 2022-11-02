'use strict';

const _ = require('lodash');
const constants = require("./constants")

const Helper = {};


Helper.doesStringContainsPlaceholder = (value) => {
  return value.startsWith(constants.PLACEHOLDER_OPEN) && value.endsWith(constants.PLACEHOLDER_CLOSE);
}

Helper.removeQueryStringAndPlaceholders = (text) => {
  let resString = Helper.removePlaceHolders(text)
  return getStringObjectsFromQueryString(resString)
}

Helper.removePlaceHolders = (text) => {
  let resString = text
  let placeHolderOpenIndex = resString.indexOf(constants.PLACEHOLDER_OPEN)
  if(placeHolderOpenIndex != -1){
    resString = resString.substr(placeHolderOpenIndex+ constants.PLACEHOLDER_OPEN.length, resString.length);
  }

  let placeHolderCloseIndex = resString.indexOf(constants.PLACEHOLDER_CLOSE)
  if(placeHolderCloseIndex != -1){
    resString =  resString.substr(0, placeHolderCloseIndex);
  }
  return resString
}

function getStringObjectsFromQueryString(text){
  let index = text.indexOf(constants.QUERY_STRING_START_PLACEHOLDER)
  let queryString = text.substr(index + constants.QUERY_STRING_START_PLACEHOLDER.length)
  if(index != -1){
    let resultMap = getSourceAndContext(queryString)
    return _.assign({value: text.substr(0, index)}, resultMap)
  }
  return {value: text}
}

function getSourceAndContext(queryString){

  let result = {}
  let queryParametersArray = queryString.split(constants.QUERY_STRING_END_PLACEHOLDER)

  _.forEach(queryParametersArray, function(queryParameterString){
    if(_.isEmpty(queryParameterString)){
      return
    }
    let keyValueArray = queryParameterString.split(constants.QUERY_STRING_ASSIGNMENT_PLACEHOLDER)
    _.forEach(constants.KEYS, function(key){
      if(keyValueArray[0] == key){
        result[key] = keyValueArray[1]
      }
    })
  })
  return result
}

Helper.replaceParameters = (textWithParameters, translatedValue) => {
  textWithParameters = Helper.removePlaceHolders(textWithParameters)
  let index = textWithParameters.indexOf(constants.QUERY_STRING_START_PLACEHOLDER)

  if(index == -1){
    return translatedValue
  }

  let queryString = textWithParameters.substr(index + constants.QUERY_STRING_START_PLACEHOLDER.length)
  let queryParametersArray = queryString.split(constants.QUERY_STRING_END_PLACEHOLDER)
  _.forEach(queryParametersArray, function(parameter){
    if(!_.isEmpty(parameter)){
      let keyValueArray = parameter.split(constants.QUERY_STRING_ASSIGNMENT_PLACEHOLDER)
      let key = constants.PARAMETER_OPEN + keyValueArray[0] + constants.PARAMETER_CLOSE
      translatedValue = replaceAll(translatedValue,key, keyValueArray[1])
    }
  })
  return translatedValue
}

Helper.replaceParametersWithoutPlaceholders = (textWithParameters, parameterMap) => {
  _.forEach(Object.keys(parameterMap), function(parameter){
    if(!_.isEmpty(parameter)){
      let key = constants.PARAMETER_OPEN + parameter + constants.PARAMETER_CLOSE
      textWithParameters = replaceAll(textWithParameters,key, parameterMap[parameter])
    }
  })
  return textWithParameters
}

function replaceAll(str,sourceStr,targetStr){
   return _.replace(str,new RegExp(sourceStr,"g"), targetStr);
}


Helper.removeQueryString = (text) => {
  let index = text.indexOf(constants.QUERY_STRING_START_PLACEHOLDER)
  if(index != -1){
    return text.substr(0, index)
  }
  return text
}

Helper.getParametersMap = (text) => {
  let index = text.indexOf(constants.QUERY_STRING_START_PLACEHOLDER)
  let queryString = text.substr(index + constants.QUERY_STRING_START_PLACEHOLDER.length)
  if(index != -1){
    return getAllParametersFromString(queryString)
  }
  return {}
}

function getAllParametersFromString(queryString){

  let result = {}
  let queryParametersArray = queryString.split(constants.QUERY_STRING_END_PLACEHOLDER)

  _.forEach(queryParametersArray, function(queryParameterString){
    if(_.isEmpty(queryParameterString)){
      return
    }
    let keyValueArray = queryParameterString.split(constants.QUERY_STRING_ASSIGNMENT_PLACEHOLDER)
    _.forEach(keyValueArray, function(key){
      result[keyValueArray[0]] = keyValueArray[1]
    })
  })
  return result
}


module.exports = Helper;