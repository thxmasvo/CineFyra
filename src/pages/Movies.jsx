import { useEffect, useState, useCallback } from 'react';
import { getMovies, getMovieDetails } from '../api';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import './movies.css';

import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export default function Movies() {
  const [initialMovies, setInitialMovies] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const enrichMovies = async (movies) => {
    return await Promise.all(
      movies.map(async (movie, i) => {
        await delay(i * 50); // stagger fetch
        try {
          const details = await getMovieDetails(movie.imdbID);
          return { ...movie, ...details };
        } catch {
          return movie;
        }
      })
    );
  };

  // First page load for curated sections
  useEffect(() => {
    const loadFirstPage = async () => {
      NProgress.start();
      try {
        const movies = await getMovies('', '', 1);
        const enriched = await enrichMovies(movies);
        setInitialMovies(enriched);
        setPage(2); // Infinite scroll starts at page 2
      } catch (e) {
        console.error('❌ Failed to load initial movies', e);
      } finally {
        NProgress.done();
      }
    };

    loadFirstPage();
  }, []);

  // Infinite scroll fetch
  const fetchNextPage = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    NProgress.start();

    try {
      const movies = await getMovies('', '', page);
      const enriched = await enrichMovies(movies);
      setAllMovies(prev => [...prev, ...enriched]);
      setPage(prev => prev + 1);
      if (movies.length < 100) setHasMore(false);
    } catch (err) {
      console.error('❌ Error loading more movies', err);
    } finally {
      setLoading(false);
      NProgress.done();
    }
  }, [page, loading, hasMore]);

  // Infinite scroll trigger
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        !loading
      ) {
        fetchNextPage();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchNextPage, loading]);

  // Top sections logic
  const normalizeGenres = (genres) => {
    if (Array.isArray(genres)) return genres.map(g => g.trim());
    if (typeof genres === 'string') return genres.split(',').map(g => g.trim());
    return [];
  };

  const topRated = initialMovies.filter(m => parseFloat(m.imdbRating) >= 7.6).slice(0, 10);
  const horror = initialMovies.filter(m => normalizeGenres(m.genres).includes('Horror')).slice(0, 10);
  const kids = initialMovies.filter(m => ['G', 'PG'].includes(m.classification)).slice(0, 10);

  const scrollRow = (id, dir) => {
    const container = document.getElementById(id);
    if (container) {
      container.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
    }
  };

  return (
    <div className="movies-page">
      <h1>Movie Explorer 🎬</h1>

      {initialMovies.length === 0 ? (
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
          {!hasMore && <p style={{ textAlign: 'center' }}>🎉 You’ve reached the end.</p>}
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
        <div className="scroll-buttons">
          <button onClick={() => scrollRow(rowId, 'left')}>&lt;</button>
          <button onClick={() => scrollRow(rowId, 'right')}>&gt;</button>
        </div>
      </div>
      <div className="movie-scroll-wrapper">
      <div className="scroll-buttons">
        <button onClick={() => scrollRow(rowId, 'left')}>&lt;</button>
        <button onClick={() => scrollRow(rowId, 'right')}>&gt;</button>
      </div>
      <div className="movie-scroll-row" id={rowId}>
        {movies.map((movie) => (
          <MovieCard key={movie.imdbID} movie={movie} poster={movie.poster} />
        ))}
      </div>
    </div>
    </div>
  );
}
