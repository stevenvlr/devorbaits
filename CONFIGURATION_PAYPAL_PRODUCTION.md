# Configuration PayPal en Mode Production

## 🎯 Objectif

Ce guide vous explique comment configurer PayPal en mode **PRODUCTION** (paiements réels) pour votre site déployé sur Netlify.

---

## ⚠️ Important : Différence entre Test et Production

- **Mode TEST (Sandbox)** : Paiements fictifs, pour tester sans argent réel
- **Mode PRODUCTION (Live)** : Paiements réels, les clients paient vraiment

---

## 📋 Étape 1 : Créer une application PayPal en mode Production

1. Allez sur [https://developer.paypal.com](https://developer.paypal.com)
2. Connectez-vous avec votre compte PayPal Business
3. Allez dans **Dashboard** > **My Apps & Credentials**
4. Cliquez sur **Create App** (Créer une application)
5. Remplissez les informations :
   - **App Name** : Nom de votre application (ex: "Boutique Pêche Carpe Production")
   - **Merchant** : Votre compte PayPal Business
   - **Features** : Cochez **Accept Payments**
   - **⚠️ IMPORTANT** : Sélectionnez **Live** (pas Sandbox)
6. Cliquez sur **Create App**

---

## 🔑 Étape 2 : Récupérer les identifiants de Production

Après la création de l'application, vous verrez :
- **Client ID** : Identifiant public (commence par `A...`)
- **Secret** : Clé secrète (⚠️ Ne jamais exposer publiquement)

⚠️ **IMPORTANT** : Ces identifiants sont différents de ceux du mode test (Sandbox) !

---

## 🔧 Étape 3 : Configurer les variables dans Netlify

Dans votre dashboard Netlify, allez dans **Site configuration** > **Environment variables** et ajoutez :

### Variable 1 : Client ID de Production
- **Key** : `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- **Value** : Votre Client ID de PRODUCTION (celui de l'app Live)

### Variable 2 : Secret de Production
- **Key** : `PAYPAL_SECRET`
- **Value** : Votre Secret de PRODUCTION (celui de l'app Live)
- ⚠️ Ne commence PAS par `NEXT_PUBLIC_`

### Variable 3 : URL de l'API Production
- **Key** : `NEXT_PUBLIC_PAYPAL_BASE_URL`
- **Value** : `https://api-m.paypal.com`
- ⚠️ **IMPORTANT** : Utilisez `api-m.paypal.com` (pas `sandbox`)

### Variable 4 : URL de votre site
- **Key** : `NEXT_PUBLIC_SITE_URL`
- **Value** : `https://votre-site.netlify.app` (votre URL Netlify)

---

## ✅ Vérification

1. Vérifiez que toutes les variables sont bien configurées dans Netlify
2. Redéployez votre site dans Netlify
3. Testez un paiement PayPal sur votre site
4. ⚠️ **ATTENTION** : En production, les paiements sont RÉELS !

---

## 🔄 Si vous voulez revenir en mode Test

Si vous voulez tester sans paiements réels :

1. Changez `NEXT_PUBLIC_PAYPAL_BASE_URL` en : `https://api-m.sandbox.paypal.com`
2. Utilisez les identifiants de votre app Sandbox (test)
3. Redéployez le site

---

## 📝 Checklist Production PayPal

- [ ] Application PayPal créée en mode **Live** (pas Sandbox)
- [ ] Client ID de production récupéré
- [ ] Secret de production récupéré
- [ ] `NEXT_PUBLIC_PAYPAL_CLIENT_ID` = Client ID de production
- [ ] `PAYPAL_SECRET` = Secret de production
- [ ] `NEXT_PUBLIC_PAYPAL_BASE_URL` = `https://api-m.paypal.com`
- [ ] `NEXT_PUBLIC_SITE_URL` = URL de votre site Netlify
- [ ] Site redéployé dans Netlify
- [ ] Test effectué (⚠️ paiement réel en production)

---

## ⚠️ Sécurité

1. **Ne partagez JAMAIS** votre `PAYPAL_SECRET`
2. Ne commitez JAMAIS les secrets dans Git
3. Utilisez uniquement les variables d'environnement dans Netlify
4. Vérifiez régulièrement que personne n'a accès à vos identifiants PayPal

---

## 🆘 Problèmes courants

**Le paiement ne fonctionne pas**
- Vérifiez que vous utilisez bien les identifiants de PRODUCTION (Live)
- Vérifiez que `NEXT_PUBLIC_PAYPAL_BASE_URL` = `https://api-m.paypal.com` (pas sandbox)
- Vérifiez que votre compte PayPal Business est actif

**Erreur "Invalid Client ID"**
- Vous utilisez peut-être les identifiants de test (Sandbox) au lieu de production (Live)
- Créez une nouvelle app en mode Live et utilisez ces identifiants
