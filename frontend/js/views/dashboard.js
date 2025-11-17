// Admin dashboard: summary metrics and basic activity feed.
// Admin-only guard is enforced at the router level; this module assumes admin.
(function (window, $) {
  'use strict';

  function renderDashboard($container) {
    $container.html(
      '<div class="mb-4 flex items-center justify-between">' +
        '<div>' +
        '<h1 class="text-lg font-semibold text-slate-900">Admin dashboard</h1>' +
        '<p class="text-xs text-slate-500">High-level overview of events, promos, registrations and activity.</p>' +
        '</div>' +
        '</div>' +
        '<div id="dashboard-metrics" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4"></div>' +
        '<div id="dashboard-activity" class="bg-white border border-slate-100 rounded-xl p-3">' +
        '<h2 class="text-xs font-semibold text-slate-900 mb-2">Recent activity</h2>' +
        '<div id="dashboard-activity-list" class="space-y-2 max-h-64 overflow-y-auto scrollbar-thin"></div>' +
        '</div>'
    );

    loadMetrics();
    loadActivity();
  }

  function metricCard(label, value, accentClass) {
    return (
      '<div class="bg-white border border-slate-100 rounded-xl px-3 py-2.5 flex flex-col gap-1">' +
      '<p class="text-[11px] text-slate-500">' +
      label +
      '</p>' +
      '<p class="text-base font-semibold text-slate-900">' +
      (value != null ? value : '—') +
      '</p>' +
      (accentClass
        ? '<span class="mt-1 inline-flex h-1.5 w-10 rounded-full ' +
          accentClass +
          '"></span>'
        : '') +
      '</div>'
    );
  }

  function loadMetrics() {
    CivicAPI.request({
      url: '/dashboard/admin',
      method: 'GET'
    }).done(function (data) {
      var $metrics = $('#dashboard-metrics');
      $metrics.html(
        metricCard('Total events', data.total_events, 'bg-indigo-500') +
          metricCard('Promos', data.total_promos, 'bg-sky-500') +
          metricCard('Registrations', data.registrations_count, 'bg-emerald-500') +
          metricCard('Users', data.users_count, 'bg-violet-500') +
          metricCard('Pending requests', data.pending_requests, 'bg-amber-500') +
          metricCard('Resolved requests', data.resolved_requests, 'bg-emerald-500') +
          metricCard('Unread notifications', data.unread_notifications, 'bg-rose-500') +
          metricCard('Service requests', data.total_service_requests, 'bg-slate-500')
      );
    });
  }

  function loadActivity() {
    CivicAPI.request({
      url: '/dashboard/activity',
      method: 'GET'
    }).done(function (data) {
      var items = data.items || data.rows || data.data || data;
      var $list = $('#dashboard-activity-list');
      if (!items || !items.length) {
        $list.html(
          '<p class="text-xs text-slate-500">No recent activity logged.</p>'
        );
        return;
      }
      var rows = items
        .map(function (item) {
          var created = item.created_at
            ? new Date(item.created_at).toLocaleString()
            : '';
          return (
            '<div class="flex items-start gap-2 text-xs text-slate-700">' +
            '<span class="mt-0.5 h-1.5 w-1.5 rounded-full bg-slate-400"></span>' +
            '<div>' +
            '<p>' +
            (item.description || item.title || 'Activity') +
            '</p>' +
            (created
              ? '<p class="text-[10px] text-slate-400">' +
                created +
                '</p>'
              : '') +
            '</div>' +
            '</div>'
          );
        })
        .join('');
      $list.html(rows);
    });
  }

  $(function () {
    if (!window.CivicRouter) return;
    CivicRouter.register('/dashboard', {
      requireAuth: true,
      adminOnly: true, // ROLE GUARD: only admins can see dashboard
      render: function ($container) {
        renderDashboard($container);
      }
    });
  });
})(window, jQuery);


