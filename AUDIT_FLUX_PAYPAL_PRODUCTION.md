# Audit du flux PayPal (production)

## 1. Flux de bout en bout (schéma en 10 étapes)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  NAVIGATEUR (Checkout)                                                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  1. Utilisateur remplit panier, adresse, mode de retrait → état React (useState)         │
│  2. Clic sur bouton PayPal → createOrder() du composant PayPalButton                     │
│     → onBeforePayment() (fixe orderReference si besoin)                                  │
│     → getOrderPayload() : lit l’état actuel (panier, total, livraison, pickup_point)     │
│     → POST /api/paypal/create-order { amount, itemTotal, shippingTotal, reference,       │
│         currency, orderPayload }                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  SERVEUR – create-order                                                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  3. /api/paypal/create-order (route Edge)                                                │
│     • Valide montants, récupère token PayPal, crée la commande côté PayPal (orders v2)   │
│     • Reçoit order.id (paypal_order_id) de PayPal                                        │
│     • Si orderPayload présent et valide → UPSERT payment_intents                         │
│         (provider=paypal, paypal_order_id=order.id, status=created, payload=orderPayload)│
│     • Log: [PAYPAL_CREATE_ORDER] paypal_order_id=… intentId=… ou intentSkipped=noPayload │
│     • Retourne { id: order.id, status }                                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  NAVIGATEUR                                                                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  4. SDK PayPal ouvre la fenêtre / redirection PayPal ; utilisateur paie                  │
│  5. Après approbation, SDK appelle onApprove(data) → data.orderID = paypal_order_id      │
│     → getOrderPayload() à nouveau (pour fallback)                                         │
│     → POST /api/paypal/capture-order { orderId, expectedTotal, expectedItemTotal,        │
│         expectedShippingTotal, orderPayload? }                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  SERVEUR – capture-order                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  6. /api/paypal/capture-order (route Edge)                                                │
│     • Appel PayPal POST …/orders/{orderId}/capture → argent débité                       │
│     • Récupère détails commande PayPal (montants)                                        │
│     • SELECT payment_intents WHERE paypal_order_id = orderId                             │
│     • Log: [PAYPAL_CAPTURE] paypal_order_id=… intentFound=true|false                      │
│  7. Si intent trouvé ET intent.order_id déjà rempli → idempotence                        │
│     • Récupère la commande existante (orders), la retourne                               │
│     • Log: orderCreated=false orderId=… (idempotence)                                    │
│  8. Si intent trouvé ET intent.order_id null → créer la commande                        │
│     • createOrderAction(intent.payload) → INSERT orders                                   │
│     • UPDATE payment_intents SET status=captured, order_id=…, processed_at=…            │
│     • sendNewOrderNotification() (Telegram)                                             │
│     • Log: orderCreated=true orderId=…                                                   │
│  9. Si intent non trouvé ET orderPayload dans le body → fallback                         │
│     • createOrderAction(orderPayload) (pas d’écriture payment_intents)                   │
│     • Log: intentFound=false orderCreated=true|false orderId=… (fallback)               │
│ 10. Réponse JSON { success, order, createdOrder, paymentId, … }                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  NAVIGATEUR                                                                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  • onSuccess(orderId, paymentId, createdOrder)                                           │
│  • Si createdOrder : promo, adresse, point relais, facture, clearCart, redirect         │
│  • Si pas createdOrder (fallback) : idem création côté client dans onSuccess            │
│  • Redirection vers /payment/success?reference=…&montant=…&payment_method=paypal        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Quand la commande est créée** : côté serveur dans **capture-order**, après que PayPal a répondu OK à la capture (étape 8 ou 9). Pas dans /payment/success ni dans un effet côté client après redirection.

**Données utilisées** :
- **Source de vérité pour la commande** : `payment_intents.payload` (enregistré à l’étape 3) ou, en fallback, `orderPayload` du body de capture-order (étape 5).
- **Aucune dépendance** à localStorage ou session pour la création de commande : tout ce qu’il faut est dans `payload` (panier, livraison, pickup_point, totaux, user_id, etc.).

---

## 2. Fichiers et handlers

| Étape | Fichier / handler | Rôle |
|-------|-------------------|------|
| 2–3 | `components/PayPalButton.tsx` | createOrder : appelle getOrderPayload(), POST create-order avec orderPayload |
| 3 | `app/api/paypal/create-order/route.ts` | Crée commande PayPal, upsert payment_intents avec payload, log [PAYPAL_CREATE_ORDER] |
| 5–6 | `components/PayPalButton.tsx` | onApprove : POST capture-order avec orderId + orderPayload (fallback) |
| 6–10 | `app/api/paypal/capture-order/route.ts` | Capture PayPal, charge intent, idempotence ou création depuis payload, Telegram, logs [PAYPAL_CAPTURE] |
| Création commande | `app/actions/create-order.ts` | createOrderAction() : insert orders (appelé par capture-order ou replay) |
| Checkout | `app/checkout/page.tsx` | getOrderPayload(), onSuccess() : promo, adresse, facture, clearCart, redirect |
| Affichage succès | `app/payment/success/page.tsx` | Affiche la page succès ; **ne crée pas** de commande pour PayPal |

---

## 3. Indépendance par rapport à /payment/success et au navigateur

- La commande est **créée dans capture-order** (serveur), dès que la capture PayPal a réussi et qu’un payload est disponible (intent ou body).
- **/payment/success** est uniquement une page de confirmation : elle lit `reference` et `montant` en query et affiche le détail. Elle n’appelle pas create-order ni capture-order.
- Si l’utilisateur ferme l’onglet après avoir payé mais avant que la réponse de capture-order soit traitée :
  - La capture a déjà été faite côté PayPal (étape 6).
  - Si le **client** n’a pas reçu la réponse, le **serveur** a quand même exécuté la création de commande (étape 8) car elle est synchrone dans la même requête.
- Si la **requête** capture-order n’est jamais envoyée (ex. crash avant l’appel fetch) : le paiement peut être capturé plus tard via un autre appel (ex. rejeu) ou rester orphelin ; dans ce cas la page admin orphelins + replay permet de rattraper à partir du payload stocké dans payment_intents (si create-order avait bien été appelé à l’étape 3).

---

## 4. Idempotence

- Dans capture-order, après `SELECT payment_intents WHERE paypal_order_id = orderId` :
  - Si `intent.order_id` est déjà rempli : on ne rappelle pas createOrderAction, on charge la commande existante et on la retourne. Log : `orderCreated=false orderId=… (idempotence)`.
- Re-capture du même `paypal_order_id` (double clic, retry, script) : un seul enregistrement dans `orders`, pas de doublon.
- La table `payment_intents` a `UNIQUE(paypal_order_id)` ; un seul intent par commande PayPal.

---

## 5. create-order et orderPayload / payment_intents

- **Qui envoie orderPayload** : `PayPalButton` dans `createOrder`, via `getOrderPayload()` fourni par le checkout.
- **Ce qui est enregistré** : si `orderPayload?.reference` et `orderPayload.items?.length > 0`, upsert dans `payment_intents` avec `paypal_order_id = order.id` (réponse PayPal) et `payload = orderPayload`.
- **Si create-order n’est jamais appelé** (ex. erreur avant, ou ancien client qui n’envoie pas le payload) :
  - Aucune ligne dans `payment_intents` pour ce `paypal_order_id`.
  - À la capture, `intentFound=false` ; la création de commande ne peut se faire que via le **fallback** si le **body** de capture-order contient `orderPayload` (envoyé par le client dans onApprove). Si le client ne charge jamais la page après paiement (onglet fermé avant onApprove), il n’y a pas d’appel capture-order → pas de commande. D’où l’importance d’appeler create-order avec orderPayload pour tout nouveau flux.

---

## 6. Logs serveur (non sensibles)

Ajoutés dans le code :

**create-order**
- `[PAYPAL_CREATE_ORDER] paypal_order_id=%s intentId=%s` — intent enregistré
- `[PAYPAL_CREATE_ORDER] paypal_order_id=%s intentSaved=false error=%s` — erreur upsert
- `[PAYPAL_CREATE_ORDER] paypal_order_id=%s intentSkipped=noPayload` — pas de payload envoyé

**capture-order**
- `[PAYPAL_CAPTURE] paypal_order_id=%s intentFound=%s` — au chargement de l’intent
- `[PAYPAL_CAPTURE] paypal_order_id=%s intentFound=true orderCreated=false orderId=%s (idempotence)`
- `[PAYPAL_CAPTURE] paypal_order_id=%s intentFound=true orderCreated=true orderId=%s`
- `[PAYPAL_CAPTURE] paypal_order_id=%s intentFound=true orderCreated=false error=%s`
- `[PAYPAL_CAPTURE] paypal_order_id=%s intentFound=false usingBodyPayload=true`
- `[PAYPAL_CAPTURE] paypal_order_id=%s intentFound=false orderCreated=true orderId=%s (fallback)`
- `[PAYPAL_CAPTURE] paypal_order_id=%s intentFound=false orderCreated=false error=%s`

Aucun log n’inclut d’email, mot de passe, ou token.

---

## 7. Risques restants et couverture

| Risque | Couverture actuelle |
|--------|---------------------|
| Client ferme l’onglet après paiement PayPal, avant que capture-order soit appelé | Le plus souvent la capture est déclenchée par le clic « Valider » dans la popup PayPal, puis le navigateur envoie capture-order. Si la requête part, la commande est créée côté serveur dans la même requête. Si la requête ne part jamais (crash avant fetch), pas de commande → voir orphelins + replay. |
| create-order ne reçoit pas orderPayload (bug ou ancien client) | Aucun intent enregistré. À la capture, fallback sur orderPayload du body. Si le client envoie bien orderPayload dans capture-order, la commande est créée. Sinon, pas de création → orphelin ; pas de replay possible sans payload (sauf saisie manuelle). |
| Double exécution de capture-order (retry, double clic) | Idempotence : si intent.order_id déjà rempli, on ne recrée pas de commande. |
| Erreur createOrderAction (relay sans pickup_point, Supabase down) | payment_intents mis à jour en status=failed, last_error renseigné. Page admin orphelins liste ces intents ; replay possible après correction (ex. choix d’un point relais). |
| Paiement capturé par PayPal mais timeout / 5xx avant réponse au client | Côté serveur la création a normalement déjà eu lieu (même requête). Si la requête a planté après capture PayPal mais avant createOrderAction, intent peut rester sans order_id → orphelin ; replay depuis payload. |

---

## 8. Comment tester en prod sans impacter les clients

1. **Petite commande test**  
   - Créer un compte test ou utiliser un compte existant.  
   - Un article peu cher (ex. 1 bouillette).  
   - Mode livraison ou retrait avec point relais valide.  
   - Payer avec PayPal (ou carte via PayPal).  
   - Vérifier : une ligne dans `payment_intents` (paypal_order_id, status=captured, order_id rempli), une commande dans `orders`, notif Telegram.

2. **Vérifier les logs**  
   - Dans Cloudflare (Pages / Workers logs) : [PAYPAL_CREATE_ORDER] puis [PAYPAL_CAPTURE] avec intentFound=true, orderCreated=true, orderId=…

3. **Tester l’idempotence**  
   - En dev/staging : appeler deux fois POST /api/paypal/capture-order avec le même orderId (et les mêmes body/headers que le client). Vérifier qu’une seule commande existe et que le 2e appel retourne la même commande (orderCreated=false dans les logs).

4. **Remboursement de la commande test**  
   - Dans le dashboard PayPal : trouver la transaction et effectuer un remboursement.  
   - Côté métier : annuler ou marquer la commande test comme annulée / remboursée si besoin.

5. **Tester la page orphelins**  
   - En base : un intent avec status=captured et order_id=null (ou status=failed), avec un payload valide.  
   - Admin → Paiements orphelins → « Rejouer création commande ».  
   - Vérifier qu’une commande est créée, l’intent mis à jour, et Telegram envoyé.

---

## 9. Fichiers modifiés (cette audit + logs)

- `app/api/paypal/create-order/route.ts` — récupération de l’id intent après upsert, logs [PAYPAL_CREATE_ORDER].
- `app/api/paypal/capture-order/route.ts` — logs [PAYPAL_CAPTURE] (intentFound, orderCreated, orderId, error).
- `AUDIT_FLUX_PAYPAL_PRODUCTION.md` — ce document.
