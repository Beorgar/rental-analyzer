# 🚀 Деплой на Vercel

## Подготовка проекта

Проект уже настроен для деплоя на Vercel:
- ✅ Serverless функции в папке `/api`
- ✅ Конфигурация `vercel.json`
- ✅ React приложение в `/client`

## Шаг 1: Установите Vercel CLI (опционально)

```bash
npm install -g vercel
```

## Шаг 2: Инициализируйте Git репозиторий

```bash
cd C:\Users\pavel\rental-analyzer
git init
git add .
git commit -m "Initial commit: Rental Analyzer application"
```

## Шаг 3: Создайте репозиторий на GitHub

1. Перейдите на [github.com](https://github.com) и создайте новый репозиторий
2. Назовите его `rental-analyzer`
3. НЕ добавляйте README, .gitignore или лицензию (они уже есть)

```bash
git remote add origin https://github.com/YOUR_USERNAME/rental-analyzer.git
git branch -M main
git push -u origin main
```

## Шаг 4: Деплой на Vercel

### Вариант А: Через веб-интерфейс (Рекомендуется)

1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите "Sign Up" или "Login" (можно через GitHub)
3. Нажмите "Add New Project"
4. Импортируйте ваш GitHub репозиторий `rental-analyzer`
5. Настройте проект:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/build`
   - **Install Command**: `npm install`

6. Добавьте переменные окружения (Environment Variables):

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
APIFY_API_TOKEN=your_apify_token_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
NODE_ENV=production
```

7. Нажмите "Deploy"

### Вариант B: Через CLI

```bash
cd C:\Users\pavel\rental-analyzer
vercel login
vercel
```

Следуйте инструкциям CLI и добавьте переменные окружения через веб-интерфейс.

## Шаг 5: Обновите Stripe Publishable Key

После деплоя обновите файл [client/src/pages/PaymentPage.js](C:\Users\pavel\rental-analyzer\client\src\pages\PaymentPage.js#L8):

```javascript
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key');
```

Добавьте в Vercel переменную окружения:
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

## Шаг 6: Проверьте деплой

После успешного деплоя:
1. Vercel даст вам URL (например, `rental-analyzer.vercel.app`)
2. Откройте URL в браузере
3. Проверьте работу:
   - Ввод URL объекта
   - Загрузка данных
   - Страница оплаты
   - Отправка отчета

## Переменные окружения

Обязательные переменные для production:

| Переменная | Описание | Где получить |
|------------|----------|--------------|
| `STRIPE_SECRET_KEY` | Secret ключ Stripe | [stripe.com/dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_PUBLISHABLE_KEY` | Publishable ключ Stripe | [stripe.com/dashboard](https://dashboard.stripe.com/apikeys) |
| `ANTHROPIC_API_KEY` | API ключ Claude | [console.anthropic.com](https://console.anthropic.com) |
| `APIFY_API_TOKEN` | API токен Apify | [apify.com/settings](https://console.apify.com/account/integrations) |
| `EMAIL_HOST` | SMTP хост | smtp.gmail.com |
| `EMAIL_PORT` | SMTP порт | 587 |
| `EMAIL_USER` | Email адрес | ваш Gmail |
| `EMAIL_PASSWORD` | App Password | [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) |

## Автоматический деплой

После настройки Vercel будет автоматически деплоить при каждом push в main:

```bash
git add .
git commit -m "Update feature"
git push
```

Vercel автоматически:
- Соберет проект
- Запустит тесты (если есть)
- Задеплоит новую версию
- Даст preview URL для каждого PR

## Настройка кастомного домена

1. В Vercel Dashboard откройте проект
2. Перейдите в "Settings" → "Domains"
3. Добавьте ваш домен
4. Настройте DNS записи согласно инструкциям Vercel

## Мониторинг и логи

- **Analytics**: Vercel → Project → Analytics
- **Logs**: Vercel → Project → Deployments → View Function Logs
- **Errors**: Автоматически отображаются в Dashboard

## Устранение проблем

### Ошибка "Function invocation failed"
- Проверьте логи функций в Vercel Dashboard
- Убедитесь, что все переменные окружения установлены
- Проверьте, что все зависимости указаны в `package.json`

### CORS ошибки
- Serverless функции уже настроены с CORS headers
- Убедитесь, что запросы идут на `/api/*` endpoints

### Stripe ошибки
- Проверьте, что publishable key доступен в браузере
- Проверьте, что secret key установлен в Vercel Environment Variables
- Для production используйте live keys (не test)

### Email не отправляется
- Проверьте Gmail App Password
- Убедитесь, что 2FA включена в Google аккаунте
- Проверьте логи функции `generate-report`

## Production чеклист

Перед переходом в production:

- [ ] Замените Stripe test keys на live keys
- [ ] Настройте webhook для Stripe (опционально)
- [ ] Настройте реальную интеграцию с Apify
- [ ] Добавьте базу данных для хранения заказов
- [ ] Настройте мониторинг ошибок (Sentry)
- [ ] Добавьте Google Analytics
- [ ] Настройте кастомный домен
- [ ] Проверьте безопасность API endpoints
- [ ] Добавьте rate limiting
- [ ] Настройте HTTPS (автоматически через Vercel)

## Масштабирование

Vercel автоматически масштабирует ваше приложение:
- Serverless функции масштабируются на основе нагрузки
- CDN для статических файлов
- Edge Network для глобального распределения

## Стоимость

- **Hobby план** (бесплатно):
  - 100 GB bandwidth
  - Serverless Function Execution: 100 GB-Hrs
  - 6,000 Build minutes

- **Pro план** ($20/месяц):
  - 1 TB bandwidth
  - Unlimited serverless functions
  - 24,000 Build minutes

Для начала достаточно бесплатного плана!

## Полезные ссылки

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Stripe Documentation](https://stripe.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com)
