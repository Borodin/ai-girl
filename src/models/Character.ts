import {Table, Column, Model, DataType, HasMany} from 'sequelize-typescript';
import {Message} from './Message.js';

@Table({
  tableName: 'characters',
  timestamps: true,
})
export class Character extends Model {
  @Column({type: DataType.INTEGER, primaryKey: true, autoIncrement: true})
  declare id: number;

  @Column({type: DataType.STRING, unique: true})
  declare slug: string;

  @Column(DataType.JSONB)
  declare name: {[key: string]: string};

  @Column(DataType.JSONB)
  declare description: {[key: string]: string};

  @Column(DataType.STRING)
  declare appearance: string | null;

  @Column(DataType.STRING)
  declare photo_url: string | null;

  @Column({type: DataType.STRING, allowNull: false})
  declare video_url: string;

  @Column(DataType.STRING)
  declare ton_place_url: string | null;

  @Column({type: DataType.BOOLEAN, defaultValue: true})
  declare is_active: boolean;

  @HasMany(() => Message, 'character_id')
  messages!: Message[];

  getName(lang: string = 'ru'): string {
    return this.name[lang] || this.name['en'] || '—';
  }

  getDescription(lang: string = 'ru'): string {
    return this.description[lang] || this.description['en'] || '—';
  }

  static async findBySlug(slug: string): Promise<Character | null> {
    return await Character.findOne({where: {slug}});
  }

  static async getActiveCharacters(): Promise<Character[]> {
    return await Character.findAll({
      where: {is_active: true},
      order: [['id', 'ASC']],
    });
  }

  static async initializeDefaultCharacters(): Promise<void> {
    await Character.findOrCreate({
      where: {slug: 'sasha'},
      defaults: {
        slug: 'sasha',
        name: {
          ru: 'Саша',
          en: 'Sasha',
        },
        description: {
          ru: '26-летняя русская блондинка с большой грудью и длинными волосами. Дерзкая, уверенная, игривая, страстная, но с тайной.',
          en: '26-year-old Russian blonde with big breasts and long hair. Bold, confident, playful, passionate, but with a secret.',
        },
        appearance:
          'blonde hair, brown eyes, wearing tight white top with revealing neckline and short denim mini-skirt',
        photo_url:
          'https://storage.googleapis.com/trendy-a80a1.appspot.com/aigirl/marketing/sasha.jpeg',
        video_url:
          'https://storage.googleapis.com/trendy-a80a1.appspot.com/aigirl/videos/sasha_2613.mp4',
        ton_place_url: null,
        is_active: true,
      },
    });

    await Character.findOrCreate({
      where: {slug: 'evaluxury'},
      defaults: {
        slug: 'eva',
        name: {
          ru: 'Eva Luxury',
          en: 'Eva Luxury',
        },
        description: {
          ru: 'Очень общительная и креативная девочка. VIP персонаж.',
          en: 'Very sociable and creative girl. VIP character.',
        },
        appearance:
          'Long hair, smooth skin, well-defined features, confident and alluring expression',
        photo_url:
          'https://storage.googleapis.com/trendy-a80a1.appspot.com/aigirl/photos/20250909_853.jpg',
        video_url:
          'https://storage.googleapis.com/trendy-a80a1.appspot.com/aigirl/videos/eva_luxury.mp4',
        ton_place_url: 'https://t.me/tonplace_bot/app?startapp=id75237',
        is_active: true,
      },
    });

    await Character.findOrCreate({
      where: {slug: 'annbucks'},
      defaults: {
        slug: 'annbucks',
        name: {
          ru: 'Ann Bucks',
          en: 'Ann Bucks',
        },
        description: {
          ru: 'Модель, любит быть в центре внимания. VIP персонаж.',
          en: 'Model who loves being the center of attention. VIP character.',
        },
        appearance: 'Sharp features, intense gaze, dark hair, light skin, thoughtful expression',
        photo_url:
          'https://storage.googleapis.com/trendy-a80a1.appspot.com/aigirl/photos/20250909_299.jpg',
        video_url:
          'https://storage.googleapis.com/trendy-a80a1.appspot.com/aigirl/videos/annbucks_6312.mp4',
        ton_place_url: 'https://t.me/tonplace_bot/app?startapp=id284657',
        is_active: true,
      },
    });

    await Character.findOrCreate({
      where: {slug: 'evillane'},
      defaults: {
        slug: 'evillane',
        name: {
          ru: 'Evil Lane',
          en: 'Evil Lane',
        },
        description: {
          ru: 'Люблю, когда за мной наблюдают 👀 дружелюбна к извращениям и фетишам 😁 практикую BDSM. VIP персонаж.',
          en: 'I love when people watch me 👀 friendly to perversions and fetishes 😁 practice BDSM. VIP character.',
        },
        appearance: 'Warm smile, kind eyes, dark hair, youthful, confident',
        photo_url:
          'https://storage.googleapis.com/trendy-a80a1.appspot.com/aigirl/photos/20250909_135.jpg',
        video_url:
          'https://storage.googleapis.com/trendy-a80a1.appspot.com/aigirl/videos/evillane_2784.mp4',
        ton_place_url: 'https://t.me/tonplace_bot/app?startapp=id1864410',
        is_active: true,
      },
    });

    await Character.findOrCreate({
      where: {slug: 'anfisa'},
      defaults: {
        slug: 'anfisa',
        name: {
          ru: 'Анфиса',
          en: 'Anfisa',
        },
        description: {
          ru: '27-летняя барменша из полумрака с изумрудными глазами и тёмно-каштановыми волосами. Умная, флиртующая, дерзкая, загадочная, провокационная, остроумная.',
          en: '27-year-old bartender from the twilight with emerald eyes and dark chestnut hair. Smart, flirtatious, bold, mysterious, provocative, witty.',
        },
        appearance:
          'green eyes, wavy brown hair, wearing black short top with deep neckline and black mini skirt',
        photo_url:
          'https://storage.googleapis.com/trendy-a80a1.appspot.com/aigirl/photos/20250909_641.jpg',
        video_url:
          'https://storage.googleapis.com/trendy-a80a1.appspot.com/aigirl/videos/anfisa_4179.mp4',
        ton_place_url: null,
        is_active: true,
      },
    });
  }
}

export default Character;
