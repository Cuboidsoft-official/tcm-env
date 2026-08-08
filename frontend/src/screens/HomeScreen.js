import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import { addPostComment, createCommunityPost, getHome, getPostComments, sharePost, toggleCommentLike, togglePostLike, toggleSavePost } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import ProfileScreen from "./ProfileScreen";
import UserProfileScreen from "./UserProfileScreen";
import ProfileSettingsScreen from "./ProfileSettingsScreen";
import LearnScreen from "./LearnScreen";
import CourseDetailsScreen from "./CourseDetailsScreen";
import ContinueLearningScreen from "./ContinueLearningScreen";
import PopularCoursesScreen from "./PopularCoursesScreen";
import SearchScreen from "./SearchScreen";
import MentorProfileScreen from "./MentorProfileScreen";
import ChatScreen from "./ChatScreen";
import NotificationsScreen from "./NotificationsScreen";
import ExploreTcmCategoryScreen from "./ExploreTcmCategoryScreen";
import WalletScreen from "./WalletScreen";
import MentorDashboardScreen from "./MentorDashboardScreen";
import CreateCourseScreen from "./CreateCourseScreen";
import CreateWebinarScreen from "./CreateWebinarScreen";
import AllMentorsScreen from "./AllMentorsScreen";
import ChatListScreen from "./ChatListScreen";
import DoubtRoomScreen from "./DoubtRoomScreen";
import CommunityScreen from "./CommunityScreen";
import SidebarDrawer from "../components/SidebarDrawer";
import GetVerifiedModal from "../components/GetVerifiedModal";
import { useTheme } from "../context/ThemeContext";

const fallbackTabs = [
  { key: "Home", icon: "home" },
  { key: "Learn", icon: "book-open" },
  { key: "Community", icon: "users" },
  { key: "Chats", icon: "message-square" },
  { key: "Profile", icon: "user" }
];

const actionItems = [
  { key: "post", label: "Create Post", icon: "edit-3" },
  { key: "doubt", label: "Ask Doubt", icon: "help-circle" },
  { key: "notes", label: "Upload Notes", icon: "file-plus" },
  { key: "achievement", label: "Share Achievement", icon: "award" },
  { key: "poll", label: "Create Poll", icon: "bar-chart-2" }
];

const postModes = {
  post: {
    title: "Create Post",
    placeholder: "Share your learning update, notes, doubt or insight...",
    category: "Community",
    tags: "#TCM #Learning",
    media: { kind: "none" }
  },
  doubt: {
    title: "Ask Doubt",
    placeholder: "Write your doubt with subject, chapter, and what you already tried...",
    category: "Doubts",
    tags: "#Doubt #Help",
    media: { kind: "none" }
  },
  notes: {
    title: "Upload Notes",
    placeholder: "Add a short summary for your notes...",
    category: "UPSC",
    tags: "#Notes #Revision",
    media: {
      kind: "notes",
      label: "Student Notes",
      labelIcon: "file-document-outline",
      title: "Shared Notes",
      subtitle: "TCM Notes.pdf",
      fileName: "TCM Notes.pdf",
      fileSize: "2.1 MB"
    }
  },
  achievement: {
    title: "Share Achievement",
    placeholder: "Tell the community what you completed or won...",
    category: "Career",
    tags: "#Achievement #Progress",
    media: { kind: "none" }
  },
  poll: {
    title: "Create Poll",
    placeholder: "Ask a question and add options in the post text...",
    category: "Community",
    tags: "#Poll #Community",
    media: { kind: "none" }
  }
};

const initialsFor = (name = "TCM") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const formatFileSize = (bytes) => {
  if (!bytes) return "";

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function buildMediaPayload(config, draft, uploadType, frameKey = "none") {
  const title = draft.title.trim();
  const mediaUrl = draft.mediaUrl.trim();
  const fileUri = draft.fileUri?.trim?.() || "";
  const mimeType = draft.mimeType?.trim?.() || "";

  if (uploadType === "video") {
    if (!mediaUrl && !fileUri) return config.media;

    return {
      kind: "video",
      label: "Video Post",
      labelIcon: "play-circle",
      title: title || "New Video",
      subtitle: "TCM COMMUNITY",
      duration: "0:30",
      frameKey,
      imageUrl: mediaUrl,
      thumbnailUrl: mediaUrl,
      fileUri,
      videoUrl: fileUri || mediaUrl,
      mimeType
    };
  }

  if (uploadType === "document") {
    if (!mediaUrl && !fileUri && !draft.fileName.trim() && !draft.fileSize.trim()) {
      return config.media;
    }

    return {
      kind: "notes",
      label: "Shared Document",
      labelIcon: "file-document-outline",
      title: title || "Shared Notes",
      subtitle: draft.fileName.trim() || "TCM Document.pdf",
      fileName: draft.fileName.trim() || "TCM Document.pdf",
      fileSize: draft.fileSize.trim() || "2.1 MB",
      frameKey,
      imageUrl: mediaUrl,
      fileUri,
      mimeType
    };
  }

  if (mediaUrl) {
    return {
      kind: "showcase",
      label: "Image Post",
      labelIcon: "image-multiple",
      title: title || "Photo Update",
      subtitle: "TCM Community",
      frameKey,
      imageUrl: mediaUrl,
      carouselImages: [
        mediaUrl,
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=640&q=80",
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=640&q=80"
      ]
    };
  }

  return config.media;
}

export default function HomeScreen({ session, onLogout }) {
  const { width } = useWindowDimensions();
  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Home");
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [composerMode, setComposerMode] = useState("");
  const [previewItem, setPreviewItem] = useState(null);
  const [commentsPost, setCommentsPost] = useState(null);
  const [draft, setDraft] = useState({ text: "", tags: "", title: "", mentions: "", mediaUrl: "", fileName: "", fileSize: "", fileUri: "", mimeType: "", frameKey: "none" });
  const [uploadType, setUploadType] = useState("photo");
  const [posting, setPosting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeDrawerItem, setActiveDrawerItem] = useState("Home");
  const [drawerFeatureModal, setDrawerFeatureModal] = useState(null);
  const [targetUserProfile, setTargetUserProfile] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showContinueLearning, setShowContinueLearning] = useState(false);
  const [showPopularCourses, setShowPopularCourses] = useState(false);
  const [showSearchScreen, setShowSearchScreen] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [isCommChannelOpen, setIsCommChannelOpen] = useState(false);
  const [showNotificationsScreen, setShowNotificationsScreen] = useState(false);
  const [exploreCategoryKey, setExploreCategoryKey] = useState(null);
  const [showWalletScreen, setShowWalletScreen] = useState(false);
  const [showMentorDashboard, setShowMentorDashboard] = useState(false);
  const [showCreateCourseScreen, setShowCreateCourseScreen] = useState(false);
  const [showCreateWebinarScreen, setShowCreateWebinarScreen] = useState(false);
  const [showAllMentorsScreen, setShowAllMentorsScreen] = useState(false);
  const [showCommunityScreen, setShowCommunityScreen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState(null);
  const [activeDoubtRoom, setActiveDoubtRoom] = useState(null);
  const [getVerifiedModalOpen, setGetVerifiedModalOpen] = useState(false);
  const { theme } = useTheme();

  const user = home?.user || session?.user || {};

  function resetSubScreens() {
    setSelectedCourseId(null);
    setShowContinueLearning(false);
    setShowPopularCourses(false);
    setShowSearchScreen(false);
    setSelectedMentorId(null);
    setActiveChatUser(null);
    setActiveDoubtRoom(null);
    setShowNotificationsScreen(false);
    setExploreCategoryKey(null);
    setShowWalletScreen(false);
    setShowMentorDashboard(false);
    setShowCreateCourseScreen(false);
    setShowCreateWebinarScreen(false);
    setShowAllMentorsScreen(false);
    setShowCommunityScreen(false);
    setTargetUserProfile(null);
    setCourseToEdit(null);
  }

  function isSelfUser(target) {
    if (!target || !user) return false;
    const targetId = String(target.id || target._id || target.authorId || "").trim();
    const userId = String(user.id || user._id || "").trim();
    if (targetId && userId && targetId === userId) return true;

    const targetHandle = (target.handle || "").toLowerCase().replace(/^@/, "").trim();
    const userHandle = (user.handle || "").toLowerCase().replace(/^@/, "").trim();
    if (targetHandle && userHandle && targetHandle === userHandle) return true;

    const targetEmail = (target.email || "").toLowerCase().trim();
    const userEmail = (user.email || "").toLowerCase().trim();
    if (targetEmail && userEmail && targetEmail === userEmail) return true;

    const targetName = (target.name || target.authorName || "").toLowerCase().trim();
    const userName = (user.name || "").toLowerCase().trim();
    if (targetName && userName && targetName === userName) return true;

    return false;
  }

  function handleSelectUser(u) {
    if (!u) return;
    if (isSelfUser(u)) {
      setTargetUserProfile(null);
      setActiveDrawerItem("Profile");
      setActiveTab("Profile");
    } else {
      setTargetUserProfile(u);
    }
  }

  const tabs = home?.tabs?.length ? home.tabs : fallbackTabs;
  const categories = home?.categories || [];
  const posts = home?.posts || [];
  const contentWidth = Math.min(width - 24, 820);

  useEffect(() => {
    loadHome();
  }, [session?.token]);

  async function loadHome({ quiet = false } = {}) {
    if (!session?.token) {
      setLoading(false);
      setError("Please login again to load your live workspace.");
      return;
    }

    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const data = await getHome(session.token);
      setHome(data);
      setActiveCategory((current) => current || data.categories?.[0] || "");
    } catch (nextError) {
      setError(nextError.message || "Unable to load live home data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function resetSubScreens() {
    setTargetUserProfile(null);
    setSelectedCourseId(null);
    setSelectedMentorId(null);
    setActiveChatUser(null);
    setShowSearchScreen(false);
    setShowContinueLearning(false);
    setShowPopularCourses(false);
    setShowNotificationsScreen(false);
    setExploreCategoryKey(null);
    setShowWalletScreen(false);
    setShowMentorDashboard(false);
    setShowCreateCourseScreen(false);
    setShowCreateWebinarScreen(false);
    setShowAllMentorsScreen(false);
  }

  function handleSelectDrawerItem(itemKey) {
    resetSubScreens();
    setActiveDrawerItem(itemKey);
    setSidebarOpen(false);

    if (itemKey === "Home") {
      setActiveTab("Home");
    } else if (itemKey === "My Classes") {
      setActiveTab("Learn");
    } else if (itemKey === "Doubts") {
      setActiveTab("Doubts");
    } else if (itemKey === "TCM Community" || itemKey === "Community") {
      setShowCommunityScreen(true);
    } else if (itemKey === "Notifications") {
      setShowNotificationsScreen(true);
    } else if (itemKey === "Profile") {
      setActiveTab("Profile");
    } else if (itemKey === "Settings") {
      setActiveTab("ProfileSettings");
    } else if (itemKey === "Go Premium" || itemKey === "Get Premium" || itemKey === "Get TCM Verified Pro") {
      setGetVerifiedModalOpen(true);
    } else {
      setDrawerFeatureModal(itemKey);
    }
  }

  function openComposer(mode) {
    const config = postModes[mode] || postModes.post;
    setComposerMode(mode);
    setUploadType(config.media.kind === "video" ? "video" : config.media.kind === "notes" ? "document" : "photo");
    setDraft({ text: "", tags: "", title: "", mentions: "", mediaUrl: "", fileName: "", fileSize: "", fileUri: "", mimeType: "", frameKey: "none" });
    setActionMenuOpen(false);
  }

  async function submitPost() {
    const config = postModes[composerMode] || postModes.post;
    const postText = draft.text.trim();
    const mediaFrameKey = uploadType === "video" && draft.frameKey === "none" ? "portrait" : draft.frameKey;

    if (!postText) {
      Alert.alert(config.title, "Please enter text before publishing your post.");
      return;
    }

    setPosting(true);
    try {
      const media = buildMediaPayload(config, draft, uploadType, mediaFrameKey);
      const result = await createCommunityPost(session.token, {
        text: postText,
        content: postText,
        caption: postText,
        category: config.category,
        tags: [...draft.tags.split(/[,\s]+/), ...draft.mentions.split(/[,\s]+/)].filter(Boolean),
        media
      });

      setHome((current) => ({
        ...current,
        posts: [result.post, ...(current?.posts || [])]
      }));
      setComposerMode("");
      setDraft({ text: "", tags: "", title: "", mentions: "", mediaUrl: "", fileName: "", fileSize: "", fileUri: "", mimeType: "", frameKey: "none" });
      setActiveTab("Home");
      setActiveCategory("For You");
    } catch (nextError) {
      Alert.alert("Post failed", nextError.message || "Could not publish post.");
    } finally {
      setPosting(false);
    }
  }

  const feedPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posts.filter((post) => {
      const categoryMatch = !activeCategory || activeCategory === "For You" || activeCategory === "Trending" || post.category === activeCategory;
      const queryMatch =
        !query ||
        [post.authorName, post.authorRole, post.category, post.text, ...(post.tags || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, posts, search]);

  if (composerMode) {
    return (
      <CreatePostScreen
        config={postModes[composerMode] || postModes.post}
        draft={draft}
        posting={posting}
        user={user}
        uploadType={uploadType}
        setDraft={setDraft}
        setUploadType={setUploadType}
        onClose={() => setComposerMode("")}
        onSubmit={submitPost}
      />
    );
  }

  const isFullScreenView = Boolean(activeDoubtRoom || activeChatUser || selectedMentorId || showNotificationsScreen || showSearchScreen || showPopularCourses || showContinueLearning || selectedCourseId || exploreCategoryKey || showWalletScreen || showMentorDashboard || showCreateCourseScreen || showCreateWebinarScreen || showAllMentorsScreen);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={[styles.appShell, { backgroundColor: theme.bg }]}>
        {isFullScreenView ? (
          <View style={[styles.page, { width: contentWidth, flex: 1, paddingBottom: 0 }]}>
            {activeDoubtRoom ? (
              <DoubtRoomScreen
                session={session}
                roomId={activeDoubtRoom.roomId || "NEET-DOUBT-001"}
                onClose={() => setActiveDoubtRoom(null)}
                onOpenMentorProfile={(mId) => {
                  setActiveDoubtRoom(null);
                  setSelectedMentorId(mId || "m1");
                }}
              />
            ) : activeChatUser ? (
              <ChatScreen
                session={session}
                user={user}
                targetUser={activeChatUser}
                targetUserId={activeChatUser?.id || "m1"}
                onClose={() => setActiveChatUser(null)}
                onOpenUserProfile={(u) => {
                  setActiveChatUser(null);
                  handleSelectUser(u || activeChatUser);
                }}
              />
            ) : selectedMentorId ? (
              <MentorProfileScreen
                session={session}
                mentorId={selectedMentorId}
                onClose={() => setSelectedMentorId(null)}
                onOpenCourseDetails={(cId) => {
                  setSelectedMentorId(null);
                  setSelectedCourseId(cId || "p1");
                }}
                onOpenChat={(targetM) => setActiveChatUser(targetM || { id: "m1", name: "Rahul Sharma" })}
              />
            ) : showNotificationsScreen ? (
              <NotificationsScreen
                session={session}
                onBack={() => setShowNotificationsScreen(false)}
                onOpenChat={(targetM) => {
                  setShowNotificationsScreen(false);
                  setActiveChatUser(targetM);
                }}
                onOpenCourseDetails={(cId) => {
                  setShowNotificationsScreen(false);
                  setSelectedCourseId(cId);
                }}
                onOpenContinueLearning={() => {
                  setShowNotificationsScreen(false);
                  setShowContinueLearning(true);
                }}
              />
            ) : showSearchScreen ? (
              <SearchScreen
                session={session}
                user={user}
                onBack={() => setShowSearchScreen(false)}
                onSelectPost={(p) => setCommentsPost(p)}
                onSelectCourse={(cId) => {
                  setShowSearchScreen(false);
                  setSelectedCourseId(cId || "p1");
                }}
                onSelectUser={(u) => {
                  setShowSearchScreen(false);
                  if (u?.role?.toLowerCase().includes("mentor") || u?.id?.startsWith("m")) {
                    setSelectedMentorId(u?.id || "m1");
                  } else {
                    handleSelectUser(u);
                  }
                }}
              />
            ) : showPopularCourses ? (
              <PopularCoursesScreen
                session={session}
                onBack={() => setShowPopularCourses(false)}
                onNotifications={() => handleSelectDrawerItem("Notifications")}
                onSelectCourse={(cId) => {
                  setShowPopularCourses(false);
                  setSelectedCourseId(cId || "p1");
                }}
              />
            ) : showContinueLearning ? (
              <ContinueLearningScreen
                session={session}
                user={user}
                onBack={() => setShowContinueLearning(false)}
                onNotifications={() => handleSelectDrawerItem("Notifications")}
                onOpenCourseDetails={(cId) => {
                  setShowContinueLearning(false);
                  setSelectedCourseId(cId || "p1");
                }}
              />
            ) : selectedCourseId ? (
              <CourseDetailsScreen
                session={session}
                user={user}
                courseId={selectedCourseId}
                onBack={() => setSelectedCourseId(null)}
                onEditCourse={(c) => {
                  setSelectedCourseId(null);
                  setCourseToEdit(c);
                  setShowCreateCourseScreen(true);
                }}
              />
            ) : exploreCategoryKey ? (
              <ExploreTcmCategoryScreen
                session={session}
                categoryKey={exploreCategoryKey}
                onBack={() => setExploreCategoryKey(null)}
                onSelectCourse={(cId) => setSelectedCourseId(cId || "p1")}
                onSelectUser={(u) => {
                  if (u?.role?.toLowerCase().includes("mentor") || u?.id?.startsWith("m")) {
                    setSelectedMentorId(u?.id || "m1");
                  } else {
                    handleSelectUser(u);
                  }
                }}
              />
            ) : showAllMentorsScreen ? (
              <AllMentorsScreen
                session={session}
                onBack={() => setShowAllMentorsScreen(false)}
                onSelectMentor={(mId) => {
                  setShowAllMentorsScreen(false);
                  setSelectedMentorId(mId || "m1");
                }}
              />
            ) : showCommunityScreen ? (
              <CommunityScreen
                session={session}
                navigation={{ goBack: () => setShowCommunityScreen(false) }}
              />
            ) : showWalletScreen ? (
              <WalletScreen
                session={session}
                user={user}
                onBack={() => setShowWalletScreen(false)}
              />
            ) : showMentorDashboard ? (
              <MentorDashboardScreen
                session={session}
                user={user}
                onBack={() => setShowMentorDashboard(false)}
                onEditCourse={(course) => {
                  setShowMentorDashboard(false);
                  setCourseToEdit(course);
                  setShowCreateCourseScreen(true);
                }}
                onNavigateActivity={(act) => {
                  if (act === "Add Courses") {
                    setShowMentorDashboard(false);
                    setCourseToEdit(null);
                    setShowCreateCourseScreen(true);
                  }
                  if (act === "Create Webinar & Events" || act.includes("Webinar")) {
                    setShowMentorDashboard(false);
                    setShowCreateWebinarScreen(true);
                  }
                }}
              />
            ) : showCreateCourseScreen ? (
              <CreateCourseScreen
                session={session}
                user={user}
                courseToEdit={courseToEdit}
                onBack={() => {
                  setCourseToEdit(null);
                  setShowCreateCourseScreen(false);
                }}
                onCourseCreated={() => {
                  loadHome({ quiet: true });
                  setCourseToEdit(null);
                  setShowCreateCourseScreen(false);
                  setActiveTab("Learn");
                }}
              />
            ) : showCreateWebinarScreen ? (
              <CreateWebinarScreen
                session={session}
                user={user}
                onBack={() => setShowCreateWebinarScreen(false)}
                onWebinarCreated={() => {
                  loadHome({ quiet: true });
                  setShowCreateWebinarScreen(false);
                  setActiveTab("Learn");
                }}
              />
            ) : null}
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={[styles.page, { width: contentWidth }]}>
              {!targetUserProfile && (activeTab === "Learn" || (activeTab === "Community" && isCommChannelOpen)) ? null : (
                <Header
                  user={user}
                  notifications={home?.notifications || 0}
                  onOpenSidebar={() => setSidebarOpen(true)}
                  onProfile={() => {
                    resetSubScreens();
                    setActiveDrawerItem("Profile");
                    setActiveTab("Profile");
                  }}
                  onOpenSettings={() => {
                    resetSubScreens();
                    setActiveDrawerItem("Settings");
                    setActiveTab("ProfileSettings");
                  }}
                  isSelfProfile={activeTab === "Profile" && !targetUserProfile}
                  onNotifications={() => handleSelectDrawerItem("Notifications")}
                  onOpenWallet={() => setShowWalletScreen(true)}
                  showBack={!!targetUserProfile}
                  backLabel={targetUserProfile?.name}
                  onBack={() => setTargetUserProfile(null)}
                />
              )}

              {targetUserProfile ? (
                <UserProfileScreen
                  session={session}
                  targetUser={targetUserProfile}
                  onClose={() => setTargetUserProfile(null)}
                  onOpenChat={(targetU) => {
                    setTargetUserProfile(null);
                    setActiveChatUser(targetU || targetUserProfile);
                  }}
                  onSelectPost={(post) => {
                    setTargetUserProfile(null);
                    resetSubScreens();
                    setActiveTab("Home");
                    setActiveDrawerItem("Home");
                    setCommentsPost(post);
                  }}
                />
              ) : activeTab === "Home" ? (
              <>
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  onRefresh={() => loadHome({ quiet: true })}
                  refreshing={refreshing}
                  onOpenSearch={() => setShowSearchScreen(true)}
                />
                {loading ? <LoadingState /> : null}
                {!loading && error ? <EmptyState title="Live data unavailable" text={error} /> : null}
                {!loading && !error ? (
                  <>
                    <CategoryTabs categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
                    <View style={styles.feed}>
                      {feedPosts.length ? (
                        feedPosts.map((post) => (
                          <PostCard
                            key={post.id}
                            session={session}
                            post={post}
                            onComment={setCommentsPost}
                            onPreview={setPreviewItem}
                            onSelectUser={(u) => handleSelectUser(u || { id: post.authorId || post.authorName, name: post.authorName, avatarUrl: post.authorAvatarUrl, role: post.authorRole })}
                          />
                        ))
                      ) : (
                        <EmptyState
                          title={search || (activeCategory && activeCategory !== "For You") ? "No matching posts" : "No posts in Feed yet"}
                          text={search || (activeCategory && activeCategory !== "For You") ? "Try another search or category." : "Be the first to share an update, notes, or question!"}
                        />
                      )}
                    </View>
                  </>
                ) : null}
              </>
            ) : activeTab === "Community" ? (
              <CommunityScreen
                session={session}
                navigation={{ goBack: () => setActiveTab("Home") }}
                onChannelStateChange={(isOpen) => setIsCommChannelOpen(isOpen)}
                onOpenChannelChat={(targetChannel) => setActiveChatUser(targetChannel)}
              />
            ) : activeTab === "Learn" ? (
              <LearnScreen
                learn={home?.learn}
                user={user}
                session={session}
                onOpenSidebar={() => setSidebarOpen(true)}
                onNotifications={() => handleSelectDrawerItem("Notifications")}
                onSelectUser={(m) => setSelectedMentorId(m?.id || "m1")}
                onSelectCourse={(cId) => setSelectedCourseId(cId || "p1")}
                onOpenContinueLearning={() => setShowContinueLearning(true)}
                onOpenPopularCourses={() => setShowPopularCourses(true)}
                onOpenAllMentors={() => setShowAllMentorsScreen(true)}
                onOpenExploreCategory={(catKey) => setExploreCategoryKey(catKey)}
              />
            ) : activeTab === "Chats" || activeTab === "Doubts" ? (
              <ChatListScreen
                session={session}
                onSelectChat={(chatUser) => {
                  setActiveChatUser(chatUser);
                }}
                onSelectDoubtRoom={(roomItem) => {
                  setActiveDoubtRoom(roomItem);
                }}
              />
            ) : activeTab === "Profile" ? (
              <ProfileScreen
                session={session}
                user={user}
                onOpenSettings={() => {
                  setActiveDrawerItem("Settings");
                  setActiveTab("ProfileSettings");
                }}
                onOpenWallet={() => setShowWalletScreen(true)}
                onNotifications={() => handleSelectDrawerItem("Notifications")}
                onOpenMentorDashboard={() => setShowMentorDashboard(true)}
                onSelectPost={(post) => {
                  setTargetUserProfile(null);
                  resetSubScreens();
                  setActiveTab("Home");
                  setActiveDrawerItem("Home");
                  setCommentsPost(post);
                }}
              />
            ) : activeTab === "ProfileSettings" ? (
              <ProfileSettingsScreen
                session={session}
                user={user}
                onBack={() => {
                  setActiveDrawerItem("Profile");
                  setActiveTab("Profile");
                }}
                onLogout={() => {
                  if (session?.onLogout) {
                    session.onLogout();
                  } else if (onLogout) {
                    onLogout();
                  }
                }}
                onUserUpdate={(updatedUser) => {
                  setHome((prev) => ({ ...prev, user: updatedUser }));
                }}
              />
            ) : (
              <TabPlaceholder activeTab={activeTab} />
            )}
          </View>
          </ScrollView>
        )}
        {!selectedCourseId && !showPopularCourses && !showSearchScreen && !selectedMentorId && !activeChatUser && !activeDoubtRoom && !showNotificationsScreen ? (
          <ActionDock
            open={actionMenuOpen}
            setOpen={setActionMenuOpen}
            onAction={openComposer}
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={(tab) => {
              resetSubScreens();
              setActiveTab(tab);
              setActiveDrawerItem(tab);
            }}
          />
        ) : null}

        <SidebarDrawer
          visible={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          activeItem={activeDrawerItem}
          onSelectMenuItem={handleSelectDrawerItem}
          onOpenGetVerified={() => setGetVerifiedModalOpen(true)}
          onLogout={() => {
            setSidebarOpen(false);
            if (session?.onLogout) {
              session.onLogout();
            } else if (onLogout) {
              onLogout();
            } else {
              Alert.alert("Logged Out", "You have been logged out successfully.");
            }
          }}
        />

        <GetVerifiedModal
          visible={getVerifiedModalOpen}
          onClose={() => setGetVerifiedModalOpen(false)}
          onVerifySuccess={() => {
            if (setHome) {
              setHome((prev) => (prev ? { ...prev, user: { ...prev.user, verified: true } } : prev));
            }
          }}
        />

        <DrawerFeatureModal
          feature={drawerFeatureModal}
          onClose={() => setDrawerFeatureModal(null)}
          user={user}
        />

        {/* UserProfileScreen is now rendered inline in the ScrollView above */}

        <MediaPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
        <CommentsBottomSheet
          session={session}
          post={commentsPost}
          onClose={() => setCommentsPost(null)}
          onSelectUser={(u) => {
            setCommentsPost(null);
            handleSelectUser(u);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function Header({ user, notifications, onOpenSidebar, onProfile, onOpenSettings, isSelfProfile, onNotifications, showBack, backLabel, onBack, onOpenWallet }) {
  if (showBack) {
    return (
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Pressable onPress={onBack} style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
            <Feather name="chevron-left" size={26} color={colors.primaryDark} />
          </Pressable>
          <View style={styles.brandWrap}>
            <Text style={styles.brand}>TCM</Text>
            <Text style={styles.brandSub}>{backLabel || "Talent & Career Mission"}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={onNotifications || (() => Alert.alert("Notifications", `${notifications} learning updates.`))} style={styles.iconButton}>
            <Feather name="bell" size={24} color={colors.primaryDark} />
            {notifications ? (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{notifications > 9 ? "9+" : notifications}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable onPress={onProfile} style={styles.profileRing}>
            <Avatar name={user.name} uri={user.avatarUrl} size={28} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Pressable onPress={onOpenSidebar} style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
          <Feather name="menu" size={25} color={colors.primaryDark} />
        </Pressable>
        <View style={styles.brandWrap}>
          <Text style={styles.brand}>TCM</Text>
          <Text style={styles.brandSub}>Talent & Career Mission</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        {/* Coin / Wallet Pill displayed ONLY on Self Profile screen */}
        {isSelfProfile ? (
          <Pressable
            onPress={onOpenWallet || (() => Alert.alert("TCM Wallet", "Opening your wallet..."))}
            style={({ pressed }) => [styles.headerWalletPill, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="wallet-outline" size={15} color="#5B3CF5" style={{ marginRight: 4 }} />
            <Text style={styles.headerWalletBalance}>
              ₹{user.wallet?.totalBalance !== undefined ? user.wallet.totalBalance.toLocaleString() : (user.balance || 1250)}
            </Text>
            <View style={styles.headerCoinDivider} />
            <View style={styles.headerCoinIcon}>
              <Text style={styles.headerCoinIconText}>$</Text>
            </View>
            <Text style={styles.headerCoinsText}>
              {user.wallet?.tcmCoins !== undefined ? user.wallet.tcmCoins : (user.tcmCoins || user.coins || 120)}
            </Text>
          </Pressable>
        ) : null}

        <Pressable onPress={onNotifications || (() => Alert.alert("Notifications", `${notifications} learning updates.`))} style={styles.iconButton}>
          <Feather name="bell" size={24} color={colors.primaryDark} />
          {notifications ? (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{notifications > 9 ? "9+" : notifications}</Text>
            </View>
          ) : null}
        </Pressable>
        {isSelfProfile ? (
          <Pressable onPress={onOpenSettings} style={[styles.iconButton, { backgroundColor: "#F0EDFF", borderRadius: 20, width: 34, height: 34, alignItems: "center", justifyContent: "center" }]}>
            <Feather name="settings" size={20} color="#5B3CF5" />
          </Pressable>
        ) : (
          <Pressable onPress={onProfile} style={styles.profileRing}>
            <Avatar name={user.name} uri={user.avatarUrl} size={28} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function SearchBar({ value, onChangeText, onRefresh, refreshing, onOpenSearch }) {
  return (
    <View style={styles.searchRow}>
      <Pressable onPress={onOpenSearch} style={styles.searchBox}>
        <Feather name="search" size={16} color="#52506E" />
        <TextInput
          editable={!onOpenSearch}
          pointerEvents={onOpenSearch ? "none" : "auto"}
          autoCapitalize="none"
          placeholder="Search topics, posts, notes, people..."
          placeholderTextColor="#77758E"
          style={styles.searchInput}
          value={value}
          onChangeText={onChangeText}
        />
      </Pressable>
      <Pressable onPress={onOpenSearch || onRefresh} style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}>
        {refreshing ? <ActivityIndicator color={colors.primary} size="small" /> : <Feather name="sliders" size={16} color={colors.ink} />}
      </Pressable>
    </View>
  );
}

function Avatar({ name, uri, size }) {
  if (uri) {
    return <Image source={{ uri }} style={{ borderRadius: size / 2, height: size, width: size }} />;
  }

  return (
    <View style={[styles.initialAvatar, { borderRadius: size / 2, height: size, width: size }]}>
      <Text style={styles.initialText}>{initialsFor(name)}</Text>
    </View>
  );
}

function QuickAccess({ categories, activeCategory, setActiveCategory }) {
  const quickItems = categories.filter((category) => !["For You", "Following", "Trending"].includes(category)).slice(0, 6);
  if (!quickItems.length) return null;

  return (
    <View style={styles.quickPanel}>
      <View style={styles.quickHeader}>
        <Text style={styles.quickTitle}>Explore Feed</Text>
        <Text style={styles.quickSub}>Pick a real category</Text>
      </View>
      <ScrollView horizontal contentContainerStyle={styles.quickContent} showsHorizontalScrollIndicator={false}>
        {quickItems.map((item) => {
          const active = activeCategory === item;
          return (
            <Pressable key={item} onPress={() => setActiveCategory(item)} style={[styles.quickItem, active && styles.quickItemActive]}>
              <MaterialCommunityIcons name={item === "Coding" ? "code-tags" : item === "UPSC" ? "bank" : item === "Web Dev" ? "laptop" : "school"} size={19} color={active ? "#FFFFFF" : colors.primary} />
              <Text style={[styles.quickItemText, active && styles.quickItemTextActive]}>{item}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function CategoryTabs({ categories, activeCategory, setActiveCategory }) {
  if (!categories.length) return null;

  return (
    <ScrollView horizontal contentContainerStyle={styles.categoryContent} showsHorizontalScrollIndicator={false}>
      {categories.map((category) => {
        const active = category === activeCategory;
        return (
          <Pressable key={category} onPress={() => setActiveCategory(category)} style={[styles.categoryTab, active && styles.categoryTabActive]}>
            <Text numberOfLines={1} style={[styles.categoryText, active && styles.categoryTextActive]}>{category}</Text>
          </Pressable>
        );
      })}
      <Pressable onPress={() => setActiveCategory("For You")} style={styles.categoryDrop}>
        <Feather name="chevron-down" size={16} color="#646179" />
      </Pressable>
    </ScrollView>
  );
}

function PostCard({ session, post, onComment, onPreview, onSelectUser }) {
  const metrics = post.metrics || {};
  const media = post.media || {};

  return (
    <View style={styles.postCard}>
      <Pressable onPress={() => onSelectUser && onSelectUser()} style={styles.postHeader}>
        <Avatar name={post.authorName} uri={post.authorAvatarUrl} size={42} />
        <View style={styles.postAuthor}>
          <View style={styles.authorLine}>
            <Text numberOfLines={1} style={styles.authorName}>
              {post.authorName}
            </Text>
            {post.isMentor || post.authorRole?.toLowerCase().includes("mentor") || post.authorRole?.toLowerCase().includes("lead") || post.authorRole?.toLowerCase().includes("hod") || post.authorRole?.toLowerCase().includes("expert") ? (
              <View style={styles.mentorBadgePill}>
                <MaterialCommunityIcons name="school" size={11} color="#FFFFFF" />
                <Text style={styles.mentorBadgeText}>Mentor</Text>
              </View>
            ) : post.verified ? (
              <MaterialCommunityIcons name="check-decagram" size={19} color={colors.primary} />
            ) : null}
          </View>
          <Text numberOfLines={1} style={styles.authorRole}>
            {post.authorRole}
          </Text>
        </View>
        <Feather name="more-vertical" size={22} color={colors.ink} />
      </Pressable>

      <View style={styles.postMetaLine}>
        {media.label ? <MediaLabel media={media} /> : null}
        <View style={styles.metaDot} />
        <Text style={styles.postTime}>{post.timeLabel}</Text>
        <Feather name="globe" size={13} color="#6D6A85" />
      </View>
      <ReadMoreText text={post.text} />
      <PostMedia post={post} onPreview={onPreview} />
      <PostActions post={post} session={session} metrics={metrics} onComment={() => onComment(post)} />

      {post.tags?.length ? (
        <View style={styles.tagsRow}>
          {post.tags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function MediaLabel({ media }) {
  return (
    <View style={styles.mediaLabel}>
      <MaterialCommunityIcons name={media.labelIcon || "tag"} size={12} color={colors.primary} />
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.mediaLabelText}>{media.label}</Text>
    </View>
  );
}

function ReadMoreText({ text = "" }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 95 || text.split("\n").length > 2;

  return (
    <View>
      <Text numberOfLines={expanded ? undefined : 3} style={styles.postText}>
        {text}
      </Text>
      {isLong ? (
        <Pressable hitSlop={8} onPress={() => setExpanded((value) => !value)} style={styles.readMoreButton}>
          <Text style={styles.readMoreText}>{expanded ? "Show less" : "Read more"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function PostMedia({ post, onPreview }) {
  const media = post.media || {};

  if (media.kind === "notes") {
    const previewImages = [media.imageUrl, ...(media.carouselImages || [])].filter(Boolean);
    const documentItem = {
      type: "document",
      title: media.fileName || media.subtitle || media.title || "Document",
      subtitle: media.title || media.label || "TCM document",
      fileSize: media.fileSize,
      imageUrl: media.imageUrl,
      fileUri: media.fileUri,
      mimeType: media.mimeType,
      authorName: post.authorName
    };

    return (
      <View style={styles.notesMedia}>
        <Pressable onPress={() => onPreview(documentItem)} style={styles.notesHeroPreview}>
          {previewImages[0] ? (
            <Image source={{ uri: previewImages[0] }} style={styles.notesPreviewImage} />
          ) : (
            <DocumentThumbnail title={media.title || "Notes"} />
          )}
        </Pressable>
        <View style={styles.notesSide}>
          <Pressable onPress={() => onPreview(documentItem)} style={({ pressed }) => [styles.pdfCard, pressed && styles.pressed]}>
            <View style={styles.pdfIconWrap}>
              <MaterialCommunityIcons name="file-pdf-box" size={30} color="#FF465F" />
            </View>
            <View style={styles.pdfCopy}>
              <Text numberOfLines={2} style={styles.pdfTitle}>{media.fileName || media.subtitle}</Text>
              <Text style={styles.pdfSize}>{media.fileSize}</Text>
            </View>
          </Pressable>
          <View style={styles.notesThumbRow}>
            {[0, 1].map((item) => (
              <Pressable key={item} onPress={() => onPreview(documentItem)} style={styles.notesMiniThumb}>
                {previewImages[item + 1] || previewImages[0] ? (
                  <Image source={{ uri: previewImages[item + 1] || previewImages[0] }} style={styles.notesPreviewImage} />
                ) : (
                  <DocumentThumbnail title={item === 0 ? "Page 1" : "Page 2"} />
                )}
              </Pressable>
            ))}
            <Pressable onPress={() => onPreview(documentItem)} style={styles.notesMoreThumb}>
              {previewImages[2] || previewImages[0] ? (
                <Image source={{ uri: previewImages[2] || previewImages[0] }} style={styles.notesPreviewImage} />
              ) : (
                <DocumentThumbnail title="More" />
              )}
              <View style={styles.notesMoreOverlay}>
                <Text style={styles.notesMoreText}>+3</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (media.kind === "showcase") {
    const carouselImages = media.carouselImages?.length
      ? media.carouselImages
      : [
          media.imageUrl,
          "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=640&q=80",
          "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=640&q=80"
        ].filter(Boolean);

    return (
      <ScrollView horizontal contentContainerStyle={styles.carouselContent} showsHorizontalScrollIndicator={false} style={styles.carouselMedia}>
        {carouselImages.map((imageUrl, index) => {
          const title = index === 0 ? media.title : index === 1 ? "Courses" : "Achievements";
          const subtitle = index === 0 ? media.subtitle : "TCM learning preview";
          const icon = index === 0 ? media.labelIcon || "image-multiple" : index === 1 ? "school-outline" : "trophy-outline";

          return (
            <Pressable
              key={`${imageUrl}-${index}`}
              onPress={() =>
                onPreview({
                  type: "image",
                  title,
                  subtitle,
                  imageUrl
                })
              }
              style={({ pressed }) => [styles.carouselSlide, pressed && styles.pressed]}
            >
              <Image source={{ uri: imageUrl }} style={styles.carouselImage} />
              <LinearGradient colors={["rgba(8,7,28,0)", "rgba(8,7,28,0.62)"]} style={styles.carouselOverlay}>
                <View style={styles.carouselTitleRow}>
                  <View style={styles.carouselBadgeIcon}>
                    <MaterialCommunityIcons name={icon} size={12} color="#FFFFFF" />
                  </View>
                  <Text numberOfLines={1} style={styles.showcaseTitle}>{title}</Text>
                </View>
                <Text numberOfLines={1} style={styles.showcaseSub}>{subtitle}</Text>
              </LinearGradient>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }

  if (media.kind === "code") {
    return <CodeBlock lines={media.codeLines || []} />;
  }

  if (media.kind === "roadmap") {
    return (
      <LinearGradient colors={["#F5F2FF", "#FFFFFF"]} style={styles.roadmapMedia}>
        <Text style={styles.roadmapTitle}>{media.title}</Text>
        <View style={styles.roadmapSteps}>
          {(media.roadmapSteps || []).map((step) => (
            <View key={step} style={styles.roadmapStep}>
              <Text style={styles.roadmapStepText}>{step}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    );
  }

  if (media.kind === "video" && post.category === "Coding") {
    const codeLines = [
      'String str = "TCM is awesome";',
      "String rev = new StringBuilder(str).reverse().toString();",
      "System.out.println(rev);"
    ];

    return <CodeBlock lines={codeLines} />;
  }

  if (media.kind !== "video") return null;

  return <VideoFeedPlayer media={media} />;
}

function VideoFeedPlayer({ media }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef(null);

  const frameKey = media.frameKey || "portrait";
  const sourceUri = media.videoUrl || media.fileUri || (media.mimeType?.startsWith("video/") ? media.imageUrl : "");
  const posterUri = media.thumbnailUrl || (media.imageUrl && media.imageUrl !== sourceUri ? media.imageUrl : "");
  const player = useVideoPlayer(sourceUri ? { uri: sourceUri } : null, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  function togglePlay() {
    if (!sourceUri) return;
    const nextPlaying = !playing;
    if (playing) {
      player.pause();
    } else {
      player.play();
    }
    setPlaying(nextPlaying);

    // Flash play/pause icon on single tap, then auto-hide after 900ms!
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 900);
  }

  function toggleMute() {
    const nextMuted = !muted;
    player.muted = nextMuted;
    setMuted(nextMuted);
  }

  return (
    <View
      style={[
        styles.videoMedia,
        frameKey === "square" && styles.videoMediaSquare,
        frameKey === "landscape" && styles.videoMediaLandscape,
        frameKey === "polaroid" && styles.videoMediaPolaroid,
        frameKey === "rounded" && styles.videoMediaRounded
      ]}
    >
      {sourceUri ? (
        <VideoView player={player} nativeControls={false} contentFit="cover" style={styles.videoPlayerView} />
      ) : posterUri ? (
        <Image source={{ uri: posterUri }} style={styles.videoThumbImage} />
      ) : null}
      {!playing && posterUri ? <Image source={{ uri: posterUri }} style={styles.videoPosterImage} /> : null}
      <LinearGradient colors={["rgba(8,7,28,0.04)", "rgba(8,7,28,0.78)"]} style={styles.videoShade} />
      <Pressable onPress={togglePlay} style={styles.videoTapLayer} />
      <View style={styles.videoCopy}>
        <Text numberOfLines={1} style={styles.videoTitle}>{media.title || "Video Post"}</Text>
        <Text numberOfLines={1} style={styles.videoSmall}>{media.subtitle || "TCM Community"}</Text>
      </View>

      {/* Auto-Hiding Play/Pause Icon Overlay */}
      {showControls || !playing ? (
        <Pressable onPress={togglePlay} style={styles.playCircle}>
          <FontAwesome name={playing ? "pause" : "play"} size={18} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <View style={styles.videoControlRow}>
        <Pressable onPress={toggleMute} style={styles.videoMiniControl}>
          <Feather name={muted ? "volume-x" : "volume-2"} size={15} color="#FFFFFF" />
        </Pressable>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{media.duration || "0:30"}</Text>
        </View>
      </View>
    </View>
  );
}

function CodeBlock({ lines }) {
  return (
    <LinearGradient colors={["#151923", "#0B111A"]} style={styles.codeMedia}>
      <Feather name="copy" size={19} color="#FFFFFF" style={styles.codeCopy} />
      {lines.map((line, index) => (
        <View key={`${line}-${index}`} style={styles.codeRow}>
          <Text style={styles.codeNumber}>{index + 1}</Text>
          <Text style={styles.codeLine}>{line}</Text>
        </View>
      ))}
    </LinearGradient>
  );
}

function DocumentThumbnail({ title }) {
  return (
    <View style={styles.documentThumb}>
      <Text numberOfLines={1} style={styles.documentThumbTitle}>{title}</Text>
      <View style={styles.documentLineWide} />
      <View style={styles.documentLine} />
      <View style={styles.documentLineShort} />
      <View style={styles.documentLineWide} />
      <View style={styles.documentBulletRow}>
        <View style={styles.documentBullet} />
        <View style={styles.documentBulletLine} />
      </View>
      <View style={styles.documentBulletRow}>
        <View style={styles.documentBullet} />
        <View style={styles.documentBulletLineSmall} />
      </View>
    </View>
  );
}

function PostActions({ post, session, metrics = {}, onComment }) {
  const [liked, setLiked] = useState(Boolean(post?.isLiked));
  const [likesCount, setLikesCount] = useState(metrics?.likes || 0);
  const [commentsCount, setCommentsCount] = useState(metrics?.comments || 0);
  const [sharesCount, setSharesCount] = useState(metrics?.shares || 0);
  const [saved, setSaved] = useState(Boolean(post?.bookmarked));
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Animated scale for Clapping bounce animation
  const clapScaleAnim = useRef(new Animated.Value(1)).current;

  async function handleToggleClap() {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));

    // Pop / bounce spring animation for clapping
    Animated.sequence([
      Animated.timing(clapScaleAnim, { toValue: 1.5, duration: 110, useNativeDriver: true }),
      Animated.spring(clapScaleAnim, { toValue: 1, friction: 3, tension: 150, useNativeDriver: true })
    ]).start();

    if (session?.token && post?.id) {
      try {
        const res = await togglePostLike(session.token, post.id);
        if (res && typeof res.likes === "number") setLikesCount(res.likes);
        if (res && typeof res.isLiked === "boolean") setLiked(res.isLiked);
      } catch (e) {}
    }
  }

  async function handleToggleSave() {
    const nextSaved = !saved;
    setSaved(nextSaved);

    if (session?.token && post?.id) {
      try {
        await toggleSavePost(session.token, post.id);
      } catch (e) {}
    }
    Alert.alert(
      nextSaved ? "Post Saved" : "Post Removed",
      nextSaved ? "Added to your Saved Posts in Profile Settings!" : "Removed from Saved Posts."
    );
  }

  const postText = post?.content || post?.title || "Check out this post on TCM Academy!";
  const shareUrl = `https://thecodemunk.in/post/${post?.id || "p1"}`;

  async function handleNativeShare() {
    setShareModalOpen(false);
    setSharesCount((prev) => prev + 1);
    try {
      await Share.share({
        title: post?.title || "TCM Post",
        message: `${postText}\n\nJoin conversation on TCM Academy: ${shareUrl}`
      });
      if (session?.token && post?.id) {
        sharePost(session.token, post.id).catch(() => {});
      }
    } catch (e) {}
  }

  function handleShareWhatsApp() {
    setShareModalOpen(false);
    setSharesCount((prev) => prev + 1);
    const text = encodeURIComponent(`*${post?.authorName || "TCM Member"}* on TCM Academy:\n"${postText}"\n\nRead more: ${shareUrl}`);
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() => {
      Alert.alert("WhatsApp Not Installed", "Could not open WhatsApp app directly.");
    });
  }

  function handleShareFacebook() {
    setShareModalOpen(false);
    setSharesCount((prev) => prev + 1);
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    Linking.openURL(fbUrl).catch(() => {});
  }

  function handleCopyLink() {
    setShareModalOpen(false);
    Alert.alert("Link Copied", "Post URL copied to clipboard.");
  }

  return (
    <View style={styles.actionsRow}>
      {/* 1. Clapping Hands Button with Micro Animation */}
      <Pressable onPress={handleToggleClap} style={styles.metric}>
        <Animated.View style={{ transform: [{ scale: clapScaleAnim }] }}>
          <MaterialCommunityIcons
            name={liked ? "hand-clap" : "hand-clap"}
            size={24}
            color={liked ? "#5B3CF5" : "#64748B"}
          />
        </Animated.View>
        <Text style={[styles.metricText, liked && { color: "#5B3CF5", fontFamily: fonts.bold }]}>{likesCount} Claps</Text>
      </Pressable>

      {/* 2. Comments Button */}
      <Pressable onPress={onComment} style={styles.metric}>
        <Feather name="message-circle" size={22} color="#64748B" />
        <Text style={styles.metricText}>{commentsCount}</Text>
      </Pressable>

      {/* 3. Social Share Button */}
      <Pressable onPress={() => setShareModalOpen(true)} style={styles.metric}>
        <Feather name="send" size={22} color="#64748B" />
        <Text style={styles.metricText}>{sharesCount}</Text>
      </Pressable>

      {/* 4. Save Bookmark Button (Filled Icon when Saved) */}
      <Pressable onPress={handleToggleSave} style={styles.saveAction}>
        <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={23} color={saved ? "#5B3CF5" : "#64748B"} />
      </Pressable>

      {/* Social Share Sheet Modal (Clean Vector Icons, No Emojis) */}
      <Modal visible={shareModalOpen} transparent animationType="fade" onRequestClose={() => setShareModalOpen(false)}>
        <Pressable onPress={() => setShareModalOpen(false)} style={styles.modalOverlay}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalContent}>
            <View style={styles.sheetHandle} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#0F172A" }}>Share Post</Text>
              <Pressable onPress={() => setShareModalOpen(false)}>
                <Feather name="x" size={18} color="#64748B" />
              </Pressable>
            </View>
            <Text style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>Share this post across social media networks</Text>

            <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 12 }}>
              <TouchableOpacity onPress={handleShareWhatsApp} activeOpacity={0.8} style={{ alignItems: "center", gap: 6 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#25D366", alignItems: "center", justifyContent: "center" }}>
                  <FontAwesome name="whatsapp" size={24} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 11, fontFamily: fonts.medium, color: "#0F172A" }}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleShareFacebook} activeOpacity={0.8} style={{ alignItems: "center", gap: 6 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#1877F2", alignItems: "center", justifyContent: "center" }}>
                  <FontAwesome name="facebook" size={22} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 11, fontFamily: fonts.medium, color: "#0F172A" }}>Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCopyLink} activeOpacity={0.8} style={{ alignItems: "center", gap: 6 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#64748B", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="copy" size={20} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 11, fontFamily: fonts.medium, color: "#0F172A" }}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleNativeShare} activeOpacity={0.8} style={{ alignItems: "center", gap: 6 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#5B3CF5", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="share-2" size={20} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 11, fontFamily: fonts.medium, color: "#0F172A" }}>More</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setShareModalOpen(false)} style={{ marginTop: 12, backgroundColor: "#F1F5F9", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: "#64748B" }}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MediaPreviewModal({ item, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    setDownloading(false);
    setDownloaded(false);

    if (item?.startDownload) {
      handleDownload(item);
    }
  }, [item]);

  async function handleDownload(target = item) {
    if (!target) return;

    setDownloading(true);
    try {
      if (target.imageUrl) {
        await Image.prefetch(target.imageUrl);
      }
      setDownloaded(true);
    } catch (error) {
      Alert.alert("Download failed", "Could not download document preview.");
    } finally {
      setDownloading(false);
    }
  }

  if (!item) return null;

  const isDocument = item.type === "document";

  return (
    <Modal animationType="slide" visible={Boolean(item)} onRequestClose={onClose}>
      {isDocument ? (
        <SafeAreaView style={styles.documentViewer}>
          <View style={styles.viewerHeader}>
            <View style={styles.viewerFileIcon}>
              <MaterialCommunityIcons name="file-pdf-box" size={27} color="#FF465F" />
            </View>
            <View style={styles.previewTitleWrap}>
              <Text numberOfLines={1} style={styles.previewTitle}>{item.title}</Text>
              <Text numberOfLines={1} style={styles.previewSub}>
                {item.fileSize || "PDF"}  |  {item.authorName || "TCM"}
              </Text>
            </View>
            <Pressable hitSlop={10} onPress={onClose} style={styles.previewClose}>
              <Feather name="x" size={23} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.documentToolbar}>
            <View style={styles.documentPreviewPill}>
              <Feather name="eye" size={16} color={colors.primary} />
              <Text style={styles.documentPreviewText}>In-app preview</Text>
            </View>
            <Pressable onPress={() => handleDownload(item)} style={({ pressed }) => [styles.documentButton, pressed && styles.pressed]}>
              {downloading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Feather name={downloaded ? "check" : "download"} size={18} color="#FFFFFF" />}
              <Text style={styles.documentButtonText}>{downloaded ? "Downloaded" : "Download"}</Text>
            </Pressable>
          </View>

          <View style={styles.documentCanvas}>
            <View style={styles.documentPage}>
              {item.imageUrl ? (
                <Image resizeMode="contain" source={{ uri: item.imageUrl }} style={styles.previewImage} />
              ) : (
                <View style={styles.previewEmpty}>
                  <View style={styles.previewFileCard}>
                    <View style={styles.previewFileIcon}>
                      <MaterialCommunityIcons name="file-document-outline" size={44} color={colors.primary} />
                    </View>
                    <Text numberOfLines={2} style={styles.previewFileName}>{item.title}</Text>
                    <Text numberOfLines={1} style={styles.previewEmptyText}>
                      {item.fileSize || "Document"} {item.mimeType ? `| ${item.mimeType}` : ""}
                    </Text>
                    <Text style={styles.previewFileHint}>Preview ready inside TCM. Use Download to save this file.</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      ) : (
        <SafeAreaView style={styles.imageViewer}>
          <View style={styles.imagePreviewStage}>
            <Image resizeMode="contain" source={{ uri: item.imageUrl }} style={styles.fullPreviewImage} />
          </View>
          <View style={styles.imageCaption}>
            <View style={styles.imageCaptionCopy}>
              <Text numberOfLines={1} style={styles.imageCaptionTitle}>{item.title}</Text>
              <Text numberOfLines={1} style={styles.imageCaptionSub}>{item.subtitle}</Text>
            </View>
            <Pressable hitSlop={10} onPress={onClose} style={styles.imageCloseButton}>
              <Feather name="x" size={23} color="#FFFFFF" />
            </Pressable>
          </View>
        </SafeAreaView>
      )}
    </Modal>
  );
}

function renderFormattedCommentText(text) {
  if (!text) return null;
  const regex = /(@[A-Za-z0-9_.\-]+)/g;
  const parts = text.split(regex);

  return (
    <Text style={styles.commentText}>
      {parts.map((part, index) => {
        if (part.match(regex)) {
          return (
            <Text key={index} style={{ color: "#3897F0", fontFamily: fonts.bold }}>
              {part}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
}

function CommentsBottomSheet({ session, post, onClose, onSelectUser }) {
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    setCommentText("");
    setReplyingTo(null);
    if (post?.id) {
      loadComments();
    }
  }, [post?.id]);

  async function loadComments() {
    setLoadingComments(true);
    try {
      const res = await getPostComments(session?.token, post.id);
      if (res?.comments) {
        setComments(res.comments);
      }
    } catch (e) {
      // quiet catch
    } finally {
      setLoadingComments(false);
    }
  }

  function handleReplyComment(comment) {
    setReplyingTo(comment);
    const authorName = comment.name || comment.userName || "Learner";
    setCommentText(`@${authorName} `);
  }

  async function handleToggleCommentLike(commentId) {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId || c._id === commentId) {
          const isLikedNow = !c.isLiked;
          return {
            ...c,
            isLiked: isLikedNow,
            likes: Math.max(0, (c.likes || 0) + (isLikedNow ? 1 : -1))
          };
        }
        return c;
      })
    );

    if (session?.token && post?.id) {
      try {
        await toggleCommentLike(session.token, post.id, commentId);
      } catch (e) {}
    }
  }

  function handleCommentUserClick(comment) {
    onClose();
    if (onSelectUser) {
      onSelectUser({
        id: comment.authorId || comment.userId || `u-${comment.name}`,
        name: comment.name || comment.userName || "Learner",
        avatarUrl: comment.avatarUrl
      });
    }
  }

  async function submitComment() {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    const textToSend = commentText.trim();
    const currentReplyTarget = replyingTo;
    setCommentText("");
    setReplyingTo(null);

    try {
      if (session?.token && post?.id) {
        const parentId = currentReplyTarget ? (currentReplyTarget.id || currentReplyTarget._id) : undefined;
        const res = await addPostComment(session.token, post.id, textToSend, parentId);

        if (currentReplyTarget) {
          const newReply = res?.comment || {
            id: `r-${Date.now()}`,
            name: session?.user?.name || "You",
            avatarUrl: session?.user?.avatarUrl,
            text: textToSend,
            time: "Just now",
            likes: 0
          };
          setComments((prev) =>
            prev.map((c) => {
              if (c.id === currentReplyTarget.id || c._id === currentReplyTarget.id) {
                return {
                  ...c,
                  replies: [...(c.replies || []), newReply]
                };
              }
              return c;
            })
          );
        } else if (res?.comment) {
          setComments((prev) => [res.comment, ...prev]);
        }
      } else if (currentReplyTarget) {
        const newReply = {
          id: `r-${Date.now()}`,
          name: session?.user?.name || "You",
          avatarUrl: session?.user?.avatarUrl,
          text: textToSend,
          time: "Just now",
          likes: 0
        };
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === currentReplyTarget.id || c._id === currentReplyTarget.id) {
              return {
                ...c,
                replies: [...(c.replies || []), newReply]
              };
            }
            return c;
          })
        );
      } else {
        setComments((prev) => [
          { id: `c-${Date.now()}`, name: "You", text: textToSend, time: "Just now", likes: 0, replies: [] },
          ...prev
        ]);
      }
    } catch (err) {
      Alert.alert("Comment Error", "Could not submit comment.");
    } finally {
      setSubmittingComment(false);
    }
  }

  if (!post) return null;

  return (
    <Modal animationType="slide" transparent visible={Boolean(post)} onRequestClose={onClose}>
      <View style={styles.commentSheetShell}>
        <Pressable style={styles.commentBackdrop} onPress={onClose} />
        <View style={styles.commentSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>Comments</Text>
            <Text style={styles.commentCount}>{comments.length}</Text>
            <Pressable hitSlop={10} onPress={onClose} style={styles.commentClose}>
              <Feather name="x" size={21} color={colors.ink} />
            </Pressable>
          </View>

          {loadingComments ? (
            <ActivityIndicator size="medium" color="#5B3CF5" style={{ marginVertical: 30 }} />
          ) : comments.length === 0 ? (
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40, paddingHorizontal: 20 }}>
              <Feather name="message-circle" size={36} color="#B5B3C8" style={{ marginBottom: 8 }} />
              <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: "#181725" }}>No comments yet</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#7C7C9A", textAlign: "center", marginTop: 2 }}>
                Be the first to share your thoughts on this post!
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.commentList} showsVerticalScrollIndicator={false}>
              {comments.map((comment) => {
                const commentId = comment.id || comment._id;
                const authorName = comment.name || comment.userName || "Learner";
                return (
                  <View key={commentId} style={{ marginBottom: 12 }}>
                    <View style={styles.commentRow}>
                      <TouchableOpacity onPress={() => handleCommentUserClick(comment)} activeOpacity={0.8}>
                        <Avatar name={authorName} uri={comment.avatarUrl} size={36} />
                      </TouchableOpacity>
                      <View style={styles.commentBody}>
                        <View style={styles.commentBubble}>
                          <TouchableOpacity onPress={() => handleCommentUserClick(comment)} activeOpacity={0.8}>
                            <Text numberOfLines={1} style={styles.commentName}>{authorName}</Text>
                          </TouchableOpacity>
                          {renderFormattedCommentText(comment.text)}
                        </View>
                        <View style={styles.commentActions}>
                          <Text style={styles.commentActionText}>{comment.time || "Just now"}</Text>
                          <Text style={styles.commentActionText}>{comment.likes || 0} likes</Text>
                          <TouchableOpacity onPress={() => handleReplyComment(comment)}>
                            <Text style={[styles.commentActionText, { color: "#3897F0", fontFamily: fonts.semiBold }]}>Reply</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Pressable hitSlop={8} onPress={() => handleToggleCommentLike(commentId)} style={styles.commentLike}>
                        <Ionicons name={comment.isLiked ? "heart" : "heart-outline"} size={16} color={comment.isLiked ? "#FF304D" : "#68677D"} />
                      </Pressable>
                    </View>

                    {/* Instagram-Style Nested Replies */}
                    {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                      <View style={{ paddingLeft: 42, borderLeftWidth: 1.5, borderLeftColor: "#E2E8F0", marginLeft: 18, marginTop: 4, gap: 8 }}>
                        {comment.replies.map((reply) => (
                          <View key={reply.id} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                            <TouchableOpacity onPress={() => handleCommentUserClick(reply)} activeOpacity={0.8}>
                              <Avatar name={reply.name} uri={reply.avatarUrl} size={26} />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                              <View style={styles.commentBubble}>
                                <TouchableOpacity onPress={() => handleCommentUserClick(reply)} activeOpacity={0.8}>
                                  <Text numberOfLines={1} style={styles.commentName}>{reply.name}</Text>
                                </TouchableOpacity>
                                {renderFormattedCommentText(reply.text)}
                              </View>
                              <View style={styles.commentActions}>
                                <Text style={styles.commentActionText}>{reply.time || "Just now"}</Text>
                                <TouchableOpacity onPress={() => handleReplyComment(comment)}>
                                  <Text style={[styles.commentActionText, { color: "#3897F0", fontFamily: fonts.semiBold }]}>Reply</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}

          {replyingTo && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#EFF6FF", paddingHorizontal: 12, paddingVertical: 6, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderWidth: 1, borderColor: "#BFDBFE" }}>
              <Text style={{ fontSize: 11, color: "#3897F0", fontFamily: fonts.semiBold }}>
                Replying to @{replyingTo.name || replyingTo.userName || "Learner"}
              </Text>
              <Pressable onPress={() => { setReplyingTo(null); setCommentText(""); }}>
                <Feather name="x" size={14} color="#3897F0" />
              </Pressable>
            </View>
          )}

          <View style={styles.commentInputRow}>
            <Avatar name="You" size={34} />
            <TextInput
              placeholder="Add a comment..."
              placeholderTextColor="#8A879F"
              style={styles.commentInput}
              value={commentText}
              onChangeText={setCommentText}
            />
            <Pressable disabled={!commentText.trim() || submittingComment} onPress={submitComment} style={[styles.commentSend, (!commentText.trim() || submittingComment) && styles.commentSendDisabled]}>
              {submittingComment ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Feather name="send" size={17} color="#FFFFFF" />}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function LearnDashboard({ learn, user, onSelectUser }) {
  if (!learn) return <LoadingState />;
  const hero = learn.hero || {};
  const progressValue = Math.max(0, Math.min(100, hero.progressValue || user.progress || 0));

  return (
    <View style={styles.learnWrap}>
      <LinearGradient colors={["#5B3CF5", "#20165A"]} style={styles.learnHero}>
        <View style={styles.learnHeroCopy}>
          <Text style={styles.learnWelcome}>{hero.greeting}</Text>
          <Text numberOfLines={1} style={styles.learnName}>{hero.name || user.name}</Text>
          <Text style={styles.learnSub}>{hero.subtitle}</Text>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>{hero.progressLabel}</Text>
            <Text style={styles.progressLabel}>{progressValue}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressValue}%` }]} />
          </View>
        </View>
        <View style={styles.heroPerson}>
          <View style={styles.heroHead} />
          <View style={styles.heroBody} />
          <View style={styles.heroLaptop} />
        </View>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Explore TCM</Text>
      <View style={styles.exploreGrid}>
        {(learn.explore || []).map((item) => (
          <Pressable key={item.id} style={styles.exploreCard}>
            <View style={[styles.exploreIcon, { backgroundColor: item.backgroundColor }]}>
              <MaterialCommunityIcons name={item.icon} size={26} color={item.color} />
            </View>
            <Text style={styles.exploreTitle}>{item.title}</Text>
            <Text style={styles.exploreSub}>{item.subtitle}</Text>
            <Feather name="chevron-right" size={18} color={colors.ink} style={styles.exploreArrow} />
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Top Mentors</Text>
        <Text style={styles.viewAll}>View All</Text>
      </View>
      <ScrollView horizontal contentContainerStyle={styles.mentorRow} showsHorizontalScrollIndicator={false}>
        {(learn.mentors || []).map((mentor) => (
          <Pressable key={mentor.id} onPress={() => onSelectUser && onSelectUser(mentor)} style={styles.mentorCard}>
            <Avatar name={mentor.name} uri={mentor.avatarUrl} size={54} />
            <Text numberOfLines={1} style={styles.mentorName}>{mentor.name}</Text>
            <Text numberOfLines={1} style={styles.mentorTitle}>{mentor.title}</Text>
            <View style={styles.ratingRow}>
              <FontAwesome name="star" size={13} color="#FFB11A" />
              <Text style={styles.ratingText}>{mentor.rating} ({mentor.learners}+)</Text>
            </View>
            <Pressable onPress={() => Alert.alert("Book Session", `Session request sent to ${mentor.name}.`)} style={styles.bookButton}>
              <Text style={styles.bookText}>Book Session</Text>
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable onPress={() => Alert.alert("Help Request", "Support team will pick this up from your account.")} style={styles.helpCard}>
        <View style={styles.helpIcon}>
          <Feather name="message-circle" size={21} color="#FFFFFF" />
        </View>
        <View style={styles.helpCopy}>
          <Text style={styles.helpTitle}>{learn.support?.title}</Text>
          <Text style={styles.helpSub}>{learn.support?.subtitle}</Text>
        </View>
        <Feather name="chevron-right" size={22} color={colors.ink} />
      </Pressable>
    </View>
  );
}

function CreatePostScreen({ config, draft, posting, user, uploadType, setUploadType, setDraft, onClose, onSubmit }) {
  const textLength = draft.text.length;
  const canSubmit = Boolean(draft.text.trim()) && !posting;
  const previewImage = draft.mediaUrl.trim();
  const hasDocumentPreview = uploadType === "document" && (draft.fileName.trim() || draft.fileSize.trim() || draft.fileUri?.trim?.() || previewImage);
  const hasMediaPreview = uploadType === "video" ? Boolean(draft.fileUri?.trim?.() || previewImage) : uploadType === "photo" && previewImage;
  const previewCount = Number(Boolean(hasMediaPreview || hasDocumentPreview));
  const selectedFrameKey = uploadType === "video" && draft.frameKey === "none" ? "portrait" : draft.frameKey || "none";
  const mediaOptions = [
    { key: "photo", icon: "image", label: "Photo", color: colors.primary },
    { key: "document", icon: "file-document-outline", label: "Document", color: "#00A86B" },
    { key: "video", icon: "play-box-outline", label: "Video", color: "#F04F7A" }
  ];
  const frameOptions = [
    { key: "none", label: "No Frame", icon: "slash" },
    { key: "original", label: "Original" },
    { key: "square", label: "1:1 Square" },
    { key: "portrait", label: "4:5 Portrait" },
    { key: "landscape", label: "16:9 Landscape" },
    { key: "polaroid", label: "Polaroid" },
    { key: "rounded", label: "Rounded" }
  ];
  const uploadLabel = uploadType === "document" ? "Upload Doc" : uploadType === "video" ? "Upload Video" : "Upload Image";
  const [framePreview, setFramePreview] = useState(null);

  async function attachSelectedMedia() {
    try {
      if (uploadType === "document") {
        const result = await DocumentPicker.getDocumentAsync({
          copyToCacheDirectory: true,
          multiple: false,
          type: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "image/*",
            "text/*"
          ]
        });

        if (result.canceled) return;

        const asset = result.assets?.[0];
        if (!asset?.uri) return;

        const isImageDocument = asset.mimeType?.startsWith("image/");
        setDraft((current) => ({
          ...current,
          fileName: asset.name || "Document",
          fileSize: formatFileSize(asset.size) || current.fileSize,
          fileUri: asset.uri,
          mimeType: asset.mimeType || "",
          mediaUrl: isImageDocument ? asset.uri : ""
        }));
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Please grant photo library permission to select media.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: uploadType === "video" ? ["videos"] : ["images"],
        quality: 0.85,
        videoMaxDuration: 30
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      let previewUri = asset.uri;

      if (uploadType === "video") {
        previewUri = "";
        try {
          const thumbnail = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 1000 });
          previewUri = thumbnail.uri || "";
        } catch (error) {
          previewUri = "";
        }
      }

      setDraft((current) => ({
        ...current,
        mediaUrl: previewUri,
        fileName: asset.fileName || current.fileName,
        fileSize: formatFileSize(asset.fileSize) || current.fileSize,
        fileUri: uploadType === "video" ? asset.uri : "",
        mimeType: asset.mimeType || ""
      }));
    } catch (error) {
      Alert.alert("Upload failed", "Could not select media. Please try again.");
    }
  }

  function removeAttachedMedia() {
    setDraft((current) => ({ ...current, mediaUrl: "", fileName: "", fileSize: "", fileUri: "", mimeType: "", frameKey: "none" }));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.createScreen}>
        <View style={styles.createHeader}>
          <Pressable hitSlop={10} onPress={onClose} style={styles.createIconButton}>
            <Feather name="x" size={28} color={colors.ink} />
          </Pressable>
          <View style={styles.createHeaderCopy}>
            <Text style={styles.createTitle}>Create Post</Text>
            <Text style={styles.createSubtitle}>Share your knowledge or updates with TCM community</Text>
          </View>
          <Pressable disabled={!canSubmit} onPress={onSubmit} style={[styles.createPublish, !canSubmit && styles.createPublishDisabled]}>
            <Text style={styles.createPublishText}>{posting ? "Posting" : "Post"}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.createScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.createComposerCard}>
            <View style={styles.createUserRow}>
              <Avatar name={user?.name} uri={user?.avatarUrl} size={58} />
              <View style={styles.createUserCopy}>
                <Text numberOfLines={1} style={styles.createUserName}>{user?.name || "TCM Learner"}</Text>
                <View style={styles.audiencePill}>
                  <Feather name="globe" size={13} color={colors.primary} />
                  <Text style={styles.audienceText}>Public</Text>
                  <Feather name="chevron-down" size={13} color={colors.primary} />
                </View>
              </View>
            </View>

            <View style={styles.createTextBox}>
              <TextInput
                multiline
                maxLength={2200}
                placeholder="What's on your mind?"
                placeholderTextColor="#9695AA"
                style={styles.createTextArea}
                value={draft.text}
                onChangeText={(text) => setDraft((current) => ({ ...current, text }))}
              />
              <Text style={styles.charCount}>{textLength}/2200</Text>
            </View>

            <View style={styles.mediaModeRow}>
              {mediaOptions.map((item) => {
                const active = uploadType === item.key;
                return (
                  <Pressable key={item.key} onPress={() => setUploadType(item.key)} style={[styles.mediaModeButton, active && styles.mediaModeActive]}>
                    <View style={[styles.mediaModeIcon, { backgroundColor: `${item.color}18` }]}>
                      <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
                    </View>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.mediaModeText, active && styles.mediaModeTextActive]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.createPanel}>
            <View style={styles.panelTitleRow}>
              <Text style={styles.createSectionTitle}>Media Preview</Text>
              <Text style={styles.panelCounter}>{previewCount}/10</Text>
            </View>
            <ScrollView horizontal contentContainerStyle={styles.previewPickerRow} showsHorizontalScrollIndicator={false}>
              {hasMediaPreview ? (
                <CreateMediaPreview
                  imageUrl={previewImage}
                  label={uploadType === "video" ? "00:30" : "Image"}
                  onRemove={removeAttachedMedia}
                  type={uploadType === "video" ? "video" : "image"}
                  videoUri={uploadType === "video" ? draft.fileUri.trim() : ""}
                />
              ) : null}
              {hasDocumentPreview ? (
                <CreateMediaPreview
                  fileSize={draft.fileSize.trim()}
                  imageUrl={previewImage}
                  onRemove={removeAttachedMedia}
                  type="document"
                  label={draft.fileName.trim() || "Document"}
                />
              ) : null}
              <Pressable onPress={attachSelectedMedia} style={styles.addMoreCard}>
                <Feather name="plus" size={26} color={colors.primary} />
                <Text numberOfLines={2} style={styles.addMoreText}>{previewCount ? "Replace" : uploadLabel}</Text>
              </Pressable>
            </ScrollView>
          </View>

          {uploadType === "photo" || uploadType === "video" ? (
            <View style={styles.createPanel}>
              <Text style={styles.createSectionTitle}>{uploadType === "video" ? "Frame (Videos)" : "Crop & Frame (Images)"}</Text>
              {hasMediaPreview ? (
                <ScrollView horizontal contentContainerStyle={styles.frameRow} showsHorizontalScrollIndicator={false}>
                  {frameOptions.map((item) => {
                    const active = selectedFrameKey === item.key;
                    return (
                    <Pressable key={item.key} onPress={() => setFramePreview(item)} style={[styles.frameOption, active && styles.frameOptionActive]}>
                      <View style={[styles.frameThumb, item.key === "none" && styles.frameThumbNone, active && styles.frameThumbActive]}>
                        {item.icon ? (
                          <Feather name={item.icon} size={25} color={colors.primary} />
                        ) : uploadType === "video" && !previewImage ? (
                          <View style={styles.frameVideoThumb}>
                            <FontAwesome name="play" size={16} color={colors.primary} />
                          </View>
                        ) : (
                          <Image source={{ uri: previewImage }} style={styles.frameImage} />
                        )}
                      </View>
                      <Text numberOfLines={1} style={styles.frameLabel}>{item.label}</Text>
                    </Pressable>
                  );})}
                </ScrollView>
              ) : (
                <View style={styles.emptyFrameState}>
                  <Feather name={uploadType === "video" ? "video" : "image"} size={23} color={colors.primary} />
                  <Text style={styles.emptyFrameText}>{uploadType === "video" ? "Video upload karne ke baad frame options yahan dikhenge." : "Image upload karne ke baad frame options yahan dikhenge."}</Text>
                </View>
              )}
            </View>
          ) : null}

          <View style={styles.createPanel}>
            <Text style={styles.createSectionTitle}>Add Details</Text>
            <DetailInputRow icon="map-pin" label="Location" placeholder="Add location" value={draft.title} onChangeText={(title) => setDraft((current) => ({ ...current, title }))} />
            <DetailInputRow icon="hash" label="Hashtags" placeholder="Add hashtags" value={draft.tags} onChangeText={(tags) => setDraft((current) => ({ ...current, tags }))} autoCapitalize="none" />
            <DetailInputRow icon="users" label="Audience" placeholder="Everyone" value={draft.mentions} onChangeText={(mentions) => setDraft((current) => ({ ...current, mentions }))} autoCapitalize="none" />
            {uploadType === "document" ? (
              <View style={styles.documentMetaRow}>
                <TextInput
                  placeholder="File name"
                  placeholderTextColor="#86839B"
                  style={[styles.createInput, styles.inlineInput]}
                  value={draft.fileName}
                  onChangeText={(fileName) => setDraft((current) => ({ ...current, fileName }))}
                />
                <TextInput
                  placeholder="Size"
                  placeholderTextColor="#86839B"
                  style={[styles.createInput, styles.inlineInput]}
                  value={draft.fileSize}
                  onChangeText={(fileSize) => setDraft((current) => ({ ...current, fileSize }))}
                />
              </View>
            ) : null}
          </View>

          <Pressable style={styles.guidelinesCard}>
            <View style={styles.guidelineIcon}>
              <Feather name="shield" size={24} color={colors.primary} />
            </View>
            <View style={styles.guidelineCopy}>
              <Text style={styles.guidelineTitle}>Community Guidelines</Text>
              <Text style={styles.guidelineText}>Be respectful and follow TCM community guidelines.</Text>
            </View>
            <Feather name="chevron-right" size={22} color={colors.ink} />
          </Pressable>
        </ScrollView>
        <FramePreviewModal
          frame={framePreview}
          frames={frameOptions}
          imageUrl={previewImage}
          mediaType={uploadType}
          selectedKey={selectedFrameKey}
          videoUri={uploadType === "video" ? draft.fileUri.trim() : ""}
          onApply={(key) => {
            setDraft((current) => ({ ...current, frameKey: key }));
            setFramePreview(null);
          }}
          onClose={() => setFramePreview(null)}
          onSelect={setFramePreview}
        />
      </View>
    </SafeAreaView>
  );
}

function FramePreviewModal({ frame, frames, imageUrl, mediaType, selectedKey, videoUri, onApply, onClose, onSelect }) {
  if (!frame || (!imageUrl && !videoUri)) return null;
  const isVideo = mediaType === "video";

  return (
    <Modal animationType="fade" transparent visible={Boolean(frame)} onRequestClose={onClose}>
      <View style={styles.frameModalBackdrop}>
        <Pressable style={styles.frameModalDim} onPress={onClose} />
        <View style={styles.frameModalSheet}>
          <View style={styles.frameModalHeader}>
            <View>
              <Text style={styles.frameModalTitle}>Frame Preview</Text>
              <Text style={styles.frameModalSub}>Post me {isVideo ? "video" : "image"} aise dikhegi</Text>
            </View>
            <Pressable onPress={onClose} style={styles.frameModalClose}>
              <Feather name="x" size={22} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.framePreviewStage}>
            <View
              style={[
                styles.framePreviewCanvas,
                frame.key === "square" && styles.framePreviewSquare,
                frame.key === "portrait" && styles.framePreviewPortrait,
                frame.key === "landscape" && styles.framePreviewLandscape,
                frame.key === "polaroid" && styles.framePreviewPolaroid,
                frame.key === "rounded" && styles.framePreviewRounded
              ]}
            >
              {isVideo && !imageUrl ? (
                <VideoPreviewSurface videoUri={videoUri} />
              ) : (
                <Image resizeMode={frame.key === "original" || frame.key === "none" ? "contain" : "cover"} source={{ uri: imageUrl }} style={styles.framePreviewImage} />
              )}
            </View>
          </View>

          <ScrollView horizontal contentContainerStyle={styles.frameModalOptions} showsHorizontalScrollIndicator={false}>
            {frames.map((item) => {
              const active = item.key === frame.key;
              return (
                <Pressable key={item.key} onPress={() => onSelect(item)} style={[styles.frameModalOption, active && styles.frameModalOptionActive]}>
                  <Text numberOfLines={1} style={[styles.frameModalOptionText, active && styles.frameModalOptionTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable onPress={() => onApply(frame.key || selectedKey)} style={styles.frameApplyButton}>
            <Text style={styles.frameApplyText}>Apply Frame</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function CreateMediaPreview({ type, imageUrl, videoUri, label, fileSize, onRemove }) {
  return (
    <View style={styles.createPreviewCard}>
      {type === "image" ? (
        <Image source={{ uri: imageUrl }} style={styles.createPreviewImage} />
      ) : type === "document" ? (
        imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.createPreviewImage} />
        ) : (
          <View style={styles.documentUploadPreview}>
            <View style={styles.documentUploadIcon}>
              <MaterialCommunityIcons name="file-document-outline" size={28} color="#00A86B" />
            </View>
            <Text numberOfLines={2} style={styles.documentUploadName}>{label}</Text>
            {fileSize ? <Text numberOfLines={1} style={styles.documentUploadSize}>{fileSize}</Text> : null}
          </View>
        )
      ) : imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.createPreviewImage} />
      ) : (
        <VideoPreviewSurface videoUri={videoUri} />
      )}
      <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.62)"]} style={styles.createPreviewOverlay}>
        <Text numberOfLines={1} style={styles.createPreviewLabel}>{type === "document" ? "Document" : label}</Text>
        <View style={styles.cropIcon}>
          <Feather name="crop" size={16} color="#FFFFFF" />
        </View>
      </LinearGradient>
      <Pressable onPress={onRemove} style={styles.removeMediaButton}>
        <Feather name="x" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function VideoPreviewSurface({ videoUri }) {
  const player = useVideoPlayer(videoUri ? { uri: videoUri } : null, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = true;
    videoPlayer.pause();
  });

  return (
    <LinearGradient colors={["#343148", "#18162B"]} style={styles.createVideoPreview}>
      {videoUri ? <VideoView player={player} nativeControls={false} contentFit="cover" style={styles.createPreviewImage} /> : null}
      <View style={styles.videoPlayButton}>
        <FontAwesome name="play" size={14} color="#17143C" />
      </View>
    </LinearGradient>
  );
}

function DetailInputRow({ icon, label, placeholder, value, onChangeText, ...props }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Feather name={icon} size={22} color={colors.primary} />
      </View>
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.detailLabel}>{label}</Text>
      <TextInput
        multiline={false}
        numberOfLines={1}
        placeholder={placeholder}
        placeholderTextColor="#73708B"
        style={styles.detailInput}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
      <Feather name="chevron-right" size={20} color={colors.ink} />
    </View>
  );
}
function ActionDock({ open, setOpen, onAction, tabs, activeTab, setActiveTab }) {
  return (
    <View style={styles.bottomDock}>
      <View style={styles.fabRow}>
        <Pressable onPress={() => onAction("post")} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
          <Feather name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <BlurView intensity={34} tint="light" style={styles.tabs}>
        <LinearGradient colors={["rgba(255,255,255,0.68)", "rgba(255,255,255,0.36)"]} style={styles.tabsGlass}>
        {tabs.map(({ key, icon }) => {
          const active = activeTab === key;
          return (
            <Pressable key={key} onPress={() => setActiveTab(key)} style={({ pressed }) => [styles.tabItem, pressed && styles.pressed]}>
              <Feather name={icon} size={22} color={active ? colors.primary : "#68677D"} />
              <Text numberOfLines={1} style={[styles.tabLabel, active && styles.tabLabelActive]}>{key}</Text>
            </Pressable>
          );
        })}
        </LinearGradient>
      </BlurView>
    </View>
  );
}

function DrawerFeatureModal({ feature, onClose, user }) {
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveDays, setLeaveDays] = useState("1");
  const [appliedLeaves, setAppliedLeaves] = useState([
    { id: "1", type: "Casual Leave", dates: "12 Oct - 13 Oct 2026", days: "2 days", status: "Approved", reason: "Family event" },
    { id: "2", type: "Sick Leave", dates: "05 Sep 2026", days: "1 day", status: "Approved", reason: "Fever & rest" },
    { id: "3", type: "Earned Leave", dates: "20 Nov - 24 Nov 2026", days: "5 days", status: "Pending", reason: "Vacation" }
  ]);
  const [activeLeaveTab, setActiveLeaveTab] = useState("My Leaves");

  useEffect(() => {
    if (feature && ["My Leaves", "Apply for Leave", "Leave Calendar", "Leave Balance", "Leave Requests"].includes(feature)) {
      setActiveLeaveTab(feature);
    }
  }, [feature]);

  if (!feature) return null;

  const isLeaveFeature = ["My Leaves", "Apply for Leave", "Leave Calendar", "Leave Balance", "Leave Requests"].includes(feature);

  function handleApplyLeave() {
    if (!leaveReason.trim()) {
      Alert.alert("Apply Leave", "Please enter a reason for leave.");
      return;
    }
    const newLeave = {
      id: String(Date.now()),
      type: "Casual Leave",
      dates: "Upcoming Date",
      days: `${leaveDays || 1} day(s)`,
      status: "Pending",
      reason: leaveReason
    };
    setAppliedLeaves([newLeave, ...appliedLeaves]);
    setLeaveReason("");
    Alert.alert("Success", "Leave application submitted successfully.");
    setActiveLeaveTab("My Leaves");
  }

  return (
    <Modal animationType="slide" visible={Boolean(feature)} onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafeArea}>
        <View style={styles.modalHeader}>
          <Pressable hitSlop={10} onPress={onClose} style={styles.modalCloseBtn}>
            <Feather name="arrow-left" size={22} color="#18172B" />
          </Pressable>
          <Text style={styles.modalTitleText}>{feature}</Text>
          <Pressable hitSlop={10} onPress={onClose} style={styles.modalCloseBtn}>
            <Feather name="x" size={22} color="#18172B" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
          {isLeaveFeature ? (
            <View style={styles.featureContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leaveNavRow}>
                {["My Leaves", "Apply for Leave", "Leave Calendar", "Leave Balance", "Leave Requests"].map((tab) => (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveLeaveTab(tab)}
                    style={[styles.leaveNavTab, activeLeaveTab === tab && styles.leaveNavTabActive]}
                  >
                    <Text style={[styles.leaveNavText, activeLeaveTab === tab && styles.leaveNavTextActive]}>{tab}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {activeLeaveTab === "Leave Balance" || activeLeaveTab === "My Leaves" ? (
                <View style={styles.leaveMetricsGrid}>
                  <View style={[styles.leaveCard, { borderLeftColor: "#7D45EA" }]}>
                    <Text style={styles.leaveCardVal}>8</Text>
                    <Text style={styles.leaveCardLbl}>Casual Leaves</Text>
                  </View>
                  <View style={[styles.leaveCard, { borderLeftColor: "#2E7D32" }]}>
                    <Text style={styles.leaveCardVal}>5</Text>
                    <Text style={styles.leaveCardLbl}>Sick Leaves</Text>
                  </View>
                  <View style={[styles.leaveCard, { borderLeftColor: "#E7A900" }]}>
                    <Text style={styles.leaveCardVal}>12</Text>
                    <Text style={styles.leaveCardLbl}>Earned Leaves</Text>
                  </View>
                </View>
              ) : null}

              {activeLeaveTab === "Apply for Leave" ? (
                <View style={styles.applyLeaveBox}>
                  <Text style={styles.formLabel}>Leave Reason / Purpose</Text>
                  <TextInput
                    placeholder="Enter reason for leave..."
                    placeholderTextColor="#8A879F"
                    value={leaveReason}
                    onChangeText={setLeaveReason}
                    style={styles.formInput}
                    multiline
                  />
                  <Text style={styles.formLabel}>Number of Days</Text>
                  <TextInput
                    placeholder="1"
                    placeholderTextColor="#8A879F"
                    keyboardType="number-pad"
                    value={leaveDays}
                    onChangeText={setLeaveDays}
                    style={styles.formInputSingle}
                  />
                  <Pressable onPress={handleApplyLeave} style={styles.submitLeaveBtn}>
                    <Text style={styles.submitLeaveText}>Submit Application</Text>
                  </Pressable>
                </View>
              ) : null}

              {activeLeaveTab === "My Leaves" || activeLeaveTab === "Leave Requests" ? (
                <View style={styles.leaveListSection}>
                  <Text style={styles.subSectionTitle}>Recent Applications</Text>
                  {appliedLeaves.map((item) => (
                    <View key={item.id} style={styles.leaveRecordCard}>
                      <View style={styles.leaveRecordTop}>
                        <Text style={styles.leaveRecordType}>{item.type}</Text>
                        <View style={[styles.statusBadge, item.status === "Approved" ? styles.statusApproved : styles.statusPending]}>
                          <Text style={styles.statusBadgeText}>{item.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.leaveRecordDates}>{item.dates} ({item.days})</Text>
                      <Text style={styles.leaveRecordReason}>Reason: {item.reason}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {activeLeaveTab === "Leave Calendar" ? (
                <View style={styles.calendarMockCard}>
                  <MaterialCommunityIcons name="calendar-month" size={44} color="#5B3CF5" />
                  <Text style={styles.calendarTitle}>Academic Calendar 2026</Text>
                  <Text style={styles.calendarSub}>Holidays: Independence Day (15 Aug), Diwali (1 Nov), New Year (1 Jan)</Text>
                </View>
              ) : null}
            </View>
          ) : feature === "Settings" ? (
            <View style={styles.featureContainer}>
              <View style={styles.settingsRow}>
                <View style={styles.settingsLeft}>
                  <Feather name="bell" size={20} color="#5B3CF5" />
                  <Text style={styles.settingsText}>Push Notifications</Text>
                </View>
                <Text style={styles.settingStateText}>Active</Text>
              </View>
              <View style={styles.settingsRow}>
                <View style={styles.settingsLeft}>
                  <Feather name="lock" size={20} color="#5B3CF5" />
                  <Text style={styles.settingsText}>Privacy & Security</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#8A879F" />
              </View>
              <View style={styles.settingsRow}>
                <View style={styles.settingsLeft}>
                  <Feather name="globe" size={20} color="#5B3CF5" />
                  <Text style={styles.settingsText}>App Language</Text>
                </View>
                <Text style={styles.settingStateText}>English</Text>
              </View>
            </View>
          ) : feature === "Notifications" ? (
            <View style={styles.featureContainer}>
              {[
                { id: "1", title: "New Assignment Uploaded", desc: "System Design Chapter 4 notes are ready.", time: "10m ago" },
                { id: "2", title: "Doubt Solved", desc: "Mentor Rohit Singh answered your question.", time: "1h ago" },
                { id: "3", title: "Class Reminder", desc: "Live session starts at 5:00 PM today.", time: "3h ago" }
              ].map((item) => (
                <View key={item.id} style={styles.notifCard}>
                  <View style={styles.notifIconWrap}>
                    <Feather name="bell" size={18} color="#5B3CF5" />
                  </View>
                  <View style={styles.notifCopy}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifDesc}>{item.desc}</Text>
                    <Text style={styles.notifTime}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : feature === "Payment & Billing" ? (
            <View style={styles.featureContainer}>
              <View style={styles.billingCard}>
                <Text style={styles.billingPlanTitle}>Active Plan: Premium</Text>
                <Text style={styles.billingPlanSub}>Next renewal date: Nov 15, 2026</Text>
              </View>
            </View>
          ) : feature === "Go Premium" ? (
            <View style={styles.featureContainer}>
              <LinearGradient colors={["#5B3CF5", "#3A1CC9"]} style={styles.premiumHeroCard}>
                <FontAwesome5 name="crown" size={36} color="#FFD700" />
                <Text style={styles.premiumHeroTitle}>Go Premium</Text>
                <Text style={styles.premiumHeroSub}>Unlock all premium courses, doubt solving & certificate downloads.</Text>
                <Pressable onPress={() => Alert.alert("Success", "Welcome to Premium Membership!")} style={styles.upgradeBtn}>
                  <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
                </Pressable>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.featureContainer}>
              <View style={styles.genericFeatureCard}>
                <MaterialCommunityIcons name="star-shooting" size={44} color="#5B3CF5" />
                <Text style={styles.genericTitle}>{feature}</Text>
                <Text style={styles.genericSub}>Welcome to {feature} section in TCM.</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function LoadingState() {
  return (
    <View style={styles.stateCard}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.stateText}>Loading live workspace...</Text>
    </View>
  );
}

function EmptyState({ title, text }) {
  return (
    <View style={styles.stateCard}>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateText}>{text}</Text>
    </View>
  );
}

function TabPlaceholder({ activeTab }) {
  const copy = {
    Learn: "Courses, notes and live classes will appear here.",
    Community: "Mentor posts, student stories and learning groups will appear here.",
    Doubts: "Ask doubts and track mentor replies here.",
    Profile: "Your account, progress and settings will appear here."
  };

  return (
    <View style={styles.placeholderCard}>
      <View style={styles.placeholderIcon}>
        <Feather name="layers" size={23} color={colors.primary} />
      </View>
      <Text style={styles.placeholderTitle}>{activeTab}</Text>
      <Text style={styles.placeholderText}>{copy[activeTab]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#FFFFFF",
    flex: 1
  },
  appShell: {
    flex: 1
  },
  scroll: {
    alignItems: "center",
    paddingBottom: 4
  },
  page: {
    alignSelf: "center",
    paddingHorizontal: 2
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 18,
    paddingTop: 8
  },
  brandRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minWidth: 0
  },
  menuButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    marginRight: 13,
    width: 34
  },
  brandWrap: {
    flexShrink: 1,
    minWidth: 0
  },
  brand: {
    color: colors.primaryDark,
    fontFamily: fonts.extraBold,
    fontSize: 30,
    letterSpacing: 0,
    lineHeight: 33
  },
  brandSub: {
    color: "#4C496D",
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9
  },
  headerWalletPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F1FF",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#E5E0FF",
    ...shadow.soft
  },
  headerWalletBalance: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#5B3CF5"
  },
  headerCoinDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#D5CCFF",
    marginHorizontal: 6
  },
  headerCoinIcon: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#FFC107",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 3
  },
  headerCoinIconText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    color: "#5D4037"
  },
  headerCoinsText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#181725"
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  headerBadge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    justifyContent: "center",
    minWidth: 16,
    paddingHorizontal: 2,
    position: "absolute",
    right: 3,
    top: 2
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 8
  },
  profileRing: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: colors.primary,
    borderRadius: 21,
    borderWidth: 1.5,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 21
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E6E3F0",
    borderRadius: 9,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    height: 50,
    paddingHorizontal: 15
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginLeft: 10,
    paddingVertical: 0
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E6E3F0",
    borderRadius: 9,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    width: 50
  },
  initialAvatar: {
    alignItems: "center",
    backgroundColor: "#F1EDFF",
    justifyContent: "center"
  },
  initialText: {
    color: colors.primaryDark,
    fontFamily: fonts.bold,
    fontSize: 11
  },
  quickPanel: {
    backgroundColor: "#FBFAFF",
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    paddingVertical: 12
  },
  quickHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12
  },
  quickTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13
  },
  quickSub: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 10
  },
  quickContent: {
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10
  },
  quickItem: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    height: 40,
    paddingHorizontal: 11
  },
  quickItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  quickItemText: {
    color: colors.ink,
    fontFamily: fonts.semiBold,
    fontSize: 11
  },
  quickItemTextActive: {
    color: "#FFFFFF"
  },
  categoryContent: {
    gap: 10,
    paddingBottom: 15
  },
  categoryTab: {
    alignItems: "center",
    backgroundColor: "#F8F7FC",
    borderRadius: 8,
    height: 45,
    justifyContent: "center",
    minWidth: 80,
    paddingHorizontal: 15
  },
  categoryTabActive: {
    backgroundColor: "#F4F1FF",
    borderBottomColor: colors.primary,
    borderBottomWidth: 3
  },
  categoryText: {
    color: "#5F5D76",
    fontFamily: fonts.semiBold,
    fontSize: 13
  },
  categoryTextActive: {
    color: colors.primary
  },
  categoryDrop: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E6E3F0",
    borderRadius: 14,
    borderWidth: 1,
    height: 45,
    justifyContent: "center",
    width: 45
  },
  feed: {
    gap: 12,
    paddingBottom: 96
  },
  postCard: {
    ...shadow,
    backgroundColor: "#FFFFFF",
    borderColor: "#EEEAF7",
    borderRadius: 11,
    borderWidth: 1,
    padding: 14,
    shadowOpacity: 0.08
  },
  postHeader: {
    alignItems: "center",
    flexDirection: "row"
  },
  postAuthor: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
    paddingRight: 8
  },
  authorLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  authorName: {
    color: colors.ink,
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20
  },
  mentorBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3
  },
  mentorBadgeText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 10
  },
  authorRole: {
    color: "#53506E",
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 16,
    marginTop: 0
  },
  postTime: {
    color: "#6D6A85",
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 13,
    marginRight: 5
  },
  postMetaLine: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 6,
    marginTop: 6,
    minHeight: 22
  },
  metaDot: {
    backgroundColor: "#6D6A85",
    borderRadius: 2,
    height: 4,
    width: 4
  },
  mediaLabel: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F5F2FF",
    borderRadius: 5,
    flexDirection: "row",
    gap: 4,
    maxWidth: "58%",
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  mediaLabelText: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
    fontSize: 10,
    lineHeight: 12
  },
  postText: {
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 8,
    flexShrink: 1
  },
  readMoreButton: {
    alignSelf: "flex-start",
    marginTop: 3
  },
  readMoreText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 12
  },
  videoMedia: {
    alignSelf: "stretch",
    aspectRatio: 0.8,
    backgroundColor: "#121022",
    borderRadius: 14,
    marginTop: 14,
    overflow: "hidden",
    width: "100%"
  },
  videoMediaSquare: {
    aspectRatio: 1
  },
  videoMediaLandscape: {
    aspectRatio: 1.78
  },
  videoMediaPolaroid: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
    borderBottomWidth: 18,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6
  },
  videoMediaRounded: {
    borderRadius: 24
  },
  videoThumbImage: {
    height: "100%",
    width: "100%"
  },
  videoPlayerView: {
    height: "100%",
    width: "100%"
  },
  videoPosterImage: {
    bottom: 0,
    height: "100%",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "100%"
  },
  videoShade: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  videoTapLayer: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1
  },
  videoCopy: {
    bottom: 13,
    left: 14,
    position: "absolute",
    right: 78,
    zIndex: 2
  },
  videoTitle: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 19
  },
  videoSmall: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 3
  },
  playCircle: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.72)",
    borderRadius: 28,
    borderWidth: 1.5,
    height: 56,
    justifyContent: "center",
    left: "50%",
    marginLeft: -28,
    marginTop: -28,
    position: "absolute",
    top: "50%",
    width: 56,
    zIndex: 3
  },
  videoPerson: {
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "flex-end",
    width: "33%",
    zIndex: 1
  },
  personShoulders: {
    backgroundColor: "#0D0D12",
    borderTopLeftRadius: 58,
    borderTopRightRadius: 58,
    bottom: -26,
    height: 52,
    position: "absolute",
    width: 104,
    zIndex: -1
  },
  durationBadge: {
    backgroundColor: "rgba(0,0,0,0.62)",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  durationText: {
    color: "#FFFFFF",
    fontFamily: fonts.medium,
    fontSize: 10
  },
  videoControlRow: {
    alignItems: "center",
    bottom: 13,
    flexDirection: "row",
    gap: 8,
    position: "absolute",
    right: 13,
    zIndex: 4
  },
  videoMiniControl: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  notesMedia: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 10,
    height: 132,
    marginTop: 12
  },
  notesHeroPreview: {
    backgroundColor: "#FFFDF7",
    borderColor: "#E9E3D4",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1.08,
    overflow: "hidden"
  },
  notesPreviewImage: {
    height: "100%",
    width: "100%"
  },
  notesPreviewButton: {
    backgroundColor: "#FFFDF7",
    borderColor: "#E9E3D4",
    borderRadius: 8,
    borderWidth: 1,
    flex: 0.88,
    overflow: "hidden"
  },
  documentThumb: {
    backgroundColor: "#FFFDF7",
    flex: 1,
    paddingHorizontal: 7,
    paddingVertical: 6
  },
  documentThumbTitle: {
    color: colors.primaryDark,
    fontFamily: fonts.bold,
    fontSize: 6,
    lineHeight: 8,
    marginBottom: 5,
    textTransform: "uppercase"
  },
  documentLineWide: {
    backgroundColor: "#A9B7D0",
    borderRadius: 2,
    height: 3,
    marginBottom: 4,
    width: "82%"
  },
  documentLine: {
    backgroundColor: "#D9A25C",
    borderRadius: 2,
    height: 3,
    marginBottom: 4,
    width: "68%"
  },
  documentLineShort: {
    backgroundColor: "#C9C3DD",
    borderRadius: 2,
    height: 3,
    marginBottom: 6,
    width: "54%"
  },
  documentBulletRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 4
  },
  documentBullet: {
    backgroundColor: "#FF6F61",
    borderRadius: 3,
    height: 5,
    marginRight: 5,
    width: 5
  },
  documentBulletLine: {
    backgroundColor: "#6AA6C9",
    borderRadius: 2,
    height: 4,
    width: "65%"
  },
  documentBulletLineSmall: {
    backgroundColor: "#95C47A",
    borderRadius: 2,
    height: 4,
    width: "48%"
  },
  pdfCard: {
    alignItems: "center",
    backgroundColor: "#FCFBFF",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1.3,
    flexDirection: "row",
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  notesSide: {
    flex: 1.3,
    gap: 8,
    minWidth: 0
  },
  notesThumbRow: {
    flex: 1,
    flexDirection: "row",
    gap: 6
  },
  notesMiniThumb: {
    backgroundColor: "#FFFDF7",
    borderColor: "#E9E3D4",
    borderRadius: 7,
    borderWidth: 1,
    flex: 1,
    overflow: "hidden"
  },
  notesMoreThumb: {
    backgroundColor: "#111111",
    borderRadius: 7,
    flex: 1,
    overflow: "hidden"
  },
  notesMoreOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.58)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  notesMoreText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 18
  },
  pdfIconWrap: {
    alignItems: "center",
    backgroundColor: "#FFF0F1",
    borderRadius: 9,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  downloadMiniButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  pdfCopy: {
    flex: 1,
    marginLeft: 9,
    minWidth: 0
  },
  pdfTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14
  },
  pdfSize: {
    color: "#5F5D76",
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 13,
    marginTop: 4
  },
  pdfHint: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
    fontSize: 9,
    marginTop: 4
  },
  carouselMedia: {
    marginTop: 14,
    marginRight: -16
  },
  carouselContent: {
    gap: 12,
    paddingRight: 16
  },
  carouselSlide: {
    backgroundColor: "#F5F4FA",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 136,
    overflow: "hidden"
  },
  carouselImage: {
    height: "100%",
    width: 174
  },
  carouselOverlay: {
    bottom: 0,
    left: 0,
    padding: 10,
    position: "absolute",
    right: 0
  },
  showcaseMedia: {
    borderRadius: 9,
    marginTop: 16,
    minHeight: 138,
    overflow: "hidden"
  },
  showcaseImage: {
    height: 138,
    opacity: 0.42,
    width: "100%"
  },
  showcaseOverlay: {
    bottom: 22,
    left: 34,
    position: "absolute"
  },
  showcaseTitle: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 15
  },
  showcaseSub: {
    color: "#9F88FF",
    fontFamily: fonts.medium,
    fontSize: 9,
    lineHeight: 12,
    marginTop: 3
  },
  codeMedia: {
    borderRadius: 9,
    marginTop: 16,
    minHeight: 102,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  codeCopy: {
    position: "absolute",
    right: 13,
    top: 13,
    zIndex: 2
  },
  codeRow: {
    alignItems: "center",
    flexDirection: "row"
  },
  codeNumber: {
    color: "#7D8194",
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 21,
    width: 24
  },
  codeLine: {
    color: "#F4F6FB",
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 21
  },
  roadmapMedia: {
    alignItems: "center",
    borderRadius: 9,
    marginTop: 12,
    minHeight: 118,
    overflow: "hidden",
    padding: 14
  },
  roadmapTitle: {
    color: "#111111",
    fontFamily: fonts.extraBold,
    fontSize: 15,
    textAlign: "center"
  },
  roadmapSteps: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 16
  },
  roadmapStep: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.lavenderLine,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  roadmapStepText: {
    color: colors.primaryDark,
    fontFamily: fonts.bold,
    fontSize: 10
  },
  actionsRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 12
  },
  metric: {
    alignItems: "center",
    flexDirection: "row",
    marginRight: 24,
    minHeight: 34
  },
  metricText: {
    color: colors.ink,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    marginLeft: 7
  },
  saveAction: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
    minHeight: 36,
    minWidth: 36
  },
  documentViewer: {
    backgroundColor: "#F6F5FB",
    flex: 1
  },
  imageViewer: {
    backgroundColor: "#05050D",
    flex: 1
  },
  viewerHeader: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 64,
    paddingHorizontal: 14
  },
  viewerFileIcon: {
    alignItems: "center",
    backgroundColor: "#FFF0F1",
    borderRadius: 10,
    height: 42,
    justifyContent: "center",
    marginRight: 11,
    width: 42
  },
  previewTitleWrap: {
    flex: 1,
    minWidth: 0
  },
  previewTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 21
  },
  previewSub: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1
  },
  previewClose: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    marginLeft: 10,
    width: 38
  },
  documentToolbar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  documentCanvas: {
    flex: 1,
    paddingBottom: 18,
    paddingHorizontal: 14
  },
  documentPage: {
    ...shadow,
    backgroundColor: "#FFFFFF",
    borderColor: "#E9E6F2",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    overflow: "hidden"
  },
  previewImage: {
    height: "100%",
    width: "100%"
  },
  fullPreviewImage: {
    height: "100%",
    width: "100%"
  },
  imagePreviewStage: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  imageViewerHeader: {
    alignItems: "flex-end",
    minHeight: 54,
    paddingHorizontal: 14,
    paddingTop: 8
  },
  imageCloseButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  imageCaption: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14
  },
  imageCaptionCopy: {
    flex: 1,
    minWidth: 0
  },
  imageCaptionTitle: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 15
  },
  imageCaptionSub: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 3
  },
  previewEmpty: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  },
  previewFileCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#ECE8F4",
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 280,
    paddingHorizontal: 20,
    paddingVertical: 22
  },
  previewFileIcon: {
    alignItems: "center",
    backgroundColor: "#F1EDFF",
    borderRadius: 20,
    height: 68,
    justifyContent: "center",
    marginBottom: 14,
    width: 68
  },
  previewFileName: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center"
  },
  previewEmptyText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
    textAlign: "center"
  },
  previewFileHint: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 14,
    textAlign: "center"
  },
  documentButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 9,
    flexDirection: "row",
    gap: 8,
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 15
  },
  documentButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 12
  },
  documentPreviewPill: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 9,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    height: 44,
    justifyContent: "center"
  },
  documentPreviewText: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
    fontSize: 12
  },
  commentSheetShell: {
    flex: 1,
    justifyContent: "flex-end"
  },
  commentBackdrop: {
    backgroundColor: "rgba(8,7,24,0.42)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  commentSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "78%",
    minHeight: "58%",
    overflow: "hidden",
    paddingTop: 8
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: "#D8D5E3",
    borderRadius: 3,
    height: 5,
    marginBottom: 10,
    width: 44
  },
  commentHeader: {
    alignItems: "center",
    borderBottomColor: "#F0EEF7",
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 48,
    paddingHorizontal: 16
  },
  commentTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 16
  },
  commentCount: {
    color: colors.muted,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    marginLeft: 8
  },
  commentClose: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    marginLeft: "auto",
    width: 36
  },
  commentList: {
    padding: 16,
    paddingBottom: 10
  },
  commentRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginBottom: 14
  },
  commentBody: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0
  },
  commentBubble: {
    backgroundColor: "#F7F6FB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  commentName: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12
  },
  commentText: {
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3
  },
  commentActions: {
    flexDirection: "row",
    gap: 14,
    marginTop: 6,
    paddingLeft: 4
  },
  commentActionText: {
    color: colors.muted,
    fontFamily: fonts.semiBold,
    fontSize: 10
  },
  commentLike: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    marginLeft: 8,
    width: 28
  },
  commentInputRow: {
    alignItems: "center",
    borderTopColor: "#F0EEF7",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12
  },
  commentInput: {
    backgroundColor: "#F7F6FB",
    borderRadius: 999,
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    height: 42,
    paddingHorizontal: 14
  },
  commentSend: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  commentSendDisabled: {
    opacity: 0.4
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 15
  },
  tag: {
    backgroundColor: "#F6F3FF",
    borderRadius: 5,
    color: colors.primary,
    fontFamily: fonts.medium,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  learnWrap: {
    paddingBottom: 8
  },
  learnHero: {
    borderRadius: 14,
    flexDirection: "row",
    minHeight: 156,
    overflow: "hidden",
    padding: 18
  },
  learnHeroCopy: {
    flex: 1,
    justifyContent: "center",
    zIndex: 2
  },
  learnWelcome: {
    color: "#EEEAFE",
    fontFamily: fonts.regular,
    fontSize: 12
  },
  learnName: {
    color: "#FFFFFF",
    fontFamily: fonts.extraBold,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 2
  },
  learnSub: {
    color: "#F8F6FF",
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 4
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
    maxWidth: 220
  },
  progressLabel: {
    color: "#FFFFFF",
    fontFamily: fonts.semiBold,
    fontSize: 11
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.28)",
    borderRadius: 6,
    height: 9,
    marginTop: 8,
    maxWidth: 220,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: "#8F7AFF",
    borderRadius: 6,
    height: "100%"
  },
  heroPerson: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "flex-end",
    position: "absolute",
    right: 18,
    width: 132
  },
  heroHead: {
    backgroundColor: "#F2B68F",
    borderRadius: 26,
    height: 52,
    marginBottom: -4,
    width: 52,
    zIndex: 2
  },
  heroBody: {
    backgroundColor: "#6A4AE8",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: 84,
    width: 92
  },
  heroLaptop: {
    backgroundColor: "rgba(255,255,255,0.34)",
    borderRadius: 8,
    bottom: 18,
    height: 54,
    position: "absolute",
    right: 32,
    transform: [{ rotate: "5deg" }],
    width: 86
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    marginTop: 22
  },
  sectionRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  viewAll: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    marginTop: 22
  },
  exploreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12
  },
  exploreCard: {
    ...shadow,
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 142,
    padding: 14,
    width: "48%"
  },
  exploreIcon: {
    alignItems: "center",
    borderRadius: 9,
    height: 50,
    justifyContent: "center",
    marginBottom: 14,
    width: 50
  },
  exploreTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 14
  },
  exploreSub: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7
  },
  exploreArrow: {
    bottom: 18,
    position: "absolute",
    right: 14
  },
  mentorRow: {
    gap: 12,
    paddingTop: 12
  },
  mentorCard: {
    ...shadow,
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    width: 150
  },
  mentorName: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
    marginTop: 10
  },
  mentorTitle: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 10,
    marginTop: 2
  },
  ratingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 12
  },
  ratingText: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 11
  },
  bookButton: {
    alignItems: "center",
    backgroundColor: "#F1EDFF",
    borderRadius: 7,
    height: 36,
    justifyContent: "center",
    marginTop: 13
  },
  bookText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 11
  },
  helpCard: {
    ...shadow,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
    minHeight: 70,
    paddingHorizontal: 16
  },
  helpIcon: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 23,
    height: 46,
    justifyContent: "center",
    width: 46
  },
  helpCopy: {
    flex: 1
  },
  helpTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 14
  },
  helpSub: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 2
  },
  createScreen: {
    backgroundColor: "#FBFAFF",
    flex: 1
  },
  createHeader: {
    alignItems: "center",
    backgroundColor: "#FBFAFF",
    flexDirection: "row",
    minHeight: 76,
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 6
  },
  createIconButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 36
  },
  createHeaderCopy: {
    flex: 1,
    marginHorizontal: 10,
    minWidth: 0
  },
  createTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 22,
    lineHeight: 27
  },
  createSubtitle: {
    color: "#66637F",
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1
  },
  createPublish: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    height: 48,
    justifyContent: "center",
    minWidth: 76,
    paddingHorizontal: 14
  },
  createPublishDisabled: {
    opacity: 0.45
  },
  createPublishText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 16
  },
  createScroll: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 40
  },
  createComposerCard: {
    ...shadow,
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14
  },
  createUserRow: {
    alignItems: "center",
    flexDirection: "row"
  },
  createUserCopy: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0
  },
  createUserName: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 23
  },
  audiencePill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F1EDFF",
    borderRadius: 9,
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  audienceText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 12
  },
  createTextBox: {
    borderColor: "#E6E3F0",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 15,
    minHeight: 142,
    padding: 13
  },
  uploadTabs: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 12
  },
  uploadTab: {
    alignItems: "center",
    backgroundColor: "#F7F6FC",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    height: 42,
    justifyContent: "center"
  },
  uploadTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  uploadTabText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 11
  },
  uploadTabTextActive: {
    color: "#FFFFFF"
  },
  uploadBox: {
    alignItems: "center",
    backgroundColor: "#FBFAFF",
    borderColor: colors.border,
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    minHeight: 142,
    justifyContent: "center",
    padding: 18
  },
  uploadTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 14,
    marginTop: 10,
    textTransform: "capitalize"
  },
  uploadSub: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
    textAlign: "center"
  },
  createInput: {
    backgroundColor: "#F8F7FC",
    borderColor: colors.border,
    borderRadius: 9,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 12,
    height: 44,
    marginTop: 12,
    paddingHorizontal: 12
  },
  charCount: {
    alignSelf: "flex-end",
    color: "#8A879F",
    fontFamily: fonts.medium,
    fontSize: 11
  },
  mediaModeRow: {
    borderTopColor: "#F0EEF7",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 15,
    paddingTop: 14
  },
  mediaModeButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E5F1",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 4,
    height: 48,
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 8
  },
  mediaModeActive: {
    backgroundColor: "#F5F2FF",
    borderColor: "#E5DFFF"
  },
  mediaModeIcon: {
    alignItems: "center",
    borderRadius: 7,
    height: 26,
    justifyContent: "center",
    width: 26
  },
  mediaModeText: {
    color: colors.ink,
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 12
  },
  mediaModeTextActive: {
    color: colors.primary
  },
  createPanel: {
    ...shadow,
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    padding: 14
  },
  panelTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  createSectionTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 17
  },
  panelCounter: {
    color: "#5F5C78",
    fontFamily: fonts.semiBold,
    fontSize: 12
  },
  previewPickerRow: {
    gap: 10,
    paddingTop: 14,
    paddingRight: 2
  },
  createPreviewCard: {
    backgroundColor: "#F4F3FA",
    borderColor: "#ECE8F4",
    borderRadius: 12,
    borderWidth: 1,
    height: 150,
    overflow: "hidden",
    width: 120
  },
  createPreviewImage: {
    height: "100%",
    width: "100%"
  },
  createVideoPreview: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    overflow: "hidden"
  },
  videoPlayButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    left: "50%",
    marginLeft: -21,
    marginTop: -21,
    position: "absolute",
    top: "50%",
    width: 42
  },
  createPreviewOverlay: {
    bottom: 0,
    left: 0,
    padding: 9,
    position: "absolute",
    right: 0
  },
  createPreviewLabel: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14
  },
  cropIcon: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
    borderRadius: 9,
    bottom: 8,
    height: 28,
    justifyContent: "center",
    position: "absolute",
    right: 8,
    width: 28
  },
  removeMediaButton: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.82)",
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    position: "absolute",
    right: 8,
    top: 8,
    width: 30
  },
  addMoreCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8EA",
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    height: 150,
    justifyContent: "center",
    paddingHorizontal: 10,
    width: 104
  },
  addMoreText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 9,
    textAlign: "center"
  },
  documentUploadPreview: {
    alignItems: "center",
    backgroundColor: "#F8FDFB",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  documentUploadIcon: {
    alignItems: "center",
    backgroundColor: "#E9F8F1",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    marginBottom: 8,
    width: 44
  },
  documentUploadName: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center"
  },
  documentUploadSize: {
    color: "#646179",
    fontFamily: fonts.medium,
    fontSize: 9,
    lineHeight: 11,
    marginTop: 3,
    textAlign: "center"
  },
  emptyFrameState: {
    alignItems: "center",
    backgroundColor: "#F8F7FC",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    minHeight: 54,
    paddingHorizontal: 12
  },
  emptyFrameText: {
    color: colors.muted,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16
  },
  frameRow: {
    gap: 12,
    paddingTop: 14,
    paddingRight: 2
  },
  frameOption: {
    alignItems: "center",
    width: 68
  },
  frameOptionActive: {
    width: 70
  },
  frameThumb: {
    alignItems: "center",
    backgroundColor: "#F5F4FA",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    overflow: "hidden",
    width: 60
  },
  frameThumbNone: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.primary
  },
  frameThumbActive: {
    borderColor: colors.primary,
    borderWidth: 1.5
  },
  frameVideoThumb: {
    alignItems: "center",
    backgroundColor: "#F1EDFF",
    height: "100%",
    justifyContent: "center",
    width: "100%"
  },
  frameImage: {
    height: "100%",
    width: "100%"
  },
  frameLabel: {
    color: "#5F5C78",
    fontFamily: fonts.medium,
    fontSize: 9,
    lineHeight: 11,
    marginTop: 7,
    textAlign: "center"
  },
  detailRow: {
    alignItems: "center",
    borderColor: "#ECE8F4",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 54,
    marginTop: 11,
    paddingHorizontal: 10
  },
  detailIcon: {
    alignItems: "center",
    backgroundColor: "#F4F1FF",
    borderRadius: 9,
    height: 34,
    justifyContent: "center",
    marginRight: 10,
    width: 34
  },
  detailLabel: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 15,
    marginRight: 8,
    width: 90
  },
  detailInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    height: 38,
    minWidth: 0,
    paddingVertical: 0
  },
  frameModalBackdrop: {
    flex: 1,
    justifyContent: "flex-end"
  },
  frameModalDim: {
    backgroundColor: "rgba(9,8,24,0.52)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  frameModalSheet: {
    ...shadow,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    paddingBottom: 22
  },
  frameModalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  frameModalTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 23
  },
  frameModalSub: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2
  },
  frameModalClose: {
    alignItems: "center",
    backgroundColor: "#F7F6FC",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  framePreviewStage: {
    alignItems: "center",
    backgroundColor: "#F7F6FC",
    borderRadius: 16,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 260,
    padding: 16
  },
  framePreviewCanvas: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    height: 220,
    overflow: "hidden",
    width: "100%"
  },
  framePreviewSquare: {
    aspectRatio: 1,
    height: 220,
    width: 220
  },
  framePreviewPortrait: {
    aspectRatio: 0.8,
    height: 238,
    width: undefined
  },
  framePreviewLandscape: {
    aspectRatio: 1.77,
    height: 170,
    width: "100%"
  },
  framePreviewPolaroid: {
    borderColor: "#FFFFFF",
    borderBottomWidth: 28,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 10
  },
  framePreviewRounded: {
    borderRadius: 26
  },
  framePreviewImage: {
    height: "100%",
    width: "100%"
  },
  frameModalOptions: {
    gap: 8,
    paddingTop: 14
  },
  frameModalOption: {
    backgroundColor: "#F7F6FC",
    borderColor: "#ECE8F4",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8
  },
  frameModalOptionActive: {
    backgroundColor: "#F1EDFF",
    borderColor: colors.primary
  },
  frameModalOptionText: {
    color: "#5F5C78",
    fontFamily: fonts.semiBold,
    fontSize: 11
  },
  frameModalOptionTextActive: {
    color: colors.primary
  },
  frameApplyButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 11,
    height: 48,
    justifyContent: "center",
    marginTop: 16
  },
  frameApplyText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 14
  },
  documentMetaRow: {
    flexDirection: "row",
    gap: 8
  },
  guidelinesCard: {
    alignItems: "center",
    backgroundColor: "#F4F0FF",
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    minHeight: 76,
    paddingHorizontal: 16
  },
  guidelineIcon: {
    alignItems: "center",
    backgroundColor: "#EAE3FF",
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  guidelineCopy: {
    flex: 1,
    minWidth: 0
  },
  guidelineTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13
  },
  guidelineText: {
    color: "#66637F",
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3
  },
  inlineFields: {
    flexDirection: "row",
    gap: 10
  },
  inlineInput: {
    flex: 1
  },
  createTextArea: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 24,
    minHeight: 124,
    padding: 0,
    textAlignVertical: "top"
  },
  composerPanel: {
    ...shadow,
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 14,
    marginBottom: 8,
    padding: 13
  },
  composerHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  composerTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 14
  },
  composerTextInput: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 12,
    minHeight: 82,
    textAlignVertical: "top"
  },
  tagInput: {
    backgroundColor: "#F8F7FC",
    borderRadius: 8,
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 11,
    height: 38,
    marginTop: 8,
    paddingHorizontal: 10
  },
  publishButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 9,
    height: 40,
    justifyContent: "center",
    marginTop: 10
  },
  publishText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 12
  },
  bottomDock: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    paddingTop: 0,
    pointerEvents: "box-none"
  },
  actionMenu: {
    ...shadow,
    alignSelf: "flex-end",
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
    borderRadius: 9,
    borderWidth: 1,
    marginBottom: 8,
    overflow: "hidden",
    width: 190
  },
  actionItem: {
    alignItems: "center",
    borderBottomColor: "#F0EEF7",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 14
  },
  actionText: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 12
  },
  fabRow: {
    alignItems: "flex-end",
    bottom: 82,
    paddingRight: 10,
    position: "absolute",
    right: 16,
    zIndex: 2
  },
  fab: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 26,
    height: 52,
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    width: 52,
    elevation: 8
  },
  tabs: {
    ...shadow,
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.62)",
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#241863",
    shadowOpacity: 0.1,
    shadowRadius: 22,
    width: "100%"
  },
  tabsGlass: {
    flexDirection: "row",
    height: 72,
    justifyContent: "space-around",
    maxWidth: 820,
    paddingHorizontal: 6,
    width: "100%"
  },
  tabItem: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
    paddingVertical: 5
  },
  tabLabel: {
    color: "#68677D",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 3,
    textAlign: "center"
  },
  tabLabelActive: {
    color: colors.primary,
    fontFamily: fonts.bold
  },
  placeholderCard: {
    ...shadow,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 34,
    minHeight: 220,
    padding: 22
  },
  placeholderIcon: {
    alignItems: "center",
    backgroundColor: "#F1EDFF",
    borderRadius: 31,
    height: 62,
    justifyContent: "center",
    marginBottom: 16,
    width: 62
  },
  placeholderTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 17
  },
  placeholderText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 8,
    textAlign: "center"
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    padding: 18
  },
  stateTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
    marginBottom: 4,
    textAlign: "center"
  },
  stateText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
    textAlign: "center"
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: "#F9F8FD"
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EEF8"
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F3FB",
    alignItems: "center",
    justifyContent: "center"
  },
  modalTitleText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#18172B"
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  featureContainer: {
    gap: 16
  },
  leaveNavRow: {
    gap: 8,
    paddingBottom: 8
  },
  leaveNavTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EBE9F5"
  },
  leaveNavTabActive: {
    backgroundColor: "#5B3CF5",
    borderColor: "#5B3CF5"
  },
  leaveNavText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#52506E"
  },
  leaveNavTextActive: {
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  leaveMetricsGrid: {
    flexDirection: "row",
    gap: 10
  },
  leaveCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  leaveCardVal: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: "#18172B"
  },
  leaveCardLbl: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    marginTop: 2
  },
  applyLeaveBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#F0EFFF"
  },
  formLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: "#18172B"
  },
  formInput: {
    backgroundColor: "#FAF9FE",
    borderWidth: 1,
    borderColor: "#E6E3F5",
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#18172B",
    textAlignVertical: "top"
  },
  formInputSingle: {
    backgroundColor: "#FAF9FE",
    borderWidth: 1,
    borderColor: "#E6E3F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#18172B"
  },
  submitLeaveBtn: {
    backgroundColor: "#5B3CF5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6
  },
  submitLeaveText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FFFFFF"
  },
  leaveListSection: {
    gap: 10
  },
  subSectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#18172B"
  },
  leaveRecordCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "#F0EFFF"
  },
  leaveRecordTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  leaveRecordType: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#18172B"
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusApproved: {
    backgroundColor: "#E8F5E9"
  },
  statusPending: {
    backgroundColor: "#FFF8E1"
  },
  statusBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#2E7D32"
  },
  leaveRecordDates: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#5B3CF5"
  },
  leaveRecordReason: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#6E6B89"
  },
  calendarMockCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#F0EFFF"
  },
  calendarTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#18172B"
  },
  calendarSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C7C9A",
    textAlign: "center"
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF"
  },
  settingsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  settingsText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: "#18172B"
  },
  settingStateText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#5B3CF5"
  },
  notifCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF"
  },
  notifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center"
  },
  notifCopy: {
    flex: 1
  },
  notifTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#18172B"
  },
  notifDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#6E6B89",
    marginTop: 2
  },
  notifTime: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#A2A0B8",
    marginTop: 4
  },
  billingCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF"
  },
  billingPlanTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#5B3CF5"
  },
  billingPlanSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C7C9A",
    marginTop: 4
  },
  premiumHeroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10
  },
  premiumHeroTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: "#FFFFFF",
    marginTop: 6
  },
  premiumHeroSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#E6E1FF",
    textAlign: "center"
  },
  upgradeBtn: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 10
  },
  upgradeBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#18172B"
  },
  genericFeatureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#F0EFFF"
  },
  genericTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#18172B"
  },
  genericSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C7C9A",
    textAlign: "center"
  },
  pressed: {
    opacity: 0.78
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20
  }
});
