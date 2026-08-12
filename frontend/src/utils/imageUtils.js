import { Platform } from "react-native";

export const DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80";
export const DEFAULT_AVATAR_IMAGE = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";

export function sanitizeImageUri(uri, fallback = DEFAULT_FALLBACK_IMAGE) {
  if (!uri || typeof uri !== "string") return fallback;
  const trimmed = uri.trim();
  if (!trimmed) return fallback;

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

  // 5. Valid Web Blob URIs (only on Web platform)
  if (Platform.OS === "web" && trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // 6. Valid Local File/Content URIs (only on Native iOS/Android)
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
