import { useEffect, useState, useCallback, useRef } from 'react';
import { getEnrichedMovies } from '../api';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import '../Styles/Movies.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const MAX_RESULTS_PER_PAGE = 10;

export default function MoviesAll() {
  const [searchTitle, setSearchTitle] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [allResults, setAllResults] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const requestIdRef = useRef(0);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    NProgress.start();

    try {
      const enriched = await getEnrichedMovies(searchTitle, page);
      const filtered = enriched.filter(movie => {
        let yearMatch = true;
        let genreMatch = true;

        if (selectedYear) {
          yearMatch = String(movie.year) === selectedYear;
        }

        if (selectedGenre) {
          const genres = Array.isArray(movie.genres)
            ? movie.genres
            : typeof movie.genres === 'string'
            ? movie.genres.split(',').map(g => g.trim())
            : [];
          genreMatch = genres.includes(selectedGenre);
        }

        return yearMatch && genreMatch;
      });

      if (requestIdRef.current === currentRequestId) {
        setAllResults(prev => [...prev, ...filtered]);
        setPage(prev => prev + 1);
        if (filtered.length < MAX_RESULTS_PER_PAGE) setHasMore(false);
      }
    } catch (err) {
      console.error('❌ Load failed', err);
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setLoading(false);
        NProgress.done();
      }
    }
  }, [searchTitle, selectedYear, selectedGenre, page, loading, hasMore]);

  useEffect(() => {
    const onScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;
      if (nearBottom && !loading) loadMore();
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [loadMore, loading]);

  useEffect(() => {
    setAllResults([]);
    setPage(1);
    setHasMore(true);
    loadMore();
  }, [searchTitle, selectedYear, sortOption, selectedGenre]);

  const applySort = useCallback((movies) => {
    let sorted = [...movies];
    switch (sortOption) {
      case 'az': sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'za': sorted.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'rating': sorted.sort((a, b) => parseFloat(b.imdbRating || 0) - parseFloat(a.imdbRating || 0)); break;
      case 'year': sorted.sort((a, b) => b.year - a.year); break;
      default: break;
    }
    return sorted;
  }, [sortOption]);

  const displayedResults = applySort(allResults);

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
        <div className="filters-row">
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="filter-select">
            <option value="">Any Year</option>
            {Array.from({ length: 2023 - 1990 + 1 }, (_, i) => 1990 + i).reverse().map((year) => (
              <option key={year} value={String(year)}>{year}</option>
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

      <div className="movie-grid">
        {displayedResults.map(movie => (
          <MovieCard key={movie.imdbID} movie={movie} />
        ))}
      </div>

      {loading && <Loader />}
      {!hasMore && !loading && displayedResults.length > 0 && (
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>🎉 You've reached the end!</p>
      )}
    </div>
  );
}
