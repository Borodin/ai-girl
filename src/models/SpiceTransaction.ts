import {Table, Column, Model, DataType, BelongsTo} from 'sequelize-typescript';
import {User} from './User.js';

export enum TransactionType {
  INITIAL_BONUS = 'initial_bonus',
  TEXT_RESPONSE = 'text_response',
  IMAGE_GENERATION = 'image_generation',
  VIDEO_GENERATION = 'video_generation',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  DAILY_BONUS = 'daily_bonus',
  STARS_DEPOSIT = 'stars_deposit',
  INVITER_BONUS = 'inviter_bonus',
  INVITEE_BONUS = 'invitee_bonus',
}

@Table({
  tableName: 'spice_transactions',
  timestamps: true,
})
export class SpiceTransaction extends Model {
  @Column({type: DataType.BIGINT, autoIncrement: true, primaryKey: true})
  declare id: number;

  @Column({type: DataType.BIGINT, allowNull: false})
  declare user_id: number;

  @Column({type: DataType.INTEGER, allowNull: false})
  declare amount: number; // может быть отрицательным для списаний

  @Column({
    type: DataType.ENUM(...Object.values(TransactionType)),
    allowNull: false,
  })
  declare transaction_type: TransactionType;

  @BelongsTo(() => User, 'user_id')
  user!: User;

  static async createTransaction(
    userId: number,
    amount: number,
    transactionType: TransactionType
  ): Promise<SpiceTransaction> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (amount < 0) {
      const canAfford = await SpiceTransaction.canAfford(userId, Math.abs(amount));
      if (!canAfford) {
        throw new Error('Insufficient spice balance');
      }
    }
    const transaction = await SpiceTransaction.create({
      user_id: userId,
      amount,
      transaction_type: transactionType,
    });

    return transaction;
  }

  static async getUserTransactions(
    userId: number,
    limit: number = 50
  ): Promise<SpiceTransaction[]> {
    return await SpiceTransaction.findAll({
      where: {user_id: userId},
      order: [['createdAt', 'DESC']],
      limit,
    });
  }

  static async getUserBalance(userId: number): Promise<number> {
    const result = await SpiceTransaction.findAll({
      attributes: [
        [SpiceTransaction.sequelize!.fn('SUM', SpiceTransaction.sequelize!.col('amount')), 'total'],
      ],
      where: {user_id: userId},
      raw: true,
    });

    const totalResult = (result[0] as {total?: string})?.total;
    return totalResult ? parseInt(totalResult) : 0;
  }

  static async canAfford(userId: number, amount: number): Promise<boolean> {
    const currentBalance = await SpiceTransaction.getUserBalance(userId);
    return currentBalance >= amount;
  }
}

export default SpiceTransaction;
