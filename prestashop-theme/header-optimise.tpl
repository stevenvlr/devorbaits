{*
* Header personnalisé Devorbaits pour PrestaShop
* Version optimisée et vérifiée
* À placer dans : /themes/mon_theme_enfant/templates/layouts/header.tpl
*}

<header id="header" class="header-nav">
  <nav class="header-nav">
    <div class="header-container">
      {* Logo *}
      <a href="{$urls.pages.index}" class="header-logo" title="Devorbaits - Accueil">
        <svg class="header-logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span>Devorbaits</span>
      </a>

      {* Navigation Desktop - Catégories *}
      <div class="header-nav-menu">
        {if isset($categories) && is_array($categories)}
          {foreach $categories as $category}
            {if isset($category.url) && isset($category.name)}
              <a href="{$category.url}" class="header-nav-link" title="{$category.name}">
                {$category.name}
              </a>
            {/if}
          {/foreach}
        {/if}
      </div>

      {* Actions Header *}
      <div class="header-actions">
        {* Compte Utilisateur *}
        {if isset($customer) && $customer.is_logged}
          <a href="{$urls.pages.my_account}" class="header-action-link" title="{if isset($customer.firstname)}{$customer.firstname} {/if}{if isset($customer.lastname)}{$customer.lastname}{/if}">
            <svg class="header-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="sr-only">Mon compte</span>
          </a>
        {else}
          <a href="{$urls.pages.authentication}" class="header-action-link" title="Se connecter">
            <svg class="header-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="sr-only">Se connecter</span>
          </a>
        {/if}

        {* Panier *}
        <a href="{$urls.pages.cart}" class="header-action-link" title="Panier">
          <svg class="header-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {if isset($cart) && isset($cart.products_count) && $cart.products_count > 0}
            <span class="cart-count-badge" aria-label="{$cart.products_count} article(s) dans le panier">{$cart.products_count}</span>
          {/if}
          <span class="sr-only">Panier</span>
        </a>

        {* Bouton Menu Mobile *}
        <button class="mobile-menu-button" id="mobile-menu-toggle" aria-label="Ouvrir le menu" aria-expanded="false">
          <svg class="header-action-icon" id="menu-icon-open" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg class="header-action-icon" id="menu-icon-close" style="display: none;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    {* Menu Mobile *}
    <div class="mobile-menu" id="mobile-menu" role="navigation" aria-label="Menu de navigation mobile">
      {if isset($categories) && is_array($categories)}
        {foreach $categories as $category}
          {if isset($category.url) && isset($category.name)}
            <a href="{$category.url}" class="mobile-menu-link" title="{$category.name}">
              {$category.name}
            </a>
          {/if}
        {/foreach}
      {/if}
    </div>
  </nav>
</header>

{* Script optimisé pour le menu mobile *}
<script>
(function() {
  'use strict';
  
  var toggle = document.getElementById('mobile-menu-toggle');
  var menu = document.getElementById('mobile-menu');
  var iconOpen = document.getElementById('menu-icon-open');
  var iconClose = document.getElementById('menu-icon-close');
  
  if (toggle && menu) {
    toggle.addEventListener('click', function() {
      var isOpen = menu.classList.contains('active');
      
      if (isOpen) {
        menu.classList.remove('active');
        menu.style.display = 'none';
        toggle.setAttribute('aria-expanded', 'false');
        if (iconOpen) iconOpen.style.display = 'block';
        if (iconClose) iconClose.style.display = 'none';
      } else {
        menu.classList.add('active');
        menu.style.display = 'block';
        toggle.setAttribute('aria-expanded', 'true');
        if (iconOpen) iconOpen.style.display = 'none';
        if (iconClose) iconClose.style.display = 'block';
      }
    });
    
    // Fermer le menu au clic sur un lien
    var mobileLinks = menu.querySelectorAll('.mobile-menu-link');
    mobileLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        menu.classList.remove('active');
        menu.style.display = 'none';
        toggle.setAttribute('aria-expanded', 'false');
        if (iconOpen) iconOpen.style.display = 'block';
        if (iconClose) iconClose.style.display = 'none';
      });
    });
  }
})();
</script>

{* Style pour les éléments screen-reader only *}
<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>







