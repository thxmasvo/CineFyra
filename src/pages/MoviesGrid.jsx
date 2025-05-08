import { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { InfiniteRowModelModule } from 'ag-grid-community';
import { getBasicMovies } from '../api';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import '../Styles/Movies.css';

ModuleRegistry.registerModules([InfiniteRowModelModule]);

const MAX_RESULTS_PER_PAGE = 10;

export default function MoviesGrid() {
  const gridRef = useRef();
  const navigate = useNavigate();

  const [searchTitle, setSearchTitle] = useState('');
  const [debouncedTitle, setDebouncedTitle] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [emptyResult, setEmptyResult] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedTitle(searchTitle), 300);
    return () => clearTimeout(handler);
  }, [searchTitle]);

  const columnDefs = useMemo(() => [
    { headerName: 'Title', field: 'title', flex: 2, maxWidth: 600 },
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
        const raw = await getBasicMovies(debouncedTitle, selectedYear, pageNum);
        if (!raw || raw.length === 0) {
          setEmptyResult(true);
          params.successCallback([], startRow);
          return;
        }

        const filtered = raw.filter(movie => {
          if (!selectedRating) return true;
          const rating = parseFloat(movie.imdbRating);
          if (isNaN(rating)) return false;
          const [min, max] = selectedRating.split('-').map(Number);
          return rating >= min && rating <= max;
        });

        if (filtered.length === 0 && pageNum === 1) {
          setEmptyResult(true);
        } else {
          setEmptyResult(false);
        }

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
  }), [debouncedTitle, selectedYear, selectedRating]);

  useEffect(() => {
    setEmptyResult(false);
    if (gridRef.current?.api) {
      gridRef.current.api.purgeInfiniteCache();
    }
  }, [debouncedTitle, selectedYear, selectedRating]);

  return (
   <div
        style={{
          backgroundColor: 'var(--bg-dark)',
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

          <a href="/movies-all" className="btn-outline" style={{ marginLeft: 'auto' }}>
            Switch to Card View
          </a>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '1rem' }}>
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

      {emptyResult && (
        <div style={{ textAlign: 'center', marginTop: '-1rem', color: '#ccc' }}>
          ❌ No movies found with the selected filters.
        </div>
      )}
    </div>
  );
}
