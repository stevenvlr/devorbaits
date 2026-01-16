# Checklist Debug Monetico

## ✅ Vérifications à effectuer

### 1. Vérifier les champs envoyés à Monetico

Dans la console du navigateur, vérifier que `fields` contient bien :

- ✅ `MAC` : Présent et non vide (40 caractères hexadécimaux)
- ✅ `societe` : Présent (peut être vide mais doit être présent)
- ✅ `lgue` : Présent avec la valeur `"FR"`
- ✅ `mail` : Présent avec une adresse email valide
- ✅ `texte-libre` : Présent (peut être vide mais doit être présent)
- ✅ `TPE` : Présent avec votre numéro TPE
- ✅ `version` : Présent avec la valeur `"3.0"`
- ✅ `date` : Présent au format `DD/MM/YYYY:HH:MM:SS`
- ✅ `montant` : Présent au format `"XX.XXEUR"`
- ✅ `reference` : Présent, max 12 caractères, uniquement A-Z0-9 (pas de tirets)

### 2. Vérifier la référence

La référence doit :
- ✅ Faire exactement 12 caractères
- ✅ Contenir uniquement des lettres majuscules (A-Z) et des chiffres (0-9)
- ✅ Ne pas contenir de tirets, underscores, ou autres caractères spéciaux

Exemple valide : `A1B2C3D4E5F6`
Exemple invalide : `CMD-123456` (contient un tiret)

### 3. Vérifier la chaîne MAC

La chaîne utilisée pour calculer le MAC doit être strictement identique à celle envoyée :

Format exact : `<TPE>*<date>*<montant>*<reference>*<texte-libre>*<version>*<lgue>*<societe>*<mail>*`

Exemple :
```
0917217*16/01/2025:15:30:45*19.99EUR*A1B2C3D4E5F6*CMDTEST*3.0*FR**client@test.fr*
```

Note : Si `societe` est vide, il y a quand même un `*` pour le séparer.

### 4. Vérifier la configuration

Vérifier dans Cloudflare Dashboard (Secrets) ou `wrangler.toml` :

- ✅ `MONETICO_TPE` : Votre numéro TPE de test
- ✅ `MONETICO_CLE_HMAC` : Votre clé HMAC (secret, dans Cloudflare Dashboard)
- ✅ `MONETICO_ACTION_URL` : URL de test = `https://p.monetico-services.com/test/paiement.cgi`
- ✅ `MONETICO_SOCIETE` : Optionnel, peut être vide

### 5. Vérifier le format du MAC

Le MAC doit être :
- ✅ En hexadécimal (0-9, A-F)
- ✅ En majuscules
- ✅ Faire exactement 40 caractères (HMAC-SHA1 = 20 bytes = 40 hex chars)

Exemple : `A1B2C3D4E5F6789012345678901234567890AB`

### 6. Vérifier les logs serveur

Dans les logs Cloudflare (ou console serveur), vérifier :

- ✅ La chaîne MAC générée (pour debug)
- ✅ La longueur du MAC (doit être 40)
- ✅ La référence générée (doit être 12 chars, alphanumérique)

### 7. Vérifier l'URL de test

- ✅ `MONETICO_ACTION_URL` doit pointer vers l'URL de TEST :
  `https://p.monetico-services.com/test/paiement.cgi`
- ❌ Ne pas utiliser l'URL de production en test :
  `https://paiement.monetico.fr/paiement.cgi`

### 8. Vérifier les identifiants de test

- ✅ Utiliser les identifiants fournis par Monetico pour le mode TEST
- ✅ Ne pas utiliser les identifiants de production

## 🔍 Debug dans la console

Ouvrir la console du navigateur (F12) et vérifier :

1. Le log `Monetico - FIELDS envoyés Monetico:` doit afficher tous les champs
2. Vérifier que chaque champ est présent et au bon format
3. Vérifier que `MAC` est présent et fait 40 caractères

## 🐛 Erreurs courantes

### "Technical problem" sur la page Monetico

Causes possibles :
- ❌ MAC incorrect (chaîne à signer différente de celle envoyée)
- ❌ Format de date incorrect
- ❌ Référence avec caractères invalides
- ❌ Champs manquants (societe, lgue, etc.)
- ❌ URL incorrecte (production au lieu de test)

### MAC invalide

- Vérifier que la clé HMAC est correcte
- Vérifier que la chaîne à signer est exactement identique à celle envoyée
- Vérifier que le MAC est en hexadécimal majuscules

### Référence invalide

- Vérifier que la référence fait exactement 12 caractères
- Vérifier qu'elle ne contient que A-Z0-9 (pas de tirets, underscores, etc.)
