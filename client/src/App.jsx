import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Farmers from './pages/Farmers';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Farmers />} />
            <Route path="/farmers" element={<Farmers />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;