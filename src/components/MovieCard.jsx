import { Link } from 'react-router-dom';
import { getMovieDetails } from '../api';
import '../Styles/MovieCard.css';

export default function MovieCard({ movie }) {
  return (
    <Link
      to={`/movies/${movie.imdbID}`}
      className="movie-card-link"
      onMouseEnter={() => {
        getMovieDetails(movie.imdbID).catch(() => {});
      }}
    >
      <div className="movie-card">
        <div className="poster-container">
          <img
            src={movie.poster}
            alt={`Poster for ${movie.title}`}
            className="movie-poster"
            onError={(e) => {
              e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/f/fc/No_picture_available.png';
            }}
          />
        </div>
        <div className="movie-info">
          <p className="movie-title">{movie.title}</p>
          <p className="movie-rating">IMDb: {movie.imdbRating || 'N/A'}</p>
        </div>
      </div>
    </Link>
  );
}
