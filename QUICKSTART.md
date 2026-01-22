# ⚡ Быстрый старт - Деплой за 5 минут

## 1. Создайте GitHub репозиторий

```bash
cd C:\Users\pavel\rental-analyzer
git init
git add .
git commit -m "Initial commit"
```

Создайте репозиторий на GitHub и запушьте:
```bash
git remote add origin https://github.com/YOUR_USERNAME/rental-analyzer.git
git branch -M main
git push -u origin main
```

## 2. Деплой на Vercel

1. Перейдите на **[vercel.com](https://vercel.com)**
2. Нажмите **"Sign Up"** (можно через GitHub)
3. Нажмите **"Add New Project"**
4. Выберите репозиторий **rental-analyzer**
5. Настройки проекта:
   - Framework Preset: **Other**
   - Root Directory: **`./`**
   - Build Command: **`cd client && npm install && npm run build`**
   - Output Directory: **`client/build`**

6. Нажмите **"Deploy"**

## 3. Добавьте переменные окружения

В Vercel Dashboard → Settings → Environment Variables добавьте:

### Минимальный набор для тестирования:
```
NODE_ENV=production
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_51...
ANTHROPIC_API_KEY=sk-ant-...
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Для Stripe:
- Регистрация: [stripe.com](https://stripe.com)
- API Keys: [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
- Тестовая карта: `4242 4242 4242 4242`

### Для Claude AI:
- Регистрация: [console.anthropic.com](https://console.anthropic.com)
- API Keys: Settings → API Keys

### Для Gmail:
- App Password: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
- (требуется 2FA)

### Для Apify (опционально):
```
APIFY_API_TOKEN=your_token
```

## 4. Обновите Stripe ключ в коде

После добавления переменных окружения, добавьте также:
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

## 5. Готово! 🎉

Ваше приложение доступно по адресу:
```
https://rental-analyzer.vercel.app
```

## Структура API endpoints

После деплоя доступны:
- `GET /api/health` - Проверка работы API
- `POST /api/parse-property` - Парсинг объекта
- `POST /api/create-payment-intent` - Создание платежа
- `POST /api/generate-report` - Генерация отчета

## Проверка работы

1. Откройте ваш URL на Vercel
2. Вставьте любую ссылку (например, `https://www.airbnb.com/rooms/123`)
3. Нажмите "Анализировать"
4. Должна появиться информация об объекте
5. Нажмите "Получить отчет"
6. На странице оплаты введите email
7. Тестовая карта: `4242 4242 4242 4242`, любая дата в будущем, любой CVC

## Troubleshooting

### Ошибка при деплое
- Проверьте логи в Vercel Dashboard
- Убедитесь, что все файлы закоммичены в Git

### API не работает
- Проверьте, что переменные окружения добавлены
- Проверьте логи функций: Vercel → Deployments → View Function Logs

### Email не отправляется
- Проверьте Gmail App Password
- Убедитесь, что 2FA включена

## Дальнейшие шаги

- Настройте кастомный домен
- Переведите Stripe в production режим
- Добавьте реальную интеграцию с Apify
- Настройте аналитику

## Полная документация

См. [DEPLOYMENT.md](DEPLOYMENT.md) для детальных инструкций.
