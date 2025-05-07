// Dependencies and components
import { useEffect, useState, useCallback, useRef } from 'react';
import { getMovies, getMovieDetails } from '../api';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import '../Styles/Movies.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Config
const MAX_CONCURRENT = 8;
const MAX_RESULTS_PER_PAGE = 10;

export default function MoviesAll() {
  // State hooks for filters and results
  const [searchTitle, setSearchTitle] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [allResults, setAllResults] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Control refs
  const enrichedCache = useRef(new Map());
  const requestIdRef = useRef(0);

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  // Fetch movies + enrich with detailed data
  const fetchMoviesWithEnrichment = async (title = '', year = '', pageNum = 1, genre = '') => {
    const baseMovies = await getMovies(title, year, pageNum);
    let filtered = genre ? baseMovies.filter(m => m.genres?.includes(genre)) : baseMovies;

    let i = 0;
    const enriched = [];

    const workers = new Array(MAX_CONCURRENT).fill(0).map(async () => {
      while (i < filtered.length) {
        const idx = i++;
        const movie = filtered[idx];

        if (enrichedCache.current.has(movie.imdbID)) {
          enriched.push(enrichedCache.current.get(movie.imdbID));
          continue;
        }

        try {
          await delay(200); // prevent API overload
          const details = await getMovieDetails(movie.imdbID);
          const full = { ...movie, ...details };
          enrichedCache.current.set(movie.imdbID, full);
          enriched.push(full);
        } catch {
          enriched.push(movie); // fallback on failure
        }
      }
    });

    await Promise.all(workers);
    return enriched;
  };

  // Load paginated movies
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    NProgress.start();

    try {
      const enriched = await fetchMoviesWithEnrichment(searchTitle, selectedYear, page, selectedGenre);
      if (requestIdRef.current === currentRequestId) {
        setAllResults(prev => [...prev, ...enriched]);
        setPage(prev => prev + 1);
        if (enriched.length < MAX_RESULTS_PER_PAGE) setHasMore(false);
      }
    } catch (err) {
      console.error('❌ Load failed', err);
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
        NProgress.done();
      }
    }
  }, [searchTitle, selectedYear, page, selectedGenre, loading, hasMore]);

  // Infinite scroll
  useEffect(() => {
    const onScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;
      if (nearBottom && !loading) loadMore();
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [loadMore, loading]);

  // Reset on filter change
  useEffect(() => {
    setAllResults([]);
    setPage(1);
    setHasMore(true);
    loadMore();
  }, [searchTitle, selectedYear, sortOption, selectedGenre]);

  // Sort after enrichment
  const applySortAndFilter = useCallback((movies) => {
    let filtered = [...movies];

    switch (sortOption) {
      case 'az': filtered.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'za': filtered.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'rating': filtered.sort((a, b) => parseFloat(b.imdbRating || 0) - parseFloat(a.imdbRating || 0)); break;
      case 'year': filtered.sort((a, b) => b.year - a.year); break;
      default: break;
    }

    return filtered;
  }, [sortOption]);

  const displayedResults = applySortAndFilter(allResults);

  return (
    <div className="movies-page">
      {/* Search and filter panel */}
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
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="filter-select">
            <option value="">Sort</option>
            <option value="az">A–Z</option>
            <option value="za">Z–A</option>
            <option value="rating">IMDb Rating</option>
            <option value="year">Year</option>
          </select>

          <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="filter-select">
            <option value="">All Genres</option>
            <option value="Action">Action</option>
            <option value="Drama">Drama</option>
            <option value="Horror">Horror</option>
            <option value="Comedy">Comedy</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Romance">Romance</option>
            <option value="Thriller">Thriller</option>
            <option value="Crime">Crime</option>
          </select>

            <a href="/movies-grid" className="btn-outline" style={{ marginLeft: 'auto' }}>
              Switch to Grid View
            </a>
        </div>
      </div>



      <h1>All Movies 🎞️</h1>

      {/* Grid render */}
      <div className="movie-grid">
        {displayedResults.map((movie) => (
          <MovieCard key={movie.imdbID} movie={movie} poster={movie.poster} />
        ))}
      </div>

      {/* Loading + end of scroll */}
      {loading && <Loader />}
      {!hasMore && !loading && displayedResults.length > 0 && (
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>🎉 You've reached the end!</p>
      )}
    </div>
  );
}
