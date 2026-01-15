# Guide : Pourquoi mes crédits Netlify sont-ils épuisés ?

## 🔍 Causes courantes de consommation excessive

### 1. **Bande passante (Bandwidth) - 100 GB/mois**

**Ce qui consomme :**
- Visiteurs qui consultent votre site
- Téléchargements de fichiers (images, PDF, etc.)
- API calls depuis le frontend
- Assets statiques (CSS, JS, images)

**Comment vérifier :**
1. Allez sur https://app.netlify.com
2. Sélectionnez votre site
3. Allez dans **Analytics** > **Bandwidth**
4. Regardez le graphique d'utilisation

**Causes possibles :**
- ✅ Beaucoup de visiteurs
- ✅ Images non optimisées (trop lourdes)
- ✅ Fichiers volumineux téléchargés
- ✅ API routes appelées fréquemment
- ✅ Assets non mis en cache

### 2. **Minutes de build - 300 min/mois**

**Ce qui consomme :**
- Chaque déploiement déclenche un build
- Les builds Next.js peuvent prendre 5-15 minutes
- Les builds échoués et retentés consomment aussi

**Comment vérifier :**
1. Allez dans **Deploys**
2. Regardez l'historique des déploiements
3. Vérifiez le temps de chaque build

**Causes possibles :**
- ✅ Trop de déploiements (chaque push = 1 build)
- ✅ Builds qui échouent et sont retentés
- ✅ Builds très longs (dépendances lourdes)
- ✅ Builds automatiques déclenchés inutilement

### 3. **Fonctions serverless - 1000 heures/mois**

**Ce qui consomme :**
- Routes API Next.js (`/api/*`)
- Fonctions serverless Netlify
- Temps d'exécution des fonctions

**Comment vérifier :**
1. Allez dans **Functions**
2. Regardez les logs et l'utilisation

**Causes possibles :**
- ✅ API routes appelées très fréquemment
- ✅ Fonctions qui prennent du temps à s'exécuter
- ✅ Boucles infinies dans les fonctions
- ✅ Appels API externes lents (Supabase, PayPal, etc.)

## 🚨 Problèmes spécifiques à votre site

### Problème 1 : Boucles de rechargement
Si votre page login se recharge en boucle, cela peut :
- Consommer énormément de bande passante
- Faire des appels API répétés
- Créer des builds automatiques

**Solution :** Les corrections que nous avons faites devraient résoudre ce problème.

### Problème 2 : Images non optimisées
Si vos images sont lourdes :
- Chaque visite consomme beaucoup de bande passante
- Les images se rechargent à chaque fois

**Solution :** Optimiser les images avec Next.js Image component.

### Problème 3 : Trop de déploiements
Si vous avez fait beaucoup de tests :
- Chaque commit = 1 build
- Chaque build = 5-15 minutes
- 20 builds = 100-300 minutes (déjà la limite !)

**Solution :** Réduire les déploiements ou désactiver les builds automatiques pour certaines branches.

## 📊 Comment vérifier votre utilisation

### Étape 1 : Voir l'utilisation actuelle

1. Allez sur https://app.netlify.com
2. Cliquez sur votre profil (en haut à droite)
3. Allez dans **Billing** ou **Usage**
4. Vous verrez :
   - Bandwidth utilisé / 100 GB
   - Build minutes utilisées / 300 min
   - Function hours utilisées / 1000 h

### Étape 2 : Voir les détails par site

1. Sélectionnez votre site
2. Allez dans **Analytics** (si disponible)
3. Regardez :
   - Nombre de visites
   - Bande passante utilisée
   - Temps de build

### Étape 3 : Voir l'historique des déploiements

1. Allez dans **Deploys**
2. Comptez le nombre de déploiements ce mois
3. Multipliez par ~10 minutes = temps total

## 💡 Solutions pour réduire l'utilisation

### Solution 1 : Optimiser les images

```tsx
// Utiliser Next.js Image au lieu de <img>
import Image from 'next/image'

<Image 
  src="/image.jpg" 
  width={500} 
  height={300}
  alt="Description"
/>
```

### Solution 2 : Activer le cache

Dans `netlify.toml`, ajoutez :
```toml
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Solution 3 : Réduire les builds

- Ne déployez que les commits importants
- Utilisez `[skip ci]` dans les messages de commit pour éviter les builds
- Désactivez les builds automatiques pour certaines branches

### Solution 4 : Optimiser les API routes

- Ajoutez du cache côté serveur
- Réduisez les appels API inutiles
- Optimisez les requêtes Supabase

## ⚠️ Limites du plan gratuit Netlify

| Ressource | Limite | Ce que ça représente |
|-----------|--------|----------------------|
| **Bandwidth** | 100 GB/mois | ~10 000 visites avec 10 MB de données |
| **Build minutes** | 300 min/mois | ~30 builds de 10 minutes |
| **Function hours** | 1000 h/mois | Fonctions qui tournent 24/7 |

## 🎯 Recommandations

### Si vous avez beaucoup de trafic :
→ Passez au plan **Pro** ($19/mois) qui donne :
- 400 GB de bande passante
- 500 minutes de build
- 125 000 heures de fonctions

### Si c'est un site de test :
→ Attendez le mois suivant (les limites se réinitialisent)

### Si vous voulez rester gratuit :
→ Migrez vers **Vercel** (plan gratuit plus généreux) :
- 100 GB de bande passante
- 6000 minutes de build
- Fonctions illimitées

## 📝 Action immédiate

1. **Vérifiez votre utilisation** sur Netlify
2. **Identifiez** ce qui consomme le plus (bandwidth, builds, ou fonctions)
3. **Décidez** :
   - Mettre à niveau le plan
   - Attendre le mois suivant
   - Optimiser le site
   - Migrer vers Vercel
