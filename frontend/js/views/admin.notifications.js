// Admin notifications management: create broadcast notifications and manage existing ones.
// ROLE GUARD: Registered as adminOnly route via router.
(function (window, $) {
  'use strict';

  var notificationsCache = [];

  function renderAdminNotificationsPage($container) {
    $container.html(
      '<div class="space-y-4">' +
        '<div class="flex items-center justify-between">' +
        '<div>' +
        '<h1 class="text-lg font-semibold text-slate-900">Broadcast notifications</h1>' +
        '<p class="text-xs text-slate-500">Send in-app alerts to all users or a targeted audience.</p>' +
        '</div>' +
        '<button id="admin-notifications-refresh" class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">' +
        '<span data-feather="refresh-cw" class="w-3.5 h-3.5"></span>' +
        '<span>Refresh</span>' +
        '</button>' +
        '</div>' +
        '<div class="grid gap-4 lg:grid-cols-3">' +
        '<section class="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-4 space-y-3">' +
        '<div class="flex items-center justify-between text-xs text-slate-500">' +
        '<span>Newest notifications appear first.</span>' +
        '<input id="admin-notifications-search" type="search" placeholder="Search title/message..." class="rounded-full border border-slate-200 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" />' +
        '</div>' +
        '<div id="admin-notifications-list" class="space-y-2"></div>' +
        '</section>' +
        '<section class="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">' +
        '<div>' +
        '<h2 class="text-sm font-semibold text-slate-900">Create notification</h2>' +
        '<p class="text-[11px] text-slate-500">All required fields must be completed before sending.</p>' +
        '</div>' +
        '<form id="admin-notification-form" class="space-y-3" novalidate>' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-notification-title">Title</label>' +
        '<input id="admin-notification-title" type="text" required class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />' +
        '</div>' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-notification-message">Message</label>' +
        '<textarea id="admin-notification-message" rows="3" required class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>' +
        '</div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-notification-type">Type</label>' +
        '<select id="admin-notification-type" class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">' +
        '<option value="info">Info</option>' +
        '<option value="success">Success</option>' +
        '<option value="warning">Warning</option>' +
        '<option value="alert">Alert</option>' +
        '</select>' +
        '</div>' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-notification-audience">Audience</label>' +
        '<select id="admin-notification-audience" class="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">' +
        '<option value="all">All users</option>' +
        '<option value="admins">Admins only</option>' +
        '<option value="users">Normal users</option>' +
        '<option value="single">Specific user</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '<div id="admin-notification-user-wrapper" class="space-y-1 hidden">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-notification-user-id">Target user ID</label>' +
        '<input id="admin-notification-user-id" type="number" min="1" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter the numeric user ID" />' +
        '</div>' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-notification-event-id">Related event (optional)</label>' +
        '<input id="admin-notification-event-id" type="number" min="1" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Event ID to link users to" />' +
        '</div>' +
        '<button id="admin-notification-submit" type="submit" class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-2 hover:bg-indigo-700">' +
        '<span>Send notification</span>' +
        '</button>' +
        '</form>' +
        '</section>' +
        '</div>' +
        '</div>'
    );

    loadAdminNotifications();
    bindAdminNotificationHandlers($container);
  }

  function loadAdminNotifications() {
    $('#admin-notifications-list').html(
      '<div class="h-24 rounded-xl border border-slate-100 bg-slate-50 animate-pulse"></div>'
    );
    CivicAPI.request({
      url: '/notifications',
      method: 'GET'
    }).done(function (data) {
      notificationsCache =
        data.items || data.rows || data.data || data || [];
      renderAdminNotificationsList($('#admin-notifications-search').val());
    });
  }

  function renderAdminNotificationsList(searchTerm) {
    var filtered = notificationsCache;
    if (searchTerm) {
      var query = searchTerm.toLowerCase();
      filtered = notificationsCache.filter(function (item) {
        return (
          (item.title || '').toLowerCase().indexOf(query) !== -1 ||
          (item.message || '').toLowerCase().indexOf(query) !== -1
        );
      });
    }

    var $list = $('#admin-notifications-list');
    if (!filtered.length) {
      $list.html(
        '<p class="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-xl">No notifications found.</p>'
      );
      return;
    }

    var cards = filtered
      .map(function (n) {
        var created = n.created_at
          ? new Date(n.created_at).toLocaleString()
          : '';
        return (
          '<article class="border border-slate-100 rounded-xl p-3 flex items-start justify-between gap-3">' +
          '<div class="min-w-0">' +
          '<p class="text-xs font-semibold text-slate-900">' +
          n.title +
          '</p>' +
          '<p class="text-[11px] text-slate-500 line-clamp-2">' +
          (n.message || '') +
          '</p>' +
          (created
            ? '<p class="text-[10px] text-slate-400 mt-1">' + created + '</p>'
            : '') +
          '</div>' +
          '<div class="flex flex-col items-end gap-2 text-[10px]">' +
          '<span class="px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 capitalize">' +
          (n.type || 'info') +
          '</span>' +
          '<button class="admin-delete-notification text-rose-600 hover:text-rose-700 text-xs" data-id="' +
          n.id +
          '">Delete</button>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');
    $list.html(cards);
  }

  function submitAdminNotification(e) {
    e.preventDefault();
    var title = $('#admin-notification-title').val().trim();
    var message = $('#admin-notification-message').val().trim();
    if (!title || !message) {
      CivicAPI.toast('Title and message are required.', { type: 'warn' });
      return;
    }
    var audience = $('#admin-notification-audience').val();
    var payload = {
      title: title,
      message: message,
      type: $('#admin-notification-type').val(),
      audience: audience,
      metadata: {}
    };
    if (audience === 'single') {
      var userId = $('#admin-notification-user-id').val();
      if (!userId) {
        CivicAPI.toast('Enter the user ID for targeted notifications.', {
          type: 'warn'
        });
        return;
      }
      payload.user_id = Number(userId);
    } else if (audience === 'admins') {
      payload.target_role = 'admin';
    } else if (audience === 'users') {
      payload.target_role = 'user';
    }

    var eventId = $('#admin-notification-event-id').val();
    if (eventId) {
      payload.metadata.event_id = Number(eventId);
    }

    $('#admin-notification-submit').prop('disabled', true).addClass('opacity-60');
    CivicAPI.request({
      url: '/notifications',
      method: 'POST',
      data: payload
    })
      .done(function () {
        CivicAPI.toast('Notification broadcasted successfully.', {
          type: 'success'
        });
        $('#admin-notification-form')[0].reset();
        $('#admin-notification-user-wrapper').addClass('hidden');
        loadAdminNotifications();
      })
      .always(function () {
        $('#admin-notification-submit')
          .prop('disabled', false)
          .removeClass('opacity-60');
      });
  }

  function deleteAdminNotification(id) {
    if (!window.confirm('Delete this notification?')) return;
    CivicAPI.request({
      url: '/notifications/' + id,
      method: 'DELETE'
    }).done(function () {
      CivicAPI.toast('Notification deleted.', { type: 'success' });
      loadAdminNotifications();
    });
  }

  function bindAdminNotificationHandlers($container) {
    $container.off('click', '#admin-notifications-refresh');
    $container.on('click', '#admin-notifications-refresh', function () {
      loadAdminNotifications();
    });

    $container.off('input', '#admin-notifications-search');
    $container.on('input', '#admin-notifications-search', function () {
      renderAdminNotificationsList($(this).val());
    });

    $container.off('change', '#admin-notification-audience');
    $container.on('change', '#admin-notification-audience', function () {
      var showUserField = $(this).val() === 'single';
      $('#admin-notification-user-wrapper').toggleClass('hidden', !showUserField);
    });

    $container.off('submit', '#admin-notification-form');
    $container.on('submit', '#admin-notification-form', submitAdminNotification);

    $container.off('click', '.admin-delete-notification');
    $container.on('click', '.admin-delete-notification', function () {
      deleteAdminNotification($(this).data('id'));
    });
  }

  $(function () {
    if (!window.CivicRouter) return;
    CivicRouter.register('/admin/notifications', {
      requireAuth: true,
      adminOnly: true,
      render: function ($container) {
        renderAdminNotificationsPage($container);
      }
    });
  });
})(window, jQuery);


