# Intégration Monetico v3.0 - Mode Iframe/Widget - COMPLÈTE

## ✅ Corrections appliquées

### Problème résolu
**Erreur initiale** : "La signature des informations transmises n'a pas été validée"

**Cause identifiée** : 
- Calcul du MAC incorrect (champs optionnels vides inclus)
- Pas de route de retour pour vérifier le MAC
- Mode redirection classique au lieu d'iframe/widget

**Solutions appliquées** :
1. ✅ Correction du calcul du MAC (exclusion des champs optionnels vides)
2. ✅ Création de la route `/api/monetico/retour` pour vérifier le MAC
3. ✅ Implémentation du mode iframe/widget
4. ✅ Logging sécurisé (sans exposer la clé)

---

## 📁 Fichiers modifiés

### 1. `app/api/monetico/route.ts`
**Modifications** :
- Correction du calcul du MAC : exclusion des champs optionnels vides (`texte-libre`, `options`, `nbrech`, etc.)
- Exclusion des URLs de retour du calcul MAC
- Amélioration du logging sécurisé (MAC tronqué)

**Lignes modifiées** : ~211-231

### 2. `lib/monetico.ts`
**Modifications** :
- Fonction `startMoneticoPayment()` modifiée pour retourner les données au lieu de soumettre directement
- Suppression de la soumission automatique du formulaire
- Retour de `{ action, fields }` pour le widget

**Lignes modifiées** : ~197-305

### 3. `app/checkout/page.tsx`
**Modifications** :
- Import de `startMoneticoPayment` au lieu de `submitMoneticoPayment`
- Import du composant `MoneticoWidget`
- Ajout de l'état `moneticoWidget`
- Modification de la logique de paiement pour utiliser le widget
- Ajout du composant `<MoneticoWidget />` dans le JSX

**Lignes modifiées** : ~24, ~136, ~1055-1067, ~2435-2450

### 4. `wrangler.toml`
**Modifications** :
- Ajout de `NEXT_PUBLIC_MONETICO_URL_RETOUR_OK`
- Mise à jour de `NEXT_PUBLIC_MONETICO_URL_RETOUR` pour pointer vers `/api/monetico/retour`

**Lignes modifiées** : ~29-31

---

## 📁 Fichiers créés

### 1. `app/api/monetico/retour/route.ts` (NOUVEAU)
**Fonctionnalité** :
- Route POST pour recevoir les notifications Monetico
- Vérification du MAC reçu vs MAC calculé
- Mise à jour de la commande dans Supabase (statut `completed`)
- Route GET pour redirection utilisateur (fallback)

**Méthodes** :
- `POST` : Notification serveur Monetico (vérifie MAC, met à jour commande)
- `GET` : Redirection utilisateur vers page succès/erreur

### 2. `components/MoneticoWidget.tsx` (NOUVEAU)
**Fonctionnalité** :
- Composant React pour afficher Monetico dans une iframe
- Overlay plein écran avec bouton fermer
- Gestion du chargement et des erreurs
- Écoute des messages depuis l'iframe (postMessage)

**Props** :
- `action` : URL Monetico
- `fields` : Champs du formulaire
- `onClose` : Callback fermeture
- `onSuccess` : Callback succès
- `onError` : Callback erreur

### 3. `MONETICO_CHECKLIST_TEST.md` (NOUVEAU)
**Contenu** :
- Checklist complète de tests
- Prérequis et configuration
- Tests par scénario (succès, erreur, abandon)
- Diagnostic des erreurs courantes
- Checklist finale avant production

### 4. `MONETICO_INTEGRATION_COMPLETE.md` (CE FICHIER)
**Contenu** :
- Récapitulatif des modifications
- Liste des fichiers modifiés/créés
- Instructions de déploiement

---

## 🔧 Configuration requise

### Variables Cloudflare (Production)

#### Variables Plain Text (wrangler.toml)
```toml
NEXT_PUBLIC_MONETICO_TPE = "0917217"
MONETICO_SOCIETE = "DEVORBAITS"
NEXT_PUBLIC_MONETICO_SOCIETE = "DEVORBAITS"
NEXT_PUBLIC_MONETICO_URL = "https://paiement.creditmutuel.fr/paiement.cgi"
NEXT_PUBLIC_MONETICO_URL_RETOUR = "https://devorbaits.com/api/monetico/retour"
NEXT_PUBLIC_MONETICO_URL_RETOUR_OK = "https://devorbaits.com/payment/success/"
NEXT_PUBLIC_MONETICO_URL_RETOUR_ERR = "https://devorbaits.com/payment/error/"
```

#### Variables Secrets (Cloudflare Dashboard)
```
MONETICO_CLE_HMAC = [votre clé secrète 40 caractères hex]
```

### Configuration Monetico/CM-CIC

Dans l'espace Monetico, configurer :
- **URL retour OK** : `https://devorbaits.com/payment/success/`
- **URL retour ERREUR** : `https://devorbaits.com/payment/error/`
- **URL notification** : `https://devorbaits.com/api/monetico/retour` (optionnel)

---

## 🚀 Déploiement

### Étapes

1. **Vérifier les variables Cloudflare** :
   - Aller dans Cloudflare Dashboard → Pages → devorbaits → Settings → Environment Variables
   - Vérifier que `MONETICO_CLE_HMAC` est défini en **Production** (et Preview si nécessaire)

2. **Déployer le code** :
   ```bash
   git add .
   git commit -m "Fix: Intégration Monetico v3.0 avec iframe/widget et vérification MAC"
   git push
   ```

3. **Vérifier le déploiement** :
   - Attendre que Cloudflare Pages déploie
   - Vérifier les logs de build (pas d'erreurs)

4. **Tester en production** :
   - Aller sur `https://devorbaits.com/checkout`
   - Tester un paiement (mode test si disponible)
   - Vérifier les logs Cloudflare (Workers/Pages)

---

## 🔍 Vérifications post-déploiement

### 1. Test de génération du paiement
- [ ] Aller sur `/checkout`
- [ ] Cliquer sur "Paiement par carte"
- [ ] Widget iframe s'affiche
- [ ] Pas d'erreur dans la console

### 2. Test de la route de retour
- [ ] Vérifier que `/api/monetico/retour` répond (200)
- [ ] Tester avec un retour Monetico simulé (voir checklist)

### 3. Vérification des logs
- [ ] Logs Cloudflare : `[MONETICO INIT]` présent
- [ ] Logs Cloudflare : `[MONETICO RETOUR]` présent lors d'un retour
- [ ] Pas d'erreur `MONETICO_CLE_HMAC non configuré`

---

## 📊 Flux de paiement

### Ancien flux (redirection)
```
Checkout → API /api/monetico → Form submit → Redirection Monetico → Retour page succès
```

### Nouveau flux (iframe/widget)
```
Checkout → API /api/monetico → Widget iframe → Paiement dans iframe → Retour page succès
                                    ↓
                            Notification POST → /api/monetico/retour (vérifie MAC)
```

---

## 🛡️ Sécurité

### Mesures implémentées

1. **Clé HMAC côté serveur uniquement** :
   - `MONETICO_CLE_HMAC` jamais exposée au client
   - Calcul du MAC uniquement dans `/api/monetico/route.ts`

2. **Vérification du MAC au retour** :
   - Route `/api/monetico/retour` vérifie toujours le MAC
   - Rejet si MAC invalide (400)

3. **Logging sécurisé** :
   - MAC affiché partiellement (premiers + derniers caractères)
   - Clé jamais loggée complète

4. **Iframe sécurisée** :
   - Sandbox restrictions
   - Vérification de l'origine des messages

---

## 📝 Notes importantes

1. **Mode iframe/widget** : Le paiement s'affiche maintenant dans une iframe au lieu d'une redirection complète. Cela améliore l'expérience utilisateur.

2. **Route de retour** : La route `/api/monetico/retour` vérifie le MAC avant de mettre à jour la commande. C'est critique pour la sécurité.

3. **Champs optionnels vides** : Les champs optionnels vides (`texte-libre`, `options`, etc.) sont maintenant exclus du calcul du MAC, conformément à la documentation Monetico v3.0.

4. **URLs de retour** : Les URLs `url_retour`, `url_retour_ok`, `url_retour_err` sont exclues du calcul du MAC (conforme à la doc Monetico).

---

## 🆘 Support

En cas de problème :
1. Consulter `MONETICO_CHECKLIST_TEST.md` pour le diagnostic
2. Vérifier les logs Cloudflare (Workers/Pages)
3. Vérifier la console navigateur (F12)
4. Contacter le support Monetico/CM-CIC si nécessaire

---

## ✅ Checklist finale

- [x] Calcul du MAC corrigé
- [x] Route de retour créée et sécurisée
- [x] Mode iframe/widget implémenté
- [x] Logging sécurisé ajouté
- [x] Page checkout mise à jour
- [x] Checklist de test créée
- [x] Documentation complète

**Prêt pour les tests en production !** 🚀
