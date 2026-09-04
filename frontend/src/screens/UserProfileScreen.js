import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { deleteCommunityPost, getTargetUserProfile, sendFriendRequestAction, toggleFollowUser } from "../api/client";
import GetVerifiedModal from "../components/GetVerifiedModal";
import MyReviewsModal from "../components/MyReviewsModal";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";
import { PRESET_SKILLS, getSkillIconInfo, renderSkillIcon, getSkillLevel } from "../utils/skillIcons";
import { sharePostWithMedia } from "../utils/mediaShareUtils";

export default function UserProfileScreen({ session, targetUser, onClose, onOpenChat, onSelectPost }) {
  const { theme } = useTheme();
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [friendStatus, setFriendStatus] = useState("none");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");

  // Bottom Sheets & Modals state
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [myReviewsModalOpen, setMyReviewsModalOpen] = useState(false);
  const [avatarEnlargedOpen, setAvatarEnlargedOpen] = useState(false);
  const [optionsSheetOpen, setOptionsSheetOpen] = useState(false);
  const [getVerifiedModalOpen, setGetVerifiedModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedPostForSheet, setSelectedPostForSheet] = useState(null);
  const [postSheetOpen, setPostSheetOpen] = useState(false);

  async function handleDeletePostFromSheet() {
    if (!selectedPostForSheet) return;
    const currentUserIdStr = String(session?.user?.id || session?.user?._id || "").trim();
    const postAuthorIdStr = String(selectedPostForSheet.authorId || selectedPostForSheet.userId || selectedPostForSheet.author_id || "").trim();
    const currentUserName = (session?.user?.name || "").toLowerCase().trim();
    const postAuthorName = (selectedPostForSheet.authorName || "").toLowerCase().trim();

    const isMyPost = Boolean(
      session?.user &&
      ((currentUserIdStr && postAuthorIdStr === currentUserIdStr) ||
       (currentUserName && postAuthorName === currentUserName) ||
       session?.user?.role === "admin")
    );

    if (!isMyPost) {
      Alert.alert("Permission Denied", "You can only delete your own posts.");
      setPostSheetOpen(false);
      return;
    }

    const postId = selectedPostForSheet.id || selectedPostForSheet._id;
    try {
      if (session?.token) {
        await deleteCommunityPost(session.token, postId);
      }
    } catch (e) {}
    setUserPosts((prev) => prev.filter((p) => String(p.id || p._id) !== String(postId)));
    setPostSheetOpen(false);
    setSelectedPostForSheet(null);
    Alert.alert("Post Deleted", "Post has been deleted successfully.");
  }

  const targetId = targetUser?.id || targetUser?._id || targetUser?.authorId || "user-rohit";

  useEffect(() => {
    loadProfile();
  }, [targetId, session?.token]);

  async function loadProfile() {
    if (!session?.token) {
      setFriendStatus("none");
      return;
    }
    setLoading(true);
    try {
      const data = await getTargetUserProfile(session.token, targetId);
      if (data?.user) {
        setProfileData(data.user);
      }
      if (data?.friendStatus) {
        setFriendStatus(data.friendStatus);
      }
      if (data?.posts) {
        setUserPosts(data.posts);
      }
      if (data?.followers) {
        setFollowersList(data.followers);
      }
      if (data?.following) {
        setFollowingList(data.following);
      }
    } catch (error) {
      // Fallback quietly to targetUser prop if offline
    } finally {
      setLoading(false);
    }
  }

  async function handleFriendRequest(action) {
    if (!session?.token) {
      Alert.alert("Login Required", "Please login to send a friend request.");
      return;
    }
    setUpdating(true);
    try {
      const result = await sendFriendRequestAction(session.token, targetId, action);
      if (result?.friendStatus !== undefined) {
        setFriendStatus(result.friendStatus);
        if (action === "send") {
          Alert.alert("Success", "Friend request sent! 📩");
        } else if (action === "cancel") {
          Alert.alert("Cancelled", "Friend request cancelled.");
        } else if (action === "accept") {
          Alert.alert("Connected", "You are now friends! 🎉");
        } else if (action === "unfriend") {
          Alert.alert("Removed", "Removed from friends list.");
        }
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to perform action.");
    } finally {
      setUpdating(false);
    }
  }

  const userObj = profileData || targetUser || {};
  const name = userObj.name || userObj.authorName || "TCM One Member";
  const handle = userObj.handle || (name !== "TCM One Member" ? name.toLowerCase().replace(/[^a-z0-9]/g, "_") : "tcm_member");
  const bio = userObj.bio || "Building TCM One to help curious minds learn, grow & create impact.";
  const avatarUrl = userObj.avatarUrl || userObj.avatar || userObj.authorAvatarUrl || userObj.photoUrl || userObj.image || userObj.profileImage || userObj.imageUrl || "";
  const location = userObj.location || "India";
  const joinedDate = userObj.joinedDate || "Joined Jan 2024";
  const website = userObj.website || "thecodemunk.in";
  const userRole = userObj.role || userObj.authorRole || "Student";
  const isMentor = Boolean(userObj.isMentor || userRole.toLowerCase().includes("mentor") || userRole.toLowerCase().includes("expert") || userRole.toLowerCase().includes("lead"));
  const isStudentRole = !isMentor && (userRole.toLowerCase().includes("student") || userRole.toLowerCase() === "user");
  const hasPremiumBadge = Boolean(userObj.isPremium || userObj.isPro || userObj.hasVerifiedSubscription);
  const verified = isStudentRole ? Boolean(userObj.verified && hasPremiumBadge) : Boolean(userObj.verified ?? true);
  const currentUserId = String(session?.user?.id || session?.user?._id || "").trim();
  const currentUserName = (session?.user?.name || "").toLowerCase().trim();
  const currentUserHandle = (session?.user?.handle || "").toLowerCase().replace(/^@/, "").trim();

  const isSelf = Boolean(
    targetUser?.isSelf ||
    (currentUserId && String(targetId).trim() === currentUserId)
  );

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "TM";

  const filteredPosts = (userPosts || []).filter((post) => {
    if (activeTab === "Posts") return true;
    if (activeTab === "Notes" || activeTab === "Documents") {
      return (
        post.media?.kind === "notes" ||
        Boolean(post.documentUrl) ||
        Boolean(post.documentName) ||
        post.category?.toLowerCase() === "notes" ||
        post.category?.toLowerCase() === "documents"
      );
    }
    return post.category?.toLowerCase() === activeTab.toLowerCase();
  });

  const stats = {
    postsCount: profileData?.stats?.postsCount !== undefined ? profileData.stats.postsCount : (userPosts || []).length,
    followers: profileData?.stats?.followers !== undefined ? profileData.stats.followers : followersList.length,
    following: profileData?.stats?.following !== undefined ? profileData.stats.following : followingList.length,
    reviews: profileData?.stats?.reviews !== undefined ? profileData.stats.reviews : (userPosts || []).reduce((sum, p) => sum + (p.commentsCount || p.metrics?.comments || 0), 0).toString()
  };

  const filteredUserList = (followersModalOpen ? followersList : followingList).filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.handle?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  async function handleToggleFollow(userToToggle) {
    const targetUserIdToToggle = userToToggle.id || userToToggle.handle;
    const isCurrentlyFollowing = userToToggle.isFollowing;

    setFollowingList((prev) => {
      if (isCurrentlyFollowing) {
        return prev.filter((u) => u.id !== targetUserIdToToggle && u.handle !== userToToggle.handle);
      } else {
        return [...prev, { ...userToToggle, isFollowing: true }];
      }
    });

    setFollowersList((prev) =>
      prev.map((u) => {
        if (u.id === targetUserIdToToggle || u.handle === userToToggle.handle) {
          return { ...u, isFollowing: !isCurrentlyFollowing };
        }
        return u;
      })
    );

    if (session?.token) {
      try {
        await toggleFollowUser(session.token, { targetUserId: targetUserIdToToggle, targetUserHandle: userToToggle.handle });
      } catch (err) {}
    }
  }

  async function handleShareProfile() {
    const shareUrl = `https://app.thecodemunk.in/user/${handle}`;
    try {
      await Share.share({
        message: `Check out ${name}'s (@${handle}) profile on TCM One: ${shareUrl}`
      });
    } catch (err) {
      Alert.alert("Share Profile", `Profile URL: ${shareUrl}`);
    }
  }

  function renderFriendButton() {
    if (isSelf) {
      return (
        <Pressable
          onPress={() => {
            if (onClose) onClose();
          }}
          style={[styles.joinBtn, { backgroundColor: "#F0EDFF", borderWidth: 1, borderColor: "#0A6836" }]}
        >
          <Feather name="user" size={15} color="#0A6836" />
          <Text style={[styles.joinBtnText, { color: "#0A6836" }]}>Your Profile (You)</Text>
        </Pressable>
      );
    }

    if (updating) {
      return (
        <View style={[styles.joinBtn, styles.loadingBtn]}>
          <ActivityIndicator color="#FFFFFF" size="small" />
        </View>
      );
    }

    if (friendStatus === "friends") {
      return (
        <Pressable
          onPress={() => {
            Alert.alert(
              "Friend Options",
              `Status with ${name}:`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Unfriend", style: "destructive", onPress: () => handleFriendRequest("unfriend") }
              ]
            );
          }}
          style={[styles.joinBtn, styles.joinedBtn]}
        >
          <Feather name="check" size={15} color="#0A6836" />
          <Text style={[styles.joinBtnText, styles.joinedBtnText]}>Friends ✓</Text>
        </Pressable>
      );
    }

    if (friendStatus === "pending_sent") {
      return (
        <Pressable
          onPress={() => handleFriendRequest("cancel")}
          style={[styles.joinBtn, styles.pendingBtn]}
        >
          <Feather name="clock" size={15} color="#0A6836" />
          <Text style={[styles.joinBtnText, styles.pendingBtnText]}>Request Sent</Text>
        </Pressable>
      );
    }

    if (friendStatus === "pending_received") {
      return (
        <Pressable
          onPress={() => handleFriendRequest("accept")}
          style={[styles.joinBtn, styles.acceptBtn]}
        >
          <Feather name="user-check" size={15} color="#FFFFFF" />
          <Text style={styles.joinBtnText}>Accept Request</Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        onPress={() => handleFriendRequest("send")}
        style={styles.joinBtn}
      >
        <Feather name="user-plus" size={15} color="#FFFFFF" />
        <Text style={styles.joinBtnText}>Add Friend</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.scrollBody, { backgroundColor: theme.bg }]}>
      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Pressable onPress={() => setAvatarEnlargedOpen(true)} style={styles.avatarWrapper}>
          {avatarUrl && !(Platform.OS === "web" && typeof avatarUrl === "string" && avatarUrl.startsWith("file://")) ? (
            <Image source={{ uri: avatarUrl }} style={[styles.avatarImg, { borderColor: theme.border }]} />
          ) : (
            <View style={[styles.avatarInitialsContainer, { backgroundColor: theme.primary, borderColor: theme.border }]}>
              <Text style={styles.avatarInitialsText}>{initials}</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.userMainInfo}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Text style={[styles.userName, { color: theme.text }]}>{name}</Text>
            {userRole?.toLowerCase().includes("mentor") || isMentor ? (
              <View style={{ backgroundColor: theme.isDark ? "#1E1B4B" : "#FEF3C7", borderWidth: 1, borderColor: theme.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: theme.isDark ? "#A78BFA" : "#D97706" }}>Mentor</Text>
              </View>
            ) : (
              <View style={{ backgroundColor: theme.isDark ? "#1E263B" : "#F1F5F9", borderWidth: 1, borderColor: theme.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: theme.subtext }}>Student</Text>
              </View>
            )}
            {verified ? (
              <View style={[styles.verifiedPill, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="check-decagram" size={13} color={theme.primary} />
                <Text style={[styles.verifiedPillText, { color: theme.primary }]}>Verified</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.userHandle, { color: theme.subtext }]}>@{handle}</Text>

          <Text style={[styles.bioText, { color: theme.subtext }]}>{bio}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={12} color={theme.subtext} />
              <Text style={[styles.metaText, { color: theme.subtext }]}>{location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="calendar" size={12} color={theme.subtext} />
              <Text style={[styles.metaText, { color: theme.subtext }]}>{joinedDate}</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="link" size={12} color="#0A6836" />
              <Text style={[styles.metaText, styles.metaLink]}>{website}</Text>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionBtnRow}>
            {renderFriendButton()}

            {/* Message Button - Only unlocked after friend request is accepted (mutual friends) or for mentor/support */}
            {!isSelf && (friendStatus === "friends" || String(targetId) === "m1" || userRole?.toLowerCase().includes("mentor") || isMentor) ? (
              <Pressable
                onPress={() => (onOpenChat ? onOpenChat(userObj) : Alert.alert("Message", `Opening direct chat with ${name}.`))}
                style={[styles.messageBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
              >
                <Feather name="message-square" size={15} color={theme.text} />
                <Text style={[styles.messageBtnText, { color: theme.text }]}>Message</Text>
              </Pressable>
            ) : null}

            <Pressable onPress={() => setOptionsSheetOpen(true)} style={[styles.dropBtn, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
              <Feather name="chevron-down" size={16} color={theme.subtext} />
            </Pressable>
          </View>

          {/* Social Proof Overlapping Avatars */}
          <View style={[styles.socialProofRow, { borderTopColor: theme.border }]}>
            <View style={styles.avatarStack}>
              <Image source={{ uri: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=80&q=80" }} style={[styles.stackAvatar, { borderColor: theme.cardBg }]} />
              <Image source={{ uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" }} style={[styles.stackAvatar, { marginLeft: -8, borderColor: theme.cardBg }]} />
            </View>
            <Text style={[styles.socialProofText, { color: theme.subtext }]}>Connected with TCM One Community</Text>
          </View>
        </View>
      </View>

      {/* 3. Non-Random Dynamic Stats Grid */}
      <View style={[styles.statsCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.statCol}>
          <Text style={[styles.statVal, { color: theme.text }]}>{stats.postsCount}</Text>
          <Text style={[styles.statLbl, { color: theme.subtext }]}>Posts</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <Pressable onPress={() => { setFollowersModalOpen(true); setFollowingModalOpen(false); }} style={styles.statCol}>
          <Text style={[styles.statVal, { color: theme.text }]}>{stats.followers}</Text>
          <Text style={[styles.statLbl, { color: theme.subtext }]}>Followers</Text>
        </Pressable>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <Pressable onPress={() => { setFollowingModalOpen(true); setFollowersModalOpen(false); }} style={styles.statCol}>
          <Text style={[styles.statVal, { color: theme.text }]}>{stats.following}</Text>
          <Text style={[styles.statLbl, { color: theme.subtext }]}>Following</Text>
        </Pressable>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <Pressable onPress={() => setMyReviewsModalOpen(true)} style={styles.statCol}>
          <Text style={[styles.statVal, { color: theme.text }]}>{stats.reviews || "0"}</Text>
          <Text style={[styles.statLbl, { color: theme.subtext }]}>Reviews</Text>
        </Pressable>
      </View>

      {/* 4. Highlight Categories Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsRow}>
        {[
          { label: "Achievements", icon: "trophy-outline" },
          { label: "Courses", icon: "school-outline" },
          { label: "Certificates", icon: "certificate-outline" },
          { label: "Events", icon: "calendar-month-outline" },
          { label: "Projects", icon: "folder-outline" }
        ].map((item) => (
          <Pressable key={item.label} onPress={() => Alert.alert(item.label, `Viewing ${item.label}...`)} style={styles.highlightItem}>
            <View style={[styles.highlightCircle, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
              <MaterialCommunityIcons name={item.icon} size={22} color={theme.primary} />
            </View>
            <Text style={[styles.highlightLabel, { color: theme.subtext }]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* 5. Tabs Header - Horizontal Slider */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsScrollView, { borderBottomColor: theme.border }]}
        contentContainerStyle={styles.tabsScrollContent}
      >
        {[
          { key: "Posts", icon: "grid" },
          { key: "Skills", icon: "award" },
          { key: "Scoreboard", icon: "bar-chart-2" },
          { key: "Notes", icon: "file-text" },
          { key: "Videos", icon: "video" },
          { key: "Certificates", icon: "award" }
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabItem, isActive && { borderBottomColor: theme.primary }]}
            >
              <Feather name={tab.icon} size={15} color={isActive ? theme.primary : theme.subtext} />
              <Text style={[styles.tabText, { color: isActive ? theme.primary : theme.subtext }, isActive && { fontFamily: fonts.bold }]}>{tab.key}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 6. Content Grid Feed */}
      {activeTab === "Skills" ? (
        <View style={{ width: "100%", paddingHorizontal: 12, paddingVertical: 14 }}>
          {(() => {
            const userObj = profileData || targetUser || {};
            const rawSkills = Array.isArray(userObj.skills) && userObj.skills.length > 0 ? userObj.skills : [];
            const isLegacyDummy = Array.isArray(rawSkills) && rawSkills.length === 5 && rawSkills[0]?.name === "JavaScript" && Number(rawSkills[0]?.strength) === 88;
            const targetSkillsList = isLegacyDummy ? [] : rawSkills;

            const avgStrength = targetSkillsList.length > 0
              ? Math.round(targetSkillsList.reduce((acc, curr) => acc + (Number(curr.strength) || 0), 0) / targetSkillsList.length)
              : 0;

            const expertCount = targetSkillsList.filter((s) => (Number(s.strength) || 0) >= 85).length;

            if (targetSkillsList.length === 0) {
              return (
                <View
                  style={{
                    alignItems: "center",
                    paddingVertical: 36,
                    backgroundColor: theme.cardBg,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: theme.border,
                    borderStyle: "dashed"
                  }}
                >
                  <MaterialCommunityIcons name="star-shooting-outline" size={38} color="#94A3B8" />
                  <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: theme.text, marginTop: 8 }}>No skills showcased yet</Text>
                  <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 3, textAlign: "center" }}>
                    This user hasn't added any skills or subjects to their profile matrix yet.
                  </Text>
                </View>
              );
            }

            return (
              <View style={{ width: "100%", gap: 14 }}>
                {/* Header Overview Card */}
                <View
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: 20,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: theme.border,
                    ...shadow.sm
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: theme.badgeBg, alignItems: "center", justifyContent: "center" }}>
                        <MaterialCommunityIcons name="shield-check-outline" size={20} color={theme.primary} />
                      </View>
                      <Text style={{ fontSize: 13.5, fontFamily: fonts.bold, color: theme.text }}>Skills & Proficiency</Text>
                    </View>
                  </View>

                  {/* Summary Metric Chips */}
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    <View style={{ flex: 1, minWidth: 100, backgroundColor: theme.bg, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: theme.border, alignItems: "center" }}>
                      <Text style={{ fontSize: 18, fontFamily: fonts.bold, color: theme.primary }}>{targetSkillsList.length}</Text>
                      <Text style={{ fontSize: 10.5, color: theme.subtext, marginTop: 2 }}>Total Skills</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 100, backgroundColor: theme.bg, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: theme.border, alignItems: "center" }}>
                      <Text style={{ fontSize: 18, fontFamily: fonts.bold, color: "#059669" }}>{avgStrength}%</Text>
                      <Text style={{ fontSize: 10.5, color: theme.subtext, marginTop: 2 }}>Avg Score</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 100, backgroundColor: theme.bg, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: theme.border, alignItems: "center" }}>
                      <Text style={{ fontSize: 18, fontFamily: fonts.bold, color: "#7C3AED" }}>{expertCount}</Text>
                      <Text style={{ fontSize: 10.5, color: theme.subtext, marginTop: 2 }}>Expert Badges</Text>
                    </View>
                  </View>
                </View>

                {/* Wide Skill Cards List */}
                <View style={{ width: "100%", gap: 10 }}>
                    {targetSkillsList.map((skillItem, index) => {
                      const iconInfo = getSkillIconInfo(skillItem.name);
                      const lvlInfo = getSkillLevel(skillItem.strength);
                      const scoreVal = Number(skillItem.strength) || 0;

                      return (
                        <View
                          key={index}
                          style={{
                            width: "100%",
                            backgroundColor: theme.cardBg,
                            borderRadius: 16,
                            padding: 14,
                            borderWidth: 1,
                            borderColor: theme.border,
                            ...shadow.sm
                          }}
                        >
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: iconInfo.bg, alignItems: "center", justifyContent: "center" }}>
                                {renderSkillIcon(iconInfo, 22)}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: theme.text }} numberOfLines={1}>
                                  {skillItem.name}
                                </Text>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                                  <View style={{ backgroundColor: lvlInfo.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                    <Text style={{ fontSize: 10.5, fontFamily: fonts.bold, color: lvlInfo.color }}>{lvlInfo.title}</Text>
                                  </View>
                                  <Text style={{ fontSize: 11, color: theme.subtext }}>Strength Rating</Text>
                                </View>
                              </View>
                            </View>

                            <View style={{ backgroundColor: iconInfo.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: iconInfo.accent }}>
                              <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: iconInfo.color }}>
                                {scoreVal}/100
                              </Text>
                            </View>
                          </View>

                          <View style={{ height: 10, backgroundColor: theme.bg, borderRadius: 5, overflow: "hidden", borderWidth: 1, borderColor: theme.border }}>
                            <View
                              style={{
                                height: "100%",
                                width: `${Math.max(0, Math.min(100, scoreVal))}%`,
                                backgroundColor: iconInfo.accent,
                                borderRadius: 5
                              }}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
              </View>
            );
          })()}
        </View>
      ) : (
        <View style={styles.gridFeed}>
        {loading ? (
          <ActivityIndicator size="large" color="#0A6836" style={{ marginVertical: 35, alignSelf: "center", width: "100%" }} />
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => {
            const isDoc = post.media?.kind === "notes" || Boolean(post.documentUrl) || Boolean(post.documentName);
            const docTitle = post.documentName || post.media?.fileName || post.title || post.text || "Document.pdf";
            const docSize = post.documentSize || post.media?.fileSize || "PDF Document";

            return (
              <TouchableOpacity
                key={post.id || post._id}
                onPress={() => onSelectPost && onSelectPost(post)}
                onLongPress={() => {
                  setSelectedPostForSheet(post);
                  setPostSheetOpen(true);
                }}
                activeOpacity={0.85}
                style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
              >
                {isDoc ? (
                  <View style={{ width: "100%", height: 120, backgroundColor: theme.inputBg, borderRadius: 12, padding: 12, justifyContent: "space-between", borderWidth: 1, borderColor: theme.border }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <View style={{ backgroundColor: "#FF465F18", padding: 8, borderRadius: 10 }}>
                        <MaterialCommunityIcons name="file-pdf-box" size={28} color="#FF465F" />
                      </View>
                      <TouchableOpacity hitSlop={10} onPress={() => { setSelectedPostForSheet(post); setPostSheetOpen(true); }}>
                        <Feather name="more-vertical" size={18} color={theme.subtext} />
                      </TouchableOpacity>
                    </View>
                    <View>
                      <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: "700", color: theme.text, marginBottom: 2 }}>{docTitle}</Text>
                      <Text numberOfLines={1} style={{ fontSize: 11, color: theme.subtext }}>{docSize}</Text>
                    </View>
                  </View>
                ) : post.type === "code" ? (
                  <View style={styles.codePostCard}>
                    <View style={styles.codeHeader}>
                      <Text style={styles.codeLangText}>
                        {post.title?.toLowerCase().includes("python") ? "def two_sum(nums, target):" : "const sum = (a, b) => {"}
                      </Text>
                      <Feather name="code" size={14} color="#FFFFFF" />
                    </View>
                    <Text numberOfLines={5} style={styles.codeSnippetText}>
                      {post.codeSnippet || "code snippet..."}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.imagePostCard, { backgroundColor: theme.inputBg }]}>
                    <Image source={{ uri: post.imageUrl || post.media?.imageUrl }} style={styles.cardImg} />
                    {post.type === "video" && (
                      <View style={styles.mediaOverlayBadge}>
                        <Ionicons name="play" size={14} color="#FFFFFF" />
                      </View>
                    )}
                    {post.type === "certificate" && (
                      <View style={styles.mediaOverlayBadge}>
                        <Feather name="award" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                )}

              <View style={styles.cardBody}>
                <Text numberOfLines={1} style={[styles.cardTitle, { color: theme.text }]}>{post.title || post.content || post.text}</Text>
                <Text numberOfLines={1} style={[styles.cardTags, { color: theme.primary }]}>
                  {post.tags?.join(" ")}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={styles.metricRow}>
                    <Ionicons name={post.isLiked ? "heart" : "heart-outline"} size={14} color={post.isLiked ? "#EAB308" : theme.subtext} />
                    <Text style={[styles.metricCount, { color: theme.subtext }, post.isLiked && { color: "#EAB308", fontFamily: fonts.bold }]}>{post.likes}</Text>
                  </View>
                  <Ionicons
                    name={post.bookmarked ? "bookmark" : "bookmark-outline"}
                    size={14}
                    color={post.bookmarked ? theme.primary : theme.subtext}
                  />
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
          <View style={{ paddingVertical: 40, alignItems: "center", width: "100%" }}>
            <Feather name="layers" size={28} color="#A4A3B8" />
            <Text style={{ fontSize: 14, fontFamily: fonts.semiBold, color: "#2E2D4D", marginTop: 8 }}>No posts found</Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: "#7C7C9A", marginTop: 4 }}>This user hasn't published any {activeTab.toLowerCase()} content yet.</Text>
          </View>
        )}
      </View>
    )}

      {/* --- MODALS & BOTTOM SHEETS --- */}

      {/* 1. Followers / Following Bottom Sheet */}
      {/* Post Action Bottom Sheet (Delete / Options on Hold) */}
      <Modal visible={postSheetOpen} animationType="slide" transparent onRequestClose={() => setPostSheetOpen(false)}>
        <Pressable onPress={() => setPostSheetOpen(false)} style={styles.modalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.border, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 30 }]}>
            <View style={[styles.sheetHandleBar, { backgroundColor: theme.border }]} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text, textAlign: "center", marginTop: 8 }}>
              Post Options
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 13, color: theme.subtext, textAlign: "center", marginBottom: 20 }}>
              {selectedPostForSheet?.title || selectedPostForSheet?.content || selectedPostForSheet?.text || "Selected Post"}
            </Text>

            {Boolean(
              session?.user &&
              ((String(session.user.id || session.user._id || "").trim() &&
                String(selectedPostForSheet?.authorId || selectedPostForSheet?.userId || selectedPostForSheet?.author_id || "").trim() === String(session.user.id || session.user._id || "").trim()) ||
               ((session.user.name || "").toLowerCase().trim() &&
                (selectedPostForSheet?.authorName || "").toLowerCase().trim() === (session.user.name || "").toLowerCase().trim()) ||
               session.user.role === "admin")
            ) ? (
              <TouchableOpacity
                onPress={handleDeletePostFromSheet}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.isDark ? "#7F1D1D" : "#FEF2F2",
                  borderWidth: 1,
                  borderColor: theme.isDark ? "#991B1B" : "#FCA5A5",
                  paddingVertical: 14,
                  borderRadius: 14,
                  marginBottom: 10
                }}
              >
                <Feather name="trash-2" size={18} color={theme.isDark ? "#FCA5A5" : "#EF4444"} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 15, fontWeight: "700", color: theme.isDark ? "#FCA5A5" : "#EF4444" }}>Delete Post</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setPostSheetOpen(false);
                  Alert.alert("Report Received", "Thank you. This post has been reported to moderators.");
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.isDark ? "#78350F" : "#FFFBEB",
                  borderWidth: 1,
                  borderColor: theme.isDark ? "#92400E" : "#FDE68A",
                  paddingVertical: 14,
                  borderRadius: 14,
                  marginBottom: 10
                }}
              >
                <Feather name="flag" size={18} color={theme.isDark ? "#FDE68A" : "#D97706"} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 15, fontWeight: "600", color: theme.isDark ? "#FDE68A" : "#D97706" }}>Report Post</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {
                setPostSheetOpen(false);
                const pId = selectedPostForSheet?.id || selectedPostForSheet?._id;
                const media = selectedPostForSheet?.media || {};
                const isVideo = Boolean(selectedPostForSheet?.videoUrl || media.videoUrl || selectedPostForSheet?.mediaType === "video" || selectedPostForSheet?.kind === "video" || media.kind === "video");
                const isDoc = Boolean(selectedPostForSheet?.isDocument || media.documentUrl || selectedPostForSheet?.documentUrl || media.kind === "document");
                const carouselImages = (Array.isArray(media.carouselImages) && media.carouselImages.length > 0)
                  ? media.carouselImages
                  : (Array.isArray(selectedPostForSheet?.carouselImages) && selectedPostForSheet.carouselImages.length > 0)
                  ? selectedPostForSheet.carouselImages
                  : (Array.isArray(media.images) && media.images.length > 0)
                  ? media.images
                  : (Array.isArray(selectedPostForSheet?.images) && selectedPostForSheet.images.length > 0)
                  ? selectedPostForSheet.images
                  : [];
                const rawMediaUrl = isVideo
                  ? (media.videoUrl || selectedPostForSheet?.videoUrl || media.fileUri || selectedPostForSheet?.fileUri || "")
                  : isDoc
                  ? (media.documentUrl || selectedPostForSheet?.documentUrl || media.fileUri || "")
                  : (selectedPostForSheet?.imageUrl || media.imageUrl || carouselImages[0] || media.thumbnailUrl || selectedPostForSheet?.thumbnailUrl || "");

                sharePostWithMedia({
                  title: selectedPostForSheet?.title || selectedPostForSheet?.text || "TCM One Post",
                  authorName: selectedPostForSheet?.authorName || profileUser?.name || "TCM One Educator",
                  targetId: pId,
                  mediaUrl: rawMediaUrl,
                  images: carouselImages,
                  isVideo,
                  isDoc
                }).catch(() => {});
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.isDark ? "#1E263B" : "#F1F5F9",
                borderWidth: 1,
                borderColor: theme.border,
                paddingVertical: 14,
                borderRadius: 14,
                marginBottom: 10
              }}
            >
              <Feather name="share-2" size={18} color={theme.text} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: theme.text }}>Share Post</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPostSheetOpen(false)}
              style={{
                alignItems: "center",
                paddingVertical: 12
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: theme.subtext }}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={followersModalOpen || followingModalOpen} animationType="slide" transparent onRequestClose={() => { setFollowersModalOpen(false); setFollowingModalOpen(false); }}>
        <Pressable onPress={() => { setFollowersModalOpen(false); setFollowingModalOpen(false); }} style={styles.modalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.border, height: "78%" }]}>
            <View style={[styles.sheetHandleBar, { backgroundColor: theme.border }]} />
            <View style={styles.igModalHeader}>
              <View style={styles.igTabSwitch}>
                <Pressable
                  onPress={() => { setFollowersModalOpen(true); setFollowingModalOpen(false); }}
                  style={[styles.igTab, followersModalOpen && { borderBottomColor: theme.primary }]}
                >
                  <Text style={[styles.igTabText, { color: followersModalOpen ? theme.primary : theme.subtext }, followersModalOpen && { fontFamily: fonts.bold }]}>
                    Followers ({followersList.length})
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => { setFollowingModalOpen(true); setFollowersModalOpen(false); }}
                  style={[styles.igTab, followingModalOpen && { borderBottomColor: theme.primary }]}
                >
                  <Text style={[styles.igTabText, { color: followingModalOpen ? theme.primary : theme.subtext }, followingModalOpen && { fontFamily: fonts.bold }]}>
                    Following ({followingList.length})
                  </Text>
                </Pressable>
              </View>

              <Pressable onPress={() => { setFollowersModalOpen(false); setFollowingModalOpen(false); }}>
                <Feather name="x" size={20} color={theme.subtext} />
              </Pressable>
            </View>

            <View style={[styles.igSearchBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Feather name="search" size={15} color={theme.subtext} />
              <TextInput
                value={userSearchQuery}
                onChangeText={setUserSearchQuery}
                placeholder="Search people..."
                placeholderTextColor={theme.subtext}
                style={[styles.igSearchInput, { color: theme.text }]}
              />
              {userSearchQuery ? (
                <Pressable onPress={() => setUserSearchQuery("")}>
                  <Feather name="x-circle" size={14} color={theme.subtext} />
                </Pressable>
              ) : null}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {filteredUserList.map((u) => {
                const isFollowing = followingList.some((item) => item.id === u.id || item.handle === u.handle);
                return (
                  <View key={u.id || u.handle} style={[styles.igUserItem, { borderBottomColor: theme.border }]}>
                    <View style={styles.igUserLeft}>
                      <Image source={{ uri: u.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" }} style={{ width: 42, height: 42, borderRadius: 21 }} />
                      <View style={{ gap: 2 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Text style={[styles.igUserName, { color: theme.text }]}>{u.name}</Text>
                          {u.verified ? <MaterialCommunityIcons name="check-decagram" size={14} color={theme.primary} /> : null}
                        </View>
                        <Text style={[styles.igUserHandle, { color: theme.subtext }]}>@{u.handle || "member"} • {u.role || "TCM One Member"}</Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleToggleFollow(u)}
                      style={[styles.igFollowBtn, { backgroundColor: theme.primary }, isFollowing && [styles.igFollowBtnActive, { backgroundColor: theme.badgeBg, borderColor: theme.border }]]}
                    >
                      <Text style={[styles.igFollowBtnText, isFollowing && { color: theme.primary }]}>
                        {isFollowing ? "Following" : "Follow"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}

              {!filteredUserList.length && (
                <View style={{ paddingVertical: 35, alignItems: "center" }}>
                  <Feather name="users" size={24} color={theme.subtext} />
                  <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: theme.subtext, marginTop: 8 }}>No users found</Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 2. Enlarged Avatar View Modal */}
      <Modal visible={avatarEnlargedOpen} animationType="fade" transparent onRequestClose={() => setAvatarEnlargedOpen(false)}>
        <Pressable onPress={() => setAvatarEnlargedOpen(false)} style={styles.enlargedAvatarBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.enlargedAvatarCard}>
            <Pressable onPress={() => setAvatarEnlargedOpen(false)} style={styles.enlargedCloseBtn}>
              <Feather name="x" size={22} color="#FFFFFF" />
            </Pressable>

            <View style={styles.enlargedAvatarWrapper}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: 210, height: 210, borderRadius: 105 }} />
              ) : (
                <View style={[styles.avatarInitialsContainer, { width: 210, height: 210, borderRadius: 105 }]}>
                  <Text style={[styles.avatarInitialsText, { fontSize: 72 }]}>{initials}</Text>
                </View>
              )}
            </View>

            <Text style={styles.enlargedUserName}>{name}</Text>
            <Text style={styles.enlargedUserHandle}>@{handle}</Text>

            <View style={styles.enlargedActionRow}>
              <Pressable
                onPress={() => {
                  setAvatarEnlargedOpen(false);
                  handleShareProfile();
                }}
                style={styles.enlargedShareBtn}
              >
                <Feather name="share-2" size={16} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontFamily: fonts.semiBold, fontSize: 13 }}>Share Profile</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 3. Options Bottom Sheet */}
      <Modal visible={optionsSheetOpen} animationType="slide" transparent onRequestClose={() => setOptionsSheetOpen(false)}>
        <Pressable onPress={() => setOptionsSheetOpen(false)} style={styles.modalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.optionsSheetCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.sheetHandleBar, { backgroundColor: theme.border }]} />
            <Text style={[styles.optionsSheetTitle, { color: theme.text }]}>User Options</Text>

            <Pressable
              onPress={() => {
                setOptionsSheetOpen(false);
                handleShareProfile();
              }}
              style={[styles.optionsItem, { borderBottomColor: theme.border }]}
            >
              <Feather name="share-2" size={18} color={theme.primary} />
              <Text style={[styles.optionsItemText, { color: theme.text }]}>Share Profile</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setOptionsSheetOpen(false);
                Alert.alert("Copied!", `Profile link copied: https://thecodemunk.in/user/${handle}`);
              }}
              style={[styles.optionsItem, { borderBottomColor: theme.border }]}
            >
              <Feather name="copy" size={18} color={theme.text} />
              <Text style={[styles.optionsItemText, { color: theme.text }]}>Copy Profile Link</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setOptionsSheetOpen(false);
                Alert.alert("Message", `Opening chat with ${name}...`);
              }}
              style={[styles.optionsItem, { borderBottomColor: theme.border }]}
            >
              <Feather name="send" size={18} color={theme.text} />
              <Text style={[styles.optionsItemText, { color: theme.text }]}>Send Direct Message</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setOptionsSheetOpen(false);
                Alert.alert("Muted", `Muted notifications from ${name}.`);
              }}
              style={[styles.optionsItem, { borderBottomColor: theme.border }]}
            >
              <Feather name="bell-off" size={18} color={theme.subtext} />
              <Text style={[styles.optionsItemText, { color: theme.text }]}>Mute Notifications</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setOptionsSheetOpen(false);
                Alert.alert("Block User", `Are you sure you want to block ${name}?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Block", style: "destructive", onPress: () => Alert.alert("Blocked", `${name} has been blocked.`) }
                ]);
              }}
              style={[styles.optionsItem, { borderBottomColor: theme.border }]}
            >
              <Feather name="slash" size={18} color="#E53935" />
              <Text style={[styles.optionsItemText, { color: "#E53935" }]}>Block User</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setOptionsSheetOpen(false);
                Alert.alert("Reported", "Thank you. Our moderation team will review this profile.");
              }}
              style={[styles.optionsItem, { borderBottomColor: theme.border }]}
            >
              <Feather name="flag" size={18} color="#E53935" />
              <Text style={[styles.optionsItemText, { color: "#E53935" }]}>Report Profile</Text>
            </Pressable>

            <Pressable onPress={() => setOptionsSheetOpen(false)} style={[styles.optionsCancelBtn, { backgroundColor: theme.isDark ? "#1E263B" : "#F4F3FA" }]}>
              <Text style={[styles.optionsCancelText, { color: theme.subtext }]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <GetVerifiedModal
        visible={getVerifiedModalOpen}
        onClose={() => setGetVerifiedModalOpen(false)}
        onVerifySuccess={() => {
          setProfileData((prev) => (prev ? { ...prev, user: { ...prev.user, verified: true } } : prev));
        }}
      />

      <MyReviewsModal
        visible={myReviewsModalOpen}
        session={session}
        userId={targetId}
        user={userObj}
        onClose={() => setMyReviewsModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({


  scrollBody: {
    paddingBottom: 20
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  avatarWrapper: {
    alignSelf: "flex-start",
    position: "relative",
    marginBottom: 12
  },
  avatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45
  },
  avatarInitialsContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#0A6836",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarInitialsText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 32
  },
  getVerifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A6836",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 14,
    gap: 4
  },
  getVerifiedPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: fonts.bold
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: "#DDD6FE"
  },
  verifiedPillText: {
    color: "#0A6836",
    fontSize: 11,
    fontFamily: fonts.bold
  },
  userName: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: "#18172B"
  },
  userHandle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#7C7C9A"
  },
  bioText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#4A4A6A",
    lineHeight: 19,
    marginTop: 4
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
    marginBottom: 10
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  metaText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#7C7C9A"
  },
  metaLink: {
    color: "#0A6836",
    textDecorationLine: "underline"
  },

  actionBtnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    marginBottom: 12
  },
  joinBtn: {
    flex: 2,
    backgroundColor: "#0A6836",
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...shadow.soft
  },
  joinedBtn: {
    backgroundColor: "#F0EDFF",
    borderWidth: 1,
    borderColor: "#E5E1FF"
  },
  pendingBtn: {
    backgroundColor: "#F4F0FF",
    borderWidth: 1,
    borderColor: "#E4DCFF"
  },
  pendingBtnText: {
    color: "#0A6836"
  },
  acceptBtn: {
    backgroundColor: "#2E7D32"
  },
  loadingBtn: {
    opacity: 0.8
  },
  joinBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.semiBold,
    fontSize: 13
  },
  joinedBtnText: {
    color: "#0A6836"
  },
  messageBtn: {
    flex: 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5F2",
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  messageBtnText: {
    color: "#33334F",
    fontFamily: fonts.semiBold,
    fontSize: 13
  },
  dropBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F8F7FF",
    borderWidth: 1,
    borderColor: "#EAE7FF",
    alignItems: "center",
    justifyContent: "center"
  },

  socialProofRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F4F3FA"
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center"
  },
  stackAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#FFFFFF"
  },
  socialProofText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#7C7C9A"
  },

  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  statCol: {
    flex: 1,
    alignItems: "center"
  },
  statVal: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#18172B"
  },
  statLbl: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#F0F0FA"
  },

  highlightsRow: {
    gap: 14,
    marginBottom: 16
  },
  highlightItem: {
    alignItems: "center",
    gap: 4
  },
  highlightCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F5F3FF",
    borderWidth: 1.5,
    borderColor: "#EAE6FF",
    alignItems: "center",
    justifyContent: "center"
  },
  highlightLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#4A4A6A"
  },

  // Tabs (Horizontal Slider)
  tabsScrollView: {
    borderBottomWidth: 1,
    borderBottomColor: "#EAE7FF",
    marginBottom: 16
  },
  tabsScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2,
    gap: 8
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent"
  },
  tabItemActive: {
    borderBottomColor: "#0A6836"
  },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#7C7C9A"
  },
  tabTextActive: {
    fontFamily: fonts.bold,
    color: "#0A6836"
  },

  gridFeed: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14
  },
  gridCard: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  imagePostCard: {
    height: 125,
    backgroundColor: "#F7F6FF",
    position: "relative"
  },
  cardImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },
  mediaOverlayBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(24, 23, 37, 0.65)",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  codePostCard: {
    height: 125,
    backgroundColor: "#18172B",
    padding: 10,
    justifyContent: "space-between"
  },
  codeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  codeLangText: {
    color: "#00E676",
    fontSize: 10,
    fontFamily: fonts.medium
  },
  codeSnippetText: {
    color: "#ECEFF1",
    fontSize: 10,
    fontFamily: "monospace",
    lineHeight: 14
  },

  cardBody: {
    padding: 10
  },
  cardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#181725",
    marginBottom: 2
  },
  cardTags: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: "#0A6836",
    marginBottom: 6
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  metricCount: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#7C7C9A"
  },

  // Modals & Bottom Sheets Styles
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(10, 9, 26, 0.55)",
    justifyContent: "flex-end"
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24
  },
  sheetHandleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E0EE",
    alignSelf: "center",
    marginBottom: 14
  },
  igModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14
  },
  igTabSwitch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18
  },
  igTab: {
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent"
  },
  igTabActive: {
    borderBottomColor: "#0A6836"
  },
  igTabText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: "#7C7C9A"
  },
  igTabTextActive: {
    fontFamily: fonts.bold,
    color: "#181725"
  },
  igSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F7FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#EAE7FF"
  },
  igSearchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#181725"
  },
  igUserItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F3FA"
  },
  igUserLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  igUserName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#181725"
  },
  igUserHandle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A"
  },
  igFollowBtn: {
    backgroundColor: "#0A6836",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10
  },
  igFollowBtnActive: {
    backgroundColor: "#F0EDFF",
    borderWidth: 1,
    borderColor: "#E5E1FF"
  },
  igFollowBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.semiBold,
    fontSize: 12
  },
  igFollowBtnTextActive: {
    color: "#0A6836"
  },
  enlargedAvatarBg: {
    flex: 1,
    backgroundColor: "rgba(10, 9, 26, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  enlargedAvatarCard: {
    alignItems: "center",
    width: "100%",
    position: "relative"
  },
  enlargedCloseBtn: {
    position: "absolute",
    top: -65,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  enlargedAvatarWrapper: {
    marginBottom: 16,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 110,
    ...shadow.soft
  },
  enlargedUserName: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 22,
    textAlign: "center"
  },
  enlargedUserHandle: {
    color: "#A2A0C2",
    fontFamily: fonts.medium,
    fontSize: 14,
    marginTop: 2,
    textAlign: "center"
  },
  enlargedActionRow: {
    marginTop: 22
  },
  enlargedShareBtn: {
    backgroundColor: "#0A6836",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  optionsSheetCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30
  },
  optionsSheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725",
    marginBottom: 12,
    textAlign: "center"
  },
  optionsItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F3FA"
  },
  optionsItemText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: "#181725"
  },
  optionsCancelBtn: {
    marginTop: 16,
    backgroundColor: "#F4F3FA",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  optionsCancelText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: "#4A4A6A"
  }
});
