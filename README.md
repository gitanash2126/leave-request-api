# Leave Request API (Vercel Serverless Function)

A robust, production-ready implementation of a Vercel serverless leave-request endpoint (`api/leave-request.js`) in Node.js.

## What Was Fixed and Extended

### 1. Date Validation
- **Missing Date Checks**: Validates that both `startDate` and `endDate` are present and non-empty. Returns `400 Bad Request` with an explicit error message (`startDate is required`, `endDate is required`).
- **Date Validity Checks**: Validates parseability as valid dates (supports ISO 8601 strings, `YYYY-MM-DD`, timestamps). Enforces strict calendar checks for `YYYY-MM-DD` to prevent JavaScript date rollover bugs (e.g., rejecting impossible dates like `2026-02-31`). Returns `400 Bad Request` if invalid.
- **Chronological Order**: Enforces `endDate >= startDate`. Requests where `endDate` is strictly before `startDate` are rejected with `400 Bad Request` and `endDate cannot be before startDate`. Same-day leave requests (`startDate === endDate`) are supported.

### 2. Error Handling & Malformed Input
- **Malformed Body Protection**: Handles cases where `req.body` is null, undefined, a non-object (e.g. string or array), or invalid JSON. Safely attempts JSON parsing if the body arrives as a raw JSON string. Returns `400 Bad Request` instead of crashing.
- **Global `try...catch`**: Wraps handler execution to catch unexpected runtime exceptions, returning a clean `500 Internal Server Error` JSON payload without terminating the serverless worker.

### 3. Query Parameter Filtering (`GET /api/leave-request?status=...`)
- **Status Filter**: Supports filtering leave requests by status (e.g., `GET /api/leave-request?status=pending`).
- **Case-Insensitive Matching**: Matches statuses case-insensitively (`pending`, `Pending`, `PENDING`).
- **Backward Compatibility**: If no status filter is provided (or empty), returns all leave requests as before.
- **Environment Agnostic**: Works both with pre-parsed `req.query` (Vercel / Express) and falls back to URL parsing via `req.url` (raw Node.js `http`).

### 4. HTTP Method Handling (405)
- Only `GET` and `POST` methods are allowed.
- Any other HTTP method (`PUT`, `DELETE`, `PATCH`, `OPTIONS`, `HEAD`, etc.) immediately returns `405 Method Not Allowed`.
- Sets the standard `Allow: GET, POST` HTTP header according to RFC specifications.

---

## API Specification

### `POST /api/leave-request`
Submit a new leave request.

**Request Body**:
```json
{
  "employeeId": "EMP-101",
  "startDate": "2026-10-01",
  "endDate": "2026-10-05",
  "reason": "Family vacation"
}
```

**Success Response (`201 Created`)**:
```json
{
  "id": 1,
  "employeeId": "EMP-101",
  "startDate": "2026-10-01",
  "endDate": "2026-10-05",
  "reason": "Family vacation",
  "status": "pending",
  "createdAt": "2026-09-23T07:20:00.000Z"
}
```

**Error Responses (`400 Bad Request`)**:
- Missing `startDate` / `endDate`: `{ "error": "startDate is required" }`
- Invalid date format / calendar: `{ "error": "startDate is invalid. Please provide a valid date string (e.g., YYYY-MM-DD or ISO 8601)" }`
- `endDate` before `startDate`: `{ "error": "endDate cannot be before startDate" }`
- Malformed body: `{ "error": "Request body must be a valid JSON object" }`

---

### `GET /api/leave-request`
Retrieve all leave requests.

**Query Parameters (Optional)**:
- `status`: Filter by status (e.g. `pending`, `approved`, `rejected`).

**Success Response (`200 OK`)**:
```json
[
  {
    "id": 1,
    "employeeId": "EMP-101",
    "startDate": "2026-10-01",
    "endDate": "2026-10-05",
    "reason": "Family vacation",
    "status": "pending",
    "createdAt": "2026-09-23T07:20:00.000Z"
  }
]
```

---

### Other Methods (`PUT`, `DELETE`, etc.)
**Response (`405 Method Not Allowed`)**:
- Header: `Allow: GET, POST`
- Body:
```json
{
  "error": "Method DELETE Not Allowed",
  "allowedMethods": ["GET", "POST"]
}
```

---

## Running Automated Tests

Run the test suite using Node's built-in test runner:

```bash
npm test
```
