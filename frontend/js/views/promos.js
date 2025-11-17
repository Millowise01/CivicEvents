// Promos (video + captions) list and basic detail playback.
// Admin-only CRUD will be implemented in admin views; here we focus on list & detail UX.
(function (window, $) {
  'use strict';

  function renderPromosList($container) {
    $container.html(
      '<div class="flex items-center justify-between mb-4">' +
        '<div>' +
        '<h1 class="text-lg font-semibold text-slate-900">Promos</h1>' +
        '<p class="text-xs text-slate-500">Watch short video promos about civic initiatives.</p>' +
        '</div>' +
        '</div>' +
        '<div id="promos-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>'
    );

    CivicAPI.request({
      url: '/promos?published=true',
      method: 'GET'
    }).done(function (data) {
      var items = data.items || data.rows || data.data || data;
      var $list = $('#promos-list');
      if (!items || !items.length) {
        $list.html(
          '<p class="text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center col-span-full">No promos available yet.</p>'
        );
        return;
      }

      var cards = items
        .map(function (p) {
          return (
            '<article class="bg-white border border-slate-100 rounded-xl overflow-hidden flex flex-col">' +
            '<div class="relative h-40 bg-slate-900">' +
            (p.thumbnail_url
              ? '<img src="' +
                p.thumbnail_url +
                '" alt="Promo video thumbnail" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />'
              : '') +
            '<button class="play-promo absolute inset-0 flex items-center justify-center" data-id="' +
            p.id +
            '" aria-label="Play promo">' +
            '<span class="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/90 text-slate-900 shadow-lg">' +
            '<span data-feather="play" class="w-4 h-4"></span>' +
            '</span>' +
            '</button>' +
            '</div>' +
            '<div class="p-3 flex-1 flex flex-col gap-1">' +
            '<h3 class="text-sm font-semibold text-slate-900 line-clamp-2">' +
            p.title +
            '</h3>' +
            '<p class="text-xs text-slate-600 line-clamp-3">' +
            (p.description || '') +
            '</p>' +
            '</div>' +
            '</article>'
          );
        })
        .join('');
      $list.html(cards);
      if (window.feather) window.feather.replace();
    });
  }

  function openPromoDetail(id) {
    CivicAPI.request({
      url: '/promos/' + id,
      method: 'GET'
    }).done(function (p) {
      var $backdrop = $('#modal-backdrop');
      var $panel = $('#modal-panel');

      $panel.html(
        '<header class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">' +
          '<div>' +
          '<h2 class="text-sm font-semibold text-slate-900">Promo video</h2>' +
          '<p class="text-[11px] text-slate-500">Captions available when provided.</p>' +
          '</div>' +
          '<button class="close-modal p-1.5 rounded-full hover:bg-slate-100" aria-label="Close">' +
          '<span data-feather="x" class="w-4 h-4 text-slate-500"></span>' +
          '</button>' +
          '</header>' +
          '<div class="px-5 py-4 space-y-4">' +
          '<div class="aspect-video bg-black rounded-xl overflow-hidden">' +
          '<video controls class="w-full h-full" preload="metadata">' +
          (p.video_url
            ? '<source src="' +
              p.video_url +
              '" type="video/mp4" />'
            : '') +
          (p.caption_url
            ? '<track kind="captions" src="' +
              p.caption_url +
              '" srclang="en" label="English" default />'
            : '') +
          'Your browser does not support the video tag.' +
          '</video>' +
          '</div>' +
          '<div>' +
          '<h3 class="text-base font-semibold text-slate-900 mb-1">' +
          p.title +
          '</h3>' +
          (p.description
            ? '<p class="text-xs text-slate-600 whitespace-pre-line">' +
              p.description +
              '</p>'
            : '') +
          '</div>' +
          '</div>'
      );

      $backdrop.removeClass('hidden').attr('aria-hidden', 'false');
      if (window.feather) window.feather.replace();
    });
  }

  function bindPromosHandlers($container) {
    $container.on('click', '.play-promo', function () {
      var id = $(this).data('id');
      openPromoDetail(id);
    });
  }

  $(function () {
    if (!window.CivicRouter) return;
    CivicRouter.register('/promos', {
      requireAuth: true,
      adminOnly: false,
      render: function ($container) {
        renderPromosList($container);
        bindPromosHandlers($container);
      }
    });
  });
})(window, jQuery);


