/**
 * db/seed/vehicleData.js
 *
 * Pure data module — no Cypher, no imports.
 * Exports a single `vehicles` array of 5 synthetic vehicles, each
 * representing a deliberate scenario for testing graph-truth detection.
 *
 * Indian context: VINs / registration numbers use a Karnataka (KA) format,
 * owners and service centers are named for Mysore/Bengaluru region.
 */

const vehicles = [

  // =========================================================================
  // SCENARIO 1 — "Clean Car"
  // Honda City with a single owner, clean 4-event service history, no
  // accidents or claims. This is the baseline "nothing suspicious" vehicle.
  // =========================================================================
  {
    scenario: 'Clean Car',
    car: {
      vin:            'MBLHA51CXNM001101',
      make:           'Honda',
      model:          'City',
      year:           2022,
      current_status: 'active',
    },
    owners: [
      {
        owner:    { owner_id: 'OWN-001', name: 'Priya Nair', owner_type: 'individual' },
        fromDate: '2022-03-15',
        toDate:   null,
      },
    ],
    serviceEvents: [
      {
        center: { center_id: 'SC-001', name: 'Honda Authorised Service - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-001', date: '2022-09-10', odometer_km: 8200,  description: 'First free service - oil change and general inspection' },
      },
      {
        center: { center_id: 'SC-001', name: 'Honda Authorised Service - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-002', date: '2023-04-20', odometer_km: 22500, description: 'Second scheduled service - air filter, oil filter, brake fluid top-up' },
      },
      {
        center: { center_id: 'SC-001', name: 'Honda Authorised Service - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-003', date: '2024-02-18', odometer_km: 41000, description: 'Third scheduled service - spark plug replacement, tyre rotation' },
      },
      {
        center: { center_id: 'SC-001', name: 'Honda Authorised Service - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-004', date: '2025-01-05', odometer_km: 61200, description: 'Fourth scheduled service - coolant flush, belt inspection, brake pad check' },
      },
    ],
    claims:        [],
    accidents:     [],
    registrations: [
      { registration_id: 'KA09AB1234', date: '2022-03-15', state: 'Karnataka' },
    ],
    sellers: [
      { seller: { seller_id: 'SEL-001', name: 'Sri Sai Honda', seller_type: 'dealership' }, date: '2022-03-10' },
    ],
  },

  // =========================================================================
  // SCENARIO 2 — "The Rollback"
  // Maruti Swift with a deliberate odometer contradiction: a 2025 service
  // event shows LOWER odometer_km (71,000) than the preceding 2024 event
  // (92,000), indicating the odometer was wound back between visits.
  // =========================================================================
  {
    scenario: 'The Rollback',
    car: {
      vin:            'MA3FJEB1S00238456',
      make:           'Maruti Suzuki',
      model:          'Swift',
      year:           2020,
      current_status: 'active',
    },
    owners: [
      {
        owner:    { owner_id: 'OWN-002', name: 'Karthik Reddy', owner_type: 'individual' },
        fromDate: '2020-07-01',
        toDate:   null,
      },
    ],
    serviceEvents: [
      {
        // Normal history before the rollback
        center: { center_id: 'SC-002', name: 'Maruti True Value Service - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-005', date: '2021-01-15', odometer_km: 11000, description: 'First free service - engine oil change' },
      },
      {
        center: { center_id: 'SC-002', name: 'Maruti True Value Service - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-006', date: '2022-06-20', odometer_km: 35000, description: 'Scheduled service - oil, filters, brake inspection' },
      },
      {
        center: { center_id: 'SC-002', name: 'Maruti True Value Service - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-007', date: '2024-03-10', odometer_km: 92000, description: 'Annual service - full check, AC service, tyre rotation' },
      },
      {
        // DELIBERATE CONTRADICTION: later date but lower odometer (rollback)
        center: { center_id: 'SC-003', name: 'FastTrack Auto Workshop - Bengaluru', location: 'Bengaluru, Karnataka' },
        event:  { event_id: 'SE-008', date: '2025-02-14', odometer_km: 71000, description: 'Pre-sale inspection - oil change, general check-up' },
      },
    ],
    claims:        [],
    accidents:     [],
    registrations: [
      { registration_id: 'KA05CD5678', date: '2020-07-01', state: 'Karnataka' },
    ],
    sellers: [
      { seller: { seller_id: 'SEL-002', name: 'Nexa Certified Pre-Owned', seller_type: 'dealership' }, date: '2025-02-20' },
    ],
  },

  // =========================================================================
  // SCENARIO 3 — "The Overlap"
  // Hyundai i20 with 2 owners whose OWNED_BY date ranges overlap:
  //   Owner A  : 2021-05-01 → 2023-08-31
  //   Owner B  : 2023-06-15 → present   ← starts before A's end date
  // This two-month overlap is the contradiction.
  // =========================================================================
  {
    scenario: 'The Overlap',
    car: {
      vin:            'MALAM51BLFM312789',
      make:           'Hyundai',
      model:          'i20',
      year:           2021,
      current_status: 'active',
    },
    owners: [
      {
        // Owner A — supposedly sold the car in August 2023
        owner:    { owner_id: 'OWN-003', name: 'Sunita Gowda', owner_type: 'individual' },
        fromDate: '2021-05-01',
        toDate:   '2023-08-31',
      },
      {
        // Owner B — DELIBERATELY starts before Owner A's end date
        owner:    { owner_id: 'OWN-004', name: 'Manjunath Rao', owner_type: 'individual' },
        fromDate: '2023-06-15',   // ← two months BEFORE A's to_date
        toDate:   null,
      },
    ],
    serviceEvents: [
      {
        center: { center_id: 'SC-004', name: 'Hyundai Service Hub - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-009', date: '2022-01-10', odometer_km: 14000, description: 'First service - engine oil and filter replacement' },
      },
      {
        center: { center_id: 'SC-004', name: 'Hyundai Service Hub - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-010', date: '2023-03-22', odometer_km: 29500, description: 'Scheduled service - spark plugs, brake fluid, cabin air filter' },
      },
      {
        center: { center_id: 'SC-004', name: 'Hyundai Service Hub - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-011', date: '2024-07-08', odometer_km: 48200, description: 'Annual maintenance - coolant flush, drive belt check, wheel alignment' },
      },
    ],
    claims:        [],
    accidents:     [],
    registrations: [
      { registration_id: 'KA21EF9012', date: '2021-05-01', state: 'Karnataka' },
    ],
    sellers: [],
  },

  // =========================================================================
  // SCENARIO 4 — "The Hidden Accident"
  // Toyota Innova with a major accident and a linked insurance claim, but
  // the service event IMMEDIATELY AFTER the accident describes only a routine
  // oil change — no bodywork or structural repairs mentioned. This mismatch
  // between a "major" accident and the next service description is the flag.
  // =========================================================================
  {
    scenario: 'The Hidden Accident',
    car: {
      vin:            'MBJBL11GXEM412345',
      make:           'Toyota',
      model:          'Innova Crysta',
      year:           2019,
      current_status: 'active',
    },
    owners: [
      {
        owner:    { owner_id: 'OWN-005', name: 'Ramesh Babu', owner_type: 'individual' },
        fromDate: '2019-11-20',
        toDate:   null,
      },
    ],
    serviceEvents: [
      {
        center: { center_id: 'SC-005', name: 'Toyota Kirloskar Service - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-012', date: '2020-05-15', odometer_km: 10000, description: 'First service - engine oil change, tyre pressure check' },
      },
      {
        center: { center_id: 'SC-005', name: 'Toyota Kirloskar Service - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-013', date: '2021-08-10', odometer_km: 34000, description: 'Scheduled service - brake pads, coolant top-up, belt inspection' },
      },
      {
        // DELIBERATE CONTRADICTION: major accident was on 2022-11-03.
        // This service (two months later) mentions NOTHING about repairs.
        center: { center_id: 'SC-005', name: 'Toyota Kirloskar Service - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-014', date: '2023-01-18', odometer_km: 58500, description: 'Oil change and filter replacement' },
      },
      {
        center: { center_id: 'SC-005', name: 'Toyota Kirloskar Service - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-015', date: '2024-06-30', odometer_km: 79000, description: 'Annual service - spark plugs, AC service, tyre rotation' },
      },
    ],
    claims: [
      {
        // The claim linked to the major accident below
        claim_id:   'CLM-001',
        date:       '2022-11-10',
        amount:     280000,
        claim_type: 'own_damage',
      },
    ],
    accidents: [
      {
        accident:       { accident_id: 'ACC-001', date: '2022-11-03', severity: 'major', description: 'Rear-end collision on Mysore–Bengaluru highway; significant structural damage to rear panel and boot' },
        relatedClaimId: 'CLM-001',  // Links InsuranceClaim CLM-001 → this Accident
      },
    ],
    registrations: [
      { registration_id: 'KA14GH3456', date: '2019-11-20', state: 'Karnataka' },
    ],
    sellers: [],
  },

  // =========================================================================
  // SCENARIO 5 — "The Multi-Flag Car"
  // Tata Nexon with 3 owners in an 18-month span (very short ownership
  // windows suggesting fleet/resale churn), plus one pair of service events
  // ~2 weeks apart with a suspiciously large 15,000 km jump.
  // =========================================================================
  {
    scenario: 'The Multi-Flag Car',
    car: {
      vin:            'TMBAE2NE2PB078901',
      make:           'Tata',
      model:          'Nexon',
      year:           2023,
      current_status: 'active',
    },
    owners: [
      {
        // Owner A — holds car for only ~5 months
        owner:    { owner_id: 'OWN-006', name: 'Deepak Hegde', owner_type: 'individual' },
        fromDate: '2023-04-10',
        toDate:   '2023-09-05',
      },
      {
        // Owner B — holds car for only ~7 months (possible reseller)
        owner:    { owner_id: 'OWN-007', name: 'Venkatesh Motors (Pvt Ltd)', owner_type: 'commercial' },
        fromDate: '2023-09-06',
        toDate:   '2024-04-01',
      },
      {
        // Owner C — current holder after another short flip
        owner:    { owner_id: 'OWN-008', name: 'Ananya Krishnamurthy', owner_type: 'individual' },
        fromDate: '2024-04-02',
        toDate:   null,
      },
    ],
    serviceEvents: [
      {
        center: { center_id: 'SC-006', name: 'Tata Motors Authorised Service - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-016', date: '2023-10-05', odometer_km: 12000, description: 'First free service - oil change, general inspection' },
      },
      {
        // Service event 2 — base reading before the suspicious jump
        center: { center_id: 'SC-006', name: 'Tata Motors Authorised Service - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-017', date: '2024-01-08', odometer_km: 28000, description: 'Scheduled service - brake fluid, tyre rotation' },
      },
      {
        // DELIBERATE CONTRADICTION: only 14 days after SE-017, odometer is
        // already 43,000 km — a jump of 15,000 km in two weeks.
        center: { center_id: 'SC-007', name: 'QuickFix Auto Care - Hunsur Road, Mysore', location: 'Hunsur Road, Mysore, Karnataka' },
        event:  { event_id: 'SE-018', date: '2024-01-22', odometer_km: 43000, description: 'Oil top-up and air filter clean' },
      },
      {
        center: { center_id: 'SC-006', name: 'Tata Motors Authorised Service - Mysore', location: 'Mysore, Karnataka' },
        event:  { event_id: 'SE-019', date: '2024-09-14', odometer_km: 61000, description: 'Annual service - full check, AC gas refill, battery test' },
      },
    ],
    claims:        [],
    accidents:     [],
    registrations: [
      { registration_id: 'KA55IJ7890', date: '2023-04-10', state: 'Karnataka' },
    ],
    sellers: [
      { seller: { seller_id: 'SEL-003', name: 'Venkatesh Motors (Pvt Ltd)', seller_type: 'used_car_dealer' }, date: '2024-03-28' },
    ],
  },

];

module.exports = { vehicles };
