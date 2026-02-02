# Déploiement Next.js sur Cloudflare Pages (next-on-pages)

Ce projet utilise **@cloudflare/next-on-pages** pour que les routes API (`/api/*`) fonctionnent sur Cloudflare Pages (Functions).

## Commandes à lancer

- **Installer les dépendances** (inclut `@cloudflare/next-on-pages` en devDependency) :
  ```bash
  npm install
  ```

- **Build pour Cloudflare Pages** (génère `.vercel/output/static` + fonctions) :
  ```bash
  npm run build:pages
  ```
  **Sur Windows** : `build:pages` peut échouer (next-on-pages utilise `bash`). Dans ce cas, utilise l’**intégration Git** Cloudflare : pousse le code, Cloudflare build et déploie sur leurs serveurs Linux.

- **Déploiement direct** (après un build réussi, et après `npx wrangler login`) :
  ```bash
  npm run deploy:cloudflare
  ```
  Projet cible : `devorbaits` (modifiable dans `package.json` si besoin).

- **Build Next.js seul** (inchangé) :
  ```bash
  npm run build
  ```

## Cloudflare Pages – Paramètres du projet

Dans **Cloudflare Dashboard** → **Pages** → ton projet → **Settings** → **Builds & deployments** :

| Paramètre | Valeur |
|-----------|--------|
| **Build command** | `npm run build:pages` |
| **Build output directory** | `.vercel/output/static` |
| **Root directory** | (vide ou `/` selon la racine du repo) |

**Node.js** : le projet exige Node 18+ (`engines.node` dans `package.json`). Sur Cloudflare Pages, configure **Environment variables** → **NODE_VERSION** = `18` (ou `20`) si besoin.

## Variables d’environnement

À configurer dans **Cloudflare Dashboard** → **Pages** → ton projet → **Settings** → **Environment variables** (pour l’environnement **Production**, et **Preview** si tu veux les mêmes en preview).

Variables nécessaires pour les API (ex. Supabase, route shipping) :

| Variable | Description | Exemple |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase (côté serveur uniquement) | `eyJ...` |
| `INTERNAL_API_SECRET` | Secret pour les routes internes (ex. `POST /api/shipping/drafts/:orderId`) | une chaîne secrète |

- Les variables **NEXT_PUBLIC_*** sont exposées au client ; les autres restent côté serveur (Functions).
- Pour les **secrets** (`SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_API_SECRET`), utilise l’option **Encrypt** dans le dashboard.

## Tester l’endpoint POST /api/shipping/drafts/:orderId

La route est protégée par le header **X-Internal-Secret** (valeur = `INTERNAL_API_SECRET`).

**Exemple avec curl** (remplace `ORDER_ID` et `TON_SECRET` par tes valeurs) :

```bash
curl -X POST "https://ton-site.pages.dev/api/shipping/drafts/ORDER_ID" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: TON_SECRET"
```

Réponse attendue en succès :

```json
{ "ok": true, "draft": { "order_id": "...", "status": "draft", "recipient": {...}, "parcels": [...], ... } }
```

En cas d’erreur : `401` (secret invalide), `404` (commande introuvable), `400` (validation), `500` (erreur serveur).

## Fichiers modifiés pour ce déploiement

- **next.config.js** : pas d’`output: 'export'` → build standard compatible API routes et next-on-pages.
- **package.json** : script `build:pages` (`next build && npx @cloudflare/next-on-pages`) et `engines.node >= 18`.
- **DEPLOY_CLOUDFLARE_PAGES.md** : ce guide.
