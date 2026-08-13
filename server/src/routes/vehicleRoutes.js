/**
 * routes/vehicleRoutes.js
 *
 * Express routes for Vehicle resource endpoints.
 */

const express = require('express');
const vehicleController = require('../controllers/vehicleController');

const router = express.Router();

// GET /api/vehicles/:vin — Fetches full vehicle history report and contradiction analysis
router.get('/:vin', vehicleController.getVehicleReport);

module.exports = router;
