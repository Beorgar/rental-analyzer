# 🗺️ Roadmap - Rental Analyzer

## ✅ Completed (v1.0)

- [x] Landing page with URL input
- [x] Property preview with demo data
- [x] Payment page with Stripe integration
- [x] One-time payment: $49.99 base + upsells ($29.99 description, $99.99 photos)
- [x] Success page with order confirmation
- [x] Deployment to Vercel
- [x] GitHub repository setup

## 📋 Backlog - Future Features

### High Priority

#### 1. 💳 Subscription Model (Подписочная модель)
**Описание:** Создать подписочную модель с автоматическим продлением
- **Цена:** €10 каждые 3 месяца
- **Что включено:**
  - Аналитика текущей эффективности объекта
  - Обновленные рекомендации по ценообразованию на следующие 3 месяца
  - Сравнение с предыдущим периодом
  - Сезонные тренды и прогнозы
  - Email уведомления перед каждым обновлением

**Технические задачи:**
- [ ] Настроить Stripe Subscriptions API
- [ ] Создать subscription checkout page
- [ ] Добавить customer portal для управления подпиской
- [ ] Настроить webhooks для автоматических платежей
- [ ] Создать recurring job для генерации ежеквартальных отчетов
- [ ] Dashboard для пользователя с историей отчетов
- [ ] Email notifications перед обновлением подписки

**Связанные файлы:**
- `/api/subscription/create.js` - создание подписки
- `/api/subscription/cancel.js` - отмена подписки
- `/api/subscription/webhook.js` - обработка событий Stripe
- `/api/report/recurring.js` - генерация recurring отчетов
- `/src/pages/SubscriptionPage.js` - страница управления подпиской
- `/src/pages/DashboardPage.js` - личный кабинет пользователя

---

#### 2. 🤖 AI Report Generation (AI генерация отчетов)
- [ ] Настроить ANTHROPIC_API_KEY
- [ ] Интегрировать Claude API для генерации детальных отчетов
- [ ] Создать промпты для разных типов анализа
- [ ] Добавить кэширование отчетов

#### 3. 📧 Email Delivery System
- [ ] Настроить SMTP (Gmail или SendGrid)
- [ ] Создать HTML email templates
- [ ] Добавить отправку отчетов на email
- [ ] Email уведомления о подписке

#### 4. 🔍 Real Property Data Parsing
- [ ] Настроить Apify API
- [ ] Интегрировать парсинг Booking.com
- [ ] Интегрировать парсинг Airbnb
- [ ] Интегрировать парсинг VRBO
- [ ] Обработка ошибок и edge cases

### Medium Priority

#### 5. 👤 User Authentication & Accounts
- [ ] Регистрация и авторизация пользователей
- [ ] Личный кабинет с историей заказов
- [ ] Сохранение объектов для отслеживания
- [ ] Управление подписками

#### 6. 📊 Advanced Analytics Dashboard
- [ ] Графики изменения цен
- [ ] Сравнение с конкурентами
- [ ] Tracking рекомендаций (какие применили, результаты)
- [ ] Export отчетов в PDF/Excel

#### 7. 💰 Multi-currency Support
- [ ] Поддержка EUR, USD, GBP, RUB
- [ ] Автоматическая конвертация
- [ ] Локализация цен

### Low Priority

#### 8. 🌍 Multi-language Support
- [ ] Английский интерфейс
- [ ] Немецкий интерфейс
- [ ] Испанский интерфейс

#### 9. 📱 Mobile App
- [ ] React Native приложение
- [ ] Push уведомления

#### 10. 🔔 Notifications & Alerts
- [ ] Email alerts о изменениях на рынке
- [ ] Уведомления о конкурентах
- [ ] Рекомендации по корректировке цен

---

## 🎯 Next Sprint Focus

**Приоритет #1:** Subscription Model (задача #1)
- Начать с настройки Stripe Subscriptions
- Создать базовый checkout flow для подписки
- Добавить страницу с выбором: one-time vs subscription

**Примерный timeline:** 2-3 недели

---

## 📝 Notes

- Все фичи должны работать с существующей архитектурой
- Сохранять обратную совместимость с one-time payments
- Приоритет: подписочная модель → AI отчеты → email → real data
- Тестировать с Stripe test mode перед production

---

**Last updated:** 2026-01-23
