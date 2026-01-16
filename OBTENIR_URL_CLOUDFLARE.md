# 🔗 Obtenir l'URL Cloudflare Pages

## 📋 Étapes pour obtenir votre URL

### Étape 1 : Vérifier le statut du déploiement

1. **Allez sur https://dash.cloudflare.com**
2. **Cliquez sur "Workers & Pages"** (menu de gauche)
3. **Cliquez sur "Pages"**
4. **Cliquez sur votre projet**
5. **Allez dans l'onglet "Deployments"**
6. **Regardez le dernier déploiement** :
   - ✅ **Vert** = Réussi → L'URL devrait être visible
   - ❌ **Rouge** = Échoué → Il faut corriger l'erreur
   - 🟡 **Jaune/Orange** = En cours → Attendez

### Étape 2 : Si le déploiement a échoué

**Le problème est probablement la commande de déploiement.**

1. **Allez dans Settings > Build configuration**
2. **Vérifiez "Deploy command"** :
   - ❌ Si c'est `npx wrangler deploy` → **Remplacez par** : `echo "Deploy complete"`
   - ✅ Si c'est `echo "Deploy complete"` → C'est bon
3. **Vérifiez "Non-production branch deploy command"** :
   - ❌ Si c'est `npx wrangler deploy` → **Remplacez par** : `echo "Deploy complete"`
   - ✅ Si c'est `echo "Deploy complete"` → C'est bon
4. **Sauvegardez**
5. **Redéployez** :
   - Allez dans **Deployments**
   - Cliquez sur les **3 points** à côté du dernier déploiement
   - Cliquez sur **Retry deployment**

### Étape 3 : Trouver l'URL une fois le déploiement réussi

Une fois le déploiement **réussi** (vert), l'URL sera visible :

1. **Dans l'onglet "Deployments"** :
   - Cliquez sur le déploiement réussi
   - L'URL s'affiche en haut : `https://[nom-du-projet].pages.dev`
   - Ou un bouton **"Visit site"** / **"Visiter le site"**

2. **En haut de la page du projet** :
   - L'URL s'affiche directement : `https://[nom-du-projet].pages.dev`

3. **Dans Settings > General** :
   - L'URL est affichée dans la section "Production deployment"

## 🔍 Trouver le nom du projet

Si vous ne savez pas le nom de votre projet :

1. **Allez dans "Workers & Pages" > "Pages"**
2. **Regardez la liste des projets**
3. **Le nom du projet** = première partie de l'URL
   - Ex: Si le projet s'appelle `devorbaits` → URL = `https://devorbaits.pages.dev`
   - Ex: Si le projet s'appelle `boutique-peche` → URL = `https://boutique-peche.pages.dev`

## ⚠️ Si le déploiement continue d'échouer

Vérifiez les logs pour voir l'erreur exacte :
1. Cliquez sur le déploiement qui a échoué
2. Cliquez sur **"View build log"** ou **"View logs"**
3. Regardez la fin des logs pour voir l'erreur
4. Partagez-moi l'erreur et je vous aiderai à la corriger

## ✅ Checklist

- [ ] Le déploiement est réussi (vert)
- [ ] La commande de déploiement est `echo "Deploy complete"` (pas `npx wrangler deploy`)
- [ ] L'URL est visible dans Deployments ou en haut de la page
- [ ] Vous pouvez accéder à l'URL dans votre navigateur
