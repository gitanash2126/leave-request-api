import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./api/leave-request.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// Helper to enhance response with Express/Vercel-like convenience methods
function enhanceResponse(res) {
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (data) {
    this.setHeader("Content-Type", "application/json");
    this.end(JSON.stringify(data));
    return this;
  };
}

const server = http.createServer(async (req, res) => {
  enhanceResponse(res);

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  // Route: /api/leave-request
  if (pathname === "/api/leave-request") {
    // Collect request body
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const rawBody = Buffer.concat(chunks).toString("utf-8");
      if (rawBody.trim().length > 0) {
        try {
          req.body = JSON.parse(rawBody);
        } catch {
          // Leave as raw string so handler's malformed JSON error handler can catch it
          req.body = rawBody;
        }
      } else if (req.method === "POST") {
        req.body = undefined;
      }

      // Attach parsed query parameters
      req.query = Object.fromEntries(url.searchParams.entries());

      handler(req, res);
    });
    return;
  }

  // Static files or fallback to public/index.html
  let filePath = path.join(__dirname, "public", pathname === "/" ? "index.html" : pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, "public", "index.html");
  }

  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    let contentType = "text/html";
    if (ext === ".js") contentType = "application/javascript";
    if (ext === ".css") contentType = "text/css";
    if (ext === ".json") contentType = "application/json";
    if (ext === ".svg") contentType = "image/svg+xml";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error: " + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Leave Management Portal & API running live at: http://localhost:${PORT}`);
  console.log(`📡 Serverless Endpoint: http://localhost:${PORT}/api/leave-request\n`);
});
