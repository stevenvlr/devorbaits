# 🚀 Guide simple : Déployer sur Cloudflare Pages (GRATUIT)

## ✅ Pourquoi Cloudflare Pages ?
- ✅ **100% GRATUIT** (même pour usage commercial)
- ✅ Simple à configurer
- ✅ Bande passante illimitée
- ✅ Compatible Next.js
- ✅ CDN global (rapide partout)

## 📋 Étapes (15 minutes)

### Étape 1 : Créer un compte (2 min)

1. Allez sur **https://dash.cloudflare.com/sign-up**
2. Créez un compte (gratuit)
3. Vérifiez votre email

### Étape 2 : Aller sur Pages (1 min)

1. Dans le dashboard Cloudflare, cliquez sur **Workers & Pages** (menu de gauche)
2. Cliquez sur **Pages**
3. Cliquez sur **Create a project**

### Étape 3 : Connecter GitHub (2 min)

1. Cliquez sur **Connect to Git**
2. Choisissez **GitHub**
3. Autorisez Cloudflare à accéder à votre compte GitHub
4. Sélectionnez votre repository : **devorbaits**

### Étape 4 : Configurer le projet (3 min)

Remplissez le formulaire :

- **Project name** : `devorbaits` (ou ce que vous voulez)
- **Production branch** : `main` (ou `master`)
- **Framework preset** : **Next.js** (Cloudflare le détecte automatiquement)
- **Build command** : `npm run build` (déjà rempli)
- **Build output directory** : `.next` (déjà rempli)
- **Root directory** : `/` (laissez vide)

Cliquez sur **Save and Deploy**

### Étape 5 : Ajouter les variables d'environnement (5 min)

**⚠️ IMPORTANT :** Faites-le pendant que le build tourne ou après.

1. Une fois le projet créé, allez dans **Settings** > **Environment variables**
2. Cliquez sur **Add variable** pour chaque variable

**Variables à ajouter (copiez depuis votre liste Netlify) :**

#### Supabase (2 variables)
- `NEXT_PUBLIC_SUPABASE_URL` = votre URL Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = votre clé Supabase

#### PayPal (4 variables)
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID` = votre Client ID PayPal
- `PAYPAL_SECRET` = votre Secret PayPal
- `NEXT_PUBLIC_PAYPAL_BASE_URL` = `https://api-m.paypal.com`
- `NEXT_PUBLIC_SITE_URL` = mettez d'abord `https://devorbaits.pages.dev` (vous changerez après)

#### Monetico (5 variables)
- `NEXT_PUBLIC_MONETICO_TPE` = votre TPE
- `NEXT_PUBLIC_MONETICO_KEY` = votre clé
- `MONETICO_CLE_SECRETE` = votre clé secrète HMAC-SHA1
- `NEXT_PUBLIC_MONETICO_URL` = `https://p.monetico-services.com`
- `NEXT_PUBLIC_MONETICO_MODE` = `TEST`

**Pour chaque variable :**
- Entrez le **Name** (ex: `NEXT_PUBLIC_SUPABASE_URL`)
- Entrez la **Value** (votre valeur)
- Sélectionnez **Production**, **Preview**, et **Development**
- Cliquez sur **Save**

### Étape 6 : Attendre le déploiement (3 min)

1. Allez dans l'onglet **Deployments**
2. Attendez que le build se termine (3-5 minutes)
3. Une fois terminé, votre site sera sur : `https://devorbaits.pages.dev` (ou le nom que vous avez choisi)

### Étape 7 : Mettre à jour NEXT_PUBLIC_SITE_URL (2 min)

1. Une fois déployé, copiez l'URL de votre site (ex: `https://devorbaits.pages.dev`)
2. Allez dans **Settings** > **Environment variables**
3. Trouvez `NEXT_PUBLIC_SITE_URL`
4. Cliquez sur **Edit**
5. Remplacez la valeur par votre vraie URL Cloudflare
6. Cliquez sur **Save**
7. Cloudflare redéploiera automatiquement

## ✅ C'est terminé !

Votre site est maintenant en ligne sur Cloudflare Pages, **gratuitement** et **autorisé pour usage commercial** !

## 🔍 Vérifier que ça fonctionne

1. Allez sur votre URL Cloudflare (ex: `https://devorbaits.pages.dev`)
2. Testez la page d'accueil
3. Testez la connexion (`/account/login`)
4. Testez l'espace admin (`/admin`)

## ⚠️ Si vous avez des erreurs

### Erreur de build :
- Vérifiez que toutes les variables d'environnement sont ajoutées
- Regardez les logs dans l'onglet **Deployments** > cliquez sur le déploiement > **View build log**

### Erreur de connexion :
- Vérifiez `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Vérifiez que `NEXT_PUBLIC_SITE_URL` pointe vers votre URL Cloudflare

### Erreur PayPal/Monetico :
- Vérifiez que toutes les variables sont bien configurées
- Vérifiez que `NEXT_PUBLIC_SITE_URL` est correct

## 📝 Checklist

- [ ] Compte Cloudflare créé
- [ ] Projet créé et connecté à GitHub
- [ ] Build réussi
- [ ] Toutes les variables d'environnement ajoutées
- [ ] `NEXT_PUBLIC_SITE_URL` mis à jour avec l'URL Cloudflare
- [ ] Site accessible et fonctionnel
- [ ] Test de la connexion réussi
- [ ] Test de l'espace admin réussi

## 💡 Astuce

Cloudflare Pages redéploie automatiquement à chaque push sur GitHub. Vous n'avez rien à faire, c'est automatique !

## 🎉 Félicitations !

Votre site est maintenant en ligne, **gratuitement** et **autorisé pour usage commercial** sur Cloudflare Pages !
