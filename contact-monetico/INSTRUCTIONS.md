# Instructions pour Envoyer les Fichiers à Monetico

## 📦 Contenu du Dossier

Ce dossier contient tous les fichiers nécessaires pour la vérification de votre implémentation Monetico :

1. **README_MONETICO.md** - Document explicatif complet
2. **monetico-route.ts** - Code de génération du paiement et calcul du MAC
3. **monetico-retour-route.ts** - Code de vérification du retour Monetico
4. **INSTRUCTIONS.md** - Ce fichier

---

## 📧 Comment Envoyer à Monetico

### Option 1 : Par Email (Recommandé)

1. **Créer un ZIP** avec tous les fichiers du dossier `contact-monetico`
2. **Joindre le ZIP** à votre email
3. **Sujet de l'email** : "Vérification Implémentation Monetico v3.0 - Code Source"
4. **Corps de l'email** :

```
Bonjour,

Veuillez trouver ci-joint le code source de notre implémentation Monetico v3.0 pour vérification.

Le dossier contient :
- README_MONETICO.md : Documentation complète de l'implémentation
- monetico-route.ts : Code de génération du paiement et calcul du MAC
- monetico-retour-route.ts : Code de vérification du retour Monetico

Notre implémentation utilise :
- Framework : Next.js 15 avec Edge Runtime (Cloudflare Pages)
- API Cryptographique : WebCrypto API
- Version Monetico : 3.0

Merci de vérifier la conformité avec votre documentation.

Cordialement,
[Votre nom]
```

### Option 2 : Via leur Portail (si disponible)

1. **Créer un ZIP** avec tous les fichiers
2. **Téléverser** le ZIP sur leur portail de support
3. **Référencer** le numéro de ticket si vous en avez un

### Option 3 : Document Partagé

1. **Créer un document** (Google Docs, OneDrive, etc.)
2. **Copier le contenu** de README_MONETICO.md
3. **Ajouter les fichiers de code** en pièces jointes
4. **Partager le lien** avec Monetico

---

## ✅ Checklist Avant Envoi

- [ ] Tous les fichiers sont présents dans le dossier
- [ ] Le README_MONETICO.md est complet
- [ ] Les fichiers de code sont à jour
- [ ] Aucune clé secrète n'est exposée dans les fichiers
- [ ] Le ZIP est créé et testé

---

## 🔒 Sécurité

**IMPORTANT** : 
- ✅ Les clés secrètes (MONETICO_CLE_HMAC) ne sont PAS dans les fichiers
- ✅ Elles sont stockées en variables d'environnement serveur uniquement
- ✅ Aucune information sensible n'est exposée

---

## 📞 Support

Si Monetico a des questions après réception des fichiers, ils peuvent vous contacter directement.

---

**Date de création** : Janvier 2026  
**Version** : 1.0
