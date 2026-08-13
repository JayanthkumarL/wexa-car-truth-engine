/**
 * hooks/useVehicleHistory.js
 *
 * Custom React hook to manage fetching vehicle history and contradiction report data.
 *
 * STATE MACHINE MODEL:
 *
 *   ┌───────────┐         vin provided         ┌─────────────┐
 *   │   IDLE    │ ───────────────────────────> │   LOADING   │
 *   │ (no VIN)  │                              │ (in-flight) │
 *   └───────────┘                              └──────┬──────┘
 *         ▲                                           │
 *         │                                  ┌────────┴────────┐
 *         │ vin cleared                      │                 │
 *         └─────────────────────────── fetch succeeds     fetch fails
 *                                            │                 │
 *                                            ▼                 ▼
 *                                      ┌───────────┐     ┌───────────┐
 *                                      │  SUCCESS  │     │   ERROR   │
 *                                      │ (data set)│     │(error set)│
 *                                      └───────────┘     └───────────┘
 *
 * State values returned:
 *   - data: Vehicle report JSON object (or null)
 *   - loading: boolean indicating whether HTTP request is pending
 *   - error: Object with { message, isNotFound, status } (or null)
 */

import { useState, useEffect } from 'react';
import { getVehicleReport, ApiError } from '../services/api';

/**
 * useVehicleHistory(vin)
 *
 * @param {string|undefined} vin - The Vehicle Identification Number to query
 * @returns {{ data: Object|null, loading: boolean, error: Object|null }}
 */
export function useVehicleHistory(vin) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Gracefully handle empty / undefined / null VIN parameter (Idle State)
    if (!vin || !vin.trim()) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Flag to prevent updating state if component unmounts while request is in-flight
    let isCancelled = false;

    async function fetchHistory() {
      setLoading(true);
      setError(null);

      try {
        const report = await getVehicleReport(vin);
        if (!isCancelled) {
          setData(report);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          setData(null);

          // Distinguish between 404 (Not Found) vs Server/Network Error for UI handling
          if (err instanceof ApiError) {
            setError({
              message: err.message,
              isNotFound: err.isNotFound,
              status: err.status,
            });
          } else {
            setError({
              message: err.message || 'An unexpected error occurred.',
              isNotFound: false,
              status: 500,
            });
          }
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchHistory();

    // Cleanup function runs if component unmounts or VIN changes before fetch finishes
    return () => {
      isCancelled = true;
    };
  }, [vin]);

  return { data, loading, error };
}
