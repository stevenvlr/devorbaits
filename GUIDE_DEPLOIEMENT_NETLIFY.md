# Guide : Déployer votre site Next.js sur Netlify

## 🎯 Objectif

Ce guide vous explique étape par étape comment déployer votre site Next.js sur Netlify, depuis la création du compte jusqu'à la configuration complète.

---

## 📋 Étape 1 : Créer un compte Netlify et connecter GitHub

### 1.1 Créer un compte Netlify

1. Allez sur [https://www.netlify.com](https://www.netlify.com)
2. Cliquez sur **"Sign up"** (S'inscrire) en haut à droite
3. Choisissez **"Sign up with GitHub"** (S'inscrire avec GitHub)
   - Cela vous permettra de connecter directement votre compte GitHub
4. Autorisez Netlify à accéder à votre compte GitHub quand on vous le demande

### 1.2 Connecter votre dépôt GitHub

1. Une fois connecté, vous arrivez sur le **Dashboard** (tableau de bord) de Netlify
2. Cliquez sur **"Add new site"** (Ajouter un nouveau site)
3. Sélectionnez **"Import an existing project"** (Importer un projet existant)
4. Cliquez sur **"Deploy with GitHub"** (Déployer avec GitHub)
5. Si c'est la première fois, autorisez Netlify à accéder à vos dépôts GitHub
6. **Sélectionnez votre dépôt** dans la liste (celui qui contient votre code Next.js)
7. Netlify va détecter automatiquement que c'est un projet Next.js

---

## 🚀 Étape 2 : Configurer le déploiement

### 2.1 Installer le plugin Netlify (important !)

Avant de déployer, vous devez installer le plugin Netlify pour Next.js :

1. Dans votre projet local, ouvrez un terminal
2. Exécutez cette commande :
   ```bash
   npm install --save-dev @netlify/plugin-nextjs
   ```
3. Commitez et poussez les changements sur GitHub :
   ```bash
   git add package.json package-lock.json
   git commit -m "Ajout plugin Netlify pour Next.js"
   git push
   ```

💡 **Note** : Le fichier `netlify.toml` est déjà créé dans votre projet et configuré correctement. Il sera automatiquement utilisé par Netlify.

**Qu'est-ce que `netlify.toml` ?**
- C'est un fichier de configuration qui indique à Netlify comment déployer votre site
- Il configure le plugin Next.js qui permet aux routes API (`app/api/*`) de fonctionner correctement
- Il ajoute aussi des en-têtes de sécurité pour protéger votre site
- Vous n'avez rien à modifier dans ce fichier, il est déjà prêt !

### 2.2 Paramètres de build

Netlify devrait avoir détecté automatiquement :
- **Build command** : `npm run build`
- **Publish directory** : `.next`

Si ce n'est pas le cas, configurez manuellement :
- **Build command** : `npm run build`
- **Publish directory** : `.next`
- **Node version** : Laissez la version par défaut (ou choisissez Node 18+)

### 2.3 Lancer le premier déploiement

1. Cliquez sur **"Deploy site"** (Déployer le site)
2. Netlify va commencer à construire votre site (cela peut prendre 2-5 minutes)
3. Vous verrez les logs de build en temps réel
4. Une fois terminé, vous obtiendrez une URL temporaire comme : `https://random-name-123.netlify.app`

⚠️ **Note importante** : Le premier déploiement va probablement échouer car les variables d'environnement ne sont pas encore configurées. C'est normal ! On va les configurer maintenant.

💡 **Astuce** : Si le build échoue avec une erreur concernant le plugin Netlify, assurez-vous d'avoir bien poussé le `package.json` mis à jour sur GitHub.

---

## 🔐 Étape 3 : Configurer les variables d'environnement

### 3.1 Accéder aux paramètres d'environnement

1. Dans votre dashboard Netlify, allez sur votre site
2. Cliquez sur **"Site configuration"** (Configuration du site) dans le menu de gauche
3. Cliquez sur **"Environment variables"** (Variables d'environnement)

### 3.2 Ajouter les variables Supabase

Ajoutez ces deux variables (une par une) :

**Variable 1 :**
- **Key** : `NEXT_PUBLIC_SUPABASE_URL`
- **Value** : Votre URL Supabase (ex: `https://votre-projet.supabase.co`)
- Cliquez sur **"Add variable"** (Ajouter la variable)

**Variable 2 :**
- **Key** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value** : Votre clé anonyme Supabase (commence généralement par `eyJ...`)
- Cliquez sur **"Add variable"** (Ajouter la variable)

💡 **Où trouver ces valeurs ?**
- Allez sur [https://app.supabase.com](https://app.supabase.com)
- Sélectionnez votre projet
- Allez dans **Settings** > **API**
- Vous trouverez l'URL et la clé anonyme

### 3.3 Ajouter les variables PayPal

**Variable 1 :**
- **Key** : `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- **Value** : Votre Client ID PayPal

**Variable 2 :**
- **Key** : `PAYPAL_SECRET`
- **Value** : Votre Secret PayPal (⚠️ Ne commence PAS par `NEXT_PUBLIC_`)

**Variable 3 :**
- **Key** : `NEXT_PUBLIC_PAYPAL_BASE_URL`
- **Value** : 
  - Pour le test : `https://api-m.sandbox.paypal.com`
  - Pour la production : `https://api-m.paypal.com`

**Variable 4 :**
- **Key** : `NEXT_PUBLIC_SITE_URL`
- **Value** : L'URL de votre site Netlify (ex: `https://votre-site.netlify.app`)
  - ⚠️ Vous devrez mettre à jour cette valeur après avoir configuré votre nom de domaine personnalisé

### 3.4 Ajouter les variables Monetico

**Variable 1 :**
- **Key** : `NEXT_PUBLIC_MONETICO_TPE`
- **Value** : Votre numéro de TPE Monetico

**Variable 2 :**
- **Key** : `NEXT_PUBLIC_MONETICO_SOCIETE`
- **Value** : Votre code société Monetico

**Variable 3 :**
- **Key** : `NEXT_PUBLIC_MONETICO_URL_RETOUR`
- **Value** : `https://votre-site.netlify.app/payment/success`
  - ⚠️ Remplacez par votre vraie URL Netlify

**Variable 4 :**
- **Key** : `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR`
- **Value** : `https://votre-site.netlify.app/payment/error`
  - ⚠️ Remplacez par votre vraie URL Netlify

**Variable 5 :**
- **Key** : `MONETICO_CLE_SECRETE`
- **Value** : Votre clé secrète Monetico (⚠️ Ne commence PAS par `NEXT_PUBLIC_`)

**Variable 6 (optionnelle) :**
- **Key** : `NEXT_PUBLIC_MONETICO_URL`
- **Value** : `https://paiement.monetico.fr/paiement.cgi` (généralement cette valeur par défaut)

### 3.5 Variable de test (optionnelle)

Si vous voulez tester sans Monetico au début :

- **Key** : `NEXT_PUBLIC_TEST_PAYMENT`
- **Value** : `true`

⚠️ **Important** : Mettez cette variable à `false` ou supprimez-la en production !

---

## 🔄 Étape 4 : Redéployer avec les variables d'environnement

### 4.1 Déclencher un nouveau déploiement

1. Après avoir ajouté toutes les variables d'environnement, allez dans **"Deploys"** (Déploiements)
2. Cliquez sur **"Trigger deploy"** (Déclencher un déploiement) > **"Deploy site"** (Déployer le site)
3. Netlify va reconstruire votre site avec les nouvelles variables
4. Attendez que le déploiement se termine (2-5 minutes)

### 4.2 Vérifier que le déploiement a réussi

1. Une fois terminé, cliquez sur l'URL de votre site (ex: `https://random-name-123.netlify.app`)
2. Vérifiez que la page d'accueil s'affiche correctement
3. Si vous voyez des erreurs, consultez les logs de build dans Netlify

---

## 🌐 Étape 5 : Configurer un nom de domaine personnalisé (optionnel)

### 5.1 Ajouter un domaine

1. Dans votre dashboard Netlify, allez dans **"Domain settings"** (Paramètres de domaine)
2. Cliquez sur **"Add custom domain"** (Ajouter un domaine personnalisé)
3. Entrez votre nom de domaine (ex: `votre-site.com`)
4. Suivez les instructions pour configurer les DNS

### 5.2 Mettre à jour les variables d'environnement

Une fois votre domaine configuré, mettez à jour ces variables :
- `NEXT_PUBLIC_SITE_URL` : `https://votre-site.com`
- `NEXT_PUBLIC_MONETICO_URL_RETOUR` : `https://votre-site.com/payment/success`
- `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR` : `https://votre-site.com/payment/error`

Puis redéployez le site.

---

## ✅ Étape 6 : Tester que tout fonctionne

### 6.1 Test de la page d'accueil

1. Ouvrez votre site Netlify dans un navigateur
2. Vérifiez que la page d'accueil s'affiche correctement
3. Testez la navigation entre les pages

### 6.2 Test de Supabase

1. Essayez de vous connecter / créer un compte
2. Vérifiez que les données se sauvegardent correctement
3. Testez l'ajout d'articles au panier

### 6.3 Test des points relais Chronopost

1. Allez sur la page de checkout
2. Sélectionnez une option de livraison avec point relais
3. Testez la recherche de points relais :
   - Entrez un code postal
   - Vérifiez que la liste des points relais s'affiche
   - Sélectionnez un point relais
   - Vérifiez que les informations sont bien enregistrées

### 6.4 Test des paiements

⚠️ **Important** : Testez d'abord en mode test !

**Test PayPal (mode sandbox) :**
1. Allez jusqu'à la page de paiement
2. Sélectionnez PayPal
3. Utilisez un compte PayPal de test (sandbox)
4. Vérifiez que le paiement fonctionne

**Test Monetico (mode test) :**
1. Si vous avez activé `NEXT_PUBLIC_TEST_PAYMENT=true`, testez le paiement fictif
2. Sinon, utilisez les identifiants de test Monetico
3. Vérifiez que le retour après paiement fonctionne

---

## 🐛 Résolution des problèmes courants

### Problème : Erreur d'authentification GitHub ("No server is currently available")

Si vous voyez une erreur HTML de GitHub lors de la connexion, voici comment résoudre :

**Solutions immédiates :**
1. **Attendez 5-10 minutes** et réessayez (problème temporaire de GitHub)
2. **Vérifiez le statut de GitHub** : [https://www.githubstatus.com](https://www.githubstatus.com)
3. **Rafraîchissez la page** Netlify (F5 ou Ctrl+R)
4. **Fermez et rouvrez votre navigateur**

**Solutions avancées :**
1. **Videz le cache du navigateur** :
   - Chrome/Edge : Ctrl+Shift+Suppr → Cochez "Cookies" → Effacer
   - Firefox : Ctrl+Shift+Suppr → Cochez "Cookies" → Effacer
2. **Utilisez un autre navigateur** (ou mode navigation privée)
3. **Désactivez temporairement les extensions** (adblockers, VPN)
4. **Essayez depuis un autre réseau** (téléphone en partage de connexion)

**Si le problème persiste :**
1. Allez sur [https://github.com/settings/applications](https://github.com/settings/applications)
2. Vérifiez si Netlify apparaît dans "Authorized OAuth Apps"
3. Si oui, cliquez sur "Revoke" puis réessayez la connexion
4. Si non, le problème vient de la connexion initiale

**Alternative : Connexion manuelle**
Si rien ne fonctionne, vous pouvez déployer manuellement :
1. Dans Netlify, choisissez "Deploy manually" au lieu de "Deploy with GitHub"
2. Vous devrez uploader votre code à chaque fois (moins pratique)

### Problème : Le build échoue

**Solutions :**
1. Vérifiez les logs de build dans Netlify
2. Assurez-vous que toutes les variables d'environnement sont bien configurées
3. Vérifiez que votre code compile en local : `npm run build`

### Problème : Les variables d'environnement ne fonctionnent pas

**Solutions :**
1. Vérifiez que vous avez bien ajouté toutes les variables dans Netlify
2. ⚠️ **Important** : Après avoir ajouté/modifié des variables, vous devez redéployer le site
3. Les variables qui commencent par `NEXT_PUBLIC_` sont accessibles côté client
4. Les autres variables (comme `PAYPAL_SECRET`, `MONETICO_CLE_SECRETE`) sont uniquement côté serveur

### Problème : Les routes API ne fonctionnent pas (erreur 404)

**Solutions :**
1. Vérifiez que le plugin `@netlify/plugin-nextjs` est bien installé dans `package.json`
2. Vérifiez que le fichier `netlify.toml` est présent à la racine du projet
3. Redéployez le site après avoir ajouté le plugin
4. Le plugin Netlify gère automatiquement les routes API dans `app/api/*`

### Problème : Les points relais Chronopost ne fonctionnent pas

**Solutions :**
1. Vérifiez que votre site est accessible en HTTPS (Netlify le fait automatiquement)
2. Vérifiez la console du navigateur (F12) pour voir les erreurs
3. Les points relais Chronopost utilisent une API publique, pas de variables d'environnement nécessaires
4. Vérifiez que les routes API `/api/chronopost/*` fonctionnent (voir problème ci-dessus)

### Problème : Les paiements ne fonctionnent pas

**Solutions :**
1. Vérifiez que `NEXT_PUBLIC_SITE_URL` est bien configurée avec l'URL Netlify
2. Pour PayPal, vérifiez que les URLs de retour sont correctes
3. Pour Monetico, vérifiez que les URLs de retour sont bien configurées dans votre compte Monetico

### Problème : Le site est lent

**Solutions :**
1. Netlify optimise automatiquement les images Next.js
2. Vérifiez que vous utilisez bien les images optimisées de Next.js
3. Considérez activer le CDN de Netlify (activé par défaut)

---

## 📝 Checklist de déploiement

Avant de mettre en production, vérifiez :

- [ ] Toutes les variables d'environnement sont configurées
- [ ] Le build passe sans erreur
- [ ] La page d'accueil s'affiche correctement
- [ ] La connexion Supabase fonctionne
- [ ] Les points relais Chronopost fonctionnent
- [ ] Les paiements PayPal fonctionnent (en mode test)
- [ ] Les paiements Monetico fonctionnent (en mode test)
- [ ] `NEXT_PUBLIC_TEST_PAYMENT` est à `false` ou supprimée
- [ ] Les URLs de retour Monetico sont correctes
- [ ] Le nom de domaine personnalisé est configuré (si nécessaire)

---

## 🎉 Félicitations !

Votre site est maintenant déployé sur Netlify ! 

### Prochaines étapes

1. **Surveiller les déploiements** : Chaque fois que vous poussez du code sur GitHub, Netlify redéploiera automatiquement votre site
2. **Configurer un nom de domaine** : Si vous avez un nom de domaine, configurez-le dans Netlify
3. **Passer en production** : Une fois que tout fonctionne en test, passez les paiements en mode production

### Ressources utiles

- [Documentation Netlify](https://docs.netlify.com/)
- [Documentation Next.js sur Netlify](https://docs.netlify.com/integrations/frameworks/nextjs/)
- [Support Netlify](https://www.netlify.com/support/)

---

## 💡 Astuces

1. **Déploiements automatiques** : Netlify déploie automatiquement à chaque push sur votre branche principale (généralement `main` ou `master`)
2. **Branches de prévisualisation** : Netlify crée automatiquement des déploiements de prévisualisation pour chaque pull request
3. **Rollback** : Si un déploiement ne fonctionne pas, vous pouvez revenir à une version précédente dans l'onglet "Deploys"
4. **Logs** : Consultez les logs de build et les logs de fonction dans le dashboard Netlify
