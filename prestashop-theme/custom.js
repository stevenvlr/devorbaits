/**
 * PrestaShop Custom JavaScript - Devorbaits
 * Version optimisée
 */

(function() {
  'use strict';

  // Attendre que le DOM soit chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // Menu mobile (déjà géré dans header.tpl, mais on peut ajouter des améliorations)
    initMobileMenu();
    
    // Améliorer l'accessibilité
    initAccessibility();
    
    // Optimiser les images
    initLazyLoading();
    
    // Animations au scroll
    initScrollAnimations();
  }

  /**
   * Amélioration du menu mobile
   */
  function initMobileMenu() {
    var toggle = document.getElementById('mobile-menu-toggle');
    var menu = document.getElementById('mobile-menu');
    
    if (toggle && menu) {
      // Fermer le menu si on clique en dehors
      document.addEventListener('click', function(event) {
        if (menu.classList.contains('active') && 
            !menu.contains(event.target) && 
            !toggle.contains(event.target)) {
          closeMobileMenu();
        }
      });
      
      // Fermer le menu avec la touche Escape
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && menu.classList.contains('active')) {
          closeMobileMenu();
        }
      });
    }
  }

  function closeMobileMenu() {
    var menu = document.getElementById('mobile-menu');
    var toggle = document.getElementById('mobile-menu-toggle');
    var iconOpen = document.getElementById('menu-icon-open');
    var iconClose = document.getElementById('menu-icon-close');
    
    if (menu && toggle) {
      menu.classList.remove('active');
      menu.style.display = 'none';
      toggle.setAttribute('aria-expanded', 'false');
      if (iconOpen) iconOpen.style.display = 'block';
      if (iconClose) iconClose.style.display = 'none';
    }
  }

  /**
   * Améliorer l'accessibilité
   */
  function initAccessibility() {
    // Ajouter des attributs ARIA manquants
    var buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(function(button) {
      if (button.textContent.trim()) {
        button.setAttribute('aria-label', button.textContent.trim());
      }
    });
    
    // Améliorer la navigation au clavier
    var links = document.querySelectorAll('a[href^="#"]');
    links.forEach(function(link) {
      link.addEventListener('click', function(event) {
        var target = document.querySelector(link.getAttribute('href'));
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          target.focus();
        }
      });
    });
  }

  /**
   * Lazy loading des images (si non supporté nativement)
   */
  function initLazyLoading() {
    if ('IntersectionObserver' in window) {
      var imageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              img.classList.add('loaded');
              observer.unobserve(img);
            }
          }
        });
      });

      var lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(function(img) {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Animations au scroll
   */
  function initScrollAnimations() {
    if ('IntersectionObserver' in window) {
      var animationObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fadeIn');
            animationObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1
      });

      var animatedElements = document.querySelectorAll('.product-card, .category-item, .feature-card');
      animatedElements.forEach(function(el) {
        animationObserver.observe(el);
      });
    }
  }

  /**
   * Améliorer les formulaires
   */
  var forms = document.querySelectorAll('form');
  forms.forEach(function(form) {
    form.addEventListener('submit', function(event) {
      var submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = submitButton.textContent + '...';
      }
    });
  });

  /**
   * Gestion des erreurs
   */
  window.addEventListener('error', function(event) {
    console.error('Erreur JavaScript:', event.error);
    // Ne pas bloquer l'interface en cas d'erreur
  });

})();







