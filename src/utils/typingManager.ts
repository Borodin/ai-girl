import {User} from '../models/User.js';

export class TypingIndicatorManager {
  private intervalId: NodeJS.Timeout | null = null;
  private user: User;
  private action: Parameters<User['sendChatAction']>[0];

  constructor(user: User, action: Parameters<User['sendChatAction']>[0] = 'typing') {
    this.user = user;
    this.action = action;
  }

  start(): void {
    // Send initial typing status
    this.user.sendChatAction(this.action).catch(console.error);

    // Clear any existing interval
    this.stop();

    // Send typing status every 4 seconds
    this.intervalId = setInterval(() => {
      this.user.sendChatAction(this.action).catch(console.error);
    }, 4000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

/**
 * Helper function to run async operation with typing indicator
 */
export async function withTypingIndicator<T>(
  user: User,
  action: Parameters<User['sendChatAction']>[0],
  asyncOperation: () => Promise<T>
): Promise<T> {
  const typingManager = new TypingIndicatorManager(user, action);
  typingManager.start();

  try {
    return await asyncOperation();
  } finally {
    typingManager.stop();
  }
}
