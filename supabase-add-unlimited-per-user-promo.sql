-- Migration pour ajouter l'option "utilisation illimitée par utilisateur" aux codes promo
-- Utile pour les clients sponsorisés qui peuvent utiliser leur code à chaque commande

-- Ajouter la colonne unlimited_per_user à la table promo_codes
ALTER TABLE promo_codes 
ADD COLUMN IF NOT EXISTS unlimited_per_user BOOLEAN DEFAULT FALSE;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN promo_codes.unlimited_per_user IS 'Si TRUE, le code peut être utilisé plusieurs fois par le même utilisateur (pour les clients sponsorisés)';

-- Mettre à jour les politiques RLS si nécessaire (la colonne est déjà couverte par les politiques existantes)
-- Pas de changement nécessaire car on utilise SELECT * dans les politiques

-- Vérification
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'promo_codes' AND column_name = 'unlimited_per_user';
