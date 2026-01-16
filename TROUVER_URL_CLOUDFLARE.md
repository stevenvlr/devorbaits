# 🔗 Comment trouver l'URL de votre site Cloudflare Pages

## 📍 Où trouver l'URL

### Méthode 1 : Dans le dashboard Cloudflare Pages

1. **Allez sur https://dash.cloudflare.com**
2. **Cliquez sur "Workers & Pages"** (menu de gauche)
3. **Cliquez sur "Pages"**
4. **Cliquez sur votre projet** (ex: `devorbaits`)
5. **L'URL s'affiche en haut de la page**, généralement sous cette forme :
   - `https://devorbaits.pages.dev`
   - Ou `https://votre-projet.pages.dev`

### Méthode 2 : Dans l'onglet Deployments

1. **Allez dans votre projet Cloudflare Pages**
2. **Cliquez sur l'onglet "Deployments"**
3. **Cliquez sur le dernier déploiement** (celui qui a réussi)
4. **L'URL s'affiche en haut**, généralement :
   - `https://devorbaits.pages.dev`
   - Ou un bouton "Visit site" / "Visiter le site"

### Méthode 3 : Dans les paramètres

1. **Allez dans votre projet Cloudflare Pages**
2. **Cliquez sur "Settings"** (Paramètres)
3. **Allez dans "Custom domains"** (Domaines personnalisés) ou **"General"** (Général)
4. **L'URL Cloudflare Pages s'affiche**, généralement :
   - `https://devorbaits.pages.dev`

## 🔍 Format de l'URL

L'URL Cloudflare Pages suit généralement ce format :
```
https://[nom-du-projet].pages.dev
```

Par exemple :
- `https://devorbaits.pages.dev`
- `https://boutique-peche-carpe.pages.dev`
- `https://votre-projet.pages.dev`

## ⚠️ Important : Mettre à jour NEXT_PUBLIC_SITE_URL

Une fois que vous avez trouvé votre URL Cloudflare :

1. **Copiez l'URL complète** (ex: `https://devorbaits.pages.dev`)
2. **Allez dans Settings > Environment variables**
3. **Trouvez `NEXT_PUBLIC_SITE_URL`**
4. **Modifiez-la** avec votre vraie URL Cloudflare
5. **Sauvegardez**
6. **Cloudflare redéploiera automatiquement**

## 📝 Exemple

Si votre URL Cloudflare est `https://devorbaits.pages.dev`, mettez :

- `NEXT_PUBLIC_SITE_URL` = `https://devorbaits.pages.dev`
- `NEXT_PUBLIC_MONETICO_URL_RETOUR` = `https://devorbaits.pages.dev/payment/success`
- `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR` = `https://devorbaits.pages.dev/payment/error`

## ✅ Vérifier que ça fonctionne

1. **Allez sur votre URL Cloudflare** (ex: `https://devorbaits.pages.dev`)
2. **Testez la page d'accueil**
3. **Testez la connexion** (`/account/login`)
4. **Testez l'espace admin** (`/admin`)
