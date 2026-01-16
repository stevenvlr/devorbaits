# 📋 Liste complète des variables d'environnement pour Netlify

## ✅ Variables OBLIGATOIRES

### 🔵 Supabase (2 variables)

1. **`NEXT_PUBLIC_SUPABASE_URL`**
   - **Valeur** : `https://votre-projet.supabase.co`
   - **Où trouver** : [app.supabase.com](https://app.supabase.com) → Votre projet → Settings → API → Project URL

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - **Valeur** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (commence par `eyJ`)
   - **Où trouver** : [app.supabase.com](https://app.supabase.com) → Votre projet → Settings → API → anon public key

---

## 💳 Variables PAYPAL (4 variables)

3. **`NEXT_PUBLIC_PAYPAL_CLIENT_ID`**
   - **✅ VALEUR POUR PRODUCTION** : Votre Client ID PayPal de PRODUCTION (commence par `A...`)
   - ⚠️ **IMPORTANT** : Utilisez les identifiants de PRODUCTION (Live), pas ceux de test (Sandbox)
   - **Où trouver** : [developer.paypal.com](https://developer.paypal.com) → Dashboard → My Apps & Credentials → Créez une app en mode **Live**

4. **`PAYPAL_SECRET`**
   - **✅ VALEUR POUR PRODUCTION** : Votre Secret PayPal de PRODUCTION
   - ⚠️ **IMPORTANT** : Ne commence PAS par `NEXT_PUBLIC_`
   - ⚠️ **IMPORTANT** : Utilisez le Secret de PRODUCTION (Live), pas celui de test
   - **Où trouver** : [developer.paypal.com](https://developer.paypal.com) → Dashboard → My Apps & Credentials → Votre app Live → Show Secret

5. **`NEXT_PUBLIC_PAYPAL_BASE_URL`**
   - **✅ VALEUR POUR PRODUCTION** : `https://api-m.paypal.com`
   - **Valeur pour TEST** : `https://api-m.sandbox.paypal.com`
   - ⚠️ **IMPORTANT** : Ce n'est PAS quelque chose à récupérer, c'est une URL fixe à taper manuellement
   - ⚠️ **IMPORTANT** : Pour la production, utilisez `https://api-m.paypal.com` (sans "sandbox")

6. **`NEXT_PUBLIC_SITE_URL`**
   - **✅ VOTRE VALEUR** : `https://devorbaits.netlify.app`
   - **Où trouver** : 
     1. Après avoir déployé votre site sur Netlify
     2. Allez dans votre dashboard Netlify
     3. Cliquez sur votre site
     4. L'URL s'affiche en haut
   - ⚠️ Si vous changez de nom de domaine plus tard, mettez à jour cette variable

---

## 💰 Variables MONETICO (5 variables) - MODE TEST

7. **`NEXT_PUBLIC_MONETICO_TPE`**
   - **✅ VALEUR POUR TEST** : Votre numéro de TPE Monetico de TEST
   - ⚠️ **IMPORTANT** : Utilisez les identifiants de TEST (pas ceux de production)
   - **Où trouver** : Votre compte Monetico → Section Test/Sandbox

8. **`NEXT_PUBLIC_MONETICO_SOCIETE`**
   - **✅ VALEUR POUR TEST** : Votre code société Monetico de TEST
   - ⚠️ **IMPORTANT** : Utilisez le code société de TEST (pas celui de production)
   - **Où trouver** : Votre compte Monetico → Section Test/Sandbox

9. **`NEXT_PUBLIC_MONETICO_URL_RETOUR`**
   - **✅ VOTRE VALEUR** : `https://devorbaits.netlify.app/payment/success`
   - ⚠️ Même URL pour test et production

10. **`NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR`**
    - **✅ VOTRE VALEUR** : `https://devorbaits.netlify.app/payment/error`
    - ⚠️ Même URL pour test et production

11. **`MONETICO_CLE_SECRETE`**
    - **✅ VALEUR POUR TEST** : Votre clé secrète Monetico de TEST (clé HMAC-SHA1)
    - ⚠️ **IMPORTANT** : Ne commence PAS par `NEXT_PUBLIC_`
    - ⚠️ **IMPORTANT** : Utilisez la clé secrète de TEST (pas celle de production)
    - ⚠️ **C'EST ICI** : C'est dans cette variable que vous mettez votre clé HMAC-SHA1
    - **Où trouver** : Votre compte Monetico → Section Test/Sandbox → Clé secrète (HMAC-SHA1)

12. **`NEXT_PUBLIC_MONETICO_URL`** (optionnelle)
    - **Valeur** : `https://paiement.monetico.fr/paiement.cgi`
    - ⚠️ Généralement la même URL pour test et production
    - Généralement cette valeur par défaut fonctionne

---

## 🧪 Variable de TEST (optionnelle - pour tester sans paiement)

13. **`NEXT_PUBLIC_TEST_PAYMENT`**
    - **Valeur pour TEST** : `true`
    - **Valeur pour PRODUCTION** : `false` ou supprimez la variable
    - ⚠️ **IMPORTANT** : Ne laissez JAMAIS `true` en production !

---

## 📝 Résumé rapide

### Variables à ajouter dans Netlify :

```
✅ OBLIGATOIRES :
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_PAYPAL_CLIENT_ID
- PAYPAL_SECRET
- NEXT_PUBLIC_PAYPAL_BASE_URL
- NEXT_PUBLIC_SITE_URL
- NEXT_PUBLIC_MONETICO_TPE
- NEXT_PUBLIC_MONETICO_SOCIETE
- NEXT_PUBLIC_MONETICO_URL_RETOUR
- NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR
- MONETICO_CLE_SECRETE

📦 OPTIONNELLES :
- NEXT_PUBLIC_MONETICO_URL
- NEXT_PUBLIC_TEST_PAYMENT (pour tester uniquement)
```

---

## ⚠️ Notes importantes

1. **Variables avec `NEXT_PUBLIC_`** : Accessibles côté client (navigateur)
2. **Variables SANS `NEXT_PUBLIC_`** : Uniquement côté serveur (sécurisées)
   - `PAYPAL_SECRET`
   - `MONETICO_CLE_SECRETE`

3. **Après avoir ajouté les variables** :
   - Redéployez votre site dans Netlify
   - Les variables ne sont pas prises en compte tant que vous n'avez pas redéployé

4. **URLs à mettre à jour** :
   - Une fois que vous avez votre URL Netlify, mettez à jour :
     - `NEXT_PUBLIC_SITE_URL`
     - `NEXT_PUBLIC_MONETICO_URL_RETOUR`
     - `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR`

---

## 🔄 Ordre recommandé d'ajout

1. **D'abord** : Supabase (2 variables)
2. **Ensuite** : PayPal (4 variables)
3. **Puis** : Monetico (5-6 variables)
4. **Enfin** : Variable de test si nécessaire

---

## ✅ Checklist avant déploiement

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurée
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurée
- [ ] `NEXT_PUBLIC_PAYPAL_CLIENT_ID` configurée
- [ ] `PAYPAL_SECRET` configurée (sans `NEXT_PUBLIC_`)
- [ ] `NEXT_PUBLIC_PAYPAL_BASE_URL` configurée
- [ ] `NEXT_PUBLIC_SITE_URL` configurée avec l'URL Netlify
- [ ] `NEXT_PUBLIC_MONETICO_TPE` configurée
- [ ] `NEXT_PUBLIC_MONETICO_SOCIETE` configurée
- [ ] `NEXT_PUBLIC_MONETICO_URL_RETOUR` configurée
- [ ] `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR` configurée
- [ ] `MONETICO_CLE_SECRETE` configurée (sans `NEXT_PUBLIC_`)
- [ ] `NEXT_PUBLIC_TEST_PAYMENT` = `false` ou supprimée (en production)
