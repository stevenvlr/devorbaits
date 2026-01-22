# 🚀 Guide de déploiement Cloudflare Pages

## ✅ Modifications effectuées

1. ✅ **Activation du paiement en 4 fois PayPal** dans `components/PayPalButton.tsx`
2. ✅ **Mise à jour de la description** dans `app/checkout/page.tsx`
3. ✅ **Configuration du script de build** pour `@cloudflare/next-on-pages`

## 📋 Étapes pour déployer sur Cloudflare Pages

### Étape 1 : Commiter et pousser les modifications

```bash
git add .
git commit -m "feat: Ajout paiement en 4 fois PayPal + configuration Cloudflare"
git push origin main
```

### Étape 2 : Configurer Cloudflare Pages

1. **Allez sur https://dash.cloudflare.com**
2. **Cliquez sur "Workers & Pages"** (menu de gauche)
3. **Cliquez sur "Pages"**
4. **Cliquez sur votre projet** (devorbaits) ou **Create a project** si nouveau

### Étape 3 : Configurer le build (IMPORTANT)

Dans **Settings** > **Builds & deployments** :

- **Build command** : `npm run pages:build`
- **Build output directory** : `.vercel/output/static`
- **Deploy command** : **LAISSER VIDE** (rien du tout)
- **Root directory** : `/` (ou vide)

### Étape 4 : Vérifier les variables d'environnement

Dans **Settings** > **Environment variables**, vérifiez que toutes les variables sont présentes :

#### Variables sensibles (à ajouter dans Cloudflare Dashboard) :
- `PAYPAL_SECRET` (votre secret PayPal)
- `MONETICO_CLE_SECRETE` (votre clé secrète Monetico)

#### Variables déjà dans wrangler.toml (non sensibles) :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `NEXT_PUBLIC_PAYPAL_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_MONETICO_TPE`
- `NEXT_PUBLIC_MONETICO_KEY`
- `MONETICO_SOCIETE`
- `NEXT_PUBLIC_MONETICO_SOCIETE`
- `NEXT_PUBLIC_MONETICO_URL`
- `NEXT_PUBLIC_MONETICO_URL_RETOUR`
- `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR`

### Étape 5 : Déployer

1. **Si le projet existe déjà** : Cloudflare Pages redéploiera automatiquement après le push
2. **Si nouveau projet** : Cliquez sur **Save and Deploy**

### Étape 6 : Attendre le déploiement

1. Allez dans l'onglet **Deployments**
2. Attendez que le build se termine (3-5 minutes)
3. Une fois terminé, votre site sera accessible sur : `https://devorbaits.pages.dev` (ou votre URL)

## ✅ Vérifications après déploiement

1. ✅ **Page d'accueil** accessible
2. ✅ **Paiement PayPal** fonctionne avec option "Pay in 4"
3. ✅ **Routes API** fonctionnelles
4. ✅ **Connexion utilisateur** fonctionne

## 🔧 Configuration actuelle

### Fichiers modifiés :
- ✅ `components/PayPalButton.tsx` - Paiement en 4 fois activé
- ✅ `app/checkout/page.tsx` - Description mise à jour
- ✅ `package.json` - Script `pages:build` ajouté
- ✅ `wrangler.toml` - Configuration Cloudflare Pages

### Script de build :
```json
"pages:build": "npx @cloudflare/next-on-pages"
```

### Output directory :
```
.vercel/output/static
```

## ⚠️ Notes importantes

1. **Deploy command** doit être **VIDE** dans Cloudflare Pages
2. **Build command** doit être `npm run pages:build`
3. **Build output directory** doit être `.vercel/output/static`
4. Les variables sensibles (`PAYPAL_SECRET`, `MONETICO_CLE_SECRETE`) doivent être ajoutées dans Cloudflare Dashboard (pas dans wrangler.toml)

## 🎉 C'est terminé !

Votre site est maintenant déployé sur Cloudflare Pages avec le paiement en 4 fois PayPal activé !
