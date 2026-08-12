const WEB_API_URL_DEFAULT = "https://api.thecodemunk.in/api";

export function getApiUrlCandidates() {
  const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
  return [configuredApiUrl?.replace(/\/$/, "") || WEB_API_URL_DEFAULT];
}
