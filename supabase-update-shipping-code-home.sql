-- ============================================
-- Mise à jour du code d'offre livraison domicile
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor

UPDATE boxtal_config
SET 
  shipping_offer_code_home = 'CHRP-Chrono18',
  updated_at = NOW();

-- Vérification
SELECT 
  shipping_offer_code_relay as "Point Relais",
  shipping_offer_code_home as "Domicile",
  updated_at as "Mis à jour"
FROM boxtal_config;
