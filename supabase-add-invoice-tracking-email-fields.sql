-- Ajoute des champs pour automatiser les emails "préparation" (facture) et "expédié" (suivi)
-- Utilisé par la route Next.js: /api/admin/orders/set-status
--
-- Champs ajoutés dans orders (si manquants) :
-- - invoice_number: numéro de facture (ex: FAC-YYYY-xxxxx)
-- - invoice_url: lien vers la facture
-- - shipping_tracking_number: numéro de suivi (pas un lien)
-- - email_preparation_sent_at: anti-doublon email préparation/facture
-- - email_expedie_sent_at: anti-doublon email expédié/suivi

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
      AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN invoice_number TEXT;
    COMMENT ON COLUMN orders.invoice_number IS 'Numéro de facture (ex: FAC-YYYY-xxxxx)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
      AND column_name = 'invoice_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN invoice_url TEXT;
    COMMENT ON COLUMN orders.invoice_url IS 'URL de la facture (PDF) pour la commande';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
      AND column_name = 'shipping_tracking_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_tracking_number TEXT;
    COMMENT ON COLUMN orders.shipping_tracking_number IS 'Numéro de suivi du colis';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
      AND column_name = 'email_preparation_sent_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN email_preparation_sent_at TIMESTAMPTZ;
    COMMENT ON COLUMN orders.email_preparation_sent_at IS 'Timestamp: email préparation/facture envoyé (anti-doublon)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
      AND column_name = 'email_expedie_sent_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN email_expedie_sent_at TIMESTAMPTZ;
    COMMENT ON COLUMN orders.email_expedie_sent_at IS 'Timestamp: email expédié/suivi envoyé (anti-doublon)';
  END IF;
END $$;

