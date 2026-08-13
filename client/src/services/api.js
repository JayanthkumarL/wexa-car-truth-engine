/**
 * services/api.js
 *
 * Central API service layer for client-server HTTP communication.
 * All backend API interactions must pass through functions in this module.
 */

// Read base URL from environment variable, falling back to localhost:5000 for development.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Custom error class for API errors to distinguish HTTP error status codes.
 */
export class ApiError extends Error {
  constructor(message, status = 500, isNotFound = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNotFound = isNotFound;
  }
}

/**
 * getVehicleReport(vin)
 *
 * Fetches vehicle report data and contradiction analysis from the API.
 *
 * @param {string} vin - Vehicle Identification Number
 * @returns {Promise<Object>} - Parsed vehicle report JSON object
 * @throws {ApiError} - Throws ApiError on 404, 500, or network failure
 */
export async function getVehicleReport(vin) {
  if (!vin || !vin.trim()) {
    throw new ApiError('VIN parameter is required.', 400);
  }

  const endpoint = `${API_BASE_URL}/api/vehicles/${encodeURIComponent(vin.trim())}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    // Parse JSON body safely
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    // Handle HTTP 404: Vehicle Not Found
    if (response.status === 404) {
      const errorMessage = data?.error || `Vehicle with VIN "${vin}" was not found.`;
      throw new ApiError(errorMessage, 404, true);
    }

    // Handle other non-2xx HTTP errors (e.g., 500 Internal Server Error)
    if (!response.ok) {
      const errorMessage = data?.error || `Server error (${response.status}). Please try again later.`;
      throw new ApiError(errorMessage, response.status, false);
    }

    return data;
  } catch (error) {
    // Re-throw ApiError instances directly so callers can handle them
    if (error instanceof ApiError) {
      throw error;
    }

    // Wrap unexpected network failures (e.g. server offline, CORS issue)
    throw new ApiError(
      'Unable to connect to the server. Please check your internet connection or try again later.',
      0,
      false
    );
  }
}
