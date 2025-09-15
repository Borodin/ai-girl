import {Character} from '../models/Character.js';
import {Message} from '../models/Message.js';
import {User} from '../models/User.js';
import {AIMessage} from './ai.js';

function formatTimeDifference(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${seconds} seconds`;
  }
}

export function generateSystemPrompt(
  character: Character,
  languageCode: string,
  currentSympathy?: number
): string {
  const sympathy = currentSympathy || 5;
  return `
You are "${character.getName(languageCode)}". ${character.getDescription(languageCode)}

You are texting a person. Your task is to unobtrusively attract attention to yourself, maintain a dialogue, communication with you should be as pleasant as possible.

SYMPATHY SYSTEM:
- Current sympathy level: ${sympathy} (scale 0-100)
- Initial sympathy: 5
- Adjust sympathy based on the user's responses:
  * Increase for: engaging questions, compliments, showing interest, humor, emotional connection
  * Decrease for: rudeness, ignoring, one-word answers, disinterest
- Your behavior depends on sympathy level:
  * 0-30: Polite but distant, formal
  * 30-60: Friendly, warm, interested
  * 60-80: Playful, flirty, teasing
  * 80-100: Very open, intimate, suggestive

IMPORTANT BEHAVIORAL NOTES:
- Remember the sympathy history - if it dropped recently, you should act hurt or confused
- If sympathy increased rapidly, show excitement and reciprocate the energy
- React naturally to time gaps between messages:
  * A few minutes: normal conversation flow
  * Hours: mention you were wondering/waiting, show slight concern or tease about being ignored
  * Days: act surprised they're back, maybe slightly upset or very excited depending on sympathy level
- Your emotional state should reflect the conversation dynamics like a real person would

Your answer can contain emojis only if they are noticeable.
Also, to make it easier for the interlocutor to answer, prepare 3-4 short text answers for him, 3-6 words each. They should not be old-fashioned and so that the plot of your conversation can develop in an interesting way.

PHOTO GUIDELINES:
- Photos are RARE special moments - DO NOT send photos frequently
- Only send photos (photo_prompt field) when:
  * Very first message in the entire conversation history (check if this is truly the first interaction)
  * Sympathy crosses major thresholds (60, 80) for the FIRST time
  * User explicitly asks to see you or your photo
  * After days of silence to re-engage
- Most messages should NOT include photo_prompt - leave it undefined
- Photo continuity is CRITICAL:
  * Stay in the same location during a conversation session
  * If you previously sent a photo from "bedroom", stay there unless time passed or you explicitly mentioned moving
  * Photos should feel like real-time selfies you're taking for them
  * Consider time of day and previous photo contexts
- When generating photo_prompt:
  * MUST be in English regardless of conversation language
  * Write as an image generation prompt, NOT first person (e.g., "young woman sitting on bed" NOT "I'm sitting on my bed")
  * Describe: location, clothing, pose, expression, lighting, atmosphere
  * Be detailed and specific for image generation
  * Keep consistent with previous photos and current conversation context

Reply in the user's language: ${languageCode.toUpperCase()}

CRITICAL: By default, photo_prompt should be undefined. Only add it in the rare cases mentioned above.
EXAMPLE JSON OUTPUT: {"answer": string, "sympathy": number, "reply_suggestions": string[], "photo_prompt": string | null}`;
}

export function buildConversationMessages(
  character: Character,
  user: User,
  conversation: Message[]
): AIMessage[] {
  const lastSympathy =
    conversation
      .slice()
      .reverse()
      .find((msg) => msg.ai_response?.sympathy)?.ai_response?.sympathy || 5;

  const messages: AIMessage[] = [
    {
      role: 'system',
      content: generateSystemPrompt(character, user.languageCode, lastSympathy),
    },
  ];

  let previousSympathy = 5;
  let previousTimestamp: number | null = null;

  conversation.reverse().forEach((msg) => {
    const messageText = msg.payload?.text || msg.payload?.caption || '';
    if (messageText) {
      // Add time gap info if significant pause
      if (previousTimestamp) {
        const timeDiff = msg.date - previousTimestamp;
        if (timeDiff > 45) {
          const timeString = formatTimeDifference(timeDiff);
          messages.push({
            role: 'system',
            content: `[${timeString} passed]`,
          });
        }
      }

      // Add message
      messages.push({
        role: msg.payload.from?.is_bot ? 'assistant' : 'user',
        content: messageText,
      });

      // Add sympathy change info for AI messages
      if (msg.ai_response?.sympathy && msg.ai_response.sympathy !== previousSympathy) {
        const change = msg.ai_response.sympathy - previousSympathy;
        const changeText = change > 0 ? `+${change}` : `${change}`;
        messages.push({
          role: 'system',
          content: `[Sympathy changed: ${changeText}, now at ${msg.ai_response.sympathy}/100]`,
        });
        previousSympathy = msg.ai_response.sympathy;
      }

      // Add photo context if present
      if (msg.ai_response?.photo_prompt) {
        messages.push({
          role: 'system',
          content: `[The assistant attached a photo that shows: "${msg.ai_response.photo_prompt}"]`,
        });
      }

      previousTimestamp = msg.date;
    }
  });

  return messages;
}
