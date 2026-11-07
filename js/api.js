/* Era of Empires - shared API client */
(function () {
  const API_BASE =
    window.location.hostname === 'localhost'
      ? 'http://localhost:3001'
      : window.location.hostname.endsWith('.ts.net')
      ? 'https://' + window.location.hostname
      : '';

  const TOKEN_KEY = 'era-of-empires-auth-token';
  const USER_KEY = 'era-of-empires-user-id';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUserId() {
    return localStorage.getItem(USER_KEY);
  }

  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    if (user && user._id) localStorage.setItem(USER_KEY, user._id);
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function request(path, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    if (opts.body && typeof opts.body !== 'string' && !(opts.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(API_BASE + path, { ...opts, headers });
    let data = {};
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }
    }
    if (!res.ok) {
      const err = new Error(data.error || 'Request failed (' + res.status + ')');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  // Require a valid session. If missing/invalid, redirect to login.
  async function requireAuth() {
    if (!getToken()) {
      window.location.href = 'login.html';
      return false;
    }
    try {
      await request('/api/auth/me');
      return true;
    } catch (err) {
      if (err.status === 401) {
        clearSession();
        window.location.href = 'login.html';
      }
      return false;
    }
  }

  async function logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    clearSession();
    window.location.href = 'login.html';
  }

  window.EOE = window.EOE || {};
  window.EOE.api = {
    base: API_BASE,
    getToken,
    getUserId,
    setSession,
    clearSession,
    request,
    requireAuth,
    logout,
    get(path) { return request(path); },
    post(path, body) { return request(path, { method: 'POST', body }); },
  };
})();
