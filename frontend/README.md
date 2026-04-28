 # Marketplace Frontend

## English

This folder contains the frontend for the marketplace application. It is built with React, TypeScript, Vite, Tailwind CSS, Zustand, React Router, and Axios.

### What this frontend does

- Renders the user-facing marketplace experience.
- Connects to the backend API and keeps authentication in sync.
- Supports Telegram Web App login and local browser mode.
- Persists auth state in `localStorage` so the session survives reloads.
- Routes users through the main product, seller, cart, order, request, verification, and admin pages.
- Loads uploaded media from the backend through the `/storage` path.

### Tech stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Zustand
- React Router
- Axios
- Lucide React icons

### Requirements

- Node.js 20 or newer
- npm
- The backend running on `http://localhost:3000` or a custom API URL

### Environment variables

Create a `.env` file in `frontend/` if you want to override the API URL:

```env
VITE_API_URL=http://localhost:3000
```

If `VITE_API_URL` is not set:

- in development, the app uses the Vite proxy at `/api`
- in local browser mode, it falls back to `http://localhost:3000`
- in production or tunnel-based deployments, you should set `VITE_API_URL` explicitly

### Install

```bash
npm install
```

### Run the frontend

Development mode:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Available scripts

- `npm run dev` - start the Vite dev server.
- `npm run build` - type-check and build the app for production.
- `npm run lint` - run ESLint across the project.
- `npm run preview` - preview the built app locally.

### Development notes

- The app reads Telegram session data from `window.Telegram.WebApp.initData` when available.
- It also supports fallback login data from the URL hash, which helps during testing outside Telegram.
- Auth state is managed by Zustand and persisted to `localStorage`.
- The Axios client automatically adds the bearer token to protected requests.
- The Vite config proxies `/api` to the backend and forwards `/storage` so assets work locally without CORS issues.

## Русский

В этой папке находится frontend для маркетплейса. Он собран на React, TypeScript, Vite, Tailwind CSS, Zustand, React Router и Axios.

### Что делает frontend

- Показывает пользовательский интерфейс маркетплейса.
- Подключается к backend API и синхронизирует авторизацию.
- Поддерживает вход через Telegram Web App и обычный режим в браузере.
- Сохраняет состояние авторизации в `localStorage`, чтобы сессия не сбрасывалась после обновления страницы.
- Переключает пользователя между основными страницами товаров, продавцов, корзины, заказов, заявок, верификации и админки.
- Загружает изображения через backend по пути `/storage`.

### Технологии

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Zustand
- React Router
- Axios
- Иконки Lucide React

### Требования

- Node.js 20 или новее
- npm
- Запущенный backend на `http://localhost:3000` или свой URL API

### Переменные окружения

Создай файл `.env` в папке `frontend/`, если хочешь указать свой адрес API:

```env
VITE_API_URL=http://localhost:3000
```

Если `VITE_API_URL` не задан:

- в режиме разработки приложение использует Vite proxy через `/api`
- в локальном браузере оно переходит на `http://localhost:3000`
- в production или при запуске через tunnel нужно явно указать `VITE_API_URL`

### Установка

```bash
npm install
```

### Запуск frontend

Режим разработки:

```bash
npm run dev
```

Сборка для production:

```bash
npm run build
```

Предпросмотр production-сборки:

```bash
npm run preview
```

### Примечания по разработке

- Приложение читает Telegram session data из `window.Telegram.WebApp.initData`, если она доступна.
- Также поддерживается резервный вариант через URL hash, что удобно для тестирования вне Telegram.
- Состояние авторизации управляется через Zustand и сохраняется в `localStorage`.
- Axios-клиент автоматически добавляет bearer token в защищённые запросы.
- Конфиг Vite проксирует `/api` на backend и передаёт `/storage`, чтобы ассеты работали локально без проблем с CORS.

