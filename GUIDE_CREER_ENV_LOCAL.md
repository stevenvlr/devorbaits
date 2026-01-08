# Guide : Créer le fichier .env.local

## 🎯 Objectif

Ce guide vous explique comment créer le fichier `.env.local` pour résoudre l'erreur de paiement Monetico.

## ⚡ Solution rapide : Mode test

Pour tester rapidement sans configurer Monetico :

### 1. Créer le fichier `.env.local`

1. À la racine de votre projet (même niveau que `package.json`)
2. Créez un nouveau fichier nommé exactement : `.env.local`
3. Ajoutez cette ligne dans le fichier :

```env
NEXT_PUBLIC_TEST_PAYMENT=true
```

### 2. Redémarrer le serveur

1. Arrêtez votre serveur Next.js (Ctrl+C dans le terminal)
2. Relancez-le : `npm run dev`

### 3. Tester

Essayez de passer une commande - cela devrait fonctionner sans Monetico !

## 📝 Fichier .env.local complet (si vous avez Supabase)

Si vous avez déjà configuré Supabase, votre `.env.local` devrait ressembler à ça :

```env
# Mode test de paiement (pour tester sans Monetico)
NEXT_PUBLIC_TEST_PAYMENT=true

# Configuration Supabase (si vous l'avez déjà)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
```

## 🔧 Si vous voulez utiliser Monetico plus tard

Quand vous serez prêt à utiliser Monetico, ajoutez ces lignes dans `.env.local` :

```env
# Désactiver le mode test
NEXT_PUBLIC_TEST_PAYMENT=false

# Configuration Monetico
NEXT_PUBLIC_MONETICO_TPE=votre_numero_tpe
NEXT_PUBLIC_MONETICO_SOCIETE=votre_code_societe
NEXT_PUBLIC_MONETICO_URL_RETOUR=https://votre-site.com/payment/success
NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR=https://votre-site.com/payment/error
MONETICO_CLE_SECRETE=votre_cle_secrete_monetico
```

## ⚠️ Important

- Le fichier `.env.local` ne doit **JAMAIS** être commité dans Git
- Il doit être à la racine du projet (même niveau que `package.json`)
- Après modification, **redémarrez toujours le serveur**

## ✅ Vérifier que ça fonctionne

1. Créez le fichier `.env.local` avec `NEXT_PUBLIC_TEST_PAYMENT=true`
2. Redémarrez le serveur
3. Essayez de passer une commande
4. Si ça fonctionne, vous verrez "Paiement test réussi" au lieu de l'erreur Monetico

## 🆘 Problèmes courants

**Le fichier ne semble pas fonctionner**
- Vérifiez que le fichier s'appelle exactement `.env.local` (avec le point au début)
- Vérifiez qu'il est à la racine du projet
- Redémarrez le serveur après modification

**L'erreur persiste**
- Vérifiez la console du navigateur (F12) pour voir les nouveaux messages d'erreur
- Vérifiez les logs du serveur dans le terminal






