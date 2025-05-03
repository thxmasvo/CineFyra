import { Link } from 'react-router-dom';
import { getMovieDetails } from '../api';
import '../Styles/MovieCard.css';

export default function MovieCard({ movie, poster }) {
  return (
    <Link
      to={`/movies/${movie.imdbID}`}
      className="movie-card-link"
      // Preload movie details on hover for smoother navigation
      onMouseEnter={() => {
        getMovieDetails(movie.imdbID).catch(() => {});
      }}
    >
      <div className="movie-card">
        <div className="poster-container">
          <img
            src={poster}
            alt={movie.title}
            className="movie-poster"
            // Fallback image for broken poster URLs
            onError={(e) => {
              e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/f/fc/No_picture_available.png';
            }}
          />
        </div>
        <div className="movie-info">
          <p style={{ fontWeight: 'bold' }}>{movie.title}</p>
          <p>IMDb: {movie.imdbRating || 'N/A'}</p>
        </div>
      </div>
    </Link>
  );
}
