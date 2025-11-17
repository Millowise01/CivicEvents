// Main bootstrap: icons, footer year, modal interactions, initial route.
(function (window, $) {
  'use strict';

  function initFooterYear() {
    $('#footer-year').text(new Date().getFullYear());
  }

  function initFeatherIcons() {
    if (window.feather) {
      window.feather.replace();
    }
  }

  function initModal() {
    var $backdrop = $('#modal-backdrop');
    if (!$backdrop.length) return;
    var lastFocusedElement = null;

    function hideModal() {
      $backdrop.addClass('hidden').attr('aria-hidden', 'true');
    }

    $backdrop.on('click', function (e) {
      if ($(e.target).is('#modal-backdrop')) {
        hideModal();
      }
    });

    $backdrop.on('click', '.close-modal', function () {
      hideModal();
    });

    var observer = new MutationObserver(function () {
      var isHidden = $backdrop.hasClass('hidden');
      if (!isHidden) {
        lastFocusedElement = document.activeElement;
        window.requestAnimationFrame(function () {
          var $focusable = $backdrop
            .find(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            .filter(':visible')
            .first();
          if ($focusable.length) {
            $focusable.focus();
          }
        });
      } else if (lastFocusedElement) {
        $(lastFocusedElement).focus();
        lastFocusedElement = null;
      }
    });

    observer.observe($backdrop[0], {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  function initConnectivityBanner() {
    var $banner = $('#offline-banner');
    if (!$banner.length) return;

    function syncNetworkStatus() {
      if (navigator.onLine === false) {
        $banner.removeClass('hidden');
      } else {
        $banner.addClass('hidden');
      }
    }

    window.addEventListener('online', syncNetworkStatus);
    window.addEventListener('offline', syncNetworkStatus);
    syncNetworkStatus();
  }

  $(function () {
    initFooterYear();
    initFeatherIcons();
    initModal();
    initConnectivityBanner();

    // Initial route resolution
    if (window.CivicRouter) {
      if (!window.location.hash) {
        if (window.CivicAuth && window.CivicAuth.isAuthenticated()) {
          window.location.hash = window.CivicAuth.isAdmin()
            ? '#/dashboard'
            : '#/events';
        } else {
          window.location.hash = '#/login';
        }
      } else {
        CivicRouter.navigate();
      }
    }
  });
})(window, jQuery);


