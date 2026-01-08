# 🚀 Guide d'Installation Complet - Thème PrestaShop Devorbaits

## 📋 Vue d'ensemble

Ce guide vous explique comment installer et configurer le thème personnalisé Devorbaits sur votre site PrestaShop hébergé sur IONOS.

**Fichiers créés :**
- ✅ `prestashop-theme-complet.css` - CSS complet et optimisé
- ✅ `header-optimise.tpl` - Template header vérifié
- ✅ `footer-optimise.tpl` - Template footer vérifié
- ✅ `theme.yml` - Configuration du thème
- ✅ `custom.js` - JavaScript optimisé

---

## 📁 Structure des fichiers à créer sur IONOS

```
/PrestaShop/themes/mon_theme_enfant/
├── assets/
│   ├── css/
│   │   └── prestashop-theme-complet.css
│   └── js/
│       └── custom.js
├── templates/
│   └── layouts/
│       ├── header.tpl
│       └── footer.tpl
└── config/
    └── theme.yml
```

---

## 🔧 Étape 1 : Accéder à votre serveur IONOS

1. **Connectez-vous à IONOS** : https://www.ionos.fr/
2. **Ouvrez WebTransfer** (gestionnaire de fichiers)
3. **Naviguez jusqu'à** : `/PrestaShop/themes/`

---

## 📂 Étape 2 : Créer la structure du thème enfant

### 2.1 Créer les dossiers

Dans WebTransfer, créez cette structure :

1. Créez le dossier `mon_theme_enfant` dans `/PrestaShop/themes/`
2. Dans `mon_theme_enfant`, créez :
   - `assets/`
   - `assets/css/`
   - `assets/js/`
   - `templates/`
   - `templates/layouts/`
   - `config/`

### 2.2 Vérifier les permissions

Assurez-vous que les dossiers ont les permissions **755** et les fichiers **644**.

---

## 📝 Étape 3 : Télécharger les fichiers

### 3.1 Fichier CSS

1. **Téléchargez** le fichier `prestashop-theme-complet.css`
2. **Placez-le** dans : `/PrestaShop/themes/mon_theme_enfant/assets/css/`
3. **Renommez-le** en : `prestashop-theme-complet.css` (si nécessaire)

### 3.2 Fichier JavaScript

1. **Téléchargez** le fichier `custom.js`
2. **Placez-le** dans : `/PrestaShop/themes/mon_theme_enfant/assets/js/`

### 3.3 Templates

1. **Téléchargez** `header-optimise.tpl`
2. **Placez-le** dans : `/PrestaShop/themes/mon_theme_enfant/templates/layouts/`
3. **Renommez-le** en : `header.tpl`

4. **Téléchargez** `footer-optimise.tpl`
5. **Placez-le** dans : `/PrestaShop/themes/mon_theme_enfant/templates/layouts/`
6. **Renommez-le** en : `footer.tpl`

### 3.4 Configuration

1. **Téléchargez** `theme.yml`
2. **Placez-le** dans : `/PrestaShop/themes/mon_theme_enfant/config/`

---

## ⚙️ Étape 4 : Configurer PrestaShop

### 4.1 Activer le thème

1. **Connectez-vous au back-office PrestaShop** : `https://votre-domaine.com/prestashop/admin/`
2. **Allez dans** : `Apparence` > `Thème`
3. **Sélectionnez** "Mon Thème Enfant Devorbaits"
4. **Cliquez sur** "Utiliser ce thème"
5. **Confirmez** l'activation

### 4.2 Vider le cache

1. **Allez dans** : `Performance` > `Vider le cache`
2. **Cliquez sur** "Vider le cache"
3. **Videz aussi** le cache du navigateur (Ctrl+F5)

---

## 🎨 Étape 5 : Vérifier l'installation

### 5.1 Vérifications visuelles

1. **Ouvrez votre site** : `https://votre-domaine.com/prestashop/`
2. **Vérifiez** :
   - ✅ Le header s'affiche correctement
   - ✅ Le footer s'affiche correctement
   - ✅ Les couleurs sont sombres avec accents jaunes
   - ✅ Le menu mobile fonctionne
   - ✅ Les produits ont le bon style

### 5.2 Vérifications techniques

1. **Ouvrez les outils développeur** (F12)
2. **Onglet Network** :
   - Vérifiez que `prestashop-theme-complet.css` se charge
   - Vérifiez que `custom.js` se charge
3. **Onglet Console** :
   - Vérifiez qu'il n'y a pas d'erreurs JavaScript

---

## 🔍 Étape 6 : Personnalisation (optionnel)

### 6.1 Modifier les couleurs

Éditez le fichier `prestashop-theme-complet.css` et modifiez les variables CSS :

```css
:root {
  --color-yellow-500: #eab308; /* Couleur principale */
  --color-noir-950: #0a0a0a;    /* Fond principal */
}
```

### 6.2 Modifier le logo

Remplacez le SVG dans `header.tpl` par votre logo :

```smarty
<img src="{$urls.img_ps_url}logo.png" alt="Devorbaits" class="header-logo-icon">
```

### 6.3 Modifier les informations de contact

Éditez `footer.tpl` et modifiez :
- L'adresse email
- Le numéro de téléphone
- L'adresse

---

## ⚠️ Dépannage

### Le CSS ne s'applique pas

**Solutions :**
1. Vérifiez que le fichier est bien dans `/themes/mon_theme_enfant/assets/css/`
2. Vérifiez le chemin dans `theme.yml`
3. Videz le cache PrestaShop
4. Vérifiez les permissions du fichier (644)

### Le header ne s'affiche pas

**Solutions :**
1. Vérifiez que `header.tpl` est dans `/themes/mon_theme_enfant/templates/layouts/`
2. Vérifiez la syntaxe Smarty (pas d'erreurs de syntaxe)
3. Consultez les logs PrestaShop : `/var/logs/`

### Le menu mobile ne fonctionne pas

**Solutions :**
1. Vérifiez que `custom.js` est bien chargé
2. Vérifiez la console JavaScript (F12)
3. Vérifiez que le script dans `header.tpl` est présent

### Les images ne s'affichent pas

**Solutions :**
1. Vérifiez les chemins dans les templates
2. Utilisez `{$urls.img_ps_url}` pour les images PrestaShop
3. Vérifiez les permissions des dossiers d'images

---

## 📊 Checklist finale

- [ ] Structure de dossiers créée
- [ ] Fichier CSS téléchargé et placé
- [ ] Fichier JavaScript téléchargé et placé
- [ ] Templates header.tpl et footer.tpl téléchargés
- [ ] Fichier theme.yml téléchargé
- [ ] Thème activé dans PrestaShop
- [ ] Cache vidé
- [ ] Site testé sur desktop
- [ ] Site testé sur mobile
- [ ] Menu mobile fonctionnel
- [ ] Aucune erreur dans la console

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs PrestaShop** : `/var/logs/`
2. **Vérifiez la console du navigateur** (F12)
3. **Videz tous les caches** (PrestaShop + navigateur)
4. **Vérifiez les permissions** des fichiers et dossiers

---

## 📝 Notes importantes

- **Faites toujours une sauvegarde** avant de modifier les fichiers
- **Testez sur un site de développement** si possible
- **Videz le cache** après chaque modification
- **Les variables Smarty** (`{$...}`) sont spécifiques à PrestaShop

---

## ✅ Félicitations !

Votre thème Devorbaits est maintenant installé et configuré sur PrestaShop !

**Bon courage ! 🚀**







