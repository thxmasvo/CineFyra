    import { Link } from 'react-router-dom';
    import '../Styles/MovieCardText.css';

    export default function MovieCardText({ movie }) {
      return (
        <Link to={`/movies/${movie.imdbID}`} className="movie-card-text-link">
          <div className="movie-card-text">
            <h3 className="movie-title">{movie.title}</h3>
            <p><strong>IMDb:</strong> {movie.imdbRating ?? 'N/A'}</p>
            <p><strong>Rotten Tomatoes:</strong> {movie.rottenTomatoesRating ?? 'N/A'}</p>
            <p><strong>Metacritic:</strong> {movie.metacriticRating ?? 'N/A'}</p>
            <p><strong>Rated:</strong> {movie.classification ?? 'N/A'}</p>
          </div>
        </Link>
      );
    }
