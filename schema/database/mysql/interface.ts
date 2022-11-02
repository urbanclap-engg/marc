export interface SchemaDetailsInterface {
  fetchMySqlSchema(dbName: string, tableName: string): Promise<{}>;
  listAllMySqlTables(dbName: string): Promise<Record<string, string[]>>;
  getAllMySqlDBs(): {}
}