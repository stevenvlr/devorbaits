# 🎉 Site Prêt pour IONOS - Sans PrestaShop

## ✅ Ce qui a été fait

Votre site Next.js a été configuré pour être exporté en **site statique** et uploadé directement sur IONOS, **sans besoin de PrestaShop**.

## 🚀 Export Rapide

### Sur Windows :
Double-cliquez sur `export-ionos.bat`

### Sur Mac/Linux :
```bash
chmod +x export-ionos.sh
./export-ionos.sh
```

### Manuellement :
```bash
npm install
npm run export
```

Le site sera exporté dans le dossier `out/`

## 📤 Upload sur IONOS

1. **Ouvrez le dossier `out`** après l'export
2. **Uploadez TOUT le contenu** dans le dossier `httpdocs` ou `public_html` de votre hébergement IONOS
3. **C'est tout !** Votre site sera en ligne

📖 **Guide détaillé** : Consultez `GUIDE_EXPORT_IONOS.md` pour les instructions complètes

## ✨ Avantages

- ✅ **Pas de PrestaShop** - Site 100% statique
- ✅ **Rapide** - Chargement ultra rapide
- ✅ **Simple** - Pas de base de données à gérer
- ✅ **Sécurisé** - Pas de serveur backend à maintenir
- ✅ **Compatible IONOS** - Fonctionne sur tous les hébergements

## 📝 Notes importantes

- Les données (panier, produits) sont stockées dans le navigateur (localStorage)
- Chaque visiteur a son propre panier local
- Pour modifier les produits, utilisez la page `/admin` du site
- Le site fonctionne entièrement côté client

## 🔄 Mettre à jour le site

Quand vous voulez mettre à jour le site :

1. Modifiez le code
2. Relancez l'export (`npm run export` ou le script)
3. Uploadez les nouveaux fichiers sur IONOS

---

**Votre site est prêt ! 🎊**

