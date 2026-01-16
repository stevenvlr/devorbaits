# 🔧 Correction : Erreur de déploiement Cloudflare Pages

## ❌ Problème

Le build Next.js réussit, mais le déploiement échoue avec :
```
✘ [ERROR] Missing entry-point to Worker script or to assets directory
```

## ✅ Solution : Supprimer la commande de déploiement personnalisée

Cloudflare Pages essaie d'utiliser `wrangler deploy` qui est pour Cloudflare Workers, pas pour Next.js. Pour Next.js, Cloudflare Pages déploie automatiquement après le build.

### Étapes pour corriger :

1. **Allez dans votre projet Cloudflare Pages**
   - Dashboard Cloudflare > Workers & Pages > Pages
   - Cliquez sur votre projet

2. **Allez dans Settings** (Paramètres)

3. **Allez dans Builds & deployments** (Builds et déploiements)

4. **Cherchez "Deploy command"** (Commande de déploiement)

5. **Supprimez ou laissez vide** la commande de déploiement
   - Si vous voyez `npx wrangler deploy` ou quelque chose de similaire
   - **Supprimez-le complètement** ou laissez le champ vide
   - Cloudflare Pages déploiera automatiquement après le build

6. **Sauvegardez** les modifications

7. **Redéployez** :
   - Allez dans **Deployments**
   - Cliquez sur les **3 points** à côté du dernier déploiement
   - Cliquez sur **Retry deployment** (Réessayer le déploiement)

## 📋 Configuration correcte pour Next.js

Pour Next.js sur Cloudflare Pages, vous devez avoir :

- ✅ **Build command** : `npm run build`
- ✅ **Build output directory** : `.next`
- ✅ **Root directory** : `/` (vide)
- ✅ **Deploy command** : **VIDE** (pas de commande)

## ⚠️ Note importante

Cloudflare Pages déploie automatiquement les fichiers générés par Next.js après le build. Vous n'avez **PAS besoin** de commande de déploiement personnalisée.

## 🔄 Alternative : Si vous ne trouvez pas l'option

Si vous ne trouvez pas l'option "Deploy command" dans les paramètres :

1. **Supprimez le projet** et recréez-le
2. Lors de la création, **ne mettez PAS** de commande de déploiement
3. Laissez seulement :
   - Build command : `npm run build`
   - Build output directory : `.next`

## ✅ Après correction

Une fois la commande de déploiement supprimée, le déploiement devrait réussir et votre site sera en ligne !
