/**
 * App.jsx — Primary Application Shell & Router Setup
 *
 * Global design tokens applied here:
 *   - Font: Orbitron (headings), Space Grotesk (body), JetBrains Mono (data)
 *   - Accent: Cyan / Blue Electric palette
 *   - Background: Slate 950 with looping video overlay
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import VehicleHistoryPage from './pages/VehicleHistoryPage';
import BackgroundVideo from './components/BackgroundVideo';

export default function App() {
  return (
    <BrowserRouter>
      {/* Root shell — global font and selection color applied here */}
      <div
        className="relative min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        {/* Global looping background video across all pages */}
        <BackgroundVideo />

        {/* Page Content Routes */}
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/vehicle/:vin" element={<VehicleHistoryPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
