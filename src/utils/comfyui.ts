import axios from 'axios';
import {v4 as uuidv4} from 'uuid';
import {readFileSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workflowTemplate = JSON.parse(
  readFileSync(join(__dirname, '../assets/workflow.json'), 'utf-8')
);

export class ComfyUIClient {
  private apiUrl: string;

  constructor(apiUrl: string = process.env.COMFYUI_API_URL || '') {
    if (!apiUrl) {
      throw new Error('COMFYUI_API_URL is not configured');
    }
    this.apiUrl = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
  }

  private buildWorkflow(prompt: string, loraModel: string): object {
    // Clone the template to avoid mutations
    const workflow = JSON.parse(JSON.stringify(workflowTemplate));

    // Replace placeholders
    workflow['6'].inputs.text = prompt;
    workflow['29'].inputs.lora_name = loraModel;
    workflow['30'].inputs.seed = Math.floor(Math.random() * 1000000000000000);

    return workflow;
  }

  async generateImage(prompt: string, loraModel: string): Promise<Buffer> {
    const workflow = this.buildWorkflow(prompt, loraModel);
    const clientId = uuidv4();

    try {
      // Queue the prompt
      const queueResponse = await axios.post(
        `${this.apiUrl}prompt`,
        {
          prompt: workflow,
          client_id: clientId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const promptId = queueResponse.data.prompt_id;

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds timeout

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const historyResponse = await axios.get(`${this.apiUrl}history/${promptId}`);

        if (historyResponse.data && historyResponse.data[promptId]) {
          const outputs = historyResponse.data[promptId].outputs;

          if (outputs && outputs['9'] && outputs['9'].images && outputs['9'].images[0]) {
            const imageData = outputs['9'].images[0];

            // Download the image directly as buffer
            const imageUrl = `${this.apiUrl}view?filename=${imageData.filename}&subfolder=${imageData.subfolder || ''}&type=${imageData.type || 'output'}`;
            const imageResponse = await axios.get(imageUrl, {
              responseType: 'arraybuffer',
            });

            return Buffer.from(imageResponse.data);
          }
        }

        attempts++;
      }

      throw new Error('Image generation timeout');
    } catch (error) {
      console.error('ComfyUI generation error:', error);
      throw error;
    }
  }
}

export const comfyUIClient = new ComfyUIClient();
