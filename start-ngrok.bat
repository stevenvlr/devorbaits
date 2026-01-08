@echo off
echo ========================================
echo   Demarrage Next.js + ngrok
echo ========================================
echo.

REM Vérifier si Node.js est installé
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe
    pause
    exit /b 1
)

REM Vérifier si ngrok est installé
where ngrok >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] ngrok n'est pas installe
    echo Telechargez-le depuis https://ngrok.com/download
    pause
    exit /b 1
)

echo [1/2] Demarrage du serveur Next.js...
start "Next.js Server" cmd /k "npm run dev"

REM Attendre que le serveur démarre
timeout /t 5 /nobreak >nul

echo [2/2] Demarrage de ngrok...
start "ngrok" cmd /k "ngrok http 3000"

REM Attendre que ngrok démarre
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Serveurs demarres !
echo ========================================
echo.
echo URL locale : http://localhost:3000
echo Interface ngrok : http://localhost:4040
echo.
echo Ouvrez http://localhost:4040 pour voir l'URL publique ngrok
echo.
pause



