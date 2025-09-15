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

export async function initializeDatabase() {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();

    console.log('🔄 Synchronizing database models...');
    await sequelize.sync({force: false});

    console.log('🎭 Initializing default characters...');
    await Character.initializeDefaultCharacters();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
