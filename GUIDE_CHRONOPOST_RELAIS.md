# Guide d'intégration Chronopost Relais

## 📋 Vue d'ensemble

Ce guide explique comment fonctionne l'intégration de Chronopost Relais dans votre site. C'est très simple !

## 🎯 Ce qui a été fait

### 1. **Composant de sélection** (`ChronopostRelaisSelector.tsx`)
- Un composant qui charge le widget Chronopost
- Permet au client de choisir un point relais sur une carte
- Récupère les informations du point sélectionné

### 2. **Option dans le checkout**
- Nouvelle option "Chronopost Relais" dans la page de commande
- Le client peut choisir entre :
  - Livraison à domicile
  - **Chronopost Relais** (nouveau)
  - Retrait à l'amicale
  - Retrait sur RDV à Wavignies

### 3. **Sauvegarde dans la commande**
- Les informations du point relais sont sauvegardées dans la base de données
- Stockées dans le champ `shipping_address` avec le type `chronopost-relais`

### 4. **Affichage dans l'admin**
- Les informations du point relais s'affichent dans la page admin des commandes
- Facile à identifier avec une couleur violette

## 🔧 Comment ça fonctionne

### Pour le client (checkout)

1. Le client choisit "Chronopost Relais" comme mode de retrait
2. Il entre son code postal (5 chiffres)
3. Un bouton apparaît : "Choisir un point relais Chronopost"
4. En cliquant, une carte s'ouvre (widget Chronopost)
5. Le client sélectionne un point relais sur la carte
6. Les informations du point s'affichent (nom, adresse, horaires)
7. Le client peut continuer avec le paiement

### Pour vous (admin)

1. Dans la page admin des commandes (`/admin/orders`)
2. Vous voyez toutes les commandes
3. Pour une commande avec Chronopost Relais :
   - Un encadré violet apparaît
   - Vous voyez :
     - Le nom du point relais
     - Le code du point relais
     - L'adresse complète
     - Les horaires d'ouverture

## 📦 Structure des données

Quand un point relais est sélectionné, ces informations sont sauvegardées :

```json
{
  "type": "chronopost-relais",
  "identifiant": "CODE123456",
  "nom": "BUREAU DE POSTE",
  "adresse": "123 RUE DE LA POSTE",
  "codePostal": "75001",
  "ville": "PARIS",
  "horaires": "Lun-Ven: 9h-18h",
  "coordonnees": {
    "latitude": 48.8566,
    "longitude": 2.3522
  }
}
```

## 🎨 Fichiers modifiés/créés

### Nouveaux fichiers
- `components/ChronopostRelaisSelector.tsx` - Composant de sélection

### Fichiers modifiés
- `app/checkout/page.tsx` - Ajout de l'option Chronopost Relais
- `app/admin/orders/page.tsx` - Affichage des infos dans l'admin

## ⚙️ Configuration requise

**Aucune configuration supplémentaire n'est nécessaire !**

Le widget Chronopost se charge automatiquement depuis leur serveur. Pas besoin de clés API ou d'identifiants.

## 🚀 Utilisation

### Pour tester

1. Allez sur votre site en mode développement
2. Ajoutez des produits au panier
3. Allez au checkout
4. Sélectionnez "Chronopost Relais"
5. Entrez un code postal (ex: 75001)
6. Cliquez sur "Choisir un point relais Chronopost"
7. Sélectionnez un point sur la carte
8. Vérifiez que les informations s'affichent
9. Passez une commande test
10. Vérifiez dans l'admin que les infos sont bien sauvegardées

## ❓ Questions fréquentes

### Le widget ne s'ouvre pas / Pas de carte visible ?

**Étapes de débogage :**

1. **Ouvrez la console du navigateur** (F12 ou clic droit > Inspecter > Console)

2. **Vérifiez les messages dans la console :**
   - Vous devriez voir : `✅ jQuery chargé`
   - Puis : `✅ Script Chronopost chargé`
   - Puis : `✅ Widget initialisé`

3. **Si vous voyez des erreurs :**
   - `❌ Erreur chargement jQuery` → Problème de connexion internet
   - `❌ Erreur chargement widget Chronopost` → Le serveur Chronopost est peut-être en panne
   - `Fonction d'initialisation non trouvée` → Le script ne s'est pas chargé correctement

4. **Vérifications à faire :**
   - ✅ Code postal valide (5 chiffres)
   - ✅ Connexion internet active
   - ✅ Pas de bloqueur de publicités qui bloque les scripts
   - ✅ Console du navigateur ouverte pour voir les erreurs

5. **Le widget peut s'ouvrir dans une popup :**
   - Vérifiez si une nouvelle fenêtre s'ouvre
   - Autorisez les popups pour votre site si nécessaire

6. **Si rien ne fonctionne :**
   - Essayez dans un autre navigateur (Chrome, Firefox, Edge)
   - Videz le cache du navigateur (Ctrl+Shift+Delete)
   - Rechargez la page (F5)

### Les informations ne s'affichent pas dans l'admin ?
- Vérifiez que la commande a bien été créée
- Regardez dans la console du navigateur s'il y a des erreurs
- Vérifiez que le champ `shipping_address` contient bien les données

### Comment changer le prix d'expédition pour Chronopost Relais ?
- Actuellement, le prix est calculé comme pour la livraison à domicile
- Vous pouvez modifier la logique dans `app/checkout/page.tsx` dans la fonction `calculateShippingCost`

## 📝 Notes importantes

1. **Widget externe** : Le widget Chronopost est chargé depuis leur serveur. Si leur serveur est en panne, le widget ne fonctionnera pas.

2. **jQuery requis** : Le widget nécessite jQuery qui est chargé automatiquement depuis Google CDN.

3. **Pas de clés API** : Contrairement à Boxtal, Chronopost ne nécessite pas de clés API pour le widget de sélection.

4. **Mode popup possible** : Le widget peut s'ouvrir dans une popup plutôt que directement dans la page. Vérifiez que les popups ne sont pas bloquées.

5. **Données sauvegardées** : Toutes les informations du point relais sont sauvegardées dans la commande, donc même si le widget change plus tard, vous aurez toujours les infos.

6. **Compatible avec les autres modes** : L'option Chronopost Relais fonctionne en parallèle avec les autres modes de retrait (livraison, amicale, RDV).

7. **Débogage** : Des messages de log sont affichés dans la console du navigateur pour vous aider à identifier les problèmes.

## 🎉 C'est tout !

L'intégration est complète et prête à être utilisée. Les clients peuvent maintenant choisir un point relais Chronopost lors de leur commande, et vous pouvez voir toutes les informations dans l'admin.
