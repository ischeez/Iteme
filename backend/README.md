# Backend

## English

This folder contains the backend for the marketplace application. It is built with NestJS, Prisma, PostgreSQL, JWT authentication, and Swagger API docs.

### What this backend does

- Connects to PostgreSQL through Prisma.
- Handles Telegram-based login and issues JWT access tokens.
- Protects routes with JWT and role-based guards.
- Serves uploaded images from the local `storage/` directory.
- Exposes API documentation at `/api/docs`.
- Organizes the business logic by feature modules such as auth, categories, products, orders, requests, verification, uploads, sellers, guarantors, subscriptions, and admin.


### Requirements

- Node.js 20 or newer
- npm
- PostgreSQL

### Environment variables

Create a `.env` file in `backend/` with at least these values:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketplace
PORT=3000
STORAGE_DIR=storage
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ADMIN_TELEGRAM_IDS=123456789,987654321
```

`ADMIN_TELEGRAM_IDS` is optional, but if you want specific Telegram users to receive admin access, list their Telegram IDs there.

### Install

```bash
npm install
```

### Database setup

If you are running PostgreSQL locally, make sure the database from `DATABASE_URL` exists.

Then apply Prisma migrations and generate the client:

```bash
npx prisma migrate dev
npx prisma generate
```

If you use Docker Compose from the project root, PostgreSQL is started for you automatically.

### Run the backend

Development mode:

```bash
npm run start:dev
```

Regular start:

```bash
npm run start
```

Production build and run:

```bash
npm run build
npm run start:prod
```

### Docker Compose

From the project root you can start the full stack with:

```bash
docker compose up --build
```

This starts:

- PostgreSQL on port `5432`
- Backend on port `3000`
- Frontend on port `5173`

### Main endpoints

- `POST /auth/telegram/login` - Telegram login, returns JWT and user data.
- `GET /auth/me` - returns the current authenticated user.
- `PATCH /auth/switch-role` - changes the current role if allowed.
- `PATCH /auth/avatar` - updates avatar URL.
- `POST /uploads/image` - uploads an image for authenticated users with the proper role.

### Notes

- Swagger UI is available at `/api/docs`.
- Uploaded files are stored locally, so keep the `storage/` folder persisted if you deploy with Docker.
- The app uses CORS with credentials enabled.

## Русский 

В этой папке находится backend для маркетплейса. Он собран на NestJS, Prisma, PostgreSQL, JWT-авторизации и Swagger-документации.

### Что делает backend

- Подключается к PostgreSQL через Prisma.
- Обрабатывает вход через Telegram и выдаёт JWT access token.
- Защищает маршруты через JWT и role-based guards.
- Отдаёт загруженные изображения из локальной папки `storage/`.
- Показывает документацию API по адресу `/api/docs`.
- Делит логику по модулям: auth, categories, products, orders, requests, verification, uploads, sellers, guarantors, subscriptions и admin.


### Требования

- Node.js 20 или новее
- npm
- PostgreSQL

### Переменные окружения

Создай файл `.env` в папке `backend/` минимум с такими значениями:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketplace
PORT=3000
STORAGE_DIR=storage
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ADMIN_TELEGRAM_IDS=123456789,987654321
```

`ADMIN_TELEGRAM_IDS` не обязателен, но если нужно выдавать админ-доступ конкретным Telegram-пользователям, укажи их Telegram ID здесь.

### Установка

```bash
npm install
```

### Настройка базы данных

Если PostgreSQL запущен локально, убедись, что база из `DATABASE_URL` уже создана.

Затем примени миграции Prisma и сгенерируй клиент:

```bash
npx prisma migrate dev
npx prisma generate
```

Если используешь Docker Compose из корня проекта, PostgreSQL поднимается автоматически.

### Запуск backend

Режим разработки:

```bash
npm run start:dev
```

Обычный запуск:

```bash
npm run start
```

Сборка и запуск production:

```bash
npm run build
npm run start:prod
```

### Docker Compose

Из корня проекта можно поднять весь стек командой:

```bash
docker compose up --build
```

Это запустит:

- PostgreSQL на порту `5432`
- Backend на порту `3000`
- Frontend на порту `5173`

### Основные эндпоинты

- `POST /auth/telegram/login` - вход через Telegram, возвращает JWT и данные пользователя.
- `GET /auth/me` - возвращает текущего авторизованного пользователя.
- `PATCH /auth/switch-role` - меняет роль, если это разрешено.
- `PATCH /auth/avatar` - обновляет ссылку на аватар.
- `POST /uploads/image` - загружает изображение для авторизованных пользователей с нужной ролью.

### Примечания

- Swagger UI доступен по адресу `/api/docs`.
- Загруженные файлы хранятся локально, поэтому при деплое с Docker папку `storage/` нужно сохранять между перезапусками.
- В приложении включён CORS с `credentials`.
