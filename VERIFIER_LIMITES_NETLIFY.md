# Vérifier les limites Netlify

## ✅ Bande passante : 113.8 MB / 100 GB
**Statut : OK** - Vous n'avez utilisé que 0.1% de votre limite de bande passante.

## ❓ À vérifier maintenant

### 1. Build Minutes (300 min/mois)

**Comment vérifier :**
1. Allez sur https://app.netlify.com
2. Cliquez sur votre profil (en haut à droite)
3. Allez dans **Billing** ou **Usage**
4. Regardez **Build minutes**

**Si c'est proche de 300 min :**
- Vous avez fait trop de déploiements
- Chaque build prend ~5-15 minutes
- 20-30 builds = limite atteinte

**Solution :**
- Attendre le mois suivant
- Réduire les déploiements
- Passer au plan Pro (500 min/mois)

### 2. Function Hours (1000 h/mois)

**Comment vérifier :**
1. Allez dans **Billing** ou **Usage**
2. Regardez **Function hours**

**Si c'est proche de 1000 h :**
- Vos API routes (`/api/*`) sont appelées très fréquemment
- Ou elles prennent trop de temps à s'exécuter
- Ou il y a une boucle infinie quelque part

**Solution :**
- Optimiser les API routes
- Ajouter du cache
- Passer au plan Pro (125 000 h/mois)

## 🔍 Comment voir l'historique des builds

1. Allez sur votre site dans Netlify
2. Cliquez sur **Deploys**
3. Comptez le nombre de déploiements ce mois
4. Multipliez par ~10 minutes = temps total utilisé

**Exemple :**
- 30 déploiements × 10 minutes = 300 minutes ✅ Limite atteinte !

## 💡 Causes probables dans votre cas

### Cause 1 : Trop de builds pendant nos corrections
Pendant que nous corrigions les bugs (login, admin, etc.), nous avons fait :
- ~15-20 commits
- Chaque commit = 1 build automatique
- Chaque build = 5-15 minutes
- Total = 75-300 minutes

**C'est probablement ça !**

### Cause 2 : Builds qui échouent et sont retentés
Si un build échoue :
- Netlify le retente automatiquement
- Chaque retry consomme des minutes
- Si vous avez eu des erreurs de build, ça multiplie la consommation

## 📊 Résumé des limites

| Ressource | Limite | Votre utilisation | Statut |
|-----------|--------|-------------------|--------|
| **Bandwidth** | 100 GB | 113.8 MB (0.1%) | ✅ OK |
| **Build minutes** | 300 min | ? | ❓ À vérifier |
| **Function hours** | 1000 h | ? | ❓ À vérifier |

## 🎯 Action immédiate

1. **Allez dans Billing/Usage sur Netlify**
2. **Vérifiez Build minutes et Function hours**
3. **Dites-moi ce que vous voyez** et je vous aiderai à résoudre

## 💰 Solutions

### Si c'est les Build minutes :
- **Attendre** le mois suivant (gratuit)
- **Réduire** les déploiements futurs
- **Upgrade** vers Pro ($19/mois) = 500 min

### Si c'est les Function hours :
- **Optimiser** les API routes
- **Ajouter du cache**
- **Upgrade** vers Pro = 125 000 h
