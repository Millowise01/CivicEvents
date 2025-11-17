// Announcements list & basic detail/audio playback.
// Admin-only controls (create/edit/delete) are guarded via role checks.
(function (window, $) {
  'use strict';

  function isAdmin() {
    return window.CivicAuth && window.CivicAuth.isAdmin();
  }

  function renderAnnouncementsList($container) {
    $container.html(
      '<div class="flex items-center justify-between mb-4">' +
        '<div>' +
        '<h1 class="text-lg font-semibold text-slate-900">Announcements</h1>' +
        '<p class="text-xs text-slate-500">Listen to audio announcements from your civic organization.</p>' +
        '</div>' +
        (isAdmin()
          ? '<button id="create-announcement-button" class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-indigo-700">' +
            '<span class="h-4 w-4 rounded-full border border-indigo-200 flex items-center justify-center text-[10px]">+</span>' +
            '<span>New announcement</span>' +
            '</button>'
          : '') +
        '</div>' +
        '<div id="announcements-list" class="space-y-3"></div>'
    );

    loadAnnouncements();
  }

  function buildAnnouncementItem(a) {
    var createdAt = a.created_at ? new Date(a.created_at) : null;
    var created = createdAt ? createdAt.toLocaleString() : '';
    var duration = a.duration_seconds
      ? Math.round(a.duration_seconds) + 's'
      : 'Unknown length';

    return (
      '<article class="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3">' +
      '<div class="h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">' +
      '<span data-feather="mic" class="w-4 h-4"></span>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
      '<h3 class="text-sm font-semibold text-slate-900 truncate">' +
      a.title +
      '</h3>' +
      '<p class="text-[11px] text-slate-500">' +
      duration +
      (created ? ' • ' + created : '') +
      '</p>' +
      '</div>' +
      '<div class="flex items-center gap-2 text-xs">' +
      '<button class="play-announcement px-2 py-1 rounded-full border border-slate-200 hover:bg-slate-50" data-id="' +
      a.id +
      '">Play</button>' +
      (isAdmin()
        ? '<button class="delete-announcement text-rose-600 hover:text-rose-700" data-id="' +
          a.id +
          '">Delete</button>'
        : '') +
      '</div>' +
      '</article>'
    );
  }

  function loadAnnouncements() {
    CivicAPI.request({
      url: '/announcements?published=true',
      method: 'GET'
    }).done(function (data) {
      var items = data.items || data.rows || data.data || data;
      var $list = $('#announcements-list');
      if (!items || !items.length) {
        $list.html(
          '<p class="text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">No announcements available.</p>'
        );
        return;
      }
      $list.html(items.map(buildAnnouncementItem).join(''));
      if (window.feather) window.feather.replace();
    });
  }

  function openAnnouncementDetail(id) {
    CivicAPI.request({
      url: '/announcements/' + id,
      method: 'GET'
    }).done(function (a) {
      var $backdrop = $('#modal-backdrop');
      var $panel = $('#modal-panel');
      var created = a.created_at ? new Date(a.created_at).toLocaleString() : '';
      var transcript = a.transcript || a.description;

      $panel.html(
        '<header class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">' +
          '<div>' +
          '<h2 class="text-sm font-semibold text-slate-900">Announcement</h2>' +
          '<p class="text-[11px] text-slate-500">' +
          created +
          '</p>' +
          '</div>' +
          '<button class="close-modal p-1.5 rounded-full hover:bg-slate-100" aria-label="Close">' +
          '<span data-feather="x" class="w-4 h-4 text-slate-500"></span>' +
          '</button>' +
          '</header>' +
          '<div class="px-5 py-4 space-y-4">' +
          '<div>' +
          '<h3 class="text-base font-semibold text-slate-900 mb-1">' +
          a.title +
          '</h3>' +
          '<p class="text-[11px] text-slate-500 mb-2">Audio announcement</p>' +
          '<audio controls class="w-full mt-2" aria-label="Audio announcement player">' +
          (a.audio_url
            ? '<source src="' +
              a.audio_url +
              '" type="audio/mpeg" />'
            : '') +
          'Your browser does not support the audio element.' +
          '</audio>' +
          '</div>' +
          (transcript
            ? '<section class="mt-4">' +
              '<h4 class="text-xs font-semibold text-slate-800 mb-1">Transcript</h4>' +
              '<p class="text-xs text-slate-600 whitespace-pre-line">' +
              transcript +
              '</p>' +
              '</section>'
            : '') +
          '</div>'
      );

      $backdrop.removeClass('hidden').attr('aria-hidden', 'false');
      if (window.feather) window.feather.replace();
    });
  }

  function bindAnnouncementsHandlers($container) {
    $container.on('click', '.play-announcement', function () {
      var id = $(this).data('id');
      openAnnouncementDetail(id);
    });
  }

  $(function () {
    if (!window.CivicRouter) return;
    CivicRouter.register('/announcements', {
      requireAuth: true,
      adminOnly: false,
      render: function ($container) {
        renderAnnouncementsList($container);
        bindAnnouncementsHandlers($container);
      }
    });
  });
})(window, jQuery);


