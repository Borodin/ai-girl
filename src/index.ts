import 'dotenv/config';
import {bot, setNameAndDescription, startBot} from './utils/bot';
import {sequelize} from './models';
import {initLang} from './utils/i18n';
import {Character} from './models/Character';

(async () => {
  console.log('Syncing database...');
  await sequelize.sync({force: true, alter: true});

  console.log('Initializing characters...');
  await Character.initializeDefaultCharacters();

  console.log('Loading locales...');
  await initLang();

  console.log('Setting bot name and description...');
  await setNameAndDescription();

  console.log('Starting polling...');
  await startBot(true);

  console.log(`Bot started!`);
})();

const terminate = async (signal: string) => {
  console.log('Bot stopped polling...');
  await bot.stopPolling();
};

process.on('SIGINT', terminate);
process.on('SIGTERM', terminate);
