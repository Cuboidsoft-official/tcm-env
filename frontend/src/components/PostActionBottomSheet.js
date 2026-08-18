import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Alert,
  Share,
  StyleSheet,
  Platform
} from "react-native";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../constants/fonts";

export default function PostActionBottomSheet({
  visible,
  onClose,
  post,
  session,
  onDeletePost,
  onPinPost,
  onEditPost,
  onSavePost,
  onReportPost,
  onHidePost,
  onSelectUser,
  onShowToast
}) {
  const { theme } = useTheme();
  const [isBookmarked, setIsBookmarked] = useState(Boolean(post?.isBookmarked));
  const [isPinned, setIsPinned] = useState(Boolean(post?.isPinned || post?.pinned));
  const [isNotifOn, setIsNotifOn] = useState(false);

  if (!post) return null;

  const currentUserIdStr = String(session?.user?.id || session?.user?._id || "").trim();
  const authorIdStr = String(post.authorId || post.author?.id || "").trim();
  const currentUserName = (session?.user?.name || "").toLowerCase().trim();
  const authorName = (post.authorName || post.author?.name || "").toLowerCase().trim();

  const isSelfPost = Boolean(
    post.isSelf ||
    (currentUserIdStr && authorIdStr === currentUserIdStr) ||
    (currentUserName && authorName === currentUserName)
  );

  const isJob = post.postType === "job_news" || Boolean(post.jobData);
  const job = post.jobData || {};
  const displayTitle = post.title || job.title || post.text || post.content || "Feed Post";
  const displayAuthor = post.authorName || job.mentorName || post.author?.name || "TCM User";
  const displayRole = post.authorRole || job.mentorRole || post.author?.role || (isJob ? "Hiring Partner" : "Community Member");

  const handleCopyLink = async () => {
    onClose();
    const link = `https://app.thecodemunk.in/post/${postId}`;
    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      }
    } catch (e) {}

    if (onShowToast) {
      onShowToast({
        type: "success",
        title: "Link Copied!",
        subtitle: "Post permalink copied to clipboard."
      });
    } else {
      Alert.alert("Link Copied!", "Post link copied to clipboard.");
    }
  };

  const handleShare = async () => {
    onClose();
    const media = post.media || {};
    const isVideo = Boolean(post.videoUrl || media.videoUrl || post.mediaType === "video" || post.kind === "video" || media.kind === "video");
    const isDoc = Boolean(post.isDocument || media.documentUrl || post.documentUrl || media.kind === "document");
    const rawMediaUrl = isVideo
      ? (media.videoUrl || post.videoUrl || media.fileUri || post.fileUri || "")
      : isDoc
      ? (media.documentUrl || post.documentUrl || media.fileUri || "")
      : (media.imageUrl || post.imageUrl || (Array.isArray(media.images) && media.images[0]) || media.thumbnailUrl || post.thumbnailUrl || "");

    const hasMediaUrl = typeof rawMediaUrl === "string" && /^https?:\/\//i.test(rawMediaUrl);
    const mediaLabel = isVideo ? "🎥 Video" : isDoc ? "📄 Attachment" : "🖼️ Image";
    const mediaText = hasMediaUrl ? `\n${mediaLabel}: ${rawMediaUrl}` : "";

    const cleanTitle = (displayTitle || "TCM Update").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
    const shortTitle = cleanTitle.length > 70 ? `${cleanTitle.slice(0, 67)}...` : cleanTitle;
    const shareUrl = `https://app.thecodemunk.in/post/${postId}`;
    const shareMessage = `✨ ${shortTitle}\n— by ${displayAuthor} on TCM${mediaText}\n\n🔗 ${shareUrl}`;
    try {
      if (Platform.OS === "ios") {
        await Share.share({
          message: `✨ ${shortTitle}\n— by ${displayAuthor} on TCM${mediaText}`,
          url: hasMediaUrl ? rawMediaUrl : shareUrl
        });
      } else {
        await Share.share({ message: shareMessage });
      }
      if (onShowToast) {
        onShowToast({
          type: "success",
          title: "Post Shared!",
          subtitle: "Share dialog launched successfully."
        });
      }
    } catch (error) {
      console.log("Error sharing post:", error);
    }
  };

  const handleToggleSave = () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    if (onSavePost) onSavePost(post, nextState);
    if (onShowToast) {
      onShowToast({
        type: "success",
        title: nextState ? "Post Saved!" : "Post Unsaved",
        subtitle: nextState ? "Added to your saved bookmarks." : "Removed from saved bookmarks."
      });
    }
  };

  const handleTogglePin = () => {
    onClose();
    const nextState = !isPinned;
    setIsPinned(nextState);
    if (onPinPost) onPinPost(post, nextState);
    if (onShowToast) {
      onShowToast({
        type: "success",
        title: nextState ? "Post Pinned!" : "Post Unpinned",
        subtitle: nextState ? "Post pinned to top of feed." : "Post unpinned from feed top."
      });
    }
  };

  const handleToggleNotifications = () => {
    const nextState = !isNotifOn;
    setIsNotifOn(nextState);
    if (onShowToast) {
      onShowToast({
        type: "info",
        title: nextState ? "Notifications On" : "Notifications Off",
        subtitle: nextState ? "You will receive updates for this post." : "Notifications muted for this post."
      });
    }
  };

  const handleViewAuthorProfile = () => {
    onClose();
    if (onSelectUser) {
      onSelectUser(
        post.author || {
          id: post.authorId || post.authorName,
          name: displayAuthor,
          avatarUrl: post.authorAvatarUrl || job.mentorAvatarUrl,
          role: displayRole
        }
      );
    }
  };

  const handleHide = () => {
    onClose();
    if (onHidePost) onHidePost(post);
    if (onShowToast) {
      onShowToast({
        type: "info",
        title: "Post Hidden",
        subtitle: "This post has been hidden from your feed."
      });
    }
  };

  const handleReport = () => {
    onClose();
    if (onReportPost) onReportPost(post);
    if (onShowToast) {
      onShowToast({
        type: "warning",
        title: "Post Reported",
        subtitle: "Thank you. Post flagged for moderation review."
      });
    } else {
      Alert.alert("Reported", "Thank you. Post reported to TCM moderators.");
    }
  };

  const handleDelete = () => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(`Permanently delete this ${isJob ? "job posting" : "post"}?`)) {
        onClose();
        if (onDeletePost) onDeletePost(post.id);
        if (onShowToast) {
          onShowToast({
            type: "success",
            title: "Post Deleted",
            subtitle: "Post removed from the feed."
          });
        }
      }
      return;
    }

    Alert.alert(
      `Delete ${isJob ? "Job Posting" : "Post"}?`,
      "Are you sure you want to permanently delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            onClose();
            if (onDeletePost) onDeletePost(post.id);
            if (onShowToast) {
              onShowToast({
                type: "success",
                title: "Post Deleted",
                subtitle: "Post removed from the feed."
              });
            }
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.sheetCard,
            {
              backgroundColor: theme.isDark ? "#0F172A" : "#FFFFFF",
              borderColor: theme.isDark ? "#1E293B" : "#E2E8F0"
            }
          ]}
        >
          {/* Top Drag Handle Indicator */}
          <View style={[styles.handleBar, { backgroundColor: theme.isDark ? "#334155" : "#CBD5E1" }]} />

          {/* Header & Post Snippet Box */}
          <View style={styles.headerSection}>
            <View style={styles.titleRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <MaterialCommunityIcons
                  name={isJob ? "briefcase-check" : "cards-heart-outline"}
                  size={20}
                  color={theme.primary}
                />
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  {isJob ? "Job Drive Actions" : "Post Options"}
                </Text>
              </View>
              {isSelfPost && (
                <View style={[styles.authorTag, { backgroundColor: theme.isDark ? "#312E81" : "#EEF2FF", borderColor: theme.isDark ? "#4338CA" : "#C7D2FE" }]}>
                  <Text style={[styles.authorTagText, { color: theme.primary }]}>Your Post</Text>
                </View>
              )}
            </View>

            {/* Post Snippet Preview Box */}
            <View
              style={[
                styles.snippetBox,
                {
                  backgroundColor: theme.isDark ? "#161E2E" : "#F8FAFC",
                  borderColor: theme.isDark ? "#1E293B" : "#E2E8F0"
                }
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={[styles.authorNameText, { color: theme.text }]} numberOfLines={1}>
                  {displayAuthor} <Text style={{ color: theme.subtext, fontSize: 11, fontFamily: fonts.medium }}>({displayRole})</Text>
                </Text>
                {isJob ? (
                  <Text style={[styles.typeBadge, { color: "#10B981", backgroundColor: "#D1FAE5" }]}>JOB DRIVE</Text>
                ) : (
                  <Text style={[styles.typeBadge, { color: theme.primary, backgroundColor: theme.isDark ? "#1E1B4B" : "#F0EDFF" }]}>COMMUNITY</Text>
                )}
              </View>
              <Text numberOfLines={2} style={[styles.snippetText, { color: theme.subtext }]}>
                {displayTitle}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Quick Action Horizontal Grid */}
            <View style={styles.quickGrid}>
              <TouchableOpacity
                onPress={handleCopyLink}
                activeOpacity={0.8}
                style={[
                  styles.quickTile,
                  { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9", borderColor: theme.border }
                ]}
              >
                <Feather name="link" size={18} color={theme.primary} />
                <Text style={[styles.quickTileText, { color: theme.text }]}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShare}
                activeOpacity={0.8}
                style={[
                  styles.quickTile,
                  { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9", borderColor: theme.border }
                ]}
              >
                <Feather name="share-2" size={18} color="#0EA5E9" />
                <Text style={[styles.quickTileText, { color: theme.text }]}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleToggleSave}
                activeOpacity={0.8}
                style={[
                  styles.quickTile,
                  { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9", borderColor: theme.border }
                ]}
              >
                <Ionicons
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={18}
                  color={isBookmarked ? "#F59E0B" : theme.subtext}
                />
                <Text style={[styles.quickTileText, { color: isBookmarked ? "#F59E0B" : theme.text }]}>
                  {isBookmarked ? "Saved" : "Save"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleViewAuthorProfile}
                activeOpacity={0.8}
                style={[
                  styles.quickTile,
                  { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9", borderColor: theme.border }
                ]}
              >
                <Feather name="user" size={18} color="#10B981" />
                <Text style={[styles.quickTileText, { color: theme.text }]}>Profile</Text>
              </TouchableOpacity>
            </View>

            {/* List Action Rows */}
            <View style={styles.actionsList}>
              {/* Pin / Unpin (Owner or Admin) */}
              {(isSelfPost || session?.user?.role === "admin" || session?.user?.role === "mentor") && (
                <TouchableOpacity
                  onPress={handleTogglePin}
                  activeOpacity={0.7}
                  style={[styles.actionRow, { borderBottomColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}
                >
                  <View style={[styles.actionIconBadge, { backgroundColor: theme.isDark ? "#312E81" : "#FEF3C7" }]}>
                    <Ionicons name="pushpin" size={18} color="#D97706" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.actionTitle, { color: theme.text }]}>
                      {isPinned ? "Unpin from Top" : "Pin to Top of Feed"}
                    </Text>
                    <Text style={[styles.actionSub, { color: theme.subtext }]}>
                      {isPinned ? "Remove highlighted pin state" : "Feature post at top of feed for all users"}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={theme.subtext} />
                </TouchableOpacity>
              )}

              {/* Edit Post (Owner Only) */}
              {isSelfPost && onEditPost && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onEditPost(post);
                  }}
                  activeOpacity={0.7}
                  style={[styles.actionRow, { borderBottomColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}
                >
                  <View style={[styles.actionIconBadge, { backgroundColor: theme.isDark ? "#1E1B4B" : "#EEF2FF" }]}>
                    <Feather name="edit-3" size={18} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.actionTitle, { color: theme.text }]}>Edit Post Details</Text>
                    <Text style={[styles.actionSub, { color: theme.subtext }]}>Update caption, title, or media links</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={theme.subtext} />
                </TouchableOpacity>
              )}

              {/* Toggle Post Notifications */}
              <TouchableOpacity
                onPress={handleToggleNotifications}
                activeOpacity={0.7}
                style={[styles.actionRow, { borderBottomColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}
              >
                <View style={[styles.actionIconBadge, { backgroundColor: theme.isDark ? "#064E3B" : "#ECFDF5" }]}>
                  <Feather name={isNotifOn ? "bell-off" : "bell"} size={18} color="#10B981" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.actionTitle, { color: theme.text }]}>
                    {isNotifOn ? "Turn off Notifications" : "Turn on Notifications"}
                  </Text>
                  <Text style={[styles.actionSub, { color: theme.subtext }]}>
                    {isNotifOn ? "Mute updates for this post" : "Get notified when someone comments or likes"}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={theme.subtext} />
              </TouchableOpacity>

              {/* Hide Post */}
              {!isSelfPost && (
                <TouchableOpacity
                  onPress={handleHide}
                  activeOpacity={0.7}
                  style={[styles.actionRow, { borderBottomColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}
                >
                  <View style={[styles.actionIconBadge, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}>
                    <Feather name="eye-off" size={18} color={theme.subtext} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.actionTitle, { color: theme.text }]}>Hide Post</Text>
                    <Text style={[styles.actionSub, { color: theme.subtext }]}>See fewer updates like this in your feed</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={theme.subtext} />
                </TouchableOpacity>
              )}

              {/* Report Post (Non-Owner Only) */}
              {!isSelfPost && (
                <TouchableOpacity
                  onPress={handleReport}
                  activeOpacity={0.7}
                  style={[styles.actionRow, { borderBottomColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}
                >
                  <View style={[styles.actionIconBadge, { backgroundColor: theme.isDark ? "#451A03" : "#FFF7ED" }]}>
                    <Feather name="alert-circle" size={18} color="#EA580C" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.actionTitle, { color: "#EA580C" }]}>Report Post</Text>
                    <Text style={[styles.actionSub, { color: theme.subtext }]}>Flag for spam, misinformation, or misconduct</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={theme.subtext} />
                </TouchableOpacity>
              )}

              {/* Delete Post (Owner Only - Danger Red Button) */}
              {isSelfPost && (
                <TouchableOpacity
                  onPress={handleDelete}
                  activeOpacity={0.75}
                  style={[
                    styles.actionRow,
                    {
                      backgroundColor: theme.isDark ? "#450A0A" : "#FEF2F2",
                      borderRadius: 14,
                      marginTop: 8,
                      borderBottomWidth: 0,
                      paddingHorizontal: 12,
                      borderWidth: 1,
                      borderColor: "#FCA5A5"
                    }
                  ]}
                >
                  <View style={[styles.actionIconBadge, { backgroundColor: "#FEE2E2" }]}>
                    <Feather name="trash-2" size={18} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.actionTitle, { color: "#EF4444", fontFamily: fonts.bold }]}>
                      Delete {isJob ? "Job Posting" : "Post"}
                    </Text>
                    <Text style={[styles.actionSub, { color: "#F87171" }]}>Permanently remove from feed</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            style={[
              styles.cancelBtn,
              {
                backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9",
                borderColor: theme.border
              }
            ]}
          >
            <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end"
  },
  sheetCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    maxHeight: "85%",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 14
  },
  headerSection: {
    marginBottom: 16
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.bold
  },
  authorTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  authorTagText: {
    fontSize: 10.5,
    fontFamily: fonts.bold
  },
  snippetBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1
  },
  authorNameText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    flex: 1,
    marginRight: 6
  },
  typeBadge: {
    fontSize: 9.5,
    fontFamily: fonts.bold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: "hidden"
  },
  snippetText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: fonts.medium
  },
  quickGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16
  },
  quickTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4
  },
  quickTileText: {
    fontSize: 11,
    fontFamily: fonts.bold
  },
  actionsList: {
    gap: 4
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  actionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: fonts.bold
  },
  actionSub: {
    fontSize: 11.5,
    fontFamily: fonts.medium,
    marginTop: 2
  },
  cancelBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: fonts.bold
  }
});
