# ✅ Vérification : Configuration Monetico Mode Test

## 🎯 Objectif

Vérifier que toute la configuration Monetico est correctement configurée pour le **mode test** sur Cloudflare.

---

## 📋 Checklist de vérification

### ✅ 1. Variables dans `wrangler.toml`

Vérifiez que votre fichier `wrangler.toml` contient ces variables :

```toml
# Monetico
NEXT_PUBLIC_MONETICO_TPE = "0917217"  # ✅ Votre TPE de TEST
NEXT_PUBLIC_MONETICO_KEY = "266032402DDAA6220573A5C5A523C114016926P6"  # ✅ Votre clé de TEST
NEXT_PUBLIC_MONETICO_SOCIETE = ""  # ✅ Peut être vide
NEXT_PUBLIC_MONETICO_URL = "https://p.monetico-services.com/test/paiement.cgi"  # ✅ URL de TEST
NEXT_PUBLIC_MONETICO_URL_RETOUR = "https://6b67fd8b.devorbaits.pages.dev/payment/success"  # ✅ Votre URL Cloudflare
NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR = "https://6b67fd8b.devorbaits.pages.dev/payment/error"  # ✅ Votre URL Cloudflare
```

**Vérifications :**
- [ ] `NEXT_PUBLIC_MONETICO_URL` = `https://p.monetico-services.com/test/paiement.cgi` (URL de TEST)
- [ ] `NEXT_PUBLIC_MONETICO_TPE` = Votre numéro de TPE de **TEST** (pas de production)
- [ ] `NEXT_PUBLIC_MONETICO_URL_RETOUR` = Votre URL Cloudflare Pages
- [ ] `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR` = Votre URL Cloudflare Pages

---

### ✅ 2. Secret dans Cloudflare Dashboard

**IMPORTANT** : La clé secrète Monetico doit être dans Cloudflare Dashboard (Type : Secret)

#### Étape 1 : Aller dans Cloudflare Dashboard

1. Allez sur **https://dash.cloudflare.com**
2. **Workers & Pages** > **Pages**
3. Cliquez sur votre projet **devorbaits**
4. Cliquez sur **Settings** (Paramètres)
5. Cliquez sur **Environment variables**

#### Étape 2 : Vérifier le Secret Monetico

Cherchez la variable :
- **Name** : `MONETICO_CLE_SECRETE`
- **Type** : **Secret** (pas Plain text)
- **Value** : Votre clé secrète Monetico de **TEST** (HMAC-SHA1)

**Vérifications :**
- [ ] La variable `MONETICO_CLE_SECRETE` existe
- [ ] Le type est **Secret** (pas Plain text)
- [ ] La valeur est votre clé secrète de **TEST** (pas de production)
- [ ] Le nom est exactement `MONETICO_CLE_SECRETE` (sans `NEXT_PUBLIC_`)

---

### ✅ 3. Identifiants de TEST

**⚠️ CRUCIAL** : Vous devez utiliser les identifiants de **TEST**, pas ceux de production !

#### TPE de Test
- [ ] Le TPE dans `wrangler.toml` est votre TPE de **TEST**
- [ ] Vous pouvez le vérifier dans votre compte Monetico → Section Test/Sandbox

#### Clé secrète de Test
- [ ] La clé secrète dans Cloudflare Dashboard est votre clé de **TEST**
- [ ] Vous pouvez le vérifier dans votre compte Monetico → Section Test/Sandbox → Clé secrète (HMAC-SHA1)

#### Code société (optionnel)
- [ ] Si vous avez un code société de test, mettez-le dans `wrangler.toml`
- [ ] Sinon, laissez vide (déjà fait)

---

### ✅ 4. URL Monetico

**URL de TEST** (obligatoire pour les tests) :
```
https://p.monetico-services.com/test/paiement.cgi
```

**URL de PRODUCTION** (ne pas utiliser en test) :
```
https://paiement.monetico.fr/paiement.cgi
```

**Vérifications :**
- [ ] `NEXT_PUBLIC_MONETICO_URL` = `https://p.monetico-services.com/test/paiement.cgi`
- [ ] **PAS** `https://paiement.monetico.fr/paiement.cgi` (c'est pour la production)

---

### ✅ 5. URLs de retour

Les URLs de retour doivent pointer vers votre site Cloudflare Pages :

- [ ] `NEXT_PUBLIC_MONETICO_URL_RETOUR` = `https://6b67fd8b.devorbaits.pages.dev/payment/success`
- [ ] `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR` = `https://6b67fd8b.devorbaits.pages.dev/payment/error`

**Note** : Si votre URL Cloudflare est différente, mettez à jour ces variables.

---

## 🔍 Vérification complète

### Résumé de votre configuration actuelle

D'après votre `wrangler.toml` :

| Variable | Valeur | ✅/❌ |
|---|---|---|
| `NEXT_PUBLIC_MONETICO_TPE` | `0917217` | ✅ |
| `NEXT_PUBLIC_MONETICO_KEY` | `266032402DDAA6220573A5C5A523C114016926P6` | ✅ |
| `NEXT_PUBLIC_MONETICO_SOCIETE` | `` (vide) | ✅ |
| `NEXT_PUBLIC_MONETICO_URL` | `https://p.monetico-services.com/test/paiement.cgi` | ✅ **URL de TEST** |
| `NEXT_PUBLIC_MONETICO_URL_RETOUR` | `https://6b67fd8b.devorbaits.pages.dev/payment/success` | ✅ |
| `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR` | `https://6b67fd8b.devorbaits.pages.dev/payment/error` | ✅ |
| `MONETICO_CLE_SECRETE` | (dans Cloudflare Dashboard) | ⚠️ **À vérifier** |

---

## ⚠️ Points critiques à vérifier

### 1. URL Monetico

**✅ CORRECT (TEST)** :
```
https://p.monetico-services.com/test/paiement.cgi
```

**❌ INCORRECT (PRODUCTION)** :
```
https://paiement.monetico.fr/paiement.cgi
```

### 2. Identifiants de TEST

- ✅ Utilisez le **TPE de TEST** (pas celui de production)
- ✅ Utilisez la **clé secrète de TEST** (pas celle de production)
- ✅ Vérifiez dans votre compte Monetico → Section Test/Sandbox

### 3. Secret dans Cloudflare

- ✅ La variable `MONETICO_CLE_SECRETE` doit être dans Cloudflare Dashboard
- ✅ Le type doit être **Secret** (pas Plain text)
- ✅ Le nom doit être exactement `MONETICO_CLE_SECRETE` (sans `NEXT_PUBLIC_`)

---

## 🚀 Action à faire maintenant

### Si tout est correct

1. ✅ Votre configuration est prête pour le mode test
2. ✅ Testez un paiement sur votre site déployé
3. ✅ Vous devriez voir la page Monetico avec l'icône "TEST"

### Si quelque chose manque

1. **Secret manquant dans Cloudflare** :
   - Allez dans Cloudflare Dashboard
   - Settings > Environment variables
   - Ajoutez `MONETICO_CLE_SECRETE` (Type : Secret)
   - Mettez votre clé secrète de TEST
   - Redéployez le site

2. **URL incorrecte** :
   - Vérifiez que `NEXT_PUBLIC_MONETICO_URL` = `https://p.monetico-services.com/test/paiement.cgi`
   - Si ce n'est pas le cas, modifiez `wrangler.toml` et redéployez

3. **Identifiants de production au lieu de test** :
   - Vérifiez dans votre compte Monetico
   - Utilisez les identifiants de la section **Test/Sandbox**
   - Mettez à jour `wrangler.toml` et Cloudflare Dashboard

---

## ✅ Checklist finale

Avant de tester, vérifiez :

- [ ] `NEXT_PUBLIC_MONETICO_URL` = URL de TEST (`https://p.monetico-services.com/test/paiement.cgi`)
- [ ] `NEXT_PUBLIC_MONETICO_TPE` = TPE de TEST
- [ ] `MONETICO_CLE_SECRETE` = Clé secrète de TEST (dans Cloudflare Dashboard, Type : Secret)
- [ ] `NEXT_PUBLIC_MONETICO_URL_RETOUR` = Votre URL Cloudflare Pages
- [ ] `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR` = Votre URL Cloudflare Pages
- [ ] Le site est redéployé après les modifications

---

## 🧪 Test final

1. Allez sur votre site déployé
2. Ajoutez des produits au panier
3. Allez au checkout
4. Sélectionnez "Carte bleue" (Monetico)
5. Cliquez sur "Payer"
6. **Vous devriez voir** :
   - ✅ La page Monetico (sans erreur DNS)
   - ✅ L'icône "TEST" sur la page Monetico
   - ✅ Pas d'erreur "Un problème technique est survenu"

---

## 🆘 Si le problème persiste

1. **Vérifiez les logs** : Console du navigateur (F12) > Console
2. **Vérifiez le déploiement** : Cloudflare Dashboard > Deployments
3. **Vérifiez les secrets** : Cloudflare Dashboard > Settings > Environment variables
4. **Contactez Monetico** : Si le problème persiste, contactez le support avec votre TPE de test

---

## 📝 Notes importantes

- **Mode TEST** : Utilisez toujours l'URL `https://p.monetico-services.com/test/paiement.cgi`
- **Identifiants TEST** : Utilisez les identifiants de la section Test/Sandbox de Monetico
- **Production** : Quand vous passerez en production, changez l'URL et utilisez les identifiants de production
