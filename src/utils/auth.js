export function isLoggedIn() {
  return !!localStorage.getItem('cinefyra-token');
}

export function getUserEmail() {
  return localStorage.getItem('cinefyra-user') || 'Guest';
}

export async function refreshToken() {
  const refresh = localStorage.getItem('cinefyra-refresh');
  if (!refresh) throw new Error('Refresh token missing');

  const res = await fetch('http://4.237.58.241:3000/user/refresh', {
    method: 'POST',
    headers: { Authorization: `Bearer ${refresh}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message);

  localStorage.setItem('cinefyra-token', data.bearerToken.token);
  localStorage.setItem('cinefyra-refresh', data.refreshToken.token);

  scheduleTokenRefresh(data.bearerToken.expires_in);
  return data.bearerToken.token;
}


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

// 🔁 Automatically schedule token refresh before expiry
let refreshTimeout;
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

function clearScheduledRefresh() {
  if (refreshTimeout) clearTimeout(refreshTimeout);
}
