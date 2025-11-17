// "My registrations" view: shows events the user has registered for and allows cancellation.
(function (window, $) {
  'use strict';

  function renderMyRegistrations($container) {
    $container.html(
      '<div class="mb-4">' +
        '<h1 class="text-lg font-semibold text-slate-900">My events</h1>' +
        '<p class="text-xs text-slate-500">Events you have registered for. You can cancel if you can no longer attend.</p>' +
        '</div>' +
        '<div id="my-registrations-list" class="space-y-3"></div>'
    );

    CivicAPI.request({
      url: '/event-registrations/my-registrations',
      method: 'GET'
    }).done(function (data) {
      var items = data.items || data.rows || data.data || data;
      var $list = $('#my-registrations-list');
      if (!items || !items.length) {
        $list.html(
          '<p class="text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">You have not registered for any events yet.</p>'
        );
        return;
      }
      var rows = items
        .map(function (r) {
          var ev = r.event || {};
          var when = ev.starts_at ? new Date(ev.starts_at).toLocaleString() : '';
          return (
            '<article class="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3">' +
            '<div class="min-w-0">' +
            '<h3 class="text-sm font-semibold text-slate-900 truncate">' +
            (ev.title || 'Event') +
            '</h3>' +
            '<p class="text-[11px] text-slate-500">' +
            (when || '') +
            (ev.location ? ' • ' + ev.location : '') +
            '</p>' +
            '</div>' +
            '<div class="flex items-center gap-2 text-xs">' +
            '<button class="view-event text-indigo-600 hover:text-indigo-700" data-id="' +
            ev.id +
            '">View</button>' +
            '<button class="cancel-registration text-rose-600 hover:text-rose-700" data-id="' +
            r.id +
            '">Cancel</button>' +
            '</div>' +
            '</article>'
          );
        })
        .join('');
      $list.html(rows);
    });

    $container.on('click', '.view-event', function () {
      var id = $(this).data('id');
      window.location.hash = '#/events/' + id;
    });

    $container.on('click', '.cancel-registration', function () {
      var id = $(this).data('id');
      CivicAPI.request({
        url: '/event-registrations/' + id,
        method: 'DELETE'
      }).done(function () {
        CivicAPI.toast('Your registration has been cancelled.', {
          type: 'success'
        });
        renderMyRegistrations($container);
      });
    });
  }

  $(function () {
    if (!window.CivicRouter) return;
    CivicRouter.register('/my-registrations', {
      requireAuth: true,
      adminOnly: false,
      render: function ($container) {
        renderMyRegistrations($container);
      }
    });
  });
})(window, jQuery);


