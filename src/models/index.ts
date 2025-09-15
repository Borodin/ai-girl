import {Sequelize} from 'sequelize-typescript';
import {User} from './User.js';
import {Character} from './Character.js';
import {Message} from './Message.js';
import {SpiceTransaction} from './SpiceTransaction.js';

export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ai_girlfriend',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  models: [User, Character, Message, SpiceTransaction],
  logging: process.env.NODE_ENV === 'development' ? false : false,
  define: {
    underscored: false,
    freezeTableName: true,
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
