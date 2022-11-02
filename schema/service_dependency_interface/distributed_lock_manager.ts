export interface DistributedLockManager {
  id?: string;
  database_id: string;
  sequelize_options?: SequelizeOptions;
}
interface SequelizeOptions {
  logging?: boolean | {
        [k: string]: unknown;
      };
  pool?: {
    min?: number;
    max?: number;
    idle?: number;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}