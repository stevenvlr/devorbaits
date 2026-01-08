#!/bin/bash

echo "========================================"
echo "  EXPORT DU SITE POUR IONOS"
echo "========================================"
echo ""

echo "[1/3] Installation des dépendances..."
npm install
if [ $? -ne 0 ]; then
    echo "ERREUR: Échec de l'installation des dépendances"
    exit 1
fi

echo ""
echo "[2/3] Export du site en statique..."
npm run export
if [ $? -ne 0 ]; then
    echo "ERREUR: Échec de l'export"
    exit 1
fi

echo ""
echo "[3/3] Copie du fichier .htaccess..."
if [ -f .htaccess ]; then
    cp .htaccess out/.htaccess
    echo "Fichier .htaccess copié dans le dossier out"
else
    echo "ATTENTION: Fichier .htaccess non trouvé"
fi

echo ""
echo "========================================"
echo "  EXPORT TERMINÉ AVEC SUCCÈS !"
echo "========================================"
echo ""
echo "Le site est prêt dans le dossier: out/"
echo ""
echo "PROCHAINES ÉTAPES:"
echo "1. Ouvrez le dossier 'out'"
echo "2. Uploadez TOUT le contenu sur IONOS"
echo "3. Consultez GUIDE_EXPORT_IONOS.md pour les détails"
echo ""

