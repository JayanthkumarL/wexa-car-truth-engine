/**
 * components/VehicleSummaryCard.jsx
 *
 * Header card component summarizing vehicle metadata.
 * Styled with Cyan accents matching the vehicle video background.
 */

export default function VehicleSummaryCard({ car }) {
  if (!car) return null;

  const { vin, make, model, year, current_status } = car;

  return (
    <div className="w-full bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Vehicle Make, Model, Year & VIN */}
      <div className="space-y-1">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md" style={{fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.03em'}}>
            {year} {make} {model}
          </h1>
        </div>

        <div className="flex items-center space-x-2 text-slate-300 font-mono text-sm">
          <span className="text-slate-400">VIN:</span>
          <span className="text-cyan-300 font-semibold tracking-wider">{vin}</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="shrink-0">
        <span
          className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${
            current_status === 'active'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 backdrop-blur-sm'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full mr-2 ${
              current_status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          {current_status || 'Unknown'}
        </span>
      </div>
    </div>
  );
}
