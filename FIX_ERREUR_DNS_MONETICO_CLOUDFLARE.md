# 🔧 Correction de l'erreur DNS Monetico sur Cloudflare

## 🔴 Problème rencontré

Lors d'un paiement test via Monetico sur votre site déployé sur Cloudflare, vous obtenez cette erreur :

```
Ce site est inaccessible
L'adresse DNS de paiement.monetico.fr est introuvable.
DNS_PROBE_POSSIBLE
```

## 🔍 Cause du problème

L'URL Monetico configurée dans `wrangler.toml` était l'URL de **production** :
- ❌ `https://paiement.monetico.fr/paiement.cgi` (production)

Mais vous utilisez des identifiants de **test**, donc vous devez utiliser l'URL de **test** :
- ✅ `https://p.monetico-services.com/test/paiement.cgi` (test/sandbox)

## ✅ Solution appliquée

J'ai mis à jour le fichier `wrangler.toml` pour utiliser l'URL de test Monetico.

### Modification dans `wrangler.toml`

```toml
# Avant (production - ne fonctionne pas en test)
NEXT_PUBLIC_MONETICO_URL = "https://paiement.monetico.fr/paiement.cgi"

# Après (test/sandbox - correct pour vos tests)
NEXT_PUBLIC_MONETICO_URL = "https://p.monetico-services.com/test/paiement.cgi"
```

## 📝 Étapes suivantes

### ⚠️ Important : Variables gérées via wrangler.toml

Si vous voyez ce message dans Cloudflare Dashboard :
> "Environment variables for this project are being managed through wrangler.toml. Only Secrets (encrypted variables) can be managed via the Dashboard."

**C'est normal !** Les variables d'environnement sont gérées via `wrangler.toml`, donc la modification que j'ai faite est suffisante. Vous n'avez **PAS besoin** de modifier quoi que ce soit dans le Dashboard.

### 1. Redéployer votre site

Pour que les changements prennent effet, vous devez redéployer votre site :

**Option A : Si votre projet est connecté à Git (recommandé)**

1. Commitez et poussez les changements :
   ```bash
   git add wrangler.toml
   git commit -m "Fix: Utiliser l'URL de test Monetico"
   git push
   ```

2. Cloudflare Pages redéploiera **automatiquement** après le push (quelques minutes)

**Option B : Redéploiement manuel depuis Cloudflare**

1. Allez sur [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Sélectionnez votre projet **devorbaits**
3. Allez dans l'onglet **Deployments** (Déploiements)
4. Cliquez sur les **3 points** (⋯) à côté du dernier déploiement
5. Cliquez sur **Retry deployment** (Réessayer le déploiement)
6. Attendez que le déploiement se termine (2-5 minutes)

### 2. Tester le paiement

1. Allez sur votre site déployé
2. Ajoutez des produits au panier
3. Allez au checkout
4. Sélectionnez "Carte bleue" (Monetico)
5. Cliquez sur "Payer"
6. Vous devriez être redirigé vers la page de paiement Monetico (test) sans erreur DNS

## 📋 URLs Monetico selon l'environnement

| Environnement | URL |
|---|---|
| **Test / Sandbox** | `https://p.monetico-services.com/test/paiement.cgi` |
| **Production** | `https://paiement.monetico.fr/paiement.cgi` |

## ⚠️ Important

- **En mode test** : Utilisez toujours `https://p.monetico-services.com/test/paiement.cgi`
- **En production** : Quand vous passerez en production avec de vrais identifiants, changez pour `https://paiement.monetico.fr/paiement.cgi`

## 🔄 Quand passer en production ?

Quand vous serez prêt à accepter de vrais paiements :

1. Obtenez vos identifiants Monetico de **production** (TPE, clé secrète, etc.)
2. Changez `NEXT_PUBLIC_MONETICO_URL` pour `https://paiement.monetico.fr/paiement.cgi`
3. Mettez à jour toutes les autres variables Monetico avec les valeurs de production
4. Testez d'abord avec de petits montants

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. ✅ L'erreur DNS ne devrait plus apparaître
2. ✅ Vous devriez être redirigé vers la page de paiement Monetico (avec l'icône "TEST")
3. ✅ Vous pouvez utiliser des cartes de test pour valider le paiement

## 🆘 Si le problème persiste

1. **Vérifiez que le déploiement est terminé** : Allez dans Deployments et assurez-vous que le dernier déploiement est vert (réussi)
2. **Vérifiez le cache** : Videz le cache de votre navigateur (Ctrl+Shift+Delete) ou testez en navigation privée
3. **Vérifiez les logs** : Regardez la console du navigateur (F12) pour d'autres erreurs
4. **Vérifiez vos identifiants** : Assurez-vous d'utiliser des identifiants Monetico de **test** (pas de production)
5. **Vérifiez wrangler.toml** : Ouvrez le fichier et vérifiez que la ligne contient bien `https://p.monetico-services.com/test/paiement.cgi`
