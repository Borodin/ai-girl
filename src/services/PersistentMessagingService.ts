import {User} from '../models/User.js';
import {sequelize} from '../models/index.js';

export class PersistentMessagingService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly checkIntervalMs: number = 30 * 1000; // 30 секунд

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.processInactiveUsers().catch((error) => {
        console.error('Ошибка в PersistentMessagingService:', error);
      });
    }, this.checkIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async processInactiveUsers(): Promise<void> {
    const [inactiveUsers, veryInactiveUsers] = await Promise.all([
      this.findInactiveUsers(2 * 60 * 1000, 2), // 2 минуты, макс 2 сообщения
      this.findInactiveUsers(24 * 60 * 60 * 1000, 3), // сутки, макс 3 сообщения
    ]);

    const uniqueUsers = new Map();
    [...inactiveUsers, ...veryInactiveUsers].forEach((user) => uniqueUsers.set(user.id, user));

    console.log(`Found ${uniqueUsers.size} inactive users`);

    for (const user of uniqueUsers.values()) {
      await user.generateAIResponse();
    }
  }

  private async findInactiveUsers(
    inactivityThresholdMs: number,
    maxConsecutiveAssistantMessages: number
  ): Promise<User[]> {
    const thresholdTime = new Date(Date.now() - inactivityThresholdMs);
    const thresholdUnixTime = Math.floor(thresholdTime.getTime() / 1000);

    const query = `
      SELECT u.*
      FROM users u
      WHERE u.selected_character_id IS NOT NULL
        AND u.allows_write_to_pm = true
        AND EXISTS (
        -- Есть сообщения и последнее старше порога
        SELECT 1
        FROM messages m
        WHERE m.chat_id = u.id
          AND m.character_id = u.selected_character_id
          AND m."deletedAt" IS NULL
        HAVING MAX(m.date) < :thresholdTime)
        AND (
              -- Проверяем последние N сообщений - если все от ассистента, то не отправляем
              SELECT COUNT(*)
              FROM (SELECT ai_response
                    FROM messages m
                    WHERE m.chat_id = u.id
                      AND m.character_id = u.selected_character_id
                      AND m."deletedAt" IS NULL
                    ORDER BY m.date DESC LIMIT :maxConsecutiveMessages) recent_messages
              WHERE ai_response IS NOT NULL -- сообщение от ассистента
            ) < :maxConsecutiveMessages
    `;

    return await sequelize.query(query, {
      replacements: {
        thresholdTime: thresholdUnixTime,
        maxConsecutiveMessages: maxConsecutiveAssistantMessages,
      },
      model: User,
      mapToModel: true,
    });
  }
}
