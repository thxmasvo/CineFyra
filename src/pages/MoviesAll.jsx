import { useEffect, useState, useRef, useCallback } from 'react';
import { getBasicMovies } from '../api';
import MovieCardText from '../components/MovieCardText';
import Loader from '../components/Loader';
import '../Styles/Movies.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const MAX_RESULTS_PER_PAGE = 10;

export default function MoviesAll() {
  const [searchTitle, setSearchTitle] = useState('');
  const [debouncedTitle, setDebouncedTitle] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [emptyResult, setEmptyResult] = useState(false);

  const observer = useRef();

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedTitle(searchTitle), 300);
    return () => clearTimeout(handler);
  }, [searchTitle]);

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    setEmptyResult(false);
  }, [debouncedTitle, selectedYear, selectedRating]);

  useEffect(() => {
    const fetchMovies = async () => {
      NProgress.start();
      try {
        const data = await getBasicMovies(debouncedTitle, selectedYear, page);
        let filtered = data;

        if (selectedRating) {
          const [min, max] = selectedRating.split('-').map(Number);
          filtered = data.filter(m => {
            const rating = parseFloat(m.imdbRating);
            return !isNaN(rating) && rating >= min && rating <= max;
          });
        }

        if (filtered.length === 0 && page === 1) setEmptyResult(true);
        else setEmptyResult(false);

        setMovies(prev => [...prev, ...filtered]);
        if (filtered.length < MAX_RESULTS_PER_PAGE) setHasMore(false);
      } catch (err) {
        console.error('❌ Failed to load movies:', err);
        setHasMore(false);
      } finally {
        NProgress.done();
      }
    };

    fetchMovies();
  }, [debouncedTitle, selectedYear, selectedRating, page]);

  const lastMovieRef = useCallback(node => {
    if (!hasMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setPage(prev => prev + 1);
    });
    if (node) observer.current.observe(node);
  }, [hasMore]);

  return (
   <div
     style={{
       backgroundColor: 'var(--bg-dark)', // instead of #121212
       minHeight: '100vh',
       color: 'var(--text-light)',
     }}
   >
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          className="search-input"
        />

        <div className="filters-row">
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="filter-select">
            <option value="">Any Year</option>
            {Array.from({ length: 2023 - 1990 + 1 }, (_, i) => 1990 + i).reverse().map((year) => (
              <option key={year} value={String(year)}>{year}</option>
            ))}
          </select>

          <select value={selectedRating} onChange={(e) => setSelectedRating(e.target.value)} className="filter-select">
            <option value="">All Ratings</option>
            <option value="1-3">1–3</option>
            <option value="4-5">4–5</option>
            <option value="6-7">6–7</option>
            <option value="8-9">8–9</option>
            <option value="9-10">9–10</option>
          </select>

          <a href="/movies-grid" className="btn-outline" style={{ marginLeft: 'auto' }}>
            Switch to Grid View
          </a>
        </div>
      </div>

      <div className="movie-card-grid">
        {movies.map((movie, i) => (
          <div key={movie.imdbID} ref={i === movies.length - 1 ? lastMovieRef : null}>
            <MovieCardText movie={movie} />
          </div>
        ))}
      </div>

      {emptyResult && (
        <div style={{ textAlign: 'center', color: '#ccc', paddingTop: '1rem' }}>
          ❌ No movies found with the selected filters.
        </div>
      )}

      {hasMore && <Loader />}
    </div>
  );
}
