# Guide : Configuration PayPal

Ce guide explique comment configurer PayPal pour permettre les paiements par PayPal en plus des paiements par carte bleue (Monetico).

## 📋 Prérequis

- Un compte PayPal Business (ou Developer)
- Les identifiants de l'application PayPal (Client ID et Secret)

## 🔧 Configuration

### 1. Créer une application PayPal (Mode Test)

1. Connectez-vous à [PayPal Developer](https://developer.paypal.com/)
2. Allez dans **Dashboard** > **My Apps & Credentials**
3. Cliquez sur **Create App**
4. Remplissez les informations :
   - **App Name** : Nom de votre application (ex: "Boutique Pêche Carpe")
   - **Merchant** : Votre compte PayPal Business
   - **Features** : Cochez **Accept Payments**
5. Cliquez sur **Create App**

### 2. Récupérer les identifiants

Après la création de l'application, vous verrez :
- **Client ID** : Identifiant public (commence par `A...`)
- **Secret** : Clé secrète (à ne jamais exposer publiquement)

### 3. Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Configuration PayPal (Mode Test - Sandbox)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=votre_client_id_ici
PAYPAL_SECRET=votre_secret_ici
NEXT_PUBLIC_PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

# URL de votre site (pour les retours PayPal)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# En production, remplacez par : https://votre-site.com
```

### 4. Mode Production

Pour passer en mode production :

1. Créez une nouvelle application dans PayPal Developer
2. Sélectionnez **Live** au lieu de **Sandbox**
3. Mettez à jour les variables d'environnement :

```env
# Configuration PayPal (Mode Production)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=votre_client_id_production
PAYPAL_SECRET=votre_secret_production
NEXT_PUBLIC_PAYPAL_BASE_URL=https://api-m.paypal.com

NEXT_PUBLIC_SITE_URL=https://votre-site.com
```

## ✅ Vérification

1. Redémarrez votre serveur Next.js (`npm run dev`)
2. Allez sur la page de checkout
3. Vous devriez voir deux options de paiement :
   - **Carte bleue** (Monetico)
   - **PayPal**

## 🧪 Test

### Comptes de test PayPal

En mode sandbox, vous pouvez utiliser ces comptes de test :

**Acheteur :**
- Email : `sb-buyer@business.example.com`
- Mot de passe : Créé lors de la création de l'application

**Vendeur :**
- Email : `sb-seller@business.example.com`
- Mot de passe : Créé lors de la création de l'application

### Tester un paiement

1. Ajoutez des produits au panier
2. Allez sur la page de checkout
3. Sélectionnez **PayPal** comme mode de paiement
4. Cliquez sur le bouton PayPal
5. Connectez-vous avec un compte PayPal de test
6. Confirmez le paiement

## ⚠️ Important - Sécurité

- **NE JAMAIS** exposer le `PAYPAL_SECRET` côté client
- Le secret est utilisé uniquement côté serveur dans les routes API
- Vérifiez que votre fichier `.env.local` est dans `.gitignore`

## 🔍 Dépannage

### Le bouton PayPal n'apparaît pas

- Vérifiez que `NEXT_PUBLIC_PAYPAL_CLIENT_ID` est bien configuré
- Vérifiez que le serveur a été redémarré après l'ajout des variables
- Vérifiez la console du navigateur pour les erreurs

### Erreur "PayPal non configuré"

- Vérifiez que `PAYPAL_SECRET` est bien dans `.env.local`
- Vérifiez que les routes API `/api/paypal/*` fonctionnent
- Vérifiez les logs du serveur pour plus de détails

### Le paiement échoue

- Vérifiez que vous utilisez les bons identifiants (sandbox vs production)
- Vérifiez que `NEXT_PUBLIC_SITE_URL` est correctement configuré
- Vérifiez les logs PayPal dans votre dashboard

## 📝 Notes

- Les paiements PayPal sont traités de manière asynchrone
- Les commandes sont créées automatiquement après confirmation du paiement
- Les expéditions Boxtal sont créées automatiquement pour les livraisons
