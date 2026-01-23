# 🔐 Configurer les Secrets dans Cloudflare Dashboard

## ✅ Variables à ajouter dans Cloudflare Dashboard (Type : Secret)

Maintenant que `wrangler.toml` contient les variables non sensibles, vous devez ajouter les **2 secrets** dans Cloudflare Dashboard.

## 📝 Étape par étape

### 1. Aller dans Cloudflare Pages

1. Allez sur **https://dash.cloudflare.com**
2. **Workers & Pages** > **Pages**
3. Cliquez sur votre projet **devorbaits**
4. Cliquez sur **Settings** (Paramètres)
5. Cliquez sur **Environment variables**

### 2. Ajouter le Secret PayPal

1. Cliquez sur **Add variable**
2. **Variable name** : `PAYPAL_SECRET`
   - ⚠️ **EXACTEMENT** comme ça (en majuscules, avec underscore)
3. **Type** : **Secret** (choisissez Secret, pas Plain text)
4. **Value** : Collez votre Secret PayPal de production
5. Cliquez sur **Save**

### 3. Ajouter le Secret Monetico

1. Cliquez sur **Add variable**
2. **Variable name** : `MONETICO_CLE_SECRETE`
   - ⚠️ **EXACTEMENT** comme ça (en majuscules, avec underscores)
   - ⚠️ **PAS** `NEXT_PUBLIC_MONETICO_CLE_SECRETE` (sans `NEXT_PUBLIC_`)
3. **Type** : **Secret** (choisissez Secret, pas Plain text)
4. **Value** : Collez votre clé secrète Monetico (HMAC-SHA1)
   - C'est la longue clé que vous avez mentionnée : `350f17639b866bc0109d0a782a1d361915fdc7dbe4b2a3b476a77b3bce3c87203af9edcf085c2ecf`
5. Cliquez sur **Save**

## ✅ Résumé des noms exacts

Dans Cloudflare Dashboard, ajoutez ces **2 variables en Secret** :

1. **Name** : `PAYPAL_SECRET`
   - **Type** : Secret
   - **Value** : Votre Secret PayPal de production

2. **Name** : `MONETICO_CLE_SECRETE`
   - **Type** : Secret
   - **Value** : Votre clé secrète Monetico (HMAC-SHA1)

## ⚠️ Important

- Les noms doivent être **EXACTEMENT** comme indiqué (majuscules, underscores)
- **PAS** de `NEXT_PUBLIC_` devant `MONETICO_CLE_SECRETE`
- Les deux doivent être en type **Secret** (pas Plain text)

## 📋 Code société Monetico

Si vous ne trouvez pas le code société Monetico (`NEXT_PUBLIC_MONETICO_SOCIETE`), j'ai mis une valeur vide dans `wrangler.toml`. 

**Où chercher le code société :**
- Dans votre espace Monetico, cherchez dans :
  - Paramètres du compte
  - Informations de facturation
  - Paramètres du TPE
  - Documentation Monetico
- Si vous ne le trouvez pas, laissez la valeur vide dans `wrangler.toml` (déjà fait)
- Le code société peut être optionnel selon votre configuration Monetico

## 🚀 Après configuration

1. **Commitez wrangler.toml** :
   ```bash
   git add wrangler.toml
   git commit -m "Configuration variables d'environnement dans wrangler.toml"
   git push
   ```

2. **Ajoutez les 2 secrets** dans Cloudflare Dashboard (voir ci-dessus)

3. **Redéployez** le site (automatique après le push)

## ✅ Checklist finale

- [ ] `wrangler.toml` contient toutes les variables non sensibles
- [ ] `PAYPAL_SECRET` ajouté dans Cloudflare Dashboard (Type : Secret)
- [ ] `MONETICO_CLE_SECRETE` ajouté dans Cloudflare Dashboard (Type : Secret)
- [ ] Toutes les variables sont configurées
- [ ] Site redéployé
