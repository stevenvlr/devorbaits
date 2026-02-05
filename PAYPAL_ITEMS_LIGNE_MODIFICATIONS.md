# PayPal – affichage des articles (items) dans la commande

## Objectif

Les produits et quantités sont envoyés à PayPal dans `purchase_units[0].items` pour qu’ils s’affichent dans le récapitulatif PayPal et pour conserver le détail de la commande côté PayPal en cas de litige.

---

## Fichiers modifiés

| Fichier | Modification |
|--------|---------------|
| **`app/api/paypal/create-order/route.ts`** | 1) Exigence de `orderPayload` avec `items` non vides (sinon 400). 2) Construction de `purchase_units[0].items` à partir de `orderPayload.items` (name, quantity, unit_amount, sku). 3) Vérification que `item_total` = somme des (unit_amount × quantity). 4) Envoi de `amount.breakdown` (item_total, shipping). 5) Limites : nom 127 car., sku 127 car., max 100 articles. |
| **`app/checkout/page.tsx`** | Dans `getOrderPayload`, chaque item inclut désormais `name` (via `buildProductNameWithVariants`) et `unit_amount: { currency_code: 'EUR', value: round2(price).toFixed(2) }`. |
| **`app/api/paypal/capture-order/route.ts`** | Type `PayPalOrderPayload` étendu pour accepter `name?` et `unit_amount?` dans les items (compatibilité avec le payload stocké). |

---

## Comportement

- **create-order** : si `orderPayload` est absent ou si `orderPayload.items` est vide → **400** avec le message : *« Le panier est vide ou les détails de la commande sont incomplets. Veuillez actualiser la page et réessayer. »*
- Le client reçoit cette erreur via `onError` du bouton PayPal (message affiché à l’utilisateur).
- Chaque item envoyé à PayPal a : `name` (nom produit + variantes, tronqué à 127 car.), `quantity` (chaîne), `unit_amount` (currency_code + value à 2 décimales), `sku` (product_id, optionnel, tronqué à 127 car.).
- Le `item_total` envoyé dans le breakdown est la somme des (unit_amount × quantity) ; s’il diffère du `itemTotal` du body de plus de 0,01 € → **400** : *« Le total des articles ne correspond pas. Veuillez actualiser la page et réessayer. »*

---

## Comment tester

1. **Flux normal**  
   - Aller au checkout avec un panier contenant au moins un article.  
   - Cliquer sur le bouton PayPal.  
   - Vérifier dans la fenêtre / page PayPal que les lignes (nom produit, quantité, prix unitaire) correspondent au panier.  
   - Valider le paiement et vérifier qu’une commande est bien créée.

2. **Panier vide**  
   - Vider le panier (ou ouvrir le checkout avec 0 article si possible).  
   - Cliquer sur PayPal : l’appel à create-order doit renvoyer **400** et l’utilisateur doit voir le message d’erreur (panier vide / détails incomplets).

3. **Cohérence des montants**  
   - Modifier temporairement le body envoyé par le client (ex. `itemTotal` différent de la somme des items) : create-order doit répondre **400** (total des articles ne correspond pas).

4. **Nom long / SKU**  
   - Ajouter un produit avec un nom très long : le nom doit être tronqué à 127 caractères côté create-order sans faire échouer l’appel PayPal.

5. **Sandbox PayPal**  
   - Tester en mode sandbox : créer une commande et vérifier dans le dashboard PayPal (détail de la transaction) que les items apparaissent bien (name, quantity, unit_amount).
