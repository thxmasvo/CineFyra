import { refreshToken, logoutUser } from './utils/auth';

// Search for movies by title/year/page
export function getMovies(title = '', year = '', page = 1, genre = '', signal) {
  const baseUrl = 'http://4.237.58.241:3000/movies/search';
  const params = new URLSearchParams();
  if (title) params.append('title', title);
  if (year) params.append('year', year);
  if (genre) params.append('genre', genre);
  params.append('page', page);

  return fetch(`${baseUrl}?${params.toString()}`, signal ? { signal } : {})
    .then(res => res.json())
    .then(res => res.data || []);
}


// Fetch detailed movie data by IMDb ID
export async function getMovieDetails(imdbID, signal) {
  const res = await fetch(`${BASE}/movies/data/${imdbID}`, { signal });
  const contentType = res.headers.get('content-type');

  if (!res.ok) {
    const errorText = await res.text(); // fallback if not JSON
    throw new Error(errorText || `HTTP ${res.status}`);
  }

  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Expected JSON but got: ${text}`);
  }

  return res.json();
}

// Fetch person details (protected route)
export async function getPersonDetails(id) {
  const url = `http://4.237.58.241:3000/people/${id}`;
  let token = localStorage.getItem('cinefyra-token');

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Token might be expired — try refresh
  if (res.status === 401) {
    console.warn('🔄 Token expired, attempting refresh...');
    try {
      token = await refreshToken();
      const retry = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!retry.ok) throw new Error(await retry.text());
      return await retry.json();
    } catch (err) {
      console.error('❌ Token refresh failed:', err.message);
      logoutUser();
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// Register user
export async function registerUser(email, password) {
  const res = await fetch('http://4.237.58.241:3000/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

// Log in user and persist tokens
export async function loginUser(email, password) {
  const res = await fetch('http://4.237.58.241:3000/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message);

  localStorage.setItem('cinefyra-token', data.token);
  localStorage.setItem('cinefyra-refresh', data.refreshToken);
  localStorage.setItem('cinefyra-user', email);

  return data;
}
