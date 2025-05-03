import { refreshToken, logoutUser } from './utils/auth';

// Search for movies by title/year/page
export function getMovies(title = '', year = '', page = 1, signal) {
  const baseUrl = 'http://4.237.58.241:3000/movies/search';
  const params = new URLSearchParams();
  if (title) params.append('title', title);
  if (year) params.append('year', year);
  params.append('page', page);

  return fetch(`${baseUrl}?${params.toString()}`, { signal })
    .then(res => res.json())
    .then(res => res.data || []);
}

// Fetch detailed movie data by IMDb ID
export async function getMovieDetails(imdbID) {
  const url = `http://4.237.58.241:3000/movies/data/${imdbID}`;
  try {
    const res = await fetch(url);
    if (res.status === 429) {
      console.warn(`⏳ Rate limit hit for ${imdbID}. Retrying after delay...`);
      await new Promise(res => setTimeout(res, 1000));
      return getMovieDetails(imdbID); // retry
    }
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error(`getMovieDetails failed for ${imdbID}:`, err.message);
    throw err;
  }
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
