export interface Mysql {
  id: string;
  client_type?: "sequelize-typescript" | "typeorm" | "sequelize";
  is_cls?: boolean;
  typeorm_options?: TypeormOptions;
  sequelize_options?: SequelizeOptions;
  sync?: boolean;
  [k: string]: unknown;
}
interface TypeormOptions {
  extra?: {
    connectionLimit?: number;
    [k: string]: unknown;
  };
  synchronize?: boolean;
  logging?: boolean;
  entities?: string[];
  [k: string]: unknown;
}
interface SequelizeOptions {
  pool?: {
    min?: number;
    max?: number;
    idle?: number;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}