# ⚡ Guide de Configuration Rapide : Supabase

## 🚨 Problème : "Supabase non configuré. Impossible de se connecter."

Si vous voyez ce message, c'est que le fichier `.env.local` n'existe pas ou n'est pas correctement configuré.

## ✅ Solution en 5 minutes

### Étape 1 : Créer le fichier `.env.local`

1. **À la racine de votre projet** (même niveau que `package.json`)
2. Créez un nouveau fichier nommé exactement : **`.env.local`**
   - ⚠️ Le nom doit commencer par un point (`.`)
   - ⚠️ Pas d'espace avant ou après le nom

### Étape 2 : Récupérer vos clés Supabase

1. Allez sur **https://supabase.com/dashboard**
2. Connectez-vous à votre compte
3. Sélectionnez votre projet (ou créez-en un nouveau)
4. Allez dans **Settings** (⚙️) > **API**
5. Vous verrez deux informations importantes :
   - **Project URL** (commence par `https://`)
   - **anon/public key** (commence par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

### Étape 3 : Configurer le fichier `.env.local`

Ouvrez le fichier `.env.local` que vous venez de créer et ajoutez ces lignes :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Remplacez** :
- `https://votre-projet.supabase.co` par votre **Project URL** (copiée depuis Supabase)
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` par votre **anon/public key** (copiée depuis Supabase)

**Exemple** (avec de vraies valeurs) :
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

### Étape 4 : Redémarrer le serveur

**⚠️ TRÈS IMPORTANT** : Après avoir créé/modifié `.env.local`, vous DEVEZ redémarrer le serveur !

1. Dans le terminal où tourne `npm run dev`, appuyez sur **Ctrl+C** pour arrêter
2. Relancez avec : **`npm run dev`**
3. Attendez que le serveur démarre complètement
4. Rechargez votre navigateur

### Étape 5 : Vérifier que ça fonctionne

1. Allez sur **`/admin/supabase-test`** dans votre navigateur
2. Vous devriez voir tous les tests en vert (✅)
3. Si vous voyez des erreurs, vérifiez que vous avez bien copié les clés sans espaces

## 🔍 Vérifications rapides

### ✅ Le fichier `.env.local` est bien créé ?
- Le fichier doit être à la racine du projet (même niveau que `package.json`)
- Le nom doit être exactement `.env.local` (avec le point au début)
- Pas d'extension `.txt` ou autre

### ✅ Les variables sont correctes ?
- `NEXT_PUBLIC_SUPABASE_URL` doit commencer par `https://`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` doit commencer par `eyJ...`
- Pas d'espaces avant ou après le `=`
- Pas de guillemets autour des valeurs

### ✅ Le serveur a été redémarré ?
- Après modification de `.env.local`, le serveur DOIT être redémarré
- Les variables d'environnement ne sont chargées qu'au démarrage

## 🆘 Si ça ne fonctionne toujours pas

### 1. Vérifier la console du navigateur
- Appuyez sur **F12** pour ouvrir les outils de développement
- Allez dans l'onglet **Console**
- Regardez les erreurs affichées

### 2. Vérifier les logs du serveur
- Dans le terminal où tourne `npm run dev`
- Cherchez les messages d'erreur (en rouge ❌)

### 3. Vérifier que votre projet Supabase est actif
- Allez sur https://supabase.com/dashboard
- Vérifiez que votre projet n'est pas en pause
- Si c'est le cas, réactivez-le

### 4. Tester la connexion Supabase
- Allez sur `/admin/supabase-test`
- Regardez quels tests échouent
- Suivez les instructions pour chaque test qui échoue

## 📋 Checklist

- [ ] Fichier `.env.local` créé à la racine du projet
- [ ] `NEXT_PUBLIC_SUPABASE_URL` défini avec votre URL Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` défini avec votre clé anon
- [ ] Pas d'espaces avant/après les `=`
- [ ] Serveur redémarré après modification
- [ ] Test `/admin/supabase-test` montre tous les tests en vert

## 💡 Astuce

Si vous avez un fichier `.env.local.example`, vous pouvez :
1. Le copier : `copy .env.local.example .env.local` (Windows) ou `cp .env.local.example .env.local` (Mac/Linux)
2. Ouvrir `.env.local` et remplacer les valeurs par vos vraies clés

## ✅ Une fois configuré

Après avoir configuré Supabase et redémarré le serveur :
- ✅ Vous pourrez vous connecter en tant que client
- ✅ Vous pourrez vous connecter en tant qu'admin
- ✅ Les gammes s'afficheront correctement
- ✅ Toutes les fonctionnalités fonctionneront

---

**Besoin d'aide ?** Consultez aussi `GUIDE_DIAGNOSTIC_CONNEXION_SUPABASE.md` pour plus de détails.



