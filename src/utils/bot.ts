import {TelegramBot} from 'typescript-telegram-bot-api';
import * as TGTypes from 'typescript-telegram-bot-api/dist/types';
import i18n from 'i18next';
import {User} from '../models/User.js';
import {Message} from '../models/Message.js';
import {Character} from '../models/Character.js';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

export const bot = new TelegramBot({
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  autoRetry: true,
  autoRetryLimit: 30,
});

export let me: TGTypes.User | null = null;

export async function setNameAndDescription(): Promise<void> {
  try {
    for (const lang of Object.keys(i18n.store.data)) {
      await bot.setMyCommands({
        commands: [
          {command: '/start', description: i18n.t('commands.start', lang)},
          {command: '/help', description: i18n.t('commands.help', lang)},
          {command: '/language', description: i18n.t('commands.language', lang)},
          {command: '/characters', description: i18n.t('commands.characters', lang)},
          {command: '/stats', description: i18n.t('commands.stats', lang)},
        ],
        language_code: lang,
      });
      await bot.setMyName({
        name: i18n.t('bot.name', lang),
        language_code: lang,
      });
      await bot.setMyDescription({
        description: i18n.t('bot.description', lang),
        language_code: lang,
      });
      await bot.setMyShortDescription({
        short_description: i18n.t('bot.short_description', lang),
        language_code: lang,
      });
    }
  } catch (e) {
    if (TelegramBot.isTelegramError(e) && e.response.error_code === 429) {
      console.warn('⚠️ Too Many Requests for change bot name');
    } else {
      throw e;
    }
  }
}

const chatMiddleware = async (msg: TGTypes.Message, next: (user: User) => void) => {
  if (!msg.from || msg.from.is_bot) return;
  if (msg.chat.type !== 'private') return;

  const user = await User.getByMsg(msg);

  const forCharacter = Boolean(user.selected_character_id && !msg.text?.startsWith('/'));
  await user.createMessage(msg, forCharacter);
  try {
    next(user);
  } catch (e) {
    console.error('chatMiddleware error:', e);
  }
};

bot.on('my_chat_member', async (msg) => {
  const user = await User.findOrRegister(msg.from, null);
  if (msg.new_chat_member.status === 'left' || msg.new_chat_member.status === 'kicked') {
    await user.deactivate();
  } else {
    await user.activate();
  }
});

bot.on('message:text', (msg) =>
  chatMiddleware(msg, async (user) => {
    if (msg.text.startsWith('/start')) {
      // await Message.deleteByTgMsg(msg);
      await user.onboarding();
    } else if (msg.text === '/language') {
      await Message.deleteByTgMsg(msg);
      await user.sendLanguageSelection();
    } else if (msg.text === '/characters') {
      await Message.deleteByTgMsg(msg);
      await user.sendCharacterSelection();
    } else if (msg.text === '/stats') {
      await Message.deleteByTgMsg(msg);
      await user.sendStats();
    } else if (msg.text === '/help') {
      // await user.sendMessage(i18n.t('messages.help', user.lang));
    } else if (msg.text.startsWith('/')) {
      await Message.deleteByTgMsg(msg);
      await user.sendMessage(user.translate('errors.unknown_command', {command: msg.text}), {
        parse_mode: 'HTML',
      });
    } else {
      await user.generateAIResponse();
    }
  })
);

bot.on('callback_query', async (query) => {
  const user = await User.findOrRegister(query.from);
  if (!query.from || !query.data) return;

  if (query.data.startsWith('lang_')) {
    const selectedLang = query.data.replace('lang_', '');
    await user.update({selected_language: selectedLang});

    await bot.answerCallbackQuery({
      callback_query_id: query.id,
      text: user.translate('status.language_set'),
    });

    if (query.message) {
      await Message.deleteByTgMsg(query.message);
    }

    if (!user.selected_character_id) {
      await user.sendCharacterSelection();
      return;
    }
  } else if (query.data.startsWith('char_nav_')) {
    const newIndex = parseInt(query.data.replace('char_nav_', ''));

    if (query.message) {
      const characters = await Character.getActiveCharacters();
      const carousel = user.buildCharacterCarousel(characters, newIndex);
      await user.editMessageMedia(query.message.message_id, carousel);
    }

    await bot.answerCallbackQuery({
      callback_query_id: query.id,
    });
  } else if (query.data.startsWith('char_select_')) {
    const characterId = parseInt(query.data.replace('char_select_', ''));
    const character = await Character.findByPk(characterId);

    if (character) {
      await user.update({selected_character_id: character.id});

      const userLang = user.selected_language || user.language_code || 'ru';

      await bot.answerCallbackQuery({
        callback_query_id: query.id,
        text: user.translate('status.character_selected', {name: character.getName(userLang)}),
        // show_alert: true,
      });

      if (query.message) {
        await Message.deleteByTgMsg(query.message);
      }

      await user.generateAIResponse();
    }
  } else if (query.data === 'welcome_continue') {
    // Продолжить общение - просто удаляем сообщение
    await bot.answerCallbackQuery({
      callback_query_id: query.id,
      text: user.translate('status.continue_chatting_confirmed'),
    });

    if (query.message) {
      await Message.deleteByTgMsg(query.message);
    }
  } else if (query.data === 'welcome_change_char') {
    await bot.answerCallbackQuery({
      callback_query_id: query.id,
    });

    if (query.message) {
      await Message.deleteByTgMsg(query.message);
    }
    await user.sendCharacterSelection();
  } else if (query.data === 'welcome_clear_all') {
    // Удаляем все сообщения с текущей девушкой
    await Message.destroy({
      where: {
        chat_id: user.id,
        character_id: user.selected_character_id,
      },
    });

    await bot.answerCallbackQuery({
      callback_query_id: query.id,
      text: user.translate('status.history_cleared'),
    });

    if (query.message) {
      await Message.deleteByTgMsg(query.message);
    }
  } else if (query.data === '_') {
    await bot.answerCallbackQuery({
      callback_query_id: query.id,
    });
  }
});

// Pre-checkout query handler
bot.on('pre_checkout_query', async (query) => {
  try {
    await bot.answerPreCheckoutQuery({
      pre_checkout_query_id: query.id,
      ok: true,
    });
  } catch (e) {
    console.error('Pre-checkout error:', e);
    await bot.answerPreCheckoutQuery({
      pre_checkout_query_id: query.id,
      ok: false,
      error_message: 'Payment processing error',
    });
  }
});

// Successful payment handler
bot.on('message:successful_payment', async (msg) => {
  if (!msg.from) return;

  const user = await User.findOrRegister(msg.from);
  const payload = JSON.parse(msg.successful_payment.invoice_payload);
  const spiceAmount = payload.spice_amount;

  // Add spice to user balance
  await user.addStarsSpice(spiceAmount, msg.successful_payment);

  // Send success message with balance info
  const currentBalance = await user.getSpiceBalance();
  await bot.sendMessage({
    chat_id: msg.chat.id,
    text: user.translate('messages.payment_successful', {
      spiceAmount: spiceAmount,
      balance: currentBalance,
    }),
    parse_mode: 'HTML',
  });

  // Generate AI response now that user has balance
  await user.generateAIResponse();
});

export const startBot = async (polling: boolean) => {
  me = await bot.getMe();
  if (polling) {
    await bot.startPolling();
  }
};
