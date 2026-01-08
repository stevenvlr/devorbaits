# Guide : Résoudre l'erreur 401 Unauthorized avec Boxtal

## 🔴 Erreur rencontrée

```
Erreur lors de la création de la commande test (401)
{
  "timestamp": 1767703703806,
  "status": 401,
  "error": "Unauthorized",
  "exception": "com.netflix.zuul.exception.ZuulException",
  "message": "Authentication Failed"
}
```

## 🔍 Causes possibles

### 1. Clés API incorrectes ou mal formatées

**Symptôme** : L'authentification échoue même si les clés sont configurées

**Solutions** :
1. **Vérifiez que vous utilisez les clés API v3** (pas v1)
   - Les clés API v3 commencent généralement par `ak_` pour l'Access Key et `sk_` pour la Secret Key
   - Les clés API v1 ont un format différent

2. **Vérifiez qu'il n'y a pas d'espaces** avant ou après les clés
   - Copiez-collez les clés directement depuis votre compte Boxtal
   - Ne pas ajouter d'espaces manuellement

3. **Vérifiez que les clés sont complètes**
   - Les clés API sont généralement très longues (plus de 30 caractères)
   - Vérifiez qu'elles n'ont pas été tronquées lors de la copie

### 2. Environnement incorrect (test vs production)

**Symptôme** : Les clés fonctionnent mais l'environnement ne correspond pas

**Solutions** :
1. **Vérifiez l'environnement dans la configuration**
   - Allez sur `/admin/boxtal-config`
   - Vérifiez que l'environnement correspond à vos clés API :
     - Clés de **test** → Environnement "Test" (`api.boxtal.build`)
     - Clés de **production** → Environnement "Production" (`api.boxtal.com`)

2. **Vérifiez dans votre compte Boxtal**
   - Connectez-vous à [developer.boxtal.com](https://developer.boxtal.com)
   - Vérifiez si votre application est configurée pour "Test" ou "Production"
   - Assurez-vous que l'environnement correspond

### 3. Permissions insuffisantes de l'application

**Symptôme** : L'authentification réussit mais la création de commande échoue avec 401

**Solutions** :
1. **Vérifiez les permissions de votre application Boxtal**
   - Connectez-vous à [developer.boxtal.com](https://developer.boxtal.com)
   - Allez dans "Apps" > Votre application
   - Vérifiez que l'application a les permissions pour créer des commandes d'expédition
   - Si nécessaire, modifiez les permissions ou recréez l'application

2. **Vérifiez que l'application est active**
   - Assurez-vous que votre application Boxtal n'est pas désactivée
   - Vérifiez que votre compte Boxtal est actif

### 4. Token expiré ou invalide

**Symptôme** : L'authentification initiale réussit mais la création de commande échoue

**Solutions** :
1. **Le token est régénéré automatiquement** à chaque requête
   - Si le problème persiste, vérifiez que les clés API sont correctes
   - Le problème vient probablement des clés ou de l'environnement

## ✅ Vérifications étape par étape

### Étape 1 : Vérifier la configuration dans l'interface admin

1. Allez sur `/admin/boxtal-config`
2. Vérifiez que :
   - Les clés API sont remplies (pas vides)
   - L'environnement correspond à vos clés (test ou production)
   - Les clés ne contiennent pas d'espaces visibles

### Étape 2 : Tester la configuration

1. Allez sur `/api/boxtal/test` dans votre navigateur
2. Vérifiez les résultats :
   - ✅ **Clés API** : Doit être "trouvées"
   - ✅ **Authentification** : Doit être "réussie"
   - ❌ Si l'authentification échoue, vérifiez les clés API

### Étape 3 : Vérifier dans votre compte Boxtal

1. Connectez-vous à [developer.boxtal.com](https://developer.boxtal.com)
2. Allez dans "Apps" > Votre application
3. Vérifiez :
   - Que l'application est de type **"API v3"** (pas v1)
   - Que l'application est **active**
   - Que les clés correspondent à celles dans votre configuration
   - L'environnement (test ou production)

### Étape 4 : Recréer les clés API (si nécessaire)

Si les clés ne fonctionnent toujours pas :

1. Dans votre compte Boxtal, **supprimez l'ancienne application**
2. **Créez une nouvelle application** :
   - Type : **API v3** (⚠️ Important)
   - Environnement : Test ou Production (selon vos besoins)
3. **Copiez les nouvelles clés** immédiatement (la Secret Key n'est affichée qu'une fois)
4. **Mettez à jour la configuration** dans `/admin/boxtal-config`
5. **Testez à nouveau** avec `/api/boxtal/test`

## 🔧 Solutions rapides

### Solution 1 : Vérifier et corriger les clés API

```bash
# 1. Allez sur /admin/boxtal-config
# 2. Supprimez les clés existantes
# 3. Recopiez-les depuis votre compte Boxtal (sans espaces)
# 4. Sauvegardez
# 5. Testez avec /api/boxtal/test
```

### Solution 2 : Vérifier l'environnement

```bash
# 1. Allez sur /admin/boxtal-config
# 2. Vérifiez l'environnement :
#    - Si vous avez des clés de TEST → Environnement "Test"
#    - Si vous avez des clés de PRODUCTION → Environnement "Production"
# 3. Sauvegardez
# 4. Testez avec /api/boxtal/test
```

### Solution 3 : Utiliser les variables d'environnement

Si la configuration dans Supabase ne fonctionne pas, utilisez les variables d'environnement :

1. Ouvrez `.env.local`
2. Ajoutez :
```env
NEXT_PUBLIC_BOXTAL_API_KEY=votre_access_key_ici
NEXT_PUBLIC_BOXTAL_API_SECRET=votre_secret_key_ici
NEXT_PUBLIC_BOXTAL_ENV=test
```
3. Redémarrez le serveur (`npm run dev`)
4. Testez avec `/api/boxtal/test`

## 📋 Checklist de vérification

Avant de créer une commande test, vérifiez :

- [ ] Les clés API sont configurées dans `/admin/boxtal-config` OU dans `.env.local`
- [ ] Les clés API sont de type **API v3** (pas v1)
- [ ] Les clés ne contiennent pas d'espaces avant ou après
- [ ] L'environnement (test/production) correspond aux clés API
- [ ] Le test `/api/boxtal/test` réussit l'authentification
- [ ] Votre compte Boxtal est actif
- [ ] L'application Boxtal a les permissions nécessaires

## 🆘 Si le problème persiste

1. **Vérifiez les logs** dans la console du navigateur (F12)
2. **Vérifiez les logs serveur** dans le terminal où tourne `npm run dev`
3. **Contactez le support Boxtal** si les clés sont correctes mais ne fonctionnent toujours pas
4. **Vérifiez la documentation Boxtal** : [developer.boxtal.com/docs](https://developer.boxtal.com/docs)

## 📝 Notes importantes

- ⚠️ **Les clés API v1 et v3 sont différentes** : Assurez-vous d'utiliser les clés de l'API v3
- ⚠️ **L'environnement doit correspondre** : Clés de test → Environnement test, Clés de production → Environnement production
- ⚠️ **La Secret Key n'est affichée qu'une fois** : Si vous l'avez perdue, vous devrez recréer l'application
- ✅ **Le token est régénéré automatiquement** : Pas besoin de le gérer manuellement



