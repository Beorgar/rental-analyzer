@echo off
chcp 65001 >nul
cls

echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                                                                  ║
echo ║            🚀 ПУБЛИКАЦИЯ RENTAL ANALYZER 🚀                      ║
echo ║                                                                  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo.

echo 📋 ШАГ 1: Создание GitHub репозитория
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Открываем GitHub в браузере...
start https://github.com/new
echo.
echo ✅ Создайте репозиторий:
echo    - Repository name: rental-analyzer
echo    - Description: AI-powered rental analyzer
echo    - НЕ добавляйте README, .gitignore, license
echo.
set /p CONTINUE="Создали репозиторий? (y/n): "
if /i not "%CONTINUE%"=="y" (
    echo.
    echo ❌ Создайте репозиторий и запустите скрипт снова
    pause
    exit /b
)

echo.
echo.
echo 📋 ШАГ 2: Настройка GitHub
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
set /p GITHUB_USER="Введите ваш GitHub username: "

if "%GITHUB_USER%"=="" (
    echo.
    echo ❌ Username не может быть пустым
    pause
    exit /b
)

echo.
echo ✅ GitHub username: %GITHUB_USER%
echo.

echo 📋 ШАГ 3: Загрузка кода на GitHub
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Удаляем старый remote (если есть)...
git remote remove origin 2>nul

echo Добавляем новый remote...
git remote add origin https://github.com/%GITHUB_USER%/rental-analyzer.git

echo.
echo Проверяем ветку...
for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH=%%i
echo Текущая ветка: %BRANCH%

echo.
echo Загружаем код на GitHub...
echo.
git push -u origin %BRANCH%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Ошибка при загрузке
    echo.
    echo Возможные причины:
    echo 1. Нужен Personal Access Token вместо пароля
    echo    Создать: https://github.com/settings/tokens
    echo 2. Неверный username
    echo 3. Репозиторий не создан
    echo.
    pause
    exit /b
)

echo.
echo ✅ Код успешно загружен на GitHub!
echo 📍 URL: https://github.com/%GITHUB_USER%/rental-analyzer
echo.
echo.

echo 📋 ШАГ 4: Деплой на Vercel
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Открываем Vercel в браузере...
start https://vercel.com
echo.
echo ✅ Следующие действия на Vercel:
echo.
echo 1. Sign Up → Continue with GitHub
echo 2. Add New → Project
echo 3. Import: rental-analyzer
echo.
echo 4. Настройки проекта:
echo    Framework Preset: Other
echo    Root Directory: ./
echo    Build Command: cd client ^&^& npm install ^&^& npm run build
echo    Output Directory: client/build
echo.
echo 5. Environment Variables - добавьте:
echo    NODE_ENV = production
echo    STRIPE_SECRET_KEY = ваш ключ
echo    STRIPE_PUBLISHABLE_KEY = ваш ключ
echo    REACT_APP_STRIPE_PUBLISHABLE_KEY = ваш ключ
echo    ANTHROPIC_API_KEY = ваш ключ
echo.
echo 6. Нажмите Deploy!
echo.
echo.

echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                                                                  ║
echo ║                    ✅ GITHUB ГОТОВ! ✅                            ║
echo ║                                                                  ║
echo ║  📍 Репозиторий: github.com/%GITHUB_USER%/rental-analyzer        ║
echo ║  👉 Завершите деплой на vercel.com                               ║
echo ║                                                                  ║
echo ║  📚 Инструкции: PUBLISH_NOW.md                                   ║
echo ║                                                                  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo.

echo Открыть документацию? (y/n)
set /p OPEN_DOCS=""
if /i "%OPEN_DOCS%"=="y" (
    start PUBLISH_NOW.md
)

pause
