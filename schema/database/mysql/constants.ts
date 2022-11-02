export const DATA_TYPES = {
  INTEGER: 'integer',
  NUMBER: 'number',
  STRING: 'string',
  BOOLEAN: 'boolean'
};

export const MYSQL_DATA_TYPE_MAPPING = [
  {
    MYSQL_TYPE: 'int',
    JSON_DATA_TYPE: DATA_TYPES.INTEGER
  },
  {
    MYSQL_TYPE: 'float',
    JSON_DATA_TYPE: DATA_TYPES.NUMBER
  },
  {
    MYSQL_TYPE: 'double',
    JSON_DATA_TYPE: DATA_TYPES.NUMBER
  },
  {
    MYSQL_TYPE: 'decimal',
    JSON_DATA_TYPE: DATA_TYPES.NUMBER
  },
  {
    MYSQL_TYPE: 'boolean',
    JSON_DATA_TYPE: DATA_TYPES.BOOLEAN
  },
  {
    MYSQL_TYPE: 'date',
    JSON_DATA_TYPE: DATA_TYPES.STRING
  },
  {
    MYSQL_TYPE: 'time',
    JSON_DATA_TYPE: DATA_TYPES.STRING
  },
  {
    MYSQL_TYPE: 'enum',
    JSON_DATA_TYPE: DATA_TYPES.STRING
  }
];