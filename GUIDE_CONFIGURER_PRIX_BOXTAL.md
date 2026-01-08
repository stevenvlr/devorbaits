# Guide : Configurer les Prix d'Expédition dans Boxtal

## 📋 Vue d'ensemble

Ce guide vous explique comment configurer les tarifs d'expédition dans votre compte Boxtal pour que les prix varient selon le poids, la destination, etc.

## 🔑 Étape 1 : Se connecter à votre compte Boxtal

1. Allez sur [www.boxtal.com](https://www.boxtal.com)
2. Cliquez sur **"Se connecter"** en haut à droite
3. Entrez vos identifiants (email et mot de passe)
4. Cliquez sur **"Connexion"**

## 📦 Étape 2 : Accéder à la gestion des offres

1. Une fois connecté, allez dans votre **espace client**
2. Cherchez le menu **"Offres"** ou **"Tarifs"** ou **"Configuration"**
3. Cliquez sur **"Mes offres"** ou **"Gérer les offres"**

> 💡 **Note** : L'emplacement exact peut varier selon votre interface Boxtal. Cherchez les sections liées aux "Offres", "Tarifs", "Transporteurs" ou "Services".

## 🎯 Étape 3 : Créer ou modifier une offre de transport

### Option A : Créer une nouvelle offre

1. Cliquez sur **"Nouvelle offre"** ou **"Créer une offre"**
2. Choisissez un **transporteur** (ex: Mondial Relay, Colissimo, DHL, etc.)
3. Donnez un **nom à votre offre** (ex: "Livraison Standard")
4. Notez le **code de l'offre** (ex: "MONR-CpourToi") - vous en aurez besoin pour votre application

### Option B : Modifier une offre existante

1. Trouvez votre offre dans la liste (ex: "MONR-CpourToi")
2. Cliquez sur **"Modifier"** ou **"Paramètres"**

## 💰 Étape 4 : Configurer les tarifs selon le poids

### Méthode 1 : Tarifs par tranches de poids (Recommandé)

1. Dans les paramètres de l'offre, cherchez **"Tarifs"** ou **"Prix"**
2. Activez **"Tarifs variables selon le poids"** si disponible
3. Configurez les tranches de poids :

```
Exemple de configuration :
- 0 à 0.5 kg    → 4.50 €
- 0.5 à 1 kg    → 5.50 €
- 1 à 2 kg      → 6.50 €
- 2 à 5 kg      → 8.50 €
- 5 à 10 kg     → 12.50 €
- Plus de 10 kg → 15.50 €
```

4. Cliquez sur **"Enregistrer"** ou **"Valider"**

### Méthode 2 : Tarif fixe + supplément par kg

1. Définissez un **prix de base** (ex: 5.00 €)
2. Définissez un **prix par kg supplémentaire** (ex: 1.50 €/kg)
3. Exemple : 
   - 0.5 kg = 5.00 €
   - 1 kg = 5.00 + (0.5 × 1.50) = 5.75 €
   - 2 kg = 5.00 + (1.5 × 1.50) = 7.25 €

### Méthode 3 : Tarif fixe (Simple mais moins flexible)

1. Définissez un **prix unique** pour tous les envois
2. ⚠️ **Attention** : Tous les colis auront le même prix, peu importe le poids

## 🌍 Étape 5 : Configurer les tarifs selon la destination (Optionnel)

1. Cherchez **"Zones géographiques"** ou **"Destinations"**
2. Configurez des tarifs différents selon :
   - **France métropolitaine** : Prix standard
   - **DOM-TOM** : Prix majoré
   - **Europe** : Prix international
   - **Autres pays** : Prix international majoré

## 📊 Étape 6 : Configurer les tarifs selon les dimensions (Optionnel)

Certaines offres permettent de configurer des tarifs selon les dimensions du colis :

1. Cherchez **"Dimensions"** ou **"Taille du colis"**
2. Configurez des tarifs pour :
   - **Petit colis** (ex: < 30x20x15 cm) : Prix réduit
   - **Colis moyen** (ex: 30-40x20-30x15-25 cm) : Prix standard
   - **Gros colis** (ex: > 40x30x25 cm) : Prix majoré

## ✅ Étape 7 : Activer et tester l'offre

1. Vérifiez que l'offre est **activée** ou **active**
2. Notez le **code de l'offre** (ex: "MONR-CpourToi")
3. Testez avec différents poids dans votre application

## 🔧 Étape 8 : Configurer l'offre dans votre application

1. Ouvrez votre fichier `.env.local`
2. Ajoutez ou modifiez la ligne :

```env
BOXTAL_SHIPPING_OFFER_CODE=MONR-CpourToi
```

> ⚠️ **Important** : Remplacez `MONR-CpourToi` par le code réel de votre offre configurée dans Boxtal.

3. Redémarrez votre serveur Next.js

## 🧪 Étape 9 : Tester les tarifs

1. Allez sur votre page de checkout (`/checkout`)
2. Ajoutez des produits au panier
3. Sélectionnez **"Livraison à domicile"**
4. Remplissez une adresse
5. Observez le prix d'expédition qui s'affiche
6. Ajoutez ou retirez des produits pour voir si le prix change

### Vérifier dans la console

1. Ouvrez la console du navigateur (F12)
2. Regardez les logs :
   - `🛒 Calcul expédition` : Poids calculé
   - `📦 Estimation Boxtal` : Données envoyées à Boxtal
   - `💰 Prix Boxtal calculé` : Prix retourné par Boxtal

## 📝 Exemple de configuration complète

### Configuration dans Boxtal :

**Offre : "Livraison Standard"**
- Code : `MONR-STANDARD`
- Transporteur : Mondial Relay
- Tarifs par poids :
  - 0-0.5 kg : 4.50 €
  - 0.5-1 kg : 5.50 €
  - 1-2 kg : 6.50 €
  - 2-5 kg : 8.50 €
  - 5-10 kg : 12.50 €
  - +10 kg : 15.50 €

### Configuration dans `.env.local` :

```env
BOXTAL_SHIPPING_OFFER_CODE=MONR-STANDARD
```

## ⚠️ Problèmes courants et solutions

### Le prix ne change pas selon le poids

**Causes possibles :**
1. L'offre a un tarif fixe configuré
2. Les tranches de poids sont trop larges
3. Le code d'offre utilisé n'est pas celui avec les tarifs variables

**Solutions :**
1. Vérifiez dans Boxtal que l'offre a des tarifs variables
2. Créez une nouvelle offre avec des tarifs par tranches de poids
3. Vérifiez que `BOXTAL_SHIPPING_OFFER_CODE` correspond au bon code

### Le prix est toujours 0 €

**Causes possibles :**
1. L'offre n'est pas activée dans Boxtal
2. Les clés API ne sont pas correctes
3. L'offre n'existe pas

**Solutions :**
1. Vérifiez que l'offre est active dans Boxtal
2. Testez vos clés API sur `/admin/boxtal/test`
3. Vérifiez que le code d'offre est correct

### Le prix est trop élevé ou trop bas

**Solutions :**
1. Ajustez les tarifs dans Boxtal
2. Vérifiez que vous utilisez la bonne offre
3. Testez avec différents poids pour valider les tarifs

## 📞 Besoin d'aide ?

### Support Boxtal

- **Documentation** : [developer.boxtal.com](https://developer.boxtal.com)
- **Support** : Contactez le support Boxtal depuis votre espace client
- **FAQ** : Consultez la FAQ sur le site Boxtal

### Vérifier votre configuration

1. Testez votre configuration : `/admin/boxtal/test`
2. Vérifiez les logs dans la console du navigateur
3. Vérifiez les logs du serveur Next.js

## ✅ Checklist de configuration

- [ ] Compte Boxtal créé et actif
- [ ] Offre de transport créée dans Boxtal
- [ ] Tarifs configurés selon le poids (ou fixe si souhaité)
- [ ] Code de l'offre noté
- [ ] Code de l'offre ajouté dans `.env.local`
- [ ] Serveur redémarré
- [ ] Test effectué avec différents poids
- [ ] Prix d'expédition affiché correctement dans le checkout

## 🎯 Résultat attendu

Après configuration, vous devriez voir :
- ✅ Le prix d'expédition varie selon le poids des produits
- ✅ Le prix s'affiche correctement dans le résumé de commande
- ✅ Le prix est inclus dans le total final
- ✅ Le prix réel de Boxtal est utilisé (pas un prix fixe)






