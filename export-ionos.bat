@echo off
echo ========================================
echo   EXPORT DU SITE POUR IONOS
echo ========================================
echo.

echo [1/3] Installation des dependances...
call npm install
if errorlevel 1 (
    echo ERREUR: Echec de l'installation des dependances
    pause
    exit /b 1
)

echo.
echo [2/3] Export du site en statique...
call npm run export
if errorlevel 1 (
    echo ERREUR: Echec de l'export
    pause
    exit /b 1
)

echo.
echo [3/3] Copie du fichier .htaccess...
if exist .htaccess (
    copy .htaccess out\.htaccess >nul
    echo Fichier .htaccess copie dans le dossier out
) else (
    echo ATTENTION: Fichier .htaccess non trouve
)

echo.
echo ========================================
echo   EXPORT TERMINE AVEC SUCCES !
echo ========================================
echo.
echo Le site est pret dans le dossier: out\
echo.
echo PROCHAINES ETAPES:
echo 1. Ouvrez le dossier "out"
echo 2. Uploadez TOUT le contenu sur IONOS
echo 3. Consultez GUIDE_EXPORT_IONOS.md pour les details
echo.
pause

