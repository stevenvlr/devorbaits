# 🔍 Diagnostic de l'erreur Monetico

## 📋 Questions à répondre

Pour vous aider à résoudre le problème, j'ai besoin de connaître :

### 1. Quel est le message d'erreur exact ?

- [ ] "Un problème technique est survenu" sur la page Monetico
- [ ] "Erreur lors de la génération de la signature" dans le navigateur
- [ ] "Clé secrète Monetico non configurée"
- [ ] Autre erreur (précisez)

### 2. Où voyez-vous l'erreur ?

- [ ] Sur la page Monetico (après avoir cliqué sur "Payer")
- [ ] Dans la console du navigateur (F12)
- [ ] Sur votre site (avant d'arriver sur Monetico)
- [ ] Autre (précisez)

### 3. Avez-vous redéployé le site après les corrections ?

- [ ] Oui, j'ai fait un commit et push
- [ ] Oui, j'ai redéployé manuellement depuis Cloudflare
- [ ] Non, pas encore

## 🔍 Vérifications à faire

### Vérification 1 : Console du navigateur

1. Ouvrez votre site
2. Appuyez sur **F12** pour ouvrir les outils de développement
3. Allez dans l'onglet **Console**
4. Essayez de faire un paiement
5. **Copiez tous les messages d'erreur** que vous voyez

### Vérification 2 : Onglet Network (Réseau)

1. Dans les outils de développement (F12)
2. Allez dans l'onglet **Network** (Réseau)
3. Essayez de faire un paiement
4. Cherchez une requête vers `/api/monetico/signature`
5. Cliquez dessus et regardez :
   - **Status** : 200 (OK) ou une erreur ?
   - **Response** : Que contient la réponse ?

### Vérification 3 : Variables d'environnement Cloudflare

1. Allez sur [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Votre projet > **Settings** > **Environment variables**
3. Vérifiez que `MONETICO_CLE_SECRETE` existe (Type : **Secret**)
4. Vérifiez que toutes les variables Monetico sont présentes dans `wrangler.toml`

### Vérification 4 : Déploiement

1. Allez dans **Deployments**
2. Vérifiez que le dernier déploiement est **vert** (réussi)
3. Vérifiez la date du dernier déploiement (est-ce récent ?)

## 🛠️ Solutions selon le problème

### Problème : "Clé secrète Monetico non configurée"

**Solution :**
1. Allez dans Cloudflare Dashboard
2. **Settings** > **Environment variables**
3. Ajoutez `MONETICO_CLE_SECRETE` (Type : **Secret**)
4. Mettez votre clé secrète Monetico de **test**
5. Redéployez le site

### Problème : "Un problème technique est survenu" sur Monetico

**Causes possibles :**
1. La signature MAC est incorrecte
2. Les paramètres sont mal formatés
3. La clé secrète ne correspond pas au TPE

**Solutions :**
1. Vérifiez que vous utilisez la clé secrète de **test** (pas de production)
2. Vérifiez que le TPE est celui de **test**
3. Vérifiez que l'URL est `https://p.monetico-services.com/test/paiement.cgi`

### Problème : Erreur 500 dans la console

**Solution :**
1. Regardez les logs du déploiement Cloudflare
2. Vérifiez que `MONETICO_CLE_SECRETE` est bien configurée
3. Vérifiez que le code a bien été déployé

## 📝 Informations à me donner

Pour que je puisse vous aider, donnez-moi :

1. **Le message d'erreur exact** (copiez-collez)
2. **Où vous voyez l'erreur** (page Monetico, console, etc.)
3. **Les erreurs de la console** (F12 > Console)
4. **Le résultat de la requête `/api/monetico/signature`** (F12 > Network)

## 🚀 Test rapide

Pour tester si la configuration est correcte :

1. Ouvrez la console du navigateur (F12)
2. Allez sur votre site
3. Essayez de faire un paiement
4. Regardez les messages dans la console
5. Dites-moi ce que vous voyez
