import { useMemo, useRef, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { InfiniteRowModelModule } from 'ag-grid-community';
import { getMovies, getMovieDetails } from '../api';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import '../Styles/Movies.css';

ModuleRegistry.registerModules([InfiniteRowModelModule]);

const MAX_CONCURRENT = 8;
const MAX_RESULTS_PER_PAGE = 10;
const MAX_PAGES_TO_FETCH = 30;

export default function MoviesGrid() {
  const gridRef = useRef();
  const enrichedCache = useRef(new Map());

  const [searchTitle, setSearchTitle] = useState('');
  const [debouncedTitle, setDebouncedTitle] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedTitle(searchTitle), 400);
    return () => clearTimeout(handler);
  }, [searchTitle]);

  const columnDefs = useMemo(() => [
    { headerName: 'Title', field: 'title', flex: 2 },
    { headerName: 'Year', field: 'year', width: 100 },
    { headerName: 'IMDb Rating', field: 'imdbRating', width: 120 },
    { headerName: 'Genre', field: 'genres', flex: 2 },
  ], []);

  const datasource = useMemo(() => ({
    async getRows(params) {
      const { startRow } = params;
      NProgress.start();

      try {
        let allMovies = [];
        let currentPage = 1;

        while (allMovies.length < MAX_RESULTS_PER_PAGE * 3 && currentPage <= MAX_PAGES_TO_FETCH) {
          const raw = await getMovies(debouncedTitle, selectedYear || '', currentPage);
          if (!raw || raw.length === 0) break;
          allMovies.push(...raw);
          currentPage++;
        }

        const enriched = [];
        let i = 0;

        const workers = new Array(MAX_CONCURRENT).fill(0).map(async () => {
          while (i < allMovies.length) {
            const idx = i++;
            const movie = allMovies[idx];

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
            } catch (err) {
              enriched.push(movie);
            }
          }
        });

        await Promise.all(workers);

        const filtered = enriched.filter((movie) => {
          let genreMatch = true;
          let yearMatch = true;

          if (selectedGenre) {
            const genres = movie.genres;
            if (!genres) genreMatch = false;
            else if (Array.isArray(genres)) {
              genreMatch = genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase());
            } else if (typeof genres === 'string') {
              genreMatch = genres.toLowerCase().split(',').map(g => g.trim()).includes(selectedGenre.toLowerCase());
            }
          }

          if (selectedYear) {
            const year = movie.year;
            yearMatch = String(year) === selectedYear;
          }

          return genreMatch && yearMatch;
        });

        const slice = filtered.slice(0, MAX_RESULTS_PER_PAGE);
        const lastRow = slice.length < MAX_RESULTS_PER_PAGE ? startRow + slice.length : undefined;
        params.successCallback(slice, lastRow);
      } catch (err) {
        console.error('❌ Grid load failed:', err);
        params.failCallback();
      } finally {
        NProgress.done();
      }
    }
  }), [debouncedTitle, selectedYear, selectedGenre]);

  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.purgeInfiniteCache();
    }
  }, [debouncedTitle, selectedYear, selectedGenre]);

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#f0f0f0' }}>
      {/* Search + Filters */}
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
          <a href="/movies-all" className="btn-outline" style={{ marginLeft: 'auto' }}>
            Switch to Card View
          </a>
        </div>
      </div>

      <div
        className="ag-theme-quartz"
        style={{
          height: '80vh',
          width: '100%',
          padding: '2rem',
          backgroundColor: '#121212',
          borderRadius: '12px',
        }}
      >
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowModelType="infinite"
          datasource={datasource}
          cacheBlockSize={MAX_RESULTS_PER_PAGE}
          maxBlocksInCache={10}
          animateRows
          rowHeight={60}
        />
      </div>
    </div>
  );
}
