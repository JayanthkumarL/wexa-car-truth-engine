/**
 * services/contradictionDetector.js
 *
 * Core business-logic service for the wexa-car-truth-engine.
 *
 * Given a VIN, this module fetches the car's service history and ownership
 * records from the graph database and runs a series of rule-based checks to
 * surface data contradictions that may indicate fraud, odometer tampering,
 * or data entry errors.
 *
 * Architecture note:
 *   This file contains ONLY business logic — no Cypher, no DB sessions.
 *   All data access is delegated to carRepository (the repository layer).
 *   Each check is an isolated helper function so it can be read, tested,
 *   and tuned independently.
 */

const {
  getServiceEventsByVin,
  getOwnershipHistoryByVin,
} = require('../repositories/carRepository');

// ---------------------------------------------------------------------------
// Tunable thresholds
// ---------------------------------------------------------------------------

/**
 * MAX_KM_PER_DAY — maximum plausible daily mileage between two service events.
 *
 * 500 km/day is already very aggressive for a personal vehicle (roughly
 * Bengaluru → Mumbai in a single day, every day).  Any pair of consecutive
 * service events that implies a higher daily rate is flagged as suspicious.
 *
 * WHY THIS MATTERS:
 *   A car recorded at 28,000 km on Jan 8 and 43,000 km on Jan 22 (14 days)
 *   implies ~1,071 km/day — far above the threshold.  This pattern is
 *   consistent with undisclosed commercial/fleet use, or with odometer
 *   manipulation between readings.
 *
 * Tune this value here — nowhere else in the codebase uses it directly.
 */
const MAX_KM_PER_DAY = 500;

// ---------------------------------------------------------------------------
// Helper: parse an ISO date string into a JS Date safely
// ---------------------------------------------------------------------------
/**
 * parseDate(dateStr)
 *
 * Converts an ISO 8601 date string ("YYYY-MM-DD") to a JS Date object.
 * Using Date objects (not string comparison) avoids subtle bugs where
 * "2023-09-05" > "2023-08-31" works by luck but "2023-9-5" > "2023-8-31"
 * fails because single-digit months sort incorrectly lexicographically.
 *
 * Returns null for null/undefined inputs (current owner has no to_date).
 *
 * @param {string|null} dateStr
 * @returns {Date|null}
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  // Guard against invalid date strings that parse to NaN
  return isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// Helper: days between two Date objects (always positive)
// ---------------------------------------------------------------------------
function daysBetween(dateA, dateB) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.abs(dateB.getTime() - dateA.getTime()) / MS_PER_DAY;
}

// ---------------------------------------------------------------------------
// CHECK 1 — Odometer Rollback
// ---------------------------------------------------------------------------
/**
 * checkOdometerRollback(events)
 *
 * WHY THIS CHECK EXISTS:
 *   Odometer rollback (winding back the mileage counter) is one of the most
 *   common forms of used-car fraud in India and globally.  A legitimate
 *   vehicle's odometer reading can only ever increase — if a later service
 *   record shows a LOWER reading than an earlier one, the odometer was
 *   tampered with between those two visits.
 *
 * HOW IT WORKS:
 *   Walk consecutive service events ordered by date.  For each pair (A, B)
 *   where B comes after A, check if B.odometer_km < A.odometer_km.
 *   If so, create a flag with both event IDs so the reviewer can look them up.
 *
 * @param {Array} events  Sorted ASC by date from the repository
 * @returns {Array}       Zero or more flag objects
 */
function checkOdometerRollback(events) {
  const flags = [];

  if (!events || events.length < 2) return flags;

  for (let i = 0; i < events.length - 1; i++) {
    const eventA = events[i];
    const eventB = events[i + 1];

    // Skip comparison if either reading is missing (shouldn't happen, but
    // defensive programming avoids NaN surprises)
    if (eventA.odometer_km == null || eventB.odometer_km == null) continue;

    if (eventB.odometer_km < eventA.odometer_km) {
      flags.push({
        type:    'ODOMETER_ROLLBACK',
        severity: 'high',
        message: `Odometer decreased from ${eventA.odometer_km} km on ${eventA.date} ` +
                 `to ${eventB.odometer_km} km on ${eventB.date}`,
        related_event_ids: [eventA.event_id, eventB.event_id],
      });
    }
  }

  return flags;
}

// ---------------------------------------------------------------------------
// CHECK 2 — Implausible Mileage Jump
// ---------------------------------------------------------------------------
/**
 * checkImplausibleJumps(events)
 *
 * WHY THIS CHECK EXISTS:
 *   Even without a rollback, an unusually LARGE odometer jump in a short
 *   time window is suspicious.  It can indicate:
 *     - The car was used commercially (taxi, fleet) while being sold as a
 *       personal vehicle.
 *     - The odometer was rolled FORWARD (to mask a very low reading that
 *       would look suspicious on a car of that age).
 *     - A data entry error in one of the service records.
 *
 *   The threshold (MAX_KM_PER_DAY) is defined at the top of this file for
 *   easy tuning without touching the logic below.
 *
 * HOW IT WORKS:
 *   For each consecutive pair of service events, compute the implied daily
 *   mileage.  If it exceeds MAX_KM_PER_DAY, flag it.
 *   Skip the pair if the two events happened on the same day (division by
 *   zero would produce Infinity).
 *
 * @param {Array} events  Sorted ASC by date from the repository
 * @returns {Array}       Zero or more flag objects
 */
function checkImplausibleJumps(events) {
  const flags = [];

  if (!events || events.length < 2) return flags;

  for (let i = 0; i < events.length - 1; i++) {
    const eventA = events[i];
    const eventB = events[i + 1];

    if (eventA.odometer_km == null || eventB.odometer_km == null) continue;

    // Only flag jumps where the odometer went UP (rollbacks are caught above)
    const kmDiff = eventB.odometer_km - eventA.odometer_km;
    if (kmDiff <= 0) continue;

    const dateA = parseDate(eventA.date);
    const dateB = parseDate(eventB.date);
    if (!dateA || !dateB) continue;

    const days = daysBetween(dateA, dateB);

    // Avoid divide-by-zero for same-day events
    if (days === 0) continue;

    const kmPerDay = kmDiff / days;

    if (kmPerDay > MAX_KM_PER_DAY) {
      flags.push({
        type:     'IMPLAUSIBLE_MILEAGE_JUMP',
        severity: 'medium',
        message:  `Unusually large mileage increase: ${kmDiff} km in ${Math.round(days)} days ` +
                  `between ${eventA.date} and ${eventB.date} ` +
                  `(${Math.round(kmPerDay)} km/day, threshold is ${MAX_KM_PER_DAY} km/day)`,
        related_event_ids: [eventA.event_id, eventB.event_id],
      });
    }
  }

  return flags;
}

// ---------------------------------------------------------------------------
// CHECK 3 — Ownership Overlap
// ---------------------------------------------------------------------------
/**
 * checkOwnershipOverlap(ownershipRecords)
 *
 * WHY THIS CHECK EXISTS:
 *   A vehicle can have only one legal owner at a time.  If the recorded
 *   OWNED_BY date ranges for two different owners overlap, it means:
 *     - The transfer of ownership was backdated or forged.
 *     - The seller continued to be listed as owner after the sale.
 *     - A data entry error occurred when recording the transaction.
 *   All three scenarios are red flags that warrant manual investigation.
 *
 * HOW IT WORKS:
 *   For every pair of ownership records (A, B) where A starts before B:
 *     - If A has no to_date (still active) AND B exists → they overlap.
 *     - If A.to_date > B.from_date → the ranges intersect.
 *
 *   Note: a null to_date means "current owner" (ongoing).  We treat the
 *   current date as the effective end for comparison purposes.
 *
 * @param {Array} ownershipRecords  Sorted ASC by from_date from the repository
 * @returns {Array}                 Zero or more flag objects
 */
function checkOwnershipOverlap(ownershipRecords) {
  const flags = [];

  if (!ownershipRecords || ownershipRecords.length < 2) return flags;

  // We compare every pair (i, j) where i < j.
  // Sorting by from_date (done in the query) means ownerA always started first.
  for (let i = 0; i < ownershipRecords.length - 1; i++) {
    for (let j = i + 1; j < ownershipRecords.length; j++) {
      const ownerA = ownershipRecords[i];
      const ownerB = ownershipRecords[j];

      const aFrom = parseDate(ownerA.from_date);
      const aTo   = parseDate(ownerA.to_date);   // null = still active
      const bFrom = parseDate(ownerB.from_date);

      if (!aFrom || !bFrom) continue;

      // Overlap exists when A's ownership period has NOT ended before B began.
      // - aTo === null means A is still the current owner → definite overlap if B exists.
      // - aTo > bFrom means A's ownership extended past B's start date.
      const overlaps = aTo === null || aTo > bFrom;

      if (overlaps) {
        const aToStr = ownerA.to_date || 'present';
        const bToStr = ownerB.to_date || 'present';
        flags.push({
          type:     'OWNERSHIP_OVERLAP',
          severity: 'high',
          message:  `Ownership overlap detected: ${ownerA.name} (${ownerA.from_date} to ${aToStr}) ` +
                    `overlaps with ${ownerB.name} (${ownerB.from_date} to ${bToStr})`,
          related_owner_ids: [ownerA.owner_id, ownerB.owner_id],
        });
      }
    }
  }

  return flags;
}

// ---------------------------------------------------------------------------
// Main exported function: detectContradictions
// ---------------------------------------------------------------------------
/**
 * detectContradictions(vin)
 *
 * Runs all three contradiction checks against the graph data for a given VIN
 * and returns a structured result summary.
 *
 * @param {string} vin
 * @returns {Promise<{
 *   vin: string,
 *   contradictions_found: number,
 *   status: 'clean' | 'flagged',
 *   flags: Array
 * }>}
 */
async function detectContradictions(vin) {
  // Fetch both datasets in parallel — they are independent queries, so
  // awaiting them together halves the round-trip time to the database.
  const [serviceEvents, ownershipRecords] = await Promise.all([
    getServiceEventsByVin(vin),
    getOwnershipHistoryByVin(vin),
  ]);

  // Run each check and collect all flags into one flat array.
  const flags = [
    ...checkOdometerRollback(serviceEvents),
    ...checkImplausibleJumps(serviceEvents),
    ...checkOwnershipOverlap(ownershipRecords),
  ];

  return {
    vin,
    contradictions_found: flags.length,
    status: flags.length > 0 ? 'flagged' : 'clean',
    flags,
  };
}

module.exports = { detectContradictions };
