// Profile page: view & update current user (excluding role and is_active).
// Admin user management lives in a different admin view.
(function (window, $) {
  'use strict';

  function renderProfile($container) {
    var auth = CivicAuth.getState();
    var user = auth.user || {};
    $container.html(
      '<div class="mb-4">' +
        '<h1 class="text-lg font-semibold text-slate-900">My profile</h1>' +
        '<p class="text-xs text-slate-500">Manage your basic account information. Role and status are managed by administrators.</p>' +
        '</div>' +
        '<form id="profile-form" class="bg-white border border-slate-100 rounded-xl p-4 space-y-4 max-w-lg" novalidate>' +
        '<div class="flex items-center gap-3">' +
        '<div class="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">' +
        (user.full_name || user.email || '?')
          .split(' ')
          .map(function (p) {
            return p.charAt(0).toUpperCase();
          })
          .slice(0, 2)
          .join('') +
        '</div>' +
        '<div>' +
        '<p class="text-sm font-semibold text-slate-900">' +
        (user.full_name || '') +
        '</p>' +
        '<p class="text-[11px] text-slate-500 capitalize">' +
        (user.role || '') +
        (user.is_active === false
          ? ' • inactive'
          : user.is_active === true
          ? ' • active'
          : '') +
        '</p>' +
        '</div>' +
        '</div>' +
        '<div class="grid grid-cols-1 gap-4">' +
        '<div class="space-y-1.5">' +
        '<label class="text-xs font-medium text-slate-700" for="profile-full-name">Full name</label>' +
        '<input id="profile-full-name" type="text" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value="' +
        (user.full_name || '') +
        '" />' +
        '</div>' +
        '<div class="space-y-1.5">' +
        '<label class="text-xs font-medium text-slate-700" for="profile-email">Email</label>' +
        '<input id="profile-email" type="email" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value="' +
        (user.email || '') +
        '" />' +
        '</div>' +
        '<div class="space-y-1.5">' +
        '<label class="text-xs font-medium text-slate-700">Role</label>' +
        '<input type="text" disabled class="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500" value="' +
        (user.role || '') +
        ' (managed by admin)" />' +
        '</div>' +
        '</div>' +
        '<div class="flex items-center justify-between pt-2">' +
        '<p class="text-[11px] text-slate-500">To deactivate your account or change your role, please contact an administrator.</p>' +
        '<button type="submit" class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-indigo-700">' +
        '<span>Save changes</span>' +
        '</button>' +
        '</div>' +
        '</form>'
    );

    $('#profile-form').on('submit', function (e) {
      e.preventDefault();
      var fullName = $('#profile-full-name').val().trim();
      var email = $('#profile-email').val().trim();
      if (!fullName || !email) {
        CivicAPI.toast('Full name and email are required.', { type: 'warn' });
        return;
      }

      var current = CivicAuth.getState().user;
      CivicAPI.request({
        url: '/users/me',
        method: 'PATCH',
        data: {
          full_name: fullName,
          email: email
        }
      })
        .done(function (updated) {
          // Update local auth user
          CivicAuth.setAuth(
            {
              token: CivicAuth.getToken(),
              user: $.extend({}, current, {
                full_name: updated.full_name || fullName,
                email: updated.email || email
              })
            },
            {
              persistent: CivicAuth.getState().persistent
            }
          );
          CivicAPI.toast('Profile updated successfully.', {
            type: 'success'
          });
        })
        .fail(function (err) {
          if (err.status === 409) {
            CivicAPI.toast(
              'That email address is already in use. Please use a different one.',
              { type: 'error' }
            );
          }
        });
    });
  }

  $(function () {
    if (!window.CivicRouter) return;
    CivicRouter.register('/profile', {
      requireAuth: true,
      adminOnly: false,
      render: function ($container) {
        renderProfile($container);
      }
    });
  });
})(window, jQuery);


