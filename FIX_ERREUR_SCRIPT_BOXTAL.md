# 🔧 Résoudre l'erreur "Impossible de charger le script Boxtal"

## ❌ Problème

Vous voyez l'erreur : **"Impossible de charger le script Boxtal"**

Cela signifie que le script JavaScript Boxtal ne peut pas être chargé depuis l'URL configurée.

## ✅ Solutions à essayer

### Solution 1 : Tester différentes URLs

J'ai mis à jour `wrangler.toml` avec une URL alternative (unpkg au lieu de jsDelivr). 

**Commitez et poussez** :
```bash
git add wrangler.toml
git commit -m "Test URL alternative pour script Boxtal"
git push
```

### Solution 2 : Si ça ne fonctionne toujours pas

Essayez ces autres URLs dans `wrangler.toml` :

**Option A (jsDelivr avec index.umd.js)** :
```toml
NEXT_PUBLIC_BOXTAL_MAP_SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/@boxtal/parcel-point-map@0.0.7/dist/index.umd.js"
```

**Option B (unpkg avec index.js)** :
```toml
NEXT_PUBLIC_BOXTAL_MAP_SCRIPT_SRC = "https://unpkg.com/@boxtal/parcel-point-map@0.0.7/dist/index.js"
```

**Option C (jsDelivr avec index.js)** :
```toml
NEXT_PUBLIC_BOXTAL_MAP_SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/@boxtal/parcel-point-map@0.0.7/dist/index.js"
```

### Solution 3 : Vérifier dans la console du navigateur

1. Ouvrez votre site : `https://6b67fd8b.devorbaits.pages.dev`
2. Ouvrez la console du navigateur (F12)
3. Allez sur la page checkout et sélectionnez Chronopost
4. Regardez les erreurs dans la console
5. Cherchez des messages comme :
   - "Failed to load resource"
   - "404 Not Found"
   - "CORS error"
   - L'URL exacte qui échoue

### Solution 4 : Contacter Boxtal

Si aucune URL CDN ne fonctionne, il se peut que :
- Boxtal ne fournisse pas de CDN public
- Vous ayez besoin d'une URL spécifique depuis votre compte Boxtal
- Vous deviez utiliser le package npm directement dans votre build

**Contactez le support Boxtal** pour obtenir :
- L'URL officielle du script JavaScript
- Ou les instructions pour intégrer le package npm

## 🔍 Diagnostic

Pour diagnostiquer le problème :

1. **Vérifiez que la variable est bien chargée** :
   - Ouvrez la console du navigateur
   - Tapez : `process.env.NEXT_PUBLIC_BOXTAL_MAP_SCRIPT_SRC`
   - Vous devriez voir l'URL

2. **Vérifiez que le script se charge** :
   - Dans la console, regardez l'onglet "Network" (Réseau)
   - Filtrez par "JS"
   - Cherchez une requête vers "boxtal" ou "parcel-point-map"
   - Voyez si elle échoue (404, CORS, etc.)

3. **Vérifiez les logs Cloudflare** :
   - Allez dans Cloudflare Pages > Deployments
   - Regardez les logs du dernier déploiement
   - Cherchez des erreurs liées à Boxtal

## ⚠️ Alternative : Désactiver temporairement Boxtal

Si vous ne trouvez pas l'URL correcte et que vous avez besoin que le site fonctionne rapidement, vous pouvez :

1. **Utiliser uniquement le widget Chronopost** (sans Boxtal)
2. **Ou utiliser la recherche manuelle** de points relais

Le code supporte déjà plusieurs méthodes de recherche de points relais Chronopost.

## 📝 Note

Le package `@boxtal/parcel-point-map` est disponible sur npm, mais il n'y a pas d'URL CDN officielle documentée. Les URLs que j'ai testées sont des suppositions basées sur la structure standard des packages npm.

Si vous avez accès à votre compte Boxtal, vérifiez la documentation développeur pour l'URL exacte du script.
