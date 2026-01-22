#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}║         🚀 ПУБЛИКАЦИЯ RENTAL ANALYZER НА VERCEL 🚀               ║${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Проверка что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}❌ Ошибка: запустите скрипт из папки rental-analyzer${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Проверка директории - OK${NC}"
echo ""

# Шаг 1: GitHub username
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}ШАГ 1: Настройка GitHub репозитория${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "Введите ваш GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo -e "${YELLOW}❌ Username не может быть пустым${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📝 Инструкции:${NC}"
echo "1. Откройте в браузере: https://github.com/new"
echo "2. Repository name: rental-analyzer"
echo "3. Description: AI-powered short-term rental analyzer"
echo "4. НЕ добавляйте README, .gitignore или license"
echo "5. Нажмите 'Create repository'"
echo ""

read -p "Создали репозиторий? (yes/no): " REPO_CREATED

if [ "$REPO_CREATED" != "yes" ]; then
    echo -e "${YELLOW}Создайте репозиторий и запустите скрипт снова${NC}"
    exit 1
fi

# Шаг 2: Push на GitHub
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}ШАГ 2: Загрузка кода на GitHub${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

REPO_URL="https://github.com/$GITHUB_USERNAME/rental-analyzer.git"

echo -e "${GREEN}Добавляем remote origin...${NC}"
git remote remove origin 2>/dev/null
git remote add origin $REPO_URL

echo ""
echo -e "${GREEN}Проверяем ветку...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo "Текущая ветка: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo -e "${YELLOW}Переименовываем ветку в main...${NC}"
    git branch -M main
fi

echo ""
echo -e "${GREEN}Загружаем код на GitHub...${NC}"
echo ""

git push -u origin $(git branch --show-current)

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Код успешно загружен на GitHub!${NC}"
    echo -e "${GREEN}📍 URL: $REPO_URL${NC}"
else
    echo ""
    echo -e "${YELLOW}❌ Ошибка при загрузке${NC}"
    echo ""
    echo "Возможные причины:"
    echo "1. Нужно создать Personal Access Token"
    echo "   https://github.com/settings/tokens"
    echo "2. Неверный username"
    echo "3. Репозиторий не создан"
    exit 1
fi

# Шаг 3: Vercel
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}ШАГ 3: Деплой на Vercel${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📝 Следующие шаги:${NC}"
echo ""
echo "1. Откройте: https://vercel.com"
echo "2. Sign Up → Continue with GitHub"
echo "3. Add New → Project"
echo "4. Import: rental-analyzer"
echo ""
echo "5. Настройки:"
echo "   Framework Preset: Other"
echo "   Root Directory: ./"
echo "   Build Command: cd client && npm install && npm run build"
echo "   Output Directory: client/build"
echo ""
echo "6. Environment Variables - добавьте:"
echo "   - NODE_ENV=production"
echo "   - STRIPE_SECRET_KEY=sk_test_..."
echo "   - STRIPE_PUBLISHABLE_KEY=pk_test_..."
echo "   - REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_..."
echo "   - ANTHROPIC_API_KEY=sk-ant-..."
echo "   - EMAIL_HOST=smtp.gmail.com (опционально)"
echo "   - EMAIL_PORT=587 (опционально)"
echo "   - EMAIL_USER=your@gmail.com (опционально)"
echo "   - EMAIL_PASSWORD=app_password (опционально)"
echo ""
echo "7. Нажмите Deploy!"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ GitHub готов!${NC}"
echo -e "${GREEN}📍 Репозиторий: https://github.com/$GITHUB_USERNAME/rental-analyzer${NC}"
echo ""
echo -e "${BLUE}👉 Теперь перейдите на https://vercel.com и завершите деплой${NC}"
echo ""
echo -e "${YELLOW}📚 Подробные инструкции в файле: PUBLISH_NOW.md${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
