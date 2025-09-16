import {Sequelize} from 'sequelize-typescript';
import {User} from './User.js';
import {Character} from './Character.js';
import {Message} from './Message.js';
import {SpiceTransaction} from './SpiceTransaction.js';

const isDigitalOceanDB = process.env.DATABASE_URL!.includes('ondigitalocean.com');

const decodedCert = Buffer.from(process.env.DATABASE_CA_CERT!, 'base64').toString('utf-8');
console.log('Certificate starts with:', decodedCert.substring(0, 50));
console.log('Certificate ends with:', decodedCert.substring(decodedCert.length - 50));

let dialectOptions = {};

if (isDigitalOceanDB) {
  if (process.env.DATABASE_CA_CERT) {
    // Декодируем base64 сертификат
    const ca = Buffer.from(process.env.DATABASE_CA_CERT, 'base64').toString('utf-8');

    dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: true,
        ca: ca,
      },
    };
  } else {
    // Fallback если сертификат не предоставлен
    dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    };
  }
}

export const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  models: [User, Character, Message, SpiceTransaction],
  logging: false,
  define: {
    underscored: false,
    freezeTableName: true,
  },
  dialectOptions: dialectOptions,
});

export {User, Character, Message, SpiceTransaction};
