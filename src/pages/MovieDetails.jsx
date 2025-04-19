import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovieDetails } from '../api';
import Loader from '../components/Loader';
import '../Styles/MovieDetails.css';

export default function MovieDetails() {
  const { imdbID } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imdbID) return;

    const controller = new AbortController();
    const signal = controller.signal;
    let isCancelled = false;

    // Reset on mount
    setMovie(null);
    setLoading(true);
    setError(false);

    const fetchDetails = async () => {
      try {
        const data = await getMovieDetails(imdbID, signal);
        console.log('🧾 Raw movie data:', data);

        if (!isCancelled && data?.title) {
          setMovie(data);
        } else if (!isCancelled) {
          setError(true);
        }
      } catch (err) {
        if (!isCancelled && err.name !== 'AbortError') {
          console.error('❌ getMovieDetails failed:', err);
          setError(true);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchDetails();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [imdbID]);

  if (!imdbID) return null;
  if (loading) return <Loader />;
  if (error || !movie || !movie.title) {
    return <p className="error-message">🎥 Movie not found or failed to load.</p>;
  }

  const {
    title,
    plot,
    genres,
    ratings,
    poster,
    year,
    runtime,
    country,
    boxoffice,
    principals = [],
  } = movie;

  const getRating = (source) => {
    const sourceMap = {
      imdb: 'Internet Movie Database',
      rotten: 'Rotten Tomatoes',
      metacritic: 'Metacritic',
    };
    const target = sourceMap[source.toLowerCase()];
    const found = ratings?.find((r) => r.source === target);
    return found ? found.value : 'N/A';
  };

  const rottenRaw = getRating('rotten');
  const rottenClean = parseFloat(rottenRaw?.toString().replace('%', ''));
  const ringPercent = !isNaN(rottenClean) ? rottenClean : null;

  const formatCurrency = (value) =>
    typeof value === 'number' ? `$${value.toLocaleString()}` : 'N/A';

  return (
    <div className="details-container">
      <button onClick={() => navigate(-1)} className="back-button" style={{ marginTop: '70px' }}>
        ← Back
      </button>

      <div className="details-header">
        <img className="details-poster" src={poster} alt={`${title} poster`} />
        <div className="details-info">
          <h1>{title}</h1>
          <p className="plot">{plot}</p>
          <div className="meta">
            <p><strong>Released:</strong> {year}</p>
            <p><strong>Runtime:</strong> {runtime} mins</p>
            <p><strong>Country:</strong> {country}</p>
            <p><strong>Box Office:</strong> {formatCurrency(boxoffice)}</p>
          </div>

          <div className="genre-tags">
            {genres?.map((g, idx) => (
              <span key={idx} className={`tag genre-${g.toLowerCase()}`}>{g}</span>
            ))}
          </div>

          <div className="ratings-ring">
            <div className="ring">
              <div className="score-text">
                {ringPercent !== null ? rottenClean : 'N/A'}
              </div>
              <svg>
                <circle cx="30" cy="30" r="28" />
                <circle
                  cx="30"
                  cy="30"
                  r="28"
                  style={{
                    strokeDashoffset:
                      ringPercent !== null
                        ? 176 - (ringPercent / 100) * 176
                        : 176,
                  }}
                />
              </svg>
              <span className="ring-label">Rotten</span>
            </div>
            <div className="other-ratings">
              <p><strong>IMDb:</strong> {getRating('imdb')}</p>
              <p><strong>Metacritic:</strong> {getRating('metacritic')}</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="cast-heading">🎬 Cast & Crew</h2>
      <table className="cast-table">
        <thead>
          <tr>
            <th>Role</th>
            <th>Name</th>
            <th>Characters</th>
          </tr>
        </thead>
        <tbody>
          {principals.map((p, idx) => (
            <tr key={idx}>
              <td>{p.category}</td>
              <td>{p.name}</td>
              <td>{p.characters?.join(', ') || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
