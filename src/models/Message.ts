import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  DeletedAt,
  BeforeDestroy,
} from 'sequelize-typescript';
import {User} from './User.js';
import {Character} from './Character.js';
import {bot} from '../utils/bot.js';
import {Op} from 'sequelize';
import * as TGTypes from 'typescript-telegram-bot-api/dist/types';
import {AIResponse} from '../utils/ai.js';

@Table({
  tableName: 'messages',
  timestamps: true,
  paranoid: true,
})
export class Message extends Model {
  @Column({type: DataType.BIGINT, autoIncrement: true, primaryKey: true})
  declare id: number;

  @Column(DataType.INTEGER)
  declare message_id: number;

  @Column(DataType.INTEGER)
  declare date: number;

  @Column({type: DataType.JSONB, allowNull: false})
  declare payload: TGTypes.Message;

  @Column({type: DataType.JSONB, allowNull: true})
  declare ai_response: AIResponse | null;

  @DeletedAt
  declare deletedAt: Date | null;

  @BelongsTo(() => User, 'chat_id')
  user!: User;
  declare chat_id: number;

  @BelongsTo(() => Character, 'character_id')
  character!: Character;
  declare character_id: number;

  static async getByTgMsg(msg: TGTypes.Message): Promise<Message | null> {
    return await Message.findOne({where: {message_id: msg.message_id, chat_id: msg.chat.id}});
  }

  static async deleteByTgMsg(msg: TGTypes.Message): Promise<void> {
    try {
      const message = await Message.findOne({
        where: {
          message_id: msg.message_id,
          chat_id: msg.chat.id,
        },
      });

      if (message) {
        await message.destroy();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  static async deleteAllMessagesBefore(msg: TGTypes.Message) {
    const messages = await Message.findAll({
      where: {message_id: {[Op.gt]: msg.message_id}, chat_id: msg.chat.id},
    });
    try {
      await Promise.all(messages.map(async (m) => await m.destroy()));
    } catch (err) {
      console.log(err);
    }
  }

  @BeforeDestroy
  static async beforeDestroyInstance(instance: Message) {
    try {
      await bot.deleteMessage({
        chat_id: instance.chat_id,
        message_id: instance.message_id,
      });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
    return instance;
  }
}

export default Message;
