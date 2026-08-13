import crypto from "crypto";
import fs from "fs";
import path from "path";
import express from "express";
import { requireAuth } from "../middleware/auth.js";

const uploadsRouter = express.Router();

export const UPLOADS_DIR = process.env.UPLOADS_DIR || "/opt/tcm/uploads";
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN || "https://api.thecodemunk.in").replace(/\/+$/, "");
const MAX_BYTES = 20 * 1024 * 1024;

const MIME_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
  "video/3gpp": "3gp",
  "video/webm": "webm"
};

function guessMime(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a") return "image/gif";
  if (buf.toString("ascii", 0, 5) === "%PDF-") return "application/pdf";
  return null;
}

function parseFileData(input) {
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

uploadsRouter.post("/file", requireAuth, (req, res) => {
  try {
    const parsed = parseFileData(req.body?.data);
    if (!parsed || !parsed.buf.length) {
      return res.status(400).json({ message: "Invalid file data" });
    }
    if (!MIME_MAP[parsed.mime]) {
      return res.status(400).json({ message: "Unsupported file type" });
    }
    if (parsed.mime === "application/pdf" && parsed.buf.toString("ascii", 0, 5) !== "%PDF-") {
      return res.status(400).json({ message: "Invalid PDF content" });
    }
    if (parsed.mime.startsWith("video/")) {
      const isMp4Like = parsed.buf.length > 8 && parsed.buf.toString("ascii", 4, 8) === "ftyp";
      const isWebm = parsed.buf.length > 4 && parsed.buf[0] === 0x1a && parsed.buf[1] === 0x45 && parsed.buf[2] === 0xdf && parsed.buf[3] === 0xa3;
      if (!isMp4Like && !isWebm) {
        return res.status(400).json({ message: "Invalid video content" });
      }
    }
    if (parsed.buf.length > MAX_BYTES) {
      return res.status(400).json({ message: "File too large (max 20MB)" });
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
