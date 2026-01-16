# 🧭 Navigation dans Cloudflare Pages

## 📍 Où aller

### Étape 1 : Accéder à Pages

1. **Allez sur https://dash.cloudflare.com**
2. **Dans le menu de gauche**, vous voyez "Workers & Pages"
3. **Cliquez sur "Workers & Pages"**
4. **Vous verrez deux onglets ou sections** :
   - **Workers** (pour les Workers)
   - **Pages** (pour les Pages) ← **CLIQUEZ ICI**
5. **Ou directement** : Cliquez sur "Workers & Pages", puis cherchez "Pages" dans la page qui s'affiche

### Étape 2 : Trouver votre projet

1. **Une fois dans "Pages"**, vous verrez la liste de vos projets
2. **Cherchez votre projet** : "dévorbait" ou "devorbaits"
3. **Cliquez sur le nom du projet**

### Étape 3 : Aller dans les paramètres

1. **Une fois dans votre projet**, vous verrez plusieurs onglets en haut :
   - **Deployments** (Déploiements)
   - **Settings** (Paramètres) ← **CLIQUEZ ICI**
   - **Analytics** (Analytiques)
   - **Custom domains** (Domaines personnalisés)

2. **Cliquez sur "Settings"**

### Étape 4 : Trouver Build configuration

1. **Dans Settings**, vous verrez plusieurs sections dans le menu de gauche :
   - **General** (Général)
   - **Builds & deployments** ← **CLIQUEZ ICI**
   - **Environment variables** (Variables d'environnement)
   - **Functions** (Fonctions)
   - **Custom domains** (Domaines personnalisés)

2. **Cliquez sur "Builds & deployments"**

3. **Cherchez "Build output directory"** ou **"Output directory"**

## 🔍 Si vous ne trouvez toujours pas

### Alternative : Vérifier dans General

1. **Allez dans Settings > General**
2. **Cherchez "Build output directory"** ou **"Output directory"**
3. **Ou cherchez "Build settings"**

## 📝 Note importante

Le fichier `wrangler.toml` que j'ai créé contient déjà :
```toml
pages_build_output_dir = ".next"
```

**Cloudflare Pages devrait utiliser automatiquement cette valeur** après le prochain déploiement, même si vous ne trouvez pas le champ dans l'interface.

## ✅ Action immédiate

1. **Allez dans Workers & Pages > Pages**
2. **Cliquez sur votre projet "dévorbait"**
3. **Allez dans Settings > Builds & deployments**
4. **Cherchez "Build output directory"**

Si vous ne trouvez toujours pas le champ, dites-moi ce que vous voyez dans "Builds & deployments" et je vous guiderai plus précisément.
