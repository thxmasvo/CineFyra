import { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { InfiniteRowModelModule } from 'ag-grid-community';
import { getMovies, getMovieDetails } from '../api';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import '../Styles/Movies.css';

ModuleRegistry.registerModules([InfiniteRowModelModule]);

const MAX_CONCURRENT = 4;
const MAX_RESULTS_PER_PAGE = 10;

export default function MoviesGrid() {
  const gridRef = useRef();
  const enrichedCache = useRef(new Map());
  const navigate = useNavigate();

  const [searchTitle, setSearchTitle] = useState('');
  const [debouncedTitle, setDebouncedTitle] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedTitle(searchTitle), 300);
    return () => clearTimeout(handler);
  }, [searchTitle]);

const columnDefs = useMemo(() => [
  { headerName: 'Title', field: 'title', flex: 2,  maxWidth: 600},
  { headerName: 'Year', field: 'year', width: 100 },
  {
    headerName: 'Rated',
    field: 'classification',
    width: 100,
    valueGetter: (params) => params.data?.classification || 'N/A',
  },
  {
    headerName: 'IMDb',
    field: 'imdbRating',
    width: 100,
    valueGetter: (params) => params.data?.imdbRating ?? 'N/A',
  },
  {
    headerName: 'Rotten',
    field: 'rottenTomatoesRating',
    width: 100,
    valueGetter: (params) => params.data?.rottenTomatoesRating ?? 'N/A',
  },
  {
    headerName: 'Metacritic',
    field: 'metacriticRating',
    width: 100,
    valueGetter: (params) => params.data?.metacriticRating ?? 'N/A',
  }
], []);


  const datasource = useMemo(() => ({
    async getRows(params) {
      const { startRow, endRow } = params;
      const pageNum = Math.floor(startRow / MAX_RESULTS_PER_PAGE) + 1;
      NProgress.start();

      try {
        const raw = await getMovies(debouncedTitle, selectedYear || '', pageNum);
        if (!raw || raw.length === 0) {
          params.successCallback([], startRow);
          return;
        }

        const movies = Array.from(new Map(raw.map(m => [m.imdbID, m])).values());

        const enriched = await Promise.all(
          movies.map(async (movie) => {
            if (enrichedCache.current.has(movie.imdbID)) {
              return enrichedCache.current.get(movie.imdbID);
            }
            try {
              const details = await getMovieDetails(movie.imdbID);
              const full = { ...movie, ...details };
              enrichedCache.current.set(movie.imdbID, full);
              await delay(100);
              return full;
            } catch {
              return movie;
            }
          })
        );

        console.log('📦 Enriched Sample:', enriched[0]);

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

        const slice = filtered.slice(0, endRow - startRow);
        const lastRow = filtered.length < MAX_RESULTS_PER_PAGE ? startRow + slice.length : undefined;
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

    {/* ➕ Centered container */}
    <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '3rem' }}>
      <div
        className="ag-theme-quartz"
        style={{
          height: '80vh',
          maxWidth: '55vw',
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
          onRowClicked={(e) => navigate(`/movies/${e.data.imdbID}`)}
        />
      </div>
    </div>
  </div>
);

}
