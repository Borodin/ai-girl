import {Sequelize} from 'sequelize-typescript';
import {User} from './User.js';
import {Character} from './Character.js';
import {Message} from './Message.js';
import {SpiceTransaction} from './SpiceTransaction.js';

console.log('DATABASE_URL', process.env.DATABASE_URL!);
const dbUrl = new URL(process.env.DATABASE_URL!);
const dbConfig = {
  dialect: 'postgres' as const,
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port),
  username: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
  models: [User, Character, Message, SpiceTransaction],
  logging: false,
  define: {
    underscored: false,
    freezeTableName: true,
  },
  dialectOptions: {
    ssl: process.env.DATABASE_CA_CERT
      ? {
          require: true,
          rejectUnauthorized: false,
          ca: Buffer.from(process.env.DATABASE_CA_CERT, 'base64').toString('utf-8'),
        }
      : undefined,
  },
};

export const sequelize = new Sequelize(dbConfig);

export {User, Character, Message, SpiceTransaction};
