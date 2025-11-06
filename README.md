# Boutique Pêche à la Carpe - Fabrication Française

Une boutique e-commerce moderne et élégante spécialisée dans les appâts pour la pêche à la carpe, avec mise en avant de la fabrication française.

## 🎨 Caractéristiques

- **Design moderne** : Interface sombre élégante avec tons noirs
- **Fabrication française** : Mise en avant de l'origine française des produits
- **Catégories complètes** :
  - Bouillettes (10mm, 16mm, 20mm)
  - Pop-ups
  - Équilibrés (10mm, 8mm, 16mm, Wafers 12x15mm)
  - Huiles
  - Farines
  - Bar à Pop-up (personnalisation)

## 🚀 Installation

1. Installer les dépendances :
```bash
npm install
```

2. Lancer le serveur de développement :
```bash
npm run dev
```

3. Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📦 Structure du Projet

```
├── app/
│   ├── categories/
│   │   ├── bouillettes/     # Page bouillettes avec sélection diamètre/arôme
│   │   ├── popups/          # Page pop-ups
│   │   ├── equilibres/      # Page équilibrés
│   │   ├── huiles/          # Page huiles
│   │   └── farines/         # Page farines
│   ├── bar-popup/           # Bar à pop-up personnalisé
│   ├── cart/                 # Page panier
│   ├── layout.tsx           # Layout principal
│   └── page.tsx              # Page d'accueil
├── components/
│   ├── Header.tsx           # Header avec navigation
│   └── Footer.tsx           # Footer
└── lib/
    └── constants.ts        # Constantes (arômes, diamètres, etc.)
```

## 🎯 Fonctionnalités

### Bouillettes
- Sélection du diamètre (10mm, 16mm, 20mm) - **Le prix ne change pas selon le diamètre**
- Choix de l'arôme (Krill, Calamar, Mure, Cassis, Robin Red, Verde, Vase, Red Devil)
- Conditionnement (1kg, 2kg, 5kg)

### Bar à Pop-up
- Personnalisation complète :
  - Taille du pop-up
  - Couleur (9 couleurs disponibles)
  - Arôme
  - Diamètre des billes (8mm, 10mm, 12mm, 14mm, 16mm) - **Le prix ne change pas selon le diamètre**

### Équilibrés
- Tailles disponibles : 10mm, 8mm, 16mm, Wafers 12x15mm
- Choix de l'arôme
- Conditionnement

## 🛠️ Technologies

- **Next.js 14** : Framework React avec App Router
- **TypeScript** : Typage statique
- **Tailwind CSS** : Styles utilitaires
- **Lucide React** : Icônes

## 📝 Notes

- Le système de panier est prêt à être connecté à un contexte React ou un state management
- Les prix sont définis dans chaque page de catégorie
- Le design est entièrement responsive

## 🎨 Arômes disponibles

- Krill
- Calamar
- Mure
- Cassis
- Robin Red
- Verde
- Vase
- Red Devil

---

**Fait avec passion en France 🇫🇷**
