# 🔍 Guide : Trouver l'URL du Back-Office PrestaShop

## 🎯 Situation

Votre client n'arrive pas à vous envoyer le lien du back-office PrestaShop. Ce guide vous explique comment **trouver cette URL vous-même** ou **aider le client à la trouver**.

---

## 📋 Méthode 1 : Demander l'URL du Site Principal

### Ce dont vous avez besoin

Demandez simplement au client :
> "Quelle est l'URL de votre site web ? (ex: https://www.mon-site.com)"

### Construire l'URL du Back-Office

Une fois que vous avez l'URL du site, essayez ces combinaisons :

#### Essai 1 : URL Standard
```
https://www.nom-du-site.com/admin
```

#### Essai 2 : Avec HTTPS
```
https://nom-du-site.com/admin
```

#### Essai 3 : Avec un Code de Sécurité
PrestaShop ajoute parfois un code de sécurité à la fin :
```
https://www.nom-du-site.com/admin123456
https://www.nom-du-site.com/admin789
https://www.nom-du-site.com/admin-xyz
```

**Comment trouver le code ?** Le client peut le voir dans son historique de navigation ou dans ses favoris.

---

## 📋 Méthode 2 : Aider le Client à Trouver l'URL

### Instructions à Envoyer au Client

Envoyez ce message à votre client :

```
Bonjour,

Pour accéder au back-office PrestaShop, j'ai besoin de l'URL exacte.

Voici comment la trouver :

1. Ouvrez votre navigateur (Chrome, Firefox, etc.)

2. Regardez dans vos FAVORIS / MARQUE-PAGES
   - Cherchez "PrestaShop" ou "Admin" ou "Back-office"
   - L'URL devrait être quelque chose comme :
     https://votre-site.com/admin
     ou
     https://votre-site.com/admin123456

3. Si vous ne trouvez pas dans les favoris :
   - Ouvrez l'historique de votre navigateur (Ctrl+H)
   - Cherchez "admin" ou "prestashop"
   - Vous devriez voir l'URL que vous utilisez habituellement

4. Si vous êtes déjà connecté au back-office :
   - Regardez la barre d'adresse en haut du navigateur
   - Copiez cette URL et envoyez-la moi

5. Sinon, essayez simplement :
   https://[votre-site-web]/admin
   (Remplacez [votre-site-web] par l'URL de votre site)

Merci !
```

---

## 📋 Méthode 3 : Trouver l'URL Soi-Même

### Si vous avez l'URL du Site Principal

1. **Ouvrez votre navigateur**
2. **Tapez** : `https://www.nom-du-site.com/admin`
3. **Appuyez sur Entrée**

**Si ça ne fonctionne pas**, essayez :
- `https://nom-du-site.com/admin` (sans www)
- `https://www.nom-du-site.com/admin123456` (avec un code)

### Utiliser les Outils de Développement

1. **Allez sur le site principal** du client
2. **Faites un clic droit** n'importe où sur la page
3. **Cliquez sur "Inspecter"** ou "Examiner l'élément"
4. **Ouvrez l'onglet "Network"** (Réseau)
5. **Rechargez la page** (F5)
6. **Cherchez** des requêtes vers `/admin` ou contenant "admin"

---

## 📋 Méthode 4 : Demander les Informations à l'Hébergeur

### Si le Client a Accès à son Hébergement

Le client peut demander à son hébergeur :
> "Quelle est l'URL du back-office PrestaShop pour mon site ?"

Ou le client peut :
1. **Se connecter à son hébergeur** (cPanel, Plesk, etc.)
2. **Chercher** dans les fichiers
3. **Trouver** le dossier PrestaShop
4. **Voir** la structure des dossiers

---

## 📋 Méthode 5 : Utiliser un Scanner d'URL (Avancé)

### Outils en Ligne

Il existe des outils qui peuvent scanner un site et trouver les chemins admin :

1. **WPScan** (pour WordPress, mais peut aider)
2. **DirBuster** (outil de scan de répertoires)
3. **Google Dorking** : Chercher `site:nom-du-site.com admin`

**⚠️ Attention** : Ces méthodes peuvent être considérées comme intrusives. Demandez toujours la permission au client.

---

## 📋 Méthode 6 : Demander un Accès Alternatif

### Via FTP ou cPanel

Si le client a accès à son hébergement, il peut :

1. **Vous donner un accès FTP**
2. **Vous donner un accès cPanel**
3. Vous pourrez alors :
   - Voir la structure des fichiers
   - Trouver le dossier PrestaShop
   - Voir la configuration

### Via Email de Réinitialisation

1. **Demandez au client** d'utiliser "Mot de passe oublié" sur la page de connexion
2. **L'email de réinitialisation** contiendra souvent un lien vers le back-office
3. **Le client peut vous envoyer** ce lien (même s'il est expiré, l'URL sera correcte)

---

## 📋 Méthode 7 : Vérifier le Fichier .htaccess

### Si vous avez Accès FTP

1. **Connectez-vous via FTP**
2. **Cherchez** le fichier `.htaccess` à la racine
3. **Ouvrez-le** et cherchez des redirections vers `/admin`

---

## 🎯 Solution la Plus Simple

### Email Type à Envoyer au Client

```
Bonjour [Nom du client],

Pour accéder à votre PrestaShop, j'ai besoin de l'URL du back-office.

C'est très simple à trouver :

1. Si vous avez déjà accès au back-office :
   → Regardez la barre d'adresse en haut de votre navigateur
   → Copiez cette URL et envoyez-la moi

2. Si vous ne vous souvenez pas :
   → Essayez d'aller sur : https://[votre-site-web]/admin
   → (Remplacez [votre-site-web] par l'URL de votre site)
   → Si ça fonctionne, envoyez-moi cette URL

3. Si vous avez l'URL de votre site mais pas celle du back-office :
   → Envoyez-moi simplement l'URL de votre site
   → Je pourrai essayer de trouver le back-office

Merci beaucoup !
```

---

## 🔍 Exemples d'URLs de Back-Office

Voici des exemples pour vous donner une idée :

### Format Standard
```
https://www.boutique-peche.com/admin
https://boutique-peche.com/admin
```

### Avec Code de Sécurité
```
https://www.boutique-peche.com/admin123456
https://www.boutique-peche.com/admin-xyz789
https://www.boutique-peche.com/admin_secret
```

### Sous-Domaine
```
https://admin.boutique-peche.com
https://backoffice.boutique-peche.com
```

---

## ✅ Checklist pour le Client

Envoyez cette checklist au client pour l'aider :

- [ ] J'ai cherché dans mes favoris/marque-pages
- [ ] J'ai vérifié mon historique de navigation
- [ ] J'ai regardé la barre d'adresse quand je suis connecté
- [ ] J'ai essayé : https://mon-site.com/admin
- [ ] J'ai vérifié mes emails (lien de réinitialisation de mot de passe)
- [ ] J'ai demandé à mon hébergeur

---

## 🆘 Si Rien ne Fonctionne

### Solution de Dernier Recours

1. **Demandez au client** de :
   - Vous donner l'URL de son site principal
   - Vous donner un accès FTP ou cPanel
   - Vous créer un nouveau compte administrateur (si possible)

2. **Avec l'accès FTP/cPanel**, vous pourrez :
   - Voir tous les fichiers PrestaShop
   - Trouver la configuration
   - Déterminer l'URL du back-office

---

## 💡 Astuce Pro

### Créer un Lien de Connexion Direct

Si le client trouve l'URL mais ne peut pas la copier facilement :

1. **Demandez-lui** de faire une capture d'écran de la barre d'adresse
2. **Ou** demandez-lui de vous envoyer un lien de partage (s'il utilise un gestionnaire de mots de passe)

---

## 📞 Message Type pour le Client (Version Simple)

```
Bonjour,

Pour accéder à votre PrestaShop, j'ai besoin de l'URL du back-office.

C'est l'adresse que vous utilisez pour vous connecter et gérer vos produits.

Pouvez-vous :
1. Ouvrir votre navigateur
2. Regarder la barre d'adresse en haut quand vous êtes sur le back-office
3. Me copier cette URL

Ou simplement me donner l'URL de votre site web, je pourrai essayer de trouver le back-office.

Merci !
```

---

## 🎉 Une Fois que vous avez l'URL

Une fois que vous avez l'URL du back-office :

1. **Ouvrez-la** dans votre navigateur
2. **Connectez-vous** avec les identifiants que le client vous a donnés
3. **Suivez** le guide `GUIDE_CONNEXION_PRESTASHOP.md`

---

## 📝 Résumé

**Pour trouver l'URL du back-office PrestaShop :**

1. ✅ Demander l'URL du site principal
2. ✅ Essayer : `https://site.com/admin`
3. ✅ Demander au client de chercher dans ses favoris/historique
4. ✅ Demander un accès FTP/cPanel si nécessaire

**La méthode la plus simple** : Demander au client de regarder la barre d'adresse quand il est connecté au back-office et de vous copier l'URL.













