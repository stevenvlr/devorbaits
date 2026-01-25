# Checklist de Test - Intégration Monetico v3.0 (Mode Iframe/Widget)

## ✅ Prérequis

### Variables d'environnement Cloudflare (Production)
- [ ] `MONETICO_TPE` = `0917217` (défini dans wrangler.toml)
- [ ] `MONETICO_SOCIETE` = `DEVORBAITS` (défini dans wrangler.toml)
- [ ] `MONETICO_CLE_HMAC` = Clé secrète 40 caractères hex (dans Cloudflare Dashboard → Secrets)
- [ ] `NEXT_PUBLIC_MONETICO_URL` = `https://paiement.creditmutuel.fr/paiement.cgi`
- [ ] `NEXT_PUBLIC_MONETICO_URL_RETOUR` = `https://devorbaits.com/api/monetico/retour`
- [ ] `NEXT_PUBLIC_MONETICO_URL_RETOUR_OK` = `https://devorbaits.com/payment/success/`
- [ ] `NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR` = `https://devorbaits.com/payment/error/`

### Vérifications côté Monetico/CM-CIC
- [ ] TPE activé et ouvert côté banque
- [ ] Contrat Monetico actif
- [ ] URLs de retour configurées dans l'espace Monetico :
  - URL retour OK : `https://devorbaits.com/payment/success/`
  - URL retour ERREUR : `https://devorbaits.com/payment/error/`
  - URL notification : `https://devorbaits.com/api/monetico/retour`

---

## 🧪 Tests à effectuer

### 1. Test de génération du paiement (API `/api/monetico`)

#### Test 1.1 : Génération réussie
- [ ] Aller sur `/checkout`
- [ ] Remplir le formulaire
- [ ] Sélectionner "Paiement par carte"
- [ ] Cliquer sur "Paiement par carte"
- [ ] **Résultat attendu** : Widget iframe Monetico s'affiche
- [ ] **Vérifier dans la console** :
  - `[MONETICO INIT] Paiement généré:` avec référence, montant, MAC (tronqué)
  - Pas d'erreur `MONETICO_CLE_HMAC non configuré`
  - Pas d'erreur `MONETICO_SOCIETE est vide`

#### Test 1.2 : Vérification des champs envoyés
- [ ] Ouvrir la console navigateur (F12)
- [ ] Vérifier les logs `[MONETICO]` :
  - `reference` : 12 caractères A-Z0-9
  - `montant` : format `XX.XXEUR`
  - `societe` : `DEVORBAITS` (non vide)
  - `MAC` : 40 caractères hex (affiché partiellement)
  - `macString` : chaîne de calcul du MAC (pour debug)

#### Test 1.3 : Erreurs de configuration
- [ ] **Test avec clé manquante** (temporairement) :
  - Résultat attendu : Erreur claire "MONETICO_CLE_HMAC non configuré"
- [ ] **Test avec societe vide** (temporairement) :
  - Résultat attendu : Erreur "MONETICO_SOCIETE est vide"

---

### 2. Test du widget iframe

#### Test 2.1 : Affichage du widget
- [ ] Le widget s'affiche en overlay plein écran
- [ ] L'iframe charge le formulaire Monetico
- [ ] Le bouton "Fermer" fonctionne
- [ ] Le loader s'affiche pendant le chargement

#### Test 2.2 : Soumission du formulaire
- [ ] Le formulaire est soumis automatiquement vers Monetico
- [ ] L'iframe affiche la page de paiement Monetico
- [ ] Pas d'erreur "Signature invalide" de Monetico

---

### 3. Test du paiement (scénarios)

#### Test 3.1 : Paiement réussi (carte test)
- [ ] Utiliser une carte de test Monetico (si disponible)
- [ ] Compléter le paiement dans l'iframe
- [ ] **Résultat attendu** :
  - Redirection vers `/payment/success`
  - Commande créée dans Supabase avec statut `completed`
  - Référence Monetico sauvegardée
  - Email de confirmation envoyé

#### Test 3.2 : Paiement refusé
- [ ] Utiliser une carte refusée ou annuler le paiement
- [ ] **Résultat attendu** :
  - Redirection vers `/payment/error`
  - Message d'erreur affiché
  - Commande non créée (ou créée avec statut `pending`)

#### Test 3.3 : Abandon du paiement
- [ ] Ouvrir le widget
- [ ] Cliquer sur "Fermer" avant de payer
- [ ] **Résultat attendu** : Widget se ferme, retour au checkout

---

### 4. Test de la route de retour (`/api/monetico/retour`)

#### Test 4.1 : Vérification du MAC
- [ ] **Simuler un retour Monetico** (via curl ou Postman) :
  ```bash
  curl -X POST https://devorbaits.com/api/monetico/retour \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "code-retour=paiement&reference=TEST123456&montant=95.25EUR&date=25/01/2026:12:00:00&MAC=..."
  ```
- [ ] **Résultat attendu** :
  - Si MAC valide : `{"success": true, "reference": "TEST123456"}`
  - Si MAC invalide : `{"error": "Signature invalide"}` (400)

#### Test 4.2 : Mise à jour de la commande
- [ ] Créer une commande avec `monetico_reference = "TEST123456"`
- [ ] Simuler un retour Monetico avec MAC valide
- [ ] **Vérifier dans Supabase** :
  - Commande mise à jour : `status = 'completed'`
  - `transaction_id` sauvegardé (si fourni par Monetico)

#### Test 4.3 : Logs serveur
- [ ] Vérifier les logs Cloudflare (Workers/Pages) :
  - `[MONETICO RETOUR]` avec code-retour, référence, montant
  - `[MONETICO RETOUR] ✅ MAC validé` si succès
  - `[MONETICO RETOUR] MAC invalide` si échec

---

### 5. Test de la page de succès (`/payment/success`)

#### Test 5.1 : Affichage après paiement réussi
- [ ] Après un paiement réussi, vérifier :
  - Référence de commande affichée
  - Montant payé affiché
  - Liste des articles commandés
  - Boutons "Retour à l'accueil" et "Mes commandes"

#### Test 5.2 : Création de la commande
- [ ] Vérifier dans Supabase :
  - Commande créée avec `payment_method = 'monetico'`
  - `monetico_reference` sauvegardé
  - Items de commande corrects
  - Adresse de livraison/retrait sauvegardée

---

### 6. Tests de sécurité

#### Test 6.1 : MAC côté serveur uniquement
- [ ] Vérifier que `MONETICO_CLE_HMAC` n'est **jamais** exposé côté client
- [ ] Vérifier que le calcul du MAC se fait uniquement dans `/api/monetico/route.ts`

#### Test 6.2 : Validation du MAC au retour
- [ ] La route `/api/monetico/retour` vérifie toujours le MAC
- [ ] Un MAC invalide rejette la requête (400)

#### Test 6.3 : Logs sécurisés
- [ ] Les logs n'exposent jamais la clé complète
- [ ] Le MAC est affiché partiellement (premiers + derniers caractères)

---

### 7. Tests de format et validation

#### Test 7.1 : Format de la référence
- [ ] Référence : exactement 12 caractères A-Z0-9
- [ ] Pas de tirets, underscores, caractères spéciaux

#### Test 7.2 : Format du montant
- [ ] Format : `XX.XXEUR` (ex: `95.25EUR`)
- [ ] Validation : montant > 0
- [ ] Pas de virgule, point décimal uniquement

#### Test 7.3 : Format de la date
- [ ] Format : `DD/MM/YYYY:HH:MM:SS` (ex: `25/01/2026:14:30:00`)
- [ ] Date actuelle (pas dans le passé/futur)

---

### 8. Tests de compatibilité

#### Test 8.1 : Navigateurs
- [ ] Chrome/Edge (dernière version)
- [ ] Firefox (dernière version)
- [ ] Safari (dernière version)
- [ ] Mobile (iOS Safari, Chrome Android)

#### Test 8.2 : Responsive
- [ ] Widget iframe s'adapte sur mobile
- [ ] Formulaire Monetico lisible sur petit écran

---

## 🔍 Diagnostic en cas d'erreur

### Erreur : "La signature des informations transmises n'a pas été validée"

**Causes possibles :**
1. ❌ Clé HMAC incorrecte dans Cloudflare
2. ❌ Format du MAC incorrect (champs dans le mauvais ordre)
3. ❌ Champs vides inclus/exclus incorrectement
4. ❌ Encodage UTF-8 incorrect

**Actions :**
1. Vérifier `MONETICO_CLE_HMAC` dans Cloudflare Dashboard (40 caractères hex)
2. Vérifier les logs `[MONETICO macString]` pour voir l'ordre des champs
3. Vérifier que les champs optionnels vides sont exclus du MAC
4. Vérifier l'encodage (UTF-8)

### Erreur : "TPE fermé"

**Causes possibles :**
1. ❌ TPE non activé côté banque
2. ❌ Mauvaise URL (test vs production)
3. ❌ Domaine non autorisé

**Actions :**
1. Contacter la banque pour activer le TPE
2. Vérifier l'URL : `https://paiement.creditmutuel.fr/paiement.cgi` (production)
3. Vérifier que le domaine est autorisé dans l'espace Monetico

### Erreur : Widget ne s'affiche pas

**Causes possibles :**
1. ❌ Erreur API `/api/monetico` (vérifier console)
2. ❌ Iframe bloquée par le navigateur
3. ❌ Erreur JavaScript

**Actions :**
1. Ouvrir la console (F12) et vérifier les erreurs
2. Vérifier la réponse de `/api/monetico` dans l'onglet Network
3. Vérifier que l'iframe n'est pas bloquée par un adblocker

---

## 📋 Checklist finale avant mise en production

- [ ] Tous les tests ci-dessus passent
- [ ] Variables d'environnement configurées en Production Cloudflare
- [ ] URLs de retour configurées dans l'espace Monetico
- [ ] TPE activé et testé avec une vraie transaction
- [ ] Logs serveur vérifiés (pas d'erreurs)
- [ ] Page de succès/erreur fonctionnelle
- [ ] Commandes créées correctement dans Supabase
- [ ] Emails de confirmation envoyés
- [ ] Test sur mobile réussi

---

## 📝 Notes importantes

1. **Mode iframe/widget** : Le paiement s'affiche maintenant dans une iframe au lieu d'une redirection complète
2. **Route de retour** : `/api/monetico/retour` vérifie le MAC avant de rediriger
3. **Sécurité** : La clé HMAC n'est jamais exposée côté client
4. **Logs** : Tous les logs sont sécurisés (pas de clé complète exposée)

---

## 🆘 Support

En cas de problème :
1. Vérifier les logs Cloudflare (Workers/Pages)
2. Vérifier la console navigateur (F12)
3. Vérifier les logs serveur dans `/api/monetico/retour`
4. Contacter le support Monetico/CM-CIC si nécessaire
