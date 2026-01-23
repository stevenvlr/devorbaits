# 🔧 Correction de l'erreur technique Monetico

## 🔴 Problème rencontré

Après avoir résolu l'erreur DNS, vous arrivez sur la page Monetico mais obtenez :
```
Un problème technique est survenu. Veuillez essayer ultérieurement.
Technical problem. Please try again later.
```

## 🔍 Causes identifiées

J'ai identifié **4 problèmes majeurs** dans le calcul de la signature Monetico :

### 1. ❌ Format de date incorrect
- **Avant** : `YYYYMMDDHHmmss` (ex: `20250115143045`)
- **Après** : `JJ/MM/AAAA:HH:MM:SS` (ex: `15/01/2025:14:30:45`)

### 2. ❌ Paramètre `version` manquant
- Le paramètre `version=3.0` est **obligatoire** selon Monetico
- Il n'était pas envoyé dans le formulaire

### 3. ❌ Format du MAC incorrect
- **Avant** : Base64
- **Après** : Hexadécimal (en majuscules)

### 4. ❌ Ordre des paramètres incorrect
- **Avant** : Tri alphabétique
- **Après** : Ordre spécifique Monetico : `TPE*date*montant*reference*texte-libre*version*lgue*societe*mail*`
- Les URLs de retour (`url_retour`, `url_retour_ok`, `url_retour_err`) sont **exclues** du calcul du MAC

## ✅ Corrections appliquées

### 1. Format de date corrigé (`lib/monetico.ts`)

```typescript
// Avant
const date = now.toISOString()
  .replace(/[-:]/g, '')
  .replace(/\.\d{3}/, '')
  .slice(0, 14)

// Après
const jour = String(now.getDate()).padStart(2, '0')
const mois = String(now.getMonth() + 1).padStart(2, '0')
const annee = now.getFullYear()
const heures = String(now.getHours()).padStart(2, '0')
const minutes = String(now.getMinutes()).padStart(2, '0')
const secondes = String(now.getSeconds()).padStart(2, '0')
const date = `${jour}/${mois}/${annee}:${heures}:${minutes}:${secondes}`
```

### 2. Paramètre `version` ajouté

```typescript
const params: Record<string, string> = {
  // ... autres paramètres
  version: '3.0', // Version obligatoire
  // ...
}
```

### 3. Format MAC corrigé (`app/api/monetico/signature/route.ts`)

```typescript
// Avant : Base64
const mac = arrayBufferToBase64(signature)

// Après : Hexadécimal
const mac = Array.from(new Uint8Array(signature))
  .map(b => b.toString(16).padStart(2, '0'))
  .join('')
  .toUpperCase()
```

### 4. Ordre des paramètres corrigé

```typescript
// Ordre spécifique Monetico (sans les URLs de retour)
const orderedKeys = ['TPE', 'date', 'montant', 'reference', 'texte_libre', 'version', 'lgue', 'societe', 'mail']
```

## 📝 Étapes suivantes

### 1. Redéployer votre site

Les corrections ont été appliquées dans le code. Vous devez redéployer :

**Option A : Si votre projet est connecté à Git**
```bash
git add lib/monetico.ts app/api/monetico/signature/route.ts
git commit -m "Fix: Correction calcul signature Monetico (date, version, MAC hex)"
git push
```

**Option B : Redéploiement manuel**
1. Allez dans Cloudflare Dashboard > Deployments
2. Cliquez sur les 3 points (⋯) du dernier déploiement
3. Cliquez sur **Retry deployment**

### 2. Vérifier la clé secrète

Assurez-vous que `MONETICO_CLE_SECRETE` est bien configurée dans Cloudflare Dashboard :

1. Allez dans **Settings** > **Environment variables**
2. Vérifiez que `MONETICO_CLE_SECRETE` existe (Type : **Secret**)
3. Vérifiez que c'est la clé secrète de **test** (pas de production)

### 3. Tester le paiement

1. Allez sur votre site déployé
2. Ajoutez des produits au panier
3. Allez au checkout
4. Sélectionnez "Carte bleue" (Monetico)
5. Cliquez sur "Payer"
6. Vous devriez voir la page de paiement Monetico **sans erreur technique**

## 📋 Checklist de vérification

- [ ] Les fichiers `lib/monetico.ts` et `app/api/monetico/signature/route.ts` sont modifiés
- [ ] Le site est redéployé sur Cloudflare
- [ ] `MONETICO_CLE_SECRETE` est configurée dans Cloudflare Dashboard (Type : Secret)
- [ ] Vous utilisez des identifiants Monetico de **test** (TPE, clé secrète)
- [ ] L'URL Monetico est `https://p.monetico-services.com/test/paiement.cgi` (test)

## 🔍 Détails techniques

### Format de la chaîne à signer

La chaîne à signer pour Monetico doit être exactement :
```
TPE*date*montant*reference*texte-libre*version*lgue*societe*mail*
```

**Exemple :**
```
0917217*15/01/2025:14:30:45*25.50EUR*CMD-1234567890-ABC*{"retraitMode":"livraison"}*3.0*FR**user@example.com*
```

Note : Si `societe` est vide, on met quand même un champ vide dans la chaîne (visible par les `**` dans l'exemple).

### Calcul du MAC

1. Construire la chaîne dans l'ordre exact
2. Calculer `HMAC-SHA1(chaîne, clé_secrète)`
3. Convertir le résultat en **hexadécimal en majuscules**

## ⚠️ Important

- **Environnement de test** : Utilisez toujours l'URL `https://p.monetico-services.com/test/paiement.cgi`
- **Identifiants de test** : Assurez-vous d'utiliser le TPE et la clé secrète de **test** (pas de production)
- **Code société** : Si vous n'avez pas de code société, laissez-le vide (déjà configuré dans `wrangler.toml`)

## 🆘 Si le problème persiste

1. **Vérifiez les logs** : Ouvrez la console du navigateur (F12) et regardez les erreurs
2. **Vérifiez la clé secrète** : Assurez-vous qu'elle est correcte et correspond au TPE de test
3. **Vérifiez le format** : Vérifiez que la date est bien au format `JJ/MM/AAAA:HH:MM:SS`
4. **Contactez Monetico** : Si le problème persiste, contactez le support Monetico avec votre TPE de test

## 📞 Support Monetico

Si vous avez besoin d'aide supplémentaire :
- Documentation Monetico : https://www.monetico-paiement.fr
- Support technique : Via votre espace Monetico
