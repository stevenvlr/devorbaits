-- Table payment_intents : stockage côté serveur des intentions de paiement (PayPal)
-- Permet création de commande à la capture sans dépendre du navigateur + idempotence + rattrapage orphelins

CREATE TABLE IF NOT EXISTS payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  provider text NOT NULL DEFAULT 'paypal',
  paypal_order_id text NOT NULL,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'captured', 'failed', 'orphan')),
  order_id uuid REFERENCES orders(id),
  payload jsonb NOT NULL DEFAULT '{}',
  last_error text,
  processed_at timestamptz,
  UNIQUE(paypal_order_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_intents_provider_paypal_order_id
  ON payment_intents (provider, paypal_order_id);

CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents (status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_order_id ON payment_intents (order_id) WHERE order_id IS NOT NULL;

COMMENT ON TABLE payment_intents IS 'Intentions de paiement (PayPal) : payload stocké avant redirect, commande créée à la capture. Idempotence via order_id.';
