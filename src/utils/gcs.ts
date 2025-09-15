import {Storage} from '@google-cloud/storage';
import {v4 as uuidv4} from 'uuid';

export class GCSClient {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    const config: Record<string, string> = {
      projectId: process.env.GCP_PROJECT_ID || '',
    };

    if (process.env.GCP_KEY_FILE) {
      config.keyFilename = process.env.GCP_KEY_FILE;
    }

    this.storage = new Storage(config);
    this.bucketName = process.env.GCS_BUCKET_NAME || 'trendy-a80a1.appspot.com';
  }

  async uploadImage(buffer: Buffer, contentType: string = 'image/png'): Promise<string> {
    const fileName = `ai_girlfriend/photos/${uuidv4()}.${contentType.split('/')[1]}`;
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType,
      },
      public: true,
    });

    return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
  }
}

export const gcsClient = new GCSClient();
