/**
 * config/env.js — Central environment-variable loader and validator.
 *
 * This module is the SINGLE SOURCE OF TRUTH for all configuration that comes
 * from environment variables.  Every other module in the app should import
 * its settings from here instead of reading process.env directly.
 *
 * dotenv reads the .env file in the project root and copies its key/value
 * pairs into process.env so they are available at runtime.
 */

const dotenv = require('dotenv');

// Load .env file into process.env.
// This must run BEFORE we read any env vars below.
dotenv.config();

// ----- Required environment variables -----
// If any of these are missing the server should NOT start — it would just
// fail later with a confusing connection error.
const REQUIRED_VARS = [
  'NEO4J_URI',       // Bolt URI for the CognoDB/Neo4j instance (e.g. bolt+s://…)
  'NEO4J_USERNAME',  // Database username
  'NEO4J_PASSWORD',  // Database password
  'NEO4J_DATABASE',  // Name of the specific database to use (e.g. "neo4j")
  'PORT',            // Port the Express server should listen on
];

// Collect every variable that is undefined or an empty string.
const missing = REQUIRED_VARS.filter(
  (varName) => !process.env[varName] || process.env[varName].trim() === ''
);

if (missing.length > 0) {
  // Throw immediately so the developer sees exactly what to fix.
  throw new Error(
    `Missing required environment variable(s): ${missing.join(', ')}. ` +
    'Please add them to your .env file or set them in your environment.'
  );
}

// ----- Export a clean config object -----
// Destructured for readability; everything downstream imports from here.
module.exports = {
  neo4jUri: process.env.NEO4J_URI,
  neo4jUsername: process.env.NEO4J_USERNAME,
  neo4jPassword: process.env.NEO4J_PASSWORD,
  neo4jDatabase: process.env.NEO4J_DATABASE,
  port: process.env.PORT,
};
