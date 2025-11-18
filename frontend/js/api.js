// Global API helper: base URL, auth header injection, and error handling
(function (window, $) {
  'use strict';

  var API_BASE_URL = window.CIVIC_EVENTS_API_BASE_URL || 'http://localhost:4000/api';
  var activeRequests = 0;
  var loadingBarEl = null;

  function ensureLoadingBar() {
    if (!loadingBarEl) {
      loadingBarEl = document.getElementById('global-loading-bar');
    }
  }

  function updateLoadingBar() {
    ensureLoadingBar();
    if (!loadingBarEl) return;
    if (activeRequests > 0) {
      loadingBarEl.style.transform = 'scaleX(1)';
    } else {
      loadingBarEl.style.transform = 'scaleX(0)';
    }
  }

  function startGlobalLoading() {
    activeRequests += 1;
    updateLoadingBar();
  }

  function stopGlobalLoading() {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
      setTimeout(updateLoadingBar, 150);
    } else {
      updateLoadingBar();
    }
  }

  // Simple global event bus for cross-module communication
  var listeners = {};
  function on(event, handler) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  }
  function emit(event, payload) {
    (listeners[event] || []).forEach(function (fn) {
      try {
        fn(payload);
      } catch (err) {
        console.error('Event handler error for', event, err);
      }
    });
  }

  // Toast utilities
  function showToast(message, options) {
    options = options || {};
    var type = options.type || 'info'; // info | success | error | warn
    var $container = $('#toast-container');
    if ($container.length === 0) return;

    var colors = {
      info: 'bg-slate-900 text-slate-50',
      success: 'bg-emerald-600 text-emerald-50',
      error: 'bg-rose-600 text-rose-50',
      warn: 'bg-amber-500 text-amber-50'
    };

    var $toast = $('<div/>', {
      class:
        'pointer-events-auto flex items-start gap-2 px-3 py-2 rounded-lg shadow-lg text-xs max-w-xs ' +
        (colors[type] || colors.info)
    });
    var $msg = $('<div/>', { text: message });
    var $close = $('<button/>', {
      class:
        'ml-2 shrink-0 text-[11px] uppercase tracking-wide font-semibold opacity-80 hover:opacity-100',
      text: 'Close',
      'aria-label': 'Dismiss notification'
    });
    $close.on('click', function () {
      $toast.fadeOut(150, function () {
        $toast.remove();
      });
    });
    $toast.append($msg, $close);
    $container.append($toast);

    setTimeout(function () {
      $toast.fadeOut(200, function () {
        $toast.remove();
      });
    }, options.duration || 4000);
  }

  // Auth token provider (implemented in auth.js but referenced here)
  function getToken() {
    if (window.CivicAuth && typeof window.CivicAuth.getToken === 'function') {
      return window.CivicAuth.getToken();
    }
    return null;
  }

  // Global jQuery AJAX configuration
  $.ajaxSetup({
    beforeSend: function (xhr, settings) {
      var token = getToken();
      if (token && settings && !settings.headers?.Authorization) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      }
    }
  });

  // Unified request wrapper
  function request(options) {
    var deferred = $.Deferred();
    var url = options.url;
    if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) {
      url = API_BASE_URL.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '');
    }


    startGlobalLoading();

    var ajaxOptions = $.extend(
      {
        url: url,
        method: 'GET',
        dataType: 'json',
        contentType: 'application/json',
        timeout: 15000
      },
      options
    );

    // For JSON payloads, stringify body if it's an object
    if (
      ajaxOptions.data &&
      ajaxOptions.contentType &&
      ajaxOptions.contentType.indexOf('application/json') === 0 &&
      typeof ajaxOptions.data !== 'string'
    ) {
      ajaxOptions.data = JSON.stringify(ajaxOptions.data);
    }

    $.ajax(ajaxOptions)
      .done(function (data, textStatus, jqXHR) {
        deferred.resolve(data, jqXHR);
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        var status = jqXHR.status;
        var payload = jqXHR.responseJSON || {};
        var message =
          payload.message ||
          payload.error ||
          (status === 0
            ? 'Network error. Please check your connection and try again.'
            : 'An unexpected error occurred. Please try again.');

        if (status === 401) {
          // Unauthorized: force logout
          showToast('Your session has expired. Please sign in again.', {
            type: 'warn',
            duration: 6000
          });
          emit('auth:unauthorized');
        } else if (status === 403) {
          showToast('You do not have permission to perform this action.', {
            type: 'error'
          });
        } else {
          showToast(message, { type: 'error' });
        }

        deferred.reject({
          status: status,
          message: message,
          raw: jqXHR
        });
      })
      .always(function () {
        stopGlobalLoading();
      });

    return deferred.promise();
  }

  // File upload helper (multipart/form-data)
  function upload(options) {
    var deferred = $.Deferred();
    var url = options.url;
    if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) {
      url = API_BASE_URL.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '');
    }

    startGlobalLoading();

    $.ajax({
      url: url,
      method: options.method || 'POST',
      processData: false,
      contentType: false,
      data: options.formData,
      timeout: 30000,
      success: function (data, textStatus, jqXHR) {
        deferred.resolve(data, jqXHR);
      },
      error: function (jqXHR) {
        var status = jqXHR.status;
        var payload = jqXHR.responseJSON || {};
        var message =
          payload.message ||
          payload.error ||
          (status === 0
            ? 'Network error while uploading. Please try again.'
            : 'Upload failed. Please try again.');

        if (status === 401) {
          showToast('Your session has expired. Please sign in again.', {
            type: 'warn'
          });
          emit('auth:unauthorized');
        } else if (status === 403) {
          showToast('You do not have permission to perform this action.', {
            type: 'error'
          });
        } else {
          showToast(message, { type: 'error' });
        }
        deferred.reject({
          status: status,
          message: message,
          raw: jqXHR
        });
      },
      complete: function () {
        stopGlobalLoading();
      }
    });

    return deferred.promise();
  }

  // Public API
  window.CivicAPI = {
    baseUrl: API_BASE_URL,
    request: request,
    upload: upload,
    on: on,
    emit: emit,
    toast: showToast
  };
})(window, jQuery);


