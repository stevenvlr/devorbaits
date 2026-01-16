# 📍 Où mettre ".next" dans Cloudflare Pages

## ✅ Dans l'interface Cloudflare Pages

### Étape 1 : Aller dans les paramètres

1. **Allez sur https://dash.cloudflare.com**
2. **Cliquez sur "Workers & Pages"** (menu de gauche)
3. **Cliquez sur "Pages"**
4. **Cliquez sur votre projet** (dévorbait)

### Étape 2 : Aller dans Build configuration

1. **Cliquez sur "Settings"** (Paramètres) - en haut à droite ou dans le menu de gauche
2. **Cliquez sur "Builds & deployments"** ou **"Build configuration"**
3. **Cherchez le champ "Build output directory"** ou **"Output directory"**

### Étape 3 : Mettre la valeur

1. **Dans le champ "Build output directory"**, mettez :
   ```
   .next
   ```
2. **Sauvegardez** (bouton "Save" ou "Enregistrer")

## 📋 Configuration complète

Dans **Build configuration**, vous devez avoir :

- **Build command** : `npm run build`
- **Build output directory** : `.next` ← **C'EST ICI**
- **Deploy command** : `echo "Deploy complete"`
- **Non-production branch deploy command** : `echo "Deploy complete"`
- **Root directory** : `/` (ou vide)

## 🔍 Si vous ne trouvez pas "Build output directory"

### Alternative 1 : Dans les paramètres généraux

1. **Allez dans Settings > General**
2. **Cherchez "Build output directory"** ou **"Output directory"**

### Alternative 2 : Vérifier wrangler.toml

Le fichier `wrangler.toml` que j'ai créé contient déjà :
```toml
pages_build_output_dir = ".next"
```

Si ce champ n'existe pas dans l'interface, Cloudflare Pages utilisera automatiquement la valeur du fichier `wrangler.toml` après le prochain déploiement.

## ✅ Après avoir mis .next

1. **Sauvegardez** les modifications
2. **Attendez le redéploiement automatique** (si vous avez modifié quelque chose)
3. **Ou redéployez manuellement** :
   - Allez dans **Deployments**
   - Cliquez sur les **3 points** à côté du dernier déploiement
   - Cliquez sur **Retry deployment**

## 📝 Note

Le répertoire `.next` est créé automatiquement par Next.js lors du build (`npm run build`). Cloudflare Pages doit savoir où chercher les fichiers générés, c'est pourquoi on lui indique `.next`.
