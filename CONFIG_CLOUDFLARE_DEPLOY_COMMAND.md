# 🔧 Configuration Deploy Command pour Cloudflare Pages

## ⚠️ Si le champ "Deploy command" est obligatoire

Si Cloudflare Pages exige une valeur pour "Deploy command", voici les options :

### Option 1 : Commande vide (recommandé)

Mettez simplement :
```
echo "Deploy complete"
```

Cette commande ne fait rien d'utile, mais satisfait l'exigence du champ.

### Option 2 : Laisser vide avec un espace

Essayez de mettre juste un **espace** ou un **point** :
```
.
```

### Option 3 : Commande qui ne fait rien

```
true
```

Cette commande réussit toujours sans rien faire.

## ✅ Configuration finale recommandée

Dans **Build configuration** :

- **Build command** : `npm run build`
- **Deploy command** : `echo "Deploy complete"` (ou `true`)
- **Root directory** : `/` (ou vide)

## 📝 Note importante

Cloudflare Pages déploie automatiquement les fichiers après le build. La "Deploy command" n'est généralement pas nécessaire pour Next.js standard.

Si vous utilisez des routes API (`/api/*`), Cloudflare Pages les gérera automatiquement après le build.

## 🔄 Après avoir configuré

1. **Sauvegardez** les modifications
2. **Redéployez** :
   - Allez dans **Deployments**
   - Cliquez sur les **3 points** à côté du dernier déploiement
   - Cliquez sur **Retry deployment**
