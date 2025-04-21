import './index.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/home';
import Movies from './pages/movies.jsx';
import MovieDetails from './pages/MovieDetails.jsx'; // ✅ Import the MovieDetails page
import MoviesAll from './pages/MoviesAll';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:imdbID" element={<MovieDetails />} /> {/* ✅ Individual movie route */}
        <Route path="/movies-all" element={<MoviesAll />} />
      </Routes>
    </>
  );
}

export default App;
