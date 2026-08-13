/**
 * db/driver.js — Neo4j / CognoDB driver singleton.
 *
 * IMPORTANT — REUSE THIS DRIVER INSTANCE:
 * The neo4j-driver package manages an internal connection pool.  You should
 * create exactly ONE driver instance for the lifetime of your application and
 * share it across all modules (repositories, services, etc.).  Creating a new
 * driver per request would exhaust connections and hurt performance.
 *
 * How Neo4j connections work (quick primer):
 *   1. `neo4j.driver(uri, auth)` creates a Driver — think of it as a
 *      connection-pool manager, NOT a single TCP socket.
 *   2. To run queries you open a Session from the driver, execute one or more
 *      Cypher statements, then close the session.
 *   3. Sessions are cheap to create; the driver is not.  That's why we keep
 *      exactly one driver and export it for the whole app.
 */

const neo4j = require('neo4j-driver');
const config = require('../config/env');

// ---------- Create the singleton driver ----------
// neo4j.auth.basic() wraps the username + password into the authentication
// token that the Bolt protocol expects.
const driver = neo4j.driver(
  config.neo4jUri,
  neo4j.auth.basic(config.neo4jUsername, config.neo4jPassword)
);

/**
 * verifyConnectivity
 *
 * Attempts to reach the database using the driver's built-in connectivity
 * check.  Returns `true` if the database is reachable, `false` otherwise.
 *
 * This function NEVER throws — it catches any network/auth errors internally
 * so callers (like the health-check middleware) can use a simple boolean.
 *
 * @returns {Promise<boolean>} true if the database is reachable
 */
async function verifyConnectivity() {
  try {
    // driver.verifyConnectivity() opens a real connection to the server,
    // performs a handshake, and confirms that authentication succeeds.
    // It resolves with server info on success, or rejects on failure.
    await driver.verifyConnectivity({ database: config.neo4jDatabase });
    return true;
  } catch (error) {
    // Log the underlying error for debugging, but don't let it propagate.
    console.error('Neo4j connectivity check failed:', error.message);
    return false;
  }
}

module.exports = {
  driver,
  verifyConnectivity,
};
