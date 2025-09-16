import {Sequelize} from 'sequelize-typescript';
import {User} from './User.js';
import {Character} from './Character.js';
import {Message} from './Message.js';
import {SpiceTransaction} from './SpiceTransaction.js';

export const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  models: [User, Character, Message, SpiceTransaction],
  logging: false,
  define: {
    underscored: false,
    freezeTableName: true,
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

export {User, Character, Message, SpiceTransaction};
