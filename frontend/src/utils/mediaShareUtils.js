import { Share, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

/**
 * Helper to share post text + permalink AND attach actual photo/video file if present
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
    // If post has a remote image / video / document URL
    if (mediaUrl && typeof mediaUrl === "string" && /^https?:\/\//i.test(mediaUrl)) {
      const ext = isVideo ? ".mp4" : isDoc ? ".pdf" : ".jpg";
      const mimeType = isVideo ? "video/mp4" : isDoc ? "application/pdf" : "image/jpeg";
      const filename = `tcm_share_${targetId || Date.now()}${ext}`;
      const localUri = `${FileSystem.cacheDirectory}${filename}`;

      // Check if file already cached or download it
      const fileInfo = await FileSystem.getInfoAsync(localUri).catch(() => ({ exists: false }));
      let finalUri = localUri;

      if (!fileInfo.exists) {
        const downloadRes = await FileSystem.downloadAsync(mediaUrl, localUri).catch(() => null);
        if (downloadRes?.uri) {
          finalUri = downloadRes.uri;
        } else {
          finalUri = null;
        }
      }

      // If file downloaded and native file sharing available
      if (finalUri && (await Sharing.isAvailableAsync().catch(() => false))) {
        await Sharing.shareAsync(finalUri, {
          mimeType,
          dialogTitle: `Share ${cleanTitle}`,
          UTI: isVideo ? "public.movie" : isDoc ? "com.adobe.pdf" : "public.image"
        });
        onComplete();
        return;
      }
    }

    // Fallback for text-only posts or web / non-file sharing
    if (Platform.OS === "ios") {
      await Share.share({
        message: `✨ ${cleanTitle}\n— by ${authorName} on TCM`,
        url: mediaUrl || shareUrl
      });
    } else {
      await Share.share({ message: formattedShareMsg });
    }
  } catch (error) {
    console.log("Error sharing post with media:", error);
  } finally {
    onComplete();
  }
}
