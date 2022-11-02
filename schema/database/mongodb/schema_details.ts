import * as _ from 'lodash';
import { getSingleton } from '../../../singleton';
const Singleton = getSingleton();

import { SchemaDetailsInterface } from './interface';
import * as RPC_CONSTANTS from '../../../constants';

export const MongoSchemaDetails: SchemaDetailsInterface = {
  fetchMongoDBSchema: (requiredDb, requiredSchema) => {
    return _.get(MongoSchemaDetails.getAllMongoDBSchemas().modelSchemas, `${requiredDb}.${requiredSchema}`, {});
  },
  listAllMongoDBSchemas: () => {
    return MongoSchemaDetails.getAllMongoDBSchemas().modelsAvailable;
  },
  getAllMongoDBSchemas: () => {
    const dependencyConfig = require(RPC_CONSTANTS.REPO_DIR_PATH + RPC_CONSTANTS.DEPENDENCY.CONFIG_PATH);
    const mongoose = require('mongoose');
    require('mongoose-schema-jsonschema')(mongoose);
    const modelSchemas = {};
    const modelsAvailable = {};
    const mongoDbDependencies = _.get(dependencyConfig, `Config.service.${RPC_CONSTANTS.DEPENDENCY.TYPE.MONGODB}`, []);

    mongoDbDependencies.map((mongoDbDependency) => {
      const mongoSingletonId = mongoDbDependency.id;
      const modelObjects = Singleton[mongoSingletonId].models;
      const modelNames = Object.keys(modelObjects);
      modelsAvailable[mongoSingletonId] = [];
      modelSchemas[mongoSingletonId] = {};
      modelNames.map((modelName) => {
        const collectionName = modelObjects[modelName].collection.collectionName;
        const modelObject = modelObjects[modelName].schema;
        modelSchemas[mongoSingletonId][collectionName] = modelObject.jsonSchema();
        modelsAvailable[mongoSingletonId].push(collectionName);
      })
    });

    return {
      modelSchemas, modelsAvailable
    };
  }
};