import { refreshToken, logoutUser } from './utils/auth';

const BASE = 'http://4.237.58.241:3000';

/* -------------------------
   Basic search
------------------------- */
export async function getBasicMovies(title = '', year = '', page = 1, signal) {
  const params = new URLSearchParams();
  if (title) params.append('title', title);
  if (year) params.append('year', year);
  params.append('page', page);

  const res = await fetch(`${BASE}/movies/search?${params.toString()}`, signal ? { signal } : {});

  // 429 Rate Limit
  if (res.status === 429) {
    const text = await res.text();
    throw new Error(`🚫 Rate limit hit: ${text}`);
  }

  // Not JSON
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`❌ Unexpected response: ${text}`);
  }

  const data = await res.json();
  return data.data || [];
}

/* -------------------------
   Full movie details
------------------------- */
export async function getMovieDetails(imdbID, signal) {
  const res = await fetch(`${BASE}/movies/data/${imdbID}`, signal ? { signal } : {});

  if (res.status === 429) {
    const text = await res.text();
    throw new Error(`🚫 Rate limit hit: ${text}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`❌ Unexpected response: ${text}`);
  }

  return res.json();
}

/* -------------------------
   Enriched (curated) movies
------------------------- */
export async function getEnrichedMovies(title = '', page = 1, limit = null, signal) {
  const baseMovies = await getBasicMovies(title, '', page, signal);
  const filtered = limit ? baseMovies.slice(0, limit) : baseMovies;

  const enriched = [];

  for (const movie of filtered) {
    try {
      const res = await fetch(`${BASE}/movies/data/${movie.imdbID}`, signal ? { signal } : {});

      if (res.status === 429) {
        const text = await res.text();
        throw new Error(`🚫 Rate limit hit (details): ${text}`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`❌ Unexpected detail response: ${text}`);
      }

      const details = await res.json();
      enriched.push({ ...movie, ...details });

      // Slow down to avoid rate limit
      await new Promise(res => setTimeout(res, 200));
    } catch (err) {
      console.warn(`⚠️ Could not enrich ${movie.title}:`, err.message);
      enriched.push(movie); // fallback to base data
    }
  }

  return enriched;
}

/* -------------------------
   Protected: Person Details
------------------------- */
export async function getPersonDetails(id) {
  const url = `${BASE}/people/${id}`;
  let token = localStorage.getItem('cinefyra-token');

  let res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    console.warn('🔄 Token expired, refreshing...');
    try {
      token = await refreshToken();
      res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (err) {
      console.error('❌ Refresh failed:', err.message);
      logoutUser();
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

/* -------------------------
   Auth: Register / Login
------------------------- */
export async function registerUser(email, password) {
  const res = await fetch(`${BASE}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function loginUser(email, password) {
  const res = await fetch(`${BASE}/users/login`, {
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
