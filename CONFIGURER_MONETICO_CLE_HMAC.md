# 🔐 Configurer la Clé HMAC Monetico dans Cloudflare

## ⚠️ Erreur actuelle

```
Erreur lors du paiement Monetico: Clé HMAC Monetico invalide (attendu: 40 caractères hexadécimaux, format: ^[0-9A-Fa-f]{40}$)
```

Cette erreur signifie que la clé HMAC Monetico n'est pas configurée ou est mal formatée.

## ✅ Solution : Configurer MONETICO_CLE_HMAC

### Étape 1 : Aller dans Cloudflare Dashboard

1. Allez sur **https://dash.cloudflare.com**
2. **Workers & Pages** > **Pages**
3. Cliquez sur votre projet **devorbaits**
4. Cliquez sur **Settings** (Paramètres)
5. Cliquez sur **Environment variables**

### Étape 2 : Vérifier si la variable existe

Cherchez dans la liste :
- `MONETICO_CLE_HMAC` (nom préféré)
- `MONETICO_CLE_SECRETE` (ancien nom, accepté aussi)

### Étape 3 : Ajouter ou modifier la variable

#### Si la variable n'existe pas :

1. Cliquez sur **Add variable**
2. **Variable name** : `MONETICO_CLE_HMAC`
   - ⚠️ **EXACTEMENT** comme ça (en majuscules, avec underscores)
   - ⚠️ **PAS** `NEXT_PUBLIC_MONETICO_CLE_HMAC` (sans `NEXT_PUBLIC_`)
3. **Type** : **Secret** (choisissez Secret, pas Plain text)
4. **Value** : Collez votre clé HMAC Monetico
   - ⚠️ **EXACTEMENT 40 caractères hexadécimaux**
   - Format : uniquement `0-9`, `A-F`, `a-f` (pas d'espaces, pas de tirets)
   - Exemple valide : `A1B2C3D4E5F6789012345678901234567890AB`
5. Cliquez sur **Save**

#### Si la variable existe mais est invalide :

1. Cliquez sur la variable existante
2. Vérifiez que :
   - Le nom est exactement `MONETICO_CLE_HMAC` (ou `MONETICO_CLE_SECRETE`)
   - Le type est **Secret** (pas Plain text)
   - La valeur fait **exactement 40 caractères**
   - La valeur ne contient **que** des caractères hexadécimaux (0-9, A-F, a-f)
   - **Aucun espace**, **aucun retour à la ligne**, **aucun caractère spécial**
3. Si nécessaire, modifiez la valeur et cliquez sur **Save**

### Étape 4 : Redéployer

Après avoir configuré la variable, vous devez redéployer :

1. Dans Cloudflare Pages, allez dans **Deployments**
2. Cliquez sur les **3 points** du dernier déploiement
3. Cliquez sur **Retry deployment** (ou faites un nouveau push Git)

## 📋 Format de la clé HMAC

### ✅ Format valide

- **Longueur** : exactement 40 caractères
- **Caractères autorisés** : `0-9`, `A-F`, `a-f`
- **Exemple** : `A1B2C3D4E5F6789012345678901234567890AB`

### ❌ Formats invalides

- ❌ `A1B2C3D4E5F6` (trop court, 12 caractères)
- ❌ `A1B2-C3D4-E5F6-...` (contient des tirets)
- ❌ `A1B2 C3D4 E5F6 ...` (contient des espaces)
- ❌ `A1B2C3D4E5F6\n` (contient un retour à la ligne)
- ❌ `A1B2C3D4E5F6789012345678901234567890AB12` (trop long, 44 caractères)

## 🔍 Où trouver votre clé HMAC Monetico ?

La clé HMAC Monetico vous est fournie par Monetico / Crédit Mutuel :

1. **Espace Monetico** : Connectez-vous à votre espace Monetico
2. **Paramètres TPE** : Allez dans les paramètres de votre TPE
3. **Clé HMAC** : Recherchez "Clé HMAC", "Clé secrète", "Secret key", ou "HMAC key"
4. **Format** : La clé doit être une chaîne de 40 caractères hexadécimaux

## ⚠️ Important

- ⚠️ La clé HMAC est **sensible** : ne la partagez jamais publiquement
- ⚠️ Utilisez le type **Secret** dans Cloudflare (pas Plain text)
- ⚠️ Ne mettez **PAS** `NEXT_PUBLIC_` devant le nom (c'est une variable serveur uniquement)
- ⚠️ Vérifiez qu'il n'y a **aucun espace** avant ou après la clé
- ⚠️ Après modification, **redéployez** votre application

## 🧪 Test

Après configuration, testez un paiement Monetico. Si l'erreur persiste :

1. Vérifiez les logs Cloudflare (Workers & Pages > devorbaits > Logs)
2. Cherchez les messages `[MONETICO]` ou `[HMAC]`
3. Vérifiez que la longueur de la clé est bien 40 caractères dans les logs

## 📞 Support

Si vous ne trouvez pas votre clé HMAC, contactez le support Monetico / Crédit Mutuel.
