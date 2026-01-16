# 📋 Types de variables Cloudflare Pages

## 🔍 Types disponibles

Dans Cloudflare Pages, vous avez 3 types de variables :
- **Text** : Variable normale, visible dans l'interface
- **Secret** : Variable masquée (pour les clés secrètes)
- **JSON** : Pour les valeurs JSON complexes

## ✅ Configuration recommandée

### Type "Text" (pour les variables publiques)

Utilisez **Text** pour toutes les variables qui commencent par `NEXT_PUBLIC_` :

- ✅ `NEXT_PUBLIC_SUPABASE_URL` → **Text**
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` → **Text**
- ✅ `NEXT_PUBLIC_PAYPAL_CLIENT_ID` → **Text**
- ✅ `NEXT_PUBLIC_PAYPAL_BASE_URL` → **Text**
- ✅ `NEXT_PUBLIC_SITE_URL` → **Text**
- ✅ `NEXT_PUBLIC_MONETICO_TPE` → **Text**
- ✅ `NEXT_PUBLIC_MONETICO_KEY` → **Text**
- ✅ `NEXT_PUBLIC_MONETICO_URL` → **Text**
- ✅ `NEXT_PUBLIC_MONETICO_MODE` → **Text**

**Pourquoi Text ?** Les variables `NEXT_PUBLIC_*` sont accessibles côté client (dans le navigateur) de toute façon, donc pas besoin de les masquer.

---

### Type "Secret" (pour les clés secrètes)

Utilisez **Secret** pour les variables sensibles qui ne commencent PAS par `NEXT_PUBLIC_` :

- 🔒 `PAYPAL_SECRET` → **Secret**
- 🔒 `MONETICO_CLE_SECRETE` → **Secret**

**Pourquoi Secret ?** Ces variables sont uniquement utilisées côté serveur et ne doivent pas être visibles publiquement.

---

### Type "JSON" (non utilisé ici)

Vous n'avez pas besoin de **JSON** pour votre projet. C'est uniquement pour des structures JSON complexes.

---

## 📝 Résumé rapide

| Variable | Type |
|----------|------|
| `NEXT_PUBLIC_*` (toutes) | **Text** |
| `PAYPAL_SECRET` | **Secret** |
| `MONETICO_CLE_SECRETE` | **Secret** |

## 🎯 Règle simple

- **Si ça commence par `NEXT_PUBLIC_`** → **Text**
- **Si c'est une clé secrète (PAYPAL_SECRET, MONETICO_CLE_SECRETE)** → **Secret**
- **Le reste** → **Text**

## ⚠️ Note importante

Même si vous mettez une variable en **Secret**, elle sera toujours accessible dans votre code. La différence est juste que :
- **Text** : Visible dans l'interface Cloudflare
- **Secret** : Masquée dans l'interface Cloudflare (mais toujours accessible dans le code)

Pour les variables `NEXT_PUBLIC_*`, utilisez **Text** car elles sont publiques de toute façon.
