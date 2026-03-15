# 🏆 Викторина Чемпионов

Онлайн-игра в стиле «Своя игра» (Jeopardy) с тремя синхронными экранами: телевизор/проектор, ноутбук ведущего, телефон игрока.

## Стек

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express + TypeScript
- **Realtime**: Socket.io
- **БД**: PostgreSQL + Prisma ORM
- **Auth**: JWT (httpOnly cookie)
- **Платежи**: Stripe
- **State**: Zustand

---

## Быстрый старт (локально)

### 1. Клонирование и установка

```bash
git clone <repo>
cd victorina-chempionov
npm install
```

### 2. База данных

Нужен PostgreSQL. Создайте БД:

```bash
createdb victorina_chempionov
```

### 3. Переменные окружения

```bash
cp server/.env.example server/.env
```

Заполните `server/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/victorina_chempionov"
JWT_SECRET="your-secret-key-min-32-chars"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
PORT=3001
```

### 4. Prisma миграция и seed

```bash
npm run db:push          # применить схему
npm run db:seed          # загрузить 25 тем и 125 вопросов
```

### 5. Запуск

```bash
npm run dev              # запускает сервер (3001) и клиент (5173) одновременно
```

### 6. Stripe webhook (для тестирования покупок)

```bash
stripe listen --forward-to localhost:3001/api/payments/webhook
# Скопируйте whsec_... в STRIPE_WEBHOOK_SECRET
```

---

## Маршруты

| URL | Описание |
|-----|----------|
| `/` | Лендинг |
| `/auth` | Вход / регистрация ведущего |
| `/dashboard` | Личный кабинет ведущего |
| `/game/setup` | Настройка новой игры |
| `/host/lobby/:code` | Лобби ведущего (QR, список игроков) |
| `/host/game/:code` | Управление игрой |
| `/display?code=KVIZ42` | Экран проектора/телевизора |
| `/join` | Вход игрока по коду |
| `/join/:code` | Вход с предзаполненным кодом |
| `/play/:code` | Игровой экран игрока |
| `/store` | Магазин тем |

---

## Деплой на Railway

### Подготовка

1. Создайте аккаунт на [railway.app](https://railway.app)
2. Установите Railway CLI: `npm install -g @railway/cli`
3. Залогиньтесь: `railway login`

### Деплой

```bash
# Инициализируем проект
railway init

# Добавляем PostgreSQL
railway add --plugin postgresql

# Деплоим
railway up
```

### Переменные окружения на Railway

В Dashboard Railway → Variables добавьте:

```
DATABASE_URL          = (автоматически из PostgreSQL плагина)
JWT_SECRET            = ваш-секрет-минимум-32-символа
STRIPE_SECRET_KEY     = sk_live_...
STRIPE_WEBHOOK_SECRET = whsec_...
CLIENT_URL            = https://ваш-домен.railway.app
NODE_ENV              = production
PORT                  = 3001
```

### После деплоя

```bash
# Применить схему БД
railway run npm run db:push

# Загрузить данные
railway run npm run db:seed
```

### Stripe Webhook на продакшне

В [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks):
- Endpoint URL: `https://ваш-домен.railway.app/api/payments/webhook`
- Events: `checkout.session.completed`
- Скопируйте `whsec_...` в переменную `STRIPE_WEBHOOK_SECRET`

---

## Структура проекта

```
victorina-chempionov/
├── client/          # React фронтенд
│   └── src/
│       ├── pages/   # Landing, Auth, Dashboard, GameSetup,
│       │            # GameHost, GameDisplay, GamePlayer,
│       │            # JoinGame, HostLobby, Store
│       ├── components/  # GameBoard, Timer, Scoreboard,
│       │                # BuzzButton, QuestionView, ...
│       ├── socket/  # Socket.io клиент + хуки
│       ├── store/   # Zustand (gameStore, authStore)
│       └── api/     # axios API клиенты
├── server/          # Express бэкенд
│   ├── prisma/      # schema.prisma + seed.ts
│   └── src/
│       ├── routes/  # auth, game, themes, payments
│       ├── socket/  # roomHandlers, gameHandlers,
│       │            # buzzHandlers, timerHandlers, ...
│       ├── middleware/  # auth, validate
│       └── services/   # jwtService
└── shared/          # Общие TypeScript типы
    └── src/
        ├── game.ts
        ├── socket.ts
        └── theme.ts
```

---

## Игровой процесс

1. **Ведущий** регистрируется, создаёт игру (выбирает темы + туры + таймер)
2. **Ведущий** открывает `/host/lobby/:code` и `/display?code=` на проекторе
3. **Игроки** сканируют QR или вводят код на `/join`
4. **Ведущий** нажимает «Начать игру»
5. На поле 5×5 ведущий кликает по ячейке → вопрос появляется на всех экранах
6. Игроки жмут «Я ЗНАЮ!» → первый нажавший отвечает
7. Ведущий нажимает ✅ или ❌ → очки обновляются на всех экранах
8. После 25 вопросов → промежуточные итоги → следующий тур
9. Финал → подиум + конфетти

---

## Монетизация

- **Бесплатно**: 10 тем (2 из каждой категории)
- **Платно**: 15 тем по 100 ₽ (разовая покупка через Stripe)
- Купленные темы навсегда в аккаунте
