# 🚀 ПУБЛИКУЕМ ПРЯМО СЕЙЧАС!

## ШАГ 1: Создайте GitHub репозиторий (2 минуты)

1. Откройте в браузере: **https://github.com/new**

2. Заполните форму:
   - **Repository name**: `rental-analyzer`
   - **Description**: `AI-powered short-term rental property analyzer`
   - Выберите **Public** или **Private**
   - **НЕ ставьте** галочки на README, .gitignore, license

3. Нажмите **"Create repository"**

4. GitHub покажет вам команды. Скопируйте URL вашего репозитория:
   ```
   https://github.com/YOUR_USERNAME/rental-analyzer.git
   ```

---

## ШАГ 2: Запушьте код (1 минута)

Откройте терминал и выполните (замените YOUR_USERNAME на ваш GitHub username):

```bash
cd C:/Users/pavel/rental-analyzer
git remote add origin https://github.com/YOUR_USERNAME/rental-analyzer.git
git push -u origin master
```

Если попросит логин/пароль:
- **Username**: ваш GitHub username
- **Password**: используйте Personal Access Token (не пароль!)
  - Создать токен: https://github.com/settings/tokens
  - Select scopes: ✅ repo

---

## ШАГ 3: Деплой на Vercel (3 минуты)

### 3.1 Регистрация

1. Откройте: **https://vercel.com**
2. Нажмите **"Sign Up"**
3. Выберите **"Continue with GitHub"**
4. Авторизуйте Vercel

### 3.2 Импорт проекта

1. На главной странице Vercel нажмите **"Add New..."** → **"Project"**
2. Найдите **rental-analyzer** в списке
3. Нажмите **"Import"**

### 3.3 Настройка проекта

**Build & Development Settings:**

Framework Preset:
```
Other
```

Root Directory:
```
./
```

Build Command:
```
cd client && npm install && npm run build
```

Output Directory:
```
client/build
```

Install Command:
```
npm install
```

---

## ШАГ 4: Добавьте переменные окружения (2 минуты)

В настройках проекта нажмите **"Environment Variables"** и добавьте:

### Обязательные переменные:

**Name:** `NODE_ENV`
**Value:** `production`

---

**Name:** `STRIPE_SECRET_KEY`
**Value:** `sk_test_...` (ваш Stripe Secret Key)
Получить: https://dashboard.stripe.com/test/apikeys

---

**Name:** `STRIPE_PUBLISHABLE_KEY`
**Value:** `pk_test_...` (ваш Stripe Publishable Key)
Получить: https://dashboard.stripe.com/test/apikeys

---

**Name:** `REACT_APP_STRIPE_PUBLISHABLE_KEY`
**Value:** `pk_test_...` (тот же Publishable Key)

---

**Name:** `ANTHROPIC_API_KEY`
**Value:** `sk-ant-...` (ваш Claude API Key)
Получить: https://console.anthropic.com/settings/keys

---

### Опциональные (для email):

**Name:** `EMAIL_HOST`
**Value:** `smtp.gmail.com`

---

**Name:** `EMAIL_PORT`
**Value:** `587`

---

**Name:** `EMAIL_USER`
**Value:** `your-email@gmail.com`

---

**Name:** `EMAIL_PASSWORD`
**Value:** (Gmail App Password - 16 символов)
Получить: https://myaccount.google.com/apppasswords
(Требуется включить 2FA)

---

**Name:** `APIFY_API_TOKEN`
**Value:** (пока можно пропустить, используются демо-данные)

---

## ШАГ 5: Deploy! (автоматически)

1. После добавления переменных нажмите **"Deploy"**
2. Дождитесь завершения (2-5 минут)
3. Vercel даст вам URL: **rental-analyzer.vercel.app**

---

## ШАГ 6: Проверка (1 минута)

1. Откройте ваш Vercel URL
2. Введите любой URL (например: `https://www.airbnb.com/rooms/123`)
3. Нажмите "Анализировать"
4. Должна появиться информация об объекте
5. Нажмите "Получить отчет"
6. На странице оплаты используйте тестовую карту Stripe:
   - Номер: `4242 4242 4242 4242`
   - Срок: любая дата в будущем (например `12/25`)
   - CVC: `123`
   - Email: ваш реальный email

---

## 🎉 ГОТОВО!

Ваше приложение опубликовано!

### Что дальше?

- Поделитесь ссылкой с друзьями для тестирования
- Настройте кастомный домен в Vercel
- Добавьте Google Analytics
- Переведите Stripe в production режим (live keys)

---

## 🆘 Проблемы?

### Git push не работает
Убедитесь, что используете Personal Access Token, а не пароль:
https://github.com/settings/tokens

### Vercel build failed
Проверьте логи в Vercel Dashboard → Deployments → View Logs

### Function errors
Проверьте, что все переменные окружения добавлены корректно

### Email не приходит
- Проверьте папку Спам
- Убедитесь, что EMAIL переменные добавлены
- Проверьте, что используете Gmail App Password (не обычный пароль)

---

## 📞 Нужна помощь?

Проверьте документацию:
- README.md - Основная документация
- DEPLOYMENT.md - Детальные инструкции
- QUICKSTART.md - Быстрый старт

---

**Время публикации: ~10 минут**

**Удачи! 🚀**
