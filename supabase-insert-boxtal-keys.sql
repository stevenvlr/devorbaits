-- ============================================
-- INSÉRER LES CLÉS API BOXTAL
-- ============================================
-- Ce script insère ou met à jour vos clés API Boxtal dans Supabase
-- Exécutez ce script dans Supabase SQL Editor après avoir créé la table boxtal_config

-- Supprimer l'ancienne configuration si elle existe
DELETE FROM boxtal_config;

-- Insérer la nouvelle configuration avec vos clés API
INSERT INTO boxtal_config (
  api_key,
  api_secret,
  environment,
  shipping_offer_code,
  from_first_name,
  from_last_name,
  from_email,
  from_phone,
  from_street,
  from_city,
  from_postal_code,
  from_country
)
VALUES (
  '3XPEN8SYAG0FG2XOD79SMDRS1LYJYI47OH6U96UX',  -- Votre clé API
  '5196ab4b-6043-4929-83c1-753b25106355',       -- Votre clé secrète
  'test',                                        -- Mode test (changez en 'production' pour les vraies expéditions)
  'MONR-CpourToi',                              -- Code d'offre (à ajuster selon votre configuration Boxtal)
  'Votre',                                      -- Prénom expéditeur
  'Entreprise',                                 -- Nom expéditeur
  'contact@example.com',                        -- Email expéditeur (à remplacer)
  '+33612345678',                               -- Téléphone expéditeur (à remplacer)
  '4 boulevard des Capucines',                 -- Adresse expéditeur (à remplacer)
  'Paris',                                      -- Ville expéditeur (à remplacer)
  '75009',                                      -- Code postal expéditeur (à remplacer)
  'FR'                                          -- Pays expéditeur
);

