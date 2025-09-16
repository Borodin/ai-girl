import {Sequelize} from 'sequelize-typescript';
import {User} from './User.js';
import {Character} from './Character.js';
import {Message} from './Message.js';
import {SpiceTransaction} from './SpiceTransaction.js';

const isDigitalOceanDB = process.env.DATABASE_URL!.includes('ondigitalocean.com');

const sequelizeConfig: any = {
  dialect: 'postgres',
  models: [User, Character, Message, SpiceTransaction],
  logging: false,
  define: {
    underscored: false,
    freezeTableName: true,
  },
};

if (isDigitalOceanDB) {
  // Для DigitalOcean нужна специфичная настройка
  sequelizeConfig.dialectOptions = {
    ssl: process.env.DATABASE_CA_CERT
      ? {
          require: true,
          rejectUnauthorized: false, // Важно для DigitalOcean!
          ca: Buffer.from(process.env.DATABASE_CA_CERT, 'base64').toString('utf-8'),
          // Добавляем дополнительные параметры для DigitalOcean
          checkServerIdentity: () => undefined, // Пропускаем проверку имени сервера
        }
      : {
          require: true,
          rejectUnauthorized: false,
        },
  };
}

export const sequelize = new Sequelize(process.env.DATABASE_URL!, sequelizeConfig);
