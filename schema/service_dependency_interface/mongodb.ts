export interface Mongodb {
  id: string;
  mongoose_options?: MongooseOptions;
  models?: Model[];
}
interface MongooseOptions {
  useMongoClient?: boolean;
  autoIndex?: boolean;
  reconnectTries?: number;
  reconnectInterval?: number;
  poolSize?: number;
  bufferMaxEntries?: number;
  readPreference?: string;
  safe?: boolean;
  useNewUrlParser?: boolean;
  useCreateIndex?: boolean;
  socketTimeoutMS?: number;
  connectTimeoutMS?: number;
  [k: string]: unknown;
}
interface Model {
  name?: string;
  model?: {
    [k: string]: unknown;
  };
}