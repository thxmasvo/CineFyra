import './index.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/home';
import Movies from './pages/Movies.jsx';
import MovieDetails from './pages/MovieDetails.jsx';
import MoviesAll from './pages/MoviesAll';
import PersonDetails from './pages/PersonDetails';


function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:imdbID" element={<MovieDetails />} />
        <Route path="/movies-all" element={<MoviesAll />} />
        <Route path="/people/:id" element={<PersonDetails />} />s
        {/* ✅ No route for SignInModal, it's shown by Navbar as popup */}
      </Routes>
    </>
  );
}

export default App;
