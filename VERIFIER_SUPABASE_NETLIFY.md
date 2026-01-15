# Vérifier la configuration Supabase sur Netlify

## ⚠️ PROBLÈME : Page login qui se recharge en boucle

Si vous ne pouvez pas accéder à la page login ou au compte, c'est **probablement** parce que les variables d'environnement Supabase ne sont pas configurées sur Netlify.

## ✅ Solution : Vérifier les variables d'environnement

### Étape 1 : Aller sur Netlify

1. Allez sur https://app.netlify.com
2. Connectez-vous à votre compte
3. Cliquez sur votre site (devorbaits)

### Étape 2 : Vérifier les variables d'environnement

1. Dans le menu de gauche, cliquez sur **Site settings**
2. Dans le menu de gauche, cliquez sur **Environment variables**
3. Vous devriez voir une liste de variables

### Étape 3 : Vérifier que ces variables existent

Vous devez avoir **AU MINIMUM** ces 2 variables :

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**⚠️ IMPORTANT :**
- Les noms doivent être **EXACTEMENT** comme ci-dessus (avec `NEXT_PUBLIC_` au début)
- Les valeurs ne doivent PAS être vides
- Les valeurs ne doivent PAS avoir d'espaces avant ou après

### Étape 4 : Si les variables manquent

1. Cliquez sur **Add a variable**
2. Pour chaque variable :
   - **Key** : `NEXT_PUBLIC_SUPABASE_URL`
   - **Value** : Votre URL Supabase (ex: `https://xxxxx.supabase.co`)
   - Cliquez sur **Save**
   
   Puis :
   - **Key** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value** : Votre clé anonyme Supabase (longue chaîne de caractères)
   - Cliquez sur **Save**

### Étape 5 : Où trouver vos clés Supabase ?

1. Allez sur https://supabase.com
2. Connectez-vous à votre compte
3. Sélectionnez votre projet
4. Allez dans **Settings** (⚙️) > **API**
5. Vous verrez :
   - **Project URL** → C'est votre `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → C'est votre `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Étape 6 : Redéployer le site

**IMPORTANT :** Après avoir ajouté/modifié des variables d'environnement, vous devez redéployer le site :

1. Dans Netlify, allez dans **Deploys**
2. Cliquez sur **Trigger deploy** > **Deploy site**
3. Attendez que le déploiement se termine

## 🔍 Vérifier que ça fonctionne

1. Ouvrez votre site sur Netlify
2. Allez sur la page login : `https://devorbaits.netlify.app/account/login`
3. Appuyez sur **F12** pour ouvrir la console
4. Regardez les messages dans la console :
   - Si vous voyez `⚠️ Supabase non configuré` → Les variables ne sont pas configurées
   - Si vous voyez `[LoginPage] État:` → Les variables sont configurées

## 📋 Checklist

- [ ] J'ai vérifié que `NEXT_PUBLIC_SUPABASE_URL` existe sur Netlify
- [ ] J'ai vérifié que `NEXT_PUBLIC_SUPABASE_ANON_KEY` existe sur Netlify
- [ ] Les valeurs ne sont pas vides
- [ ] J'ai redéployé le site après avoir ajouté/modifié les variables
- [ ] J'ai testé la page login et regardé la console (F12)

## ❓ Si ça ne fonctionne toujours pas

1. Ouvrez la console du navigateur (F12)
2. Copiez tous les messages d'erreur
3. Partagez-les avec le support
