import {Sequelize} from 'sequelize-typescript';
import pg from 'pg';
import {User} from './User.js';
import {Character} from './Character.js';
import {Message} from './Message.js';
import {SpiceTransaction} from './SpiceTransaction.js';

const isDigitalOceanDB = process.env.DATABASE_URL!.includes('ondigitalocean.com');
console.log('PG');
// Настройка CA сертификата
const ca =
  isDigitalOceanDB && process.env.DATABASE_CA_CERT
    ? Buffer.from(process.env.DATABASE_CA_CERT, 'base64').toString('utf-8')
    : undefined;

interface SequelizeConfig {
  dialect: 'postgres';
  dialectModule: typeof pg;
  models: (typeof User | typeof Character | typeof Message | typeof SpiceTransaction)[];
  logging: boolean;
  define: {
    underscored: boolean;
    freezeTableName: boolean;
  };
  dialectOptions?: {
    ssl: {
      require: boolean;
      rejectUnauthorized: boolean;
      ca?: string;
    };
  };
}

const sequelizeConfig: SequelizeConfig = {
  dialect: 'postgres',
  dialectModule: pg, // Явно указываем использование pg
  models: [User, Character, Message, SpiceTransaction],
  logging: false,
  define: {
    underscored: false,
    freezeTableName: true,
  },
};

if (isDigitalOceanDB) {
  sequelizeConfig.dialectOptions = {
    ssl: ca
      ? {
          require: true,
          rejectUnauthorized: true,
          ca: ca,
        }
      : {
          require: true,
          rejectUnauthorized: false,
        },
  };
}

export const sequelize = new Sequelize(process.env.DATABASE_URL!, sequelizeConfig);
