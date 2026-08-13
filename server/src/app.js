/**
 * app.js — Entry point for the wexa-car-truth-engine Express API server.
 *
 * This file wires up the Express application with:
 *   • CORS support (so the React client on a different port can call the API)
 *   • JSON body parsing
 *   • A root route (GET /) for a quick "is the server up?" check
 *   • A health-check route (GET /health) that also verifies the CognoDB
 *     database connection
 */

const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const dbHealthCheck = require('./middleware/dbHealthCheck');
const vehicleRoutes = require('./routes/vehicleRoutes');

// ---------- Create the Express app ----------
const app = express();

// ----- Global middleware -----
// cors() allows cross-origin requests from the React frontend.
app.use(cors());

// express.json() parses incoming request bodies with Content-Type
// application/json so that req.body is a plain JavaScript object.
app.use(express.json());

// ----- Routes -----

// Root route — lightweight check that the server process itself is alive.
app.get('/', (req, res) => {
  res.json({ message: 'wexa-car-truth-engine API is running' });
});

// Health-check route — verifies both the server AND the database connection.
app.get('/health', dbHealthCheck);

// Vehicle API routes
app.use('/api/vehicles', vehicleRoutes);

// ---------- Start the server ----------
app.listen(config.port, () => {
  console.log(`\n🚀  wexa-car-truth-engine server is running on port ${config.port}`);
  console.log(`👉  Check database connectivity: http://localhost:${config.port}/health\n`);
});
