# Configuration Monetico

## Variables d'environnement requises

Créez un fichier `.env.local` à la racine du projet avec les informations suivantes :

```env
# Configuration Monetico
# Obtenez ces informations depuis votre compte Monetico

# Numéro de TPE (Terminal de Paiement Électronique)
NEXT_PUBLIC_MONETICO_TPE=votre_numero_tpe

# Code société Monetico
NEXT_PUBLIC_MONETICO_SOCIETE=votre_code_societe

# URL de retour après paiement (succès ou erreur)
# Remplacez par votre nom de domaine
NEXT_PUBLIC_MONETICO_URL_RETOUR=https://votre-site.com/payment/success
NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR=https://votre-site.com/payment/error

# URL de l'API Monetico (généralement ne pas modifier)
NEXT_PUBLIC_MONETICO_URL=https://paiement.monetico.fr/paiement.cgi
```

## ⚠️ Important - Sécurité

La clé secrète Monetico (MAC key) ne doit **JAMAIS** être exposée côté client.

✅ **La génération de la signature MAC est déjà implémentée côté serveur** via l'API route `/api/monetico/signature`.

Ajoutez votre clé secrète dans `.env.local` :
```env
MONETICO_CLE_SECRETE=votre_cle_secrete_monetico
```

## Configuration dans Monetico

1. Connectez-vous à votre espace Monetico
2. Configurez les URLs de retour :
   - URL de retour OK : `https://votre-site.com/payment/success`
   - URL de retour ERREUR : `https://votre-site.com/payment/error`
3. Notez votre numéro de TPE et code société

## Test

Monetico fournit un environnement de test. Utilisez les identifiants de test pour valider l'intégration avant la mise en production.

## Pages créées

- `/payment/success` - Page de retour en cas de succès
- `/payment/error` - Page de retour en cas d'erreur/annulation

