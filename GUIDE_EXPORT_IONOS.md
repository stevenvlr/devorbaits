# 🚀 Guide d'Export et d'Upload sur IONOS

## 📋 Prérequis

- Node.js installé sur votre ordinateur
- Un compte IONOS avec accès FTP ou File Manager
- Les identifiants FTP de votre hébergement IONOS

## 🔧 Étape 1 : Préparer l'export

### 1.1 Installer les dépendances (si pas déjà fait)

Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
npm install
```

### 1.2 Exporter le site en statique

Exécutez la commande suivante :

```bash
npm run export
```

Cette commande va créer un dossier `out` contenant tous les fichiers HTML, CSS et JavaScript de votre site.

## 📦 Étape 2 : Vérifier l'export

Après l'export, vous devriez avoir un dossier `out` avec :
- Des fichiers HTML pour chaque page
- Un dossier `_next` avec les fichiers CSS et JavaScript
- Un dossier `images` avec vos images
- Un fichier `index.html` à la racine

## 🌐 Étape 3 : Uploader sur IONOS

### Option A : Via File Manager (Recommandé pour débutants)

1. **Connectez-vous à votre compte IONOS**
   - Allez sur https://www.ionos.fr
   - Connectez-vous avec vos identifiants

2. **Accédez au File Manager**
   - Dans votre tableau de bord, trouvez votre domaine
   - Cliquez sur "Gestionnaire de fichiers" ou "File Manager"

3. **Naviguez vers le dossier public**
   - Allez dans le dossier `httpdocs` ou `public_html` (c'est le dossier racine de votre site)

4. **Supprimez les fichiers existants (si nécessaire)**
   - Si vous avez déjà un site, supprimez les anciens fichiers PrestaShop
   - ⚠️ **ATTENTION** : Sauvegardez d'abord si vous avez des données importantes !

5. **Uploadez tous les fichiers du dossier `out`**
   - Sélectionnez tous les fichiers et dossiers du dossier `out`
   - Glissez-déposez ou utilisez le bouton "Upload"
   - ⚠️ **IMPORTANT** : Uploadez TOUT le contenu du dossier `out`, pas le dossier `out` lui-même

6. **Vérifiez la structure**
   - À la racine de `httpdocs`, vous devriez avoir `index.html`
   - Vous devriez aussi avoir les dossiers `_next` et `images`

### Option B : Via FTP (Pour utilisateurs avancés)

1. **Installez un client FTP** (FileZilla, WinSCP, etc.)

2. **Connectez-vous avec vos identifiants IONOS**
   - Hôte : `ftp.votre-domaine.com` ou l'adresse FTP fournie par IONOS
   - Utilisateur : Votre identifiant FTP
   - Mot de passe : Votre mot de passe FTP
   - Port : 21 (ou 22 pour SFTP)

3. **Naviguez vers le dossier public**
   - Allez dans `/httpdocs` ou `/public_html`

4. **Uploadez les fichiers**
   - Glissez tous les fichiers du dossier `out` vers `/httpdocs`
   - Assurez-vous que `index.html` est à la racine

## ✅ Étape 4 : Vérifier le site

1. Attendez quelques minutes que les fichiers soient traités
2. Visitez votre site : `https://votre-domaine.com`
3. Testez la navigation entre les pages
4. Vérifiez que les images s'affichent correctement

## 🔍 Résolution de problèmes

### Les pages ne s'affichent pas correctement

- Vérifiez que tous les fichiers du dossier `_next` ont été uploadés
- Vérifiez que les chemins des images sont corrects
- Videz le cache de votre navigateur (Ctrl+F5)

### Erreur 404 sur certaines pages

- Vérifiez que le fichier `.htaccess` est présent (voir ci-dessous)
- Assurez-vous que tous les fichiers HTML ont été uploadés

### Les styles ne s'appliquent pas

- Vérifiez que le dossier `_next/static` a été uploadé
- Vérifiez la console du navigateur (F12) pour les erreurs

## 📝 Fichier .htaccess (Optionnel mais recommandé)

Si IONOS le supporte, créez un fichier `.htaccess` à la racine avec ce contenu :

```apache
# Redirection des pages vers index.html pour le routing Next.js
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 🎯 Points importants

✅ **Le site fonctionne sans PrestaShop** - Tout est statique et fonctionne dans le navigateur
✅ **Les données sont stockées dans le navigateur** - Utilise localStorage
✅ **Pas besoin de base de données** - Tout fonctionne côté client
✅ **Le site est rapide** - Fichiers statiques = chargement ultra rapide

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que tous les fichiers sont bien uploadés
2. Vérifiez les permissions des fichiers (doivent être en lecture pour tous)
3. Contactez le support IONOS si nécessaire

---

**Bon courage avec votre nouveau site ! 🎉**

