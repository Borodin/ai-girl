import {User} from '../models/User.js';
import {Character} from '../models/Character.js';
import {comfyUIClient} from './comfyui.js';
import {gcsClient} from './gcs.js';
import {withTypingIndicator} from './typingManager.js';
import {AIResponse} from './ai.js';

export async function generateCharacterImage(
  user: User,
  character: Character,
  aiResponse: AIResponse
): Promise<string | null> {
  if (!aiResponse.photo_prompt) {
    return null;
  }

  try {
    return await withTypingIndicator(user, 'upload_photo', async () => {
      const characterPrompt = ''; // todo: add PROMPT
      const fullPrompt = `${aiResponse.photo_prompt}, ${characterPrompt}`;

      console.log(`Generating image for ${character.slug} with prompt:`, fullPrompt);

      const imageBuffer = await comfyUIClient.generateImage(
        fullPrompt,
        `${character.slug}.safetensors`
      );

      const imageUrl = await gcsClient.uploadImage(imageBuffer);
      return imageUrl;
    });
  } catch (error) {
    console.error('Image generation failed:', error);
    return null;
  }
}
