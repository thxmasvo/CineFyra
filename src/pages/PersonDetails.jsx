import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPersonDetails } from '../api';
import Loader from '../components/Loader';
import '../Styles/PersonDetails.css';

export default function PersonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        const data = await getPersonDetails(id);
        setPerson(data);
      } catch (err) {
        console.error('❌ Failed to load person:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [id]);

  if (loading) return <Loader />;
  if (error || !person) return <p>❌ Person not found.</p>;

  return (
    <div className="person-details-container">
      <button onClick={() => navigate(-1)} className="back-button">
        ← Back
      </button>
      <h1>{person.name}</h1>
      <p><strong>Born:</strong> {person.birthYear || 'Unknown'}</p>
      <p><strong>Died:</strong> {person.deathYear || '—'}</p>

      <h2>🎬 Known For</h2>
      <ul>
        {person.knownForTitles?.map((title, idx) => (
          <li key={idx}>
            <a href={`/movies/${title}`} className="person-link">{title}</a>
          </li>
        )) || <p>—</p>}
      </ul>
    </div>
  );
}
