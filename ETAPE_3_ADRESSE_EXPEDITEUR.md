# Étape 3 : Configurer l'adresse expéditeur

## 📍 Qu'est-ce que l'adresse expéditeur ?

L'adresse expéditeur est l'adresse de **votre entreprise** - c'est l'adresse d'où partent tous les colis que vous envoyez à vos clients.

## ✅ Instructions

### 1. Ouvrir le fichier .env.local

1. Dans votre éditeur de code (VS Code, etc.)
2. Ouvrez le fichier `.env.local` à la racine de votre projet
3. Si vous ne le voyez pas, il peut être masqué - utilisez Ctrl+P et tapez `.env.local`

### 2. Ajouter les variables d'adresse

Ajoutez ces lignes à la fin de votre fichier `.env.local` :

```env
# ============================================
# ADRESSE EXPÉDITEUR (Votre entreprise)
# ============================================

BOXTAL_FROM_FIRST_NAME=Votre
BOXTAL_FROM_LAST_NAME=Entreprise
BOXTAL_FROM_EMAIL=contact@votre-entreprise.com
BOXTAL_FROM_PHONE=+33612345678
BOXTAL_FROM_STREET=4 boulevard des Capucines
BOXTAL_FROM_CITY=Paris
BOXTAL_FROM_POSTAL_CODE=75009
BOXTAL_FROM_COUNTRY=FR
```

### 3. Remplacer par VOS vraies informations

**Remplacez chaque valeur** par les informations de votre entreprise :

- `BOXTAL_FROM_FIRST_NAME` : Prénom ou nom de l'entreprise
- `BOXTAL_FROM_LAST_NAME` : Nom de famille ou complément
- `BOXTAL_FROM_EMAIL` : Email de contact (ex: contact@monsite.com)
- `BOXTAL_FROM_PHONE` : Téléphone au format international (voir ci-dessous)
- `BOXTAL_FROM_STREET` : Numéro et nom de la rue (ex: "123 rue de la Paix")
- `BOXTAL_FROM_CITY` : Ville (ex: "Paris")
- `BOXTAL_FROM_POSTAL_CODE` : Code postal (ex: "75001")
- `BOXTAL_FROM_COUNTRY` : Code pays (FR pour France, BE pour Belgique, etc.)

### 4. Format du numéro de téléphone ⚠️ IMPORTANT

Le numéro de téléphone **DOIT** être au format international :

✅ **Correct :**
- `+33612345678` (France)
- `+32470123456` (Belgique)
- `+41791234567` (Suisse)

❌ **Incorrect :**
- `0612345678` (manque le +33)
- `06 12 34 56 78` (espaces interdits)
- `0033612345678` (utilisez +33, pas 0033)

**Comment convertir votre numéro :**
- Numéro français : `06 12 34 56 78` → `+33612345678`
- Enlevez le 0 initial
- Ajoutez le code pays avec un + (France = +33)
- Enlevez tous les espaces, points, tirets

### 5. Exemple complet

Voici un exemple avec de vraies valeurs :

```env
# ============================================
# ADRESSE EXPÉDITEUR (Votre entreprise)
# ============================================

BOXTAL_FROM_FIRST_NAME=Flash
BOXTAL_FROM_LAST_NAME=Spray
BOXTAL_FROM_EMAIL=contact@flashspray.com
BOXTAL_FROM_PHONE=+33612345678
BOXTAL_FROM_STREET=123 rue de la Paix
BOXTAL_FROM_CITY=Lyon
BOXTAL_FROM_POSTAL_CODE=69001
BOXTAL_FROM_COUNTRY=FR
```

### 6. Sauvegarder et redémarrer

1. **Sauvegardez** le fichier (Ctrl+S)
2. **Redémarrez votre serveur** :
   - Arrêtez le serveur (Ctrl+C dans le terminal)
   - Relancez-le : `npm run dev` ou `yarn dev`

## ✅ Vérification

Pour vérifier que tout est correct, vous pouvez :
1. Aller sur `/admin/boxtal/test`
2. Lancer le test de configuration
3. Si l'adresse est correcte, les tests devraient passer

## 🆘 Besoin d'aide ?

Si vous avez des questions sur :
- Le format du numéro de téléphone
- Le code pays à utiliser
- Comment remplir les champs

N'hésitez pas à demander !




