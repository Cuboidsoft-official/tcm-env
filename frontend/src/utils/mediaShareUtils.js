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
 * Helper for Web to fetch or canvas-convert media URL to a valid File object (bypassing CORS)
 */
async function getWebFileFromUrl(url, targetId, isVideo = false, isDoc = false) {
  if (!url || typeof window === "undefined") return null;
  const ext = isVideo ? "mp4" : isDoc ? "pdf" : "jpg";
  const mime = isVideo ? "video/mp4" : isDoc ? "application/pdf" : "image/jpeg";
  const fileName = `tcm_post_${targetId || Date.now()}.${ext}`;

  // Try direct fetch
  try {
    const resp = await fetch(url, { mode: "cors" });
    if (resp.ok) {
      const blob = await resp.blob();
      return new File([blob], fileName, { type: blob.type || mime });
    }
  } catch (e) {}

  // Canvas fallback for images to bypass CORS
  if (!isVideo && !isDoc) {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width || 800;
          canvas.height = img.naturalHeight || img.height || 600;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], fileName, { type: "image/jpeg" }));
            } else {
              resolve(null);
            }
          }, "image/jpeg", 0.92);
        } catch (err) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  return null;
}

/**
 * Main helper to share post as a real image file attachment + caption & permalink
 */
export async function sharePostWithMedia({
  title = "",
  authorName = "TCM One Member",
  targetId = "",
  mediaUrl = "",
  images = [],
  isVideo = false,
  isDoc = false,
  onStart = () => {},
  onComplete = () => {}
}) {
  onStart();
  const shareUrl = `https://app.thecodemunk.in/post/${targetId || "p1"}`;
  const rawTitle = (title || "TCM One Update").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  const cleanTitle = rawTitle.length > 120 ? `${rawTitle.slice(0, 117)}...` : rawTitle;

  const validImages = (Array.isArray(images) ? images : []).map((u) => resolveFullMediaUrl(u)).filter(Boolean);
  const primaryMediaUrl = mediaUrl || validImages[0] || "";
  const primaryFullUrl = resolveFullMediaUrl(primaryMediaUrl);

  const captionBody = `✨ ${cleanTitle}\n— by ${authorName} on TCM One`;
  const formattedShareMsg = `${captionBody}\n\n🔗 ${shareUrl}`;

  try {
    // A. Web Browser Share (Chrome / Safari / Edge / Web PWA)
    if (Platform.OS === "web" && typeof navigator !== "undefined") {
      let fileShared = false;
      
      // If post has an image or media URL, try converting to File for native Web Share API
      if (primaryFullUrl && typeof navigator.canShare === "function") {
        const file = await getWebFileFromUrl(primaryFullUrl, targetId, isVideo, isDoc);
        if (file) {
          try {
            // Note: We do NOT pass `url` when passing `files`, because Web Share API rejects both together in Chrome/Safari.
            // `formattedShareMsg` already contains caption + link!
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: cleanTitle,
                text: formattedShareMsg,
                files: [file]
              });
              fileShared = true;
            }
          } catch (shareErr) {
            console.log("Web Share API files error:", shareErr);
          }
        }
      }

      if (!fileShared) {
        if (typeof navigator.share === "function") {
          await navigator.share({
            title: cleanTitle,
            text: formattedShareMsg,
            url: shareUrl
          }).catch(() => {});
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(formattedShareMsg).catch(() => {});
        }
      }
      onComplete();
      return;
    }

    // B. Native Mobile (iOS / Android React Native & Expo)
    let targetImageUri = null;
    let mimeType = isVideo ? "video/mp4" : isDoc ? "application/pdf" : "image/jpeg";
    let uti = isVideo ? "public.movie" : isDoc ? "com.adobe.pdf" : "public.image";

    // 1. If post has an attached photo/video/document URL, download to local cache
    if (primaryFullUrl) {
      const ext = isVideo ? ".mp4" : isDoc ? ".pdf" : ".jpg";
      const filename = `tcm_post_${targetId || Date.now()}${ext}`;
      const localUri = `${FileSystem.cacheDirectory}${filename}`;

      const fileInfo = await FileSystem.getInfoAsync(localUri).catch(() => ({ exists: false }));

      if (fileInfo.exists && fileInfo.size > 0) {
        targetImageUri = localUri;
      } else {
        const downloadRes = await FileSystem.downloadAsync(primaryFullUrl, localUri).catch(() => null);
        if (downloadRes?.uri && downloadRes.status === 200) {
          targetImageUri = downloadRes.uri;
        }
      }
    }

    // 2. Fallback: Download high-res poster JPG if text-only post or media download failed
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

    // 3. Share actual JPG/MP4 file via Native Sharing Sheet
    if (Platform.OS === "ios" && targetImageUri) {
      await Share.share({
        message: formattedShareMsg,
        url: targetImageUri
      });
      onComplete();
      return;
    }

    if (targetImageUri && (await Sharing.isAvailableAsync().catch(() => false))) {
      await Sharing.shareAsync(targetImageUri, {
        mimeType,
        dialogTitle: `Share ${cleanTitle}`,
        UTI: uti
      });
      onComplete();
      return;
    }

    // 4. Fallback if native file sharing is unavailable
    await Share.share({ message: formattedShareMsg });
  } catch (error) {
    console.log("Error sharing post with media:", error);
    try {
      await Share.share({ message: formattedShareMsg });
    } catch (e) {}
  } finally {
    onComplete();
  }
}
