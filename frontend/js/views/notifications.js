// In-app notifications: bell count, drawer list, and inbox view.
// Admin-only creation will live in an admin panel; here we focus on consumption.
(function (window, $) {
  'use strict';

  function fetchNotifications() {
    return CivicAPI.request({
      url: '/notifications',
      method: 'GET'
    });
  }

  function renderNotificationItem(n) {
    var createdAt = n.created_at ? new Date(n.created_at).toLocaleString() : '';
    return (
      '<article class="notification-item bg-white border border-slate-100 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50" data-id="' +
      n.id +
      '">' +
      '<h3 class="text-xs font-semibold text-slate-900">' +
      n.title +
      '</h3>' +
      '<p class="text-[11px] text-slate-600 line-clamp-2">' +
      (n.message || '') +
      '</p>' +
      (createdAt
        ? '<p class="text-[10px] text-slate-400 mt-1">' + createdAt + '</p>'
        : '') +
      '</article>'
    );
  }

  var bellIntervalId = null;
  var lastDrawerFocus = null;

  function updateBellCount(count) {
    var $badge = $('#notifications-count-badge');
    if (!count) {
      $badge.addClass('hidden').text('');
    } else {
      $badge.removeClass('hidden').text(count > 9 ? '9+' : String(count));
    }
  }

  function extractUnreadCount(items) {
    if (!items || !items.length) return 0;
    return items.filter(function (n) {
      return !n.read_at && !n.is_read;
    }).length;
  }

  function refreshBellCount() {
    if (!window.CivicAuth || !window.CivicAuth.isAuthenticated()) {
      updateBellCount(0);
      return;
    }
    fetchNotifications()
      .done(function (data) {
        var items = data.items || data.rows || data.data || data;
        updateBellCount(extractUnreadCount(items));
      })
      .fail(function () {
        // Ignore errors to avoid toast spam; badge will try again on next interval.
      });
  }

  function startBellPolling() {
    if (bellIntervalId) return;
    refreshBellCount();
    bellIntervalId = window.setInterval(refreshBellCount, 60000);
  }

  function stopBellPolling() {
    if (bellIntervalId) {
      window.clearInterval(bellIntervalId);
      bellIntervalId = null;
    }
    updateBellCount(0);
  }

  function loadNotificationsIntoDrawer() {
    fetchNotifications().done(function (data) {
      var items = data.items || data.rows || data.data || data;
      var $list = $('#notifications-list');
      if (!items || !items.length) {
        $list.html(
          '<p class="text-xs text-slate-500 text-center mt-4">You have no notifications yet.</p>'
        );
        updateBellCount(0);
        return;
      }
      updateBellCount(extractUnreadCount(items));
      $list.html(
        items
          .slice(0, 15)
          .map(renderNotificationItem)
          .join('')
      );
    });
  }

  function openNotificationDetail(id) {
    CivicAPI.request({
      url: '/notifications/' + id,
      method: 'GET'
    }).done(function (n) {
      var $backdrop = $('#modal-backdrop');
      var $panel = $('#modal-panel');
      var created = n.created_at ? new Date(n.created_at).toLocaleString() : '';

      var linkHtml = '';
      if (n.metadata && n.metadata.event_id) {
        linkHtml =
          '<button class="open-related text-xs font-medium text-indigo-600 hover:text-indigo-700 mt-2" data-event-id="' +
          n.metadata.event_id +
          '">Go to related event</button>';
      }

      $panel.html(
        '<header class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">' +
          '<div>' +
          '<h2 class="text-sm font-semibold text-slate-900">Notification</h2>' +
          '<p class="text-[11px] text-slate-500">' +
          created +
          '</p>' +
          '</div>' +
          '<button class="close-modal p-1.5 rounded-full hover:bg-slate-100" aria-label="Close">' +
          '<span data-feather="x" class="w-4 h-4 text-slate-500"></span>' +
          '</button>' +
          '</header>' +
          '<div class="px-5 py-4 space-y-3">' +
          '<h3 class="text-sm font-semibold text-slate-900">' +
          n.title +
          '</h3>' +
          '<p class="text-xs text-slate-700 whitespace-pre-line">' +
          (n.message || '') +
          '</p>' +
          linkHtml +
          '</div>'
      );

      $backdrop.removeClass('hidden').attr('aria-hidden', 'false');
      if (window.feather) window.feather.replace();
    });
  }

  function renderNotificationsInbox($container) {
    $container.html(
      '<div class="flex items-center justify-between mb-4">' +
        '<div>' +
        '<h1 class="text-lg font-semibold text-slate-900">Notifications</h1>' +
        '<p class="text-xs text-slate-500">Broadcast messages and updates sent to you.</p>' +
        '</div>' +
        '</div>' +
        '<div id="notifications-inbox" class="space-y-2"></div>'
    );

    fetchNotifications().done(function (data) {
      var items = data.items || data.rows || data.data || data;
      var $list = $('#notifications-inbox');
      if (!items || !items.length) {
        $list.html(
          '<p class="text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">No notifications at the moment.</p>'
        );
        updateBellCount(0);
        return;
      }
      updateBellCount(extractUnreadCount(items));
      $list.html(items.map(renderNotificationItem).join(''));
    });
  }

  function closeDrawer($drawer) {
    if ($drawer.hasClass('translate-x-full')) return;
    $drawer.addClass('translate-x-full').attr('aria-hidden', 'true');
    if (lastDrawerFocus) {
      $(lastDrawerFocus).focus();
      lastDrawerFocus = null;
    } else {
      $('#notifications-bell').focus();
    }
  }

  function openDrawer($drawer) {
    lastDrawerFocus = document.activeElement;
    loadNotificationsIntoDrawer();
    $drawer.removeClass('translate-x-full').attr('aria-hidden', 'false');
    setTimeout(function () {
      $drawer.attr('tabindex', '-1').focus();
    }, 0);
  }

  function bindDrawerInteractions() {
    var $drawer = $('#notifications-drawer');
    var $bell = $('#notifications-bell');

    $bell.on('click', function () {
      if ($drawer.hasClass('translate-x-full')) {
        openDrawer($drawer);
      } else {
        closeDrawer($drawer);
      }
    });
    $('#close-notifications-drawer').on('click', function () {
      closeDrawer($drawer);
    });

    $(document).on('keydown.notificationsDrawer', function (event) {
      if (event.key === 'Escape' && !$drawer.hasClass('translate-x-full')) {
        event.preventDefault();
        closeDrawer($drawer);
      }
    });

    $('#notifications-list').on('click', '.notification-item', function () {
      var id = $(this).data('id');
      openNotificationDetail(id);
    });
  }

  function bindModalRelatedLink() {
    $('#modal-backdrop').on('click', '.open-related', function () {
      var eventId = $(this).data('event-id');
      if (eventId) {
        window.location.hash = '#/events/' + eventId;
        $('#modal-backdrop').addClass('hidden').attr('aria-hidden', 'true');
      }
    });
  }

  $(function () {
    bindDrawerInteractions();
    bindModalRelatedLink();
    if (!window.CivicRouter) return;

    CivicRouter.register('/notifications', {
      requireAuth: true,
      adminOnly: false,
      render: function ($container) {
        renderNotificationsInbox($container);
      }
    });

    if (window.CivicAuth && window.CivicAuth.isAuthenticated()) {
      startBellPolling();
    }
    CivicAPI.on('auth:changed', function () {
      if (window.CivicAuth.isAuthenticated()) {
        startBellPolling();
      } else {
        stopBellPolling();
      }
    });
    CivicAPI.on('auth:cleared', function () {
      stopBellPolling();
    });
  });
})(window, jQuery);


