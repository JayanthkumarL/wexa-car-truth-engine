/**
 * controllers/vehicleController.js
 *
 * Controller layer for vehicle operations.
 *
 * Controllers in this architecture are THIN:
 *   - They extract inputs from HTTP requests (e.g., req.params.vin).
 *   - They delegate data retrieval and business logic to repositories/services.
 *   - They shape and send the HTTP response (status codes and JSON payload).
 *   - They handle high-level errors gracefully without exposing stack traces.
 */

const carRepository = require('../repositories/carRepository');
const { detectContradictions } = require('../services/contradictionDetector');

/**
 * getVehicleReport
 *
 * GET /api/vehicles/:vin
 *
 * Fetches full graph history for a vehicle and runs contradiction detection
 * concurrently using Promise.all to minimize endpoint latency.
 *
 * Response JSON Shape (200 OK):
 * {
 *   vin: string,
 *   car: { vin, make, model, year, current_status },
 *   owners: [{ owner_id, name, owner_type, from_date, to_date }],
 *   service_events: [{ event_id, date, odometer_km, description }],
 *   insurance_claims: [{ claim_id, date, amount, claim_type }],
 *   accidents: [{ accident_id, date, severity, description }],
 *   registrations: [{ registration_id, date, state }],
 *   sellers: [{ seller_id, name, seller_type, sold_date }],
 *   contradictions: {
 *     status: "clean" | "flagged",
 *     contradictions_found: number,
 *     flags: Array<{ type, severity, message, related_event_ids | related_owner_ids }>
 *   }
 * }
 *
 * Error Responses:
 *   404 Not Found : { error: "Vehicle not found", vin }
 *   500 Internal Error : { error: "Internal server error" }
 */
async function getVehicleReport(req, res) {
  try {
    const { vin } = req.params;

    // Run graph traversal query and contradiction checks concurrently
    const [history, contradictionResult] = await Promise.all([
      carRepository.getFullHistoryByVin(vin),
      detectContradictions(vin),
    ]);

    // Handle "vehicle not found" case explicitly
    if (!history || !history.car) {
      return res.status(404).json({
        error: 'Vehicle not found',
        vin,
      });
    }

    // Combine history graph and contradiction flags into a unified report
    const responsePayload = {
      vin,
      car: history.car,
      owners: history.owners || [],
      service_events: history.serviceEvents || [],
      insurance_claims: history.claims || [],
      accidents: history.accidents || [],
      registrations: history.registrations || [],
      sellers: history.sellers || [],
      contradictions: {
        status: contradictionResult.status,
        contradictions_found: contradictionResult.contradictions_found,
        flags: contradictionResult.flags,
      },
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    // Log full error details on the server for debugging
    console.error(`Error generating vehicle report for VIN ${req.params.vin}:`, error);

    // Return a clean, non-leaky response to the client
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

module.exports = {
  getVehicleReport,
};
