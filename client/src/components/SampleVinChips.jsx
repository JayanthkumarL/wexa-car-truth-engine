/**
 * components/SampleVinChips.jsx
 *
 * Reusable component for rendering interactive sample VIN selection pills.
 * Styled with Cyan & Slate themes matching the video background.
 */

export default function SampleVinChips({ samples = [], onSelect }) {
  if (!samples || samples.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5 justify-center">
      {samples.map((sample) => (
        <button
          key={sample.vin}
          type="button"
          onClick={() => onSelect && onSelect(sample.vin)}
          className="group text-left px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800/90 active:bg-slate-900 border border-slate-700/80 hover:border-cyan-400/60 rounded-xl transition-all shadow-md hover:shadow-cyan-500/15 backdrop-blur-md cursor-pointer flex flex-col sm:flex-row sm:items-center sm:space-x-2.5"
        >
          <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
            {sample.label}
          </span>
          <span className="text-[11px] font-mono text-slate-400 group-hover:text-slate-200 transition-colors">
            {sample.vin}
          </span>
        </button>
      ))}
    </div>
  );
}
