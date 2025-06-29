# cf-analytics-worker

> **Cloudflare Analytics Worker** — простой серверлесс воркер на TypeScript для сбора и отображения базовых игровых метрик: количества новых пользователей, попыток платного выбора и числа дошедших до последней сцены.

---

## 📁 Структура проекта

```
cf-analytics-worker/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD: сборка и деплой на GitHub Actions
├── migrations/                 # SQL-скрипты для D1-базы
│   ├── 001_create_new_users.sql
│   ├── 002_create_paid_clicks.sql
│   └── 003_create_reached_last_scene.sql
├── src/                        # Исходники воркера
│   ├── index.ts                # Точка входа, маршруты API
│   └── types.ts                # Определение Env с D1Database
├── wrangler.toml               # Конфигурация Wrangler/D1
├── package.json                # Скрипты и зависимости
├── tsconfig.json               # Настройки TypeScript
└── README.md                   # Документация проекта
```

---

## 🚀 Быстрый старт

1. **Клонировать репозиторий**

   ```bash
   git clone https://github.com/PenRomain/cf-analytics-worker.git
   cd cf-analytics-worker
   ```

2. **Установить Wrangler и зависимости**

   ```bash
   npm install -g wrangler
   npm ci
   ```

3. **Настроить секреты**
   - В корне проекта создайте `.env`:
     ```ini
     CLOUDFLARE_API_TOKEN=<ваш API токен с правами D1, Workers Script>
     CLOUDFLARE_ACCOUNT_ID=<ваш Cloudflare Account ID>
     ```
   - Локально загрузить:
     ```bash
     source .env
     ```
   - На GitHub добавить Secrets (`Settings → Secrets → Actions`):
     - `CLOUDFLARE_API_TOKEN` — копируйте значение токена.
     - `CLOUDFLARE_ACCOUNT_ID` — ваш Account ID.

4. **Создать и мигрировать базу D1**

   ```bash
   # создаёт базу analytics_db
   wrangler d1 create analytics_db

   # применяет все миграции из папки migrations/
   wrangler d1 migrations apply analytics_db
   ```

5. **Сборка и деплой**
   ```bash
   npm run build
   wrangler deploy
   ```
   Публикация пройдёт на `https://<имя_вашего_воркера>.<subdomain>.workers.dev`

---

## ⚙️ Конфигурация

Все настройки Wrangler и привязки к D1 находятся в `wrangler.toml`:

```toml
name = "cf-analytics-worker"
main = "src/index.ts"
compatibility_date = "2025-06-27"

[[d1_databases]]
binding = "DB"
database_name = "analytics_db"
```

---

## 🎯 Маршруты API

**Запись событий (POST)**

| Метод | Путь                  | Описание                                  |
| ----- | --------------------- | ----------------------------------------- |
| POST  | `/events/users`       | Регистрирует нового пользователя (userId) |
| POST  | `/events/paid-clicks` | Логирует попытку платного выбора          |
| POST  | `/events/last-scene`  | Отмечает достижение последней сцены       |

**Получение метрик (GET)**

| Метод | Путь                   | Описание                                   |
| ----- | ---------------------- | ------------------------------------------ |
| GET   | `/metrics/users`       | Всего уникальных новых пользователей       |
| GET   | `/metrics/paid-clicks` | Всего попыток платного выбора              |
| GET   | `/metrics/last-scene`  | Количество пользователей, завершивших игру |

Все ответы в формате `application/json` и поддерживают CORS.

---

## 🔁 CI/CD с GitHub Actions

При пуше в ветку `main` запускается workflow `deploy.yml`:

- `npm ci` → `npm run build` → деплой через `wrangler-action@v3`
- Логи и настройки подхватывают секреты `CLOUDFLARE_API_TOKEN` и `CLOUDFLARE_ACCOUNT_ID`.

См. файл `.github/workflows/deploy.yml` для деталей.

---

## 🔧 Разработка

- Код воркера: `src/index.ts` с использованием `itty-router`.
- Типизация окружения: `src/types.ts`.
- Миграции в папке `migrations/` — версионируйте SQL.

Для локального теста можно использовать `wrangler dev`:

```bash
wrangler dev --local --env dev
```

---

## 📖 Полезные ссылки

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler)

<div align="center">🚀 Удачи с аналитикой! 🎮</div>
