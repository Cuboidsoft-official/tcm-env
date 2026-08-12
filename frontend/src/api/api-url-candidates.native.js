import { NativeModules, Platform } from "react-native";

const DEFAULT_API_PORT = 5000;

function normalizeApiUrl(url) {
  return url?.replace(/\/$/, "");
}

function inferApiUrlFromRuntime() {
  const scriptUrl = NativeModules.SourceCode?.scriptURL;
  const host = scriptUrl?.match(/^https?:\/\/([^/:]+)/)?.[1];

  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:${DEFAULT_API_PORT}/api`;
  }

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${DEFAULT_API_PORT}/api`;
  }

  return `http://localhost:${DEFAULT_API_PORT}/api`;
}

export function getApiUrlCandidates() {
  const inferredApiUrl = normalizeApiUrl(inferApiUrlFromRuntime());
  const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const configuredUrl = normalizeApiUrl(configuredApiUrl);
  const shouldPreferInferredUrl =
    configuredUrl?.includes("10.0.2.2") &&
    inferredApiUrl &&
    !inferredApiUrl.includes("10.0.2.2");

  return [
    ...(shouldPreferInferredUrl ? [inferredApiUrl, configuredUrl] : [configuredUrl, inferredApiUrl]),
    `http://10.0.2.2:${DEFAULT_API_PORT}/api`,
    `http://127.0.0.1:${DEFAULT_API_PORT}/api`,
    `http://localhost:${DEFAULT_API_PORT}/api`
  ].filter((url, index, urls) => url && urls.indexOf(url) === index);
}
