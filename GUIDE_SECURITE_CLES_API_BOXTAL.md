# 🔒 Guide de Sécurité : Clés API Boxtal

## ⚠️ Problème de sécurité identifié et corrigé

**AVANT** : Les clés API utilisaient le préfixe `NEXT_PUBLIC_` qui les exposait côté client (navigateur).

**MAINTENANT** : Les clés API sont sécurisées et ne sont jamais exposées au client.

## ✅ Configuration sécurisée

### Méthode recommandée : Configuration dans Supabase

La méthode la plus sécurisée est de stocker les clés dans Supabase via l'interface admin :

1. Allez sur `/admin/boxtal-config`
2. Entrez vos clés API Boxtal
3. Les clés sont stockées dans Supabase (base de données sécurisée)
4. **Les clés ne sont jamais exposées au client**

### Méthode alternative : Variables d'environnement serveur

Si vous préférez utiliser des variables d'environnement, utilisez **UNIQUEMENT** des variables serveur (sans `NEXT_PUBLIC_`) :

```env
# ✅ CORRECT - Variables serveur uniquement (sécurisées)
BOXTAL_API_KEY=votre_access_key_ici
BOXTAL_API_SECRET=votre_secret_key_ici
BOXTAL_ENV=test

# ❌ INCORRECT - Ne jamais utiliser NEXT_PUBLIC_ pour les clés secrètes !
# NEXT_PUBLIC_BOXTAL_API_KEY=...  ← DANGEREUX !
# NEXT_PUBLIC_BOXTAL_API_SECRET=...  ← DANGEREUX !
```

**Pourquoi ?**
- Les variables avec `NEXT_PUBLIC_` sont incluses dans le bundle JavaScript
- Elles sont visibles dans le code source du navigateur
- N'importe qui peut les voir et les utiliser

## 🔐 Comment ça fonctionne maintenant

1. **Priorité 1** : Les clés sont récupérées depuis Supabase (via `/admin/boxtal-config`)
2. **Priorité 2** : Si non trouvées, utilisation des variables serveur (`BOXTAL_API_KEY`, `BOXTAL_API_SECRET`)
3. **Sécurité** : Les clés ne sont jamais exposées au client

## 📋 Checklist de sécurité

- [ ] Les clés API sont configurées dans `/admin/boxtal-config` (recommandé)
- [ ] OU les variables d'environnement utilisent `BOXTAL_API_KEY` (sans `NEXT_PUBLIC_`)
- [ ] Aucune variable `NEXT_PUBLIC_BOXTAL_API_SECRET` dans `.env.local`
- [ ] Le fichier `.env.local` est dans `.gitignore` (ne pas commiter les clés)
- [ ] Les clés de production sont différentes des clés de test

## 🚨 Si vous avez utilisé NEXT_PUBLIC_ auparavant

Si vous aviez configuré les clés avec `NEXT_PUBLIC_` dans `.env.local` :

1. **Supprimez** les lignes avec `NEXT_PUBLIC_BOXTAL_API_KEY` et `NEXT_PUBLIC_BOXTAL_API_SECRET`
2. **Ajoutez** les variables serveur (sans `NEXT_PUBLIC_`) :
   ```env
   BOXTAL_API_KEY=votre_cle
   BOXTAL_API_SECRET=votre_secret
   BOXTAL_ENV=test
   ```
3. **Redémarrez** le serveur (`npm run dev`)
4. **Recommandé** : Régénérez vos clés API dans votre compte Boxtal (par sécurité)

## ✅ Vérification

Pour vérifier que les clés sont bien sécurisées :

1. Ouvrez votre site dans le navigateur
2. Ouvrez les outils de développement (F12)
3. Allez dans l'onglet "Sources" ou "Network"
4. Cherchez dans le code JavaScript compilé
5. **Vous ne devriez PAS trouver vos clés API** dans le code

## 📝 Notes importantes

- ⚠️ **Ne jamais commiter** le fichier `.env.local` dans Git
- ⚠️ **Ne jamais partager** vos clés API publiquement
- ✅ **Utilisez Supabase** pour stocker les clés (plus sécurisé)
- ✅ **Les routes API** (`/api/boxtal/*`) sont sécurisées côté serveur

## 🔧 Migration depuis NEXT_PUBLIC_

Si vous avez un fichier `.env.local` avec les anciennes variables :

```env
# ❌ À SUPPRIMER
NEXT_PUBLIC_BOXTAL_API_KEY=...
NEXT_PUBLIC_BOXTAL_API_SECRET=...

# ✅ À AJOUTER
BOXTAL_API_KEY=...
BOXTAL_API_SECRET=...
BOXTAL_ENV=test
```

Puis redémarrez le serveur.



