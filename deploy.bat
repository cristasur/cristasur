@echo off
:: ============================================================
:: CRISTASUR — Script de deploy a Vercel (primera vez y updates)
:: Doble clic o: deploy.bat
:: Requiere Node.js >= 18 instalado.
:: ============================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ========================================
echo   CRISTASUR — Deploy a Vercel
echo ========================================
echo.

:: ── 1. Verificar Node.js ────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no encontrado. Descargalo en https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js %NODE_VER%

:: ── 2. Instalar Vercel CLI si no está ───────────────────────
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Instalando Vercel CLI globalmente...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo [ERROR] No se pudo instalar Vercel CLI.
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%v in ('vercel --version 2^>^&1') do set VERCEL_VER=%%v
echo [OK] Vercel CLI %VERCEL_VER%

:: ── 3. Instalar dependencias del proyecto ───────────────────
echo.
echo [INFO] Instalando dependencias npm...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install fallo.
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas.

:: ── 4. Verificar build local (opcional pero recomendado) ────
echo.
set /p BUILD_CHECK="[?] ¿Verificar build local antes de subir? (s/n): "
if /i "%BUILD_CHECK%"=="s" (
    echo [INFO] Ejecutando next build...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] El build local falló. Corrige los errores antes de hacer deploy.
        pause
        exit /b 1
    )
    echo [OK] Build local exitoso.
)

:: ── 5. Login a Vercel ────────────────────────────────────────
echo.
echo [INFO] Verificando sesión en Vercel...
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Iniciando sesión en Vercel (se abrirá el browser)...
    vercel login
)

:: ── 6. Configurar variables de entorno en Vercel ────────────
echo.
echo ========================================
echo  VARIABLES DE ENTORNO EN VERCEL
echo ========================================
echo  Debes tener estas variables configuradas
echo  en tu proyecto de Vercel ANTES del deploy:
echo.
echo    MONGODB_URI
echo    JWT_SECRET
echo    RESEND_API_KEY
echo    NEXT_PUBLIC_SITE_URL
echo    ADMIN_NOTIFY_EMAILS
echo    BLOB_READ_WRITE_TOKEN  (si usas scripts locales)
echo.
echo  Para agregarlas ahora via CLI corre:
echo    vercel env add MONGODB_URI production
echo    vercel env add JWT_SECRET production
echo    vercel env add RESEND_API_KEY production
echo    vercel env add NEXT_PUBLIC_SITE_URL production
echo    vercel env add ADMIN_NOTIFY_EMAILS production
echo.
set /p ENV_OK="[?] ¿Ya tienes las variables configuradas en Vercel? (s/n): "
if /i "%ENV_OK%"=="n" (
    echo.
    echo [INFO] Abriendo panel de Vercel en el browser para que las configures...
    start https://vercel.com/dashboard
    echo [INFO] Ve a tu proyecto > Settings > Environment Variables
    echo         Agrega todas las variables listadas arriba.
    echo         Cuando termines, vuelve aquí y presiona cualquier tecla.
    pause
)

:: ── 7. Deploy a producción ───────────────────────────────────
echo.
echo [INFO] Haciendo deploy a producción en Vercel...
vercel --prod
if %errorlevel% neq 0 (
    echo [ERROR] El deploy falló. Revisa los errores arriba.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  ¡Deploy completado exitosamente!
echo ========================================
echo.
echo  Recuerda verificar en producción:
echo   1. Que el sitio carga correctamente
echo   2. Que el login de admin funciona
echo   3. Que las imágenes se suben a Vercel Blob
echo   4. Que los correos de verificacion llegan
echo.
pause
