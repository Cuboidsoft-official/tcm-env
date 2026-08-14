import crypto from "crypto";
import fs from "fs";
import path from "path";
import express from "express";
import { requireAuth } from "../middleware/auth.js";

const uploadsRouter = express.Router();

export const UPLOADS_DIR = process.env.UPLOADS_DIR || "/opt/tcm/uploads";
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN || "https://api.thecodemunk.in").replace(/\/+$/, "");
const MAX_BYTES = 80 * 1024 * 1024;

const MIME_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
  "text/csv": "csv",
  "text/markdown": "md",
  "application/rtf": "rtf",
  "application/zip": "zip",
  "application/vnd.rar": "rar",
  "application/x-rar-compressed": "rar",
  "application/x-7z-compressed": "7z",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
  "video/3gpp": "3gp",
  "video/webm": "webm",
  "video/x-msvideo": "avi",
  "video/x-matroska": "mkv",
  "video/mpeg": "mpeg",
  "video/ogg": "ogv",
  "video/x-flv": "flv",
  "video/x-ms-wmv": "wmv"
};

const FTYP_BRANDS = new Set([
  "mp41", "mp42", "isom", "avc1", "iso2", "iso5", "iso6", "dash", "M4V ", "M4A ",
  "qt  ", "heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1",
  "msf1", "avif", "avis", "3gp4", "3gp5", "3gp6", "3gp7"
]);

function startsWith(buf, offset, bytes) {
  if (buf.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buf[offset + i] !== bytes[i]) return false;
  }
  return true;
}

function ascii(buf, start, end) {
  return buf.toString("ascii", start, end);
}

function isFtyp(buf) {
  if (buf.length < 12) return false;
  if (ascii(buf, 4, 8) !== "ftyp") return false;
  const brand = ascii(buf, 8, 12);
  return FTYP_BRANDS.has(brand);
}

function isContainerContent(mime, buf) {
  if (mime === "application/pdf") return ascii(buf, 0, 5) === "%PDF-";
  if (mime === "application/zip") return startsWith(buf, 0, [0x50, 0x4b, 0x03, 0x04]) || startsWith(buf, 0, [0x50, 0x4b, 0x05, 0x06]) || startsWith(buf, 0, [0x50, 0x4b, 0x07, 0x08]);
  if (mime === "application/vnd.rar" || mime === "application/x-rar-compressed") return ascii(buf, 0, 4) === "Rar!" && startsWith(buf, 4, [0x1a, 0x07, 0x00]);
  if (mime === "application/x-7z-compressed") return startsWith(buf, 0, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]);
  if (mime === "application/rtf") return ascii(buf, 0, 5) === "{\\rtf";
  if (mime.startsWith("text/")) return buf.length > 0 && !buf.slice(0, 1024).includes(0x00);

  if (mime === "image/heic" || mime === "image/heif" || mime === "image/avif") return isFtyp(buf);
  if (mime === "image/bmp") return startsWith(buf, 0, [0x42, 0x4d]);
  if (mime === "image/tiff") return startsWith(buf, 0, [0x49, 0x49, 0x2a, 0x00]) || startsWith(buf, 0, [0x4d, 0x4d, 0x00, 0x2a]);

  if (mime.startsWith("video/")) {
    if (mime === "video/webm") return startsWith(buf, 0, [0x1a, 0x45, 0xdf, 0xa3]);
    if (mime === "video/x-matroska") return startsWith(buf, 0, [0x1a, 0x45, 0xdf, 0xa3]);
    if (mime === "video/x-msvideo") return ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 12) === "AVI ";
    if (mime === "video/mpeg") return startsWith(buf, 0, [0x00, 0x00, 0x01, 0xba]) || startsWith(buf, 0, [0x00, 0x00, 0x01, 0xb3]);
    if (mime === "video/ogg") return ascii(buf, 0, 4) === "OggS";
    if (mime === "video/x-flv") return ascii(buf, 0, 3) === "FLV";
    if (mime === "video/x-ms-wmv") return startsWith(buf, 0, [0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11, 0xa6, 0xd9]);
    // mp4 / mov / m4v / 3gp all use an ISO BMFF ftyp box
    return isFtyp(buf);
  }

  return true;
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

function guessMime(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 12) === "WEBP") return "image/webp";
  if (ascii(buf, 0, 6) === "GIF87a" || ascii(buf, 0, 6) === "GIF89a") return "image/gif";
  if (ascii(buf, 0, 5) === "%PDF-") return "application/pdf";
  return null;
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
    if (!isContainerContent(parsed.mime, parsed.buf)) {
      return res.status(400).json({ message: "Invalid file content" });
    }
    if (parsed.buf.length > MAX_BYTES) {
      return res.status(400).json({ message: "File too large (max 80MB)" });
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
