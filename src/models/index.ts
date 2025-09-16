import {Sequelize} from 'sequelize-typescript';
import {User} from './User.js';
import {Character} from './Character.js';
import {Message} from './Message.js';
import {SpiceTransaction} from './SpiceTransaction.js';

console.log('dbUrl');
// Парсим DATABASE_URL
const dbUrl = new URL(process.env.DATABASE_URL!);
const isDigitalOceanDB = dbUrl.hostname.includes('ondigitalocean.com');

interface DatabaseConfig {
  dialect: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  models: (typeof User | typeof Character | typeof Message | typeof SpiceTransaction)[];
  logging: boolean;
  define: {
    underscored: boolean;
    freezeTableName: boolean;
  };
  dialectOptions?: {
    ssl:
      | {
          require: boolean;
          rejectUnauthorized: boolean;
          ca: string;
        }
      | boolean;
  };
  pool?: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
}

// Извлекаем параметры подключения
const dbConfig: DatabaseConfig = {
  dialect: 'postgres',
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port),
  username: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1), // Убираем начальный слеш
  models: [User, Character, Message, SpiceTransaction],
  logging: false,
  define: {
    underscored: false,
    freezeTableName: true,
  },
};

if (isDigitalOceanDB) {
  // Для DigitalOcean используем специальную конфигурацию SSL
  dbConfig.dialectOptions = {
    ssl: process.env.DATABASE_CA_CERT
      ? {
          require: true,
          rejectUnauthorized: false, // Критично для DigitalOcean
          ca: Buffer.from(process.env.DATABASE_CA_CERT, 'base64').toString('utf-8'),
        }
      : true, // Просто включаем SSL без проверки сертификата
  };

  // Добавляем pool настройки для стабильности
  dbConfig.pool = {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000,
  };
}

export const sequelize = new Sequelize(dbConfig);

export {User, Character, Message, SpiceTransaction};
