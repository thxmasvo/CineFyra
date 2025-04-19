export function getMovies(title = '', year = '', page = 1, signal) {
  const baseUrl = 'http://4.237.58.241:3000/movies/search';
  const params = new URLSearchParams();
  if (title) params.append('title', title);
  if (year) params.append('year', year);
  params.append('page', page);

  return fetch(`${baseUrl}?${params.toString()}`, { signal })
    .then(res => {
      if (!res.ok) throw new Error(`Failed to fetch movies (${res.status})`);
      return res.json();
    })
    .then(res => res.data || []);
}

export function getMovieDetails(imdbID, signal) {
  return fetch(`http://4.237.58.241:3000/movies/data/${imdbID}`, { signal })
    .then(res => {
      if (res.status === 429) throw new Error('Too many requests');
      if (!res.ok) throw new Error('Failed to fetch details');
      return res.json();
    })
    .then(data => {
      if (!data || !data.title) throw new Error('Invalid movie data');
      return data;
    })
    .catch(err => {
      console.error(`getMovieDetails failed for ${imdbID}:`, err.message);
      return {}; // fallback
    });
}
