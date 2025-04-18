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
  
  export function getMovieDetails(imdbID) {
    return fetch(`http://4.237.58.241:3000/movies/data/${imdbID}`)
      .then((res) => res.json());
  }