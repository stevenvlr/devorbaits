-- ============================================
-- AJOUT DU CHAMP SHIPPING_TYPE
-- ============================================
-- Ce script ajoute un champ pour distinguer les tarifs d'envoi à domicile et point relais

-- Ajouter la colonne shipping_type
ALTER TABLE shipping_prices 
ADD COLUMN IF NOT EXISTS shipping_type TEXT DEFAULT 'home' 
CHECK (shipping_type IN ('home', 'relay'));

-- Mettre à jour les enregistrements existants pour qu'ils soient de type 'home' par défaut
UPDATE shipping_prices 
SET shipping_type = 'home' 
WHERE shipping_type IS NULL;

-- Commentaire pour clarifier les valeurs
COMMENT ON COLUMN shipping_prices.shipping_type IS 
'Type d''envoi: home = livraison à domicile, relay = point relais';
