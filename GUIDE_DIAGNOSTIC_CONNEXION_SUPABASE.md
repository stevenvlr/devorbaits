# 🔍 Guide de Diagnostic : Problèmes de Connexion Supabase

## 🎯 Objectif

Ce guide vous aide à diagnostiquer et résoudre les problèmes de connexion à Supabase, notamment pour l'authentification et l'affichage des gammes.

## ⚡ Diagnostic Rapide

### Étape 1 : Vérifier la configuration Supabase

1. Allez sur `/admin/supabase-test` dans votre navigateur
2. Regardez les résultats des tests
3. Si vous voyez "Supabase n'est pas configuré", passez à l'étape 2

### Étape 2 : Vérifier le fichier `.env.local`

1. À la racine de votre projet (même niveau que `package.json`)
2. Ouvrez ou créez le fichier `.env.local`
3. Vérifiez qu'il contient :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important** : Remplacez `votre-projet` et `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` par vos vraies valeurs !

### Étape 3 : Récupérer vos clés Supabase

1. Allez sur https://supabase.com/dashboard
2. Connectez-vous à votre compte
3. Sélectionnez votre projet
4. Allez dans **Settings** (⚙️) > **API**
5. Copiez :
   - **Project URL** → collez dans `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → collez dans `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Étape 4 : Redémarrer le serveur

**CRUCIAL** : Après avoir modifié `.env.local`, vous DEVEZ redémarrer le serveur :

1. Arrêtez le serveur : `Ctrl+C` dans le terminal
2. Relancez : `npm run dev`
3. Attendez que le serveur démarre complètement
4. Rechargez la page `/admin/supabase-test`

## 🔴 Problèmes Courants et Solutions

### Problème 1 : "Supabase non configuré"

**Symptômes** :
- Message "Supabase non configuré" partout
- Impossible de se connecter
- Les gammes ne s'affichent pas

**Solutions** :
1. Vérifiez que `.env.local` existe à la racine du projet
2. Vérifiez que les variables commencent par `NEXT_PUBLIC_`
3. Vérifiez qu'il n'y a pas d'espaces avant/après les `=`
4. Redémarrez le serveur après modification

### Problème 2 : "Erreur de clé API" ou "Invalid API key"

**Symptômes** :
- Message d'erreur mentionnant "API key" ou "apikey"
- Erreur d'authentification

**Solutions** :
1. Vérifiez que vous avez copié la **clé anon/public** (pas la clé service_role)
2. Vérifiez qu'il n'y a pas d'espaces ou de retours à la ligne dans la clé
3. La clé doit commencer par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
4. Vérifiez que votre projet Supabase est actif (pas en pause)

### Problème 3 : "Table 'gammes' n'existe pas"

**Symptômes** :
- Les gammes ne s'affichent pas
- Erreur "relation does not exist" ou "42P01"

**Solutions** :
1. Allez dans Supabase Dashboard > **SQL Editor**
2. Exécutez ce script :

```sql
CREATE TABLE IF NOT EXISTS gammes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE gammes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gammes"
  ON gammes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage gammes"
  ON gammes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer les gammes par défaut
INSERT INTO gammes (name)
VALUES 
  ('Méga Tutti'),
  ('Krill Calamar'),
  ('Red Devil'),
  ('Robin Red Vers de vase'),
  ('Mure Cassis'),
  ('Thon Curry')
ON CONFLICT (name) DO NOTHING;
```

### Problème 4 : "Table 'profiles' n'existe pas"

**Symptômes** :
- Impossible de se connecter
- Erreur lors de la création de compte

**Solutions** :
1. Allez dans Supabase Dashboard > **SQL Editor**
2. Exécutez le script `supabase-schema.sql` qui crée toutes les tables nécessaires
3. Vérifiez que la table `profiles` existe dans **Table Editor**

### Problème 5 : "Erreur de connexion" lors de la connexion

**Symptômes** :
- Le formulaire de connexion ne fonctionne pas
- Message "Email ou mot de passe incorrect" même avec les bons identifiants

**Solutions** :
1. Vérifiez que Supabase est bien configuré (test `/admin/supabase-test`)
2. Vérifiez que la table `profiles` existe
3. Vérifiez que votre compte existe dans Supabase :
   - Allez dans **Authentication** > **Users**
   - Vérifiez que votre email est présent
4. Si besoin, réinitialisez votre mot de passe depuis Supabase

## 🧪 Tests à Effectuer

### Test 1 : Configuration de base

1. Allez sur `/admin/supabase-test`
2. Vérifiez que tous les tests passent (✅ vert)
3. Si des tests échouent, suivez les instructions ci-dessus

### Test 2 : Authentification

1. Allez sur `/account/login`
2. Essayez de vous connecter avec un compte existant
3. Si ça ne fonctionne pas :
   - Ouvrez la console du navigateur (F12)
   - Regardez les erreurs affichées
   - Vérifiez les logs du serveur dans le terminal

### Test 3 : Affichage des gammes

1. Allez sur `/categories/bouillettes`
2. Vérifiez que les gammes s'affichent
3. Si elles ne s'affichent pas :
   - Vérifiez que la table `gammes` existe (test `/admin/supabase-test`)
   - Vérifiez que des gammes sont présentes dans Supabase

## 📋 Checklist de Vérification

- [ ] Le fichier `.env.local` existe à la racine du projet
- [ ] `NEXT_PUBLIC_SUPABASE_URL` est défini et commence par `https://`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` est défini et commence par `eyJ...`
- [ ] Le serveur a été redémarré après modification de `.env.local`
- [ ] Le test `/admin/supabase-test` montre tous les tests en vert
- [ ] La table `gammes` existe dans Supabase
- [ ] La table `profiles` existe dans Supabase
- [ ] Les politiques RLS (Row Level Security) sont configurées

## 🆘 Aide Supplémentaire

### Console du Navigateur

1. Ouvrez la console (F12)
2. Regardez l'onglet **Console** pour les erreurs
3. Regardez l'onglet **Network** pour les requêtes échouées

### Logs du Serveur

Dans le terminal où tourne `npm run dev`, cherchez :
- ❌ Messages d'erreur Supabase
- ⚠️ Messages d'avertissement
- ✅ Messages de succès

### Support Supabase

Si le problème persiste :
1. Vérifiez la documentation Supabase : https://supabase.com/docs
2. Vérifiez le statut de Supabase : https://status.supabase.com
3. Contactez le support Supabase si nécessaire

## ✅ Résumé

**Pour que Supabase fonctionne, vous devez :**

1. ✅ Avoir un fichier `.env.local` avec les bonnes variables
2. ✅ Avoir redémarré le serveur après modification
3. ✅ Avoir créé les tables nécessaires dans Supabase
4. ✅ Avoir configuré les politiques RLS correctement

Si tout est fait et que ça ne fonctionne toujours pas, vérifiez la console du navigateur et les logs du serveur pour plus de détails.



