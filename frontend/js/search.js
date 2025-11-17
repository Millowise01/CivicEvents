// Global search functionality
(function (window, $) {
  'use strict';

  var searchCache = {
    events: [],
    announcements: [],
    promos: [],
    lastUpdate: 0
  };

  function performSearch(query) {
    if (!query || query.length < 2) return [];
    
    var results = [];
    var q = query.toLowerCase();

    // Search events
    searchCache.events.forEach(function (item) {
      if ((item.title || '').toLowerCase().includes(q) || 
          (item.description || '').toLowerCase().includes(q) ||
          (item.location || '').toLowerCase().includes(q)) {
        results.push({
          type: 'event',
          title: item.title,
          description: item.description,
          url: '#/events/' + item.id,
          icon: 'calendar'
        });
      }
    });

    // Search announcements
    searchCache.announcements.forEach(function (item) {
      if ((item.title || '').toLowerCase().includes(q)) {
        results.push({
          type: 'announcement',
          title: item.title,
          description: 'Audio announcement',
          url: '#/announcements',
          icon: 'mic'
        });
      }
    });

    // Search promos
    searchCache.promos.forEach(function (item) {
      if ((item.title || '').toLowerCase().includes(q) || 
          (item.description || '').toLowerCase().includes(q)) {
        results.push({
          type: 'promo',
          title: item.title,
          description: item.description,
          url: '#/promos',
          icon: 'film'
        });
      }
    });

    return results.slice(0, 8); // Limit results
  }

  function renderSearchResults(results) {
    if (!results.length) {
      return '<p class="text-xs text-slate-500 p-3">No results found</p>';
    }

    return results.map(function (result) {
      return (
        '<a href="' + result.url + '" class="search-result-item block p-2 hover:bg-slate-50 rounded-lg">' +
        '<div class="flex items-center gap-2">' +
        '<span data-feather="' + result.icon + '" class="w-4 h-4 text-slate-400"></span>' +
        '<div class="min-w-0">' +
        '<p class="text-xs font-medium text-slate-900 truncate">' + result.title + '</p>' +
        '<p class="text-[11px] text-slate-500 truncate">' + (result.description || '') + '</p>' +
        '</div>' +
        '</div>' +
        '</a>'
      );
    }).join('');
  }

  function updateSearchCache() {
    var now = Date.now();
    if (now - searchCache.lastUpdate < 300000) return; // 5 minutes cache

    // Load events
    CivicAPI.request({ url: '/events?published=true', method: 'GET' })
      .done(function (data) {
        searchCache.events = data.items || data.rows || data.data || data || [];
      });

    // Load announcements
    CivicAPI.request({ url: '/announcements?published=true', method: 'GET' })
      .done(function (data) {
        searchCache.announcements = data.items || data.rows || data.data || data || [];
      });

    // Load promos
    CivicAPI.request({ url: '/promos?published=true', method: 'GET' })
      .done(function (data) {
        searchCache.promos = data.items || data.rows || data.data || data || [];
        searchCache.lastUpdate = now;
      });
  }

  function initGlobalSearch() {
    var $input = $('#global-search-input');
    var $dropdown = null;
    var searchTimeout = null;

    function createDropdown() {
      if ($dropdown) return $dropdown;
      
      $dropdown = $('<div/>', {
        class: 'absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto hidden',
        id: 'search-dropdown'
      });
      
      $input.parent().append($dropdown);
      return $dropdown;
    }

    function showResults(query) {
      var results = performSearch(query);
      var $dropdown = createDropdown();
      
      if (query.length < 2) {
        $dropdown.addClass('hidden');
        return;
      }

      $dropdown.html(renderSearchResults(results)).removeClass('hidden');
      if (window.feather) window.feather.replace();
    }

    function hideResults() {
      if ($dropdown) {
        $dropdown.addClass('hidden');
      }
    }

    $input.on('input', function () {
      var query = $(this).val().trim();
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(function () {
        showResults(query);
      }, 200);
    });

    $input.on('focus', function () {
      updateSearchCache();
      var query = $(this).val().trim();
      if (query.length >= 2) {
        showResults(query);
      }
    });

    $(document).on('click', function (e) {
      if (!$(e.target).closest('#global-search-input, #search-dropdown').length) {
        hideResults();
      }
    });

    $(document).on('click', '.search-result-item', function () {
      hideResults();
      $input.val('');
    });
  }

  $(function () {
    initGlobalSearch();
  });

})(window, jQuery);