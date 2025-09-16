import 'dotenv/config';

import express from 'express';
import {bot, setNameAndDescription, startBot} from './utils/bot';
import {sequelize} from './models';
import {initLang} from './utils/i18n';
import {Character} from './models/Character';
import {User, UserRole} from './models/User';

const app = express();
const port = process.env.PORT || 8080;

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/', (req, res) => {
  res.json({message: 'AI Girlfriend Bot is running'});
});

(async () => {
  console.log('Syncing database...');
  const isDevelopment = process.env.NODE_ENV !== 'production';
  await sequelize.sync({
    force: isDevelopment,
    alter: true,
  });

  console.log('Initializing characters...');
  await Character.initializeDefaultCharacters();

  console.log('Loading locales...');
  await initLang();

  console.log('Setting bot name and description...');
  await setNameAndDescription();

  console.log('Starting HTTP server...');
  const server = app.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
  });

  console.log('Starting polling...');
  await startBot(true);

  console.log(`Bot started!`);

  const admins = await User.findAll({
    where: {role: UserRole.admin},
  });

  for (const admin of admins) {
    try {
      await admin.sendMessage('🔄 Bot restarted');
    } catch (error) {
      console.error(`Failed to notify admin ${admin.id}:`, error);
    }
  }

  const terminate = async (signal: string) => {
    console.log('Closing HTTP server...');
    server.close();
    console.log('Bot stopped polling...');
    await bot.stopPolling();
    process.exit(0);
  };

  process.on('SIGINT', terminate);
  process.on('SIGTERM', terminate);
})();
