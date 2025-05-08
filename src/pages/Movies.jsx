import { useEffect, useState, useCallback, useRef } from 'react';
import { getMovies, getMovieDetails } from '../api';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import '../Styles/Movies.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const DEBOUNCE_DELAY = 500;
const MAX_CONCURRENT = 4;
const MAX_SEARCH_RESULTS = 10;
const MIN_FETCH_DURATION = 1000;

export default function Movies() {
  const [searchTitle, setSearchTitle] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [curatedMovies, setCuratedMovies] = useState([]);
  const [searchPage, setSearchPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const enrichedCache = useRef(new Map());
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const requestIdRef = useRef(0);
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const fetchMoviesWithEnrichment = async (title = '', pageNum = 1, shouldAbort = () => false, limit = null) => {
    const baseMovies = await getMovies(title, '', pageNum);
    let filtered = title
      ? baseMovies.filter(m => m.title?.toLowerCase().includes(title.toLowerCase()))
      : baseMovies;
    if (limit) filtered = filtered.slice(0, limit);

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
          await delay(200);
          const details = await getMovieDetails(movie.imdbID);
          const full = { ...movie, ...details };
          enrichedCache.current.set(movie.imdbID, full);
          enriched.push(full);
        } catch {
          enriched.push(movie);
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
    const currentRequestId = ++requestIdRef.current;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const startTime = Date.now();
      NProgress.start();
      setLoading(true);

      try {
        if (title.trim()) {
          setSearchPage(2);
          const enriched = await fetchMoviesWithEnrichment(title, 1, shouldAbort, MAX_SEARCH_RESULTS);
          const elapsed = Date.now() - startTime;
          if (elapsed < MIN_FETCH_DURATION) await delay(MIN_FETCH_DURATION - elapsed);
          if (!shouldAbort() && currentRequestId === requestIdRef.current) {
            setSearchResults(enriched);
            setCuratedMovies([]);
            setHasMore(enriched.length >= MAX_SEARCH_RESULTS);
          }
        } else {
          const enriched = await fetchMoviesWithEnrichment('', 1, shouldAbort);
          if (!shouldAbort() && currentRequestId === requestIdRef.current) {
            setCuratedMovies(enriched);
            setSearchResults([]);
            setHasMore(true);
          }
        }
      } catch (err) {
        if (!shouldAbort()) console.error('❌ Load failed', err);
      } finally {
        if (!shouldAbort() && currentRequestId === requestIdRef.current) {
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

  const fetchNextSearchPage = useCallback(async () => {
    if (!searchTitle.trim() || loading || !hasMore) return;
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    NProgress.start();

    try {
      const enriched = await fetchMoviesWithEnrichment(searchTitle, searchPage);
      if (requestIdRef.current === currentRequestId) {
        setSearchResults(prev => [...prev, ...enriched]);
        setSearchPage(prev => prev + 1);
        if (enriched.length < MAX_SEARCH_RESULTS) setHasMore(false);
      }
    } catch (err) {
      console.error('❌ Search pagination failed', err);
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
        NProgress.done();
      }
    }
  }, [searchTitle, searchPage, loading, hasMore]);

  useEffect(() => {
    const handleScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;
      if (!nearBottom || loading) return;
      if (searchTitle.trim()) fetchNextSearchPage();
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchNextSearchPage, loading, searchTitle]);

  const normalizeGenres = (genres) =>
    Array.isArray(genres) ? genres.map(g => g.trim()) :
    typeof genres === 'string' ? genres.split(',').map(g => g.trim()) : [];

  const applySortAndFilter = useCallback((movies) => {
    let filtered = [...movies];
    if (selectedYear) {
      filtered = filtered.filter(m => String(m.year) === selectedYear);
    }

    switch (sortOption) {
      case 'az': filtered.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'za': filtered.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'rating': filtered.sort((a, b) => parseFloat(b.imdbRating || 0) - parseFloat(a.imdbRating || 0)); break;
      case 'year': filtered.sort((a, b) => b.year - a.year); break;
      default: break;
    }

    return filtered;
  }, [sortOption, selectedYear]);

  const topRated = curatedMovies.filter(m => parseFloat(m.imdbRating) >= 7.6).slice(0, 10);
  const horror = curatedMovies.filter(m => normalizeGenres(m.genres).includes('Horror')).slice(0, 10);
  const kids = curatedMovies.filter(m => ['G', 'PG'].includes(m.classification)).slice(0, 10);
  const displayedSearchResults = applySortAndFilter(searchResults);

  const scrollRow = (id, dir) => {
    const container = document.getElementById(id);
    if (container) container.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
  };

  return (
    <div className="movies-page">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          className="search-input"
        />
        {searchTitle.trim() !== '' && (
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
          </div>
        )}
      </div>

      <h1>Movie Explorer 🎬</h1>

      {searchTitle.trim() !== '' ? (
        <>
          {displayedSearchResults.length === 0 && !loading ? (
            <p style={{ textAlign: 'center', marginTop: '2rem' }}>
              🔍 No results found for "{searchTitle}"
            </p>
          ) : (
            <div className="movie-grid">
              {displayedSearchResults.map((movie) => (
                <MovieCard key={movie.imdbID} movie={movie} poster={movie.poster} />
              ))}
            </div>
          )}
          {loading && <Loader />}
        </>
      ) : (
        <div className="movies-content">
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
              <div className="update-section">
                <div className="emoji">👋</div>
                <p>Didn't find something to watch yet? We got you. Try one of these options instead:</p>
                <div className="update-buttons">
                  <button onClick={() => {
                    window.location.href = '/movies-grid';
                    setSearchTitle('');
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }}>
                    Browse and filter
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MovieRow({ title, rowId, movies, scrollRow }) {
  return (
    <div className="section">
      <div className="row-header"><h2>{title}</h2></div>
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
