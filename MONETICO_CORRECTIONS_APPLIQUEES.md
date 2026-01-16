# Corrections appliquées - Monetico Integration

## ✅ Problèmes corrigés

### 1. Variable `societe` vide ❌ → ✅

**Avant** : `societe` pouvait être vide
**Après** : 
- Vérification stricte : `societe` ne peut PAS être vide
- Erreur 500 claire si vide : "MONETICO_SOCIETE est vide. Configurez MONETICO_SOCIETE dans Cloudflare Dashboard..."
- Lecture depuis `process.env.MONETICO_SOCIETE` côté serveur (Edge runtime)
- Guide de configuration créé : `CONFIGURER_MONETICO_SOCIETE_CLOUDFLARE.md`

**Fichier modifié** : `app/api/monetico/route.ts` (lignes 95-105)

---

### 2. Référence invalide ❌ → ✅

**Avant** : `"CMD-1768575606502-95B8GF5"` (trop longue + tirets)
**Après** :
- Génération côté serveur : exactement 12 caractères
- Format strict : A-Z0-9 uniquement (pas de tirets, underscores)
- Exemple valide : `A1B2C3D4E5F6`

**Fichier modifié** : `app/api/monetico/route.ts` (fonction `generateReference()`)

---

### 3. Champ `texte-libre` avec underscore ❌ → ✅

**Avant** : `texte_libre` (avec underscore)
**Après** :
- Nom du champ : `texte-libre` (avec tiret)
- Utilisé dans la chaîne MAC avec le même nom
- Vérification dans les logs

**Fichiers modifiés** :
- `app/api/monetico/route.ts` (ligne 144, 126)
- `lib/monetico.ts` (ligne 240)

---

### 4. Chaîne MAC - Ordre exact ✅

**Format exact** :
```
<TPE>*<date>*<montant>*<reference>*<texte-libre>*<version>*<lgue>*<societe>*<mail>*
```

**Exemple** :
```
0917217*16/01/2026:16:00:06*20.99EUR*A1B2C3D4E5F6*CMDTEST*3.0*FR*VOTRE_SOCIETE*client@test.fr*
```

**Points importants** :
- ✅ Ordre strict respecté
- ✅ Chaque champ séparé par `*`
- ✅ Astérisque final après `mail`
- ✅ `texte-libre` (avec tiret) dans la chaîne MAC
- ✅ `societe` ne peut plus être vide

**Fichier modifié** : `app/api/monetico/route.ts` (lignes 121-131)

---

### 5. MAC / HMAC ✅

- ✅ Calculé avec `crypto.subtle` (compatible Edge Runtime)
- ✅ Format : HMAC-SHA1
- ✅ Sortie : Hexadécimal majuscules (40 caractères)
- ✅ Vérification : Longueur = 40 caractères

**Fichier modifié** : `app/api/monetico/route.ts` (fonction `calculateMAC()`)

---

### 6. Logs de debug améliorés ✅

**Côté serveur** (logs Cloudflare) :
```javascript
Monetico - Paiement généré: {
  reference: "A1B2C3D4E5F6",
  referenceLength: 12,
  referenceValid: true,
  societe: "VOTRE_SOCIETE",
  societeLength: 14,
  texteLibre: "CMDTEST",
  macLength: 40,
  macPreview: "A1B2C3D4E5F678901234...",
  macString: "0917217*16/01/2026:16:00:06*20.99EUR*A1B2C3D4E5F6*CMDTEST*3.0*FR*VOTRE_SOCIETE*client@test.fr*..."
}
```

**Côté client** (console navigateur) :
```javascript
Monetico - FIELDS envoyés Monetico: {
  action: "https://p.monetico-services.com/test/paiement.cgi",
  TPE: "0917217",
  societe: "VOTRE_SOCIETE",
  version: "3.0",
  date: "16/01/2026:16:00:06",
  montant: "20.99EUR",
  reference: "A1B2C3D4E5F6",
  "texte-libre": "CMDTEST",
  lgue: "FR",
  mail: "client@test.fr",
  MAC: "A1B2C3D4E5F6789012345678901234567890AB",
  MACLength: 40,
  referenceLength: 12,
  referenceValid: true
}
```

**Fichiers modifiés** :
- `app/api/monetico/route.ts` (lignes 151-161)
- `lib/monetico.ts` (lignes 230-250)

---

### 7. Vérifications de sécurité côté client ✅

Avant de soumettre le formulaire, vérifications :
- ✅ MAC présent et fait 40 caractères
- ✅ Référence valide (12 chars, A-Z0-9)
- ✅ `societe` non vide

**Fichier modifié** : `lib/monetico.ts` (lignes 220-235)

---

### 8. Bouton de test amélioré ✅

- ✅ Utilise le montant réel du panier
- ✅ Utilise l'email de l'utilisateur
- ✅ Visible en production (pas seulement en développement)
- ✅ Libellé : "Payer (TEST Monetico)"

**Fichier modifié** : `app/checkout/page.tsx` (lignes 1538-1553)

---

## 📁 Fichiers créés/modifiés

### Fichiers modifiés
1. `app/api/monetico/route.ts` - Route API complètement réécrite
2. `lib/monetico.ts` - Fonction `startMoneticoPayment()` améliorée
3. `app/checkout/page.tsx` - Bouton de test amélioré

### Fichiers créés
1. `MONETICO_CHECKLIST_DEBUG.md` - Checklist de debug
2. `CONFIGURER_MONETICO_SOCIETE_CLOUDFLARE.md` - Guide de configuration
3. `MONETICO_CORRECTIONS_APPLIQUEES.md` - Ce fichier

---

## 🚀 Prochaines étapes

1. **Configurer `MONETICO_SOCIETE`** dans Cloudflare Dashboard
   - Voir `CONFIGURER_MONETICO_SOCIETE_CLOUDFLARE.md`

2. **Redéployer** sur Cloudflare Pages

3. **Tester** avec le bouton "Payer (TEST Monetico)"

4. **Vérifier les logs** dans la console du navigateur

5. **Si problème persiste**, consulter `MONETICO_CHECKLIST_DEBUG.md`

---

## ✅ Checklist finale

- [x] `societe` vérifié (ne peut pas être vide)
- [x] Référence générée (12 chars, A-Z0-9)
- [x] Champ `texte-libre` avec tiret
- [x] Chaîne MAC dans l'ordre exact
- [x] MAC calculé en HMAC-SHA1 hex majuscules
- [x] Logs de debug complets
- [x] Vérifications de sécurité côté client
- [x] Documentation créée
