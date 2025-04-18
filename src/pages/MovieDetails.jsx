import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMovieDetails } from '../api';
import Loader from '../components/Loader';
import '../Styles/MovieDetails.css';

export default function MovieDetails() {
  const { imdbID } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getMovieDetails(imdbID);
        setMovie(data);
      } catch (error) {
        console.error('❌ Failed to load movie details', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [imdbID]);

  if (loading) return <Loader />;
  if (!movie) return <p className="error-message">Movie not found</p>;

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
     metacritic: 'Metacritic'
   };

   const target = sourceMap[source.toLowerCase()];
   const found = ratings?.find((r) => r.source === target);
   return found ? found.value : 'N/A';
 };

  const formatCurrency = (value) =>
    value ? `$${value.toLocaleString()}` : 'N/A';

  // Extract Rotten Tomatoes rating as a percentage number
  const rottenRaw = getRating('rotten'); // e.g., "96" or "96%"
  const rottenClean = parseFloat(rottenRaw?.toString().replace('%', ''));
  const ringPercent = !isNaN(rottenClean) ? rottenClean : null;

  return (
    <div className="details-container">
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

          {/* 🔄 Rotten Tomatoes in Score Ring */}
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
                    strokeDashoffset: ringPercent !== null
                      ? 176 - (ringPercent / 100) * 176
                      : 176
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
