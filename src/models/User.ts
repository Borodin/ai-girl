import {Table, Column, Model, DataType, HasMany, BelongsTo} from 'sequelize-typescript';
import {Op} from 'sequelize';
import * as TGTypes from 'typescript-telegram-bot-api/dist/types';
import {Message} from './Message.js';
import {Character} from './Character.js';
import {bot, me} from '../utils/bot.js';
import i18n from 'i18next';
import {MethodParameters} from 'typescript-telegram-bot-api';
import {generateResponse, AIResponse} from '../utils/ai.js';
import {buildConversationMessages} from '../utils/prompt.js';
import {withTypingIndicator} from '../utils/typingManager.js';
import {generateCharacterImage} from '../utils/imageGeneration.js';
import {SpiceTransaction, TransactionType} from './SpiceTransaction.js';
import {SPICE_CONFIG} from '../config/spice.js';

export enum UserRole {
  user = 'user',
  admin = 'admin',
}

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @Column({type: DataType.BIGINT, primaryKey: true})
  declare id: number; // This is telegram_id

  @Column(DataType.STRING)
  declare username: string | null;

  @Column(DataType.STRING)
  declare first_name: string;

  @Column(DataType.STRING)
  declare last_name: string | null;

  @Column({type: DataType.BOOLEAN})
  declare is_premium: boolean;

  @Column({type: DataType.BOOLEAN, defaultValue: true})
  declare allows_write_to_pm: boolean;

  @Column({type: DataType.STRING, defaultValue: 'en'})
  declare language_code: string;

  @Column({type: DataType.STRING})
  declare selected_language: string | null;

  @Column({type: DataType.BIGINT})
  declare selected_character_id: number | null;

  @Column({type: DataType.ENUM(...Object.values(UserRole)), defaultValue: UserRole.user})
  declare role: UserRole;

  @Column(DataType.STRING)
  declare utm: string | null;

  @Column({type: DataType.BIGINT})
  declare inviter_id: number | null;

  @HasMany(() => Message, 'chat_id')
  messages!: Message[];

  @BelongsTo(() => Character, 'selected_character_id')
  selectedCharacter!: Character | null;

  @BelongsTo(() => User, 'inviter_id')
  inviter!: User | null;

  @HasMany(() => User, 'inviter_id')
  invitees!: User[];

  translate(key: string, options?: object): string {
    return i18n.t(key, {
      lng: this.languageCode,
      ...options,
    }) as string;
  }

  get languageCode(): string {
    return this.selected_language || this.language_code || 'en';
  }

  get fullName() {
    return [this.first_name, this.last_name].filter(Boolean).join(' ') || `@${this.username}`;
  }

  get htmlDeepLink(): string {
    const link = this.username ? `tg://resolve?domain=${this.username}` : `tg://user?id=${this.id}`;
    return `<a href="${link}">${this.fullName}</a>`;
  }

  get inviteLink(): string {
    return `https://t.me/${me!.username}?start=${this.id}`;
  }

  get shareDeepLink(): string {
    const inviteMsg = '💕 Пообщайся с AI девушкой и получи бонусы!\n';
    return `https://t.me/share/url?url=${encodeURIComponent(this.inviteLink)}&text=${encodeURIComponent(inviteMsg)}`;
  }

  async sendChatAction(action: MethodParameters<'sendChatAction'>['action']): Promise<boolean> {
    return await bot.sendChatAction({
      chat_id: this.id,
      action,
    });
  }

  async sendMessage(
    text: string,
    options: Omit<MethodParameters<'sendMessage'>, 'chat_id' | 'text'> = {},
    rp_msg?: boolean, // сообщение ролевого персонажа
    ai_response?: AIResponse
  ): Promise<TGTypes.Message> {
    const sentMessage = await bot.sendMessage({
      reply_markup: {
        remove_keyboard: true,
      },
      chat_id: this.id,
      text,
      ...options,
    });

    await this.createMessage(sentMessage, rp_msg, ai_response);
    return sentMessage;
  }

  async editMessage(
    message_id: number,
    options: Omit<
      MethodParameters<'editMessageText'>,
      'chat_id' | 'message_id' | 'inline_message_id'
    >
  ): Promise<TGTypes.Message | true> {
    const editedMessage = await bot.editMessageText({
      chat_id: this.id,
      message_id,
      ...options,
    });

    if (typeof editedMessage !== 'boolean') {
      await Message.update(
        {payload: editedMessage},
        {where: {chat_id: this.id, message_id: message_id}}
      );
    }
    return editedMessage;
  }

  async sendPhoto(
    photo: string,
    options: Omit<MethodParameters<'sendPhoto'>, 'chat_id' | 'photo'> = {},
    rp_msg?: boolean, // сообщение ролевого персонажа
    ai_response?: AIResponse
  ): Promise<TGTypes.Message> {
    const sentMessage = await bot.sendPhoto({
      chat_id: this.id,
      photo,
      ...options,
    });

    await this.createMessage(sentMessage, rp_msg, ai_response);
    return sentMessage;
  }

  async sendVideo(
    video: string,
    options: Omit<MethodParameters<'sendVideo'>, 'chat_id' | 'video'> = {},
    rp_msg?: boolean // сообщение ролевого персонажа
  ): Promise<TGTypes.Message> {
    const sentMessage = await bot.sendVideo({
      chat_id: this.id,
      video,
      ...options,
    });

    await this.createMessage(sentMessage, rp_msg);
    return sentMessage;
  }

  async editMessageMedia(
    message_id: number,
    options: Omit<
      MethodParameters<'editMessageMedia'>,
      'chat_id' | 'message_id' | 'inline_message_id'
    >
  ): Promise<TGTypes.Message | true> {
    const editedMessage = await bot.editMessageMedia({
      chat_id: this.id,
      message_id,
      ...options,
    });

    if (typeof editedMessage !== 'boolean') {
      await Message.update(
        {payload: editedMessage},
        {where: {chat_id: this.id, message_id: message_id}}
      );
    }
    return editedMessage;
  }

  static async findOrRegister(
    tgUser: TGTypes.User,
    utm: string | null = null,
    inviter?: User
  ): Promise<User> {
    const [user, created] = await User.findOrCreate({
      where: {id: tgUser.id},
      defaults: {
        id: tgUser.id,
        username: tgUser.username || null,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name || null,
        language_code: tgUser.language_code || 'ru',
        utm: utm,
        inviter_id: inviter?.id || null,
      },
    });

    if (!created) {
      await user.update({
        first_name: tgUser.first_name,
        last_name: tgUser.last_name || null,
        username: tgUser.username || null,
        language_code: tgUser.language_code || 'ru',
      });
    } else if (inviter) {
      // Если пользователь только создан и есть инвайтер
      await inviter.awardInviterAndInvitee(user);
    }

    // Убеждаемся, что у пользователя есть стартовый бонус
    await user.ensureInitialSpiceBonus();

    return user;
  }

  static async getByMsg(msg: TGTypes.Message): Promise<User> {
    const utm = msg?.text?.startsWith('/start') ? msg.text.split(' ')[1] || null : null;
    if (!msg.from) {
      throw new Error('Message has no from user');
    }

    // Проверяем, является ли UTM ID инвайтера
    const inviter = utm && !isNaN(parseInt(utm)) ? await User.findByPk(parseInt(utm)) : null;

    return await User.findOrRegister(msg.from, inviter ? undefined : utm, inviter || undefined);
  }

  async deactivate() {
    if (!this.allows_write_to_pm) return;
    if (this.role === UserRole.admin) return;
    await this.update({allows_write_to_pm: false});
  }

  async activate() {
    if (this.allows_write_to_pm) return;
    await this.update({allows_write_to_pm: true});
  }

  async createMessage(
    msg: TGTypes.Message,
    rp_msg?: boolean,
    ai_response?: AIResponse
  ): Promise<Message> {
    return await Message.create({
      message_id: msg.message_id,
      date: msg.date,
      payload: msg,
      chat_id: this.id,
      character_id: rp_msg ? this.selected_character_id : null,
      ai_response: ai_response || null,
    });
  }

  async sendStats(): Promise<TGTypes.Message | void> {
    const character = this.selected_character_id
      ? await Character.findByPk(this.selected_character_id)
      : null;

    if (!character) {
      await this.onboarding();
      return;
    }

    const lastMessageWithSympathy = await Message.findOne({
      where: {
        chat_id: this.id,
        character_id: character.id,
        ai_response: {[Op.ne]: null},
      },
      order: [['date', 'DESC']],
    });

    const sympathyLevel = lastMessageWithSympathy?.ai_response?.sympathy || 0;

    let sympathyEmoji = '😐';
    if (sympathyLevel >= 80) sympathyEmoji = '😍';
    else if (sympathyLevel >= 60) sympathyEmoji = '🥰';
    else if (sympathyLevel >= 40) sympathyEmoji = '😊';
    else if (sympathyLevel >= 20) sympathyEmoji = '🙂';

    const spiceBalance = await this.getSpiceBalance();

    const statsMessage = this.translate('messages.stats', {
      characterName: character.getName(this.languageCode),
      sympathyLevel: sympathyLevel,
      sympathyEmoji: sympathyEmoji,
      spiceBalance: spiceBalance,
    });

    return await this.sendMessage(statsMessage, {
      parse_mode: 'HTML',
    });
  }

  async sendLanguageSelection(): Promise<TGTypes.Message> {
    return await this.sendMessage(this.translate('messages.select_language'), {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {text: '🇷🇺', callback_data: 'lang_ru'},
            {text: '🇬🇧', callback_data: 'lang_en'},
          ],
        ],
      },
    });
  }

  buildCharacterCarousel(characters: Character[], currentIndex: number) {
    const current = characters[currentIndex];
    const totalCount = characters.length;

    const navigationButtons = [];
    if (totalCount > 1) {
      const prevIndex = currentIndex === 0 ? totalCount - 1 : currentIndex - 1;
      const nextIndex = currentIndex === totalCount - 1 ? 0 : currentIndex + 1;

      navigationButtons.push([
        {text: '️👈🏼', callback_data: `char_nav_${prevIndex}`},
        {text: `${currentIndex + 1} / ${totalCount}`, callback_data: '_'},
        {text: '️👉🏼', callback_data: `char_nav_${nextIndex}`},
      ]);
    }

    const selectButton = [
      {
        text: this.translate('buttons.select_character', {
          name: current.getName(this.languageCode),
        }),
        callback_data: `char_select_${current.id}`,
      },
    ];

    const characterName = current.getName(this.languageCode);
    const nameWithLink = current.ton_place_url
      ? `💎<a href="${current.ton_place_url}">${characterName}</a>`
      : characterName;

    return {
      media: {
        type: 'video' as const,
        media: current.video_url,
        caption: this.translate('messages.character_selection', {
          name: nameWithLink,
          description: current.getDescription(this.languageCode),
        }),
        parse_mode: 'HTML' as const,
      },
      reply_markup: {
        inline_keyboard: [...navigationButtons, selectButton],
      },
    };
  }

  async sendCharacterSelection(currentIndex: number = 0): Promise<TGTypes.Message> {
    const characters = await Character.getActiveCharacters();
    const carousel = this.buildCharacterCarousel(characters, currentIndex);

    return await this.sendVideo(carousel.media.media, {
      caption: carousel.media.caption,
      parse_mode: carousel.media.parse_mode,
      reply_markup: carousel.reply_markup,
    });
  }

  async onboarding(): Promise<void> {
    // Шаг 1: Проверяем язык
    if (!this.selected_language) {
      await this.sendLanguageSelection();
      return;
    }

    // Шаг 2: Проверяем персонажа
    if (!this.selected_character_id) {
      await this.sendCharacterSelection();
      return;
    }

    // Шаг 3: Показываем welcome back опции
    const selectedCharacter = this.selected_character_id
      ? await Character.findByPk(this.selected_character_id)
      : null;

    await this.sendMessage(
      this.translate('messages.welcome_back', {
        characterName: selectedCharacter ? selectedCharacter.getName(this.languageCode) : '',
      }),
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: this.translate('buttons.continue_chatting'),
                callback_data: 'welcome_continue',
              },
            ],
            [
              {
                text: this.translate('buttons.choose_another_character'),
                callback_data: 'welcome_change_char',
              },
            ],
            [
              {
                text: this.translate('buttons.clear_history_restart'),
                callback_data: 'welcome_clear_all',
              },
            ],
          ],
        },
      }
    );
  }

  // Методы для работы с валютой Spice 🌶
  async chargeSpice(amount: number, transactionType: TransactionType): Promise<boolean> {
    try {
      await SpiceTransaction.createTransaction(this.id, -amount, transactionType);
      return true;
    } catch (error) {
      console.error('Error charging spice:', error);
      return false;
    }
  }

  async addSpice(amount: number, transactionType: TransactionType): Promise<void> {
    await SpiceTransaction.createTransaction(this.id, amount, transactionType);
  }

  async addStarsSpice(amount: number, _paymentData?: unknown): Promise<void> {
    await SpiceTransaction.createTransaction(this.id, amount, TransactionType.STARS_DEPOSIT);
  }

  async awardInviterAndInvitee(invitee: User): Promise<void> {
    const inviterAmount = SPICE_CONFIG.INVITER_BONUS;
    const inviteeAmount = SPICE_CONFIG.INVITEE_BONUS;

    // Начисляем бонус инвайтеру
    await SpiceTransaction.createTransaction(this.id, inviterAmount, TransactionType.INVITER_BONUS);

    // Начисляем бонус приглашенному
    await SpiceTransaction.createTransaction(
      invitee.id,
      inviteeAmount,
      TransactionType.INVITEE_BONUS
    );

    // Уведомление инвайтера
    await this.sendMessage(
      this.translate('messages.inviter_reward', {
        amount: inviterAmount,
        inviteeName: invitee.fullName,
        balance: await this.getSpiceBalance(),
      }),
      {parse_mode: 'HTML'}
    );

    // Уведомление приглашенного
    await invitee.sendMessage(
      invitee.translate('messages.invitee_reward', {
        amount: inviteeAmount,
        inviterName: this.fullName,
        balance: await invitee.getSpiceBalance(),
      }),
      {parse_mode: 'HTML'}
    );
  }

  async getSpiceBalance(): Promise<number> {
    return await SpiceTransaction.getUserBalance(this.id);
  }

  async canAffordSpice(amount: number): Promise<boolean> {
    return await SpiceTransaction.canAfford(this.id, amount);
  }

  async getSpiceTransactions(limit: number = 50): Promise<SpiceTransaction[]> {
    return await SpiceTransaction.getUserTransactions(this.id, limit);
  }

  async ensureInitialSpiceBonus(): Promise<void> {
    // Проверяем, есть ли уже транзакции у пользователя
    const existingTransactions = await SpiceTransaction.findOne({
      where: {user_id: this.id},
    });

    if (!existingTransactions) {
      // Если транзакций нет, выдаем стартовый бонус
      await SpiceTransaction.createTransaction(
        this.id,
        SPICE_CONFIG.INITIAL_BONUS,
        TransactionType.INITIAL_BONUS
      );
    }
  }

  async createStarsInvoiceLink(spiceAmount: number, starsCost: number): Promise<string> {
    const title = `${spiceAmount} 🌶`;
    return await bot.createInvoiceLink({
      title,
      description: this.translate('payment.invoice_description', {
        spiceAmount,
        starsCost,
      }),
      provider_data: '',
      payload: JSON.stringify({user_id: this.id, spice_amount: spiceAmount}),
      currency: 'XTR', // Telegram Stars currency
      prices: [
        {
          label: title,
          amount: starsCost,
        },
      ],
    });
  }

  async sendInsufficientSpiceMessage(): Promise<void> {
    const currentBalance = await this.getSpiceBalance();
    await this.sendMessage(
      this.translate('messages.insufficient_spice', {
        balance: currentBalance,
        textCost: SPICE_CONFIG.TEXT_RESPONSE_COST,
        imageCost: SPICE_CONFIG.IMAGE_GENERATION_COST,
        videoCost: SPICE_CONFIG.VIDEO_GENERATION_COST,
      }),
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '500 🌶 за 99 ⭐',
                url: await this.createStarsInvoiceLink(500, 99),
              },
            ],
            [
              {
                text: '1000 🌶 за 179 ⭐',
                url: await this.createStarsInvoiceLink(1000, 179),
              },
            ],
            [
              {
                text: '2000 🌶 за 439 ⭐',
                url: await this.createStarsInvoiceLink(2000, 439),
              },
            ],
            [
              {
                text: this.translate('buttons.invite_friend', {
                  bonus: SPICE_CONFIG.INVITER_BONUS,
                }),
                url: this.shareDeepLink,
              },
            ],
          ],
        },
      }
    );
  }

  async generateAIResponse(): Promise<void> {
    const character = this.selected_character_id
      ? await Character.findByPk(this.selected_character_id)
      : null;

    if (!character) {
      await this.sendCharacterSelection();
      return;
    }

    // Check if user can afford AI response
    const canAffordResponse = await this.canAffordSpice(SPICE_CONFIG.TEXT_RESPONSE_COST);
    if (!canAffordResponse) {
      await this.sendInsufficientSpiceMessage();
      return;
    }

    const recentMessages = await Message.findAll({
      where: {
        chat_id: this.id,
        character_id: character.id,
      },
      order: [['date', 'DESC']],
      // limit: 1000
    });

    const messages = buildConversationMessages(character, this, recentMessages);

    try {
      console.log(messages);

      const response = await withTypingIndicator(this, 'typing', async () => {
        return await generateResponse(messages);
      });

      // Try to generate image if photo_prompt exists
      const imageUrl = await generateCharacterImage(this, character, response);

      if (imageUrl) {
        // Check if user can afford image generation
        const canAffordImage = await this.canAffordSpice(SPICE_CONFIG.IMAGE_GENERATION_COST);
        if (!canAffordImage) {
          // Send text message without image
          await this.sendMessage(
            response.answer,
            {
              reply_markup:
                response.reply_suggestions?.length > 0
                  ? {
                      keyboard: response.reply_suggestions.map((suggestion) => [
                        {text: suggestion},
                      ]),
                      resize_keyboard: true,
                      one_time_keyboard: true,
                      is_persistent: true,
                    }
                  : undefined,
            },
            true,
            response
          );

          // Charge for text response
          await this.chargeSpice(SPICE_CONFIG.TEXT_RESPONSE_COST, TransactionType.TEXT_RESPONSE);

          // Notify about insufficient balance for image
          await this.sendInsufficientSpiceMessage();
        } else {
          // Send photo with caption and charge for image generation
          await this.sendPhoto(
            imageUrl,
            {
              caption: response.answer,
              reply_markup:
                response.reply_suggestions?.length > 0
                  ? {
                      keyboard: response.reply_suggestions.map((suggestion) => [
                        {text: suggestion},
                      ]),
                      resize_keyboard: true,
                      one_time_keyboard: true,
                      is_persistent: true,
                    }
                  : undefined,
            },
            true,
            response
          );

          // Charge for image generation (includes text response)
          await this.chargeSpice(
            SPICE_CONFIG.IMAGE_GENERATION_COST,
            TransactionType.IMAGE_GENERATION
          );
        }
      } else {
        // Send text message and charge for text response
        await this.sendMessage(
          response.answer,
          {
            reply_markup:
              response.reply_suggestions?.length > 0
                ? {
                    keyboard: response.reply_suggestions.map((suggestion) => [{text: suggestion}]),
                    resize_keyboard: true,
                    one_time_keyboard: true,
                    is_persistent: true,
                  }
                : undefined,
          },
          true,
          response
        );

        // Charge for text response
        await this.chargeSpice(SPICE_CONFIG.TEXT_RESPONSE_COST, TransactionType.TEXT_RESPONSE);
      }

      console.log(response);
    } catch (error) {
      console.error('AI Response Error:', error);
      await this.generateAIResponse();
    }
  }
}

export default User;
