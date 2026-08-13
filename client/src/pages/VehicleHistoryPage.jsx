/**
 * pages/VehicleHistoryPage.jsx
 *
 * Vehicle History Report Detail Page — consistent with SearchPage design tokens:
 *   - Brand: "wexa truth" in Orbitron, Cyan accent
 *   - Buttons: Cyan-to-Blue gradient
 *   - Fonts: Orbitron for headings, Space Grotesk body, JetBrains Mono for data
 */

import { useParams, Link } from 'react-router-dom';
import { useVehicleHistory } from '../hooks/useVehicleHistory';
import VehicleSummaryCard from '../components/VehicleSummaryCard';
import ContradictionBanner from '../components/ContradictionBanner';
import HistoryTimeline from '../components/HistoryTimeline';

// Shared nav brand in Orbitron — consistent with SearchPage header
function NavBrand() {
  return (
    <div className="flex items-center space-x-2.5">
      <div
        className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/25"
        style={{ fontFamily: 'Orbitron, sans-serif' }}
      >
        W
      </div>
      <span
        className="font-bold text-base tracking-tight text-white hidden sm:inline"
        style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em' }}
      >
        wexa <span className="text-cyan-400 font-normal">truth</span>
      </span>
    </div>
  );
}

// Consistent cyan-to-blue action button
function ActionButton({ to, onClick, children }) {
  const cls = 'inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:from-cyan-600 active:to-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/25 cursor-pointer';
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

export default function VehicleHistoryPage() {
  const { vin } = useParams();
  const { data, loading, error } = useVehicleHistory(vin);

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Container */}
      <div className="max-w-4xl mx-auto w-full space-y-6">

        {/* Top Navigation Header */}
        <header className="flex items-center justify-between py-2 border-b border-slate-800/80 backdrop-blur-sm pb-4">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors group cursor-pointer"
          >
            <span className="text-lg transition-transform group-hover:-translate-x-1 inline-block">←</span>
            <span>Back to search</span>
          </Link>
          <NavBrand />
        </header>

        {/* =================================================================== */}
        {/* 1. LOADING STATE — Skeleton UI                                       */}
        {/* =================================================================== */}
        {loading && (
          <div className="space-y-6 animate-pulse" data-testid="loading-skeleton">
            <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-6 h-28 flex flex-col justify-between backdrop-blur-md">
              <div className="h-6 bg-slate-800 rounded-lg w-1/3" />
              <div className="h-4 bg-slate-800/60 rounded-lg w-1/4" />
            </div>
            <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-6 h-36 flex flex-col justify-between backdrop-blur-md">
              <div className="h-6 bg-slate-800 rounded-lg w-1/2" />
              <div className="h-4 bg-slate-800/60 rounded-lg w-3/4" />
            </div>
            <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-6 h-64 space-y-4 backdrop-blur-md">
              <div className="h-5 bg-slate-800 rounded-lg w-1/4" />
              <div className="h-12 bg-slate-800/40 rounded-xl w-full" />
              <div className="h-12 bg-slate-800/40 rounded-xl w-full" />
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 2. ERROR STATE — Vehicle Not Found (404)                             */}
        {/* =================================================================== */}
        {!loading && error && error.isNotFound && (
          <div className="w-full bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/15 text-amber-400 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner">
              🔍
            </div>
            <div className="space-y-2">
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.04em' }}
              >
                Vehicle Not Found
              </h2>
              <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                We couldn&apos;t find a vehicle with VIN{' '}
                <span className="font-mono text-cyan-300 font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{vin}</span>{' '}
                in the database.
              </p>
            </div>
            <div className="pt-2">
              <ActionButton to="/">
                <span>Try Another VIN</span>
                <span>→</span>
              </ActionButton>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 3. ERROR STATE — Server / Network Error                              */}
        {/* =================================================================== */}
        {!loading && error && !error.isNotFound && (
          <div className="w-full bg-slate-900/85 backdrop-blur-md border border-rose-500/30 rounded-2xl p-8 sm:p-12 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/15 text-rose-400 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner">
              ⚠️
            </div>
            <div className="space-y-2">
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.04em' }}
              >
                Error Loading History
              </h2>
              <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                {error.message || "Something went wrong loading this vehicle's history. Please try again."}
              </p>
            </div>
            <div className="pt-2 flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition-colors cursor-pointer backdrop-blur-sm"
              >
                Retry
              </button>
              <ActionButton to="/">
                <span>Back to Search</span>
              </ActionButton>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 4. SUCCESS STATE                                                     */}
        {/* =================================================================== */}
        {!loading && !error && data && (
          <main className="space-y-6">
            <VehicleSummaryCard car={data.car} />
            <ContradictionBanner contradictions={data.contradictions} />
            <HistoryTimeline
              owners={data.owners}
              service_events={data.service_events}
              insurance_claims={data.insurance_claims}
              accidents={data.accidents}
              registrations={data.registrations}
              sellers={data.sellers}
            />
          </main>
        )}
      </div>

      {/* Footer — consistent with SearchPage footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-8 text-xs text-slate-400 border-t border-slate-800/80 backdrop-blur-sm mt-12">
        <span style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          wexa-car-truth-engine • CognoDB Graph Analytics
        </span>
      </footer>
    </div>
  );
}
