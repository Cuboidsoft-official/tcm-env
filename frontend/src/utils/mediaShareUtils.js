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
 * Main helper to share post as a real image file attachment (WhatsApp / Instagram style) + text permalink
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

    // 2. If text-only post or media download failed: download high-res JPG poster image so WhatsApp receives an actual .jpg image file
    if (!targetImageUri) {
      const fallbackPosterUrl = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&h=630&q=80";
      const cardFilename = `tcm_card_${targetId || Date.now()}.jpg`;
      const cardPath = `${FileSystem.cacheDirectory}${cardFilename}`;

      const cardInfo = await FileSystem.getInfoAsync(cardPath).catch(() => ({ exists: false }));
      if (cardInfo.exists && cardInfo.size > 0) {
        targetImageUri = cardPath;
      } else {
        const dlRes = await FileSystem.downloadAsync(fallbackPosterUrl, cardPath).catch(() => null);
        if (dlRes?.uri && dlRes.status === 200) {
          targetImageUri = dlRes.uri;
        }
      }
      mimeType = "image/jpeg";
      uti = "public.image";
    }

    // 3. Share actual JPG/MP4 file via Native Sharing Sheet directly into WhatsApp / Instagram / Telegram
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
