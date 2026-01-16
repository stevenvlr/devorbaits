# 🔗 Trouver l'URL quand le déploiement est actif

## ✅ Si le déploiement est actif/réussi

L'URL de votre site devrait être visible. Voici où la trouver :

### Méthode 1 : Dans l'onglet Deployments (le plus simple)

1. **Allez dans votre projet Cloudflare Pages**
2. **Cliquez sur l'onglet "Deployments"**
3. **Cliquez sur le déploiement actif** (celui qui est vert/réussi)
4. **L'URL s'affiche en haut de la page**, généralement :
   - Un bouton **"Visit site"** / **"Visiter le site"**
   - Ou directement l'URL : `https://devorbaits.pages.dev`
   - Ou `https://votre-projet.pages.dev`

### Méthode 2 : En haut de la page du projet

1. **Allez dans votre projet Cloudflare Pages**
2. **En haut de la page**, vous devriez voir :
   - L'URL de votre site (ex: `https://devorbaits.pages.dev`)
   - Ou un bouton pour visiter le site

### Méthode 3 : Dans les paramètres

1. **Allez dans Settings > General**
2. **Cherchez "Production deployment"** ou **"Custom domains"**
3. **L'URL Cloudflare Pages s'affiche**, généralement :
   - `https://devorbaits.pages.dev`

## 🔍 Format de l'URL

L'URL Cloudflare Pages suit généralement ce format :
```
https://[nom-du-projet].pages.dev
```

Le nom du projet est celui que vous avez choisi lors de la création (ex: `devorbaits`).

## ⚠️ Si vous ne voyez toujours pas l'URL

### Vérifiez que le déploiement est vraiment réussi :

1. **Allez dans Deployments**
2. **Regardez le statut** :
   - ✅ **Vert** = Réussi → L'URL devrait être visible
   - ❌ **Rouge** = Échoué → Il faut corriger l'erreur
   - 🟡 **Jaune/Orange** = En cours → Attendez qu'il se termine

### Si le déploiement est encore en cours :

**Attendez** 1-2 minutes supplémentaires. Une fois terminé, l'URL apparaîtra automatiquement.

## 📝 Une fois que vous avez l'URL

1. **Copiez l'URL complète** (ex: `https://devorbaits.pages.dev`)
2. **Allez dans Settings > Environment variables**
3. **Trouvez `NEXT_PUBLIC_SITE_URL`**
4. **Modifiez-la** avec votre vraie URL Cloudflare
5. **Sauvegardez**
6. **Cloudflare redéploiera automatiquement**

## ✅ Testez votre site

Une fois que vous avez l'URL :

1. **Allez sur votre URL** (ex: `https://devorbaits.pages.dev`)
2. **Testez la page d'accueil**
3. **Testez la connexion** (`/account/login`)
4. **Testez l'espace admin** (`/admin`)
