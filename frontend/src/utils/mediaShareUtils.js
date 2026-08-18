import { Share, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

/**
 * Resolves relative backend URLs (/uploads/...) to absolute https://api.thecodemunk.in URLs
 */
export function resolveFullMediaUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("file://") || trimmed.startsWith("content://") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `https://api.thecodemunk.in${trimmed}`;
  }
  return `https://api.thecodemunk.in/${trimmed}`;
}

/**
 * Generates an Instagram-style 1080x1080 SVG Post Share Card for text posts
 */
export function generateInstagramCardSvg({ title, authorName, targetId }) {
  const safeTitle = (title || "TCM Post")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const safeAuthor = (authorName || "TCM Educator")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const permalink = `app.thecodemunk.in/post/${targetId || "p1"}`;
  const initial = safeAuthor.charAt(0).toUpperCase();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#1E293B" />
      <stop offset="100%" stop-color="#312E81" />
    </linearGradient>
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#8B5CF6" />
    </linearGradient>
  </defs>

  <rect width="1080" height="1080" fill="url(#bgGrad)" />
  <circle cx="900" cy="150" r="320" fill="#6366F1" opacity="0.18" />
  <circle cx="150" cy="900" r="380" fill="#8B5CF6" opacity="0.18" />

  <rect x="80" y="80" width="920" height="920" rx="40" fill="#1E293B" stroke="#334155" stroke-width="4" />

  <rect x="130" y="140" width="170" height="48" rx="24" fill="url(#badgeGrad)" />
  <text x="215" y="172" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF" text-anchor="middle">TCM ONE</text>

  <text x="910" y="173" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="#94A3B8" text-anchor="end">Official Post</text>

  <circle cx="165" cy="265" r="38" fill="#6366F1" />
  <text x="165" y="276" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${initial}</text>

  <text x="225" y="260" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="bold" fill="#F8FAFC">${safeAuthor}</text>
  <text x="225" y="292" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#94A3B8">Educator on TCM Academy</text>

  <line x1="130" y1="340" x2="950" y2="340" stroke="#334155" stroke-width="2" />

  <text x="130" y="450" font-family="Georgia, serif" font-size="120" fill="#6366F1" opacity="0.4">“</text>

  <foreignObject x="130" y="430" width="820" height="390">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #F8FAFC; font-family: system-ui, -apple-system, sans-serif; font-size: 44px; font-weight: 700; line-height: 1.4; word-wrap: break-word;">
      ${safeTitle}
    </div>
  </foreignObject>

  <rect x="130" y="860" width="820" height="84" rx="22" fill="#0F172A" stroke="#334155" stroke-width="2" />
  <text x="170" y="912" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="bold" fill="#818CF8">🔗 ${permalink}</text>
  <text x="910" y="912" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" fill="#94A3B8" text-anchor="end">Open Post in App ↗</text>
</svg>`;
}

/**
 * Main helper to share post as a real image attachment (Instagram style) + text permalink
 */
export async function sharePostWithMedia({
  title = "",
  authorName = "TCM Member",
  targetId = "",
  mediaUrl = "",
  isVideo = false,
  isDoc = false,
  onStart = () => {},
  onComplete = () => {}
}) {
  onStart();
  const shareUrl = `https://app.thecodemunk.in/post/${targetId || "p1"}`;
  const rawTitle = (title || "TCM Update").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  const cleanTitle = rawTitle.length > 70 ? `${rawTitle.slice(0, 67)}...` : rawTitle;
  const formattedShareMsg = `✨ ${cleanTitle}\n— by ${authorName} on TCM\n\n🔗 ${shareUrl}`;

  try {
    const fullUrl = resolveFullMediaUrl(mediaUrl);
    let targetImageUri = null;
    let mimeType = isVideo ? "video/mp4" : isDoc ? "application/pdf" : "image/jpeg";
    let uti = isVideo ? "public.movie" : isDoc ? "com.adobe.pdf" : "public.image";

    // 1. If post has an attached photo/video/document URL
    if (fullUrl) {
      const ext = isVideo ? ".mp4" : isDoc ? ".pdf" : ".jpg";
      const filename = `tcm_post_${targetId || Date.now()}${ext}`;
      const localUri = `${FileSystem.cacheDirectory}${filename}`;

      const fileInfo = await FileSystem.getInfoAsync(localUri).catch(() => ({ exists: false }));

      if (fileInfo.exists && fileInfo.size > 0) {
        targetImageUri = localUri;
      } else {
        const downloadRes = await FileSystem.downloadAsync(fullUrl, localUri).catch(() => null);
        if (downloadRes?.uri && downloadRes.status === 200) {
          targetImageUri = downloadRes.uri;
        }
      }
    }

    // 2. If text-only post or media download failed: generate Instagram Post Card SVG Image
    if (!targetImageUri) {
      const svgContent = generateInstagramCardSvg({ title: rawTitle, authorName, targetId });
      const cardFilename = `tcm_instagram_card_${targetId || Date.now()}.svg`;
      const cardPath = `${FileSystem.cacheDirectory}${cardFilename}`;
      await FileSystem.writeAsStringAsync(cardPath, svgContent, { encoding: FileSystem.EncodingType.UTF8 }).catch(() => {});

      const cardInfo = await FileSystem.getInfoAsync(cardPath).catch(() => ({ exists: false }));
      if (cardInfo.exists) {
        targetImageUri = cardPath;
        mimeType = "image/svg+xml";
        uti = "public.svg-image";
      }
    }

    // 3. Share actual image file via Native Sharing Sheet (WhatsApp / Instagram / Telegram)
    if (targetImageUri && (await Sharing.isAvailableAsync().catch(() => false))) {
      await Sharing.shareAsync(targetImageUri, {
        mimeType,
        dialogTitle: `Share ${cleanTitle}`,
        UTI: uti
      });
      onComplete();
      return;
    }

    // 4. Fallback if native file sharing unavailable
    if (Platform.OS === "ios") {
      await Share.share({
        message: `✨ ${cleanTitle}\n— by ${authorName} on TCM`,
        url: fullUrl || shareUrl
      });
    } else {
      await Share.share({ message: formattedShareMsg });
    }
  } catch (error) {
    console.log("Error sharing post with media:", error);
    try {
      await Share.share({ message: formattedShareMsg });
    } catch (e) {}
  } finally {
    onComplete();
  }
}
