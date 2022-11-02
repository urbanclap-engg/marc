export interface SchemaDetailsInterface {
  fetchMongoDBSchema(dbName: string, schemaName: string): {};
  listAllMongoDBSchemas(): Record<string, string[]>;
  getAllMongoDBSchemas(): { modelSchemas, modelsAvailable: Record<string, string[]> }
}