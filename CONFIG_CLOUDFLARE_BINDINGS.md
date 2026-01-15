# 🔧 Configuration "Add binding" Cloudflare Pages

## ⚠️ Message "Add binding"

Si Cloudflare Pages vous demande d'ajouter des "bindings", c'est généralement pour configurer les fonctions serverless (routes API).

## ✅ Solution : Configurer les Compatibility Flags

Pour Next.js avec routes API sur Cloudflare Pages, vous devez activer le support Node.js :

### Étapes :

1. **Allez dans votre projet Cloudflare Pages**
2. **Allez dans Settings** (Paramètres)
3. **Allez dans "Functions"** ou **"Compatibility flags"**
4. **Cherchez "Compatibility flags"** ou **"Node.js compatibility"**
5. **Activez** :
   - `nodejs_compat` (pour Production)
   - `nodejs_compat` (pour Preview)

### Alternative : Si vous ne voyez pas cette option

1. **Allez dans Settings > Functions**
2. **Cherchez "Compatibility date"**
3. **Mettez une date récente** (ex: `2024-01-15` ou `2025-01-15`)
4. **Sauvegardez**

## 📝 Configuration via wrangler.toml (si nécessaire)

Si Cloudflare Pages continue de demander des bindings, créez un fichier `wrangler.toml` à la racine de votre projet :

```toml
name = "devorbaits"
compatibility_date = "2025-01-15"
compatibility_flags = ["nodejs_compat"]
```

**⚠️ Note :** Ce fichier n'est généralement pas nécessaire pour Cloudflare Pages standard, mais peut aider si vous avez des problèmes.

## 🔄 Après configuration

1. **Sauvegardez** les modifications
2. **Redéployez** :
   - Allez dans **Deployments**
   - Cliquez sur les **3 points** à côté du dernier déploiement
   - Cliquez sur **Retry deployment**

## ✅ Vérification

Une fois configuré, votre site devrait fonctionner avec les routes API (`/api/*`).
