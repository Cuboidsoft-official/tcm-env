import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Share } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { deleteCommunityPost, getProfile, getSavedPosts, toggleFollowUser, updateProfile } from "../api/client";
import EditMentorProfileModal from "../components/EditMentorProfileModal";
import GetVerifiedModal from "../components/GetVerifiedModal";
import MyReviewsModal from "../components/MyReviewsModal";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";

function ProfileAvatar({ name = "", uri, size = 90 }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "TCM";

  const isInvalidWebUri = Platform.OS === "web" && typeof uri === "string" && uri.startsWith("file://");

  if (uri && !isInvalidWebUri) {
    return <Image source={{ uri }} style={[styles.avatarImg, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  return (
    <View style={[styles.avatarInitialsContainer, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarInitialsText, { fontSize: Math.round(size * 0.36) }]}>{initials}</Text>
    </View>
  );
}

export default function ProfileScreen({ session, user: initialUser, onOpenSettings, onOpenWallet, onNotifications, onOpenMentorDashboard, onSelectPost }) {
  // Fixed JSX structure & Saved tab responsiveness
  const [profileUser, setProfileUser] = useState(initialUser || {});
  const [posts, setPosts] = useState([]);
  const [savedPostsList, setSavedPostsList] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Posts");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [avatarEnlargedOpen, setAvatarEnlargedOpen] = useState(false);
  const [getVerifiedModalOpen, setGetVerifiedModalOpen] = useState(false);
  const [myReviewsModalOpen, setMyReviewsModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [updating, setUpdating] = useState(false);
  const [selectedPostForSheet, setSelectedPostForSheet] = useState(null);
  const [postSheetOpen, setPostSheetOpen] = useState(false);

  async function handleDeletePostFromSheet() {
    if (!selectedPostForSheet) return;
    const postId = selectedPostForSheet.id || selectedPostForSheet._id;
    try {
      if (session?.token) {
        await deleteCommunityPost(session.token, postId);
      }
    } catch (e) {}
    setPosts((prev) => prev.filter((p) => String(p.id || p._id) !== String(postId)));
    setSavedPostsList((prev) => prev.filter((p) => String(p.id || p._id) !== String(postId)));
    setPostSheetOpen(false);
    setSelectedPostForSheet(null);
    Alert.alert("Post Deleted 🗑️", "Your post has been deleted successfully.");
  }

  // Edit form state
  const [form, setForm] = useState({
    name: "",
    handle: "",
    bio: "",
    location: "",
    website: "",
    avatarUrl: ""
  });

  useEffect(() => {
    fetchProfileData();
  }, [session?.token]);

  useEffect(() => {
    const liveUser = session?.user || initialUser;
    if (liveUser && (liveUser.avatarUrl || liveUser.avatar)) {
      const realAvatar = liveUser.avatarUrl || liveUser.avatar;
      setProfileUser((prev) => ({ ...prev, ...liveUser, avatarUrl: realAvatar }));
    }
  }, [session?.user?.avatarUrl, initialUser?.avatarUrl]);

  useEffect(() => {
    if (activeTab === "Saved" && session?.token) {
      loadSavedPosts();
    }
  }, [activeTab, session?.token]);

  async function loadSavedPosts() {
    setLoadingSaved(true);
    try {
      const res = await getSavedPosts(session.token);
      if (res?.posts) {
        setSavedPostsList(res.posts);
      }
    } catch (e) {
      // quiet
    } finally {
      setLoadingSaved(false);
    }
  }

  async function fetchProfileData() {
    if (!session?.token) {
      if (initialUser) {
        setProfileUser(initialUser);
        initForm(initialUser);
      }
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getProfile(session.token);
      if (data?.user) {
        setProfileUser(data.user);
        initForm(data.user);
      }
      if (data?.posts) {
        setPosts(data.posts);
      }
      if (data?.followers) {
        setFollowersList(data.followers);
      }
      if (data?.following) {
        setFollowingList(data.following);
      }
    } catch (err) {
      if (initialUser) {
        setProfileUser(initialUser);
        initForm(initialUser);
      }
    } finally {
      setLoading(false);
    }
  }

  function initForm(u) {
    setForm({
      name: u.name || "",
      handle: u.handle || "",
      bio: u.bio || "",
      location: u.location || "",
      website: u.website || "",
      avatarUrl: u.avatarUrl || ""
    });
  }

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow photo access to update profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      let selectedUri = asset.uri;
      if (asset.base64) {
        selectedUri = `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`;
      } else if (Platform.OS === "web" && selectedUri?.startsWith("file://")) {
        selectedUri = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";
      }
      setForm((prev) => ({ ...prev, avatarUrl: selectedUri }));
    }
  }

  async function handleSaveProfile() {
    if (!form.name.trim()) {
      Alert.alert("Invalid Input", "Name cannot be empty.");
      return;
    }
    setUpdating(true);
    try {
      if (session?.token) {
        const res = await updateProfile(session.token, form);
        if (res?.user) {
          setProfileUser(res.user);
        }
      } else {
        setProfileUser((prev) => ({ ...prev, ...form }));
      }
      setEditModalOpen(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleToggleFollow(targetUser) {
    const targetId = targetUser.id || targetUser.handle;
    const isCurrentlyFollowing = targetUser.isFollowing;

    // Update list state locally for instant UI update
    setFollowingList((prev) => {
      if (isCurrentlyFollowing) {
        return prev.filter((u) => u.id !== targetId && u.handle !== targetUser.handle);
      } else {
        return [...prev, { ...targetUser, isFollowing: true }];
      }
    });

    setFollowersList((prev) =>
      prev.map((u) => {
        if (u.id === targetId || u.handle === targetUser.handle) {
          return { ...u, isFollowing: !isCurrentlyFollowing };
        }
        return u;
      })
    );

    // Update stats count
    setProfileUser((prev) => {
      const currentFollowing = typeof prev.stats?.following === "number" ? prev.stats.following : followingList.length;
      const nextCount = Math.max(0, currentFollowing + (isCurrentlyFollowing ? -1 : 1));
      return {
        ...prev,
        stats: {
          ...prev.stats,
          following: nextCount
        }
      };
    });

    if (session?.token) {
      try {
        await toggleFollowUser(session.token, { targetUserId: targetId, targetUserHandle: targetUser.handle });
      } catch (err) {}
    }
  }

  function handleToggleLikePost(postId) {
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const isLikedNow = !p.isLiked;
          return {
            ...p,
            isLiked: isLikedNow,
            likes: p.likes + (isLikedNow ? 1 : -1)
          };
        }
        return p;
      })
    );
  }

  function handleToggleBookmarkPost(postId) {
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            bookmarked: !p.bookmarked
          };
        }
        return p;
      })
    );
  }

  const filteredPosts = posts.filter((post) => {
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
    postsCount: profileUser.stats?.postsCount !== undefined ? profileUser.stats.postsCount : posts.length,
    followers: profileUser.stats?.followers !== undefined ? profileUser.stats.followers : followersList.length,
    following: profileUser.stats?.following !== undefined ? profileUser.stats.following : followingList.length,
    reviews: profileUser.stats?.reviews !== undefined ? profileUser.stats.reviews : posts.reduce((sum, p) => sum + (p.commentsCount || p.metrics?.comments || 0), 0).toString()
  };

  const filteredUserList = (followersModalOpen ? followersList : followingList).filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.handle?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  return (
    <View style={styles.container}>
      {/* Main Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <Pressable onPress={() => setAvatarEnlargedOpen(true)} style={({ pressed }) => pressed && { opacity: 0.85 }}>
            <ProfileAvatar name={profileUser.name} uri={profileUser.avatarUrl} size={90} />
          </Pressable>
          <Pressable onPress={() => setEditModalOpen(true)} style={styles.cameraBadge}>
            <Ionicons name="camera" size={13} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.userMainInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{profileUser.name || "TCM Member"}</Text>
            {profileUser.isMentor || profileUser.role?.toLowerCase().includes("mentor") ? (
              <View style={{ backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#D97706" }}>Mentor</Text>
              </View>
            ) : (
              <View style={{ backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#475569" }}>Student</Text>
              </View>
            )}
            {profileUser.verified ? (
              <TouchableOpacity
                onPress={() => setGetVerifiedModalOpen(true)}
                activeOpacity={0.85}
                style={styles.verifiedPill}
              >
                <MaterialCommunityIcons name="check-decagram" size={13} color="#5B3CF5" />
                <Text style={styles.verifiedPillText}>Verified</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setGetVerifiedModalOpen(true)}
                activeOpacity={0.85}
                style={styles.getVerifiedPill}
              >
                <Ionicons name="sparkles" size={11} color="#FFFFFF" />
                <Text style={styles.getVerifiedPillText}>Get Verified</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.handleRow}>
            {profileUser.handle ? <Text style={styles.handleText}>@{profileUser.handle}</Text> : null}
            <View style={styles.memberBadgePill}>
              <Text style={styles.memberBadgeText}>{profileUser.memberBadge || "TCM Member"}</Text>
            </View>
          </View>

          {profileUser.bio ? <Text style={styles.bioText}>{profileUser.bio}</Text> : null}

          <View style={styles.metaRow}>
            {profileUser.location ? (
              <View style={styles.metaItem}>
                <Feather name="map-pin" size={12} color="#7C7C9A" />
                <Text style={styles.metaText}>{profileUser.location}</Text>
              </View>
            ) : null}
            {profileUser.joinedDate ? (
              <View style={styles.metaItem}>
                <Feather name="calendar" size={12} color="#7C7C9A" />
                <Text style={styles.metaText}>{profileUser.joinedDate}</Text>
              </View>
            ) : null}
            {profileUser.website ? (
              <TouchableOpacity onPress={() => Share.share({ url: profileUser.website })} style={styles.metaItem}>
                <Feather name="link" size={12} color="#5B3CF5" />
                <Text style={[styles.metaText, styles.metaLink]}>{profileUser.website}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionBtnRow}>
            <Pressable onPress={() => setEditModalOpen(true)} style={styles.editBtn}>
              <Feather name="edit-3" size={14} color="#FFFFFF" />
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>

            {onOpenSettings ? (
              <Pressable onPress={onOpenSettings} style={styles.settingsGearBtn}>
                <Feather name="settings" size={16} color="#5B3CF5" />
              </Pressable>
            ) : null}

            <Pressable
              onPress={() =>
                Alert.alert("Share Profile", `Profile link: https://${profileUser.website || "thecodemunk.in"}/@${profileUser.handle || "ayushman"}`)
              }
              style={styles.shareBtn}
            >
              <Feather name="share-2" size={14} color="#33334F" />
              <Text style={styles.shareBtnText}>Share</Text>
            </Pressable>
          </View>

          {/* Dashboard Button for Mentors */}
          {profileUser.role === "mentor" || profileUser.isMentor || profileUser.memberBadge?.toLowerCase().includes("mentor") ? (
            <Pressable
              onPress={onOpenMentorDashboard || (() => Alert.alert("Dashboard", "Opening Dashboard..."))}
              style={styles.mentorDashboardBtn}
            >
              <MaterialCommunityIcons name="view-dashboard-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.mentorDashboardBtnText}>Dashboard</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Stats Counter Row */}
      <View style={styles.statsCard}>
        <Pressable onPress={() => setActiveTab("Posts")} style={styles.statCol}>
          <Text style={styles.statVal}>{stats.postsCount}</Text>
          <Text style={styles.statLbl}>Posts</Text>
        </Pressable>
        <View style={styles.statDivider} />
        <Pressable onPress={() => { setUserSearchQuery(""); setFollowersModalOpen(true); }} style={styles.statCol}>
          <Text style={styles.statVal}>{stats.followers || followersList.length || "0"}</Text>
          <Text style={styles.statLbl}>Followers</Text>
        </Pressable>
        <View style={styles.statDivider} />
        <Pressable onPress={() => { setUserSearchQuery(""); setFollowingModalOpen(true); }} style={styles.statCol}>
          <Text style={styles.statVal}>{stats.following !== undefined ? stats.following : followingList.length}</Text>
          <Text style={styles.statLbl}>Following</Text>
        </Pressable>
        <View style={styles.statDivider} />
        <Pressable
          onPress={() => setMyReviewsModalOpen(true)}
          style={styles.statCol}
        >
          <Text style={styles.statVal}>{stats.reviews || "0"}</Text>
          <Text style={styles.statLbl}>Reviews</Text>
        </Pressable>
      </View>

      {/* Tabs Header - Horizontal Slider for all screen sizes */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScrollView}
        contentContainerStyle={styles.tabsScrollContent}
      >
        {[
          { key: "Posts", icon: "grid" },
          { key: "Saved", icon: "bookmark" },
          { key: "Notes", icon: "file-text" },
          { key: "Videos", icon: "video" },
          { key: "Certificates", icon: "award" },
          { key: "Reviews", icon: "star" }
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
            >
              <Feather
                name={tab.icon}
                size={15}
                color={isActive ? "#5B3CF5" : "#7C7C9A"}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.key}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content Grid Feed */}
      {loading || (activeTab === "Saved" && loadingSaved) ? (
        <ActivityIndicator size="large" color="#5B3CF5" style={{ marginVertical: 30 }} />
      ) : activeTab === "Saved" ? (
        <View style={styles.gridFeed}>
          {(() => {
            const combinedSaved = [...savedPostsList, ...posts.filter((p) => p.bookmarked)].filter(
              (p, idx, arr) => idx === arr.findIndex((item) => String(item.id || item._id) === String(p.id || p._id))
            );
            if (combinedSaved.length === 0) {
              return (
                <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40, width: "100%" }}>
                  <Feather name="bookmark" size={34} color="#94A3B8" />
                  <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: "#181725", marginTop: 8 }}>No Saved Posts Yet</Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#7C7C9A", textAlign: "center", marginTop: 2 }}>
                    Bookmark posts from the home feed to save them here for quick access!
                  </Text>
                </View>
              );
            }
            return combinedSaved.map((post) => (
              <TouchableOpacity key={post.id || post._id} onPress={() => onSelectPost && onSelectPost(post)} activeOpacity={0.85} style={styles.gridCard}>
                <View style={styles.imagePostCard}>
                  <Image source={{ uri: post.imageUrl || post.media?.imageUrl || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400" }} style={styles.cardImg} />
                  <View style={styles.mediaOverlayBadge}>
                    <Ionicons name="bookmark" size={14} color="#5B3CF5" />
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text numberOfLines={1} style={styles.cardTitle}>{post.title || post.content || post.text || "Saved Post"}</Text>
                  <Text numberOfLines={1} style={styles.cardTags}>{post.tags?.join(" ") || "#saved"}</Text>
                </View>
              </TouchableOpacity>
            ));
          })()}
        </View>
      ) : (
        <View style={styles.gridFeed}>
          {filteredPosts.map((post) => {
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
                style={styles.gridCard}
              >
                {isDoc ? (
                  <View style={{ width: "100%", height: 120, backgroundColor: "#F8FAFC", borderRadius: 12, padding: 12, justifyContent: "space-between", borderWidth: 1, borderColor: "#E2E8F0" }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <View style={{ backgroundColor: "#FF465F18", padding: 8, borderRadius: 10 }}>
                        <MaterialCommunityIcons name="file-pdf-box" size={28} color="#FF465F" />
                      </View>
                      <TouchableOpacity hitSlop={10} onPress={() => { setSelectedPostForSheet(post); setPostSheetOpen(true); }}>
                        <Feather name="more-vertical" size={18} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                    <View>
                      <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: "700", color: "#0F172A", marginBottom: 2 }}>{docTitle}</Text>
                      <Text numberOfLines={1} style={{ fontSize: 11, color: "#64748B" }}>{docSize}</Text>
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
                  <View style={styles.imagePostCard}>
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
                    {post.type === "image" && (
                      <View style={styles.mediaOverlayBadge}>
                        <Ionicons name="images-outline" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                )}

              <View style={styles.cardBody}>
                <Text numberOfLines={1} style={styles.cardTitle}>{post.title || post.content || post.text}</Text>
                <Text numberOfLines={1} style={styles.cardTags}>{post.tags?.join(" ")}</Text>
                <View style={styles.cardFooter}>
                  <View style={styles.metricRow}>
                    <View style={styles.metricItem}>
                      <Ionicons name={post.isLiked ? "heart" : "heart-outline"} size={15} color={post.isLiked ? "#FF465F" : "#7C7C9A"} />
                      <Text style={[styles.metricCount, post.isLiked && { color: "#FF465F", fontFamily: fonts.bold }]}>{post.likes}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Ionicons name="chatbubble-outline" size={13} color="#7C7C9A" />
                      <Text style={styles.metricCount}>{post.comments}</Text>
                    </View>
                  </View>

                  <View>
                    <Ionicons name={post.bookmarked ? "bookmark" : "bookmark-outline"} size={15} color={post.bookmarked ? "#5B3CF5" : "#7C7C9A"} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    )}

      <MyReviewsModal
        visible={myReviewsModalOpen || activeTab === "Reviews"}
        session={session}
        userId={profileUser.id || session?.user?.id}
        user={profileUser}
        onClose={() => {
          setMyReviewsModalOpen(false);
          if (activeTab === "Reviews") setActiveTab("Posts");
        }}
      />

      {/* Post Action Bottom Sheet (Delete / Options on Hold) */}
      <Modal visible={postSheetOpen} animationType="slide" transparent onRequestClose={() => setPostSheetOpen(false)}>
        <Pressable onPress={() => setPostSheetOpen(false)} style={styles.modalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalCard, { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 30 }]}>
            <View style={styles.sheetHandleBar} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1E293B", textAlign: "center", marginTop: 8 }}>
              Post Options ⚙️
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginBottom: 20 }}>
              {selectedPostForSheet?.title || selectedPostForSheet?.content || selectedPostForSheet?.text || "Selected Post"}
            </Text>

            <TouchableOpacity
              onPress={handleDeletePostFromSheet}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#FEF2F2",
                borderWidth: 1,
                borderColor: "#FCA5A5",
                paddingVertical: 14,
                borderRadius: 14,
                marginBottom: 10
              }}
            >
              <Feather name="trash-2" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#EF4444" }}>Delete Post 🗑️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setPostSheetOpen(false);
                Share.share({ message: `Check out this post on TCM: ${selectedPostForSheet?.title || "TCM Post"}` }).catch(() => {});
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#F1F5F9",
                paddingVertical: 14,
                borderRadius: 14,
                marginBottom: 10
              }}
            >
              <Feather name="share-2" size={18} color="#475569" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#475569" }}>Share Post Link 🔗</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPostSheetOpen(false)}
              style={{
                alignItems: "center",
                paddingVertical: 12
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#64748B" }}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Profile Bottom Sheet */}
      {profileUser.role === "mentor" || profileUser.isMentor ? (
        <EditMentorProfileModal
          visible={editModalOpen}
          session={session}
          user={profileUser}
          onClose={() => setEditModalOpen(false)}
          onProfileUpdated={(updatedData) => {
            setProfileUser((prev) => ({ ...prev, ...updatedData }));
          }}
        />
      ) : (
        <Modal visible={editModalOpen} animationType="slide" transparent onRequestClose={() => setEditModalOpen(false)}>
        <Pressable onPress={() => setEditModalOpen(false)} style={styles.modalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalCard}>
            <View style={styles.sheetHandleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable onPress={() => setEditModalOpen(false)}>
                <Feather name="x" size={20} color="#4A4A6A" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <View style={styles.avatarEditSection}>
                <ProfileAvatar name={form.name || profileUser.name} uri={form.avatarUrl} size={76} />
                <Pressable onPress={pickImage} style={[styles.changePicBtn, { marginTop: 8 }]}>
                  <Feather name="camera" size={14} color="#5B3CF5" />
                  <Text style={styles.changePicText}>Choose Photo</Text>
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  value={form.name}
                  onChangeText={(val) => setForm({ ...form, name: val })}
                  placeholder="Your Name"
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username Handle</Text>
                <TextInput
                  value={form.handle}
                  onChangeText={(val) => setForm({ ...form, handle: val })}
                  placeholder="ayushman"
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  value={form.bio}
                  onChangeText={(val) => setForm({ ...form, bio: val })}
                  placeholder="Tell people about yourself..."
                  multiline
                  numberOfLines={3}
                  style={[styles.textInput, { height: 75, textAlignVertical: "top" }]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  value={form.location}
                  onChangeText={(val) => setForm({ ...form, location: val })}
                  placeholder="India"
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Website / Portfolio Link</Text>
                <TextInput
                  value={form.website}
                  onChangeText={(val) => setForm({ ...form, website: val })}
                  placeholder="thecodemunk.in"
                  style={styles.textInput}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable onPress={() => setEditModalOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable onPress={handleSaveProfile} disabled={updating} style={styles.saveBtn}>
                {updating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      )}

      {/* Instagram-Style Followers / Following Bottom Sheet */}
      <Modal visible={followersModalOpen || followingModalOpen} animationType="slide" transparent onRequestClose={() => { setFollowersModalOpen(false); setFollowingModalOpen(false); }}>
        <Pressable onPress={() => { setFollowersModalOpen(false); setFollowingModalOpen(false); }} style={styles.modalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalCard, { height: "78%" }]}>
            <View style={styles.sheetHandleBar} />
            {/* Modal Header with Tabs */}
            <View style={styles.igModalHeader}>
              <View style={styles.igTabSwitch}>
                <Pressable
                  onPress={() => { setFollowersModalOpen(true); setFollowingModalOpen(false); }}
                  style={[styles.igTab, followersModalOpen && styles.igTabActive]}
                >
                  <Text style={[styles.igTabText, followersModalOpen && styles.igTabTextActive]}>
                    Followers ({followersList.length})
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => { setFollowingModalOpen(true); setFollowersModalOpen(false); }}
                  style={[styles.igTab, followingModalOpen && styles.igTabActive]}
                >
                  <Text style={[styles.igTabText, followingModalOpen && styles.igTabTextActive]}>
                    Following ({followingList.length})
                  </Text>
                </Pressable>
              </View>

              <Pressable onPress={() => { setFollowersModalOpen(false); setFollowingModalOpen(false); }}>
                <Feather name="x" size={20} color="#4A4A6A" />
              </Pressable>
            </View>

            {/* Search Input */}
            <View style={styles.igSearchBox}>
              <Feather name="search" size={15} color="#7C7C9A" />
              <TextInput
                value={userSearchQuery}
                onChangeText={setUserSearchQuery}
                placeholder="Search people..."
                style={styles.igSearchInput}
              />
              {userSearchQuery ? (
                <Pressable onPress={() => setUserSearchQuery("")}>
                  <Feather name="x-circle" size={14} color="#7C7C9A" />
                </Pressable>
              ) : null}
            </View>

            {/* User List */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {filteredUserList.map((u) => {
                const isFollowing = followingList.some((item) => item.id === u.id || item.handle === u.handle);
                return (
                  <View key={u.id || u.handle} style={styles.igUserItem}>
                    <View style={styles.igUserLeft}>
                      <ProfileAvatar name={u.name} uri={u.avatarUrl} size={44} />
                      <View style={{ gap: 2 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Text style={styles.igUserName}>{u.name}</Text>
                          {u.verified ? <MaterialCommunityIcons name="check-decagram" size={14} color="#5B3CF5" /> : null}
                        </View>
                        <Text style={styles.igUserHandle}>@{u.handle} • {u.role}</Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleToggleFollow(u)}
                      style={[styles.igFollowBtn, isFollowing && styles.igFollowBtnActive]}
                    >
                      <Text style={[styles.igFollowBtnText, isFollowing && styles.igFollowBtnTextActive]}>
                        {isFollowing ? "Following" : "Follow"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}

              {!filteredUserList.length && (
                <View style={{ paddingVertical: 30, alignItems: "center" }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: "#7C7C9A" }}>No users found</Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Instagram-Style Enlarged Avatar View Modal */}
      <Modal visible={avatarEnlargedOpen} animationType="fade" transparent onRequestClose={() => setAvatarEnlargedOpen(false)}>
        <Pressable onPress={() => setAvatarEnlargedOpen(false)} style={styles.enlargedAvatarBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.enlargedAvatarCard}>
            <Pressable onPress={() => setAvatarEnlargedOpen(false)} style={styles.enlargedCloseBtn}>
              <Feather name="x" size={22} color="#FFFFFF" />
            </Pressable>

            <View style={styles.enlargedAvatarWrapper}>
              <ProfileAvatar name={profileUser.name} uri={profileUser.avatarUrl} size={210} />
            </View>

            <Text style={styles.enlargedUserName}>{profileUser.name || "TCM Member"}</Text>
            {profileUser.handle ? <Text style={styles.enlargedUserHandle}>@{profileUser.handle}</Text> : null}

            <View style={styles.enlargedActionRow}>
              <Pressable
                onPress={() => {
                  setAvatarEnlargedOpen(false);
                  pickImage().then(() => setEditModalOpen(true));
                }}
                style={styles.enlargedChangeBtn}
              >
                <Feather name="camera" size={15} color="#FFFFFF" />
                <Text style={styles.enlargedChangeBtnText}>Change Photo</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <GetVerifiedModal
        visible={getVerifiedModalOpen}
        onClose={() => setGetVerifiedModalOpen(false)}
        onVerifySuccess={(plan) => {
          setProfileUser((prev) => ({ ...prev, verified: true }));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40
  },

  // Main Profile Card
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
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#F4F0FF"
  },
  avatarInitialsContainer: {
    backgroundColor: "#5B3CF5",
    borderWidth: 3,
    borderColor: "#F4F0FF",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft
  },
  avatarInitialsText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#5B3CF5",
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },

  userMainInfo: {
    gap: 6
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  userName: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: "#181725"
  },
  verifiedCheck: {
    marginTop: 2
  },
  getVerifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
    marginLeft: 6
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
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: "#DDD6FE"
  },
  verifiedPillText: {
    color: "#5B3CF5",
    fontSize: 11,
    fontFamily: fonts.bold
  },
  handleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  handleText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: "#7C7C9A"
  },
  memberBadgePill: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  memberBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: "#5B3CF5"
  },
  bioText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "#4A4A6A",
    lineHeight: 20,
    marginTop: 2
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 4,
    marginBottom: 8
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  metaText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#7C7C9A"
  },
  metaLink: {
    color: "#5B3CF5",
    textDecorationLine: "underline"
  },

  actionBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6
  },
  editBtn: {
    flex: 1,
    backgroundColor: "#5B3CF5",
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...shadow.soft
  },
  editBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.semiBold,
    fontSize: 13
  },
  settingsGearBtn: {
    backgroundColor: "#F0EDFF",
    borderWidth: 1,
    borderColor: "#E5E1FF",
    width: 38,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  shareBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5F2",
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  shareBtnText: {
    color: "#33334F",
    fontFamily: fonts.semiBold,
    fontSize: 13
  },
  mentorDashboardBtn: {
    backgroundColor: "#4323D3",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    ...shadow.medium
  },
  mentorDashboardBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 13
  },

  // Stats Card
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  statCol: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 2
  },
  statVal: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725"
  },
  statLbl: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: "#F0F0FA"
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
    borderBottomColor: "#5B3CF5"
  },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#7C7C9A"
  },
  tabTextActive: {
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },

  // Content Grid Feed
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
    fontSize: 13,
    color: "#181725",
    marginBottom: 3
  },
  cardTags: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#5B3CF5",
    marginBottom: 8
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  metricCount: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#7C7C9A"
  },

  // Bottom Sheet Modals
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end"
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: "82%",
    ...shadow.soft
  },
  sheetHandleBar: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E2E0EE",
    alignSelf: "center",
    marginBottom: 14
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: "#181725"
  },
  avatarEditSection: {
    alignItems: "center",
    marginBottom: 16
  },
  changePicBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  changePicText: {
    color: "#5B3CF5",
    fontSize: 12,
    fontFamily: fonts.semiBold
  },

  inputGroup: {
    marginBottom: 14
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#4A4A6A",
    marginBottom: 5
  },
  textInput: {
    backgroundColor: "#F8F7FF",
    borderWidth: 1,
    borderColor: "#EAE7FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#181725",
    fontFamily: fonts.regular
  },

  modalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5F2",
    alignItems: "center"
  },
  cancelBtnText: {
    color: "#4A4A6A",
    fontFamily: fonts.semiBold,
    fontSize: 14
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#5B3CF5",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.semiBold,
    fontSize: 14
  },

  // Instagram Modal Styles
  igModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  igTabSwitch: {
    flexDirection: "row",
    gap: 16
  },
  igTab: {
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent"
  },
  igTabActive: {
    borderBottomColor: "#5B3CF5"
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
    backgroundColor: "#5B3CF5",
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
    color: "#5B3CF5"
  },

  // Instagram Enlarged Avatar Styles
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
  enlargedChangeBtn: {
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  enlargedChangeBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.semiBold,
    fontSize: 14
  },

  // Wallet Header Pill
  topProfileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  topRightHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  headerIconCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F4F1FF",
    borderWidth: 1,
    borderColor: "#E5E0FF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...shadow.soft
  },
  headerBellDot: {
    position: "absolute",
    top: 5,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF3B30",
    borderWidth: 1,
    borderColor: "#FFFFFF"
  },
  headerWalletPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F1FF",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E5E0FF",
    ...shadow.soft
  },
  headerWalletBalance: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#5B3CF5"
  },
  headerCoinDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#D5CCFF",
    marginHorizontal: 8
  },
  headerCoinIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFC107",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4
  },
  headerCoinIconText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "#5D4037"
  },
  headerCoinsText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725"
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  }
});
