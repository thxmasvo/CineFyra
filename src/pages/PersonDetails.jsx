import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPersonDetails, getMovieDetails } from '../api';
import { isLoggedIn } from '../utils/auth';
import Loader from '../components/Loader';
import '../Styles/PersonDetails.css';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale);

export default function PersonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scrollRef = useRef();

  useEffect(() => {
    if (!isLoggedIn()) return;

    const fetchPerson = async () => {
      try {
        const data = await getPersonDetails(id);

        const enrichedRoles = await Promise.all(
          data.roles.map(async (r) => {
            let poster = '';
            try {
              const movieData = await getMovieDetails(r.movieId);
              poster = movieData.poster || '';
            } catch {
              poster = '';
            }
            return {
              ...r,
              imdbID: r.movieId,
              poster,
            };
          })
        );

        setPerson({ ...data, roles: enrichedRoles });
      } catch (err) {
        setError(err.message || 'Failed to load person.');
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [id]);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = 800; // Adjust scroll amount if needed
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!isLoggedIn()) {
    return <div className="person-container"><h2>Please log in to view person details.</h2></div>;
  }
  if (loading) return <Loader />;
  if (error || !person) {
    return <p className="error-message">❌ {error || 'Person not found'}</p>;
  }

  const { name, birthYear, deathYear, roles } = person;

  const ratingBuckets = {
    '0–4': 0,
    '4–6': 0,
    '6–8': 0,
    '8–10': 0,
  };

  roles.forEach(role => {
    const rating = parseFloat(role.imdbRating);
    if (!isNaN(rating)) {
      if (rating < 4) ratingBuckets['0–4']++;
      else if (rating < 6) ratingBuckets['4–6']++;
      else if (rating < 8) ratingBuckets['6–8']++;
      else ratingBuckets['8–10']++;
    }
  });

  const chartData = {
    labels: Object.keys(ratingBuckets),
    datasets: [{
      label: 'Number of Movies',
      data: Object.values(ratingBuckets),
      backgroundColor: '#7c3aed',
    }],
  };

  return (
    <div className="person-container">
      <button onClick={() => navigate(-1)} className="back-button">← Back</button>
      <h1>{name}</h1>
      <p style={{ color: '#ccc' }}>Born in {birthYear || 'Unknown'}</p>
      {deathYear && <p style={{ color: '#ccc' }}>Died in {deathYear}</p>}

      <div className="role-section">
        <h2>Movie Roles</h2>
         <p className="roles-count">Played in {roles.length} roles</p>
          <div className="scroll-wrapper">
            <button className="scroll-btn left" onClick={() => scroll('left')}>&lt;</button>
            <div className="outer-scroll" ref={scrollRef}>
              <div className="inner-flex">
                {roles.map((r, i) => (
                  <div key={i} className="role-card">
                    <img
                      src={r.poster?.startsWith('http') ? r.poster : 'https://upload.wikimedia.org/wikipedia/commons/f/fc/No_picture_available.png'}
                      alt={`${r.movieName} poster`}
                      className="role-poster"
                      onError={(e) => e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/f/fc/No_picture_available.png'}
                    />
                    <div className="role-info">
                      <h3>{r.movieName}</h3>
                      <p><strong>Role:</strong> {r.category}</p>
                      <p><strong>Characters:</strong> {r.characters?.join(', ') || '—'}</p>
                      <p><strong>IMDb:</strong> {r.imdbRating || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="scroll-btn right" onClick={() => scroll('right')}>&gt;</button>
          </div>
      </div>

      <h3 className="chart-heading">IMDb Ratings at a Glance</h3>
      <div className="chart-wrapper">
        <Bar data={chartData} />
      </div>
    </div>
  );
}
