// Service requests: users can submit requests and view their status.
// Admin can view all requests and update status.
(function (window, $) {
  'use strict';

  function isAdmin() {
    return window.CivicAuth && window.CivicAuth.isAdmin();
  }

  function renderServiceRequests($container) {
    $container.html(
      '<div class="space-y-4">' +
        '<div class="flex items-center justify-between">' +
        '<div>' +
        '<h1 class="text-lg font-semibold text-slate-900">Service requests</h1>' +
        '<p class="text-xs text-slate-500">' +
        (isAdmin() 
          ? 'Manage civic service requests from community members.'
          : 'Submit requests for civic services or report issues.') +
        '</p>' +
        '</div>' +
        (!isAdmin() 
          ? '<button id="create-service-request" class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-indigo-700">' +
            '<span class="h-4 w-4 rounded-full border border-indigo-200 flex items-center justify-center text-[10px]">+</span>' +
            '<span>New request</span>' +
            '</button>'
          : '<button id="refresh-service-requests" class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">' +
            '<span data-feather="refresh-cw" class="w-3.5 h-3.5"></span>' +
            '<span>Refresh</span>' +
            '</button>') +
        '</div>' +
        (isAdmin() 
          ? '<div class="flex items-center gap-2 text-xs">' +
            '<select id="status-filter" class="rounded-full border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">' +
            '<option value="">All statuses</option>' +
            '<option value="pending">Pending</option>' +
            '<option value="in_progress">In Progress</option>' +
            '<option value="resolved">Resolved</option>' +
            '<option value="rejected">Rejected</option>' +
            '</select>' +
            '</div>'
          : '') +
        '<div id="service-requests-list" class="space-y-3"></div>' +
        '</div>'
    );

    loadServiceRequests();
    bindServiceRequestHandlers($container);
  }

  function loadServiceRequests() {
    var url = isAdmin() ? '/service-requests' : '/service-requests/my-requests';
    var statusFilter = $('#status-filter').val();
    if (statusFilter) {
      url += (url.indexOf('?') === -1 ? '?' : '&') + 'status=' + statusFilter;
    }

    $('#service-requests-list').html(
      '<div class="h-24 rounded-xl border border-slate-100 bg-slate-50 animate-pulse"></div>'
    );

    CivicAPI.request({
      url: url,
      method: 'GET'
    }).done(function (data) {
      var items = data.items || data.rows || data.data || data;
      renderServiceRequestsList(items);
    });
  }

  function renderServiceRequestsList(items) {
    var $list = $('#service-requests-list');
    if (!items || !items.length) {
      $list.html(
        '<p class="text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">' +
        (isAdmin() ? 'No service requests found.' : 'You have not submitted any requests yet.') +
        '</p>'
      );
      return;
    }

    var cards = items.map(function (request) {
      var created = request.created_at ? new Date(request.created_at).toLocaleString() : '';
      var statusColors = {
        pending: 'border-amber-200 bg-amber-50 text-amber-700',
        in_progress: 'border-blue-200 bg-blue-50 text-blue-700',
        resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        rejected: 'border-rose-200 bg-rose-50 text-rose-700'
      };
      var statusColor = statusColors[request.status] || statusColors.pending;

      return (
        '<article class="bg-white border border-slate-100 rounded-xl p-3">' +
        '<div class="flex items-start justify-between gap-3 mb-2">' +
        '<div class="min-w-0">' +
        '<h3 class="text-sm font-semibold text-slate-900">' + request.title + '</h3>' +
        '<p class="text-[11px] text-slate-500">' + created + 
        (isAdmin() && request.user ? ' • ' + (request.user.full_name || request.user.email) : '') +
        '</p>' +
        '</div>' +
        '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ' + statusColor + '">' +
        (request.status || 'pending').replace('_', ' ') +
        '</span>' +
        '</div>' +
        '<p class="text-xs text-slate-600 mb-2">' + (request.description || '') + '</p>' +
        '<div class="flex items-center justify-between text-xs">' +
        '<span class="text-slate-400">Type: ' + (request.type || 'General') + '</span>' +
        '<div class="flex items-center gap-2">' +
        '<button class="view-service-request text-indigo-600 hover:text-indigo-700" data-id="' + request.id + '">View</button>' +
        (isAdmin() 
          ? '<button class="update-service-request text-slate-600 hover:text-slate-700" data-id="' + request.id + '">Update</button>'
          : '') +
        '</div>' +
        '</div>' +
        '</article>'
      );
    }).join('');

    $list.html(cards);
  }

  function openCreateRequestModal() {
    var $backdrop = $('#modal-backdrop');
    var $panel = $('#modal-panel');

    $panel.html(
      '<header class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">' +
      '<h2 class="text-sm font-semibold text-slate-900">New service request</h2>' +
      '<button class="close-modal p-1.5 rounded-full hover:bg-slate-100" aria-label="Close">' +
      '<span data-feather="x" class="w-4 h-4 text-slate-500"></span>' +
      '</button>' +
      '</header>' +
      '<form id="service-request-form" class="px-5 py-4 space-y-3" novalidate>' +
      '<div class="space-y-1">' +
      '<label class="text-xs font-medium text-slate-600" for="request-title">Title</label>' +
      '<input id="request-title" type="text" required class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />' +
      '</div>' +
      '<div class="space-y-1">' +
      '<label class="text-xs font-medium text-slate-600" for="request-type">Type</label>' +
      '<select id="request-type" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">' +
      '<option value="general">General</option>' +
      '<option value="infrastructure">Infrastructure</option>' +
      '<option value="public_safety">Public Safety</option>' +
      '<option value="environment">Environment</option>' +
      '<option value="transportation">Transportation</option>' +
      '</select>' +
      '</div>' +
      '<div class="space-y-1">' +
      '<label class="text-xs font-medium text-slate-600" for="request-description">Description</label>' +
      '<textarea id="request-description" rows="4" required class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>' +
      '</div>' +
      '<button type="submit" class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-2 hover:bg-indigo-700">' +
      '<span>Submit request</span>' +
      '</button>' +
      '</form>'
    );

    $backdrop.removeClass('hidden').attr('aria-hidden', 'false');
    if (window.feather) window.feather.replace();
  }

  function submitServiceRequest(e) {
    e.preventDefault();
    var title = $('#request-title').val().trim();
    var description = $('#request-description').val().trim();
    var type = $('#request-type').val();

    if (!title || !description) {
      CivicAPI.toast('Title and description are required.', { type: 'warn' });
      return;
    }

    CivicAPI.request({
      url: '/service-requests',
      method: 'POST',
      data: {
        title: title,
        description: description,
        type: type
      }
    }).done(function () {
      CivicAPI.toast('Service request submitted successfully.', { type: 'success' });
      $('#modal-backdrop').addClass('hidden').attr('aria-hidden', 'true');
      loadServiceRequests();
    });
  }

  function bindServiceRequestHandlers($container) {
    $container.off('click', '#create-service-request');
    $container.on('click', '#create-service-request', openCreateRequestModal);

    $container.off('click', '#refresh-service-requests');
    $container.on('click', '#refresh-service-requests', loadServiceRequests);

    $container.off('change', '#status-filter');
    $container.on('change', '#status-filter', loadServiceRequests);

    $container.off('submit', '#service-request-form');
    $container.on('submit', '#service-request-form', submitServiceRequest);

    $container.off('click', '.view-service-request');
    $container.on('click', '.view-service-request', function () {
      var id = $(this).data('id');
      // Could implement detailed view modal here
      CivicAPI.toast('Service request #' + id + ' details would open here.', { type: 'info' });
    });
  }

  $(function () {
    if (!window.CivicRouter) return;
    
    CivicRouter.register('/service-requests', {
      requireAuth: true,
      adminOnly: false,
      render: function ($container) {
        renderServiceRequests($container);
      }
    });
  });
})(window, jQuery);