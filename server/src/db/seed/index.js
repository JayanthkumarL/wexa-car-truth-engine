/**
 * db/seed/index.js — Database seed script.
 *
 * Wipes the database clean and populates it with 5 synthetic vehicles,
 * each representing a distinct fraud/anomaly detection scenario.
 *
 * Run directly with:
 *   node src/db/seed/index.js
 * (from the server/ directory)
 *
 * DO NOT import this file from app.js or any route — it is a one-shot
 * script intended to be executed on the command line only.
 */

const { driver }   = require('../driver');
const repo         = require('../../repositories/carRepository');
const { vehicles } = require('./vehicleData');

// ---------------------------------------------------------------------------
// seedVehicle — seeds a single vehicle object into the graph
// ---------------------------------------------------------------------------
async function seedVehicle(vehicle, index) {
  const label = `[${index + 1}/${vehicles.length}] ${vehicle.car.vin} - ${vehicle.scenario}`;
  console.log(`\n  Seeding vehicle ${label}...`);

  // 1. Create the Car node (MERGE — idempotent)
  await repo.createCar(vehicle.car);
  console.log(`    ✓ Car node created`);

  // 2. Add all owners (each with OWNED_BY relationship)
  for (const ownerEntry of vehicle.owners) {
    await repo.addOwner(
      vehicle.car.vin,
      ownerEntry.owner,
      ownerEntry.fromDate,
      ownerEntry.toDate
    );
  }
  if (vehicle.owners.length > 0) {
    console.log(`    ✓ ${vehicle.owners.length} owner(s) added`);
  }

  // 3. Add registration(s)
  for (const reg of vehicle.registrations) {
    await repo.addRegistration(vehicle.car.vin, reg);
  }
  if (vehicle.registrations.length > 0) {
    console.log(`    ✓ ${vehicle.registrations.length} registration(s) added`);
  }

  // 4. Add insurance claims BEFORE accidents so the RELATED_TO link can be
  //    established immediately when the accident is inserted.
  for (const claim of vehicle.claims) {
    await repo.addClaim(vehicle.car.vin, claim);
  }
  if (vehicle.claims.length > 0) {
    console.log(`    ✓ ${vehicle.claims.length} insurance claim(s) added`);
  }

  // 5. Add accidents (and link to claims if relatedClaimId is set)
  for (const accEntry of vehicle.accidents) {
    await repo.addAccident(
      vehicle.car.vin,
      accEntry.accident,
      accEntry.relatedClaimId || null
    );
  }
  if (vehicle.accidents.length > 0) {
    console.log(`    ✓ ${vehicle.accidents.length} accident(s) added`);
  }

  // 6. Add service events (also creates ServiceCenter node and rels)
  for (const svcEntry of vehicle.serviceEvents) {
    await repo.addServiceEvent(vehicle.car.vin, svcEntry.center, svcEntry.event);
  }
  if (vehicle.serviceEvents.length > 0) {
    console.log(`    ✓ ${vehicle.serviceEvents.length} service event(s) added`);
  }

  // 7. Add sellers (SOLD_BY relationship)
  for (const selEntry of vehicle.sellers) {
    await repo.addSeller(vehicle.car.vin, selEntry.seller, selEntry.date);
  }
  if (vehicle.sellers.length > 0) {
    console.log(`    ✓ ${vehicle.sellers.length} seller(s) added`);
  }

  console.log(`  ✅ Vehicle ${label} seeded successfully.`);
}

// ---------------------------------------------------------------------------
// main — orchestrates the full seed run
// ---------------------------------------------------------------------------
async function main() {
  console.log('=============================================================');
  console.log(' wexa-car-truth-engine — Database Seed Script');
  console.log('=============================================================');

  // ⚠️  WARNING: This will permanently delete ALL existing data in the
  //    database before inserting the seed dataset.
  console.log('\n⚠️  WARNING: Clearing all existing data from the database...');
  await repo.clearAllData();
  console.log('  ✓ Database cleared.\n');

  console.log(`Seeding ${vehicles.length} vehicles...\n`);

  for (let i = 0; i < vehicles.length; i++) {
    await seedVehicle(vehicles[i], i);
  }

  // Final summary
  console.log('\n=============================================================');
  console.log(` Seed complete! ${vehicles.length} vehicles loaded into CognoDB.`);
  console.log('');
  console.log(' Scenarios seeded:');
  vehicles.forEach((v, i) => {
    console.log(`   ${i + 1}. [${v.car.vin}] ${v.scenario} — ${v.car.make} ${v.car.model}`);
  });
  console.log('');
  console.log(' Verify in the CognoDB browser with:');
  console.log('   MATCH (n) RETURN labels(n), count(n)');
  console.log(' Or fetch a full car history:');
  console.log('   MATCH (c:Car)-[r]->(n) RETURN c, r, n LIMIT 50');
  console.log('=============================================================\n');
}

// ---------------------------------------------------------------------------
// Run and handle errors
// ---------------------------------------------------------------------------
main()
  .catch((err) => {
    console.error('\n❌  Seed script failed with an error:');
    console.error(err);
    // Exit with non-zero code so CI/shell scripts know something went wrong
    process.exit(1);
  })
  .finally(async () => {
    // Always close the shared driver so the Node process exits cleanly.
    // Without this the process would hang on open Bolt connections.
    await driver.close();
  });
