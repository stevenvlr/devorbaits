{*
* Footer personnalisé Devorbaits pour PrestaShop
* Version optimisée et vérifiée
* À placer dans : /themes/mon_theme_enfant/templates/layouts/footer.tpl
*}

<footer id="footer">
  <div class="footer-container">
    <div class="footer-grid">
      {* Brand Section *}
      <div class="footer-brand-section">
        <div class="footer-brand">
          <svg class="footer-brand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <span class="footer-brand-text">Devorbaits</span>
        </div>
        <p class="footer-description">
          Appâts premium pour la pêche à la carpe. Fabrication française de qualité.
        </p>
        <div class="footer-badge">
          <svg class="footer-badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <span class="footer-badge-text">FABRIQUÉ EN FRANCE</span>
        </div>
      </div>

      {* Catégories *}
      <div class="footer-section">
        <h3 class="footer-section-title">Catégories</h3>
        <ul class="footer-links">
          {if isset($categories) && is_array($categories)}
            {foreach $categories as $category}
              {if isset($category.url) && isset($category.name)}
                <li>
                  <a href="{$category.url}" class="footer-link" title="{$category.name}">{$category.name}</a>
                </li>
              {/if}
            {/foreach}
          {/if}
        </ul>
      </div>

      {* Informations *}
      <div class="footer-section">
        <h3 class="footer-section-title">Informations</h3>
        <ul class="footer-links">
          {if isset($urls.pages.cms)}
            <li>
              <a href="{$urls.pages.cms}" class="footer-link">À propos</a>
            </li>
          {/if}
          {if isset($urls.pages.contact)}
            <li>
              <a href="{$urls.pages.contact}" class="footer-link">Contact</a>
            </li>
          {/if}
          {if isset($urls.pages.sitemap)}
            <li>
              <a href="{$urls.pages.sitemap}" class="footer-link">Plan du site</a>
            </li>
          {/if}
          {if isset($urls.pages.cgv)}
            <li>
              <a href="{$urls.pages.cgv}" class="footer-link">CGV</a>
            </li>
          {/if}
          {if isset($customer) && $customer.is_logged && isset($urls.pages.my_account)}
            <li>
              <a href="{$urls.pages.my_account}" class="footer-link">Mon compte</a>
            </li>
          {/if}
        </ul>
      </div>

      {* Contact *}
      <div class="footer-section">
        <h3 class="footer-section-title">Contact</h3>
        <ul class="footer-links">
          <li class="footer-contact-item">
            <svg class="footer-contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <a href="mailto:contact@devorbaits.fr" class="footer-link">contact@devorbaits.fr</a>
          </li>
          <li class="footer-contact-item">
            <svg class="footer-contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>+33 1 XX XX XX XX</span>
          </li>
          <li class="footer-contact-item">
            <svg class="footer-contact-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>France</span>
          </li>
        </ul>
      </div>
    </div>

    {* Copyright *}
    <div class="footer-copyright">
      <p>&copy; {if isset($smarty.now)}{$smarty.now|date_format:"%Y"}{else}{'Y'|date}{/if} Devorbaits. Tous droits réservés. Fabriqué en France avec passion.</p>
    </div>
  </div>
</footer>







