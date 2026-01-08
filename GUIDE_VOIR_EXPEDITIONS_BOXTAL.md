# Guide : Comment voir vos expéditions dans Boxtal

## 🎯 Objectif

Ce guide vous explique comment vérifier que vos expéditions sont bien créées dans Boxtal et où les trouver.

## 📍 Où voir vos expéditions

### 1. Dans votre interface admin (le plus simple)

1. Allez sur `/admin/boxtal/expeditions`
2. Vous verrez toutes vos commandes avec leurs expéditions
3. Les commandes avec le badge vert "Boxtal" ont une expédition créée
4. Vous verrez :
   - Le numéro de suivi
   - L'ID Boxtal
   - Le coût d'expédition
   - Le lien pour télécharger l'étiquette

### 2. Dans Supabase

1. Allez dans Supabase > Table Editor > `orders`
2. Trouvez votre commande
3. Vérifiez les colonnes :
   - `boxtal_created` = `true` → Expédition créée ✅
   - `shipping_tracking_number` → Numéro de suivi
   - `boxtal_order_id` → ID de la commande dans Boxtal
   - `shipping_label_url` → URL de l'étiquette

### 3. Dans Boxtal (selon l'environnement)

#### Si vous êtes en mode TEST

1. **Connectez-vous à votre compte Boxtal**
2. **Important** : Assurez-vous d'être sur l'environnement de **TEST** (pas production)
3. Allez dans "Mes expéditions" ou "Commandes"
4. Recherchez avec le numéro de suivi affiché dans `/admin/boxtal/expeditions`
5. Les expéditions créées depuis votre site y apparaîtront

**⚠️ Important** : Les expéditions de test ne sont **PAS visibles** dans l'interface de production Boxtal.

#### Si vous êtes en mode PRODUCTION

1. **Connectez-vous à votre compte Boxtal** (production)
2. Allez dans "Mes expéditions" ou "Commandes"
3. Recherchez avec le numéro de suivi
4. Les expéditions créées depuis votre site y apparaîtront

## 🔍 Comment vérifier que l'expédition est créée

### Méthode 1 : Interface admin (recommandé)

1. Allez sur `/admin/boxtal/expeditions`
2. Filtrez par "Avec Boxtal"
3. Si vous voyez vos commandes avec le badge vert "Boxtal", c'est que l'expédition est créée ✅

### Méthode 2 : Console du navigateur

1. Passez une commande test
2. Ouvrez la console (F12)
3. Cherchez les messages :
   - `✅ Expédition Boxtal créée avec succès` → Tout va bien !
   - `❌ Erreur création expédition Boxtal` → Il y a un problème

### Méthode 3 : Supabase

1. Allez dans Supabase > Table Editor > `orders`
2. Trouvez votre commande
3. Si `boxtal_created = true`, l'expédition est créée ✅

## ⚠️ Pourquoi je ne vois pas mes expéditions dans Boxtal ?

### Raison 1 : Vous êtes en mode TEST

**Symptôme** : Les expéditions sont créées (visible dans `/admin/boxtal/expeditions`) mais pas dans Boxtal

**Solution** :
- Vérifiez que vous êtes sur l'environnement de **TEST** dans Boxtal
- Les expéditions de test ne sont pas visibles dans l'interface de production
- Ou changez l'environnement en "Production" dans `/admin/boxtal-config`

### Raison 2 : Les expéditions ne sont pas créées

**Symptôme** : Pas de badge "Boxtal" sur les commandes dans `/admin/boxtal/expeditions`

**Vérifications** :
1. Ouvrez la console (F12) après avoir passé une commande
2. Regardez les messages d'erreur
3. Erreurs courantes :
   - "Clés API non configurées" → Configurez les clés dans `/admin/boxtal-config`
   - "Adresse incomplète" → Remplissez l'adresse dans le checkout
   - "Erreur Boxtal API" → Vérifiez vos clés API

### Raison 3 : Vous regardez le mauvais compte Boxtal

**Vérifications** :
1. Vérifiez que vous utilisez les bonnes clés API
2. Vérifiez que vous êtes connecté au bon compte Boxtal
3. Vérifiez l'environnement (test ou production)

## 📊 Vérifications étape par étape

### Étape 1 : Vérifier dans l'interface admin

1. Allez sur `/admin/boxtal/expeditions`
2. Regardez le nombre d'expéditions créées
3. Si c'est 0, les expéditions ne sont pas créées

### Étape 2 : Vérifier la configuration

1. Allez sur `/admin/boxtal-config`
2. Vérifiez :
   - Les clés API sont remplies
   - L'environnement est correct (test ou production)
   - Le code d'offre est correct

### Étape 3 : Tester manuellement

1. Allez sur `/admin/boxtal/test`
2. Testez la création d'une expédition
3. Regardez les résultats

### Étape 4 : Vérifier dans Boxtal

1. Connectez-vous à Boxtal
2. Vérifiez l'environnement (test ou production)
3. Recherchez avec le numéro de suivi affiché dans `/admin/boxtal/expeditions`

## ✅ Checklist

- [ ] Expéditions visibles dans `/admin/boxtal/expeditions` avec badge vert
- [ ] Numéro de suivi présent dans la commande
- [ ] ID Boxtal présent dans la commande
- [ ] Configuration Boxtal correcte (clés API, environnement, code d'offre)
- [ ] Environnement Boxtal vérifié (test ou production selon la config)
- [ ] Console du navigateur vérifiée (pas d'erreurs)

## 🆘 Si vous ne voyez toujours pas les expéditions

1. **Vérifiez dans `/admin/boxtal/expeditions`** : Si les expéditions apparaissent là, elles sont créées
2. **Vérifiez l'environnement** : Assurez-vous d'être sur le bon environnement dans Boxtal
3. **Vérifiez les clés API** : Utilisez les bonnes clés pour l'environnement (test ou production)
4. **Contactez le support Boxtal** : Si les expéditions sont créées mais pas visibles, contactez Boxtal avec le numéro de suivi

## 💡 Astuce

**Le meilleur moyen de vérifier** : Utilisez `/admin/boxtal/expeditions`. Si vous voyez le badge vert "Boxtal" et le numéro de suivi, l'expédition est créée avec succès, même si vous ne la voyez pas dans l'interface Boxtal (peut être un problème d'environnement ou de compte).






