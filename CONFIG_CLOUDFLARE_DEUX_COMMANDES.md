# 🔧 Configuration des deux commandes de déploiement Cloudflare

## 📋 Les deux champs

Cloudflare Pages a deux champs pour les commandes de déploiement :

1. **Deploy command** (pour la branche de production, ex: `main`)
2. **Non-production branch deploy command** (pour les autres branches, ex: `develop`, `staging`)

## ✅ Configuration recommandée

### Pour "Deploy command" (production)
Mettez :
```
echo "Deploy complete"
```

Ou :
```
true
```

### Pour "Non-production branch deploy command" (autres branches)
Mettez la **même chose** :
```
echo "Deploy complete"
```

Ou :
```
true
```

## 📝 Configuration complète

Dans **Build configuration**, vous devez avoir :

- **Build command** : `npm run build`
- **Deploy command** : `echo "Deploy complete"` (ou `true`)
- **Non-production branch deploy command** : `echo "Deploy complete"` (ou `true`)
- **Root directory** : `/` (ou vide)

## ⚠️ Note importante

Ces commandes ne font rien d'utile, mais satisfont l'exigence de Cloudflare Pages. Cloudflare Pages déploie automatiquement les fichiers après le build, donc ces commandes sont juste des "placeholders".

## 🔄 Après avoir configuré

1. **Sauvegardez** les modifications
2. **Redéployez** :
   - Allez dans **Deployments**
   - Cliquez sur les **3 points** à côté du dernier déploiement
   - Cliquez sur **Retry deployment**

## ✅ C'est tout !

Une fois configuré, votre site devrait se déployer correctement sur Cloudflare Pages.
