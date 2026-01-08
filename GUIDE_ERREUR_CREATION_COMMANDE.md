# Guide : Résoudre l'Erreur de Création de Commande

## 🔴 Erreur : "Erreur lors de la création de la commande test"

Cette erreur se produit lorsque la commande ne peut pas être créée dans Supabase ou localStorage.

## 🔍 Causes possibles

### 1. Variables Supabase non configurées (le plus fréquent)

**Symptôme** : L'erreur indique "Supabase non configuré" ou "Clé API Supabase invalide"

**Solution** :
1. Ouvrez votre fichier `.env.local` à la racine du projet
2. Vérifiez que vous avez ces lignes avec vos **vraies valeurs** :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Remplacez les placeholders** par vos vraies valeurs depuis votre dashboard Supabase
4. **Redémarrez le serveur** (Ctrl+C puis `npm run dev`)

**Où trouver vos clés Supabase** :
- Allez sur https://supabase.com/dashboard
- Sélectionnez votre projet
- Allez dans **Settings** > **API**
- Copiez :
  - **Project URL** → remplacez `NEXT_PUBLIC_SUPABASE_URL`
  - **anon/public key** → remplacez `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Tables Supabase non créées

**Symptôme** : L'erreur indique "Table 'orders' non trouvée" ou "relation does not exist"

**Solution** :
1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Exécutez le script `supabase-schema.sql` qui crée toutes les tables nécessaires
4. Vérifiez que les tables suivantes existent :
   - `orders`
   - `order_items`
   - `profiles`

### 3. Problème de connexion à Supabase

**Symptôme** : L'erreur indique "Erreur de connexion" ou "JWT"

**Solution** :
1. Vérifiez que votre URL Supabase est correcte (commence par `https://`)
2. Vérifiez que votre clé anon est correcte (commence par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
3. Vérifiez que votre projet Supabase est actif
4. Testez la connexion sur `/admin/supabase-test`

## ✅ Vérifications rapides

### 1. Vérifier le fichier .env.local

Ouvrez `.env.local` et vérifiez qu'il contient :

```env
NEXT_PUBLIC_TEST_PAYMENT=true
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
```

**Important** : Remplacez `votre-projet` et `votre_cle_anon` par vos vraies valeurs !

### 2. Vérifier la console du navigateur

1. Ouvrez la console (F12)
2. Regardez les erreurs affichées
3. Cherchez des messages comme :
   - "Supabase non configuré"
   - "Table non trouvée"
   - "Clé API invalide"

### 3. Vérifier les logs serveur

Dans votre terminal où tourne `npm run dev`, cherchez :
- ❌ Erreurs Supabase
- ❌ Messages de connexion échouée

## 🔧 Solutions étape par étape

### Solution 1 : Configurer Supabase correctement

1. **Récupérez vos clés Supabase** (voir ci-dessus)
2. **Modifiez `.env.local`** avec les vraies valeurs
3. **Redémarrez le serveur**
4. **Testez à nouveau**

### Solution 2 : Créer les tables Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** > **New Query**
4. Copiez-collez le contenu de `supabase-schema.sql`
5. Exécutez la requête
6. Vérifiez que les tables sont créées

### Solution 3 : Utiliser le mode localStorage (temporaire)

Si Supabase ne fonctionne pas, le système utilise automatiquement localStorage comme fallback. Les commandes seront stockées localement dans le navigateur.

**Limitations** :
- Les données sont perdues si vous videz le cache
- Pas de synchronisation entre appareils
- Pas d'expéditions Boxtal automatiques

## 🧪 Tester la configuration

### Test 1 : Vérifier Supabase

1. Allez sur `/admin/supabase-test`
2. Vérifiez que la connexion fonctionne
3. Vérifiez que les tables existent

### Test 2 : Vérifier l'authentification

1. Essayez de vous connecter
2. Si ça fonctionne, Supabase est bien configuré
3. Si ça ne fonctionne pas, vérifiez vos clés

### Test 3 : Tester une commande

1. Ajoutez des produits au panier
2. Allez sur `/checkout`
3. Remplissez les informations
4. Essayez de passer la commande
5. Regardez les erreurs dans la console (F12)

## 📝 Checklist de dépannage

- [ ] Fichier `.env.local` existe à la racine du projet
- [ ] `NEXT_PUBLIC_SUPABASE_URL` est défini avec une vraie URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` est défini avec une vraie clé
- [ ] Les valeurs ne contiennent pas d'espaces ou de guillemets inutiles
- [ ] Le serveur a été redémarré après modification de `.env.local`
- [ ] Les tables Supabase existent (`orders`, `order_items`, `profiles`)
- [ ] Le projet Supabase est actif
- [ ] La connexion Supabase fonctionne (test sur `/admin/supabase-test`)

## 🆘 Si le problème persiste

1. **Vérifiez les logs serveur** : Regardez les erreurs dans le terminal
2. **Vérifiez la console navigateur** : Ouvrez F12 > Console
3. **Testez Supabase** : Allez sur `/admin/supabase-test`
4. **Vérifiez les permissions** : Assurez-vous que les tables ont les bonnes permissions RLS

## 📞 Support

Si le problème persiste après avoir vérifié tous ces points :
- Vérifiez la documentation Supabase
- Vérifiez que votre projet Supabase n'est pas suspendu
- Contactez le support Supabase si nécessaire






