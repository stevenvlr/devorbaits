# Implémentation Monetico v3.0 - Code de Vérification

## 📋 Informations Générales

**Date de soumission** : Janvier 2026  
**Version Monetico** : 3.0  
**Framework** : Next.js 15 avec Edge Runtime (Cloudflare Pages)  
**Langage** : TypeScript  
**API Cryptographique** : WebCrypto API (compatible Edge Runtime)

---

## 📁 Fichiers Fournis

### 1. `monetico-route.ts` (Génération du paiement)
**Fonction** : Génère le paiement Monetico et calcule le MAC

**Fonctionnalités principales** :
- Génère une référence alphanumérique unique (12 caractères, A-Z0-9)
- Formate la date au format Monetico (DD/MM/YYYY:HH:MM:SS)
- Calcule le MAC HMAC-SHA1 selon la documentation v3.0
- Valide tous les champs obligatoires
- Retourne les champs de paiement avec le MAC

### 2. `monetico-retour-route.ts` (Vérification du retour)
**Fonction** : Réception et vérification des notifications Monetico

**Fonctionnalités principales** :
- Reçoit les notifications POST de Monetico
- Vérifie le MAC reçu vs MAC calculé
- Met à jour le statut des commandes en base de données
- Gère les redirections GET et POST

---

## 🔐 Implémentation du MAC (Message Authentication Code)

### Format du MAC selon Monetico v3.0

**Format** : VALEURS uniquement (pas `key=value`), séparées par `*`

**Ordre exact des champs** :
```
TPE*date*montant*reference*texte-libre*version*lgue*societe*mail*
```

### Algorithme utilisé

1. **Construction de la chaîne MAC** :
   - Extraction des valeurs dans l'ordre exact spécifié
   - Les champs vides sont inclus comme chaînes vides (`texte-libre` peut être vide)
   - Les champs d'échéance (`nbrech`, `dateech*`, `montantech*`) sont **EXCLUS** s'ils sont vides
   - Le champ `options` est **EXCLUS** s'il est vide
   - Les URLs de retour (`url_retour`, `url_retour_ok`, `url_retour_err`) sont **EXCLUES** du calcul MAC

2. **Calcul HMAC-SHA1** :
   - Clé HMAC : 40 caractères hexadécimaux → convertis en 20 octets
   - Message : Chaîne MAC encodée en UTF-8
   - Algorithme : HMAC-SHA1 via WebCrypto API
   - Résultat : 40 caractères hexadécimaux en majuscules

### Exemple de chaîne MAC

```
0917217*27/01/2026:14:30:45*95.25EUR*ABC123XYZ789**3.0*FR*DEVORBAITS*client@example.com*
```

**Note** : `texte-libre` est vide dans cet exemple, donc il y a deux `*` consécutifs.

---

## ✅ Conformité avec la Documentation Monetico v3.0

### Champs obligatoires inclus

- ✅ `TPE` : Numéro TPE Monetico
- ✅ `date` : Format DD/MM/YYYY:HH:MM:SS
- ✅ `montant` : Format XX.XXEUR (ex: "95.25EUR")
- ✅ `reference` : 12 caractères alphanumériques (A-Z0-9)
- ✅ `texte-libre` : Peut être vide mais présent
- ✅ `version` : "3.0"
- ✅ `lgue` : "FR"
- ✅ `societe` : Code société (obligatoire, non vide)
- ✅ `mail` : Email du client

### Champs exclus du MAC (conformément à la doc)

- ❌ `url_retour` : Exclu du calcul MAC
- ❌ `url_retour_ok` : Exclu du calcul MAC
- ❌ `url_retour_err` : Exclu du calcul MAC
- ❌ `nbrech` : Exclu si vide
- ❌ `dateech1-4` : Exclu si vide
- ❌ `montantech1-4` : Exclu si vide
- ❌ `options` : Exclu si vide

---

## 🔒 Sécurité

### Protection de la clé HMAC

- ✅ Clé stockée en variable d'environnement serveur uniquement (`MONETICO_CLE_HMAC`)
- ✅ Jamais exposée au client
- ✅ Jamais loggée complètement (seul un hash SHA-256 tronqué est loggé pour debug)

### Validation des données

- ✅ Validation stricte du format montant (`/^[0-9]+(\.[0-9]{1,2})?[A-Z]{3}$/`)
- ✅ Validation de la référence (12 caractères, A-Z0-9 uniquement)
- ✅ Vérification que `societe` n'est pas vide
- ✅ Vérification que tous les champs obligatoires sont présents

---

## 📝 Variables d'Environnement Requises

### Variables serveur (secrets)

- `MONETICO_CLE_HMAC` : Clé secrète HMAC (40 caractères hexadécimaux)
- `MONETICO_TPE` : Numéro TPE Monetico
- `MONETICO_SOCIETE` : Code société (obligatoire, non vide)
- `MONETICO_ACTION_URL` : URL de paiement Monetico
- `MONETICO_URL_RETOUR` : URL de retour pour notifications
- `MONETICO_URL_RETOUR_OK` : URL de retour en cas de succès
- `MONETICO_URL_RETOUR_ERR` : URL de retour en cas d'erreur

---

## 🧪 Tests et Validation

### Points de vérification

1. **Format MAC** : Vérifier que le MAC fait exactement 40 caractères hexadécimaux
2. **Ordre des champs** : Vérifier que l'ordre est strictement respecté
3. **Exclusion des champs vides** : Vérifier que les champs d'échéance vides sont exclus
4. **Référence** : Vérifier que la référence fait exactement 12 caractères alphanumériques
5. **Date** : Vérifier le format DD/MM/YYYY:HH:MM:SS

---

## 📊 Détails Techniques

### Calcul du MAC - Code Clé

```typescript
// Ordre exact des champs OBLIGATOIRES pour le MAC (selon documentation Monetico v3.0)
const macOrder = [
  'TPE', 'date', 'montant', 'reference', 'texte-libre', 'version', 'lgue', 'societe', 'mail'
]

// Construire macString avec les VALEURS uniquement (pas key=value)
const macParts: string[] = []
for (const key of macOrder) {
  const value = fields[key]
  const val = value !== null && value !== undefined ? String(value) : ''
  macParts.push(val)
}

// Joindre avec "*" et ajouter le * final
const macString = macParts.join('*') + '*'

// Calculer le MAC HMAC-SHA1
const MAC = await calculateMAC(keyBytes, macString)
```

### Fonction calculateMAC

```typescript
async function calculateMAC(keyBytes: Uint8Array, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const messageData = encoder.encode(message)
  const keyBuffer = u8ToArrayBuffer(keyBytes)
  const dataBuffer = u8ToArrayBuffer(messageData)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer)
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('')
}
```

---

## 📞 Contact

Pour toute question sur cette implémentation, veuillez contacter notre équipe technique.

---

**Note** : Cette implémentation est conforme à la documentation Monetico v3.0 et utilise WebCrypto API pour garantir la compatibilité avec les environnements Edge Runtime (Cloudflare Pages).
