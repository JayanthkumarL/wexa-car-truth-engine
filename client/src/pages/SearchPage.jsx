/**
 * pages/SearchPage.jsx
 *
 * Landing page component for the wexa-car-truth-engine.
 *
 * Color Palette: Electric Cyan & Deep Midnight Slate matched to the
 * futuristic vehicle headlight contours in Video Project 1.mp4.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VinSearchInput from '../components/VinSearchInput';
import SampleVinChips from '../components/SampleVinChips';

// Pre-seeded scenario vehicle dataset for quick sample testing
const SAMPLE_VEHICLES = [
  { vin: 'MBLHA51CXNM001101', label: 'Clean Car' },
  { vin: 'MA3FJEB1S00238456', label: 'Odometer Rollback' },
  { vin: 'MALAM51BLFM312789', label: 'Ownership Overlap' },
  { vin: 'MBJBL11GXEM412345', label: 'Accident History' },
  { vin: 'TMBAE2NE2PB078901', label: 'Multiple Flags' },
];

export default function SearchPage() {
  const [vin, setVin] = useState('');
  const navigate = useNavigate();

  const handleNavigateToVin = (targetVin) => {
    if (targetVin && targetVin.trim()) {
      navigate(`/vehicle/${encodeURIComponent(targetVin.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Header / Branding */}
      <header className="max-w-5xl mx-auto w-full flex justify-between items-center py-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/25" style={{fontFamily: 'Orbitron, sans-serif'}}>
            W
          </div>
          <span className="font-bold text-xl tracking-tight text-white drop-shadow-md" style={{fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.04em'}}>
            wexa <span className="text-cyan-400 font-normal">truth</span>
          </span>
        </div>
        <span className="text-xs font-mono text-cyan-200 bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md px-3 py-1 rounded-full shadow-md">
          CognoDB Graph Powered
        </span>
      </header>

      {/* Main Centered Hero & Search Section */}
      <main className="max-w-3xl mx-auto w-full my-auto py-12 px-4 text-center space-y-8">
        {/* Title & Tagline */}
        <div className="space-y-4">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-cyan-300 bg-slate-900/90 border border-cyan-500/40 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg shadow-cyan-950/50">
            Graph Fraud & Contradiction Detection
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight drop-shadow-2xl" style={{fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.04em'}}>
            Used-Car Truth Engine
          </h1>
          <p className="text-base sm:text-lg text-slate-200 max-w-xl mx-auto font-medium drop-shadow-md leading-relaxed">
            Enter a VIN to uncover a vehicle&apos;s full history — and catch what doesn&apos;t add up.
          </p>
        </div>

        {/* VIN Search Form */}
        <div className="pt-2">
          <VinSearchInput
            value={vin}
            onChange={setVin}
            onSubmit={handleNavigateToVin}
          />
        </div>

        {/* Sample Vehicles Section */}
        <div className="pt-6 space-y-3">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest drop-shadow-md">
            Try a sample vehicle:
          </p>
          <SampleVinChips
            samples={SAMPLE_VEHICLES}
            onSelect={handleNavigateToVin}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center py-6 text-xs text-slate-400 border-t border-slate-800/80 backdrop-blur-sm">
        wexa-car-truth-engine • Managed Neo4j / CognoDB Graph Database
      </footer>
    </div>
  );
}
