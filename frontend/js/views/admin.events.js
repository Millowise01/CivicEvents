// Admin events management: list, create, edit, delete, and image upload.
// ROLE GUARD: Router registers this view as adminOnly; UI also hides entry points for non-admins.
(function (window, $) {
  'use strict';

  var eventsCache = [];

  function renderAdminEventsPage($container) {
    $container.html(
      '<div class="space-y-4">' +
        '<div class="flex items-center justify-between">' +
        '<div>' +
        '<h1 class="text-lg font-semibold text-slate-900">Manage events</h1>' +
        '<p class="text-xs text-slate-500">Create, publish and update events for the CivicEvents+ community.</p>' +
        '</div>' +
        '<button id="refresh-admin-events" class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">' +
        '<span data-feather="refresh-cw" class="w-3.5 h-3.5"></span>' +
        '<span>Refresh</span>' +
        '</button>' +
        '</div>' +
        '<div class="grid gap-4 lg:grid-cols-3">' +
        '<section class="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-4 space-y-3">' +
        '<div class="flex items-center justify-between text-xs text-slate-500">' +
        '<span>Showing latest events. Drafts are highlighted for quick editing.</span>' +
        '<div class="flex items-center gap-2">' +
        '<input id="admin-events-search" type="search" placeholder="Search title..." class="rounded-full border border-slate-200 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500" />' +
        '</div>' +
        '</div>' +
        '<div id="admin-events-list" class="space-y-2"></div>' +
        '</section>' +
        '<section class="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">' +
        '<div class="flex items-center justify-between">' +
        '<div>' +
        '<h2 id="admin-event-form-title" class="text-sm font-semibold text-slate-900">Create event</h2>' +
        '<p class="text-[11px] text-slate-500">Upload an image and publish when ready.</p>' +
        '</div>' +
        '<button id="admin-event-cancel-edit" class="hidden text-[11px] text-slate-500 hover:text-slate-700">Reset</button>' +
        '</div>' +
        '<form id="admin-event-form" class="space-y-3" novalidate>' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-event-title">Title</label>' +
        '<input id="admin-event-title" type="text" required class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />' +
        '</div>' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-event-description">Description</label>' +
        '<textarea id="admin-event-description" rows="3" required class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>' +
        '</div>' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-event-location">Location</label>' +
        '<input id="admin-event-location" type="text" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />' +
        '</div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-event-starts">Starts at</label>' +
        '<input id="admin-event-starts" type="datetime-local" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />' +
        '</div>' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-event-ends">Ends at</label>' +
        '<input id="admin-event-ends" type="datetime-local" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />' +
        '</div>' +
        '</div>' +
        '<div class="flex items-center justify-between text-xs">' +
        '<label class="inline-flex items-center gap-2 text-slate-600">' +
        '<input id="admin-event-published" type="checkbox" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />' +
        '<span>Published</span>' +
        '</label>' +
        '<span id="admin-event-status-label" class="text-[11px] text-slate-400">Draft</span>' +
        '</div>' +
        '<div class="space-y-1">' +
        '<label class="text-xs font-medium text-slate-600" for="admin-event-image">Event image</label>' +
        '<input id="admin-event-image" type="file" accept="image/*" class="block w-full text-xs text-slate-500 file:mr-2 file:rounded-full file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-indigo-700" />' +
        '<div id="admin-event-image-preview" class="mt-2 h-32 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400">No image selected</div>' +
        '</div>' +
        '<button id="admin-event-submit" type="submit" class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-2 hover:bg-indigo-700">' +
        '<span>Save event</span>' +
        '</button>' +
        '</form>' +
        '</section>' +
        '</div>' +
        '</div>'
    );

    loadAdminEvents();
    bindAdminEventHandlers($container);
  }

  function formatDateInput(value) {
    if (!value) return '';
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    var iso = date.toISOString();
    return iso.substring(0, 16);
  }

  function loadAdminEvents(searchTerm) {
    $('#admin-events-list').html(
      '<div class="h-24 rounded-xl border border-slate-100 bg-slate-50 animate-pulse"></div>'
    );
    CivicAPI.request({
      url: '/events',
      method: 'GET'
    }).done(function (data) {
      eventsCache = data.items || data.rows || data.data || data || [];
      renderAdminEventsList(searchTerm);
    });
  }

  function renderAdminEventsList(searchTerm) {
    var filtered = eventsCache;
    if (searchTerm) {
      var q = searchTerm.toLowerCase();
      filtered = eventsCache.filter(function (event) {
        return (event.title || '').toLowerCase().indexOf(q) !== -1;
      });
    }
    var $list = $('#admin-events-list');
    if (!filtered.length) {
      $list.html(
        '<p class="text-xs text-slate-500 text-center py-6 border border-dashed border-slate-200 rounded-xl">No events found.</p>'
      );
      return;
    }
    var cards = filtered
      .map(function (event) {
        var starts = event.starts_at
          ? new Date(event.starts_at).toLocaleString()
          : 'TBD';
        return (
          '<article class="border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3 ' +
          (event.published ? '' : 'bg-amber-50/40') +
          '">' +
          '<div class="min-w-0">' +
          '<p class="text-xs font-semibold text-slate-900 truncate">' +
          event.title +
          '</p>' +
          '<p class="text-[11px] text-slate-500">' +
          starts +
          '</p>' +
          '</div>' +
          '<div class="flex items-center gap-2 text-xs">' +
          '<span class="px-2 py-0.5 rounded-full border ' +
          (event.published
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-amber-200 bg-amber-50 text-amber-700') +
          '">' +
          (event.published ? 'Published' : 'Draft') +
          '</span>' +
          '<button class="admin-edit-event text-indigo-600 hover:text-indigo-700" data-id="' +
          event.id +
          '">Edit</button>' +
          '<button class="admin-delete-event text-rose-600 hover:text-rose-700" data-id="' +
          event.id +
          '">Delete</button>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');
    $list.html(cards);
  }

  function resetAdminEventForm() {
    var $form = $('#admin-event-form');
    $form[0].reset();
    $form.removeData('eventId');
    $('#admin-event-form-title').text('Create event');
    $('#admin-event-submit span').text('Save event');
    $('#admin-event-cancel-edit').addClass('hidden');
    $('#admin-event-status-label').text('Draft');
    $('#admin-event-image-preview')
      .text('No image selected')
      .removeClass('bg-cover')
      .css('background-image', 'none');
  }

  function populateAdminEventForm(eventId) {
    var event = eventsCache.find(function (item) {
      return String(item.id) === String(eventId);
    });
    if (!event) return;
    var $form = $('#admin-event-form');
    $form.data('eventId', event.id);
    $('#admin-event-form-title').text('Edit event');
    $('#admin-event-submit span').text('Update event');
    $('#admin-event-cancel-edit').removeClass('hidden');
    $('#admin-event-title').val(event.title || '');
    $('#admin-event-description').val(event.description || '');
    $('#admin-event-location').val(event.location || '');
    $('#admin-event-starts').val(formatDateInput(event.starts_at));
    $('#admin-event-ends').val(formatDateInput(event.ends_at));
    $('#admin-event-published')
      .prop('checked', !!event.published)
      .trigger('change');
    var image =
      (event.metadata && event.metadata.image_url) || event.image_url;
    if (image) {
      $('#admin-event-image-preview')
        .text('')
        .addClass('bg-cover')
        .css({
          backgroundImage: 'url(' + image + ')',
          backgroundPosition: 'center'
        });
    } else {
      $('#admin-event-image-preview')
        .text('No image selected')
        .removeClass('bg-cover')
        .css('background-image', 'none');
    }
  }

  function submitAdminEventForm(e) {
    e.preventDefault();
    var $form = $('#admin-event-form');
    var eventId = $form.data('eventId');
    var title = $('#admin-event-title').val().trim();
    var description = $('#admin-event-description').val().trim();
    if (!title || !description) {
      CivicAPI.toast('Title and description are required.', {
        type: 'warn'
      });
      return;
    }
    var formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('location', $('#admin-event-location').val().trim());
    formData.append('starts_at', $('#admin-event-starts').val());
    formData.append('ends_at', $('#admin-event-ends').val());
    formData.append('published', $('#admin-event-published').is(':checked'));
    var file = $('#admin-event-image')[0].files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        CivicAPI.toast('Please upload a valid image file.', {
          type: 'error'
        });
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        CivicAPI.toast('Image must be smaller than 4MB.', {
          type: 'warn'
        });
        return;
      }
      formData.append('image', file);
    }

    $('#admin-event-submit').prop('disabled', true).addClass('opacity-60');
    var url = eventId ? '/events/' + eventId : '/events';
    var method = eventId ? 'PUT' : 'POST';
    CivicAPI.upload({
      url: url,
      method: method,
      formData: formData
    })
      .done(function () {
        CivicAPI.toast(
          eventId ? 'Event updated successfully.' : 'Event created successfully.',
          { type: 'success' }
        );
        resetAdminEventForm();
        loadAdminEvents($('#admin-events-search').val());
      })
      .always(function () {
        $('#admin-event-submit').prop('disabled', false).removeClass('opacity-60');
      });
  }

  function deleteAdminEvent(eventId) {
    if (!window.confirm('Delete this event? This cannot be undone.')) {
      return;
    }
    CivicAPI.request({
      url: '/events/' + eventId,
      method: 'DELETE'
    }).done(function () {
      CivicAPI.toast('Event deleted.', { type: 'success' });
      loadAdminEvents($('#admin-events-search').val());
      resetAdminEventForm();
    });
  }

  function bindAdminEventHandlers($container) {
    $container.off('input', '#admin-events-search');
    $container.on('input', '#admin-events-search', function () {
      var term = $(this).val();
      renderAdminEventsList(term);
    });

    $container.off('click', '#refresh-admin-events');
    $container.on('click', '#refresh-admin-events', function () {
      loadAdminEvents($('#admin-events-search').val());
    });

    $container.off('change', '#admin-event-published');
    $container.on('change', '#admin-event-published', function () {
      $('#admin-event-status-label').text(
        $(this).is(':checked') ? 'Published' : 'Draft'
      );
    });

    $container.off('change', '#admin-event-image');
    $container.on('change', '#admin-event-image', function () {
      var file = this.files[0];
      if (!file) {
        $('#admin-event-image-preview')
          .text('No image selected')
          .removeClass('bg-cover')
          .css('background-image', 'none');
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        $('#admin-event-image-preview')
          .text('')
          .addClass('bg-cover')
          .css({
            backgroundImage: 'url(' + e.target.result + ')',
            backgroundPosition: 'center'
          });
      };
      reader.readAsDataURL(file);
    });

    $container.off('click', '.admin-edit-event');
    $container.on('click', '.admin-edit-event', function () {
      populateAdminEventForm($(this).data('id'));
    });

    $container.off('click', '.admin-delete-event');
    $container.on('click', '.admin-delete-event', function () {
      deleteAdminEvent($(this).data('id'));
    });

    $container.off('click', '#admin-event-cancel-edit');
    $container.on('click', '#admin-event-cancel-edit', function () {
      resetAdminEventForm();
    });

    $container.off('submit', '#admin-event-form');
    $container.on('submit', '#admin-event-form', submitAdminEventForm);
  }

  $(function () {
    if (!window.CivicRouter) return;
    CivicRouter.register('/admin/events', {
      requireAuth: true,
      adminOnly: true, // ROLE GUARD
      render: function ($container) {
        renderAdminEventsPage($container);
      }
    });
  });
})(window, jQuery);


