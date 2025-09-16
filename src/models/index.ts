import {Sequelize} from 'sequelize-typescript';
import {User} from './User.js';
import {Character} from './Character.js';
import {Message} from './Message.js';
import {SpiceTransaction} from './SpiceTransaction.js';

// Configure SSL properly
const isDigitalOceanDB = process.env.DATABASE_URL!.includes('ondigitalocean.com');
const sslConfig =
  isDigitalOceanDB && process.env.DATABASE_CA_CERT
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: true,
          ca: Buffer.from(process.env.DATABASE_CA_CERT, 'base64').toString('utf-8'),
        },
      }
    : {};

export const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  models: [User, Character, Message, SpiceTransaction],
  logging: false,
  define: {
    underscored: false,
    freezeTableName: true,
  },
  dialectOptions: sslConfig,
});

export {User, Character, Message, SpiceTransaction};
