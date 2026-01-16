# 🚀 Guide de déploiement urgent - Vercel (GRATUIT)

## ⚡ Solution rapide : Migrer vers Vercel

Vercel est **gratuit** et a des limites plus généreuses que Netlify :
- ✅ 100 GB de bande passante (comme Netlify)
- ✅ **6000 minutes de build** (vs 300 pour Netlify) 🎉
- ✅ Fonctions serverless illimitées
- ✅ Déploiement automatique depuis GitHub

## 📋 Étapes de déploiement (15 minutes)

### Étape 1 : Créer un compte Vercel (2 min)

1. Allez sur https://vercel.com
2. Cliquez sur **Sign Up**
3. Choisissez **Continue with GitHub**
4. Autorisez Vercel à accéder à votre compte GitHub

### Étape 2 : Importer votre projet (3 min)

1. Dans le dashboard Vercel, cliquez sur **Add New** > **Project**
2. Sélectionnez votre repository GitHub (`devorbaits`)
3. Vercel détectera automatiquement que c'est un projet Next.js
4. Cliquez sur **Import**

### Étape 3 : Configurer les variables d'environnement (5 min)

1. Dans la page de configuration, allez dans **Environment Variables**
2. Ajoutez **TOUTES** les variables de votre fichier `LISTE_VARIABLES_ENVIRONNEMENT_NETLIFY.md` :

**Variables Supabase :**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Variables PayPal :**
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `PAYPAL_SECRET`
- `NEXT_PUBLIC_PAYPAL_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`

**Variables Monetico :**
- `NEXT_PUBLIC_MONETICO_TPE`
- `NEXT_PUBLIC_MONETICO_KEY`
- `MONETICO_CLE_SECRETE`
- `NEXT_PUBLIC_MONETICO_URL`
- `NEXT_PUBLIC_MONETICO_MODE`

**⚠️ IMPORTANT :**
- Pour `NEXT_PUBLIC_SITE_URL`, mettez l'URL Vercel qui sera générée (ex: `https://devorbaits.vercel.app`)
- Vous pourrez la changer après le déploiement

### Étape 4 : Configurer le build (2 min)

Vercel détecte automatiquement Next.js, mais vérifiez :
- **Framework Preset** : Next.js
- **Build Command** : `npm run build` (automatique)
- **Output Directory** : `.next` (automatique)
- **Install Command** : `npm install` (automatique)

### Étape 5 : Déployer (3 min)

1. Cliquez sur **Deploy**
2. Attendez 3-5 minutes
3. Votre site sera disponible sur `https://votre-projet.vercel.app`

### Étape 6 : Mettre à jour NEXT_PUBLIC_SITE_URL

1. Une fois déployé, copiez l'URL de votre site Vercel
2. Allez dans **Settings** > **Environment Variables**
3. Modifiez `NEXT_PUBLIC_SITE_URL` avec la nouvelle URL
4. Redéployez (Vercel redéploie automatiquement après modification des variables)

## 🔄 Alternative : Réactiver Netlify (si vous préférez)

### Option 1 : Mettre à niveau le plan (immédiat)

1. Allez sur https://app.netlify.com
2. Allez dans **Billing**
3. Cliquez sur **Upgrade to Pro**
4. Choisissez le plan **Pro** ($19/mois)
5. Votre site sera réactivé immédiatement

### Option 2 : Contacter le support Netlify

1. Allez sur https://app.netlify.com/support
2. Expliquez que vous avez besoin de déployer avant dimanche
3. Ils peuvent parfois augmenter temporairement les limites

## ⚙️ Configuration Vercel pour Next.js

Vercel détecte automatiquement Next.js, mais vous pouvez créer un fichier `vercel.json` si besoin :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["cdg1"]
}
```

**Note :** Ce fichier n'est généralement pas nécessaire, Vercel détecte tout automatiquement.

## 🔧 Différences Netlify vs Vercel

| Fonctionnalité | Netlify | Vercel |
|----------------|---------|--------|
| Build minutes (gratuit) | 300 min | **6000 min** 🎉 |
| Bandwidth (gratuit) | 100 GB | 100 GB |
| Functions (gratuit) | 1000 h | **Illimité** 🎉 |
| Déploiement auto | ✅ | ✅ |
| Variables d'env | ✅ | ✅ |

## 📝 Checklist de déploiement

- [ ] Compte Vercel créé
- [ ] Projet importé depuis GitHub
- [ ] Toutes les variables d'environnement ajoutées
- [ ] `NEXT_PUBLIC_SITE_URL` configuré avec l'URL Vercel
- [ ] Déploiement réussi
- [ ] Site accessible et fonctionnel
- [ ] Test de la connexion/login
- [ ] Test de l'espace admin
- [ ] Test du checkout

## 🚨 Si vous avez des erreurs

### Erreur de build :
- Vérifiez les variables d'environnement
- Regardez les logs de build dans Vercel
- Vérifiez que `package.json` a tous les scripts nécessaires

### Erreur de connexion Supabase :
- Vérifiez `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Vérifiez que les clés sont correctes

### Erreur PayPal/Monetico :
- Vérifiez que `NEXT_PUBLIC_SITE_URL` pointe vers l'URL Vercel
- Vérifiez toutes les variables d'environnement

## 💡 Recommandation

**Pour un déploiement avant dimanche :**
1. ✅ **Vercel** est la solution la plus rapide (gratuit, plus de limites)
2. ⚠️ **Netlify Pro** si vous préférez rester sur Netlify ($19/mois)

## 🎯 Action immédiate

1. **Créez un compte Vercel** (2 min)
2. **Importez votre projet** (3 min)
3. **Ajoutez les variables d'environnement** (5 min)
4. **Déployez** (3 min)

**Total : ~15 minutes pour avoir votre site en ligne !**
