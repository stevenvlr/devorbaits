# Guide de débogage - Problème de connexion

## Problème
Impossible d'accéder à la page login ou au compte - la page se recharge en boucle.

## Vérifications à faire

### 1. Vérifier les variables d'environnement Supabase sur Netlify

1. Allez sur https://app.netlify.com
2. Sélectionnez votre site
3. Allez dans **Site settings** > **Environment variables**
4. Vérifiez que ces variables existent :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**⚠️ IMPORTANT :** Les variables doivent commencer par `NEXT_PUBLIC_` pour être accessibles côté client.

### 2. Vérifier dans la console du navigateur

1. Ouvrez votre site sur Netlify
2. Appuyez sur **F12** pour ouvrir les outils de développement
3. Allez dans l'onglet **Console**
4. Regardez les messages d'erreur

**Messages à chercher :**
- `Supabase non configuré`
- `API key`
- `NEXT_PUBLIC_SUPABASE_URL is not defined`
- Erreurs de réseau (CORS, 401, 403)

### 3. Vérifier les redirections

Dans la console, cherchez ces messages :
- `[LoginPage] Utilisateur déjà connecté, redirection vers /account`
- `[AccountPage] Utilisateur non connecté, redirection vers /account/login`

Si vous voyez ces messages en boucle, c'est une boucle de redirection.

### 4. Solution temporaire : Désactiver les redirections automatiques

Si le problème persiste, vous pouvez temporairement accéder directement à la page login en tapant l'URL complète :
```
https://devorbaits.netlify.app/account/login
```

## Solutions

### Solution 1 : Vérifier et corriger les variables d'environnement

1. Dans Netlify, vérifiez que les variables sont bien configurées
2. Si elles manquent, ajoutez-les :
   - `NEXT_PUBLIC_SUPABASE_URL` = votre URL Supabase (ex: `https://xxxxx.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = votre clé anonyme Supabase
3. **Redéployez** le site après avoir ajouté/modifié les variables

### Solution 2 : Vider le cache du navigateur

1. Appuyez sur **Ctrl + Shift + Delete** (Windows) ou **Cmd + Shift + Delete** (Mac)
2. Sélectionnez "Cookies et données de sites" et "Images et fichiers en cache"
3. Cliquez sur "Effacer les données"
4. Rechargez la page

### Solution 3 : Tester en navigation privée

1. Ouvrez une fenêtre de navigation privée (Ctrl + Shift + N)
2. Allez sur votre site
3. Testez la connexion

### Solution 4 : Vérifier la configuration Supabase

1. Allez sur https://supabase.com
2. Vérifiez que votre projet est actif
3. Vérifiez que les clés API sont correctes dans **Settings** > **API**

## Messages d'erreur courants

### "Supabase non configuré"
→ Les variables d'environnement ne sont pas définies sur Netlify

### "Invalid API key"
→ La clé `NEXT_PUBLIC_SUPABASE_ANON_KEY` est incorrecte

### "Failed to fetch"
→ Problème de réseau ou CORS - vérifiez la configuration Supabase

### Boucle de redirection infinie
→ Problème dans le code de redirection - contactez le support

## Contact

Si le problème persiste après avoir vérifié tout ce qui précède, partagez :
1. Les messages d'erreur de la console (F12)
2. Les variables d'environnement configurées sur Netlify (sans les valeurs sensibles)
3. L'URL de votre site Netlify
