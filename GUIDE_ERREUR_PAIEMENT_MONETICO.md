# Guide : Résoudre l'Erreur de Paiement Monetico

## 🔴 Erreur : "Erreur lors de la génération de la signature"

Cette erreur se produit lorsque la signature Monetico ne peut pas être générée. Voici comment la résoudre.

## 🔍 Causes possibles

### 1. Clé secrète Monetico non configurée (le plus fréquent)

**Symptôme** : L'erreur indique "Clé secrète Monetico non configurée"

**Solution** :
1. Ouvrez votre fichier `.env.local` à la racine du projet
2. Ajoutez ou vérifiez la ligne suivante :
   ```env
   MONETICO_CLE_SECRETE=votre_cle_secrete_ici
   ```
3. Redémarrez votre serveur Next.js (`npm run dev`)

**Où trouver votre clé secrète** :
- Connectez-vous à votre espace Monetico
- Allez dans "Configuration" > "Clés de sécurité"
- Copiez la clé secrète (elle commence généralement par des caractères aléatoires)

### 2. Variables d'environnement Monetico manquantes

**Vérifiez que toutes ces variables sont dans `.env.local`** :

```env
# Configuration Monetico (obligatoire pour le paiement)
NEXT_PUBLIC_MONETICO_TPE=votre_tpe
NEXT_PUBLIC_MONETICO_SOCIETE=votre_societe
NEXT_PUBLIC_MONETICO_URL_RETOUR=https://votre-site.com/payment/callback
NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR=https://votre-site.com/payment/error
MONETICO_CLE_SECRETE=votre_cle_secrete
```

### 3. Mode test activé par erreur

Si vous avez `NEXT_PUBLIC_TEST_PAYMENT=true` dans `.env.local`, le paiement Monetico est désactivé et utilise le mode test.

**Pour utiliser Monetico** :
- Retirez ou commentez la ligne `NEXT_PUBLIC_TEST_PAYMENT=true`
- Ou changez-la en `NEXT_PUBLIC_TEST_PAYMENT=false`

## ✅ Solutions rapides

### Solution 1 : Utiliser le mode test (pour tester sans Monetico)

Si vous voulez tester les expéditions sans configurer Monetico :

1. Ajoutez dans `.env.local` :
   ```env
   NEXT_PUBLIC_TEST_PAYMENT=true
   ```

2. Redémarrez le serveur

3. Les paiements passeront directement sans Monetico (pour les tests uniquement)

### Solution 2 : Configurer Monetico correctement

1. **Récupérez vos identifiants Monetico** :
   - TPE (Terminal de Paiement Électronique)
   - Code société
   - Clé secrète

2. **Ajoutez-les dans `.env.local`** :
   ```env
   NEXT_PUBLIC_MONETICO_TPE=1234567
   NEXT_PUBLIC_MONETICO_SOCIETE=VOTRE_SOCIETE
   NEXT_PUBLIC_MONETICO_URL_RETOUR=http://localhost:3000/payment/callback
   NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR=http://localhost:3000/payment/error
   MONETICO_CLE_SECRETE=votre_cle_secrete_ici
   ```

3. **Redémarrez le serveur** :
   ```bash
   npm run dev
   ```

## 🧪 Tester la configuration

### Vérifier que l'API fonctionne

1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet "Network" (Réseau)
3. Essayez de passer une commande
4. Regardez la requête vers `/api/monetico/signature`
5. Si elle retourne une erreur 500, vérifiez les logs du serveur

### Vérifier les logs serveur

Dans votre terminal où tourne `npm run dev`, vous devriez voir :
- ✅ `Signature Monetico générée avec succès` si tout va bien
- ❌ `MONETICO_CLE_SECRETE non configurée` si la clé manque

## 📝 Checklist de configuration

- [ ] Fichier `.env.local` existe à la racine du projet
- [ ] `MONETICO_CLE_SECRETE` est défini dans `.env.local`
- [ ] `NEXT_PUBLIC_MONETICO_TPE` est défini
- [ ] `NEXT_PUBLIC_MONETICO_SOCIETE` est défini
- [ ] `NEXT_PUBLIC_MONETICO_URL_RETOUR` est défini
- [ ] `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR` est défini
- [ ] Le serveur a été redémarré après modification de `.env.local`
- [ ] Les valeurs sont correctes (pas d'espaces, pas de guillemets inutiles)

## ⚠️ Important

- **Ne partagez jamais votre clé secrète** : Elle doit rester dans `.env.local` et ne jamais être commitée dans Git
- **Vérifiez `.gitignore`** : Assurez-vous que `.env.local` est bien ignoré
- **En production** : Configurez ces variables dans votre hébergeur (Vercel, Netlify, etc.)

## 🔄 Redémarrer le serveur

Après avoir modifié `.env.local`, **vous devez redémarrer le serveur** :

1. Arrêtez le serveur (Ctrl+C dans le terminal)
2. Relancez-le : `npm run dev`

Les variables d'environnement ne sont chargées qu'au démarrage.

## 🆘 Si le problème persiste

1. **Vérifiez les logs serveur** : Regardez les erreurs dans le terminal
2. **Vérifiez la console navigateur** : Ouvrez F12 > Console pour voir les erreurs
3. **Testez l'API directement** : Essayez de faire une requête POST vers `/api/monetico/signature`
4. **Utilisez le mode test** : Activez `NEXT_PUBLIC_TEST_PAYMENT=true` pour contourner Monetico temporairement

## 📞 Support

Si le problème persiste après avoir vérifié tous ces points :
- Vérifiez la documentation Monetico
- Contactez le support Monetico avec votre TPE
- Vérifiez que votre compte Monetico est actif






