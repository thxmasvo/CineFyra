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

export async function getMovieDetails(imdbID) {
  const url = `http://4.237.58.241:3000/movies/data/${imdbID}`;
  try {
    const res = await fetch(url);
    if (res.status === 429) {
      console.warn(`⏳ Rate limit hit for ${imdbID}. Retrying after delay...`);
      await new Promise(res => setTimeout(res, 1000)); // wait 1s
      return getMovieDetails(imdbID); // retry once
    }
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error(`getMovieDetails failed for ${imdbID}:`, err.message);
    throw err;
  }
}

export async function getPersonDetails(id) {
  const url = `http://4.237.58.241:3000/people/${id}`;
  try {
    const res = await fetch(url, {
      headers: {
       Authorization: `Bearer ${localStorage.getItem('cinefyra-token')}`,
      },
    });

    if (res.status === 429) {
      console.warn(`⏳ Rate limit hit for person ${id}. Retrying...`);
      await new Promise((res) => setTimeout(res, 1000));
      return getPersonDetails(id);
    }

    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    console.error(`getPersonDetails failed for ${id}:`, err.message);
    throw err;
  }
}


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

export async function loginUser(email, password) {
  const res = await fetch('http://4.237.58.241:3000/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  localStorage.setItem('cinefyra-token', data.token); // Save token
  return data;
}
