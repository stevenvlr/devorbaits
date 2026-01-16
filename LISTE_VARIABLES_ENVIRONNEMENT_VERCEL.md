# 📋 Liste des variables d'environnement pour Vercel

## ✅ Variables OBLIGATOIRES

### 🔵 Supabase (2 variables)

1. **`NEXT_PUBLIC_SUPABASE_URL`**
   - **Valeur** : `https://votre-projet.supabase.co`
   - **Où trouver** : [app.supabase.com](https://app.supabase.com) → Votre projet → Settings → API → Project URL

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - **Valeur** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (commence par `eyJ`)
   - **Où trouver** : [app.supabase.com](https://app.supabase.com) → Votre projet → Settings → API → anon public key

---

### 💳 Variables PAYPAL (4 variables)

3. **`NEXT_PUBLIC_PAYPAL_CLIENT_ID`**
   - **Valeur** : Votre Client ID PayPal de PRODUCTION (commence par `A...`)
   - **Où trouver** : [developer.paypal.com](https://developer.paypal.com) → Dashboard → My Apps & Credentials → Votre app Live

4. **`PAYPAL_SECRET`**
   - **Valeur** : Votre Secret PayPal de PRODUCTION
   - ⚠️ **IMPORTANT** : Ne commence PAS par `NEXT_PUBLIC_`
   - **Où trouver** : [developer.paypal.com](https://developer.paypal.com) → Dashboard → My Apps & Credentials → Votre app Live → Show Secret

5. **`NEXT_PUBLIC_PAYPAL_BASE_URL`**
   - **Valeur** : `https://api-m.paypal.com`
   - ⚠️ **IMPORTANT** : URL fixe pour la production

6. **`NEXT_PUBLIC_SITE_URL`**
   - **Valeur** : `https://votre-projet.vercel.app` (votre URL Vercel)
   - ⚠️ **IMPORTANT** : Mettez d'abord une URL temporaire, puis changez après le déploiement avec la vraie URL Vercel

---

### 💰 Variables MONETICO (5 variables) - MODE TEST

7. **`NEXT_PUBLIC_MONETICO_TPE`**
   - **Valeur** : Votre numéro de TPE Monetico de TEST
   - **Où trouver** : Votre compte Monetico → Paramètres → TPE de test

8. **`NEXT_PUBLIC_MONETICO_KEY`**
   - **Valeur** : Votre clé Monetico de TEST
   - **Où trouver** : Votre compte Monetico → Paramètres → Clé de test

9. **`MONETICO_CLE_SECRETE`**
   - **Valeur** : Votre clé HMAC-SHA1 (la longue chaîne de caractères)
   - ⚠️ **IMPORTANT** : Ne commence PAS par `NEXT_PUBLIC_`
   - **Où trouver** : Votre compte Monetico → Paramètres → Clé secrète HMAC-SHA1

10. **`NEXT_PUBLIC_MONETICO_URL`**
    - **Valeur** : `https://p.monetico-services.com` (pour TEST)
    - **Où trouver** : URL fixe fournie par Monetico

11. **`NEXT_PUBLIC_MONETICO_MODE`**
    - **Valeur** : `TEST`
    - **Où trouver** : Valeur fixe pour le mode test

---

## 📝 Comment ajouter les variables dans Vercel

1. Allez sur https://vercel.com
2. Sélectionnez votre projet
3. Allez dans **Settings** > **Environment Variables**
4. Pour chaque variable :
   - Cliquez sur **Add New**
   - Entrez le **Name** (ex: `NEXT_PUBLIC_SUPABASE_URL`)
   - Entrez la **Value** (votre valeur)
   - Sélectionnez **Production**, **Preview**, et **Development** (ou seulement Production)
   - Cliquez sur **Save**

## ⚠️ Notes importantes

- Les variables qui commencent par `NEXT_PUBLIC_` sont accessibles côté client
- Les variables SANS `NEXT_PUBLIC_` sont uniquement côté serveur (plus sécurisé)
- Après avoir ajouté/modifié des variables, Vercel redéploie automatiquement
- Vérifiez que toutes les variables sont bien ajoutées avant de tester le site

## 🔄 Après le premier déploiement

1. Une fois déployé, Vercel vous donnera une URL (ex: `https://devorbaits.vercel.app`)
2. Allez dans **Settings** > **Environment Variables**
3. Modifiez `NEXT_PUBLIC_SITE_URL` avec cette nouvelle URL
4. Vercel redéploiera automatiquement
