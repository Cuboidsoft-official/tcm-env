import crypto from "crypto";
import fs from "fs";
import path from "path";
import express from "express";
import { requireAuth } from "../middleware/auth.js";

const uploadsRouter = express.Router();

export const UPLOADS_DIR = process.env.UPLOADS_DIR || "/opt/tcm/uploads";
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN || "https://api.thecodemunk.in").replace(/\/+$/, "");
const MAX_BYTES = 10 * 1024 * 1024;

const MIME_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

function guessMime(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a") return "image/gif";
  return null;
}

function parseImageData(input) {
  if (typeof input !== "string" || !input) return null;

  const dataUri = input.match(/^data:([^;,]+)(;base64)?,(.*)$/s);
  if (dataUri) {
    const mime = dataUri[1]?.toLowerCase();
    const payload = dataUri[3] ?? "";
    const buf = dataUri[2] ? Buffer.from(payload, "base64") : Buffer.from(payload, "utf8");
    return { mime, buf };
  }

  const buf = Buffer.from(input, "base64");
  const mime = guessMime(buf);
  return mime ? { mime, buf } : null;
}

uploadsRouter.post("/image", requireAuth, (req, res) => {
  try {
    const parsed = parseImageData(req.body?.data);
    if (!parsed || !parsed.buf.length) {
      return res.status(400).json({ message: "Invalid image data" });
    }
    if (!MIME_MAP[parsed.mime]) {
      return res.status(400).json({ message: "Only JPEG, PNG, WebP or GIF images are allowed" });
    }
    if (parsed.buf.length > MAX_BYTES) {
      return res.status(400).json({ message: "Image too large (max 10MB)" });
    }

    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}.${MIME_MAP[parsed.mime]}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, name), parsed.buf, { mode: 0o644 });

    res.json({ url: `${PUBLIC_ORIGIN}/uploads/${name}` });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed" });
  }
});

export { uploadsRouter };
