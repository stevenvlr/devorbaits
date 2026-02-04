-- delivery_type: 4 modes (relay, home, pickup_wavignies, pickup_apb)
-- Rétro-compatible: colonne TEXT conservée, valeurs existantes (home, relay, NULL) inchangées.
-- Optionnel: CHECK pour limiter aux 4 valeurs (décommenter si souhaité).

DO $$
BEGIN
  -- Ajouter la colonne si elle n'existe pas (cas ancien schéma)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivery_type'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_type TEXT;
    COMMENT ON COLUMN orders.delivery_type IS 'relay | home | pickup_wavignies | pickup_apb';
  END IF;

  -- Optionnel: contrainte CHECK (décommenter pour forcer les valeurs en base)
  -- Supprimer d'abord une ancienne contrainte si elle existait avec d'autres valeurs
  -- ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_delivery_type_check;
  -- ALTER TABLE orders ADD CONSTRAINT orders_delivery_type_check
  --   CHECK (delivery_type IS NULL OR delivery_type IN ('relay', 'home', 'pickup_wavignies', 'pickup_apb'));
END $$;
