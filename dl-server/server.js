const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.DL_PORT || 5200);
const DIST_DIR = process.env.DL_DIST_DIR || "/opt/tcm/dist";
const TOKENS_FILE = process.env.DL_TOKENS_FILE || "/opt/tcm/dl-server/tokens.json";
const ADMIN_TOKEN = process.env.DL_ADMIN_TOKEN || "";
const BASE_URL = process.env.DL_BASE_URL || "https://api.thecodemunk.in/dl";
const TTL_MS = Number(process.env.DL_TTL_HOURS || 72) * 3600 * 1000;

let tokens = {};

function loadTokens() {
  try {
    const raw = fs.readFileSync(TOKENS_FILE, "utf8");
    tokens = JSON.parse(raw);
  } catch {
    tokens = {};
  }
  prune();
}

function saveTokens() {
  fs.mkdirSync(path.dirname(TOKENS_FILE), { recursive: true });
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

function prune() {
  const now = Date.now();
  let changed = false;
  for (const [token, rec] of Object.entries(tokens)) {
    if (rec.used || now - rec.createdAt > TTL_MS) {
      delete tokens[token];
      changed = true;
    }
  }
  if (changed) saveTokens();
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function resolveFile(name) {
  if (typeof name !== "string") return null;
  const base = path.basename(name);
  if (base !== name) return null;
  const full = path.join(DIST_DIR, base);
  if (!full.startsWith(path.join(DIST_DIR, ""))) return null;
  return full;
}

function newToken() {
  return crypto.randomBytes(24).toString("hex");
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = url.pathname;

  if (req.method === "POST" && pathname === "/_mint") {
    if (req.headers["x-dl-admin"] !== ADMIN_TOKEN) {
      return json(res, 401, { error: "unauthorized" });
    }
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      let file;
      try {
        file = JSON.parse(body).file;
      } catch {
        return json(res, 400, { error: "invalid json" });
      }
      const full = resolveFile(file);
      if (!full || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
        return json(res, 404, { error: "file not found" });
      }
      const token = newToken();
      tokens[token] = { file, createdAt: Date.now(), used: false };
      saveTokens();
      return json(res, 200, {
        url: `${BASE_URL}/${encodeURIComponent(file)}?t=${token}`,
      });
    });
    return;
  }

  if (req.method === "GET" && pathname.length > 1) {
    const file = pathname.replace(/^\/+/, "");
    const token = url.searchParams.get("t");
    const full = resolveFile(file);
    if (!full) return json(res, 404, { error: "not found" });

    const rec = tokens[token || ""];
    if (!rec) return json(res, 403, { error: "missing or invalid token" });
    if (rec.file !== file) return json(res, 403, { error: "token mismatch" });
    if (rec.used) return json(res, 410, { error: "token already used" });
    if (Date.now() - rec.createdAt > TTL_MS) return json(res, 410, { error: "token expired" });

    if (!fs.existsSync(full)) return json(res, 404, { error: "file not found" });

    rec.used = true;
    saveTokens();

    const stat = fs.statSync(full);
    res.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Content-Length": stat.size,
      "Cache-Control": "no-store",
    });
    fs.createReadStream(full).pipe(res);
    return;
  }

  return json(res, 404, { error: "not found" });
});

loadTokens();
server.listen(PORT, "127.0.0.1", () => {
  console.log(`tcm-dl listening on 127.0.0.1:${PORT} (dist=${DIST_DIR}, ttl=${TTL_MS / 3600000}h)`);
});
