/**
 * components/HistoryTimeline.jsx
 *
 * Renders a unified, chronologically-sorted vertical timeline of all vehicle graph events.
 * Aesthetic: High-contrast white typography on glassmorphic vertical timeline cards.
 */

// Helper to format ISO date strings into clean human-readable text (e.g. "10 Mar 2024")
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

// Config for timeline entry visual themes by event type
const TYPE_CONFIG = {
  owner: {
    label: 'Ownership',
    dotBg: 'bg-white text-black font-black',
    badgeStyle: 'bg-white/15 text-white border-white/30',
    icon: '👤',
  },
  service: {
    label: 'Service Visit',
    dotBg: 'bg-white text-black font-black',
    badgeStyle: 'bg-white/15 text-white border-white/30',
    icon: '🔧',
  },
  claim: {
    label: 'Insurance Claim',
    dotBg: 'bg-white text-black font-black',
    badgeStyle: 'bg-white/15 text-white border-white/30',
    icon: '📄',
  },
  accident: {
    label: 'Accident Record',
    dotBg: 'bg-white text-black font-black',
    badgeStyle: 'bg-white/15 text-white border-white/30',
    icon: '⚠️',
  },
  registration: {
    label: 'Registration',
    dotBg: 'bg-white text-black font-black',
    badgeStyle: 'bg-white/15 text-white border-white/30',
    icon: '📜',
  },
  seller: {
    label: 'Vehicle Sale',
    dotBg: 'bg-white text-black font-black',
    badgeStyle: 'bg-white/15 text-white border-white/30',
    icon: '🏪',
  },
};

export default function HistoryTimeline({
  owners = [],
  service_events = [],
  insurance_claims = [],
  accidents = [],
  registrations = [],
  sellers = [],
}) {
  // 1. MERGE & NORMALIZE
  const normalizedEvents = [];

  owners.forEach((o, index) => {
    if (!o) return;
    const fromStr = formatDate(o.from_date);
    const toStr = o.to_date ? formatDate(o.to_date) : 'present';
    normalizedEvents.push({
      id: `owner-${o.owner_id || index}-${o.from_date}`,
      rawDate: o.from_date,
      dateFormatted: fromStr,
      type: 'owner',
      title: `Owner: ${o.name || 'Unknown Owner'}`,
      description: `Period: ${fromStr} → ${toStr} (${o.owner_type || 'individual'})`,
    });
  });

  service_events.forEach((se, index) => {
    if (!se) return;
    normalizedEvents.push({
      id: `service-${se.event_id || index}`,
      rawDate: se.date,
      dateFormatted: formatDate(se.date),
      type: 'service',
      title: `Service: ${se.description || 'Routine Service'}`,
      description: `Odometer Reading: ${se.odometer_km != null ? se.odometer_km.toLocaleString() + ' km' : 'Not recorded'}`,
    });
  });

  insurance_claims.forEach((ic, index) => {
    if (!ic) return;
    normalizedEvents.push({
      id: `claim-${ic.claim_id || index}`,
      rawDate: ic.date,
      dateFormatted: formatDate(ic.date),
      type: 'claim',
      title: `Insurance Claim (${ic.claim_type || 'Claim'})`,
      description: `Claimed Amount: ₹${ic.amount != null ? ic.amount.toLocaleString() : 'N/A'}`,
    });
  });

  accidents.forEach((acc, index) => {
    if (!acc) return;
    normalizedEvents.push({
      id: `accident-${acc.accident_id || index}`,
      rawDate: acc.date,
      dateFormatted: formatDate(acc.date),
      type: 'accident',
      title: `Accident (${acc.severity || 'Unspecified'} Severity)`,
      description: acc.description || 'Accident recorded.',
    });
  });

  registrations.forEach((reg, index) => {
    if (!reg) return;
    normalizedEvents.push({
      id: `reg-${reg.registration_id || index}`,
      rawDate: reg.date,
      dateFormatted: formatDate(reg.date),
      type: 'registration',
      title: `Registered in ${reg.state || 'India'}`,
      description: `Registration Number: ${reg.registration_id || 'N/A'}`,
    });
  });

  sellers.forEach((s, index) => {
    if (!s) return;
    normalizedEvents.push({
      id: `seller-${s.seller_id || index}`,
      rawDate: s.sold_date,
      dateFormatted: formatDate(s.sold_date),
      type: 'seller',
      title: `Sold by ${s.name || 'Seller'}`,
      description: `Seller Type: ${s.seller_type || 'N/A'}`,
    });
  });

  // 2. SORT CHRONOLOGICALLY ASCENDING
  normalizedEvents.sort((a, b) => {
    const timeA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
    const timeB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
    return timeA - timeB;
  });

  if (normalizedEvents.length === 0) {
    return (
      <div className="w-full bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center text-white/80">
        <p className="text-sm font-semibold">No history records found for this vehicle.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-white/15 pb-4">
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center space-x-2 drop-shadow-md">
          <span>Vehicle History Timeline</span>
        </h2>
        <span className="text-xs font-mono font-bold text-white bg-white/15 border border-white/25 px-3 py-1 rounded-full shadow-md">
          {normalizedEvents.length} Event{normalizedEvents.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Vertical Rail Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/30">
        {normalizedEvents.map((event) => {
          const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.service;

          return (
            <div key={event.id} className="relative group">
              {/* Node Dot on Left Rail */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full ${config.dotBg} ring-4 ring-black flex items-center justify-center text-[10px] shadow-lg`}
              >
                {config.icon}
              </div>

              {/* Event Card Content */}
              <div className="bg-black/70 backdrop-blur-md border border-white/20 hover:border-white/40 rounded-xl p-4 transition-all shadow-xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Event Type Badge */}
                  <span
                    className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full border ${config.badgeStyle}`}
                  >
                    {config.label}
                  </span>

                  {/* Formatted Date */}
                  <span className="text-xs font-mono font-bold text-white/90">
                    📅 {event.dateFormatted}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">
                  {event.title}
                </h3>
                <p className="text-xs sm:text-sm font-mono text-white/80 leading-relaxed font-medium">
                  {event.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
