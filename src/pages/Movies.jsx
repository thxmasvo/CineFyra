import { useEffect, useState, useCallback, useRef } from 'react';
import { getMovies, getMovieDetails } from '../api';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import './movies.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const DEBOUNCE_DELAY = 500;
const MAX_CONCURRENT = 4;
const MAX_SEARCH_RESULTS = 20;

export default function Movies() {
  const [searchTitle, setSearchTitle] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [curatedMovies, setCuratedMovies] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const enrichedCache = useRef(new Map());
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const fetchMoviesWithEnrichment = async (title = '', pageNum = 1, shouldAbort = () => false, limit = null) => {
    const baseMovies = await getMovies(title, '', pageNum);
    let filtered = baseMovies;

    if (title) {
      filtered = baseMovies.filter(m =>
        m.title?.toLowerCase().includes(title.toLowerCase())
      );
      if (limit) filtered = filtered.slice(0, limit);
    }

    let i = 0;
    const enriched = [];

    const workers = new Array(MAX_CONCURRENT).fill(0).map(async () => {
      while (i < filtered.length && !shouldAbort()) {
        const idx = i++;
        const movie = filtered[idx];

        if (enrichedCache.current.has(movie.imdbID)) {
          enriched.push(enrichedCache.current.get(movie.imdbID));
          continue;
        }

        try {
          const details = await getMovieDetails(movie.imdbID);
          const full = { ...movie, ...details };
          enrichedCache.current.set(movie.imdbID, full);
          enriched.push(full);
        } catch {
          enriched.push(movie); // fallback
        }
      }
    });

    await Promise.all(workers);
    return enriched;
  };

  const loadInitial = useCallback((title) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const shouldAbort = () => abortRef.current.signal.aborted;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      NProgress.start();
      setLoading(true);
      try {
        if (title.trim()) {
          const enriched = await fetchMoviesWithEnrichment(title, 1, shouldAbort, MAX_SEARCH_RESULTS);
          if (!shouldAbort()) {
            setSearchResults(enriched);
            setCuratedMovies([]);
            setAllMovies([]);
            setHasMore(false);
          }
        } else {
          const enriched = await fetchMoviesWithEnrichment('', 1, shouldAbort);
          if (!shouldAbort()) {
            setCuratedMovies(enriched);
            setSearchResults([]);
            setAllMovies([]);
            setPage(2);
            setHasMore(true);
          }
        }
      } catch (err) {
        if (!shouldAbort()) console.error('❌ Load failed', err);
      } finally {
        if (!shouldAbort()) {
          setLoading(false);
          NProgress.done();
        }
      }
    }, DEBOUNCE_DELAY);
  }, []);

  useEffect(() => {
    loadInitial(searchTitle);
    return () => abortRef.current?.abort();
  }, [searchTitle, loadInitial]);

  const fetchNextPage = useCallback(async () => {
    if (loading || !hasMore || searchTitle.trim()) return;
    setLoading(true);
    NProgress.start();

    try {
      const enriched = await fetchMoviesWithEnrichment('', page);
      setAllMovies(prev => [...prev, ...enriched]);
      setPage(prev => prev + 1);
      if (enriched.length < 100) setHasMore(false);
    } catch (err) {
      console.error('❌ Pagination load failed', err);
    } finally {
      setLoading(false);
      NProgress.done();
    }
  }, [page, loading, hasMore, searchTitle]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loading) {
        fetchNextPage();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchNextPage, loading]);

  const normalizeGenres = (genres) => {
    if (Array.isArray(genres)) return genres.map(g => g.trim());
    if (typeof genres === 'string') return genres.split(',').map(g => g.trim());
    return [];
  };

  const topRated = curatedMovies.filter(m => parseFloat(m.imdbRating) >= 7.6).slice(0, 10);
  const horror = curatedMovies.filter(m => normalizeGenres(m.genres).includes('Horror')).slice(0, 10);
  const kids = curatedMovies.filter(m => ['G', 'PG'].includes(m.classification)).slice(0, 10);

  const scrollRow = (id, dir) => {
    const container = document.getElementById(id);
    if (container) container.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
  };

  return (
    <div className="movies-page">
      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          className="search-input"
        />
      </div>

      <h1>Movie Explorer 🎬</h1>

      {searchTitle.trim() !== '' ? (
        <>
          {searchResults.length === 0 && !loading ? (
            <p style={{ textAlign: 'center', marginTop: '2rem' }}>
              🔍 No results found for "{searchTitle}"
            </p>
          ) : (
            <div className="movie-grid">
              {searchResults.map((movie) => (
                <MovieCard key={movie.imdbID} movie={movie} poster={movie.poster} />
              ))}
            </div>
          )}
          {loading && <Loader />}
        </>
      ) : (
        <>
          {loading && curatedMovies.length === 0 ? (
            <Loader />
          ) : (
            <>
              {topRated.length > 0 && (
                <MovieRow title="🎯 Top Rated" rowId="top" movies={topRated} scrollRow={scrollRow} />
              )}
              {horror.length > 0 && (
                <MovieRow title="👻 Horror" rowId="horror" movies={horror} scrollRow={scrollRow} />
              )}
              {kids.length > 0 && (
                <MovieRow title="👶 Children’s Picks" rowId="kids" movies={kids} scrollRow={scrollRow} />
              )}

              <h2 style={{ marginTop: '3rem' }}>All Movies (Scroll to Load More)</h2>
              <div className="movie-grid">
                {allMovies.map((movie) => (
                  <MovieCard key={movie.imdbID} movie={movie} poster={movie.poster} />
                ))}
              </div>

              {loading && <Loader />}
              {!hasMore && allMovies.length > 0 && (
                <p style={{ textAlign: 'center' }}>🎉 You’ve reached the end.</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function MovieRow({ title, rowId, movies, scrollRow }) {
  return (
    <div className="section">
      <div className="row-header">
        <h2>{title}</h2>
      </div>
      <div className="movie-scroll-wrapper">
        <div className="movie-scroll-row" id={rowId}>
          {movies.map((movie) => (
            <MovieCard key={movie.imdbID} movie={movie} poster={movie.poster} />
          ))}
        </div>
        <button className="scroll-button left" onClick={() => scrollRow(rowId, 'left')}>&lt;</button>
        <button className="scroll-button right" onClick={() => scrollRow(rowId, 'right')}>&gt;</button>
      </div>
    </div>
  );
}
