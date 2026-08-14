import { Platform } from "react-native";

export async function fileToDataUri(asset) {
  if (!asset?.uri) return null;

  if (Platform.OS === "web") {
    try {
      const blob = await (await fetch(asset.uri)).blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Blob to data URI failed:", e);
      return null;
    }
  }

  try {
    const { File } = await import("expo-file-system");
    const file = new File(asset.uri);
    const base64 = await file.base64();
    const mime = asset.mimeType || "application/octet-stream";
    return `data:${mime};base64,${base64}`;
  } catch (e) {
    console.warn("Native file to data URI failed:", e);
    return null;
  }
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i += 1;
  }
  return `${size >= 10 || i === 0 ? Math.round(size) : size.toFixed(1)} ${units[i]}`;
}

export function isRemoteUri(uri) {
  return typeof uri === "string" && /^https?:\/\//i.test(uri.trim());
}

export function isLocalUri(uri) {
  return typeof uri === "string" && /^(blob:|file:|content:|ph:\/\/)/i.test(uri.trim());
}

export async function uriToDataUri(uri, mimeType) {
  if (!uri) return null;
  if (/^data:/i.test(uri)) return uri;

  if (Platform.OS === "web") {
    try {
      const blob = await (await fetch(uri)).blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("URI to data URI failed:", e);
      return null;
    }
  }

  try {
    const { File } = await import("expo-file-system");
    const file = new File(uri);
    const base64 = await file.base64();
    const mime = mimeType || "application/octet-stream";
    return `data:${mime};base64,${base64}`;
  } catch (e) {
    console.warn("Native URI to data URI failed:", e);
    return null;
  }
}
