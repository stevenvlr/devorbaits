# Guide : Pourquoi mes commandes test ne sont pas visibles dans Boxtal ?

## 🔍 Causes possibles

### 1. Mode test activé (le plus fréquent)

**Symptôme** : Les expéditions sont créées mais ne sont pas visibles dans l'interface Boxtal

**Explication** :
- Si `NEXT_PUBLIC_BOXTAL_ENV=test` ou si l'environnement est configuré en "test" dans `/admin/boxtal-config`
- Les expéditions sont créées sur l'environnement de **test** de Boxtal : `https://test.envoimoinscher.com`
- Elles ne sont **pas visibles** dans l'interface de production Boxtal

**Solution** :
1. Allez sur `/admin/boxtal-config`
2. Changez l'environnement de "Test" à "Production"
3. Ou vérifiez dans l'interface de test de Boxtal

### 2. Clés API Boxtal non configurées

**Symptôme** : L'erreur indique "Clés API Boxtal non configurées"

**Solution** :
1. Allez sur `/admin/boxtal-config`
2. Remplissez vos clés API Boxtal v1
3. Sauvegardez

### 3. Adresse de livraison incomplète

**Symptôme** : L'erreur indique "Adresse de livraison incomplète"

**Solution** :
1. Vérifiez que l'adresse est complète dans le formulaire de checkout :
   - Adresse (rue)
   - Code postal
   - Ville
2. L'adresse est maintenant sauvegardée automatiquement dans votre profil avant la création de l'expédition

### 4. Erreur silencieuse lors de la création

**Symptôme** : La commande est créée mais pas d'expédition Boxtal

**Vérification** :
1. Ouvrez la console du navigateur (F12)
2. Regardez les logs après avoir passé une commande
3. Cherchez :
   - `✅ Expédition Boxtal créée avec succès` → Tout va bien
   - `❌ Erreur création expédition Boxtal` → Il y a un problème

## ✅ Vérifications étape par étape

### Étape 1 : Vérifier l'environnement Boxtal

1. Allez sur `/admin/boxtal-config`
2. Regardez le champ "Environnement"
3. Si c'est "Test", les expéditions sont sur l'environnement de test
4. Si c'est "Production", elles sont sur l'environnement de production

### Étape 2 : Vérifier les clés API

1. Allez sur `/admin/boxtal-config`
2. Vérifiez que les clés API sont bien remplies
3. Vérifiez que le code d'offre de transport est correct

### Étape 3 : Vérifier les logs

1. Passez une commande test
2. Ouvrez la console (F12)
3. Regardez les messages :
   - `📦 Création de l'expédition Boxtal` → La création est tentée
   - `✅ Expédition Boxtal créée avec succès` → Succès !
   - `❌ Erreur création expédition Boxtal` → Erreur (regardez le message)

### Étape 4 : Vérifier dans Supabase

1. Allez dans Supabase > Table Editor > `orders`
2. Trouvez votre commande
3. Regardez les colonnes :
   - `boxtal_created` : Doit être `true` si l'expédition a été créée
   - `shipping_tracking_number` : Doit contenir le numéro de suivi
   - `shipping_label_url` : Doit contenir l'URL de l'étiquette

## 🔧 Solutions

### Solution 1 : Vérifier l'environnement de test

Si vous êtes en mode test, les expéditions sont créées mais sur l'environnement de test de Boxtal. C'est normal !

**Pour voir les expéditions de test** :
- Connectez-vous à votre compte Boxtal
- Vérifiez que vous êtes sur l'environnement de test
- Les expéditions devraient apparaître là-bas

### Solution 2 : Passer en production

1. Allez sur `/admin/boxtal-config`
2. Changez l'environnement en "Production"
3. Utilisez vos clés API de production
4. Les expéditions seront créées dans l'environnement de production

### Solution 3 : Vérifier les erreurs

1. Ouvrez la console (F12) après avoir passé une commande
2. Regardez les messages d'erreur
3. Les erreurs courantes :
   - "Clés API non configurées" → Configurez les clés
   - "Adresse incomplète" → Remplissez l'adresse dans le checkout
   - "Commande non trouvée" → Problème avec Supabase
   - "Erreur Boxtal API" → Problème avec les clés ou la configuration

## 📊 Où voir les expéditions créées

### Dans Supabase

1. Allez dans Supabase > Table Editor > `orders`
2. Les commandes avec `boxtal_created = true` ont une expédition créée
3. Le `shipping_tracking_number` contient le numéro de suivi

### Dans l'interface admin

1. Allez sur `/admin/orders`
2. Les commandes avec expédition devraient afficher le numéro de suivi

### Dans Boxtal

1. Connectez-vous à votre compte Boxtal
2. Allez dans "Mes expéditions" ou "Commandes"
3. Vérifiez que vous êtes sur le bon environnement (test ou production)

## 🧪 Tester la création d'expédition

### Test manuel

1. Allez sur `/admin/boxtal/test`
2. Testez la création d'une expédition
3. Vérifiez les logs pour voir les erreurs éventuelles

### Test automatique

1. Passez une commande test avec :
   - Mode de retrait : "Livraison à domicile"
   - Adresse complète remplie
2. Ouvrez la console (F12)
3. Regardez les logs de création d'expédition

## ⚠️ Important

- **Mode test** : Les expéditions sont créées mais sur l'environnement de test de Boxtal
- **Mode production** : Les expéditions sont créées dans l'environnement de production
- **Les deux environnements sont séparés** : Les expéditions de test ne sont pas visibles en production et vice versa

## 📝 Checklist

- [ ] Clés API Boxtal configurées dans `/admin/boxtal-config`
- [ ] Environnement correct (test ou production selon vos besoins)
- [ ] Adresse de livraison complète dans le checkout
- [ ] Mode de retrait = "Livraison à domicile"
- [ ] Console du navigateur vérifiée pour les erreurs
- [ ] Commande créée dans Supabase
- [ ] `boxtal_created = true` dans la table `orders`
- [ ] Numéro de suivi présent dans `shipping_tracking_number`

## 🆘 Si le problème persiste

1. **Vérifiez les logs serveur** : Regardez les erreurs dans le terminal
2. **Vérifiez la console navigateur** : Ouvrez F12 > Console
3. **Testez manuellement** : Utilisez `/admin/boxtal/test`
4. **Vérifiez Supabase** : Regardez si `boxtal_created` est à `true`
5. **Vérifiez Boxtal** : Connectez-vous et vérifiez l'environnement (test ou production)






