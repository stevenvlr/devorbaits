# Correctif paiements PayPal orphelins – implémentation

## Objectifs

1. **Création de commande indépendante du navigateur** : le payload est stocké côté serveur dans `payment_intents` au moment du clic PayPal ; la commande est créée à la capture, sans dépendre de `/payment/success` ni du localStorage.
2. **Idempotence** : une même transaction PayPal ne crée qu’une seule commande (si `order_id` déjà rempli sur l’intent, on ne recrée pas).
3. **Rattrapage** : page admin pour lister les orphelins et bouton « Rejouer » pour créer la commande depuis le payload.

---

## Fichiers modifiés / créés

### 1. Migration SQL

- **`supabase/migrations/20250205120000_create_payment_intents.sql`** (nouveau)
  - Table `payment_intents` : `id`, `created_at`, `provider`, `paypal_order_id` (UNIQUE), `status` ('created'|'captured'|'failed'|'orphan'), `order_id` (nullable, FK vers `orders.id`), `payload` (jsonb), `last_error`, `processed_at`.
  - Index : `UNIQUE(paypal_order_id)`, `idx_payment_intents_provider_paypal_order_id`, `idx_payment_intents_status`, `idx_payment_intents_order_id`.

### 2. Flux PayPal

- **`app/api/paypal/create-order/route.ts`**
  - Accepte un body optionnel `orderPayload` (même forme que pour capture).
  - Après création de la commande PayPal, si `orderPayload` est présent : upsert dans `payment_intents` avec `provider='paypal'`, `paypal_order_id=order.id`, `status='created'`, `payload=orderPayload`.
  - Utilise `createSupabaseAdmin()` (service role uniquement).

- **`app/api/paypal/capture-order/route.ts`**
  - Après capture PayPal réussie :
    1. Charge l’intent par `paypal_order_id` (orderId).
    2. **Idempotence** : si `intent.order_id` déjà rempli → récupère la commande existante et la retourne (pas de nouvelle création).
    3. Si intent trouvé et `order_id` null → crée la commande depuis `intent.payload`, met à jour l’intent (`status='captured'`, `order_id`, `processed_at`), envoie Telegram. En cas d’erreur → `status='failed'`, `last_error`.
    4. **Fallback** : si aucun intent trouvé mais `orderPayload` dans le body → comportement actuel (création depuis le body).
  - Utilise `createSupabaseAdmin()` pour lire/écrire `payment_intents`.

- **`components/PayPalButton.tsx`**
  - Dans `createOrder`, appelle `getOrderPayload()` (si fourni) et envoie `orderPayload` dans le body de `/api/paypal/create-order`.
  - Le payload est donc enregistré **avant** la redirection PayPal.

### 3. Admin orphelins

- **`app/api/admin/payments/orphans/route.ts`** (nouveau)
  - **GET** : liste les `payment_intents` où (`status='captured'` ET `order_id IS NULL`) ou `status='failed'`.
  - Protégé : `x-internal-key` (EMAIL_INTERNAL_KEY) ou session Supabase avec `profiles.role = 'admin'`.
  - Utilise `SUPABASE_SERVICE_ROLE_KEY` (jamais `NEXT_PUBLIC_*` pour les secrets).

- **`app/api/admin/payments/replay/route.ts`** (nouveau)
  - **POST** body : `{ intentId: string }` ou `{ paypal_order_id: string }`.
  - Charge l’intent ; si `order_id` déjà rempli → retourne succès sans recréer (idempotence).
  - Sinon crée la commande depuis `payload`, met à jour l’intent, envoie la notif Telegram.
  - Même protection admin que ci-dessus.

- **`app/admin/payments/orphans/page.tsx`** (nouveau)
  - Page admin qui appelle `GET /api/admin/payments/orphans` (avec Bearer token session).
  - Affiche la liste (paypal_order_id, status, référence, email, total, last_error).
  - Bouton « Rejouer création commande » qui appelle `POST /api/admin/payments/replay` avec `intentId`.

- **`app/admin/page.tsx`**
  - Ajout d’un lien « Paiements orphelins » vers `/admin/payments/orphans`.

---

## Comment tester

### 1. Appliquer la migration

- Supabase Dashboard → SQL Editor, ou CLI : `supabase db push`.
- Exécuter le contenu de `supabase/migrations/20250205120000_create_payment_intents.sql`.

### 2. Flux normal (create-order enregistre l’intent, capture crée la commande)

- Aller au checkout, remplir le panier, choisir PayPal.
- Au clic sur le bouton PayPal, le client envoie `orderPayload` à `create-order` → l’intent est créé dans `payment_intents` avec `status='created'`.
- Après approbation PayPal, `capture-order` est appelé → capture PayPal, charge l’intent par `paypal_order_id`, crée la commande, met à jour l’intent (`status='captured'`, `order_id`), envoie Telegram.
- Vérifier dans Supabase : une ligne dans `payment_intents` avec `order_id` rempli et une commande dans `orders`.

### 3. Idempotence (capture appelée deux fois)

- Simuler un double appel à `capture-order` avec le même `orderId` (même paypal_order_id) :
  - 1er appel : crée la commande, remplit `order_id` sur l’intent.
  - 2e appel : charge l’intent, voit `order_id` déjà rempli → ne crée pas de nouvelle commande, retourne la commande existante.
- Vérifier dans `orders` qu’une seule commande existe pour ce paiement.

### 4. Page admin orphelins

- Se connecter en admin, aller sur `/admin` puis « Paiements orphelins » (ou `/admin/payments/orphans`).
- Doit lister les intents avec `status='captured'` et `order_id` null, ou `status='failed'`.
- Cliquer « Rejouer création commande » sur une ligne : doit créer la commande, mettre à jour l’intent, envoyer Telegram. Recliquer : doit indiquer « Commande déjà créée (idempotence) » sans doublon.

### 5. (Optionnel) Orphelin volontaire pour test

- En base : insérer un intent avec `status='captured'`, `order_id=null`, et un `payload` valide (reference, items, total, deliveryType, pickupPoint si relay, etc.).
- Aller sur la page orphelins → la ligne apparaît → « Rejouer » → la commande doit être créée et l’intent mis à jour.

---

## Contraintes respectées

- **Server-only** : `payment_intents` lu/écrit uniquement via API routes avec `createSupabaseAdmin()` (SUPABASE_SERVICE_ROLE_KEY).
- **Pas de NEXT_PUBLIC_* pour les secrets** : seuls les env non publics sont utilisés pour PayPal secret et Supabase service role.
- **Edge / Cloudflare** : routes en `export const runtime = 'edge'` ; pas de dépendances Node spécifiques.
- **Flux actuel préservé** : si aucun intent n’existe pour un `orderId` (ancien client ou create-order sans payload), `capture-order` utilise le `orderPayload` du body comme avant.
