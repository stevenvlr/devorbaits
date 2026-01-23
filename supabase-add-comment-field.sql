-- Ajouter le champ comment dans la table orders
-- Ce champ permet de stocker un commentaire optionnel de la commande (max 500 caractères)

-- Ajouter la colonne comment si elle n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'comment'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN comment TEXT;
    
    -- Ajouter un commentaire pour documenter la colonne
    COMMENT ON COLUMN orders.comment IS 'Commentaire optionnel de la commande (max 500 caractères, stocké en texte brut)';
  END IF;
END $$;

-- Note: La validation de la longueur max (500 caractères) est gérée côté application
-- pour éviter les problèmes de performance avec les contraintes CHECK
