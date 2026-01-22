# 🏠 Rental Analyzer - Анализатор краткосрочной аренды

Веб-приложение для глубокого анализа недвижимости на платформах Booking.com, Airbnb и VRBO с AI-генерацией отчетов и рекомендациями по ценообразованию.

## 📋 Функциональность

### Основные возможности:
- **Анализ объектов** из Booking.com, Airbnb, VRBO по ссылке
- **Предпросмотр данных** об объекте после парсинга
- **Генерация отчетов** с использованием Claude AI:
  - Анализ рынка и локации
  - Стратегия ценообразования на 3 месяца
  - Прогноз доходности
  - Конкурентное позиционирование
- **Интеграция Stripe** для приема платежей
- **Автоматическая отправка отчетов** на email
- **Апсейлы**:
  - Улучшение описания объекта
  - Профессиональная обработка фотографий

## 🛠 Технологический стек

### Backend:
- Node.js + Express
- Stripe (платежи)
- Anthropic Claude AI (генерация отчетов)
- Apify (парсинг данных)
- Nodemailer (отправка email)

### Frontend:
- React 18
- React Router
- Stripe React Elements
- Axios

## 📦 Установка

### 1. Клонирование репозитория
```bash
cd rental-analyzer
```

### 2. Установка зависимостей

#### Backend:
```bash
npm install
```

#### Frontend:
```bash
cd client
npm install
```

### 3. Настройка переменных окружения

Создайте файл `.env` в корневой директории на основе `.env.example`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Anthropic AI Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Apify Configuration
APIFY_API_TOKEN=your_apify_token_here

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Application URLs
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000
```

### 4. Получение API ключей

#### Stripe:
1. Зарегистрируйтесь на [stripe.com](https://stripe.com)
2. Получите тестовые ключи в Dashboard → Developers → API keys
3. Замените в `.env` и в `client/src/pages/PaymentPage.js` (строка 8)

#### Anthropic Claude:
1. Зарегистрируйтесь на [console.anthropic.com](https://console.anthropic.com)
2. Создайте API ключ
3. Добавьте в `.env`

#### Apify:
1. Зарегистрируйтесь на [apify.com](https://apify.com)
2. Получите API токен в Settings → Integrations
3. Добавьте в `.env`

#### Email (Gmail):
1. Включите двухфакторную аутентификацию в вашем Google аккаунте
2. Создайте App Password: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Используйте этот пароль в `EMAIL_PASSWORD`

## 🚀 Запуск приложения

### Режим разработки:

#### Вариант 1: Запуск всего (рекомендуется)
```bash
npm install -g concurrently
npm run dev:all
```

#### Вариант 2: Отдельные терминалы

Terminal 1 - Backend:
```bash
npm run dev
```

Terminal 2 - Frontend:
```bash
cd client
npm start
```

### Приложение будет доступно:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📁 Структура проекта

```
rental-analyzer/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── pages/         # Страницы приложения
│   │   │   ├── LandingPage.js
│   │   │   ├── PaymentPage.js
│   │   │   └── SuccessPage.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
├── server.js              # Express backend
├── package.json
├── .env                   # Переменные окружения (создать)
└── .env.example          # Пример переменных окружения
```

## 🔄 API Endpoints

### `POST /api/property/parse`
Парсинг данных об объекте по ссылке
```json
{
  "url": "https://www.airbnb.com/rooms/..."
}
```

### `POST /api/payment/create-intent`
Создание платежного намерения
```json
{
  "amount": 4999,
  "email": "user@example.com",
  "propertyId": "abc123"
}
```

### `POST /api/report/generate`
Генерация и отправка отчета
```json
{
  "propertyData": {...},
  "email": "user@example.com",
  "paymentIntentId": "pi_..."
}
```

## 🎨 Кастомизация

### Изменение цен:
Отредактируйте `client/src/pages/PaymentPage.js`:
```javascript
const basePrice = 49.99;
const upsellDescriptionPrice = 29.99;
const upsellPhotosPrice = 99.99;
```

### Изменение промпта для AI:
Отредактируйте `server.js` функцию `generateAIReport()`

### Интеграция с реальными данными:
В функции `fetchPropertyData()` в `server.js` замените моковые данные на реальные вызовы Apify:
```javascript
const run = await apifyClient.actor('actor-id').call({ url });
const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
```

## 🐛 Решение проблем

### Ошибка CORS:
Убедитесь, что backend запущен на порту 5000 и в `client/package.json` указан `"proxy": "http://localhost:5000"`

### Ошибки Stripe:
- Проверьте, что publishable key указан в `PaymentPage.js`
- Проверьте, что secret key указан в `.env`
- Используйте тестовую карту: `4242 4242 4242 4242`

### Email не отправляется:
- Проверьте настройки App Password в Gmail
- Убедитесь, что двухфакторная аутентификация включена

## 📝 TODO / Улучшения

- [ ] Добавить реальную интеграцию с Apify actors
- [ ] Реализовать webhook для Stripe
- [ ] Добавить админ панель
- [ ] Кэширование отчетов
- [ ] Добавить больше платформ (HomeAway, Tripadvisor)
- [ ] Мультиязычность
- [ ] A/B тестирование цен

## 📄 Лицензия

MIT

## 👨‍💻 Автор

Создано для анализа недвижимости краткосрочной аренды

---

**Важно**: Это приложение использует демо-данные для парсинга. Для production необходимо:
1. Настроить реальные Apify actors
2. Перевести Stripe в production режим
3. Настроить базу данных для хранения отчетов
4. Добавить аутентификацию пользователей
