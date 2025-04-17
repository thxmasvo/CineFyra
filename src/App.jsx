import './index.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/home';
import Movies from './pages/movies.jsx'; // ✅ Make sure the path is correct (capital "M")

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} /> {/* ✅ Add this line */}
      </Routes>
    </>
  );
}

export default App;
