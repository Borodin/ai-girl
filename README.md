# AI Girlfriend Bot

Telegram бот с поддержкой нескольких AI персонажей, написанный на TypeScript с использованием sequelize-typescript и Active Record паттерна.

## Особенности

- 🤖 Множественные AI персонажи (Саша и Анфиса)
- 💬 Отдельная история сообщений для каждого персонажа
- 🌍 Поддержка интернационализации (русский/английский)
- 🎯 Реферальная система
- 📱 Современная архитектура с TypeScript
- 🗄️ sequelize-typescript с Active Record паттерном

## Персонажи

### Саша 😊
- Игривая и энергичная девушка 22 лет
- Любит приключения и спонтанные активности
- Стиль общения: casual и cheerful

### Анфиса 🤓  
- Интеллектуальная и сдержанная девушка 26 лет
- Любит литературу, науку и философию
- Стиль общения: sophisticated и thoughtful

## Команды

- `/start` - Запуск бота
- `/characters` - Показать доступных персонажей
- `/switch <имя>` - Переключиться на персонажа
- `/current` - Показать текущего персонажа
- `/profile` - Ваш профиль
- `/referral` - Реферальная система
- `/help` - Справка

## Установка

### Требования

- Node.js >= 18.0.0
- Docker и Docker Compose (рекомендуется)
- Telegram Bot Token

### Быстрый старт с Docker

1. **Клонируйте репозиторий**
   ```bash
   git clone <repository-url>
   cd ai-girlfriend-bot
   ```

2. **Настройте окружение**
   ```bash
   cp .env.example .env
   # Отредактируйте .env с токеном бота
   ```

3. **Запустите PostgreSQL**
   ```bash
   npm run db:up
   ```

4. **Установите зависимости и запустите бота**
   ```bash
   npm install
   npm run db:sync
   npm run dev
   ```

### Ручная установка

### Шаги установки

1. **Клонируйте репозиторий**
   ```bash
   git clone <repository-url>
   cd ai-girlfriend-bot
   ```

2. **Установите зависимости**
   ```bash
   npm install
   ```

3. **Настройте окружение**
   ```bash
   cp .env.example .env
   ```
   
   Отредактируйте `.env` файл:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ai_girlfriend
   DB_USER=postgres
   DB_PASSWORD=your_password
   BOT_USERNAME=your_bot_username
   ```

4. **Создайте базу данных PostgreSQL**
   ```bash
   # Установите PostgreSQL или используйте Docker
   createdb ai_girlfriend
   ```

5. **Синхронизируйте модели БД**
   ```bash
   npm run db:sync
   ```

6. **Запустите бота**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

### Docker команды

```bash
# Запуск PostgreSQL
npm run db:up

# Остановка PostgreSQL
npm run db:down

# Очистка данных БД (осторожно!)
docker-compose down -v
```

### Доступ к PostgreSQL

- **Host**: `localhost:5432`
- **Database**: `ai_girlfriend`
- **User**: `postgres`
- **Password**: `postgres`

## Структура проекта

```
src/
├── models/              # Модели базы данных
│   ├── User.ts         # Пользователи
│   ├── Character.ts    # Персонажи
│   ├── Message.ts      # Сообщения
│   ├── UserCharacterRelation.ts  # Связи пользователь-персонаж
│   └── index.ts        # Экспорт моделей
├── bot/                # Telegram бот
│   └── TelegramBot.ts  # Основной класс бота
├── utils/              # Утилиты
│   ├── bot.ts         # Инициализация бота
│   ├── database.ts    # Подключение к БД
│   └── i18n.ts        # Интернационализация
├── locales/           # Переводы
│   ├── en.json       # Английский
│   └── ru.json       # Русский
└── index.ts          # Точка входа
```

## База данных

### Модели

- **User** - Пользователи с реферальной системой
- **Character** - AI персонажи с индивидуальными характеристиками
- **UserCharacterRelation** - Связь пользователя с персонажем
- **Message** - История сообщений с привязкой к персонажам

### Схема БД

```sql
users (id, username, first_name, language_code, referred_by, ...)
characters (id, slug, name, description, personality, ...)  
user_character_relations (user_id, character_id, is_current, ...)
messages (id, user_id, character_id, text, direction, ...)
```

## Разработка

### Доступные скрипты

```bash
# Разработка
npm run dev          # Запуск в режиме разработки с watch
npm start           # Запуск production версии
npm run build       # Сборка TypeScript

# База данных
npm run db:sync     # Синхронизация БД

# Качество кода
npm run lint        # Проверка и исправление линтером
npm run format      # Форматирование кода
npm run typecheck   # Проверка типов TypeScript
npm run spell       # Проверка орфографии
```

### Добавление нового персонажа

1. Обновите `Character.initializeDefaultCharacters()` в `src/models/Character.ts`
2. Добавьте переводы в `src/locales/ru.json` и `src/locales/en.json`
3. Перезапустите бота

### Структура Active Record

Каждая модель содержит бизнес-логику:

```typescript
// User методы
await user.sendMessage('Hello!')
await user.switchToCharacter('sasha')
const character = await user.getCurrentCharacter()

// Message методы  
await message.edit('New text')
await message.delete()
await message.reply('Response')
```

## Production

### Docker (опционально)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["npm", "start"]
```

### Переменные окружения для продакшена

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
TELEGRAM_BOT_TOKEN=your_production_token
```

## Лицензия

MIT

## Поддержка

Если у вас есть вопросы или предложения, создайте issue в репозитории.