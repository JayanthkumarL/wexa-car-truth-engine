/**
 * components/ContradictionBanner.jsx
 *
 * Contradiction status banner — consistent with Electric Cyan/Slate design tokens.
 * Uses Space Grotesk body text and bold h2 for flag headings.
 */

const orbitron = { fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.03em' };

export default function ContradictionBanner({ contradictions }) {
  if (!contradictions) return null;

  const { status, contradictions_found = 0, flags = [] } = contradictions;
  const isClean = status === 'clean' || contradictions_found === 0;
  const hasHighSeverity = flags.some((f) => f.severity === 'high');

  if (isClean) {
    return (
      <div className="w-full bg-emerald-950/70 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-xl flex items-start space-x-4">
        <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-emerald-300" style={orbitron}>History Verified Clean</h2>
          <p className="text-sm text-emerald-200/80 leading-relaxed">
            No contradictions detected — this vehicle&apos;s history is consistent across all graph records.
          </p>
        </div>
      </div>
    );
  }

  const bannerBg = hasHighSeverity
    ? 'bg-rose-950/75 border-rose-500/50'
    : 'bg-amber-950/75 border-amber-500/50';

  const titleColor = hasHighSeverity ? 'text-rose-300' : 'text-amber-300';
  const iconBg = hasHighSeverity ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400';

  return (
    <div className={`w-full ${bannerBg} backdrop-blur-md border rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4`}>
      {/* Header */}
      <div className="flex items-start space-x-3.5">
        <div className={`p-2.5 ${iconBg} rounded-xl shrink-0`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h2 className={`text-lg font-extrabold ${titleColor}`} style={orbitron}>
            {contradictions_found} Contradiction{contradictions_found > 1 ? 's' : ''} Detected
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-relaxed">
            The graph engine identified historical discrepancies that warrant inspection.
          </p>
        </div>
      </div>

      {/* Flag List */}
      <div className="space-y-2.5 pt-1">
        {flags.map((flag, idx) => {
          let badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
          if (flag.severity === 'high') badgeStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
          else if (flag.severity === 'low') badgeStyle = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';

          return (
            <div
              key={idx}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 backdrop-blur-sm"
            >
              <div className="flex items-start space-x-2.5">
                <span className="text-base mt-0.5 shrink-0">🚩</span>
                <p className="text-sm font-medium text-slate-200 leading-relaxed">{flag.message}</p>
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 self-start sm:self-center ${badgeStyle}`}
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {flag.severity} severity
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
