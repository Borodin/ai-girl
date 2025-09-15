import {sequelize, initializeDatabase} from '../models/index.js';

export async function connectDatabase() {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('💥 Failed to initialize database:', error);
    process.exit(1);
  }
}

export async function closeDatabaseConnection() {
  try {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}

export {sequelize};
