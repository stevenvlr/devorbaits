# Checklist Debug Monetico - Si ça bug encore

## ✅ Vérifications OBLIGATOIRES

### 1. Variable `MONETICO_SOCIETE` (CRITIQUE)

**❌ ERREUR COURANTE : `societe` est vide**

- ✅ Aller dans **Cloudflare Dashboard** → Votre projet → **Settings** → **Environment Variables**
- ✅ Ajouter `MONETICO_SOCIETE` pour **Preview** ET **Production**
- ✅ Type : **Plain text** (pas Secret)
- ✅ Valeur : Votre code société Monetico (demandé à Monetico si vous ne l'avez pas)
- ✅ **IMPORTANT** : La valeur ne peut PAS être vide. Si vous n'avez pas de code société, contactez Monetico.
- ✅ Redéployer après modification

**Vérification** : Dans les logs console, `societe` doit être présent et non vide.

---

### 2. Référence (12 chars max, A-Z0-9 uniquement)

**❌ ERREUR COURANTE : Référence trop longue ou avec tirets**

- ✅ La référence doit faire **exactement 12 caractères**
- ✅ Uniquement **A-Z** (majuscules) et **0-9** (chiffres)
- ✅ **PAS de tirets** (`-`), underscores (`_`), ou autres caractères

**Exemple valide** : `A1B2C3D4E5F6`
**Exemple invalide** : `CMD-123456` (contient un tiret)

**Vérification** : Dans les logs console, vérifier :
```javascript
referenceLength: 12
referenceValid: true
```

---

### 3. Champ `texte-libre` (avec tiret, pas underscore)

**❌ ERREUR COURANTE : `texte_libre` au lieu de `texte-libre`**

- ✅ Le nom du champ dans le formulaire doit être **`texte-libre`** (avec tiret)
- ✅ **PAS** `texte_libre` (avec underscore)
- ✅ La même valeur doit être utilisée dans la chaîne MAC

**Vérification** : Dans les logs console, vérifier que le champ s'appelle bien `texte-libre` :
```javascript
'texte-libre': 'valeur'
```

---

### 4. MAC (40 caractères hexadécimaux)

**❌ ERREUR COURANTE : MAC invalide ou longueur incorrecte**

- ✅ Le MAC doit faire **exactement 40 caractères**
- ✅ Format : **hexadécimal majuscules** (0-9, A-F)
- ✅ Calculé avec **HMAC-SHA1**

**Vérification** : Dans les logs console :
```javascript
MACLength: 40
macPreview: "A1B2C3D4E5F678901234..."
```

---

### 5. URL de TEST

**❌ ERREUR COURANTE : Utilisation de l'URL de production en test**

- ✅ URL de TEST : `https://p.monetico-services.com/test/paiement.cgi`
- ✅ URL de PRODUCTION : `https://paiement.monetico.fr/paiement.cgi`
- ✅ Vérifier que `MONETICO_ACTION_URL` pointe vers l'URL de TEST

**Vérification** : Dans les logs console :
```javascript
action: "https://p.monetico-services.com/test/paiement.cgi"
```

---

### 6. Chaîne MAC (ordre exact)

**❌ ERREUR COURANTE : Ordre incorrect ou séparateurs manquants**

La chaîne MAC doit être construite dans cet ordre EXACT :
```
<TPE>*<date>*<montant>*<reference>*<texte-libre>*<version>*<lgue>*<societe>*<mail>*
```

**Exemple** :
```
0917217*16/01/2026:16:00:06*20.99EUR*A1B2C3D4E5F6*CMDTEST*3.0*FR*VOTRE_SOCIETE*client@test.fr*
```

**Points importants** :
- ✅ Chaque champ séparé par `*`
- ✅ Astérisque final après `mail`
- ✅ Si `texte-libre` est vide, mettre quand même `*` (champ vide)
- ✅ Si `societe` est vide, mettre quand même `*` (champ vide) - **MAIS societe ne doit PAS être vide**

---

## 🔍 Comment vérifier dans la console

1. Ouvrir la console du navigateur (F12)
2. Cliquer sur "Payer (TEST Monetico)"
3. Vérifier les logs :
   ```javascript
   Monetico - FIELDS envoyés Monetico: {
     action: "https://p.monetico-services.com/test/paiement.cgi",
     TPE: "0917217",
     societe: "VOTRE_SOCIETE", // ⚠️ NE DOIT PAS ÊTRE VIDE
     version: "3.0",
     date: "16/01/2026:16:00:06",
     montant: "20.99EUR",
     reference: "A1B2C3D4E5F6", // ⚠️ 12 chars, A-Z0-9 uniquement
     "texte-libre": "CMDTEST", // ⚠️ Avec tiret, pas underscore
     lgue: "FR",
     mail: "client@test.fr",
     MAC: "A1B2C3D4E5F6789012345678901234567890AB", // ⚠️ 40 chars
     MACLength: 40,
     referenceLength: 12,
     referenceValid: true
   }
   ```

---

## 🐛 Si "Technical problem" persiste

1. ✅ Vérifier que `societe` n'est PAS vide dans les logs
2. ✅ Vérifier que `reference` fait 12 chars et est alphanumérique
3. ✅ Vérifier que le champ s'appelle `texte-libre` (avec tiret)
4. ✅ Vérifier que `MAC` fait 40 caractères
5. ✅ Vérifier que l'URL est bien l'URL de TEST
6. ✅ Vérifier que les identifiants sont ceux de TEST (pas production)
7. ✅ Vérifier la chaîne MAC dans les logs serveur (Cloudflare Dashboard → Logs)

---

## 📝 Configuration Cloudflare Dashboard

### Variables d'environnement (Settings → Environment Variables)

| Variable | Type | Preview | Production | Description |
|----------|------|---------|------------|-------------|
| `MONETICO_TPE` | Plain text | ✅ | ✅ | Numéro TPE |
| `MONETICO_SOCIETE` | Plain text | ✅ | ✅ | **Code société (OBLIGATOIRE, ne peut pas être vide)** |
| `MONETICO_ACTION_URL` | Plain text | ✅ | ✅ | URL Monetico (TEST ou PROD) |
| `MONETICO_CLE_HMAC` | **Secret** | ✅ | ✅ | Clé secrète HMAC |

**⚠️ IMPORTANT** : `MONETICO_SOCIETE` doit être configuré pour **Preview ET Production**, et ne peut PAS être vide.

---

## ✅ Checklist finale

- [ ] `MONETICO_SOCIETE` configuré dans Cloudflare Dashboard (Preview + Production)
- [ ] `MONETICO_SOCIETE` n'est PAS vide
- [ ] Référence fait 12 caractères (A-Z0-9 uniquement)
- [ ] Champ `texte-libre` avec tiret (pas underscore)
- [ ] MAC fait 40 caractères hexadécimaux
- [ ] URL pointe vers l'URL de TEST
- [ ] Identifiants sont ceux de TEST
- [ ] Redéployé après modifications
