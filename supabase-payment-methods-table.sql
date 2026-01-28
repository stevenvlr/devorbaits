-- ============================================
-- TABLE PAYMENT_METHODS (pour masquer temporairement des moyens de paiement)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  method TEXT NOT NULL UNIQUE, -- 'paypal' ou 'card' (Monetico)
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_method ON payment_methods(method);

-- RLS pour payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admins can manage payment methods" ON payment_methods;

CREATE POLICY "Anyone can view payment methods"
  ON payment_methods FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage payment methods"
  ON payment_methods FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insérer les moyens de paiement par défaut (tous activés)
INSERT INTO payment_methods (method, enabled)
VALUES 
  ('paypal', true),
  ('card', true)
ON CONFLICT (method) DO NOTHING;
