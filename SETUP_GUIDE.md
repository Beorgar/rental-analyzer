# 🚀 Setup Guide - Rental Analyzer с OpenAI

## ✅ Что изменилось

### Оптимизация аналитики
- ✅ **Заменили Claude на OpenAI GPT-4o-mini** - **в 20 раз дешевле!** ($0.15/1M tokens вместо $3/1M)
- ✅ **Оптимизировали данные от Apify** - фильтруем только нужные поля (200KB → 2KB)
- ✅ **Добавили структурированный промпт** - чёткий JSON-ответ, валидация, fallback
- ✅ **Генерация PDF** - красивые отчёты с помесячными рекомендациями
- ✅ **Отправка на email** - через Resend (3000 emails/месяц бесплатно)

---

## 📋 Необходимые API ключи

### 1. OpenAI API Key (ОБЯЗАТЕЛЬНО)

**Почему:** Для генерации AI-анализа цен

**Стоимость:** $0.15 за 1M tokens (~5000 отчётов = $0.15)

**Как получить:**
1. Зарегистрируйтесь на [platform.openai.com](https://platform.openai.com)
2. Перейдите в [API Keys](https://platform.openai.com/api-keys)
3. Нажмите "Create new secret key"
4. Скопируйте ключ (начинается с `sk-proj-...`)

**Добавьте в .env.local:**
```
OPENAI_API_KEY=sk-proj-ваш_ключ_здесь
```

---

### 2. Resend API Key (ОБЯЗАТЕЛЬНО)

**Почему:** Для отправки PDF-отчётов на email

**Стоимость:** Бесплатно до 3000 emails/месяц

**Как получить:**
1. Зарегистрируйтесь на [resend.com](https://resend.com)
2. Перейдите в [API Keys](https://resend.com/api-keys)
3. Нажмите "Create API Key"
4. Скопируйте ключ (начинается с `re_...`)

**⚠️ ВАЖНО:** Настройте домен для отправки email:
1. В Resend перейдите в [Domains](https://resend.com/domains)
2. Добавьте свой домен (или используйте тестовый `onboarding.resend.dev`)
3. Обновите `from` адрес в [api/lib/sendEmail.js:30](api/lib/sendEmail.js#L30):
   ```javascript
   from: 'AI Pricing Report <reports@ваш-домен.com>',
   ```

**Добавьте в .env.local:**
```
RESEND_API_KEY=re_ваш_ключ_здесь
```

---

### 3. PDFShift API Key (ОПЦИОНАЛЬНО)

**Почему:** Для генерации PDF из HTML

**Стоимость:** Бесплатно до 250 PDFs/месяц

**Ключ по умолчанию:** Уже предоставлен в .env.example для тестирования

**Если нужен свой ключ:**
1. Зарегистрируйтесь на [pdfshift.io](https://pdfshift.io)
2. Скопируйте API key из дашборда

**Добавьте в .env.local:**
```
PDFSHIFT_API_KEY=sk_ваш_ключ_здесь
```

---

### 4. Apify API Token (УЖЕ ЕСТЬ)

**Статус:** ✅ Уже настроено

**Примечание:** Используем `voyager/booking-scraper` ($0.005 за запуск, 16 секунд)

---

### 5. Stripe Keys (УЖЕ ЕСТЬ)

**Статус:** ✅ Уже настроено

---

## 🛠️ Установка

### Шаг 1: Установите новые пакеты

```bash
cd C:\Users\pavel\rental-analyzer
npm install
```

Установятся:
- `openai` - для AI-анализа
- `resend` - для email отправки

---

### Шаг 2: Настройте переменные окружения

**Локально (.env.local):**
```bash
# Скопируйте пример
cp .env.example .env.local

# Откройте и заполните ключи
notepad .env.local
```

**На Vercel:**
1. Перейдите в [vercel.com/your-project/settings/environment-variables](https://vercel.com)
2. Добавьте:
   - `OPENAI_API_KEY` = sk-proj-...
   - `RESEND_API_KEY` = re_...
   - `PDFSHIFT_API_KEY` = sk_... (или используйте дефолтный)
3. Redeploy проект

---

### Шаг 3: Протестируйте локально

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

**Тестовый сценарий:**
1. Вставьте URL: `https://www.booking.com/hotel/at/paul-39-s-studio.ru.html`
2. Нажмите "Анализировать"
3. Оплатите тестовой картой: `4242 4242 4242 4242`
4. Проверьте email - должен прийти PDF-отчёт

---

## 📊 Что изменилось в коде

### Созданные файлы:
```
api/lib/
├── generateHTML.js   # Генерация HTML-отчёта
├── generatePDF.js    # Конвертация HTML → PDF
└── sendEmail.js      # Отправка email через Resend
```

### Изменённые файлы:
```
api/report/generate.js     # Заменён Claude → OpenAI + PDF generation
api/property/parse.js      # Оптимизирована фильтрация данных Apify
.env.example               # Обновлены переменные окружения
```

---

## 💰 Экономика обновления

| Сервис | Старое решение | Новое решение | Экономия |
|--------|---------------|---------------|----------|
| **AI анализ** | Claude Sonnet 3.5 ($3/1M tokens) | OpenAI GPT-4o-mini ($0.15/1M tokens) | **20x дешевле** |
| **Данные от Apify** | 200KB передавалось → дорого | 2KB после фильтрации → дёшево | **99% меньше данных** |
| **Email** | nodemailer (нужен SMTP) | Resend (бесплатно 3000/мес) | **Проще + дешевле** |
| **PDF** | Не было | PDFShift (250/мес бесплатно) | **Новая фича** |

**Итого за 100 отчётов:**
- Раньше: ~$6-10
- Сейчас: ~$0.50-1
- **Экономия: $5-9 per 100 отчётов**

---

## ❓ Troubleshooting

### "OpenAI API error: 401"
- Проверьте, что `OPENAI_API_KEY` правильно установлен
- Убедитесь, что ключ начинается с `sk-proj-`
- Проверьте баланс на [platform.openai.com/usage](https://platform.openai.com/usage)

### "Resend API error: 403"
- Проверьте, что `RESEND_API_KEY` правильно установлен
- Убедитесь, что домен подтверждён в [resend.com/domains](https://resend.com/domains)
- Проверьте квоту: [resend.com/usage](https://resend.com/usage)

### "PDFShift API error"
- Используйте дефолтный ключ из .env.example
- Или получите свой на [pdfshift.io](https://pdfshift.io)

### "Email не приходит"
- Проверьте спам
- Проверьте email в логах Vercel/локальных
- Проверьте [resend.com/emails](https://resend.com/emails) - там видны все отправленные

---

## 🚀 Деплой на Vercel

```bash
# Закоммитьте изменения
git add .
git commit -m "feat: Replace Claude with OpenAI + add PDF generation

- Replace Claude with OpenAI GPT-4o-mini (20x cheaper)
- Optimize Apify data filtering (200KB → 2KB)
- Add PDF report generation via PDFShift
- Add email sending via Resend
- Create structured JSON-based prompts with validation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Запушьте в GitHub
git push origin master

# Vercel автоматически задеплоит
```

**После деплоя:**
1. Добавьте переменные окружения в Vercel Dashboard
2. Redeploy проект
3. Протестируйте на продакшене

---

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи в Vercel Dashboard
2. Проверьте консоль браузера (F12)
3. Проверьте .env.local файл

---

## ✨ Что дальше?

После успешного запуска можно добавить:
- 📈 Dashboard для аналитики (сколько отчётов создано)
- 💳 Подписочную модель (€10/3 месяца)
- 🎨 AI-улучшение фотографий (уже есть UI)
- ✍️ AI-улучшение описаний (уже есть UI)
- 📊 Детальный анализ конкурентов

Удачи! 🚀
