import 'dotenv/config';
import express from 'express';
import {bot, setNameAndDescription, startBot} from './utils/bot';
import {sequelize} from './models';
import {initLang} from './utils/i18n';
import {Character} from './models/Character';

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
  console.log('Starting...');
  console.log('Syncing database...');
  await sequelize.sync({force: true, alter: true});

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
