import './index.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/home';
import Movies from './pages/Movies.jsx';
import MovieDetails from './pages/MovieDetails.jsx';
import MoviesAll from './pages/MoviesAll';
import PersonDetails from './pages/PersonDetails';
import Footer from './components/Footer';
import MoviesGrid from './pages/MoviesGrid';
import './Styles/Theme.css';

function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:imdbID" element={<MovieDetails />} />
          <Route path="/movies-all" element={<MoviesAll />} />
          <Route path="/people/:id" element={<PersonDetails />} />
          <Route path="/movies-grid" element={<MoviesGrid />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
