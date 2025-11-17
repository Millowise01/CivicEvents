// Admin user management: list, filter, view detail, enable/disable users.
// ROLE GUARD: Registered as adminOnly route.
(function (window, $) {
  'use strict';

  var usersCache = [];

  function renderAdminUsersPage($container) {
    $container.html(
      '<div class="space-y-4">' +
        '<div class="flex items-center justify-between flex-wrap gap-3">' +
        '<div>' +
        '<h1 class="text-lg font-semibold text-slate-900">User management</h1>' +
        '<p class="text-xs text-slate-500">Enable/disable accounts and quickly review user details.</p>' +
        '</div>' +
        '<button id="admin-users-refresh" class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">' +
        '<span data-feather="refresh-cw" class="w-3.5 h-3.5"></span>' +
        '<span>Refresh</span>' +
        '</button>' +
        '</div>' +
        '<section class="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">' +
        '<div class="flex flex-col lg:flex-row lg:items-center gap-3 justify-between text-xs">' +
        '<div class="flex items-center gap-2">' +
        '<input id="admin-users-search" type="search" placeholder="Search name or email..." class="rounded-full border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
        '<select id="admin-users-role-filter" class="rounded-full border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">' +
        '<option value="">All roles</option>' +
        '<option value="admin">Admins</option>' +
        '<option value="user">Users</option>' +
        '</select>' +
        '<select id="admin-users-status-filter" class="rounded-full border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">' +
        '<option value="">All statuses</option>' +
        '<option value="active">Active</option>' +
        '<option value="inactive">Inactive</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '<div id="admin-users-table" class="overflow-x-auto">' +
        '<div class="h-24 border border-slate-100 rounded-xl bg-slate-50 animate-pulse"></div>' +
        '</div>' +
        '</section>' +
        '</div>'
    );

    loadUsers();
    bindAdminUsersHandlers($container);
  }

  function loadUsers() {
    $('#admin-users-table').html(
      '<div class="h-24 border border-slate-100 rounded-xl bg-slate-50 animate-pulse"></div>'
    );
    CivicAPI.request({
      url: '/users',
      method: 'GET'
    }).done(function (data) {
      usersCache = data.items || data.rows || data.data || data || [];
      renderUsersTable();
    });
  }

  function renderUsersTable() {
    var search = ($('#admin-users-search').val() || '').toLowerCase();
    var roleFilter = $('#admin-users-role-filter').val();
    var statusFilter = $('#admin-users-status-filter').val();

    var filtered = usersCache.filter(function (user) {
      var matchesSearch =
        !search ||
        (user.full_name || '')
          .toLowerCase()
          .includes(search) ||
        (user.email || '').toLowerCase().includes(search);
      var matchesRole = !roleFilter || user.role === roleFilter;
      var matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });

    var rows = filtered
      .map(function (user) {
        return (
          '<tr class="text-xs text-slate-600 border-b border-slate-50 last:border-none">' +
          '<td class="py-2 font-medium text-slate-900">' +
          (user.full_name || '—') +
          '</td>' +
          '<td class="py-2">' +
          (user.email || '—') +
          '</td>' +
          '<td class="py-2 capitalize">' +
          (user.role || 'user') +
          '</td>' +
          '<td class="py-2">' +
          (user.is_active
            ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">Active</span>'
            : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">Inactive</span>') +
          '</td>' +
          '<td class="py-2 text-right space-x-2 text-xs">' +
          '<button class="admin-view-user text-indigo-600 hover:text-indigo-700" data-id="' +
          user.id +
          '">View</button>' +
          '<button class="admin-toggle-user ' +
          (user.is_active
            ? 'text-rose-600 hover:text-rose-700'
            : 'text-emerald-600 hover:text-emerald-700') +
          '" data-id="' +
          user.id +
          '" data-active="' +
          (!!user.is_active) +
          '">' +
          (user.is_active ? 'Disable' : 'Enable') +
          '</button>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    if (!rows) {
      rows =
        '<tr><td colspan="5" class="py-4 text-center text-xs text-slate-500">No users match your filters.</td></tr>';
    }

    $('#admin-users-table').html(
      '<table class="min-w-full text-left">' +
        '<thead>' +
        '<tr class="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">' +
        '<th class="py-2">Name</th>' +
        '<th class="py-2">Email</th>' +
        '<th class="py-2">Role</th>' +
        '<th class="py-2">Status</th>' +
        '<th class="py-2 text-right">Actions</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' +
        rows +
        '</tbody>' +
        '</table>'
    );
  }

  function toggleUserStatus(userId, currentActive) {
    var action = currentActive ? 'disable' : 'enable';
    var confirmMessage =
      'Are you sure you want to ' + action + ' this user?';
    if (!window.confirm(confirmMessage)) return;
    CivicAPI.request({
      url: '/users/' + userId,
      method: 'PATCH',
      data: {
        is_active: !currentActive
      }
    })
      .done(function () {
        CivicAPI.toast('User updated.', { type: 'success' });
        loadUsers();
      })
      .fail(function () {
        CivicAPI.toast('Unable to update user.', { type: 'error' });
      });
  }

  function openUserDetail(userId) {
    CivicAPI.request({
      url: '/users/' + userId,
      method: 'GET'
    }).done(function (user) {
      var $backdrop = $('#modal-backdrop');
      var $panel = $('#modal-panel');
      $panel.html(
        '<header class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">' +
          '<div>' +
          '<h2 class="text-sm font-semibold text-slate-900">' +
          (user.full_name || 'User detail') +
          '</h2>' +
          '<p class="text-[11px] text-slate-500">' +
          (user.email || '') +
          '</p>' +
          '</div>' +
          '<button class="close-modal p-1.5 rounded-full hover:bg-slate-100" aria-label="Close">' +
          '<span data-feather="x" class="w-4 h-4 text-slate-500"></span>' +
          '</button>' +
          '</header>' +
          '<div class="px-5 py-4 space-y-3 text-xs text-slate-600">' +
          '<div class="flex items-center justify-between">' +
          '<span class="font-semibold text-slate-900">Role</span>' +
          '<span class="capitalize">' +
          (user.role || 'user') +
          '</span>' +
          '</div>' +
          '<div class="flex items-center justify-between">' +
          '<span class="font-semibold text-slate-900">Status</span>' +
          '<span>' +
          (user.is_active ? 'Active' : 'Inactive') +
          '</span>' +
          '</div>' +
          (user.phone
            ? '<div class="flex items-center justify-between"><span class="font-semibold text-slate-900">Phone</span><span>' +
              user.phone +
              '</span></div>'
            : '') +
          (user.created_at
            ? '<div class="flex items-center justify-between"><span class="font-semibold text-slate-900">Joined</span><span>' +
              new Date(user.created_at).toLocaleString() +
              '</span></div>'
            : '') +
          '</div>'
      );
      $backdrop.removeClass('hidden').attr('aria-hidden', 'false');
      if (window.feather) window.feather.replace();
    });
  }

  function bindAdminUsersHandlers($container) {
    $container.off('click', '#admin-users-refresh');
    $container.on('click', '#admin-users-refresh', function () {
      loadUsers();
    });

    $container.off(
      'input change',
      '#admin-users-search, #admin-users-role-filter, #admin-users-status-filter'
    );
    $container.on(
      'input change',
      '#admin-users-search, #admin-users-role-filter, #admin-users-status-filter',
      function () {
        renderUsersTable();
      }
    );

    $container.off('click', '.admin-toggle-user');
    $container.on('click', '.admin-toggle-user', function () {
      var id = $(this).data('id');
      var isActive = $(this).data('active');
      toggleUserStatus(id, isActive);
    });

    $container.off('click', '.admin-view-user');
    $container.on('click', '.admin-view-user', function () {
      openUserDetail($(this).data('id'));
    });
  }

  $(function () {
    if (!window.CivicRouter) return;
    CivicRouter.register('/admin/users', {
      requireAuth: true,
      adminOnly: true,
      render: function ($container) {
        renderAdminUsersPage($container);
      }
    });
  });
})(window, jQuery);


