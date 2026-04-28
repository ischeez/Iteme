# Marketplace Project

## English

### What the project does

- Provides a marketplace UI for browsing products, sellers, requests, orders, verification, and admin workflows.
- Handles authentication through Telegram Web App and returns JWT access tokens from the backend.
- Stores and serves uploaded images.
- Uses PostgreSQL through Prisma for data persistence.
- Separates the business logic into clear backend modules and reusable frontend pages.

### Project structure

- `backend/` - NestJS API, Prisma schema, authentication, business logic, uploads, and Swagger docs.
- `frontend/` - React application, routing, client state, API integration, and UI.
- `docker-compose.yml` - local infrastructure for PostgreSQL, backend, and frontend.

### How it works

1. The frontend boots first and checks whether it is running inside Telegram Web App or in a normal browser.
2. If Telegram `initData` is available, the frontend sends it to the backend login endpoint.
3. The backend validates Telegram data, creates or updates the user, and returns a JWT token plus profile data.
4. The frontend stores auth state in Zustand and `localStorage` so the session survives reloads.
5. Protected pages and API routes use JWT and role-based guards.
6. Uploaded images are stored on the backend and displayed in the frontend through the `/storage` path.
7. Swagger is available for exploring the API and testing endpoints.

### Tech stack

Backend:

- NestJS
- Prisma
- PostgreSQL
- JWT
- Swagger
- Multer 

Frontend:

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Zustand
- React Router
- Axios

### Requirements

- Node.js 20 or newer
- npm
- PostgreSQL 16 or newer
- Telegram Bot Token for Telegram login

### Environment variables

Backend `.env` example:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketplace
PORT=3000
STORAGE_DIR=storage
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ADMIN_TELEGRAM_IDS=123456789,987654321
```

Frontend `.env` example:

```env
VITE_API_URL=http://localhost:3000
```

### Local setup

Backend:

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

### Docker setup

From the repository root:

```bash
docker compose up --build
```

This is intended to start:

- PostgreSQL on port `5432`
- Backend on port `3000`
- Frontend on port `5173`

## Русский

### Что делает проект

- Показывает интерфейс маркетплейса для просмотра товаров, продавцов, заявок, заказов, верификации и админ-сценариев.
- Обрабатывает авторизацию через Telegram Web App и выдаёт JWT токены на backend.
- Сохраняет и отдаёт загруженные изображения.
- Использует PostgreSQL через Prisma для хранения данных.
- Разделяет бизнес-логику по понятным backend-модулям и переиспользуемым frontend-страницам.

### Структура проекта

- `backend/` - NestJS API, Prisma schema, авторизация, бизнес-логика, загрузки файлов и Swagger-документация.
- `frontend/` - React-приложение, маршрутизация, состояние клиента, интеграция с API и UI.
- `docker-compose.yml` - локальная инфраструктура для PostgreSQL, backend и frontend.

### Как это работает

1. Сначала запускается frontend и проверяет, открыт он внутри Telegram Web App или в обычном браузере.
2. Если доступен `initData` от Telegram, frontend отправляет его на endpoint авторизации backend.
3. Backend проверяет данные Telegram, создаёт или обновляет пользователя и возвращает JWT токен вместе с данными профиля.
4. Frontend сохраняет состояние авторизации в Zustand и `localStorage`, чтобы сессия не сбрасывалась после обновления страницы.
5. Защищённые страницы и API-маршруты используют JWT и guards по ролям.
6. Загруженные изображения хранятся на backend и отображаются во frontend через путь `/storage`.
7. Swagger помогает просматривать API и тестировать методы.

### Технологии

Backend:

- NestJS
- Prisma
- PostgreSQL
- JWT
- Swagger
- Multer 

Frontend:

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Zustand
- React Router
- Axios

### Требования

- Node.js 20 или новее
- npm
- PostgreSQL 16 или новее
- Telegram Bot Token для авторизации через Telegram

### Переменные окружения

Пример `.env` для backend:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketplace
PORT=3000
STORAGE_DIR=storage
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ADMIN_TELEGRAM_IDS=123456789,987654321
```

Пример `.env` для frontend:

```env
VITE_API_URL=http://localhost:3000
```

### Локальный запуск

Backend:

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

### Запуск через Docker

Из корня репозитория:

```bash
docker compose up --build
```

Это должно запускать:

- PostgreSQL на порту `5432`
- Backend на порту `3000`
- Frontend на порту `5173`

