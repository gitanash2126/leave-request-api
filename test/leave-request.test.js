import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import handler, { leaveRequests } from "../api/leave-request.js";

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
  };
  return res;
}

describe("Leave Request Serverless Endpoint", () => {
  beforeEach(() => {
    // Clear in-memory array before each test
    leaveRequests.length = 0;
  });

  describe("1. Date Validation", () => {
    it("rejects request when startDate is missing", () => {
      const req = {
        method: "POST",
        body: {
          employeeId: "EMP-001",
          endDate: "2026-10-05",
          reason: "Vacation",
        },
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /startDate is required/i);
    });

    it("rejects request when startDate is empty or whitespace", () => {
      const req = {
        method: "POST",
        body: {
          employeeId: "EMP-001",
          startDate: "   ",
          endDate: "2026-10-05",
          reason: "Vacation",
        },
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /startDate is required/i);
    });

    it("rejects request when startDate is an invalid string", () => {
      const req = {
        method: "POST",
        body: {
          employeeId: "EMP-001",
          startDate: "invalid-date",
          endDate: "2026-10-05",
          reason: "Vacation",
        },
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /startDate is invalid/i);
    });

    it("rejects request when startDate has an impossible calendar date (e.g. Feb 31)", () => {
      const req = {
        method: "POST",
        body: {
          employeeId: "EMP-001",
          startDate: "2026-02-31",
          endDate: "2026-03-05",
          reason: "Vacation",
        },
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /startDate is invalid/i);
    });

    it("rejects request when endDate is missing", () => {
      const req = {
        method: "POST",
        body: {
          employeeId: "EMP-001",
          startDate: "2026-10-01",
          reason: "Vacation",
        },
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /endDate is required/i);
    });

    it("rejects request when endDate is invalid", () => {
      const req = {
        method: "POST",
        body: {
          employeeId: "EMP-001",
          startDate: "2026-10-01",
          endDate: "not-a-valid-date",
          reason: "Vacation",
        },
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /endDate is invalid/i);
    });

    it("rejects request when endDate is before startDate", () => {
      const req = {
        method: "POST",
        body: {
          employeeId: "EMP-001",
          startDate: "2026-10-10",
          endDate: "2026-10-05",
          reason: "Vacation",
        },
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /endDate cannot be before startDate/i);
    });

    it("accepts valid request where startDate == endDate (single-day leave)", () => {
      const req = {
        method: "POST",
        body: {
          employeeId: "EMP-001",
          startDate: "2026-10-05",
          endDate: "2026-10-05",
          reason: "Personal Day",
        },
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.id, 1);
      assert.equal(res.body.employeeId, "EMP-001");
      assert.equal(res.body.startDate, "2026-10-05");
      assert.equal(res.body.endDate, "2026-10-05");
      assert.equal(res.body.status, "pending");
      assert.ok(res.body.createdAt);
    });

    it("accepts valid request where startDate < endDate", () => {
      const req = {
        method: "POST",
        body: {
          employeeId: "EMP-002",
          startDate: "2026-10-01",
          endDate: "2026-10-10",
          reason: "Vacation trip",
        },
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.id, 1);
      assert.equal(res.body.employeeId, "EMP-002");
    });
  });

  describe("2. Error Handling & Malformed Input", () => {
    it("returns 400 when body is undefined or null", () => {
      const req = {
        method: "POST",
        body: null,
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /JSON object/i);
    });

    it("returns 400 when body is an array instead of object", () => {
      const req = {
        method: "POST",
        body: [],
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /JSON object/i);
    });

    it("returns 400 when body is a malformed JSON string", () => {
      const req = {
        method: "POST",
        body: '{"employeeId": "EMP-001", invalid}',
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /Malformed JSON/i);
    });

    it("parses valid JSON string if passed in req.body", () => {
      const req = {
        method: "POST",
        body: JSON.stringify({
          employeeId: "EMP-003",
          startDate: "2026-11-01",
          endDate: "2026-11-05",
          reason: "Conference",
        }),
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.employeeId, "EMP-003");
    });

    it("returns clean 500 response on unexpected error", () => {
      const req = {
        method: "POST",
        get body() {
          throw new Error("Simulated unexpected failure");
        },
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, "Internal Server Error");
      assert.equal(res.body.message, "Simulated unexpected failure");
    });
  });

  describe("3. GET Status Query Filtering", () => {
    beforeEach(() => {
      leaveRequests.push(
        {
          id: 1,
          employeeId: "EMP-001",
          startDate: "2026-10-01",
          endDate: "2026-10-05",
          status: "pending",
        },
        {
          id: 2,
          employeeId: "EMP-002",
          startDate: "2026-10-06",
          endDate: "2026-10-08",
          status: "approved",
        },
        {
          id: 3,
          employeeId: "EMP-003",
          startDate: "2026-10-10",
          endDate: "2026-10-12",
          status: "rejected",
        },
        {
          id: 4,
          employeeId: "EMP-004",
          startDate: "2026-10-15",
          endDate: "2026-10-16",
          status: "pending",
        }
      );
    });

    it("returns all leave requests when no status filter is provided (req.query)", () => {
      const req = {
        method: "GET",
        query: {},
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.length, 4);
    });

    it("returns all leave requests when no query object exists at all", () => {
      const req = {
        method: "GET",
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.length, 4);
    });

    it("filters by ?status=pending via req.query", () => {
      const req = {
        method: "GET",
        query: { status: "pending" },
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.length, 2);
      assert.ok(res.body.every((r) => r.status === "pending"));
    });

    it("filters by status case-insensitively (?status=PENDING)", () => {
      const req = {
        method: "GET",
        query: { status: "PENDING" },
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.length, 2);
      assert.ok(res.body.every((r) => r.status === "pending"));
    });

    it("filters by ?status=approved", () => {
      const req = {
        method: "GET",
        query: { status: "approved" },
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.length, 1);
      assert.equal(res.body[0].id, 2);
    });

    it("returns empty array when status filter does not match any items", () => {
      const req = {
        method: "GET",
        query: { status: "nonexistent" },
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.body, []);
    });

    it("supports parsing query string from req.url if req.query is absent", () => {
      const req = {
        method: "GET",
        url: "/api/leave-request?status=rejected",
      };
      const res = createMockRes();

      handler(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.length, 1);
      assert.equal(res.body[0].status, "rejected");
    });
  });

  describe("4. HTTP Method Handling (405)", () => {
    for (const method of ["PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]) {
      it(`returns 405 Method Not Allowed for ${method}`, () => {
        const req = { method };
        const res = createMockRes();

        handler(req, res);

        assert.equal(res.statusCode, 405);
        assert.match(res.body.error, new RegExp(`Method ${method} Not Allowed`, "i"));
        assert.equal(res.headers["Allow"], "GET, POST");
      });
    }
  });
});
