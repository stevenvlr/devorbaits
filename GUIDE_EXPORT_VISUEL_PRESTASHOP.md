# 🎨 Guide : Exporter le Visuel et Header vers PrestaShop

## 📋 Fichiers Créés

1. ✅ `prestashop-theme-devorbait.css` - Tous les styles adaptés pour PrestaShop
2. ✅ Ce guide avec les instructions

---

## 🚀 Étape 1 : Télécharger le fichier CSS sur IONOS

1. **Connectez-vous à IONOS** et ouvrez **WebTransfer**
2. **Naviguez jusqu'à** : `/PrestaShop/themes/votre-theme/assets/css/`
   - Si le dossier `assets/css/` n'existe pas, créez-le
3. **Téléchargez** le fichier `prestashop-theme-devorbait.css` dans ce dossier

---

## 🎯 Étape 2 : Intégrer le CSS dans PrestaShop

### Option A : Via le back-office PrestaShop

1. **Connectez-vous au back-office** : `https://devorbaits.com/prestashop/admin/`
2. **Allez dans** "Apparence" > "Thème" ou "Design"
3. **Cherchez** une option "CSS personnalisé" ou "Fichiers CSS"
4. **Ajoutez** le lien vers votre fichier CSS :
   ```html
   <link rel="stylesheet" href="/themes/votre-theme/assets/css/prestashop-theme-devorbait.css">
   ```

### Option B : Modifier le template header.tpl

1. **Dans WebTransfer**, allez dans :
   - `/PrestaShop/themes/votre-theme/templates/layouts/`
2. **Ouvrez** le fichier `header.tpl`
3. **Ajoutez** cette ligne dans la section `<head>` :
   ```html
   <link rel="stylesheet" href="{$urls.theme_assets}css/prestashop-theme-devorbait.css">
   ```

---

## 🎨 Étape 3 : Adapter le Header HTML

### Créer le fichier header-personnalise.tpl

1. **Dans WebTransfer**, allez dans :
   - `/PrestaShop/themes/votre-theme/templates/layouts/`
2. **Créez ou modifiez** le fichier `header.tpl`
3. **Remplacez** le contenu par ce code :

```html
{* Header personnalisé Devorbaits *}
<header id="header" class="header-nav">
  <nav class="header-nav">
    <div class="header-container">
      {* Logo *}
      <a href="{$urls.pages.index}" class="header-logo">
        <svg class="header-logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span>Devorbaits</span>
      </a>

      {* Navigation Desktop *}
      <div class="header-nav-menu">
        {foreach $categories as $category}
          <a href="{$category.url}" class="header-nav-link">
            {$category.name}
          </a>
        {/foreach}
      </div>

      {* Actions *}
      <div class="header-actions">
        {* Compte *}
        <a href="{$urls.pages.my_account}" class="header-action-link" title="Mon compte">
          <svg class="header-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </a>

        {* Panier *}
        <a href="{$urls.pages.cart}" class="header-action-link" title="Panier">
          <svg class="header-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {if $cart.products_count > 0}
            <span class="cart-count-badge">{$cart.products_count}</span>
          {/if}
        </a>

        {* Menu Mobile Button *}
        <button class="mobile-menu-button" id="mobile-menu-toggle">
          <svg class="header-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>

    {* Menu Mobile *}
    <div class="mobile-menu" id="mobile-menu" style="display: none;">
      {foreach $categories as $category}
        <a href="{$category.url}" class="mobile-menu-link">
          {$category.name}
        </a>
      {/foreach}
    </div>
  </nav>
</header>

<script>
  // Toggle menu mobile
  document.getElementById('mobile-menu-toggle')?.addEventListener('click', function() {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
  });
</script>
```

---

## 🦶 Étape 4 : Adapter le Footer

### Créer le fichier footer-personnalise.tpl

1. **Dans WebTransfer**, allez dans :
   - `/PrestaShop/themes/votre-theme/templates/layouts/`
2. **Créez ou modifiez** le fichier `footer.tpl`
3. **Utilisez** le code HTML adapté depuis votre `Footer.tsx`

---

## 🎨 Étape 5 : Personnaliser les Couleurs

Dans le fichier CSS, vous pouvez modifier les couleurs :

- **Couleur principale (jaune)** : `--color-yellow-500: #eab308;`
- **Couleur fond** : `--color-noir-950: #0a0a0a;`
- **Couleur texte** : Modifiez les valeurs dans les classes

---

## 📱 Étape 6 : Tester

1. **Videz le cache PrestaShop** (back-office > Performance > Vider le cache)
2. **Testez** votre site : `https://devorbaits.com/prestashop/`
3. **Vérifiez** que le header et le design s'affichent correctement

---

## ⚠️ Important

- **Faites une sauvegarde** de vos fichiers avant de les modifier
- **Testez** sur un site de développement si possible
- **Videz le cache** après chaque modification

---

## 🆘 Problèmes Courants

### Le CSS ne s'applique pas
- Vérifiez que le chemin vers le fichier CSS est correct
- Videz le cache PrestaShop
- Vérifiez les permissions du fichier (644)

### Le header ne s'affiche pas
- Vérifiez que le fichier `header.tpl` est au bon endroit
- Vérifiez la syntaxe Smarty (les variables `{$...}`)
- Consultez les logs d'erreur PrestaShop

---

## ✅ Checklist

- [ ] Fichier CSS téléchargé dans `/themes/votre-theme/assets/css/`
- [ ] CSS intégré dans le template (header.tpl ou via back-office)
- [ ] Header.tpl modifié avec le nouveau design
- [ ] Footer.tpl modifié (optionnel)
- [ ] Cache PrestaShop vidé
- [ ] Site testé et fonctionnel

---

**Bon courage ! 🚀**








