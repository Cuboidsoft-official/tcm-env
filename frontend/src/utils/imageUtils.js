import { Platform } from "react-native";

export const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80";
export const DEFAULT_AVATAR_IMAGE = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";

export function sanitizeImageUri(uri, fallback = DEFAULT_FALLBACK_IMAGE) {
  if (!uri || typeof uri !== "string") return fallback;
  let trimmed = uri.trim();
  if (!trimmed) return fallback;

  // Fix URLs missing /uploads/ prefix e.g. https://api.thecodemunk.in/mtocaq7p-6bdd1d6e8191.png
  if (/^https?:\/\/api\.thecodemunk\.in\/([a-z0-9_-]+\.(png|jpg|jpeg|webp|gif|heic|avif))$/i.test(trimmed)) {
    const filename = trimmed.split("/").pop();
    trimmed = `https://api.thecodemunk.in/uploads/${filename}`;
  }

  // 1. On Web: file:/// or device local URIs cause "Not allowed to load local resource: file:///..."
  if (Platform.OS === "web" && (trimmed.startsWith("file://") || trimmed.startsWith("content://") || trimmed.startsWith("ph://"))) {
    return fallback;
  }

  // 2. On Native (iOS / Android): blob: URIs cause RCTHTTPRequestHandler "No suitable URL request handler found for blob:"
  if (Platform.OS !== "web" && trimmed.startsWith("blob:")) {
    return fallback;
  }

  // 3. Valid HTTP / HTTPS URLs
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // 4. Valid Data URIs (Base64)
  if (trimmed.startsWith("data:image/") || trimmed.startsWith("data:application/")) {
    return trimmed;
  }

  // 5. Relative Upload Paths & Filenames (e.g. /uploads/..., uploads/..., mtocaq7p-6bdd1d6e8191.png)
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
    const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `https://api.thecodemunk.in${path}`;
  }

  if (/^\/?([a-z0-9_-]+\.(png|jpg|jpeg|webp|gif|heic|avif))$/i.test(trimmed)) {
    const filename = trimmed.replace(/^\//, "");
    return `https://api.thecodemunk.in/uploads/${filename}`;
  }

  if (trimmed.startsWith("/")) {
    return `https://api.thecodemunk.in${trimmed}`;
  }

  // 6. Valid Web Blob URIs (only on Web platform)
  if (Platform.OS === "web" && trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // 7. Valid Local File/Content URIs (only on Native iOS/Android)
  if (Platform.OS !== "web" && (trimmed.startsWith("file://") || trimmed.startsWith("content://") || trimmed.startsWith("asset://"))) {
    return trimmed;
  }

  return fallback;
}

export function isValidImageUri(uri) {
  if (!uri || typeof uri !== "string") return false;
  const sanitized = sanitizeImageUri(uri, null);
  return sanitized !== null;
}
