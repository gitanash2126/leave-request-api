// api/leave-request.js — Vercel serverless function (Node.js)
// Employees submit leave requests here. Fixed and extended.

export const leaveRequests = []; // in-memory store is fine for this exercise

/**
 * Validates whether a value is a valid, parseable date string or number.
 * Ensures strict calendar validity for YYYY-MM-DD representations (e.g., rejects 2026-02-31).
 *
 * @param {any} dateVal
 * @returns {Date | null} Parsed Date object or null if invalid
 */
function parseAndValidateDate(dateVal) {
  if (dateVal === null || dateVal === undefined) {
    return null;
  }

  // Reject booleans, objects, arrays
  if (typeof dateVal !== "string" && typeof dateVal !== "number") {
    return null;
  }

  if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();
    if (!trimmed) {
      return null;
    }

    // Strict validation for YYYY-MM-DD format to prevent invalid day rollover (e.g. Feb 31)
    const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10);
      const day = parseInt(ymdMatch[3], 10);

      if (month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
      }

      const d = new Date(Date.UTC(year, month - 1, day));
      if (
        d.getUTCFullYear() !== year ||
        d.getUTCMonth() !== month - 1 ||
        d.getUTCDate() !== day
      ) {
        return null;
      }
      return d;
    }

    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  }

  // Timestamp number
  const parsed = new Date(dateVal);
  if (isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

/**
 * Extracts query parameters from req.query or req.url
 *
 * @param {any} req
 * @returns {Record<string, string>}
 */
function getQueryParams(req) {
  if (req && req.query && typeof req.query === "object") {
    return req.query;
  }
  try {
    const host = req?.headers?.host || "localhost";
    const url = new URL(req?.url || "", `http://${host}`);
    return Object.fromEntries(url.searchParams.entries());
  } catch {
    return {};
  }
}

export default function handler(req, res) {
  try {
    // 4. Handle any unsupported HTTP method with a 405 Method Not Allowed
    if (req.method !== "POST" && req.method !== "GET") {
      if (typeof res.setHeader === "function") {
        res.setHeader("Allow", "GET, POST");
      }
      return res.status(405).json({
        error: `Method ${req.method} Not Allowed`,
        allowedMethods: ["GET", "POST"],
      });
    }

    // Handle GET: retrieve all leave requests or filter by ?status=...
    if (req.method === "GET") {
      const query = getQueryParams(req);
      const { status } = query;

      // 3. Add ?status=pending (or any status) query filter
      if (status !== undefined && status !== null && String(status).trim() !== "") {
        const targetStatus = String(status).trim().toLowerCase();
        const filtered = leaveRequests.filter(
          (request) =>
            typeof request.status === "string" &&
            request.status.toLowerCase() === targetStatus
        );
        return res.status(200).json(filtered);
      }

      // No status filter: return all
      return res.status(200).json(leaveRequests);
    }

    // Handle POST: submit a new leave request
    if (req.method === "POST") {
      // 2. Add error handling for malformed input
      let body = req.body;

      // Parse stringified JSON if req.body was not auto-parsed by middleware
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          return res.status(400).json({
            error: "Malformed JSON in request body",
          });
        }
      }

      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return res.status(400).json({
          error: "Request body must be a valid JSON object",
        });
      }

      const { employeeId, startDate, endDate, reason } = body;

      // 1. Add proper date validation
      // Check startDate missing
      if (
        startDate === undefined ||
        startDate === null ||
        (typeof startDate === "string" && startDate.trim() === "")
      ) {
        return res.status(400).json({
          error: "startDate is required",
        });
      }

      const parsedStartDate = parseAndValidateDate(startDate);
      if (!parsedStartDate) {
        return res.status(400).json({
          error: "startDate is invalid. Please provide a valid date string (e.g., YYYY-MM-DD or ISO 8601)",
        });
      }

      // Check endDate missing
      if (
        endDate === undefined ||
        endDate === null ||
        (typeof endDate === "string" && endDate.trim() === "")
      ) {
        return res.status(400).json({
          error: "endDate is required",
        });
      }

      const parsedEndDate = parseAndValidateDate(endDate);
      if (!parsedEndDate) {
        return res.status(400).json({
          error: "endDate is invalid. Please provide a valid date string (e.g., YYYY-MM-DD or ISO 8601)",
        });
      }

      // Check endDate is before startDate
      if (parsedEndDate.getTime() < parsedStartDate.getTime()) {
        return res.status(400).json({
          error: "endDate cannot be before startDate",
        });
      }

      const request = {
        id: leaveRequests.length + 1,
        employeeId,
        startDate,
        endDate,
        reason,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      leaveRequests.push(request);
      return res.status(201).json(request);
    }
  } catch (error) {
    // 2. Catch unexpected runtime errors and return clean 500 response
    console.error("Unhandled error in /api/leave-request:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
