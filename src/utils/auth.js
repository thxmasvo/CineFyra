let refreshTimeout;

// Check if a token is stored
export function isLoggedIn() {
  return !!localStorage.getItem('cinefyra-token');
}

// Get logged-in user's email or fallback
export function getUserEmail() {
  return localStorage.getItem('cinefyra-user') || 'Guest';
}

// Attempt to refresh the access token using refresh token
export async function refreshToken() {
  const refresh = localStorage.getItem('cinefyra-refresh');
  if (!refresh) throw new Error('Refresh token missing');

  const res = await fetch('http://4.237.58.241:3000/user/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  if (res.status === 400 || res.status === 401) {
    await logoutUser(); // session expired
    throw new Error('Session expired. Please sign in again.');
  }

  const data = await res.json();

  // Save new tokens
  localStorage.setItem('cinefyra-token', data.bearerToken.token);
  localStorage.setItem('cinefyra-refresh', data.refreshToken.token);

  // Re-schedule next refresh
  scheduleTokenRefresh(data.bearerToken.expires_in);
  return data.bearerToken.token;
}

// Clears tokens and logs out user
export async function logoutUser() {
  const refresh = localStorage.getItem('cinefyra-refresh');
  if (refresh) {
    await fetch('http://4.237.58.241:3000/user/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${refresh}` },
    });
  }
  localStorage.removeItem('cinefyra-token');
  localStorage.removeItem('cinefyra-refresh');
  localStorage.removeItem('cinefyra-user');
  clearScheduledRefresh();
}

// Schedule token refresh before expiry
export function scheduleTokenRefresh(expiresInSeconds) {
  clearTimeout(refreshTimeout);
  const refreshBuffer = 60; // refresh 1 min before expiry
  const delay = (expiresInSeconds - refreshBuffer) * 1000;
  if (delay > 0) {
    refreshTimeout = setTimeout(() => {
      refreshToken().catch(() => logoutUser());
    }, delay);
  }
}

// Cancel any pending token refresh
function clearScheduledRefresh() {
  if (refreshTimeout) clearTimeout(refreshTimeout);
}
