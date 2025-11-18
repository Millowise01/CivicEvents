// Authentication & global auth state, including role-based guards.
// NOTE: Real security is enforced by the backend; these checks are UX helpers only.
(function (window, $) {
  'use strict';

  var STORAGE_KEY = 'civicevents_auth';

  var authState = {
    user: null, // { id, full_name, email, role, is_active }
    token: null,
    persistent: false
  };

  function loadFromStorage() {
    try {
      var raw =
        window.localStorage.getItem(STORAGE_KEY) ||
        window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var stored = JSON.parse(raw);
      authState.user = stored.user || null;
      authState.token = stored.token || null;
      authState.persistent = stored.persistent || false;
    } catch (err) {
      console.warn('Failed to parse stored auth state', err);
    }
  }

  function saveToStorage() {
    var raw = JSON.stringify({
      user: authState.user,
      token: authState.token,
      persistent: authState.persistent
    });
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(STORAGE_KEY);
      if (authState.token && authState.user) {
        if (authState.persistent) {
          window.localStorage.setItem(STORAGE_KEY, raw);
        } else {
          window.sessionStorage.setItem(STORAGE_KEY, raw);
        }
      }
    } catch (err) {
      console.warn('Failed to persist auth state', err);
    }
  }

  function setAuth(payload, options) {
    options = options || {};
    authState.user = payload.user;
    authState.token = payload.token;
    authState.persistent = !!options.persistent;
    saveToStorage();
    CivicAPI.emit('auth:changed', getAuthState());
  }

  function clearAuth(reason) {
    authState.user = null;
    authState.token = null;
    authState.persistent = false;
    saveToStorage();
    CivicAPI.emit('auth:cleared', { reason: reason || 'manual' });
  }

  function getAuthState() {
    return {
      user: authState.user,
      token: authState.token,
      persistent: authState.persistent
    };
  }

  function getToken() {
    return authState.token;
  }

  function isAdmin() {
    return authState.user && authState.user.role === 'admin';
  }

  function isAuthenticated() {
    return !!authState.token && !!authState.user;
  }

  function updateHeaderUI() {
    var user = authState.user;
    var $appShell = $('#app-shell');
    var $authPages = $('#auth-pages');

    if (isAuthenticated()) {
      $authPages.addClass('hidden');
      $appShell.removeClass('hidden');
    } else {
      $appShell.addClass('hidden');
      $authPages.removeClass('hidden');
    }

    // Profile avatar + name
    if (user) {
      var initials = (user.full_name || user.name || user.email || '?')
        .split(' ')
        .map(function (part) {
          return part.charAt(0).toUpperCase();
        })
        .slice(0, 2)
        .join('');
      $('#profile-avatar').text(initials);
      $('#profile-name').text(user.full_name || user.name || user.email || '');
      $('#profile-role').text(user.role || '');
    } else {
      $('#profile-avatar').text('?');
      $('#profile-name').text('');
      $('#profile-role').text('');
    }

    // Admin-only navigation visibility
    var shouldShowAdmin = isAdmin();
    $('.admin-only').toggleClass('hidden', !shouldShowAdmin);
    $('#admin-sidebar').toggleClass('hidden', !shouldShowAdmin);
  }

  // Signup flow
  function initSignupForm() {
    var $password = $('#signup-password');
    var $confirmPassword = $('#signup-confirm-password');
    var $strengthBar = $('#password-strength-bar');
    var $strengthLabel = $('#password-strength-label');
    var $form = $('#signup-form');

    function evaluateStrength(value) {
      var score = 0;
      if (value.length >= 8) score++;
      if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
      if (/\d/.test(value)) score++;
      if (/[^A-Za-z0-9]/.test(value)) score++;
      return score;
    }

    function updateStrengthUI() {
      var value = $password.val() || '';
      var score = evaluateStrength(value);
      var width = (score / 4) * 100;
      var label = 'Too weak';
      var colorClass = 'bg-rose-500';
      if (score === 2) {
        label = 'Fair';
        colorClass = 'bg-amber-500';
      } else if (score === 3) {
        label = 'Good';
        colorClass = 'bg-emerald-500';
      } else if (score === 4) {
        label = 'Strong';
        colorClass = 'bg-emerald-600';
      }
      $strengthBar
        .removeClass('bg-rose-500 bg-amber-500 bg-emerald-500 bg-emerald-600')
        .addClass(colorClass)
        .css('width', width + '%');
      $strengthLabel.text('Strength: ' + label.toLowerCase());
    }

    $password.on('input', updateStrengthUI);

    $form.on('submit', function (e) {
      e.preventDefault();
      var fullName = $('#signup-full-name').val().trim();
      var email = $('#signup-email').val().trim();
      var password = $password.val().trim();
      var confirmPassword = $confirmPassword.val().trim();

      // Temporarily disable frontend password validation
      // var score = evaluateStrength(password);
      // if (score < 4) {
      //   CivicAPI.toast(
      //     'Password is not strong enough. Please include upper and lower case letters, a number and a symbol.',
      //     { type: 'warn' }
      //   );
      //   return;
      // }
      if (password !== confirmPassword) {
        CivicAPI.toast('Passwords do not match.', { type: 'error' });
        return;
      }

      if (!fullName || !email) {
        CivicAPI.toast('Please fill in all required fields.', {
          type: 'warn'
        });
        return;
      }

      $('#signup-button-spinner').removeClass('hidden');
      $form.find('button[type=submit]').prop('disabled', true);

      CivicAPI.request({
        url: '/auth/signup',
        method: 'POST',
        data: {
          full_name: fullName,
          email: email,
          password: password
        }
      })
        .done(function () {
          CivicAPI.toast('Account created. Please sign in.', {
            type: 'success'
          });
          $('#login-success-message')
            .text('Account created successfully. You can now sign in.')
            .removeClass('hidden');
          // Switch view to login
          $('#signup-view').addClass('hidden');
          $('#login-view').removeClass('hidden');
        })
        .always(function () {
          $('#signup-button-spinner').addClass('hidden');
          $form.find('button[type=submit]').prop('disabled', false);
        });
    });
  }

  // Login flow
  function initLoginForm() {
    var $form = $('#login-form');

    $form.on('submit', function (e) {
      e.preventDefault();
      var email = $('#login-email').val().trim();
      var password = $('#login-password').val().trim();
      var remember = $('#login-remember').is(':checked');

      if (!email || !password) {
        CivicAPI.toast('Please enter your email and password.', {
          type: 'warn'
        });
        return;
      }

      $('#login-button-spinner').removeClass('hidden');
      $form.find('button[type=submit]').prop('disabled', true);

      CivicAPI.request({
        url: '/auth/login',
        method: 'POST',
        data: { email: email, password: password }
      })
        .done(function (data) {
          // Expect backend to return { token, user: { id, full_name, role, ... } }
          if (!data || !data.token || !data.user) {
            CivicAPI.toast(
              'Login response did not include token and user information.',
              { type: 'error' }
            );
            return;
          }
          setAuth(
            {
              token: data.token,
              user: {
                id: data.user.id,
                full_name: data.user.full_name || data.user.name,
                email: data.user.email,
                role: data.user.role,
                is_active: data.user.is_active
              }
            },
            { persistent: remember }
          );
          CivicAPI.toast('Welcome back, ' + (data.user.full_name || 'user') + '!', {
            type: 'success'
          });
          // Redirect to dashboard (admin) or events (user)
          if (isAdmin()) {
            window.location.hash = '#/dashboard';
          } else {
            window.location.hash = '#/events';
          }
        })
        .always(function () {
          $('#login-button-spinner').addClass('hidden');
          $form.find('button[type=submit]').prop('disabled', false);
        });
    });
  }

  function initAuthViewsSwitching() {
    $('#go-to-signup').on('click', function () {
      $('#login-view').addClass('hidden');
      $('#signup-view').removeClass('hidden');
    });
    $('#go-to-login').on('click', function () {
      $('#signup-view').addClass('hidden');
      $('#login-view').removeClass('hidden');
    });
  }

  function initProfileMenu() {
    var $button = $('#profile-menu-button');
    var $menu = $('#profile-menu');

    $button.on('click', function () {
      var expanded = $button.attr('aria-expanded') === 'true';
      $button.attr('aria-expanded', String(!expanded));
      $menu.toggleClass('hidden', expanded);
    });

    $(document).on('click', function (e) {
      if (
        !$(e.target).closest('#profile-menu-button').length &&
        !$(e.target).closest('#profile-menu').length
      ) {
        $button.attr('aria-expanded', 'false');
        $menu.addClass('hidden');
      }
    });

    $('#logout-button').on('click', function () {
      clearAuth('manual');
      CivicAPI.toast('You have been signed out.', { type: 'info' });
      window.location.hash = '#/login';
    });
  }

  // Initialize on DOM ready
  $(function () {
    loadFromStorage();
    updateHeaderUI();
    initSignupForm();
    initLoginForm();
    initAuthViewsSwitching();
    initProfileMenu();

    CivicAPI.on('auth:changed', updateHeaderUI);
    CivicAPI.on('auth:cleared', function () {
      updateHeaderUI();
    });
    CivicAPI.on('auth:unauthorized', function () {
      clearAuth('unauthorized');
      window.location.hash = '#/login';
    });
  });

  // Public API
  window.CivicAuth = {
    getState: getAuthState,
    getToken: getToken,
    isAdmin: isAdmin,
    isAuthenticated: isAuthenticated,
    setAuth: setAuth,
    clearAuth: clearAuth
  };
})(window, jQuery);


