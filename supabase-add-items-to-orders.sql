-- Ajouter le champ items (JSONB) dans la table orders pour stocker les articles directement
-- Ce champ remplace la nécessité d'utiliser la table order_items séparée

-- Ajouter la colonne items si elle n'existe pas déjà
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- Créer un index GIN pour améliorer les performances des requêtes sur le champ JSONB
CREATE INDEX IF NOT EXISTS idx_orders_items ON orders USING GIN (items);

-- Commentaire pour documenter le champ
COMMENT ON COLUMN orders.items IS 'Tableau JSON des articles commandés. Format: [{"id": "...", "product_id": "...", "variant_id": "...", "quantity": 1, "price": 10.00, "arome": "...", "taille": "...", "couleur": "...", "diametre": "...", "conditionnement": "...", "forme": "...", "saveur": "...", "produit": "...", "created_at": "..."}]';

-- Optionnel : Migrer les données existantes de order_items vers orders.items
-- Cette requête met à jour toutes les commandes existantes avec leurs items
UPDATE orders o
SET items = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', oi.id,
        'product_id', oi.product_id,
        'variant_id', oi.variant_id,
        'quantity', oi.quantity,
        'price', oi.price,
        'created_at', oi.created_at::text
      )
      ORDER BY oi.created_at
    )
    FROM order_items oi
    WHERE oi.order_id = o.id
  ),
  '[]'::jsonb
)
WHERE EXISTS (
  SELECT 1 FROM order_items oi WHERE oi.order_id = o.id
);

