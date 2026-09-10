import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import TerrainViewer from './components/TerrainViewer';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<TerrainViewer />} />
      </Routes>
    </Router>
  );
}

export default App;