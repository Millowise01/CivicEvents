// Events list, detail, registration and admin CRUD UI.
// Role-based guards in this module hide admin-only controls when user is not admin.
(function (window, $) {
  'use strict';

  function isAdmin() {
    return window.CivicAuth && window.CivicAuth.isAdmin();
  }

  function isAuthenticated() {
    return window.CivicAuth && window.CivicAuth.isAuthenticated();
  }

  function renderStars(rating) {
    var full = Math.round(rating);
    var stars = '';
    for (var i = 1; i <= 5; i++) {
      stars +=
        '<span class="' +
        (i <= full ? 'text-amber-400' : 'text-slate-200') +
        '">★</span>';
    }
    return '<span class="text-[11px] font-semibold">' + stars + '</span>';
  }

  function renderSkeletonList($container) {
    var skeleton =
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">' +
      new Array(6)
        .fill(
          '<div class="animate-pulse bg-white border border-slate-100 rounded-xl p-4 space-y-3">' +
            '<div class="h-32 bg-slate-100 rounded-lg"></div>' +
            '<div class="h-4 bg-slate-100 rounded w-2/3"></div>' +
            '<div class="h-3 bg-slate-100 rounded w-1/2"></div>' +
            '<div class="h-3 bg-slate-100 rounded w-1/3"></div>' +
          '</div>'
        )
        .join('') +
      '</div>';
    $container.html(skeleton);
  }

  function buildEventCard(event) {
    var date = event.starts_at ? new Date(event.starts_at) : null;
    var dateLabel = date ? date.toLocaleString() : 'TBA';
    var img = event.metadata && event.metadata.image_url;
    var isPublished = event.published;

    var actions = [
      '<button class="view-event text-xs font-medium text-indigo-600 hover:text-indigo-700" data-id="' +
        event.id +
        '">View</button>'
    ];

    if (!isAdmin()) {
      actions.push(
        '<button class="register-event text-xs font-medium text-slate-700 hover:text-slate-900" data-id="' +
          event.id +
          '">Register</button>'
      );
    } else {
      actions.push(
        '<button class="edit-event text-xs font-medium text-slate-700 hover:text-slate-900" data-id="' +
          event.id +
          '">Edit</button>'
      );
      actions.push(
        '<button class="delete-event text-xs font-medium text-rose-600 hover:text-rose-700" data-id="' +
          event.id +
          '">Delete</button>'
      );
    }

    return (
      '<article class="bg-white border border-slate-100 rounded-xl overflow-hidden flex flex-col">' +
      (img
        ? '<img src="' +
          img +
          '" alt="Cover image for ' +
          (event.title || 'event') +
          '" class="h-32 w-full object-cover" loading="lazy" />'
        : '<div class="h-32 w-full bg-gradient-to-br from-indigo-50 to-sky-50 flex items-center justify-center text-[11px] text-slate-500">No image</div>') +
      '<div class="p-4 flex flex-col gap-2 flex-1">' +
      '<div class="flex items-start justify-between gap-2">' +
      '<div>' +
      '<h3 class="text-sm font-semibold text-slate-900 line-clamp-2">' +
      event.title +
      '</h3>' +
      '<p class="text-[11px] text-slate-500 mt-1">' +
      dateLabel +
      ' • ' +
      (event.location || 'Location TBA') +
      '</p>' +
      '</div>' +
      (isAdmin()
        ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ' +
          (isPublished
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : 'bg-amber-50 text-amber-700 border border-amber-100') +
          '">' +
          (isPublished ? 'Published' : 'Draft') +
          '</span>'
        : '') +
      '</div>' +
      '<p class="text-xs text-slate-600 line-clamp-3">' +
      (event.description || '') +
      '</p>' +
      '</div>' +
      '<div class="px-4 pb-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2">' +
      '<div class="flex items-center gap-1 text-[11px] text-slate-400">' +
      '<span class="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400"></span>' +
      '<span>' +
      (event.category || 'Community') +
      '</span>' +
      '</div>' +
      '<div class="flex items-center gap-3">' +
      actions.join('') +
      '</div>' +
      '</div>' +
      '</article>'
    );
  }

  function renderList($container) {
    var header =
      '<div class="flex items-center justify-between mb-4">' +
      '<div>' +
      '<h1 class="text-lg font-semibold text-slate-900">Events</h1>' +
      '<p class="text-xs text-slate-500">Discover upcoming civic events you can attend or help organize.</p>' +
      '</div>' +
      (isAdmin()
        ? '<button id="create-event-button" class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-indigo-700">' +
          '<span class="h-4 w-4 rounded-full border border-indigo-200 flex items-center justify-center text-[10px]">+</span>' +
          '<span>New event</span>' +
          '</button>'
        : '') +
      '</div>' +
      '<div class="mb-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">' +
      '<div class="flex items-center gap-2 text-[11px] text-slate-500">' +
      '<span>Showing upcoming events. Use filters to narrow down.</span>' +
      '</div>' +
      '<div class="flex items-center gap-2 text-xs">' +
      '<input id="events-filter-location" type="text" placeholder="Filter by location" class="rounded-full border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />' +
      '<input id="events-filter-date" type="date" class="rounded-full border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />' +
      '</div>' +
      '</div>' +
      '<div id="events-list"></div>' +
      '<div id="events-pagination" class="mt-4 flex items-center justify-between text-xs text-slate-500"></div>';

    $container.html(header);
    renderSkeletonList($('#events-list'));

    loadEvents({ page: 1 });
  }

  function loadEvents(params) {
    params = params || {};
    var page = params.page || 1;
    var filters = {};
    var location = $('#events-filter-location').val();
    var date = $('#events-filter-date').val();
    if (location) filters.location = location;
    if (date) filters.date = date;

    var query = $.param(
      $.extend(
        {
          page: page,
          pageSize: 9
        },
        filters
      )
    );

    var url = '/events';
    if (!isAdmin()) {
      url += '?published=true&' + query;
    } else {
      url += '?' + query;
    }

    CivicAPI.request({ url: url, method: 'GET' }).done(function (data) {
      var items = data.items || data.rows || data.data || data;
      var meta = data.meta || data.pagination || {};
      var $list = $('#events-list');

      if (!items || !items.length) {
        $list.html(
          '<p class="text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">No events found. ' +
            (isAdmin()
              ? 'Create a new event to get started.'
              : 'Check back later or adjust your filters.') +
            '</p>'
        );
      } else {
        var cards = items.map(buildEventCard).join('');
        $list.html(
          '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">' +
            cards +
            '</div>'
        );
      }

      // Pagination
      var currentPage = meta.page || page;
      var totalPages = meta.totalPages || meta.total_pages || 1;
      var totalItems = meta.total || items.length;
      var $pagination = $('#events-pagination');
      if (totalPages <= 1) {
        $pagination.empty();
        return;
      }
      var prevDisabled = currentPage <= 1 ? 'opacity-50 pointer-events-none' : '';
      var nextDisabled =
        currentPage >= totalPages ? 'opacity-50 pointer-events-none' : '';
      $pagination.html(
        '<button class="events-page-prev px-2 py-1 rounded border border-slate-200 ' +
          prevDisabled +
          '">Previous</button>' +
          '<span class="mx-2">Page ' +
          currentPage +
          ' of ' +
          totalPages +
          ' • ' +
          totalItems +
          ' events</span>' +
          '<button class="events-page-next px-2 py-1 rounded border border-slate-200 ' +
          nextDisabled +
          '">Next</button>'
      );

      $pagination.off('click', '.events-page-prev');
      $pagination.off('click', '.events-page-next');
      $pagination.on('click', '.events-page-prev', function () {
        if (currentPage > 1) {
          loadEvents({ page: currentPage - 1 });
        }
      });
      $pagination.on('click', '.events-page-next', function () {
        if (currentPage < totalPages) {
          loadEvents({ page: currentPage + 1 });
        }
      });
    });
  }

  // Registration endpoint might be /event-registrations or a dedicated endpoint; here we use /event-registrations
  function registerForEvent(eventId) {
    var deferred = $.Deferred();
    var auth = CivicAuth.getState();
    if (!auth || !auth.user) {
      CivicAPI.toast('Please sign in to register for events.', {
        type: 'info'
      });
      window.location.hash = '#/login';
      return deferred.reject('unauthenticated').promise();
    }
    CivicAPI.request({
      url: '/event-registrations',
      method: 'POST',
      data: {
        user_id: auth.user.id,
        event_id: eventId
      }
    })
      .done(function () {
        CivicAPI.toast('You are registered for this event.', {
          type: 'success'
        });
        deferred.resolve();
      })
      .fail(function (err) {
        deferred.reject(err);
      });
    return deferred.promise();
  }

  function cancelRegistration(registrationId) {
    var deferred = $.Deferred();
    if (!registrationId) {
      return deferred.reject('missing-registration-id').promise();
    }
    CivicAPI.request({
      url: '/event-registrations/' + registrationId,
      method: 'DELETE'
    })
      .done(function () {
        CivicAPI.toast('Registration cancelled.', { type: 'success' });
        deferred.resolve();
      })
      .fail(function (err) {
        deferred.reject(err);
      });
    return deferred.promise();
  }

  function fetchMyRegistrations() {
    if (!isAuthenticated()) {
      return $.Deferred().resolve([]).promise();
    }
    return CivicAPI.request({
      url: '/event-registrations/my-registrations',
      method: 'GET'
    });
  }

  function fetchEventRegistrants(eventId) {
    if (!isAdmin()) {
      return $.Deferred().resolve([]).promise();
    }
    return CivicAPI.request({
      url: '/event-registrations/event/' + eventId,
      method: 'GET'
    });
  }

  function fetchEventFeedback(eventId) {
    return CivicAPI.request({
      url: '/event-feedback/event/' + eventId,
      method: 'GET'
    });
  }

  function registerForEventFromDetail(eventId, $container) {
    registerForEvent(eventId).done(function () {
      loadEventDetail($container, eventId);
    });
  }

  function cancelRegistrationFromDetail(registrationId, eventId, $container) {
    cancelRegistration(registrationId).done(function () {
      loadEventDetail($container, eventId);
    });
  }

  function submitFeedback(eventId, rating, comment, $container) {
    CivicAPI.request({
      url: '/event-feedback',
      method: 'POST',
      data: {
        event_id: eventId,
        rating: rating,
        comment: comment
      }
    }).done(function () {
      CivicAPI.toast('Thank you for sharing your feedback!', {
        type: 'success'
      });
      loadEventDetail($container, eventId);
    });
  }

  function bindListEventsHandlers($container) {
    $container.on('click', '.view-event', function () {
      var id = $(this).data('id');
      window.location.hash = '#/events/' + id;
    });

    $container.on('click', '.register-event', function () {
      var id = $(this).data('id');
      registerForEvent(id);
    });

    $container.on('click', '#create-event-button', function () {
      if (!isAdmin()) return;
      // For now, redirect to admin events page (detailed CRUD could be done in a modal)
      window.location.hash = '#/admin/events';
    });

    $('#events-filter-location, #events-filter-date').on(
      'change keyup',
      function () {
        loadEvents({ page: 1 });
      }
    );
  }

  function renderEventDetailView($container, pathData) {
    var eventId = pathData.params && pathData.params.id;
    if (!eventId) {
      $container.html(
        '<p class="text-xs text-rose-600">Event not found. Please return to the events list.</p>'
      );
      return;
    }
    $container.html(
      '<div class="mb-4 flex items-center gap-2 text-xs text-slate-500">' +
        '<button id="back-to-events" class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-100">' +
        '<span aria-hidden="true">←</span>' +
        '<span>Back to events</span>' +
        '</button>' +
        '</div>' +
        '<section id="event-detail" data-event-id="' +
        eventId +
        '" class="space-y-4">' +
        '<div class="bg-white border border-slate-100 rounded-2xl p-4 animate-pulse h-40"></div>' +
        '</section>'
    );
    bindDetailHandlers($container);
    loadEventDetail($container, eventId);
  }

  function detailRegistrantsMarkup(registrants) {
    if (!registrants || !registrants.length) {
      return (
        '<p class="text-xs text-slate-500">No registrations yet. Invite community members or share this event.</p>'
      );
    }
    var rows = registrants
      .map(function (r) {
        var user = r.user || {};
        var status =
          r.status || r.registration_status || 'registered';
        return (
          '<tr class="text-xs text-slate-600">' +
          '<td class="py-2 font-medium text-slate-900">' +
          (user.full_name || user.name || 'Anonymous') +
          '</td>' +
          '<td class="py-2">' +
          (user.email || '—') +
          '</td>' +
          '<td class="py-2 text-right capitalize">' +
          status +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
    return (
      '<div class="overflow-x-auto">' +
      '<table class="min-w-full text-left">' +
      '<thead>' +
      '<tr class="text-[11px] uppercase text-slate-400 tracking-wide">' +
      '<th class="py-1.5">Name</th>' +
      '<th class="py-1.5">Email</th>' +
      '<th class="py-1.5 text-right">Status</th>' +
      '</tr>' +
      '</thead>' +
      '<tbody>' +
      rows +
      '</tbody>' +
      '</table>' +
      '</div>'
    );
  }

  function detailFeedbackMarkup(feedbackList) {
    if (!feedbackList || !feedbackList.length) {
      return (
        '<p class="text-xs text-slate-500">No feedback yet. Be the first to share your thoughts after attending.</p>'
      );
    }
    return feedbackList
      .map(function (item) {
        var created = item.created_at
          ? new Date(item.created_at).toLocaleDateString()
          : '';
        var name =
          (item.user && item.user.full_name) ||
          item.full_name ||
          'Attendee';
        return (
          '<article class="border border-slate-100 rounded-xl p-3">' +
          '<div class="flex items-center justify-between text-xs">' +
          '<div class="font-semibold text-slate-900">' +
          name +
          '</div>' +
          '<div class="flex items-center gap-2">' +
          '<span class="text-[11px] text-slate-400">' +
          created +
          '</span>' +
          renderStars(item.rating || 0) +
          '</div>' +
          '</div>' +
          (item.comment
            ? '<p class="text-xs text-slate-600 mt-2 whitespace-pre-line">' +
              item.comment +
              '</p>'
            : '') +
          '</article>'
        );
      })
      .join('');
  }

  function loadEventDetail($container, eventId) {
    var $detail = $('#event-detail');
    if (!$detail.length) return;
    var eventRequest = CivicAPI.request({
      url: '/events/' + eventId,
      method: 'GET'
    });

    eventRequest
      .done(function (event) {
        var registrationPromise = fetchMyRegistrations();
        var registrantsPromise = fetchEventRegistrants(eventId);
        var feedbackPromise = fetchEventFeedback(eventId);

        $.when(registrationPromise, registrantsPromise, feedbackPromise).done(
          function (myRegs, registrants, feedback) {
            var registrations =
              (myRegs && (myRegs.items || myRegs.rows || myRegs.data)) ||
              myRegs ||
              [];
            var registrantsList =
              (registrants &&
                (registrants.items ||
                  registrants.rows ||
                  registrants.data)) ||
              registrants ||
              [];
            var feedbackList =
              (feedback &&
                (feedback.items || feedback.rows || feedback.data)) ||
              feedback ||
              [];
            var authUser = CivicAuth.getState().user || {};
            var registrationRecord = registrations.find(function (r) {
              var eventIdRef =
                r.event_id ||
                (r.event && (r.event.id || r.event.event_id));
              return String(eventIdRef) === String(eventId);
            });
            var registrationId = registrationRecord && registrationRecord.id;
            var averageRating =
              feedbackList.length > 0
                ? (
                    feedbackList.reduce(function (sum, item) {
                      return sum + (item.rating || 0);
                    }, 0) / feedbackList.length
                  ).toFixed(1)
                : null;
            var hasSubmittedFeedback = feedbackList.some(function (item) {
              var userId =
                item.user_id || (item.user && item.user.id);
              return (
                authUser &&
                authUser.id &&
                String(userId) === String(authUser.id)
              );
            });

            var image =
              (event.metadata && event.metadata.image_url) ||
              event.image_url;
            var starts = event.starts_at
              ? new Date(event.starts_at).toLocaleString()
              : 'TBD';
            var ends = event.ends_at
              ? new Date(event.ends_at).toLocaleString()
              : event.ends_at && event.ends_at !== event.starts_at
              ? event.ends_at
              : '';
            var location = event.location || 'Location TBA';
            var mapLink =
              'https://www.google.com/maps/search/?api=1&query=' +
              encodeURIComponent(location);
            var actionsHtml = '';

            if (!isAdmin()) {
              if (registrationId) {
                actionsHtml =
                  '<button id="event-cancel-btn" data-registration-id="' +
                  registrationId +
                  '" class="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 text-rose-600 text-xs font-medium px-3 py-1.5 hover:bg-rose-50">' +
                  '<span>Cancel registration</span>' +
                  '</button>';
              } else if (event.published !== false) {
                actionsHtml =
                  '<button id="event-register-btn" data-event-id="' +
                  event.id +
                  '" class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-indigo-700">' +
                  '<span>Register</span>' +
                  '</button>';
              } else {
                actionsHtml =
                  '<p class="text-[11px] text-amber-500 font-medium">This event is not yet published.</p>';
              }
            } else {
              actionsHtml =
                '<div class="text-[11px] text-slate-500">Use admin tools to edit this event.</div>';
            }

            var feedbackOverview =
              '<div class="bg-slate-50 rounded-xl p-3 flex items-center justify-between">' +
              '<div>' +
              '<p class="text-[11px] text-slate-500">Average rating</p>' +
              '<p class="text-2xl font-semibold text-slate-900">' +
              (averageRating || '—') +
              '</p>' +
              '</div>' +
              '<div class="text-right">' +
              '<p class="text-[11px] text-slate-500">Feedback received</p>' +
              '<p class="text-base font-semibold text-slate-900">' +
              feedbackList.length +
              '</p>' +
              '</div>' +
              '</div>';

            var feedbackForm = '';
            if (isAuthenticated()) {
              if (hasSubmittedFeedback) {
                feedbackForm =
                  '<p class="text-xs text-slate-500">You have already submitted feedback for this event.</p>';
              } else {
                feedbackForm =
                  '<form id="feedback-form" data-event-id="' +
                  event.id +
                  '" class="space-y-2" novalidate>' +
                  '<div>' +
                  '<label class="text-xs font-medium text-slate-600">Rating</label>' +
                  '<select id="feedback-rating" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">' +
                  '<option value="5">5 - Excellent</option>' +
                  '<option value="4">4 - Good</option>' +
                  '<option value="3">3 - Average</option>' +
                  '<option value="2">2 - Needs improvement</option>' +
                  '<option value="1">1 - Poor</option>' +
                  '</select>' +
                  '</div>' +
                  '<div>' +
                  '<label class="text-xs font-medium text-slate-600">Comment</label>' +
                  '<textarea id="feedback-comment" rows="3" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Share your experience..." required></textarea>' +
                  '</div>' +
                  '<button type="submit" class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-indigo-700">' +
                  '<span>Submit feedback</span>' +
                  '</button>' +
                  '</form>';
              }
            } else {
              feedbackForm =
                '<p class="text-xs text-slate-500">Sign in to leave feedback.</p>';
            }

            $detail.html(
              '<article class="bg-white border border-slate-100 rounded-2xl overflow-hidden">' +
                '<div class="grid gap-4 md:grid-cols-2">' +
                '<div class="p-4 space-y-3">' +
                (image
                  ? '<img src="' +
                    image +
                    '" alt="Image for ' +
                    (event.title || 'event') +
                    '" class="w-full h-56 object-cover rounded-xl" loading="lazy" />'
                  : '<div class="h-56 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-50 flex items-center justify-center text-xs text-slate-400">No image provided</div>') +
                '<div>' +
                '<span class="text-[11px] uppercase tracking-wide text-slate-400">' +
                (event.category || 'Community engagement') +
                '</span>' +
                '<h1 class="text-xl font-semibold text-slate-900">' +
                event.title +
                '</h1>' +
                '<p class="text-sm text-slate-600 mt-2 whitespace-pre-line">' +
                (event.description || '') +
                '</p>' +
                '</div>' +
                '<div>' +
                '<p class="text-[11px] text-slate-500 mb-1">Registration</p>' +
                actionsHtml +
                '</div>' +
                '</div>' +
                '<div class="bg-slate-50 border-l border-slate-100 p-4 space-y-4">' +
                '<div>' +
                '<p class="text-[11px] uppercase tracking-wide text-slate-400">Schedule</p>' +
                '<p class="text-sm font-semibold text-slate-900">' +
                starts +
                '</p>' +
                (ends && ends !== starts
                  ? '<p class="text-xs text-slate-500">Ends ' + ends + '</p>'
                  : '') +
                '</div>' +
                '<div>' +
                '<p class="text-[11px] uppercase tracking-wide text-slate-400">Location</p>' +
                '<p class="text-sm font-semibold text-slate-900">' +
                location +
                '</p>' +
                '<a href="' +
                mapLink +
                '" target="_blank" rel="noopener noreferrer" class="text-xs text-indigo-600 hover:text-indigo-700">Open in Maps</a>' +
                '</div>' +
                '<div class="flex items-center gap-3 text-xs text-slate-600">' +
                '<span class="inline-flex items-center px-2 py-0.5 rounded-full border ' +
                (event.published
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700') +
                '">' +
                (event.published ? 'Published' : 'Draft') +
                '</span>' +
                '<span>' +
                (event.capacity
                  ? event.capacity + ' seats available'
                  : 'No capacity limit set') +
                '</span>' +
                '</div>' +
                (isAdmin()
                  ? '<button data-nav="admin-events" class="text-xs font-medium text-indigo-600 hover:text-indigo-700">Edit this event</button>'
                  : '') +
                '</div>' +
                '</div>' +
                '</article>' +
                '<section class="bg-white border border-slate-100 rounded-2xl p-4 space-y-4">' +
                '<div class="flex flex-col md:flex-row gap-4">' +
                '<div class="flex-1">' +
                feedbackOverview +
                '</div>' +
                '<div class="flex-1">' +
                '<h2 class="text-sm font-semibold text-slate-900 mb-2">Share your feedback</h2>' +
                feedbackForm +
                '</div>' +
                '</div>' +
                '<div>' +
                '<h3 class="text-xs font-semibold text-slate-900 mb-2">What others are saying</h3>' +
                detailFeedbackMarkup(feedbackList) +
                '</div>' +
                '</section>' +
                (isAdmin()
                  ? '<section class="bg-white border border-slate-100 rounded-2xl p-4">' +
                    '<div class="flex items-center justify-between mb-2">' +
                    '<h3 class="text-sm font-semibold text-slate-900">Registrations</h3>' +
                    '<p class="text-[11px] text-slate-500">' +
                    registrantsList.length +
                    ' attendees</p>' +
                    '</div>' +
                    detailRegistrantsMarkup(registrantsList) +
                    '</section>'
                  : '')
            );
            if (window.feather) window.feather.replace();
          }
        );
      })
      .fail(function () {
        $detail.html(
          '<p class="text-xs text-rose-600">Unable to load this event. It may have been removed.</p>'
        );
      });
  }

  function bindDetailHandlers($container) {
    $container.off('click', '#back-to-events');
    $container.on('click', '#back-to-events', function () {
      window.location.hash = '#/events';
    });

    $container.off('click', '#event-register-btn');
    $container.on('click', '#event-register-btn', function () {
      var eventId = $(this).data('event-id');
      registerForEventFromDetail(eventId, $container);
    });

    $container.off('click', '#event-cancel-btn');
    $container.on('click', '#event-cancel-btn', function () {
      var registrationId = $(this).data('registration-id');
      var eventId = $('#event-detail').data('event-id');
      cancelRegistrationFromDetail(registrationId, eventId, $container);
    });

    $container.off('submit', '#feedback-form');
    $container.on('submit', '#feedback-form', function (e) {
      e.preventDefault();
      var eventId = $(this).data('event-id');
      var rating = Number($('#feedback-rating').val());
      var comment = $('#feedback-comment').val().trim();
      if (!rating || rating < 1 || rating > 5) {
        CivicAPI.toast('Please select a rating between 1 and 5.', {
          type: 'warn'
        });
        return;
      }
      if (!comment) {
        CivicAPI.toast('Please add a short comment.', { type: 'warn' });
        return;
      }
      submitFeedback(eventId, rating, comment, $container);
    });
  }

  // Public registration with router
  $(function () {
    if (!window.CivicRouter) return;

    CivicRouter.register('/events', {
      requireAuth: true,
      adminOnly: false,
      render: function ($container) {
        renderList($container);
        bindListEventsHandlers($container);
      }
    });

    CivicRouter.register('/events/:id', {
      requireAuth: true,
      adminOnly: false,
      render: function ($container, pathData) {
        renderEventDetailView($container, pathData);
      }
    });
  });
})(window, jQuery);


