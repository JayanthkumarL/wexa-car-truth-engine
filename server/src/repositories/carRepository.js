/**
 * repositories/carRepository.js
 *
 * All database interactions for Car-related data.
 *
 * Pattern used throughout:
 *   1. Open a session from the shared driver singleton.
 *   2. Run a parameterized Cypher query (NEVER string-interpolate values
 *      into the query string — always use $paramName syntax).
 *   3. Close the session in a finally block so it's always released,
 *      even if the query throws.
 *
 * Cypher primer for unfamiliar developers:
 *   - MERGE = "create if not exists, match if it does" — safe to re-run.
 *   - CREATE = always makes a new node/relationship — can cause duplicates.
 *   - MATCH  = "find existing nodes" — fails silently if nothing found.
 *   - OPTIONAL MATCH = like MATCH but returns null instead of failing.
 *   - Parameters are written as $paramName in the query string and supplied
 *     as the second argument to session.run({ query }, { params }).
 */

const { driver } = require('../db/driver');
const config = require('../config/env');

// Helper: open a session targeting the configured database.
// A session is a lightweight handle over the shared connection pool;
// always close it when done.
function openSession() {
  return driver.session({ database: config.neo4jDatabase });
}

// ---------------------------------------------------------------------------
// createCar
// ---------------------------------------------------------------------------
/**
 * MERGE a Car node identified by its VIN.
 * Using MERGE on `vin` means this is idempotent — re-running the seed
 * will not create duplicate Car nodes.
 *
 * @param {Object} carData  { vin, make, model, year, current_status }
 */
async function createCar(carData) {
  const session = openSession();
  try {
    // MERGE matches an existing Car with this vin or creates a new one.
    // ON CREATE SET  — only runs when a NEW node is created.
    // ON MATCH SET   — runs when the node already EXISTS (updates it).
    await session.run(
      `
      MERGE (c:Car { vin: $vin })
      ON CREATE SET
        c.make           = $make,
        c.model          = $model,
        c.year           = $year,
        c.current_status = $current_status
      ON MATCH SET
        c.make           = $make,
        c.model          = $model,
        c.year           = $year,
        c.current_status = $current_status
      `,
      {
        vin:            carData.vin,
        make:           carData.make,
        model:          carData.model,
        year:           carData.year,
        current_status: carData.current_status,
      }
    );
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// addOwner
// ---------------------------------------------------------------------------
/**
 * MERGE an Owner node and MERGE the OWNED_BY relationship from Car to Owner.
 * The relationship carries from_date and to_date as properties.
 *
 * @param {string} vin
 * @param {Object} ownerData  { owner_id, name, owner_type }
 * @param {string} fromDate   ISO date string
 * @param {string} toDate     ISO date string (or null for current owner)
 */
async function addOwner(vin, ownerData, fromDate, toDate) {
  const session = openSession();
  try {
    // 1. MATCH the Car we already created (we don't MERGE here because the
    //    car must already exist — if it doesn't, this will silently do nothing,
    //    which is safe; adjust to MERGE if needed).
    // 2. MERGE the Owner node by owner_id.
    // 3. MERGE the OWNED_BY relationship so re-seeding doesn't add duplicates.
    await session.run(
      `
      MATCH  (c:Car { vin: $vin })
      MERGE  (o:Owner { owner_id: $owner_id })
      ON CREATE SET
        o.name       = $name,
        o.owner_type = $owner_type
      ON MATCH SET
        o.name       = $name,
        o.owner_type = $owner_type
      MERGE  (c)-[r:OWNED_BY]->(o)
      ON CREATE SET r.from_date = $from_date, r.to_date = $to_date
      ON MATCH SET  r.from_date = $from_date, r.to_date = $to_date
      `,
      {
        vin:        vin,
        owner_id:   ownerData.owner_id,
        name:       ownerData.name,
        owner_type: ownerData.owner_type,
        from_date:  fromDate,
        to_date:    toDate,
      }
    );
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// addServiceEvent
// ---------------------------------------------------------------------------
/**
 * MERGE a ServiceCenter node, MERGE a ServiceEvent node, then create
 * SERVICED_AT (Car → ServiceCenter) and HAS_SERVICE_RECORD (Car → ServiceEvent).
 *
 * @param {string} vin
 * @param {Object} centerData       { center_id, name, location }
 * @param {Object} serviceEventData { event_id, date, odometer_km, description }
 */
async function addServiceEvent(vin, centerData, serviceEventData) {
  const session = openSession();
  try {
    // We MERGE both the ServiceCenter and ServiceEvent to stay idempotent.
    // The date property on SERVICED_AT records when this specific service visit occurred.
    await session.run(
      `
      MATCH  (c:Car { vin: $vin })
      MERGE  (sc:ServiceCenter { center_id: $center_id })
      ON CREATE SET sc.name = $center_name, sc.location = $location
      ON MATCH SET  sc.name = $center_name, sc.location = $location
      MERGE  (se:ServiceEvent { event_id: $event_id })
      ON CREATE SET
        se.date        = $date,
        se.odometer_km = $odometer_km,
        se.description = $description
      ON MATCH SET
        se.date        = $date,
        se.odometer_km = $odometer_km,
        se.description = $description
      MERGE  (c)-[:SERVICED_AT { date: $date }]->(sc)
      MERGE  (c)-[:HAS_SERVICE_RECORD]->(se)
      `,
      {
        vin:          vin,
        center_id:    centerData.center_id,
        center_name:  centerData.name,
        location:     centerData.location,
        event_id:     serviceEventData.event_id,
        date:         serviceEventData.date,
        odometer_km:  serviceEventData.odometer_km,
        description:  serviceEventData.description,
      }
    );
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// addClaim
// ---------------------------------------------------------------------------
/**
 * MERGE an InsuranceClaim node and create HAS_CLAIM (Car → InsuranceClaim).
 *
 * @param {string} vin
 * @param {Object} claimData  { claim_id, date, amount, claim_type }
 */
async function addClaim(vin, claimData) {
  const session = openSession();
  try {
    await session.run(
      `
      MATCH  (c:Car { vin: $vin })
      MERGE  (ic:InsuranceClaim { claim_id: $claim_id })
      ON CREATE SET
        ic.date       = $date,
        ic.amount     = $amount,
        ic.claim_type = $claim_type
      ON MATCH SET
        ic.date       = $date,
        ic.amount     = $amount,
        ic.claim_type = $claim_type
      MERGE  (c)-[:HAS_CLAIM]->(ic)
      `,
      {
        vin:        vin,
        claim_id:   claimData.claim_id,
        date:       claimData.date,
        amount:     claimData.amount,
        claim_type: claimData.claim_type,
      }
    );
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// addAccident
// ---------------------------------------------------------------------------
/**
 * MERGE an Accident node and create INVOLVED_IN (Car → Accident).
 * If `relatedClaimId` is provided, also creates the RELATED_TO relationship
 * from that InsuranceClaim to this Accident (linking the two).
 *
 * @param {string}      vin
 * @param {Object}      accidentData    { accident_id, date, severity, description }
 * @param {string|null} relatedClaimId  claim_id to link, or null
 */
async function addAccident(vin, accidentData, relatedClaimId) {
  const session = openSession();
  try {
    // First, merge the Accident and wire it to the Car.
    await session.run(
      `
      MATCH  (c:Car { vin: $vin })
      MERGE  (a:Accident { accident_id: $accident_id })
      ON CREATE SET
        a.date        = $date,
        a.severity    = $severity,
        a.description = $description
      ON MATCH SET
        a.date        = $date,
        a.severity    = $severity,
        a.description = $description
      MERGE  (c)-[:INVOLVED_IN]->(a)
      `,
      {
        vin:         vin,
        accident_id: accidentData.accident_id,
        date:        accidentData.date,
        severity:    accidentData.severity,
        description: accidentData.description,
      }
    );

    // Optionally link an existing InsuranceClaim → Accident.
    // This only runs when a claim_id is supplied.
    if (relatedClaimId) {
      await session.run(
        `
        MATCH (ic:InsuranceClaim { claim_id: $claim_id })
        MATCH (a:Accident        { accident_id: $accident_id })
        MERGE (ic)-[:RELATED_TO]->(a)
        `,
        {
          claim_id:    relatedClaimId,
          accident_id: accidentData.accident_id,
        }
      );
    }
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// addRegistration
// ---------------------------------------------------------------------------
/**
 * MERGE a Registration node and create REGISTERED_AS (Car → Registration).
 *
 * @param {string} vin
 * @param {Object} registrationData  { registration_id, date, state }
 */
async function addRegistration(vin, registrationData) {
  const session = openSession();
  try {
    await session.run(
      `
      MATCH  (c:Car { vin: $vin })
      MERGE  (r:Registration { registration_id: $registration_id })
      ON CREATE SET r.date = $date, r.state = $state
      ON MATCH SET  r.date = $date, r.state = $state
      MERGE  (c)-[:REGISTERED_AS]->(r)
      `,
      {
        vin:             vin,
        registration_id: registrationData.registration_id,
        date:            registrationData.date,
        state:           registrationData.state,
      }
    );
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// addSeller
// ---------------------------------------------------------------------------
/**
 * MERGE a Seller node and create SOLD_BY (Car → Seller) with a date property.
 *
 * @param {string} vin
 * @param {Object} sellerData  { seller_id, name, seller_type }
 * @param {string} date        ISO date string of the sale
 */
async function addSeller(vin, sellerData, date) {
  const session = openSession();
  try {
    await session.run(
      `
      MATCH  (c:Car { vin: $vin })
      MERGE  (s:Seller { seller_id: $seller_id })
      ON CREATE SET s.name = $name, s.seller_type = $seller_type
      ON MATCH SET  s.name = $name, s.seller_type = $seller_type
      MERGE  (c)-[:SOLD_BY { date: $date }]->(s)
      `,
      {
        vin:         vin,
        seller_id:   sellerData.seller_id,
        name:        sellerData.name,
        seller_type: sellerData.seller_type,
        date:        date,
      }
    );
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// getFullHistoryByVin
// ---------------------------------------------------------------------------
/**
 * Returns the full vehicle history as a single query result.
 *
 * CARTESIAN PRODUCT PREVENTATIVE QUERY DESIGN:
 * Executing multiple sequential OPTIONAL MATCH clauses without intermediate
 * aggregation causes Cypher to form a Cartesian product (cross-join) of all
 * matching rows across branches (e.g. 4 service events x 1 seller = 4 rows,
 * which cross-joins to duplicate sellers).
 *
 * To avoid this, we use the "WITH Pipeline Aggregation" pattern: immediately
 * after each OPTIONAL MATCH, we collect the results into a list using
 * `collect(...)` and pass it forward in a `WITH` clause. This collapses the
 * working set back to a single row (cardinality = 1) before the next branch
 * is matched, completely preventing cross-branch row inflation.
 *
 * @param {string} vin
 * @returns {Object|null} Full history object or null if VIN not found
 */
async function getFullHistoryByVin(vin) {
  const session = openSession();
  try {
    const result = await session.run(
      `
      // 1. Match target Car node (cardinality: 1)
      MATCH (c:Car { vin: $vin })

      // 2. Branch: Owners (aggregate immediately to maintain 1 row working set)
      OPTIONAL MATCH (c)-[ob:OWNED_BY]->(o:Owner)
      WITH c, collect(DISTINCT CASE WHEN o IS NOT NULL THEN { owner: o, from_date: ob.from_date, to_date: ob.to_date } END) AS owners

      // 3. Branch: Service Events
      OPTIONAL MATCH (c)-[:HAS_SERVICE_RECORD]->(se:ServiceEvent)
      WITH c, owners, collect(DISTINCT se) AS serviceEvents

      // 4. Branch: Service Centers
      OPTIONAL MATCH (c)-[:SERVICED_AT]->(sc:ServiceCenter)
      WITH c, owners, serviceEvents, collect(DISTINCT sc) AS serviceCenters

      // 5. Branch: Insurance Claims
      OPTIONAL MATCH (c)-[:HAS_CLAIM]->(ic:InsuranceClaim)
      WITH c, owners, serviceEvents, serviceCenters, collect(DISTINCT ic) AS claims

      // 6. Branch: Accidents
      OPTIONAL MATCH (c)-[:INVOLVED_IN]->(a:Accident)
      WITH c, owners, serviceEvents, serviceCenters, claims, collect(DISTINCT a) AS accidents

      // 7. Branch: Registrations
      OPTIONAL MATCH (c)-[:REGISTERED_AS]->(reg:Registration)
      WITH c, owners, serviceEvents, serviceCenters, claims, accidents, collect(DISTINCT reg) AS registrations

      // 8. Branch: Sellers
      OPTIONAL MATCH (c)-[sb:SOLD_BY]->(sel:Seller)
      WITH c, owners, serviceEvents, serviceCenters, claims, accidents, registrations, collect(DISTINCT CASE WHEN sel IS NOT NULL THEN { seller: sel, date: sb.date } END) AS sellers

      // Return clean, un-duplicated collections per branch
      RETURN
        c AS car,
        [x IN owners WHERE x IS NOT NULL]          AS owners,
        [x IN serviceEvents WHERE x IS NOT NULL]   AS serviceEvents,
        [x IN serviceCenters WHERE x IS NOT NULL]  AS serviceCenters,
        [x IN claims WHERE x IS NOT NULL]          AS claims,
        [x IN accidents WHERE x IS NOT NULL]       AS accidents,
        [x IN registrations WHERE x IS NOT NULL]  AS registrations,
        [x IN sellers WHERE x IS NOT NULL]        AS sellers
      `,
      { vin }
    );

    if (result.records.length === 0) return null;

    const record = result.records[0];

    // Convert Neo4j node objects to plain JS objects using .properties
    const toProps = (node) => (node ? node.properties : null);
    const toList  = (nodes) => nodes.map((n) => (n ? toProps(n) : null)).filter(Boolean);

    return {
      car:            toProps(record.get('car')),
      owners:         record.get('owners').map((entry) => ({
                        ...toProps(entry.owner),
                        from_date: entry.from_date,
                        to_date:   entry.to_date,
                      })).filter((e) => e && e.owner_id),
      serviceEvents:  toList(record.get('serviceEvents')),
      serviceCenters: toList(record.get('serviceCenters')),
      claims:         toList(record.get('claims')),
      accidents:      toList(record.get('accidents')),
      registrations:  toList(record.get('registrations')),
      sellers:        record.get('sellers').map((entry) => ({
                        ...toProps(entry.seller),
                        sold_date: entry.date,
                      })).filter((e) => e && e.seller_id),
    };
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// getServiceEventsByVin
// ---------------------------------------------------------------------------
/**
 * Returns all ServiceEvent nodes linked to a Car via HAS_SERVICE_RECORD,
 * ordered by date ASCENDING so the contradiction detector can walk them
 * in chronological order.
 *
 * Returns only the fields the detection logic needs: event_id, date,
 * and odometer_km. Keeping the projection narrow avoids pulling unnecessary
 * data over the network.
 *
 * @param {string} vin
 * @returns {Array<{ event_id, date, odometer_km }>}
 */
async function getServiceEventsByVin(vin) {
  const session = openSession();
  try {
    // ORDER BY se.date ASC ensures events arrive in chronological order.
    // The detection service relies on this ordering — do not remove it.
    const result = await session.run(
      `
      MATCH (c:Car { vin: $vin })-[:HAS_SERVICE_RECORD]->(se:ServiceEvent)
      RETURN se.event_id   AS event_id,
             se.date       AS date,
             se.odometer_km AS odometer_km
      ORDER BY se.date ASC
      `,
      { vin }
    );

    // Convert each Neo4j record into a plain JS object.
    // neo4j-driver returns integer types as Neo4j Integer objects for large
    // numbers — .toNumber() converts them to JS numbers safely.
    return result.records.map((record) => ({
      event_id:    record.get('event_id'),
      date:        record.get('date'),
      // odometer_km is stored as an integer; use toNumber() in case the
      // driver returns a Neo4j Integer object (common for non-float values).
      odometer_km: record.get('odometer_km') != null
                     ? (typeof record.get('odometer_km').toNumber === 'function'
                         ? record.get('odometer_km').toNumber()
                         : Number(record.get('odometer_km')))
                     : null,
    }));
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// getOwnershipHistoryByVin
// ---------------------------------------------------------------------------
/**
 * Returns all Owner nodes connected to a Car via OWNED_BY, along with the
 * from_date and to_date properties stored on the relationship itself,
 * ordered by from_date ASCENDING.
 *
 * The overlap detector needs both the owner identity AND the relationship
 * dates — that's why we return them together rather than just the Owner node.
 *
 * @param {string} vin
 * @returns {Array<{ owner_id, name, owner_type, from_date, to_date }>}
 */
async function getOwnershipHistoryByVin(vin) {
  const session = openSession();
  try {
    // [ob:OWNED_BY] — naming the relationship `ob` lets us read ob.from_date
    // and ob.to_date (relationship properties) alongside the Owner node.
    const result = await session.run(
      `
      MATCH (c:Car { vin: $vin })-[ob:OWNED_BY]->(o:Owner)
      RETURN o.owner_id   AS owner_id,
             o.name       AS name,
             o.owner_type AS owner_type,
             ob.from_date AS from_date,
             ob.to_date   AS to_date
      ORDER BY ob.from_date ASC
      `,
      { vin }
    );

    return result.records.map((record) => ({
      owner_id:   record.get('owner_id'),
      name:       record.get('name'),
      owner_type: record.get('owner_type'),
      from_date:  record.get('from_date'),
      to_date:    record.get('to_date'),   // null means current owner
    }));
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// clearAllData
// ---------------------------------------------------------------------------
/**
 * ⚠️  DANGER: Deletes EVERY node and relationship in the database.
 * Used only by the seed script to reset state before reseeding.
 * Must NOT be called from any HTTP route.
 *
 * DETACH DELETE removes the node AND all its relationships in one shot —
 * you cannot DELETE a node that still has relationships without DETACH.
 */
async function clearAllData() {
  const session = openSession();
  try {
    await session.run('MATCH (n) DETACH DELETE n');
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  createCar,
  addOwner,
  addServiceEvent,
  addClaim,
  addAccident,
  addRegistration,
  addSeller,
  getFullHistoryByVin,
  getServiceEventsByVin,
  getOwnershipHistoryByVin,
  clearAllData,
};
