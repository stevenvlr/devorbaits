-- Script pour corriger le problème des noms/prénoms non enregistrés
-- À exécuter dans Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Mettre à jour la fonction pour récupérer les métadonnées utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    nom,
    prenom,
    telephone,
    adresse,
    code_postal,
    ville,
    created_at
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    NEW.raw_user_meta_data->>'telephone',
    NEW.raw_user_meta_data->>'adresse',
    NEW.raw_user_meta_data->>'code_postal',
    NEW.raw_user_meta_data->>'ville',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    nom = COALESCE(EXCLUDED.nom, profiles.nom),
    prenom = COALESCE(EXCLUDED.prenom, profiles.prenom),
    telephone = COALESCE(EXCLUDED.telephone, profiles.telephone),
    adresse = COALESCE(EXCLUDED.adresse, profiles.adresse),
    code_postal = COALESCE(EXCLUDED.code_postal, profiles.code_postal),
    ville = COALESCE(EXCLUDED.ville, profiles.ville);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. S'assurer que le trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Message de confirmation
SELECT 'Trigger mis à jour ! Les noms et prénoms seront maintenant enregistrés lors de l''inscription.' as message;
