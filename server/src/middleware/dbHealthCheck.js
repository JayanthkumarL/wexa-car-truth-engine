/**
 * middleware/dbHealthCheck.js — Database health-check endpoint handler.
 *
 * This handler is meant to be wired to GET /health so that load balancers,
 * monitoring tools, or developers can quickly verify the API can talk to the
 * CognoDB (Neo4j-compatible) database.
 */

const { verifyConnectivity } = require('../db/driver');

/**
 * dbHealthCheck
 *
 * Express request handler (async).  It calls verifyConnectivity() which
 * pings the Neo4j/CognoDB server and returns true/false.
 *
 * Responses:
 *   200  { status: "ok",    database: "connected" }   — DB is reachable
 *   503  { status: "error", message: "..." }          — DB is not reachable
 *
 * The entire function is wrapped in try/catch so that even an unexpected
 * runtime error will result in a clean JSON response, never an unhandled
 * exception that could crash the server.
 */
async function dbHealthCheck(req, res) {
  try {
    const isConnected = await verifyConnectivity();

    if (isConnected) {
      // Database responded successfully — everything is healthy.
      return res.status(200).json({
        status: 'ok',
        database: 'connected',
      });
    }

    // verifyConnectivity() returned false — the database is unreachable.
    return res.status(503).json({
      status: 'error',
      message:
        'Unable to connect to the CognoDB database. ' +
        'Check that the NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD ' +
        'environment variables are correct and that the database is running.',
    });
  } catch (error) {
    // Catch-all for truly unexpected errors (e.g. the driver module failed
    // to load).  Log the real error for the developer, but return a safe
    // JSON response to the client.
    console.error('Health-check encountered an unexpected error:', error);
    return res.status(503).json({
      status: 'error',
      message: 'Health check failed due to an unexpected server error.',
    });
  }
}

module.exports = dbHealthCheck;
