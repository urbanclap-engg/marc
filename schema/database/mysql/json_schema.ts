import { DATA_TYPES, MYSQL_DATA_TYPE_MAPPING } from "./constants";

export const castDefaultValueToFieldType = (defaultValue: string, fieldType: string) => {
  switch (fieldType) {
    case DATA_TYPES.INTEGER:
    case DATA_TYPES.NUMBER:
      return Number(defaultValue);
    case DATA_TYPES.STRING:
      return defaultValue.toString();
    case DATA_TYPES.BOOLEAN:
      return Boolean(defaultValue);
    default:
      return defaultValue;
  }
};

export const getDataType = (mySqlDataType: string): string => {
  const lowerCaseMySqlDataType = mySqlDataType.toLowerCase();
  return MYSQL_DATA_TYPE_MAPPING.find(typeMap => {
    return lowerCaseMySqlDataType.includes(typeMap.MYSQL_TYPE);
  })?.JSON_DATA_TYPE ?? DATA_TYPES.STRING;
};

export const convertMySqlSchemaToJson = (tableColumns: {
  Field: string, Type: string, Null: string, Default: string, Key: string, Extra: string
}[]): {
  type: string,
  properties: Record<string, {
    type: string,
    default: any
  }>,
  required: string[]
} => {
  return tableColumns.reduce((tableSchema, tableColumn) => {
    const {
      Field: fieldName, Type: mySqlDataType, Default: defaultValue, Null: isNull
    } = tableColumn;
    const fieldType = getDataType(mySqlDataType);
    const isRequired = (isNull === 'NO');

    const fieldProperties = {
      type: fieldType,
      default: defaultValue ? castDefaultValueToFieldType(defaultValue, fieldType) : undefined
    };

    return {
      ...tableSchema,
      properties: {
        ...tableSchema.properties,
        [fieldName]: fieldProperties
      },
      required: [
        ...tableSchema.required,
        isRequired ? fieldName : undefined
      ].filter(x => x)
    };
  }, {
    type: 'object', properties: {}, required: []
  });
};