# ⚠️ Variables manquantes pour Cloudflare Pages

## ✅ Variables que vous avez (9/13)

- ✅ `MONETICO_CLE_SECRETE` (Secret)
- ✅ `NEXT_PUBLIC_MONETICO_KEY` (Plaintext)
- ✅ `NEXT_PUBLIC_MONETICO_TPE` (Plaintext)
- ✅ `NEXT_PUBLIC_PAYPAL_BASE_URL` (Plaintext)
- ✅ `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (Plaintext)
- ✅ `NEXT_PUBLIC_SITE_URL` (Plaintext)
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Plaintext)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` (Plaintext)
- ✅ `PAYPAL_SECRET` (Secret)

## ❌ Variables manquantes (4 variables)

### 1. `NEXT_PUBLIC_MONETICO_SOCIETE` (OBLIGATOIRE)

**Type :** Plaintext  
**Valeur :** Votre code société Monetico de TEST  
**Où trouver :** Votre compte Monetico → Section Test/Sandbox → Code société

---

### 2. `NEXT_PUBLIC_MONETICO_URL_RETOUR` (OBLIGATOIRE)

**Type :** Plaintext  
**Valeur :** `https://devorbaits.pages.dev/payment/success`  
**⚠️ IMPORTANT :** Utilisez votre URL Cloudflare Pages (pas Netlify)

---

### 3. `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR` (OBLIGATOIRE)

**Type :** Plaintext  
**Valeur :** `https://devorbaits.pages.dev/payment/error`  
**⚠️ IMPORTANT :** Utilisez votre URL Cloudflare Pages (pas Netlify)

---

### 4. `NEXT_PUBLIC_MONETICO_URL` (OPTIONNEL mais recommandé)

**Type :** Plaintext  
**Valeur :** `https://paiement.monetico.fr/paiement.cgi`  
**Note :** Cette valeur par défaut fonctionne généralement, mais il vaut mieux l'ajouter explicitement.

---

## 📝 Liste complète à ajouter

Ajoutez ces 4 variables dans Cloudflare Pages :

1. **Name :** `NEXT_PUBLIC_MONETICO_SOCIETE`  
   **Type :** Plaintext  
   **Value :** Votre code société Monetico

2. **Name :** `NEXT_PUBLIC_MONETICO_URL_RETOUR`  
   **Type :** Plaintext  
   **Value :** `https://devorbaits.pages.dev/payment/success`

3. **Name :** `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR`  
   **Type :** Plaintext  
   **Value :** `https://devorbaits.pages.dev/payment/error`

4. **Name :** `NEXT_PUBLIC_MONETICO_URL`  
   **Type :** Plaintext  
   **Value :** `https://paiement.monetico.fr/paiement.cgi`

---

## ⚠️ Note importante

Pour les variables `NEXT_PUBLIC_MONETICO_URL_RETOUR` et `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR`, utilisez votre **URL Cloudflare Pages** (pas l'URL Netlify).

Si votre URL Cloudflare est différente de `devorbaits.pages.dev`, remplacez-la dans ces variables.

---

## ✅ Après avoir ajouté les variables

1. Cloudflare redéploiera automatiquement
2. Attendez que le build se termine
3. Testez le paiement Monetico
