-- ============================================
-- CORRECTION DU PROBLÈME D'INSCRIPTION
-- ============================================
-- Exécutez ce script dans Supabase Dashboard > SQL Editor
-- Ce script corrige la politique RLS qui bloque la création de comptes

-- 1. Supprimer les anciennes politiques d'insertion
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for service role" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

-- 2. Créer une politique qui permet l'insertion pour tous
-- (Le trigger handle_new_user s'exécute avec SECURITY DEFINER, 
-- mais la politique RLS peut quand même bloquer l'insertion)
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT WITH CHECK (true);

-- 3. S'assurer que le trigger existe et fonctionne
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
    role,
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
    'user',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    nom = COALESCE(NULLIF(EXCLUDED.nom, ''), profiles.nom),
    prenom = COALESCE(NULLIF(EXCLUDED.prenom, ''), profiles.prenom),
    telephone = COALESCE(EXCLUDED.telephone, profiles.telephone),
    adresse = COALESCE(EXCLUDED.adresse, profiles.adresse),
    code_postal = COALESCE(EXCLUDED.code_postal, profiles.code_postal),
    ville = COALESCE(EXCLUDED.ville, profiles.ville);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. S'assurer que la colonne role existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 6. Vérifier les autres politiques nécessaires
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 7. Permettre aux admins de voir tous les profils
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Message de confirmation
SELECT 'Correction appliquée ! Les inscriptions devraient maintenant fonctionner.' as message;
