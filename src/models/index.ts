import {Sequelize} from 'sequelize-typescript';
import {User} from './User.js';
import {Character} from './Character.js';
import {Message} from './Message.js';
import {SpiceTransaction} from './SpiceTransaction.js';

// Add SSL parameters to DATABASE_URL if not present
const databaseUrl = process.env.DATABASE_URL!;
const urlWithSSL = databaseUrl.includes('sslmode=')
  ? databaseUrl
  : `${databaseUrl}?sslmode=require`;

export const sequelize = new Sequelize(urlWithSSL, {
  dialect: 'postgres',
  models: [User, Character, Message, SpiceTransaction],
  logging: false,
  define: {
    underscored: false,
    freezeTableName: true,
  },
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
});

export {User, Character, Message, SpiceTransaction};
