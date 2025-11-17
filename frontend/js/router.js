// Simple hash-based router. Handles public vs protected views and admin guards.
(function (window, $) {
  'use strict';

  var routes = [];

  function buildPattern(path) {
    var paramNames = [];
    var pattern = path.replace(/:[^/]+/g, function (segment) {
      paramNames.push(segment.substring(1));
      return '([^/]+)';
    });
    return {
      regex: new RegExp('^' + pattern + '$'),
      params: paramNames
    };
  }

  function registerRoute(path, options) {
    var config = $.extend(
      {
        requireAuth: true,
        adminOnly: false,
        render: function () {}
      },
      options || {}
    );
    config.path = path;
    if (path.indexOf(':') !== -1) {
      var patternInfo = buildPattern(path);
      config.pattern = patternInfo.regex;
      config.paramNames = patternInfo.params;
    }
    routes.push(config);
  }

  function matchRoute(path) {
    for (var i = 0; i < routes.length; i++) {
      var route = routes[i];
      if (route.path === path) {
        return { route: route, params: {} };
      }
      if (route.pattern) {
        var match = path.match(route.pattern);
        if (match) {
          var params = {};
          for (var j = 0; j < route.paramNames.length; j++) {
            params[route.paramNames[j]] = decodeURIComponent(match[j + 1]);
          }
          return { route: route, params: params };
        }
      }
    }
    return null;
  }

  function parseHash() {
    var hash = window.location.hash || '#/events';
    if (hash.charAt(0) === '#') hash = hash.substring(1);
    if (hash.charAt(0) !== '/') hash = '/' + hash;
    var parts = hash.split('?');
    var path = parts[0];
    return { path: path };
  }

  function navigate() {
    var parsed = parseHash();
    var matched = matchRoute(parsed.path);

    var isAuthenticated =
      window.CivicAuth && window.CivicAuth.isAuthenticated();
    var isAdmin = window.CivicAuth && window.CivicAuth.isAdmin();

    // Handle unmatched routes
    if (!matched) {
      if (!isAuthenticated) {
        window.location.hash = '#/login';
        return;
      }
      // default authenticated route
      window.location.hash = isAdmin ? '#/dashboard' : '#/events';
      return;
    }

    var route = matched.route;
    var params = matched.params || {};

    if (route.requireAuth && !isAuthenticated) {
      window.location.hash = '#/login';
      return;
    }

    if (route.adminOnly && !isAdmin) {
      CivicAPI.toast('You do not have access to that area.', {
        type: 'error'
      });
      window.location.hash = '#/events';
      return;
    }

    // Update active nav styles
    $('.nav-link').removeClass('bg-slate-900 text-slate-50 shadow-sm');
    $('[data-nav]').each(function () {
      var target = $(this).data('nav');
      var shouldHighlight =
        ((parsed.path === '/events' || parsed.path.indexOf('/events/') === 0) &&
          target === 'events') ||
        (parsed.path === '/announcements' && target === 'announcements') ||
        (parsed.path === '/promos' && target === 'promos') ||
        (parsed.path === '/service-requests' && target === 'service-requests') ||
        (parsed.path.indexOf('/my-registrations') === 0 &&
          target === 'my-registrations') ||
        ((parsed.path === '/dashboard' ||
          parsed.path.indexOf('/dashboard/') === 0) &&
          target === 'admin-dashboard') ||
        (parsed.path.indexOf('/admin') === 0 &&
          (target === 'admin-panel' || target === 'admin-dashboard')) ||
        (parsed.path.indexOf('/profile') === 0 && target === 'profile') ||
        (parsed.path.indexOf('/notifications') === 0 &&
          target === 'notifications-inbox');

      if (shouldHighlight) {
        $(this).addClass('bg-slate-900 text-slate-50 shadow-sm');
      }
    });

    // Render view
    var $container = $('#view-container');
    $container.empty();
    route.render(
      $container,
      $.extend({}, parsed, {
        params: params
      })
    );

    if (window.feather) {
      window.feather.replace();
    }
  }

  // Public registration function for views
  window.CivicRouter = {
    register: registerRoute,
    navigate: navigate
  };

  $(function () {
    // Register auth routes
    CivicRouter.register('/login', {
      requireAuth: false,
      adminOnly: false,
      render: function ($container) {
        // Show auth pages, hide app shell
        $('#app-shell').addClass('hidden');
        $('#auth-pages').removeClass('hidden');
        $('#login-view').removeClass('hidden');
        $('#signup-view').addClass('hidden');
      }
    });

    CivicRouter.register('/signup', {
      requireAuth: false,
      adminOnly: false,
      render: function ($container) {
        // Show auth pages, hide app shell
        $('#app-shell').addClass('hidden');
        $('#auth-pages').removeClass('hidden');
        $('#signup-view').removeClass('hidden');
        $('#login-view').addClass('hidden');
      }
    });

    // 404 error page
    CivicRouter.register('/404', {
      requireAuth: false,
      adminOnly: false,
      render: function ($container) {
        $container.html(
          '<div class="flex flex-col items-center justify-center min-h-64 text-center">' +
          '<div class="mb-4">' +
          '<span class="text-6xl">🏛️</span>' +
          '</div>' +
          '<h1 class="text-xl font-semibold text-slate-900 mb-2">Page not found</h1>' +
          '<p class="text-sm text-slate-500 mb-4">The page you\'re looking for doesn\'t exist or has been moved.</p>' +
          '<button onclick="history.back()" class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium px-4 py-2 hover:bg-indigo-700">' +
          '<span>Go back</span>' +
          '</button>' +
          '</div>'
        );
      }
    });

    // Top nav click handlers
    $(document).on('click', '[data-nav]', function () {
      var target = $(this).data('nav');
      switch (target) {
        case 'events':
          window.location.hash = '#/events';
          break;
        case 'announcements':
          window.location.hash = '#/announcements';
          break;
        case 'promos':
          window.location.hash = '#/promos';
          break;
        case 'service-requests':
          window.location.hash = '#/service-requests';
          break;
        case 'my-registrations':
          window.location.hash = '#/my-registrations';
          break;
        case 'admin-dashboard':
          window.location.hash = '#/dashboard';
          break;
        case 'admin-panel':
          window.location.hash = '#/dashboard';
          break;
        case 'admin-events':
          window.location.hash = '#/admin/events';
          break;
        case 'admin-announcements':
          window.location.hash = '#/admin/announcements';
          break;
        case 'admin-promos':
          window.location.hash = '#/admin/promos';
          break;
        case 'admin-notifications':
          window.location.hash = '#/admin/notifications';
          break;
        case 'admin-users':
          window.location.hash = '#/admin/users';
          break;
        case 'profile':
          window.location.hash = '#/profile';
          break;
        case 'notifications-inbox':
          window.location.hash = '#/notifications';
          break;
      }
    });

    $(window).on('hashchange', navigate);
  });
})(window, jQuery);


