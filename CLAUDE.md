# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
- `npm run start` - Run the bot in production mode using tsx
- `npm run dev` - Run the bot in development mode with file watching
- `npm run build` - Compile TypeScript to JavaScript
- `npm run check` - Run all quality checks (typecheck + lint + spell)
- `npm run typecheck` - TypeScript type checking without emitting files
- `npm run lint` - ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run spell` - Check spelling in TypeScript files

### Database Commands
The database uses PostgreSQL with force sync enabled during development (`force: true` in index.ts). Models auto-sync on startup.

**Docker Commands** (from README.md):
- `docker-compose up -d` - Start PostgreSQL container (database available at localhost:5432)
- `docker-compose down` - Stop PostgreSQL container
- `docker-compose down -v` - Stop and remove database volumes (data loss!)

## Architecture Overview

### Core Structure
This is a TypeScript Telegram bot built with a **functional approach** rather than classes. The main bot logic is implemented as exported functions in `src/utils/bot.ts`.

### Key Architectural Patterns

**1. Functional Bot Architecture**
- Bot instance is created and exported directly from `src/utils/bot.ts`
- Message handling uses a functional `chatMiddleware` pattern
- No classes for bot logic - pure functions for handlers

**2. Active Record Pattern with Sequelize-TypeScript**
- Models contain business logic methods (e.g., `user.sendMessage()`, `user.switchToCharacter()`)
- Each model handles its own database operations and domain logic
- Rich model instances rather than anemic data objects

**3. Direct Bot Instance Access**
- User model imports bot instance directly: `import { bot, me } from '../utils/bot.js'`
- No dependency injection or service layers - simple direct imports
- No runtime checks for bot availability - assumes bot is initialized on import

### Data Models

**User Model** (`src/models/User.ts`)
- Contains user profile data with role-based permissions (`UserRole` enum)
- UTM tracking for referral analytics
- Active Record methods: `sendMessage()`, `getCurrentCharacter()`, `switchToCharacter()`
- Static factory methods: `findOrRegister()`, `getByMsg()`

**Character System**
- Multiple AI personalities (Sasha, Anfisa) defined in Character model
- `UserCharacterRelation` tracks which character is currently active per user
- Character switching affects message context and AI behavior

**Message Architecture**
- All messages linked to both user and character for context
- Supports conversation history per character relationship

### Bot Message Flow
1. `chatMiddleware` in `bot.ts` intercepts all messages
2. Extracts UTM from `/start` commands for analytics
3. Creates/retrieves User via `User.getByMsg()`
4. Routes to appropriate handler functions
5. User model methods handle Telegram API calls directly

### Internationalization
- `i18next` with filesystem backend loading from `src/locales/`
- Currently supports Russian (`ru`) and English (`en`)
- Bot commands and descriptions set per language on startup

### Environment Configuration
- Database connection through environment variables (DB_HOST, DB_PORT, etc.)
- `TELEGRAM_BOT_TOKEN` required for bot functionality
- Development uses `force: true` sync, alter mode enabled
- Node.js >= 18.0.0 required (specified in package.json engines)
- Uses ESM modules (`"type": "module"` in package.json)

**Required Environment Variables**:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_girlfriend
DB_USER=postgres
DB_PASSWORD=postgres
BOT_USERNAME=your_bot_username
```

## Important Implementation Details

### Bot Instance Management
The bot uses a simple global export pattern:
```typescript
export const bot = new TelegramBot({ botToken: process.env.TELEGRAM_BOT_TOKEN })
export let me: TGTypes.User | null = null
```

User models access this directly without any service layer or dependency injection.

### Character Switching Logic
Characters are not just UI concepts - they affect the entire conversation context. When a user switches characters, it creates a new `UserCharacterRelation` and sets it as current, affecting all future message history.

### Database Sync Strategy
The app uses aggressive sync with `force: true` and `alter: true` during development, which drops and recreates tables. This is suitable for development but should be changed for production.

### Message Middleware Pattern
Unlike traditional OOP bot frameworks, this uses functional middleware:
```typescript
const chatMiddleware = async (msg: TGTypes.Message, next: (user: User) => void)
```

This allows clean separation of user resolution from business logic while maintaining simplicity.

### Key Dependencies
- `typescript-telegram-bot-api` - Main Telegram Bot API wrapper
- `sequelize` + `sequelize-typescript` - Database ORM with TypeScript decorators
- `i18next` + `i18next-fs-backend` - Internationalization with file-based translations
- `tsx` - TypeScript execution for development (used in npm scripts)
- `dotenv` - Environment variable management

### Development Workflow
1. Database auto-syncs with `force: true` and `alter: true` on startup
2. Bot automatically sets commands/name/description in all supported languages
3. Uses file watching with `tsx watch` for development hot-reload
4. All code quality checks bundled in `npm run check` command