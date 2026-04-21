import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Farmers from './pages/Farmers';
import Entries from './pages/Entries';
import Settings from './pages/Settings';
import Payments from './pages/Payments';
import Produce from './pages/Produce';
import Reports from './pages/Reports'
import Stock from './pages/Stock';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/farmers" element={<Farmers />} />
            <Route path="/entries" element={<Entries />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/produce" element={<Produce />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/stock" element={<Stock />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;