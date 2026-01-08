{*
* Header personnalisé Devorbaits pour PrestaShop
* À placer dans : /themes/votre-theme/templates/layouts/header.tpl
*}

<header id="header" class="header-nav">
  <nav class="header-nav">
    <div class="header-container">
      {* Logo *}
      <a href="{$urls.pages.index}" class="header-logo">
        <svg class="header-logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <span>Devorbaits</span>
      </a>

      {* Navigation Desktop - Catégories *}
      <div class="header-nav-menu">
        {foreach $categories as $category}
          <a href="{$category.url}" class="header-nav-link">
            {$category.name}
          </a>
        {/foreach}
      </div>

      {* Actions Header *}
      <div class="header-actions">
        {* Compte Utilisateur *}
        {if $customer.is_logged}
          <a href="{$urls.pages.my_account}" class="header-action-link" title="{$customer.firstname} {$customer.lastname}">
            <svg class="header-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </a>
        {else}
          <a href="{$urls.pages.authentication}" class="header-action-link" title="Se connecter">
            <svg class="header-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </a>
        {/if}

        {* Panier *}
        <a href="{$urls.pages.cart}" class="header-action-link" title="Panier">
          <svg class="header-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {if $cart.products_count > 0}
            <span class="cart-count-badge">{$cart.products_count}</span>
          {/if}
        </a>

        {* Bouton Menu Mobile *}
        <button class="mobile-menu-button" id="mobile-menu-toggle" aria-label="Menu">
          <svg class="header-action-icon" id="menu-icon-open" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg class="header-action-icon" id="menu-icon-close" style="display: none;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    {* Menu Mobile *}
    <div class="mobile-menu" id="mobile-menu" style="display: none;">
      {foreach $categories as $category}
        <a href="{$category.url}" class="mobile-menu-link" onclick="document.getElementById('mobile-menu').style.display='none';">
          {$category.name}
        </a>
      {/foreach}
    </div>
  </nav>
</header>

<script>
  // Toggle menu mobile
  (function() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const menu = document.getElementById('mobile-menu');
    const iconOpen = document.getElementById('menu-icon-open');
    const iconClose = document.getElementById('menu-icon-close');
    
    if (toggle && menu) {
      toggle.addEventListener('click', function() {
        const isOpen = menu.style.display !== 'none';
        menu.style.display = isOpen ? 'none' : 'block';
        if (iconOpen) iconOpen.style.display = isOpen ? 'block' : 'none';
        if (iconClose) iconClose.style.display = isOpen ? 'none' : 'block';
      });
    }
  })();
</script>


