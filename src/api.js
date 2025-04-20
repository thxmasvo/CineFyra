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
