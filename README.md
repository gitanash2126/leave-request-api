# 🏢 SunSea LeavePortal — Enterprise Leave Request Service & Serverless API

[![CI Test Suite](https://github.com/gitanash2126/leave-request-api/actions/workflows/ci.yml/badge.svg)](https://github.com/gitanash2126/leave-request-api/actions)
![Tests Passing](https://img.shields.io/badge/tests-26%2F26%20passing-brightgreen.svg?style=flat-square)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg?style=flat-square)
![Vercel Ready](https://img.shields.io/badge/deploy-Vercel%20Serverless-black?style=flat-square&logo=vercel)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

> A production-grade, highly reliable HR Leave Request service engineered in Node.js (Vercel Serverless Function architecture). Features strict calendar date validation, defensive error resilience, dynamic status query filtering, RFC-compliant HTTP method handling, and an interactive HR management portal & API playground.

---

## 🌟 Executive Summary (For Hiring Managers & HR)

This repository demonstrates the difference between code that "just works" and **production-grade engineering**:
1. **Zero-Crash Resilience**: Eliminates unhandled serverless exceptions with multi-layer payload type-guarding and structured error responses.
2. **True Calendar Integrity**: Prevents subtle date rollover bugs (e.g. JavaScript parsing `2026-02-31` as March 3) by verifying UTC calendar day bounds.
3. **Developer & Recruiter Friendly**: Includes a full interactive Web Dashboard (`public/index.html`) where non-technical evaluators can submit requests visually and technical leads can execute interactive API test presets with zero setup.
4. **100% Native & Fast**: Zero external production dependencies (`node:http`, `node:test`, modern ESM). Runs locally with `npm start` and deploys seamlessly to Vercel.

---

## 🚀 Live Demo & Interactive Showcase

You can test and view this application live:
1. **Interactive HR Dashboard**: Submit leave requests, observe real-time duration calculation, and review live status badges.
2. **Interactive API Playground**: Send custom HTTP requests (`GET`, `POST`, `PUT`, `DELETE`) with one-click test presets, inspect response latency, HTTP status codes, and JSON payloads.
3. **Architecture Deep Dive**: In-depth explanations of edge cases and validation design decisions.

### Local 1-Click Launch:
```bash
git clone https://github.com/gitanash2126/leave-request-api.git
cd leave-request-api
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🛠️ Key Fixes & Engineering Improvements

### 1. Strict Date & Calendar Validation (`400 Bad Request`)
* **Missing Dates**: Explicitly rejects missing, `null`, or whitespace-only `startDate` / `endDate` fields.
* **Strict Date Parsing**: Validates date strings (ISO 8601, `YYYY-MM-DD`, and numeric timestamps).
* **Calendar Overflow Prevention**: In standard JavaScript V8, `new Date("2026-02-31")` automatically rolls over to March 3. Our validator checks the UTC calendar day, month, and year boundaries so invalid dates are rejected with a clear 400 error message.
* **Chronological Ordering**: Ensures `endDate` cannot be before `startDate`. Single-day leaves (`startDate === endDate`) are permitted.

### 2. Defensive Error Handling & Input Sanitization (`400` / `500`)
* **Malformed JSON Safety**: If a client sends an unparsed string or broken JSON, it safely catches syntax errors and responds with `{ error: "Malformed JSON in request body" }` instead of crashing.
* **Type Guarding**: Verifies `req.body` is a non-null, non-array object.
* **Global Serverless Protection**: A top-level `try...catch` wrapper prevents unhandled worker crashes and guarantees a structured `{ error: "Internal Server Error" }` 500 response.

### 3. Dynamic Query Filtering on GET (`?status=...`)
* Supports status filtering (e.g. `/api/leave-request?status=pending`).
* **Case-Insensitive**: Safely matches `pending`, `Pending`, or `PENDING`.
* **Universal Compatibility**: Works with Vercel's pre-parsed `req.query` as well as raw Node.js `req.url` query strings.
* **Full Backward Compatibility**: Returns the full list when no filter is provided.

### 4. HTTP Method Enforcement (`405 Method Not Allowed`)
* Only `GET` and `POST` are accepted on `/api/leave-request`.
* Any other method (`PUT`, `DELETE`, `PATCH`, `OPTIONS`, `HEAD`) returns `405 Method Not Allowed`.
* Complies with **RFC 7231 / RFC 9110** by including the `Allow: GET, POST` response header.

---

## 📖 API Documentation & Examples

### Submit Leave Request
**`POST /api/leave-request`**

```bash
curl -X POST http://localhost:3000/api/leave-request \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP-1042",
    "startDate": "2026-10-01",
    "endDate": "2026-10-05",
    "reason": "Annual family vacation"
  }'
```

**Response (`201 Created`)**:
```json
{
  "id": 1,
  "employeeId": "EMP-1042",
  "startDate": "2026-10-01",
  "endDate": "2026-10-05",
  "reason": "Annual family vacation",
  "status": "pending",
  "createdAt": "2026-09-23T07:22:15.000Z"
}
```

---

### Retrieve & Filter Requests
**`GET /api/leave-request?status=pending`**

```bash
curl -X GET "http://localhost:3000/api/leave-request?status=pending"
```

**Response (`200 OK`)**:
```json
[
  {
    "id": 1,
    "employeeId": "EMP-1042",
    "startDate": "2026-10-01",
    "endDate": "2026-10-05",
    "reason": "Annual family vacation",
    "status": "pending",
    "createdAt": "2026-09-23T07:22:15.000Z"
  }
]
```

---

### Unsupported Method Handling
**`PUT /api/leave-request`**

```bash
curl -i -X PUT http://localhost:3000/api/leave-request
```

**Response (`405 Method Not Allowed`)**:
```http
HTTP/1.1 405 Method Not Allowed
Allow: GET, POST
Content-Type: application/json

{
  "error": "Method PUT Not Allowed",
  "allowedMethods": ["GET", "POST"]
}
```

---

## 🧪 Automated Test Suite

The project includes 26 automated unit and integration tests covering all validation branches and error edge cases:

```bash
npm test
```

### Test Coverage Highlights:
- ✅ Missing `startDate` / `endDate` rejection
- ✅ Whitespace & non-string rejection
- ✅ Invalid date string rejection
- ✅ Calendar overflow boundary rejection (Feb 31)
- ✅ `endDate < startDate` chronological order rejection
- ✅ Valid same-day and multi-day request creation
- ✅ Malformed JSON string parsing and syntax error interception
- ✅ Non-object / Array body rejection
- ✅ Unhandled exception 500 mapping
- ✅ Query parameter filtering (case-insensitive)
- ✅ Fallback URL query parsing
- ✅ HTTP 405 status & RFC `Allow` headers across all unsupported methods

---

## 🚢 Deploying to Vercel (Production)

This repository is pre-configured for instant zero-configuration deployment to [Vercel](https://vercel.com):

1. Fork or import `https://github.com/gitanash2126/leave-request-api` in your Vercel Dashboard.
2. Click **Deploy**.
3. Vercel automatically maps `/api/leave-request.js` as the serverless API and `public/index.html` as the live frontend web app!

---

## 👨‍💻 Author

**Muhammad Anash**  
- **GitHub**: [@gitanash2126](https://github.com/gitanash2126)  
- **Role**: Full-Stack & Backend Software Engineer  
- **Specialization**: High-reliability APIs, Serverless Architecture, Node.js & Modern Web Systems
