# Implémentation Monetico Complète - Résumé

## ✅ Fichiers créés/modifiés

### 1. `app/api/monetico/route.ts` (NOUVEAU)
- Route API Next.js avec Edge Runtime
- Génère le MAC côté serveur (sécurisé)
- Calcule la référence alphanumérique (12 chars, A-Z0-9)
- Formate la date au format Monetico
- Retourne `{ action, fields }` avec tous les champs nécessaires

### 2. `lib/monetico.ts` (MODIFIÉ)
- Ajout de la fonction `startMoneticoPayment()` côté client
- Appelle `/api/monetico` et soumet automatiquement le formulaire
- Logs complets pour debug

### 3. `app/checkout/page.tsx` (MODIFIÉ)
- Ajout du bouton "Payer en test (Monetico)" en mode développement
- Import de `startMoneticoPayment`

### 4. `MONETICO_DEBUG_CHECKLIST.md` (NOUVEAU)
- Checklist complète pour debug
- Vérifications à effectuer
- Erreurs courantes et solutions

## 🔧 Configuration requise

### Variables d'environnement (Cloudflare Dashboard - Secrets)

1. **`MONETICO_TPE`** ou `NEXT_PUBLIC_MONETICO_TPE`
   - Votre numéro TPE Monetico (test)

2. **`MONETICO_CLE_HMAC`** ou `MONETICO_CLE_SECRETE`
   - Votre clé secrète HMAC (⚠️ Secret, jamais exposée au client)

3. **`MONETICO_ACTION_URL`** ou `NEXT_PUBLIC_MONETICO_URL`
   - URL de test : `https://p.monetico-services.com/test/paiement.cgi`
   - URL de production : `https://paiement.monetico.fr/paiement.cgi`

4. **`MONETICO_SOCIETE`** ou `NEXT_PUBLIC_MONETICO_SOCIETE` (optionnel)
   - Peut être vide

### Variables dans `wrangler.toml` (non sensibles)

Les variables `NEXT_PUBLIC_*` peuvent rester dans `wrangler.toml` :
- `NEXT_PUBLIC_MONETICO_TPE`
- `NEXT_PUBLIC_MONETICO_SOCIETE`
- `NEXT_PUBLIC_MONETICO_URL`

## 🚀 Utilisation

### Côté client

```typescript
import { startMoneticoPayment } from '@/lib/monetico'

// Lancer un paiement
await startMoneticoPayment({
  montant: '19.99EUR',        // Format: "XX.XXEUR"
  mail: 'client@test.fr',     // Email du client
  texteLibre: 'CMDTEST'       // Optionnel
})
```

### Bouton de test

Un bouton "Payer en test (Monetico)" apparaît automatiquement en mode développement dans la page checkout.

## 🔍 Debug

1. Ouvrir la console du navigateur (F12)
2. Cliquer sur "Payer en test (Monetico)"
3. Vérifier le log : `Monetico - FIELDS envoyés Monetico:`
4. Vérifier que tous les champs sont présents et au bon format

## ✅ Vérifications importantes

### Référence
- ✅ Exactement 12 caractères
- ✅ Uniquement A-Z0-9 (pas de tirets, underscores, etc.)
- ✅ Exemple valide : `A1B2C3D4E5F6`

### Chaîne MAC
- ✅ Format exact : `<TPE>*<date>*<montant>*<reference>*<texte-libre>*<version>*<lgue>*<societe>*<mail>*`
- ✅ Chaque champ séparé par `*`
- ✅ Astérisque final après `mail`

### MAC
- ✅ 40 caractères hexadécimaux majuscules
- ✅ Format : HMAC-SHA1

### Champs requis
- ✅ `TPE`, `date`, `montant`, `reference`, `texte-libre`, `version`, `lgue`, `societe`, `mail`, `MAC`

## 📝 Notes importantes

1. **Sécurité** : La clé HMAC n'est jamais exposée au client, elle reste côté serveur
2. **Edge Runtime** : Compatible Cloudflare Pages/Workers
3. **Format date** : `DD/MM/YYYY:HH:MM:SS` (ex: `16/01/2025:15:30:45`)
4. **Format montant** : `XX.XXEUR` (ex: `19.99EUR`)
5. **Référence** : Générée automatiquement, alphanumérique, 12 chars max

## 🐛 Résolution de problèmes

Si vous voyez "Technical problem" sur la page Monetico :

1. Vérifier que tous les champs sont présents dans les logs
2. Vérifier que la référence est bien alphanumérique (pas de tirets)
3. Vérifier que le MAC fait 40 caractères
4. Vérifier que l'URL est bien l'URL de TEST
5. Vérifier que les identifiants sont ceux de TEST

Consulter `MONETICO_DEBUG_CHECKLIST.md` pour plus de détails.
