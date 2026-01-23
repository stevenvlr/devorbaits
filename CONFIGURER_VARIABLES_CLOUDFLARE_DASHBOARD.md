# ✅ Configurer les variables uniquement via Cloudflare Dashboard

## 🎯 Objectif

Gérer toutes les variables d'environnement via le Dashboard Cloudflare Pages, sans les mettre dans le code.

## ✅ Solution : Supprimer wrangler.toml

J'ai supprimé le fichier `wrangler.toml` pour que vous puissiez gérer toutes les variables via le Dashboard.

## 📝 Configuration du Build Output Directory

Maintenant que `wrangler.toml` est supprimé, vous devez configurer le **Build output directory** dans l'interface Cloudflare Pages :

### Étape 1 : Aller dans les paramètres

1. Allez sur **https://dash.cloudflare.com**
2. **Workers & Pages** > **Pages**
3. Cliquez sur votre projet **devorbaits**
4. Cliquez sur **Settings** (Paramètres)
5. Cliquez sur **Builds & deployments** (ou **Build configuration**)

### Étape 2 : Configurer le Build output directory

1. Cherchez le champ **"Build output directory"** ou **"Output directory"**
2. Mettez la valeur : **`.vercel/output/static`**
   - ⚠️ C'est la valeur pour `@cloudflare/next-on-pages`
   - Si vous n'utilisez pas `@cloudflare/next-on-pages`, mettez **`.next`**
3. Sauvegardez

## 🔧 Ajouter les variables d'environnement

Maintenant que `wrangler.toml` est supprimé, vous pouvez ajouter **TOUTES** les variables (Plain text ET Secret) via le Dashboard :

### Étape 1 : Aller dans Environment variables

1. Dans **Settings**, cliquez sur **Environment variables**

### Étape 2 : Ajouter les variables Plain text

Pour chaque variable, cliquez sur **Add variable** :

#### Variables Supabase (Plain text)
- **Name** : `NEXT_PUBLIC_SUPABASE_URL`
- **Type** : **Plain text**
- **Value** : Votre URL Supabase

- **Name** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Type** : **Plain text**
- **Value** : Votre clé Supabase

#### Variables PayPal (Plain text)
- **Name** : `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- **Type** : **Plain text**
- **Value** : Votre Client ID PayPal

- **Name** : `NEXT_PUBLIC_PAYPAL_BASE_URL`
- **Type** : **Plain text**
- **Value** : `https://api-m.paypal.com`

- **Name** : `NEXT_PUBLIC_SITE_URL`
- **Type** : **Plain text**
- **Value** : `https://6b67fd8b.devorbaits.pages.dev`

#### Variables Monetico (Plain text)
- **Name** : `NEXT_PUBLIC_MONETICO_TPE`
- **Type** : **Plain text**
- **Value** : Votre numéro TPE

- **Name** : `NEXT_PUBLIC_MONETICO_KEY`
- **Type** : **Plain text**
- **Value** : Votre clé Monetico

- **Name** : `NEXT_PUBLIC_MONETICO_SOCIETE`
- **Type** : **Plain text**
- **Value** : Votre code société

- **Name** : `NEXT_PUBLIC_MONETICO_URL`
- **Type** : **Plain text**
- **Value** : `https://paiement.monetico.fr/paiement.cgi`

- **Name** : `NEXT_PUBLIC_MONETICO_URL_RETOUR`
- **Type** : **Plain text**
- **Value** : `https://6b67fd8b.devorbaits.pages.dev/payment/success`

- **Name** : `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR`
- **Type** : **Plain text**
- **Value** : `https://6b67fd8b.devorbaits.pages.dev/payment/error`

### Étape 3 : Ajouter les variables Secret

#### Variables Secret (2)
- **Name** : `PAYPAL_SECRET`
- **Type** : **Secret**
- **Value** : Votre Secret PayPal

- **Name** : `MONETICO_CLE_SECRETE`
- **Type** : **Secret**
- **Value** : Votre clé secrète Monetico

## ✅ Liste complète (13 variables)

### Plain text (11)
1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
4. `NEXT_PUBLIC_PAYPAL_BASE_URL`
5. `NEXT_PUBLIC_SITE_URL`
6. `NEXT_PUBLIC_MONETICO_TPE`
7. `NEXT_PUBLIC_MONETICO_KEY`
8. `NEXT_PUBLIC_MONETICO_SOCIETE`
9. `NEXT_PUBLIC_MONETICO_URL`
10. `NEXT_PUBLIC_MONETICO_URL_RETOUR`
11. `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR`

### Secret (2)
12. `PAYPAL_SECRET`
13. `MONETICO_CLE_SECRETE`

## 🚀 Après configuration

1. **Commitez la suppression de wrangler.toml** :
   ```bash
   git add .
   git commit -m "Suppression wrangler.toml - variables gérées via Dashboard"
   git push
   ```

2. **Configurez le Build output directory** dans Cloudflare Pages (voir étape 2 ci-dessus)

3. **Ajoutez toutes les variables** via le Dashboard (voir étapes 2 et 3 ci-dessus)

4. **Redéployez** le site (automatique après le push, ou manuellement)

## ⚠️ Important

Si le champ "Build output directory" n'existe pas dans l'interface Cloudflare Pages, vous devrez peut-être recréer `wrangler.toml` avec seulement `pages_build_output_dir`, mais sans section `[vars]`. Dans ce cas, dites-moi et je vous aiderai.
