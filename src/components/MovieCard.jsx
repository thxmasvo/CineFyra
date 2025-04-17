import './MovieCard.css';

export default function MovieCard({ movie, poster }) {
  return (
    <div className="movie-card">
      {poster ? (
        <img src={poster} alt={`${movie.title} poster`} className="movie-poster" loading="lazy" />
      ) : (
        <div className="movie-poster loading">Loading...</div>
      )}
      <div className="movie-info">
        <h3>{movie.title}</h3>
        <p>IMDb: {movie.imdbRating}</p>
      </div>
    </div>
  );
}
