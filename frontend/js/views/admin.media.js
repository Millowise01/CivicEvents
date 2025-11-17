// Admin media management for announcements (audio) and promos (video).
// ROLE GUARD: Both routes are registered as adminOnly in the router.
(function (window, $) {
  'use strict';

  var announcementsCache = [];
  var promosCache = [];

  function renderAdminAnnouncements($container) {
    $container.html(
      '<div class="space-y-4">' +
        '<div>' +
        '<h1 class="text-lg font-semibold text-slate-900">Audio announcements</h1>' +
        '<p class="text-xs text-slate-500">Upload short audio clips to broadcast civic updates. Accessible players are generated automatically.</p>' +
        '</div>' +
        '<div class="grid gap-4 lg:grid-cols-3">' +
        '<section class="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-4 space-y-3">' +
        '<div class="flex items-center justify-between text-xs text-slate-500">' +
        '<span>Keep recordings under 2 minutes for clarity.</span>' +
        '<button id="refresh-admin-announcements" class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs hover:bg-slate-50">' +
        '<span data-feather="refresh-cw" class="w-3.5 h-3.5"></span>' +
        '<span>Refresh</span>' +
        '</button>' +
        '</div>' +
        '<div id="admin-announcements-list" class="space-y-2"></div>' +
        '</section>' +
        '<section class="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">' +
        '<div class="flex items-center justify-between">' +
        '<div>' +
        '<h2 id="admin-announcement-form-title" class="text-sm font-semibold text-slate-900">Create announcement</h2>' +
        '<p class="text-[11px] text-slate-500">Upload audio (MP3/WAV) and choose whether to publish immediately.</p>' +
        '</div>' +
        '<button id="admin-announcement-cancel-edit" class="hidden text-[11px] text-slate-500 hover:text-slate-700">Reset</button>' +
        '</div>' +
        '<form id="admin-announcement-form" class="space-y-3" novalidate>' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-announcement-title">Title</label>' +
        '<input id="admin-announcement-title" type="text" required class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />' +
        '</div>' +
        '<label class="inline-flex items-center gap-2 text-xs text-slate-600">' +
        '<input id="admin-announcement-published" type="checkbox" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />' +
        '<span>Published</span>' +
        '</label>' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-announcement-audio">Audio file</label>' +
        '<input id="admin-announcement-audio" type="file" accept="audio/*" class="block w-full text-xs text-slate-500 file:mr-2 file:rounded-full file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-indigo-700" />' +
        '<div id="admin-announcement-audio-name" class="text-[11px] text-slate-400">No file selected</div>' +
        '</div>' +
        '<button id="admin-announcement-submit" type="submit" class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-2 hover:bg-indigo-700">' +
        '<span>Save announcement</span>' +
        '</button>' +
        '</form>' +
        '</section>' +
        '</div>' +
        '</div>'
    );

    loadAdminAnnouncements();
    bindAdminAnnouncementsHandlers($container);
  }

  function renderAdminPromos($container) {
    $container.html(
      '<div class="space-y-4">' +
        '<div>' +
        '<h1 class="text-lg font-semibold text-slate-900">Video promos</h1>' +
        '<p class="text-xs text-slate-500">Share short promo videos with captions for accessibility.</p>' +
        '</div>' +
        '<div class="grid gap-4 lg:grid-cols-3">' +
        '<section class="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-4 space-y-3">' +
        '<div class="flex items-center justify-between text-xs text-slate-500">' +
        '<span>Recommended: MP4, under 200MB.</span>' +
        '<button id="refresh-admin-promos" class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs hover:bg-slate-50">' +
        '<span data-feather="refresh-cw" class="w-3.5 h-3.5"></span>' +
        '<span>Refresh</span>' +
        '</button>' +
        '</div>' +
        '<div id="admin-promos-list" class="space-y-2"></div>' +
        '</section>' +
        '<section class="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">' +
        '<div class="flex items-center justify-between">' +
        '<div>' +
        '<h2 id="admin-promo-form-title" class="text-sm font-semibold text-slate-900">Create promo</h2>' +
        '<p class="text-[11px] text-slate-500">Upload a video and optional caption text file.</p>' +
        '</div>' +
        '<button id="admin-promo-cancel-edit" class="hidden text-[11px] text-slate-500 hover:text-slate-700">Reset</button>' +
        '</div>' +
        '<form id="admin-promo-form" class="space-y-3" novalidate>' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-promo-title">Title</label>' +
        '<input id="admin-promo-title" type="text" required class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />' +
        '</div>' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-promo-description">Description</label>' +
        '<textarea id="admin-promo-description" rows="3" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>' +
        '</div>' +
        '<label class="inline-flex items-center gap-2 text-xs text-slate-600">' +
        '<input id="admin-promo-published" type="checkbox" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />' +
        '<span>Published</span>' +
        '</label>' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-promo-video">Video file</label>' +
        '<input id="admin-promo-video" type="file" accept="video/*" class="block w-full text-xs text-slate-500 file:mr-2 file:rounded-full file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-indigo-700" />' +
        '<div id="admin-promo-video-name" class="text-[11px] text-slate-400">No file selected</div>' +
        '</div>' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-promo-caption">Caption text (WebVTT)</label>' +
        '<textarea id="admin-promo-caption" rows="3" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="WEBVTT\n\n00:00.000 --> 00:04.000\nWelcome to CivicEvents+"></textarea>' +
        '</div>' +
        '<button id="admin-promo-submit" type="submit" class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-2 hover:bg-indigo-700">' +
        '<span>Save promo</span>' +
        '</button>' +
        '</form>' +
        '</section>' +
        '</div>' +
        '</div>'
    );

    loadAdminPromos();
    bindAdminPromosHandlers($container);
  }

  /* ---------------- Announcements ---------------- */

  function loadAdminAnnouncements() {
    $('#admin-announcements-list').html(
      '<div class="h-20 rounded-xl border border-slate-100 bg-slate-50 animate-pulse"></div>'
    );
    CivicAPI.request({
      url: '/announcements',
      method: 'GET'
    }).done(function (data) {
      announcementsCache =
        data.items || data.rows || data.data || data || [];
      renderAdminAnnouncementsList();
    });
  }

  function renderAdminAnnouncementsList() {
    var $list = $('#admin-announcements-list');
    if (!announcementsCache.length) {
      $list.html(
        '<p class="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-xl">No announcements yet.</p>'
      );
      return;
    }
    var items = announcementsCache
      .map(function (a) {
        var created = a.created_at
          ? new Date(a.created_at).toLocaleString()
          : '';
        return (
          '<article class="border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3 ' +
          (a.published ? '' : 'bg-amber-50/40') +
          '">' +
          '<div class="min-w-0">' +
          '<p class="text-xs font-semibold text-slate-900 truncate">' +
          a.title +
          '</p>' +
          '<p class="text-[11px] text-slate-500">' +
          created +
          '</p>' +
          '</div>' +
          '<div class="flex items-center gap-2 text-xs">' +
          '<span class="px-2 py-0.5 rounded-full border ' +
          (a.published
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-amber-200 bg-amber-50 text-amber-700') +
          '">' +
          (a.published ? 'Published' : 'Draft') +
          '</span>' +
          '<button class="admin-edit-announcement text-indigo-600 hover:text-indigo-700" data-id="' +
          a.id +
          '">Edit</button>' +
          '<button class="admin-delete-announcement text-rose-600 hover:text-rose-700" data-id="' +
          a.id +
          '">Delete</button>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');
    $list.html(items);
  }

  function resetAnnouncementForm() {
    var $form = $('#admin-announcement-form');
    $form[0].reset();
    $form.removeData('announcementId');
    $('#admin-announcement-form-title').text('Create announcement');
    $('#admin-announcement-submit span').text('Save announcement');
    $('#admin-announcement-cancel-edit').addClass('hidden');
    $('#admin-announcement-audio-name').text('No file selected');
  }

  function populateAnnouncementForm(id) {
    var announcement = announcementsCache.find(function (item) {
      return String(item.id) === String(id);
    });
    if (!announcement) return;
    var $form = $('#admin-announcement-form');
    $form.data('announcementId', announcement.id);
    $('#admin-announcement-form-title').text('Edit announcement');
    $('#admin-announcement-submit span').text('Update announcement');
    $('#admin-announcement-cancel-edit').removeClass('hidden');
    $('#admin-announcement-title').val(announcement.title || '');
    $('#admin-announcement-published').prop(
      'checked',
      !!announcement.published
    );
    var audioLabel = announcement.audio_url
      ? 'Current file attached'
      : 'No file selected';
    $('#admin-announcement-audio-name').text(audioLabel);
  }

  function submitAnnouncementForm(e) {
    e.preventDefault();
    var $form = $('#admin-announcement-form');
    var announcementId = $form.data('announcementId');
    var title = $('#admin-announcement-title').val().trim();
    if (!title) {
      CivicAPI.toast('Title is required.', { type: 'warn' });
      return;
    }
    var formData = new FormData();
    formData.append('title', title);
    formData.append(
      'published',
      $('#admin-announcement-published').is(':checked')
    );
    var file = $('#admin-announcement-audio')[0].files[0];
    if (!announcementId && !file) {
      CivicAPI.toast('Select an audio file to upload.', {
        type: 'warn'
      });
      return;
    }
    if (file) {
      if (!file.type.startsWith('audio/')) {
        CivicAPI.toast('Upload a valid audio file (mp3, wav, etc).', {
          type: 'error'
        });
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        CivicAPI.toast('Audio file must be under 15MB.', {
          type: 'warn'
        });
        return;
      }
      formData.append('audio', file);
    }

    $('#admin-announcement-submit').prop('disabled', true).addClass('opacity-60');
    CivicAPI.upload({
      url: announcementId ? '/announcements/' + announcementId : '/announcements',
      method: announcementId ? 'PUT' : 'POST',
      formData: formData
    })
      .done(function () {
        CivicAPI.toast(
          announcementId
            ? 'Announcement updated.'
            : 'Announcement created.',
          { type: 'success' }
        );
        resetAnnouncementForm();
        loadAdminAnnouncements();
      })
      .always(function () {
        $('#admin-announcement-submit')
          .prop('disabled', false)
          .removeClass('opacity-60');
      });
  }

  function deleteAnnouncement(id) {
    if (!window.confirm('Delete this announcement?')) return;
    CivicAPI.request({
      url: '/announcements/' + id,
      method: 'DELETE'
    }).done(function () {
      CivicAPI.toast('Announcement deleted.', { type: 'success' });
      loadAdminAnnouncements();
      resetAnnouncementForm();
    });
  }

  function bindAdminAnnouncementsHandlers($container) {
    $container.off('click', '#refresh-admin-announcements');
    $container.on('click', '#refresh-admin-announcements', loadAdminAnnouncements);

    $container.off('change', '#admin-announcement-audio');
    $container.on('change', '#admin-announcement-audio', function () {
      var file = this.files[0];
      $('#admin-announcement-audio-name').text(
        file ? file.name : 'No file selected'
      );
    });

    $container.off('click', '.admin-edit-announcement');
    $container.on('click', '.admin-edit-announcement', function () {
      populateAnnouncementForm($(this).data('id'));
    });

    $container.off('click', '.admin-delete-announcement');
    $container.on('click', '.admin-delete-announcement', function () {
      deleteAnnouncement($(this).data('id'));
    });

    $container.off('click', '#admin-announcement-cancel-edit');
    $container.on('click', '#admin-announcement-cancel-edit', function () {
      resetAnnouncementForm();
    });

    $container.off('submit', '#admin-announcement-form');
    $container.on('submit', '#admin-announcement-form', submitAnnouncementForm);
  }

  /* ---------------- Promos ---------------- */

  function loadAdminPromos() {
    $('#admin-promos-list').html(
      '<div class="h-20 rounded-xl border border-slate-100 bg-slate-50 animate-pulse"></div>'
    );
    CivicAPI.request({
      url: '/promos',
      method: 'GET'
    }).done(function (data) {
      promosCache = data.items || data.rows || data.data || data || [];
      renderAdminPromosList();
    });
  }

  function renderAdminPromosList() {
    var $list = $('#admin-promos-list');
    if (!promosCache.length) {
      $list.html(
        '<p class="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-xl">No promos yet.</p>'
      );
      return;
    }
    var cards = promosCache
      .map(function (p) {
        return (
          '<article class="border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3 ' +
          (p.published ? '' : 'bg-amber-50/40') +
          '">' +
          '<div class="min-w-0">' +
          '<p class="text-xs font-semibold text-slate-900 truncate">' +
          p.title +
          '</p>' +
          '<p class="text-[11px] text-slate-500">' +
          (p.description || 'No description') +
          '</p>' +
          '</div>' +
          '<div class="flex items-center gap-2 text-xs">' +
          '<span class="px-2 py-0.5 rounded-full border ' +
          (p.published
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-amber-200 bg-amber-50 text-amber-700') +
          '">' +
          (p.published ? 'Published' : 'Draft') +
          '</span>' +
          '<button class="admin-edit-promo text-indigo-600 hover:text-indigo-700" data-id="' +
          p.id +
          '">Edit</button>' +
          '<button class="admin-delete-promo text-rose-600 hover:text-rose-700" data-id="' +
          p.id +
          '">Delete</button>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');
    $list.html(cards);
  }

  function resetPromoForm() {
    var $form = $('#admin-promo-form');
    $form[0].reset();
    $form.removeData('promoId');
    $('#admin-promo-form-title').text('Create promo');
    $('#admin-promo-submit span').text('Save promo');
    $('#admin-promo-cancel-edit').addClass('hidden');
    $('#admin-promo-video-name').text('No file selected');
  }

  function populatePromoForm(id) {
    var promo = promosCache.find(function (item) {
      return String(item.id) === String(id);
    });
    if (!promo) return;
    var $form = $('#admin-promo-form');
    $form.data('promoId', promo.id);
    $('#admin-promo-form-title').text('Edit promo');
    $('#admin-promo-submit span').text('Update promo');
    $('#admin-promo-cancel-edit').removeClass('hidden');
    $('#admin-promo-title').val(promo.title || '');
    $('#admin-promo-description').val(promo.description || '');
    $('#admin-promo-caption').val(promo.caption_text || '');
    $('#admin-promo-published').prop('checked', !!promo.published);
    $('#admin-promo-video-name').text(
      promo.video_url ? 'Current video uploaded' : 'No file selected'
    );
  }

  function submitPromoForm(e) {
    e.preventDefault();
    var $form = $('#admin-promo-form');
    var promoId = $form.data('promoId');
    var title = $('#admin-promo-title').val().trim();
    if (!title) {
      CivicAPI.toast('Title is required.', { type: 'warn' });
      return;
    }
    var formData = new FormData();
    formData.append('title', title);
    formData.append(
      'description',
      $('#admin-promo-description').val().trim()
    );
    formData.append(
      'caption_text',
      $('#admin-promo-caption').val().trim()
    );
    formData.append(
      'published',
      $('#admin-promo-published').is(':checked')
    );
    var file = $('#admin-promo-video')[0].files[0];
    if (!promoId && !file) {
      CivicAPI.toast('Select a video to upload.', { type: 'warn' });
      return;
    }
    if (file) {
      if (!file.type.startsWith('video/')) {
        CivicAPI.toast('Upload a valid video file (mp4, mov, etc).', {
          type: 'error'
        });
        return;
      }
      if (file.size > 200 * 1024 * 1024) {
        CivicAPI.toast('Video must be under 200MB.', {
          type: 'warn'
        });
        return;
      }
      formData.append('video', file);
    }

    $('#admin-promo-submit').prop('disabled', true).addClass('opacity-60');
    CivicAPI.upload({
      url: promoId ? '/promos/' + promoId : '/promos',
      method: promoId ? 'PUT' : 'POST',
      formData: formData
    })
      .done(function () {
        CivicAPI.toast(
          promoId ? 'Promo updated.' : 'Promo created.',
          { type: 'success' }
        );
        resetPromoForm();
        loadAdminPromos();
      })
      .always(function () {
        $('#admin-promo-submit').prop('disabled', false).removeClass('opacity-60');
      });
  }

  function deletePromo(id) {
    if (!window.confirm('Delete this promo?')) return;
    CivicAPI.request({
      url: '/promos/' + id,
      method: 'DELETE'
    }).done(function () {
      CivicAPI.toast('Promo deleted.', { type: 'success' });
      loadAdminPromos();
      resetPromoForm();
    });
  }

  function bindAdminPromosHandlers($container) {
    $container.off('click', '#refresh-admin-promos');
    $container.on('click', '#refresh-admin-promos', loadAdminPromos);

    $container.off('change', '#admin-promo-video');
    $container.on('change', '#admin-promo-video', function () {
      var file = this.files[0];
      $('#admin-promo-video-name').text(file ? file.name : 'No file selected');
    });

    $container.off('click', '.admin-edit-promo');
    $container.on('click', '.admin-edit-promo', function () {
      populatePromoForm($(this).data('id'));
    });

    $container.off('click', '.admin-delete-promo');
    $container.on('click', '.admin-delete-promo', function () {
      deletePromo($(this).data('id'));
    });

    $container.off('click', '#admin-promo-cancel-edit');
    $container.on('click', '#admin-promo-cancel-edit', function () {
      resetPromoForm();
    });

    $container.off('submit', '#admin-promo-form');
    $container.on('submit', '#admin-promo-form', submitPromoForm);
  }

  $(function () {
    if (!window.CivicRouter) return;
    CivicRouter.register('/admin/announcements', {
      requireAuth: true,
      adminOnly: true,
      render: function ($container) {
        renderAdminAnnouncements($container);
      }
    });
    CivicRouter.register('/admin/promos', {
      requireAuth: true,
      adminOnly: true,
      render: function ($container) {
        renderAdminPromos($container);
      }
    });
  });
})(window, jQuery);


