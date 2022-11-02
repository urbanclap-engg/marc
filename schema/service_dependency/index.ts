'use strict';

import _ from 'lodash';
import ChangeCase from 'change-case';
import fs from 'fs';
import path from 'path';
import { Logger } from '../../logging/standard_logger';

const SCHEMA_DIR_PATH = path.join(__dirname, 'schemas');


export const ServiceDependencySchemaLoader = {
  schemas: {},
  getServiceDependencySchemas: () => {
    let schemas = ServiceDependencySchemaLoader.schemas;

    if(!_.isEmpty(schemas)) return schemas;

    const dependencySchemaFileNames = fs.readdirSync(SCHEMA_DIR_PATH);
    _.forEach(dependencySchemaFileNames, function (dependencySchemaFileName) {
      const fileExt = path.extname(dependencySchemaFileName);
      const dependencySchemaName = dependencySchemaFileName.replace(fileExt, '');
    
      if(dependencySchemaName !== ChangeCase.snakeCase(dependencySchemaName)) {
        Logger.info({ key_1: 'schema_name', key_1_value: dependencySchemaName, error_message: 'schema name must be in snakecase' });
        return;
      }
    
      const filePath = path.join(SCHEMA_DIR_PATH, dependencySchemaFileName);
      if(fs.existsSync(filePath)) {
        schemas[dependencySchemaName] = require(filePath);
      }
      else {
        Logger.info({ key_1: 'schema_name', key_1_value: dependencySchemaName, error_message: 'schema doesn\'t exist' });
      }
    });
    return schemas;
  }
};