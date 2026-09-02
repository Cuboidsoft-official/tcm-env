import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import { useEvent } from "expo";
import { sharePostWithMedia } from "../utils/mediaShareUtils";
import { VideoView, useVideoPlayer } from "expo-video";
import { addPostComment, deletePostComment, createCommunityPost, deleteCommunityPost, getHome, getNotifications, getPostComments, sharePost, toggleCommentLike, togglePostLike, repostPost, toggleSavePost, applyJobPost, deleteJobPost, uploadFile } from "../api/client";
import { sanitizeImageUri, DEFAULT_FALLBACK_IMAGE } from "../utils/imageUtils";
import { uriToDataUri } from "../utils/fileUtils";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import ApplyJobModal from "../components/ApplyJobModal";
import JobDetailsModal from "../components/JobDetailsModal";
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
import { setupPushNotifications, setupNotificationListeners, sendLocalNotification } from "../services/notificationService";
import NotificationToast from "../components/NotificationToast";
import ExploreTcmCategoryScreen from "./ExploreTcmCategoryScreen";
import WalletScreen from "./WalletScreen";
import MentorDashboardScreen from "./MentorDashboardScreen";
import PartnerDashboardScreen from "./PartnerDashboardScreen";
import CreateCourseScreen from "./CreateCourseScreen";
import CreateWebinarScreen from "./CreateWebinarScreen";
import AllMentorsScreen from "./AllMentorsScreen";
import ChatListScreen from "./ChatListScreen";
import DoubtRoomScreen from "./DoubtRoomScreen";
import CommunityScreen from "./CommunityScreen";
import DiscoverPartnersScreen from "./DiscoverPartnersScreen";
import PartnerProfilePreviewScreen from "./PartnerProfilePreviewScreen";
import PostActionBottomSheet from "../components/PostActionBottomSheet";
import SidebarDrawer from "../components/SidebarDrawer";
import GetVerifiedModal from "../components/GetVerifiedModal";
import FeedbackModal from "../components/FeedbackModal";
import AuthRequiredModal from "../components/AuthRequiredModal";
import PwaInstallBottomSheet from "../components/PwaInstallBottomSheet";
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
    tags: "#Last Class #Learning",
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
      subtitle: "Last Class Notes.pdf",
      fileName: "Last Class Notes.pdf",
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

const initialsFor = (name = "Last Class") =>
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
  const carouselImages = (draft.carouselImages && draft.carouselImages.length > 0)
    ? draft.carouselImages
    : mediaUrl ? [mediaUrl] : [];

  if (uploadType === "video") {
    if (!mediaUrl && !fileUri && carouselImages.length === 0) return config.media;

    const videoSrc = fileUri || mediaUrl || carouselImages[0] || "";
    const thumbnailSrc = (mediaUrl && mediaUrl !== videoSrc)
      ? mediaUrl
      : videoSrc;

    return {
      kind: "video",
      label: "Video Post",
      labelIcon: "play-circle",
      title: title || "New Video",
      subtitle: "Last Class COMMUNITY",
      duration: "0:30",
      frameKey,
      imageUrl: thumbnailSrc,
      thumbnailUrl: thumbnailSrc,
      fileUri: videoSrc,
      videoUrl: videoSrc,
      mimeType: mimeType || "video/mp4"
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
      subtitle: draft.fileName.trim() || "Last Class Document.pdf",
      fileName: draft.fileName.trim() || "Last Class Document.pdf",
      fileSize: draft.fileSize.trim() || "2.1 MB",
      frameKey,
      imageUrl: mediaUrl,
      fileUri,
      mimeType
    };
  }

  if (uploadType === "photo" || carouselImages.length > 0 || mediaUrl) {
    if (carouselImages.length > 0 || mediaUrl) {
      const primaryUrl = mediaUrl || carouselImages[0] || "";
      return {
        kind: "showcase",
        label: "Image Post",
        labelIcon: "image-multiple",
        title: title || "Photo Update",
        subtitle: "Last Class Community",
        frameKey,
        imageUrl: primaryUrl,
        carouselImages: carouselImages
      };
    }
  }

  return config.media;
}

async function uploadLocalMedia(token, uri, mimeType) {
  if (!uri) return "";
  if (/^https?:\/\//i.test(uri)) return uri;
  const dataUri = await uriToDataUri(uri, mimeType);
  if (!dataUri) return "";
  try {
    const res = await uploadFile(token, dataUri);
    if (res?.url) return res.url;
  } catch (e) {
    console.warn("Upload endpoint fallback:", e);
  }
  return "";
}

async function normalizeDraftMedia(token, draft) {
  const mimeType = draft.mimeType || "";
  const cache = new Map();
  const resolve = async (uri) => {
    if (!uri) return "";
    if (cache.has(uri)) return cache.get(uri);
    const url = await uploadLocalMedia(token, uri, mimeType);
    cache.set(uri, url);
    return url;
  };

  const fileUri = await resolve(draft.fileUri);
  const mediaUrl = await resolve(draft.mediaUrl);

  let carouselImages = [];
  if (Array.isArray(draft.carouselImages) && draft.carouselImages.length > 0) {
    carouselImages = await Promise.all(draft.carouselImages.map((u) => resolve(u)));
    carouselImages = carouselImages.filter(Boolean);
  }

  return {
    ...draft,
    mediaUrl: mediaUrl || draft.mediaUrl,
    carouselImages: carouselImages.length > 0 ? carouselImages : (mediaUrl ? [mediaUrl] : draft.carouselImages),
    fileUri: fileUri || draft.fileUri
  };
}

function SwipeBackWrapper({ children, onBack, enabled = true }) {
  const panResponder = useMemo(() => {
    if (!enabled || !onBack) return PanResponder.create({});

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          gestureState.dx > 25 &&
          Math.abs(gestureState.dy) < 40 &&
          gestureState.vx > 0.1
        );
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 60 && Math.abs(gestureState.dy) < 80) {
          onBack();
        }
      }
    });
  }, [onBack, enabled]);

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

export default function HomeScreen({ session, onLogout, onRequireLogin, onUserUpdate }) {
  const { width } = useWindowDimensions();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authActionTitle, setAuthActionTitle] = useState("perform this action");

  function checkRequireAuth(actionTitle = "perform this action") {
    if (!session?.token) {
      setAuthActionTitle(actionTitle);
      setAuthModalVisible(true);
      return true;
    }
    return false;
  }
  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Home");
  const [navHistoryStack, setNavHistoryStack] = useState([]);

  function changeTab(newTab) {
    if (!newTab || newTab === activeTab) return;
    setNavHistoryStack((prev) => [...prev, activeTab]);
    setActiveTab(newTab);
    setActiveDrawerItem(newTab);
    if (Platform.OS === "web" && typeof window !== "undefined" && window.history) {
      try {
        window.history.pushState({ tab: newTab }, "", "");
      } catch (e) {}
    }
  }
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [composerMode, setComposerMode] = useState("");
  const [previewItem, setPreviewItem] = useState(null);
  const [commentsPost, setCommentsPost] = useState(null);
  const [draft, setDraft] = useState({ text: "", tags: "", title: "", mentions: "", mediaUrl: "", fileName: "", fileSize: "", fileUri: "", mimeType: "", frameKey: "none", carouselImages: [], location: "" });
  const [uploadType, setUploadType] = useState("photo");
  const [posting, setPosting] = useState(false);
  const [isUploadingPost, setIsUploadingPost] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPushPermissionBanner, setShowPushPermissionBanner] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeDrawerItem, setActiveDrawerItem] = useState("Home");
  const [drawerFeatureModal, setDrawerFeatureModal] = useState(null);
  const [targetUserProfile, setTargetUserProfile] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showContinueLearning, setShowContinueLearning] = useState(false);
  const [showPopularCourses, setShowPopularCourses] = useState(false);
  const [showSearchScreen, setShowSearchScreen] = useState(false);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatCreateTrigger, setChatCreateTrigger] = useState(0);
  const [commCreateTrigger, setCommCreateTrigger] = useState(0);
  const [selectedMentorId, setSelectedMentorId] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [isCommChannelOpen, setIsCommChannelOpen] = useState(false);
  const [showNotificationsScreen, setShowNotificationsScreen] = useState(false);
  const [exploreCategoryKey, setExploreCategoryKey] = useState(null);
  const [showWalletScreen, setShowWalletScreen] = useState(false);
  const [showMentorDashboard, setShowMentorDashboard] = useState(false);
  const [showPartnerDashboard, setShowPartnerDashboard] = useState(false);
  const [showCreateCourseScreen, setShowCreateCourseScreen] = useState(false);
  const [showCreateWebinarScreen, setShowCreateWebinarScreen] = useState(false);
  const [showAllMentorsScreen, setShowAllMentorsScreen] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCommunityScreen, setShowCommunityScreen] = useState(false);
  const [showDiscoverPartnersScreen, setShowDiscoverPartnersScreen] = useState(false);
  const [selectedPartnerForPreview, setSelectedPartnerForPreview] = useState(null);
  const [courseToEdit, setCourseToEdit] = useState(null);
  const [activeDoubtRoom, setActiveDoubtRoom] = useState(null);
  const [getVerifiedModalOpen, setGetVerifiedModalOpen] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [activeToast, setActiveToast] = useState(null);
  const [actionSheetPost, setActionSheetPost] = useState(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const knownNotifIds = useRef(new Set());
  const isInitialNotifFetch = useRef(true);
  const [isPwaInstallModalOpen, setIsPwaInstallModalOpen] = useState(false);
  const mainScrollRef = useRef(null);
  const lastHomeTapRef = useRef(0);
  const { theme } = useTheme();

  const user = useMemo(
    () => home?.user || session?.user || { name: "Learner", role: "Student", handle: "learner" },
    [home?.user, session?.user]
  );

  // 1. Automatic Push Notification Token Registration on Launch
  useEffect(() => {
    if (session?.token) {
      setupPushNotifications(session.token).catch(() => {});
    }
  }, [session?.token]);

  // 2. Periodic Polling & Live Notification Badge Sync
  useEffect(() => {
    if (!session?.token) return;

    let isMounted = true;
    async function checkNotifs() {
      try {
        const res = await getNotifications(session.token);
        if (!isMounted) return;
        if (res && Array.isArray(res.notifications)) {
          setUnreadNotifCount(res.unreadCount || 0);
          const unreadList = res.notifications.filter((n) => n.unread);

          if (isInitialNotifFetch.current) {
            // On initial fetch upon app launch, register existing unread notification IDs as known WITHOUT triggering popups
            unreadList.forEach((n) => {
              const notifKey = n.id || `${n.type}_${n.title}`;
              knownNotifIds.current.add(notifKey);
            });
            isInitialNotifFetch.current = false;
          } else {
            // On subsequent polls during active session, trigger notification in system status bar
            for (const n of unreadList) {
              const notifKey = n.id || `${n.type}_${n.title}`;
              if (!knownNotifIds.current.has(notifKey)) {
                knownNotifIds.current.add(notifKey);
                sendLocalNotification({
                  title: n.title || "Last Class Notification 🔔",
                  body: n.subtitle || n.message || "You have a new update on Last Class Mobile",
                  data: n
                });
                break;
              }
            }
          }
        }
      } catch (e) {}
    }

    checkNotifs();
    const interval = setInterval(checkNotifs, 12000);

    const cleanupListeners = setupNotificationListeners(
      (notification) => {
        // System status bar notification received
      },
      (response) => {
        const data = response?.notification?.request?.content?.data;
        if (data && isMounted) {
          handleToastNavigate({ data });
        }
      }
    );

    if (Platform.OS === "web" && typeof window !== "undefined" && "Notification" in window) {
      if (window.Notification.permission === "default") {
        setShowPushPermissionBanner(true);
      }
    }

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (cleanupListeners) cleanupListeners();
    };
  }, [session?.token]);

  function handleToastNavigate(toastItem) {
    const data = toastItem?.data || {};
    const type = toastItem?.type || data?.type || "";

    if (data.screen === "Notifications" || type.includes("friend")) {
      resetSubScreens();
      setShowNotificationsScreen(true);
    } else if (data.screen === "Chat" || type === "chat_message") {
      resetSubScreens();
      setActiveTab("Chats");
    } else if (data.screen === "Community" || type.includes("post")) {
      resetSubScreens();
      setActiveTab("Community");
    } else if (data.screen === "JobDetails" || data.jobId) {
      if (data.jobId) {
        setSelectedJobForDetails({ id: data.jobId, title: toastItem.title || "Job Opportunity" });
      } else {
        resetSubScreens();
        setActiveCategory("💼 Jobs & Hiring");
      }
    } else if (data.screen === "CourseDetails" || data.courseId) {
      if (data.courseId) {
        setSelectedCourseId(data.courseId);
      } else {
        resetSubScreens();
        setActiveTab("Learn");
      }
    } else {
      resetSubScreens();
      setShowNotificationsScreen(true);
    }
  }

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
    setShowPartnerDashboard(false);
    setShowDiscoverPartnersScreen(false);
    setSelectedPartnerForPreview(null);
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
    const targetObj = typeof u === "object" ? u : { id: u };

    // If explicit mentor role/selection, ALWAYS open Mentor Detailed Profile Page!
    if (targetObj.role === "mentor" || targetObj.isMentor || String(targetObj.id || "").startsWith("m") || targetObj.isMentorCard) {
      setTargetUserProfile(null);
      setSelectedMentorId(targetObj);
      return;
    }

    if (isSelfUser(targetObj)) {
      setTargetUserProfile(null);
      setSelectedMentorId(null);
      setActiveDrawerItem("Profile");
      setActiveTab("Profile");
    } else {
      setSelectedMentorId(null);
      setTargetUserProfile(targetObj);
    }
  }

  const tabs = home?.tabs?.length ? home.tabs : fallbackTabs;
  const categories = home?.categories || [];
  const posts = home?.posts || [];
  const contentWidth = Math.min(width, 1200);

  useEffect(() => {
    loadHome();
  }, [session?.token]);

  async function loadHome({ quiet = false } = {}) {
    if (!session?.token) {
      setLoading(false);
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
      if (nextError?.status === 401) {
        if (onLogout) onLogout();
        else if (onRequireLogin) onRequireLogin();
        return;
      }
      setError(nextError.message || "Unable to load live home data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleSelectDrawerItem(itemKey) {
    resetSubScreens();
    setActiveDrawerItem(itemKey);
    setSidebarOpen(false);

    if (itemKey === "Home") {
      const now = Date.now();
      if (activeTab === "Home" || (now - lastHomeTapRef.current < 500)) {
        setRefreshing(true);
        if (mainScrollRef.current) {
          try {
            mainScrollRef.current.scrollTo({ y: 0, animated: true });
          } catch (e) {}
        }
        loadHome({ quiet: true }).finally(() => setRefreshing(false));
      }
      setActiveTab("Home");
      lastHomeTapRef.current = now;
    } else if (itemKey === "My Classes") {
      setActiveTab("Learn");
    } else if (itemKey === "Doubts") {
      setActiveTab("Doubts");
    } else if (itemKey === "Last Class Community" || itemKey === "Community") {
      setShowCommunityScreen(true);
    } else if (itemKey === "Notifications") {
      setShowNotificationsScreen(true);
    } else if (itemKey === "Wallet" || itemKey === "Last Class Wallet & Referrals" || itemKey === "Last Class Wallet & Balance" || itemKey === "Referrals" || itemKey === "Refer & Earn (₹500 Bonus)" || itemKey === "Referral") {
      setShowWalletScreen(true);
    } else if (itemKey === "Profile") {
      setActiveTab("Profile");
    } else if (itemKey === "Settings") {
      setActiveTab("ProfileSettings");
    } else if (itemKey === "Go Premium" || itemKey === "Get Premium" || itemKey === "Get Last Class Verified Pro" || itemKey === "Premium Features" || itemKey === "Premium Features ⭐") {
      setGetVerifiedModalOpen(true);
    } else if (itemKey === "Feedback" || itemKey === "Feedback & Suggestions") {
      setShowFeedbackModal(true);
    } else {
      setDrawerFeatureModal(itemKey);
    }
  }

  function handleNavigateToPost(post) {
    if (!post) return;
    setTargetUserProfile(null);
    setSelectedMentorId(null);
    resetSubScreens();
    setActiveCategory("For You");
    setSearch("");

    const postIdStr = String(post.id || post._id || "");
    const existingPost = home?.posts?.find((p) => String(p.id || p._id || "") === postIdStr);

    setActiveTab("Home");
    setActiveDrawerItem("Home");
    setCommentsPost(existingPost || post);
  }

  function openComposer(mode) {
    const config = postModes[mode] || postModes.post;
    setComposerMode(mode);
    setUploadType(config.media.kind === "video" ? "video" : config.media.kind === "notes" ? "document" : "photo");
    setDraft({ text: "", tags: "", title: "", mentions: "", mediaUrl: "", fileName: "", fileSize: "", fileUri: "", mimeType: "", frameKey: "none" });
    setActionMenuOpen(false);
  }

  async function handleDeletePost(postId) {
    const cleanId = String(postId).replace(/^post-/, "");
    const performDelete = async () => {
      try {
        if (session?.token) {
          await deleteCommunityPost(session.token, postId).catch(() => {});
          await deleteJobPost(session.token, cleanId).catch(() => {});
        }
      } catch (err) {}

      deleteJobPost(session?.token, cleanId).catch(() => {});

      setHome((current) => ({
        ...current,
        posts: (current?.posts || []).filter((p) => {
          const pId = String(p.id || p._id);
          return pId !== String(postId) && pId !== cleanId && p.jobData?.id !== cleanId;
        })
      }));
      Alert.alert("Deleted", "Item removed successfully.");
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Are you sure you want to delete this item?")) {
        performDelete();
      }
      return;
    }

    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item? It will be permanently removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: performDelete
        }
      ]
    );
  }

  async function submitPost() {
    const config = postModes[composerMode] || postModes.post;
    const defaultMediaText = "";
    const postText = draft.text.trim() || defaultMediaText;
    const mediaFrameKey = uploadType === "video" && draft.frameKey === "none" ? "portrait" : draft.frameKey;
    const draftSnapshot = { ...draft };

    // Immediately redirect to Feed & close composer
    setComposerMode("");
    setActiveTab("Home");
    setActiveCategory("For You");
    setPosting(true);
    setIsUploadingPost(true);
    setUploadProgress(15);

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
    }, 350);

    try {
      let normalizedDraft = draftSnapshot;
      try {
        const norm = await normalizeDraftMedia(session?.token, draftSnapshot);
        if (norm) normalizedDraft = norm;
      } catch (err) {
        console.warn("Normalize draft error:", err);
      }

      const isRemote = (uri) => !uri || /^(https?:\/\/|\/uploads\/|data:(image|video)\/)/i.test(uri);
      const pendingLocal = [
        normalizedDraft.mediaUrl,
        normalizedDraft.fileUri,
        ...(Array.isArray(normalizedDraft.carouselImages) ? normalizedDraft.carouselImages : [])
      ].filter((uri) => uri && !isRemote(uri));

      if (pendingLocal.length > 0) {
        Alert.alert("Media upload failed", "Your file could not be uploaded (max 80MB, supported formats only). Please try again.");
        return;
      }

      setUploadProgress(70);
      const media = buildMediaPayload(config, normalizedDraft, uploadType, mediaFrameKey);
      let newPost = null;

      if (session?.token) {
        try {
          const result = await createCommunityPost(session.token, {
            text: postText,
            content: postText,
            caption: postText,
            category: config.category,
            location: draftSnapshot.location?.trim() || undefined,
            tags: [...(draftSnapshot.tags || "").split(/[,\s]+/), ...(draftSnapshot.mentions || "").split(/[,\s]+/)].filter(Boolean),
            media
          });
          if (result && (result.post || result.id)) {
            newPost = result.post || result;
            if (result.mediaWarning) {
              Alert.alert("Media not saved", result.mediaWarning);
            }
          }
        } catch (err) {
          console.warn("Backend create post fallback:", err);
        }
      }

      if (!newPost) {
        newPost = {
          id: `post_local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          authorName: user?.name || "Last Class Learner",
          authorAvatarUrl: user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
          authorRole: user?.role || "Student",
          isMentor: Boolean(user?.role?.toLowerCase?.().includes("mentor")),
          isPremium: true,
          category: config.category || "For You",
          location: draftSnapshot.location?.trim() || undefined,
          text: postText,
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
          isSaved: false,
          media,
          time: "Just now"
        };
      }

      setUploadProgress(100);
      setHome((current) => ({
        ...current,
        posts: [newPost, ...(current?.posts || [])]
      }));
      setDraft({ text: "", tags: "", title: "", mentions: "", mediaUrl: "", fileName: "", fileSize: "", fileUri: "", mimeType: "", frameKey: "none", carouselImages: [], location: "" });
    } catch (nextError) {
      console.warn("Post creation error:", nextError);
    } finally {
      clearInterval(progressTimer);
      setPosting(false);
      setTimeout(() => {
        setIsUploadingPost(false);
        setUploadProgress(0);
      }, 700);
    }
  }

  const handleTogglePostLike = useCallback((postId) => {
    const userId = session?.user?.id;
    setHome((current) => {
      if (!current || !Array.isArray(current.posts)) return current;
      const updatedPosts = current.posts.map((p) => {
        const pId = p.id || p._id;
        if (String(pId) === String(postId)) {
          const currentLiked = Boolean(
            p.isLiked ||
            (Array.isArray(p.likedBy) && p.likedBy.map(String).includes(String(userId)))
          );
          const nextLiked = !currentLiked;
          const currentLikes = p.metrics?.likes !== undefined ? p.metrics.likes : (p.likes || 0);
          const nextLikesCount = Math.max(0, currentLikes + (nextLiked ? 1 : -1));
          const updatedLikedBy = nextLiked
            ? [...(p.likedBy || []), userId].filter(Boolean)
            : (p.likedBy || []).filter((id) => String(id) !== String(userId));
          return {
            ...p,
            isLiked: nextLiked,
            likedBy: updatedLikedBy,
            metrics: { ...(p.metrics || {}), likes: nextLikesCount },
            likes: nextLikesCount
          };
        }
        return p;
      });
      return { ...current, posts: updatedPosts };
    });

    if (session?.token && postId) {
      togglePostLike(session.token, postId).catch((e) => {
        console.warn("Failed to sync post like with backend:", e);
      });
    }
  }, [session?.token, session?.user?.id]);

  const feedPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = posts.filter((post) => {
      const isJobPost =
        post.postType === "job_news" ||
        Boolean(post.jobData) ||
        (post.category || "").toLowerCase().includes("job") ||
        (post.category || "").toLowerCase().includes("hiring");

      const cleanActiveCat = (activeCategory || "")
        .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|💼|🔥|✨|👥/gu, "")
        .trim()
        .toLowerCase();

      let categoryMatch = false;
      if (!cleanActiveCat || cleanActiveCat === "for you" || cleanActiveCat === "trending" || cleanActiveCat === "following") {
        categoryMatch = true;
      } else if (cleanActiveCat.includes("job") || cleanActiveCat.includes("hiring")) {
        categoryMatch = isJobPost;
      } else {
        const cleanPostCat = (post.category || "")
          .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|💼|🔥|✨|👥/gu, "")
          .trim()
          .toLowerCase();
        categoryMatch = cleanPostCat === cleanActiveCat;
      }

      const queryMatch =
        !query ||
        [post.authorName, post.authorRole, post.category, post.text, post.jobData?.title, post.jobData?.company, ...(post.tags || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      return categoryMatch && queryMatch;
    });

    return [...filtered].sort((a, b) => {
      const parseTime = (item) => {
        if (!item) return 0;
        if (item.publishedAt) {
          const t = new Date(item.publishedAt).getTime();
          if (!isNaN(t) && t > 0) return t;
        }
        if (item.createdAt) {
          const t = new Date(item.createdAt).getTime();
          if (!isNaN(t) && t > 0) return t;
        }
        if (typeof item.id === "number") return item.id;
        if (typeof item.id === "string" && item.id.includes("-")) {
          const parts = item.id.split("-");
          const num = Number(parts[parts.length - 1]);
          if (!isNaN(num) && num > 0) return num;
        }
        return 0;
      };
      const timeA = parseTime(a);
      const timeB = parseTime(b);
      return timeB - timeA;
    });
  }, [activeCategory, posts, search]);

  const activeBackAction = useMemo(() => {
    if (selectedJobForApply) return () => setSelectedJobForApply(null);
    if (selectedJobForDetails) return () => setSelectedJobForDetails(null);
    if (commentsPost) return () => setCommentsPost(null);
    if (previewItem) return () => setPreviewItem(null);
    if (drawerFeatureModal) return () => setDrawerFeatureModal(null);
    if (getVerifiedModalOpen) return () => setGetVerifiedModalOpen(false);
    if (sidebarOpen) return () => setSidebarOpen(false);
    if (activeDoubtRoom) return () => setActiveDoubtRoom(null);
    if (activeChatUser) return () => setActiveChatUser(null);
    if (selectedCourseId) return () => setSelectedCourseId(null);
    if (selectedMentorId) return () => setSelectedMentorId(null);
    if (showContinueLearning) return () => setShowContinueLearning(false);
    if (showPopularCourses) return () => setShowPopularCourses(false);
    if (showSearchScreen) return () => setShowSearchScreen(false);
    if (showNotificationsScreen) return () => setShowNotificationsScreen(false);
    if (exploreCategoryKey) return () => setExploreCategoryKey(null);
    if (showAllMentorsScreen) return () => setShowAllMentorsScreen(false);
    if (showCommunityScreen) return () => setShowCommunityScreen(false);
    if (showWalletScreen) return () => setShowWalletScreen(false);
    if (showMentorDashboard) return () => setShowMentorDashboard(false);
    if (showPartnerDashboard) return () => setShowPartnerDashboard(false);
    if (showDiscoverPartnersScreen) return () => setShowDiscoverPartnersScreen(false);
    if (selectedPartnerForPreview) return () => setSelectedPartnerForPreview(null);
    if (showCreateCourseScreen) return () => { setCourseToEdit(null); setShowCreateCourseScreen(false); };
    if (showCreateWebinarScreen) return () => setShowCreateWebinarScreen(false);
    if (targetUserProfile) return () => setTargetUserProfile(null);

    if (navHistoryStack.length > 0) {
      return () => {
        setNavHistoryStack((prev) => {
          const newStack = [...prev];
          const prevTab = newStack.pop();
          if (prevTab) {
            setActiveTab(prevTab);
            setActiveDrawerItem(prevTab);
          }
          return newStack;
        });
      };
    }

    if (activeTab !== "Home") return () => { setActiveTab("Home"); setActiveDrawerItem("Home"); };
    return null;
  }, [
    selectedJobForApply,
    selectedJobForDetails,
    commentsPost,
    previewItem,
    drawerFeatureModal,
    getVerifiedModalOpen,
    sidebarOpen,
    activeDoubtRoom,
    activeChatUser,
    selectedCourseId,
    selectedMentorId,
    showContinueLearning,
    showPopularCourses,
    showSearchScreen,
    showNotificationsScreen,
    exploreCategoryKey,
    showAllMentorsScreen,
    showCommunityScreen,
    showWalletScreen,
    showMentorDashboard,
    showPartnerDashboard,
    showDiscoverPartnersScreen,
    selectedPartnerForPreview,
    showCreateCourseScreen,
    showCreateWebinarScreen,
    targetUserProfile,
    navHistoryStack,
    activeTab
  ]);

  useEffect(() => {
    function handleHardwareOrBrowserBack() {
      if (activeBackAction) {
        activeBackAction();
        return true;
      }
      return false;
    }

    const backSubscription = BackHandler.addEventListener("hardwareBackPress", handleHardwareOrBrowserBack);

    let handlePopState = null;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      handlePopState = () => {
        if (activeBackAction) {
          activeBackAction();
        }
      };
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      backSubscription.remove();
      if (Platform.OS === "web" && typeof window !== "undefined" && handlePopState) {
        window.removeEventListener("popstate", handlePopState);
      }
    };
  }, [activeBackAction]);

  if (composerMode) {
    return (
      <CreatePostScreen
        config={postModes[composerMode] || postModes.post}
        draft={draft}
        posting={posting}
        user={user}
        uploadType={uploadType}
        setUploadType={setUploadType}
        setDraft={setDraft}
        onClose={() => setComposerMode("")}
        onSubmit={submitPost}
        onPreviewMedia={(mediaItem) => setPreviewItem(mediaItem)}
      />
    );
  }

  const isFullScreenView = Boolean(activeDoubtRoom || activeChatUser || selectedMentorId || showNotificationsScreen || showSearchScreen || showPopularCourses || showContinueLearning || selectedCourseId || exploreCategoryKey || showWalletScreen || showMentorDashboard || showPartnerDashboard || showDiscoverPartnersScreen || selectedPartnerForPreview || showCreateCourseScreen || showCreateWebinarScreen || showAllMentorsScreen);

  const isFullWidthView = Boolean(activeDoubtRoom || activeChatUser || selectedMentorId || selectedCourseId || exploreCategoryKey || showPartnerDashboard || showDiscoverPartnersScreen || selectedPartnerForPreview || showMentorDashboard || activeTab === "Chats" || activeTab === "Doubts" || activeTab === "chats" || activeTab === "doubts" || activeTab === "Community" || activeTab === "community" || activeTab === "Home" || activeTab === "home" || activeTab === "Learn" || activeTab === "Profile" || activeTab === "ProfileSettings");

  return (
    <SwipeBackWrapper onBack={activeBackAction} enabled={Boolean(activeBackAction)}>
      <SafeAreaView edges={["top", "left", "right"]} style={[styles.safe, { backgroundColor: theme.bg }]}>
        {isUploadingPost ? (
          <View style={styles.topUploadProgressTrack}>
            <LinearGradient
              colors={["#5B3CF5", "#9D4EDD", "#00F2FE", "#FF007F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.topUploadProgressBar, { width: `${Math.max(12, uploadProgress)}%` }]}
            />
          </View>
        ) : null}

        {showPushPermissionBanner ? (
          <View style={styles.pushPermissionBanner}>
            <Feather name="bell" size={15} color="#5B3CF5" />
            <Text numberOfLines={1} style={styles.pushPermissionText}>
              Turn on push notifications to receive instant student alerts
            </Text>
            <TouchableOpacity
              onPress={async () => {
                const ok = await setupPushNotifications(session?.token, true);
                if (ok) {
                  setShowPushPermissionBanner(false);
                  if (setActiveToast) {
                    setActiveToast({ type: "success", title: "Notifications Allowed 🎉", message: "You will now get alerts when app is closed." });
                  }
                }
              }}
              style={styles.pushPermissionBtn}
            >
              <Text style={styles.pushPermissionBtnText}>Allow</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPushPermissionBanner(false)} style={{ padding: 4 }}>
              <Feather name="x" size={14} color="#7C7C9A" />
            </TouchableOpacity>
          </View>
        ) : null}

        <PwaInstallBottomSheet
          visible={isPwaInstallModalOpen}
          onClose={() => setIsPwaInstallModalOpen(false)}
          onShowToast={setActiveToast}
        />
        <View style={[styles.appShell, { backgroundColor: theme.bg }]}>
        {isFullScreenView ? (
          <View style={[styles.page, { width: isFullWidthView ? "100%" : contentWidth, flex: 1, paddingBottom: 0, paddingHorizontal: isFullWidthView ? 0 : undefined }]}>
            {activeDoubtRoom ? (
              <DoubtRoomScreen
                session={session}
                roomId={activeDoubtRoom.roomId || "NEET-DOUBT-001"}
                onClose={() => setActiveDoubtRoom(null)}
                onOpenMentorProfile={(mId) => {
                  setActiveDoubtRoom(null);
                  handleSelectUser(typeof mId === "object" ? mId : { id: mId || "m1", name: "Rahul Sharma", role: "Mentor" });
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
                user={user}
                targetMentor={typeof selectedMentorId === "object" ? selectedMentorId : null}
                mentorId={typeof selectedMentorId === "object" ? (selectedMentorId?.id || selectedMentorId?.userId || selectedMentorId?.name) : selectedMentorId}
                onClose={() => setSelectedMentorId(null)}
                onOpenCourseDetails={(cId) => {
                  setSelectedMentorId(null);
                  setSelectedCourseId(cId || "p1");
                }}
                onOpenChat={(targetM) => {
                  setSelectedMentorId(null);
                  setActiveChatUser(targetM || { id: "m1", name: "Rahul Sharma", role: "mentor" });
                }}
                onSelectPost={handleNavigateToPost}
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
                  handleSelectUser(u);
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
                onSelectMentor={(mId) => {
                  setSelectedCourseId(null);
                  setSelectedMentorId(mId || "m1");
                }}
              />
            ) : exploreCategoryKey ? (
              <ExploreTcmCategoryScreen
                session={session}
                categoryKey={exploreCategoryKey}
                onBack={() => setExploreCategoryKey(null)}
                onSelectCourse={(cId) => setSelectedCourseId(cId || "p1")}
                onSelectUser={(u) => {
                  setExploreCategoryKey(null);
                  handleSelectUser(u);
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
            ) : showPartnerDashboard ? (
              <PartnerDashboardScreen
                session={session}
                user={user}
                onBack={() => setShowPartnerDashboard(false)}
                onOpenDrawer={() => setDrawerOpen(true)}
              />
            ) : selectedPartnerForPreview ? (
              <PartnerProfilePreviewScreen
                partner={selectedPartnerForPreview}
                onBack={() => setSelectedPartnerForPreview(null)}
              />
            ) : showDiscoverPartnersScreen ? (
              <DiscoverPartnersScreen
                session={session}
                onBack={() => setShowDiscoverPartnersScreen(false)}
                onSelectPartner={(partner) => setSelectedPartnerForPreview(partner)}
              />
            ) : showMentorDashboard ? (
              <MentorDashboardScreen
                session={session}
                user={user}
                onBack={() => {
                  setShowMentorDashboard(false);
                  loadHome({ quiet: true });
                }}
                onSelectUser={(u) => {
                  setShowMentorDashboard(false);
                  handleSelectUser(u);
                }}
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
          <ScrollView
            ref={mainScrollRef}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await loadHome({ quiet: true });
                  setRefreshing(false);
                }}
                colors={[theme.primary]}
                tintColor={theme.primary}
                progressBackgroundColor={theme.cardBg}
              />
            }
          >
            <View style={[styles.page, { width: (activeTab === "Chats" || activeTab === "Doubts" || activeTab === "chats" || activeTab === "doubts" || activeTab === "Community" || activeTab === "community") ? "100%" : contentWidth }]}>
              {!targetUserProfile && (activeTab === "Community" || activeTab === "community" || activeTab === "Chats" || activeTab === "chats" || activeTab === "Doubts" || activeTab === "doubts") ? null : (
                <Header
                  title={activeTab}
                  user={user}
                  notifications={unreadNotifCount || home?.notifications || 0}
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
                  showBack={!!targetUserProfile || !!activeChatUser || !!activeDoubtRoom || activeTab === "ProfileSettings" || activeTab === "Chats" || activeTab === "Doubts" || activeTab === "chats" || activeTab === "doubts" || activeTab === "Learn" || activeTab === "Community" || activeTab === "community"}
                  backLabel={targetUserProfile ? targetUserProfile.name : (activeTab === "ProfileSettings" ? "Settings" : activeTab)}
                  onBack={() => {
                    if (targetUserProfile) {
                      setTargetUserProfile(null);
                    } else if (activeChatUser) {
                      setActiveChatUser(null);
                    } else if (activeDoubtRoom) {
                      setActiveDoubtRoom(null);
                    } else if (activeTab === "ProfileSettings") {
                      setActiveTab("Profile");
                    } else if (activeTab !== "Home" && activeTab !== "home") {
                      setActiveTab("Home");
                    }
                  }}
                  onSearch={activeTab === "Chats" || activeTab === "Doubts" || activeTab === "chats" || activeTab === "doubts" ? () => setShowChatSearch((prev) => !prev) : null}
                  onCreate={activeTab === "Chats" || activeTab === "Doubts" || activeTab === "chats" || activeTab === "doubts" ? () => setChatCreateTrigger(Date.now()) : (activeTab === "Community" || activeTab === "community" ? () => setCommCreateTrigger(Date.now()) : null)}
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
                  onSelectPost={handleNavigateToPost}
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
                        feedPosts.map((post, idx) => (
                          <PostCard
                            key={`feed_post_${post.id || post._id || idx}_${idx}`}
                            session={session}
                            post={post}
                            onComment={setCommentsPost}
                            onPreview={setPreviewItem}
                            onDeletePost={handleDeletePost}
                            onSelectUser={(u) => handleSelectUser(u || { id: post.authorId || post.authorName, name: post.authorName, avatarUrl: post.authorAvatarUrl, role: post.authorRole })}
                            onApplyJob={(j) => setSelectedJobForApply(j)}
                            onJobDetails={(j) => setSelectedJobForDetails(j)}
                            onToggleLike={handleTogglePostLike}
                            onOpenActionSheet={(targetPost) => {
                              setActionSheetPost(targetPost);
                              setIsActionSheetOpen(true);
                            }}
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
                commCreateTrigger={commCreateTrigger}
                navigation={{ goBack: () => setActiveTab("Home") }}
                onChannelStateChange={(isOpen) => setIsCommChannelOpen(isOpen)}
                onOpenChannelChat={(targetChannel) => setActiveChatUser(targetChannel)}
                onOpenSidebar={() => setSidebarOpen(true)}
                onNotifications={() => handleSelectDrawerItem("Notifications")}
              />
            ) : activeTab === "Learn" ? (
              <LearnScreen
                learn={home?.learn}
                user={user}
                session={session}
                onOpenSidebar={() => setSidebarOpen(true)}
                onNotifications={() => handleSelectDrawerItem("Notifications")}
                onSelectUser={(m) => handleSelectUser(m || { id: "m1", role: "mentor" })}
                onSelectCourse={(cId) => setSelectedCourseId(cId || "p1")}
                onOpenContinueLearning={() => setShowContinueLearning(true)}
                onOpenPopularCourses={() => setShowPopularCourses(true)}
                onOpenAllMentors={() => setShowAllMentorsScreen(true)}
                onOpenExploreCategory={(catKey) => setExploreCategoryKey(catKey)}
                onOpenDiscoverPartners={() => setShowDiscoverPartnersScreen(true)}
              />
            ) : activeTab === "Chats" || activeTab === "Doubts" ? (
              <ChatListScreen
                session={session}
                showSearchInput={showChatSearch}
                onToggleSearch={() => setShowChatSearch((prev) => !prev)}
                chatCreateTrigger={chatCreateTrigger}
                onSelectChat={(chatUser) => {
                  setActiveChatUser(chatUser);
                }}
                onSelectDoubtRoom={(roomItem) => {
                  setActiveDoubtRoom(roomItem);
                }}
                onOpenSidebar={() => setSidebarOpen(true)}
                onNotifications={() => handleSelectDrawerItem("Notifications")}
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
                onOpenPartnerDashboard={() => setShowPartnerDashboard(true)}
                onSelectPost={handleNavigateToPost}
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
                  if (onUserUpdate) onUserUpdate(updatedUser);
                }}
              />
            ) : (
              <TabPlaceholder activeTab={activeTab} />
            )}
          </View>
          </ScrollView>
        )}
        {!activeChatUser && !activeDoubtRoom && !selectedCourseId && !selectedMentorId && !showMentorDashboard && !showPartnerDashboard && !showDiscoverPartnersScreen && !selectedPartnerForPreview && !showCreateCourseScreen && !showCreateWebinarScreen ? (
          <ActionDock
            user={user}
            open={actionMenuOpen}
            setOpen={setActionMenuOpen}
            onAction={openComposer}
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={(tab) => {
              if (tab === "Home") {
                const now = Date.now();
                if (activeTab === "Home" || (now - lastHomeTapRef.current < 500)) {
                  setRefreshing(true);
                  if (mainScrollRef.current) {
                    try {
                      mainScrollRef.current.scrollTo({ y: 0, animated: true });
                    } catch (e) {}
                  }
                  loadHome({ quiet: true }).finally(() => setRefreshing(false));
                }
                setShowPartnerDashboard(false);
                setShowMentorDashboard(false);
                setShowDiscoverPartnersScreen(false);
                setSelectedPartnerForPreview(null);
                resetSubScreens();
                changeTab("Home");
                setActiveDrawerItem("Home");
                lastHomeTapRef.current = now;
              } else {
                setShowPartnerDashboard(false);
                setShowMentorDashboard(false);
                setShowDiscoverPartnersScreen(false);
                setSelectedPartnerForPreview(null);
                resetSubScreens();
                changeTab(tab);
                setActiveDrawerItem(tab);
              }
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
          onOpenInstallPwa={() => setIsPwaInstallModalOpen(true)}
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

        <FeedbackModal
          visible={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          user={user}
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
          onCommentAdded={(postId, newCommentCount) => {
            setHome((current) => {
              if (!current || !Array.isArray(current.posts)) return current;
              const updatedPosts = current.posts.map((p) => {
                const pId = p.id || p._id;
                if (String(pId) === String(postId)) {
                  return {
                    ...p,
                    metrics: { ...(p.metrics || {}), comments: newCommentCount }
                  };
                }
                return p;
              });
              return { ...current, posts: updatedPosts };
            });
          }}
          onSelectUser={(u) => {
            setCommentsPost(null);
            handleSelectUser(u);
          }}
        />

        {/* MODAL: JOB DETAILS */}
        <JobDetailsModal
          visible={Boolean(selectedJobForDetails)}
          job={selectedJobForDetails}
          isMentor={false}
          onClose={() => setSelectedJobForDetails(null)}
          onApply={(j) => {
            if (checkRequireAuth("apply for jobs")) return;
            setSelectedJobForDetails(null);
            setSelectedJobForApply(j);
          }}
        />

        {/* MODAL: APPLY FOR JOB WITH RESUME */}
        <ApplyJobModal
          visible={Boolean(selectedJobForApply)}
          job={selectedJobForApply}
          user={user}
          token={session?.token}
          onClose={() => setSelectedJobForApply(null)}
          onSubmitApplication={async (payload) => {
            if (!selectedJobForApply) return;
            try {
              const updatedJob = await applyJobPost(session?.token, selectedJobForApply.id, payload);
              Alert.alert("Application Submitted! 🎉", `Your resume was sent to ${updatedJob.mentorName || "the mentor"}. AI Candidate Tracker updated candidate count (${updatedJob.appliedCandidates}/${updatedJob.requiredCandidates}).`);
              setSelectedJobForApply(null);
              loadHome({ quiet: true });
            } catch (err) {
              Alert.alert("Notice", err.message || "Failed to submit application.");
            }
          }}
        />

        <AuthRequiredModal
          visible={authModalVisible}
          actionTitle={authActionTitle}
          onClose={() => setAuthModalVisible(false)}
          onLogin={() => {
            setAuthModalVisible(false);
            if (onRequireLogin) onRequireLogin();
          }}
        />

        <NotificationToast
          toast={activeToast}
          onDismiss={() => setActiveToast(null)}
          onPress={handleToastNavigate}
        />

        <PostActionBottomSheet
          visible={isActionSheetOpen}
          onClose={() => {
            setIsActionSheetOpen(false);
            setActionSheetPost(null);
          }}
          post={actionSheetPost}
          session={session}
          onDeletePost={handleDeletePost}
          onSelectUser={(u) => {
            setIsActionSheetOpen(false);
            setActionSheetPost(null);
            handleSelectUser(u);
          }}
          onShowToast={(toastObj) => setActiveToast(toastObj)}
        />
      </View>
    </SafeAreaView>
    </SwipeBackWrapper>
  );
}

const homeHeaderLogo = require("../../assets/icon.png");

function ZigZagFlowTcmOneLogo({ fontSize = 18, showIcon = true, subtitle = "Decoding The Mind", logoSize = 36 }) {
  const { theme } = useTheme();
  const lastColor = theme.isDark ? "#F8FAFC" : "#0F172A";
  const classColor = "#EF4444";
  const subtextColor = theme.isDark ? "#94A3B8" : "#64748B";

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
      {showIcon ? (
        <Image
          source={homeHeaderLogo}
          style={{
            width: logoSize,
            height: logoSize,
            borderRadius: Math.round(logoSize * 0.22)
          }}
          resizeMode="contain"
        />
      ) : null}
      <View style={{ justifyContent: "center", alignItems: "flex-start" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontFamily: fonts.extraBold, fontSize, lineHeight: 20, color: lastColor, letterSpacing: -0.2 }}>Last</Text>
          <Text style={{ fontFamily: fonts.extraBold, fontSize, lineHeight: 20, color: classColor, letterSpacing: -0.2 }}>Class</Text>
        </View>
        {subtitle ? (
          <Text style={{ color: subtextColor, fontFamily: fonts.medium, fontSize: 9.5, lineHeight: 12, marginTop: 1 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Header({ title, user, notifications, onOpenSidebar, onProfile, onOpenSettings, isSelfProfile, onNotifications, showBack, backLabel, onBack, onOpenWallet, onSearch, onCreate }) {
  const { theme } = useTheme();
  const iconColor = theme.isDark ? "#81C784" : colors.primary;
  const subtextColor = theme.isDark ? "#94A3B8" : "#64748B";

  const isHomePage = (!title || title === "Home" || title === "home") && !showBack;

  // 1. ORIGINAL HOME PAGE HEADER (Logo with Image + Click Logo to Open Sidebar)
  if (isHomePage) {
    return (
      <View style={[styles.header, { backgroundColor: theme.bg }]}>
        <View style={styles.brandRow}>
          <Pressable onPress={onOpenSidebar} style={({ pressed }) => [styles.brandWrap, pressed && styles.pressed]}>
            <ZigZagFlowTcmOneLogo logoSize={34} showIcon={true} />
          </Pressable>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={onNotifications || (() => Alert.alert("Notifications", `${notifications} learning updates.`))} style={[styles.iconButton, { backgroundColor: theme.isDark ? "rgba(255,255,255,0.08)" : "#F4F3F8" }]}>
            <Feather name="bell" size={19} color={iconColor} />
            {notifications ? (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{notifications > 9 ? "9+" : notifications}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable onPress={onProfile} style={[styles.profileRing, { backgroundColor: theme.cardBg, borderColor: theme.primary }]}>
            <Avatar name={user.name} uri={user.avatarUrl} size={28} />
          </Pressable>
        </View>
      </View>
    );
  }

  // 2. ALL OTHER PAGES HEADER (Clean, Sticky, White Card, Left Back Button, Centered Title, Right Action Icons)
  const displayTitle = showBack
    ? (backLabel || "Details")
    : (title === "ProfileSettings" ? "Settings" : (title || "Page"));

  const handleBackAction = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history && window.history.length > 1) {
      window.history.back();
    }
  };

  const hasRightIcons = onCreate || onSearch;

  return (
    <View style={[styles.header, { backgroundColor: theme.cardBg, borderBottomColor: theme.border, position: "relative", justifyContent: "center", minHeight: 48 }]}>
      <Pressable
        onPress={handleBackAction}
        style={({ pressed }) => [
          {
            position: "absolute",
            left: 14,
            top: 10,
            zIndex: 10,
            padding: 4,
            flexDirection: "row",
            alignItems: "center"
          },
          pressed && styles.pressed
        ]}
      >
        <Feather name="chevron-left" size={24} color={theme.text} />
      </Pressable>

      <View style={{ position: "absolute", left: 0, right: 0, alignItems: "center", justifyContent: "center" }} pointerEvents="none">
        <Text style={[styles.screenTitle, { color: theme.text, textAlign: "center" }]}>{displayTitle}</Text>
      </View>

      {hasRightIcons ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, position: "absolute", right: 14, top: 10, zIndex: 10 }}>
          {onCreate ? (
            <Pressable onPress={onCreate} style={({ pressed }) => [{ padding: 4 }, pressed && styles.pressed]}>
              <Feather name="plus" size={22} color={theme.text} />
            </Pressable>
          ) : null}
          {onSearch ? (
            <Pressable onPress={onSearch} style={({ pressed }) => [{ padding: 4 }, pressed && styles.pressed]}>
              <Feather name="search" size={20} color={theme.text} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function SearchBar({ value, onChangeText, onRefresh, refreshing, onOpenSearch }) {
  const { theme } = useTheme();
  return (
    <View style={styles.searchRow}>
      <Pressable onPress={onOpenSearch} style={[styles.searchBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Feather name="search" size={18} color={theme.subtext} />
        <TextInput
          editable={!onOpenSearch}
          pointerEvents={onOpenSearch ? "none" : "auto"}
          autoCapitalize="none"
          placeholder="Search topics, posts, notes, people..."
          placeholderTextColor={theme.subtext}
          style={[styles.searchInput, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
        />
      </Pressable>
      <Pressable onPress={onOpenSearch || onRefresh} style={({ pressed }) => [styles.filterButton, { backgroundColor: theme.cardBg, borderColor: theme.border }, pressed && styles.pressed]}>
        {refreshing ? <ActivityIndicator color={theme.primary} size="small" /> : <Feather name="sliders" size={18} color={theme.isDark ? "#A78BFA" : "#261B94"} />}
      </Pressable>
    </View>
  );
}

function Avatar({ name, uri, size }) {
  const safeUri = sanitizeImageUri(uri, null);
  if (safeUri) {
    return <Image source={{ uri: safeUri }} style={{ borderRadius: size / 2, height: size, width: size }} onError={() => {}} />;
  }

  return (
    <View style={[styles.initialAvatar, { borderRadius: size / 2, height: size, width: size }]}>
      <Text style={styles.initialText}>{initialsFor(name)}</Text>
    </View>
  );
}

function getCategoryIconConfig(categoryName) {
  const clean = categoryName.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|💼|🔥|✨|👥/gu, "").trim();

  if (clean.includes("For You")) return { icon: "sparkles", color: "#0A6836", label: "For You" };
  if (clean.includes("Following")) return { icon: "people", color: "#0F172A", label: "Following" };
  if (clean.includes("Trending")) return { icon: "flame", color: "#0F172A", label: "Trending" };
  if (clean.includes("Jobs") || clean.includes("Hiring")) return { icon: "briefcase", color: "#0F172A", label: "Jobs" };
  if (clean.includes("UPSC")) return { icon: "school", color: "#0F172A", label: "UPSC" };
  if (clean.includes("JEE")) return { icon: "calculator", color: "#0F172A", label: "JEE" };
  if (clean.includes("NEET")) return { icon: "medical", color: "#0F172A", label: "NEET" };
  if (clean.includes("Coding")) return { icon: "code-slash", color: "#0F172A", label: "Coding" };
  if (clean.includes("AI") || clean.includes("ML")) return { icon: "hardware-chip", color: "#0F172A", label: "AI / ML" };
  if (clean.includes("Design")) return { icon: "color-palette", color: "#0F172A", label: "Design" };

  return { icon: "grid", color: "#0F172A", label: clean || categoryName };
}

function CategoryTabs({ categories, activeCategory, setActiveCategory }) {
  const { theme } = useTheme();
  if (!categories.length) return null;

  return (
    <ScrollView horizontal contentContainerStyle={{ gap: 6, paddingHorizontal: 14, paddingBottom: 10 }} showsHorizontalScrollIndicator={false}>
      {categories.map((category) => {
        const active = category === activeCategory;
        const conf = getCategoryIconConfig(category);

        return (
          <Pressable
            key={category}
            onPress={() => setActiveCategory(category)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 11,
              paddingVertical: 6,
              borderRadius: 18,
              backgroundColor: active ? (theme.activeChipBg || theme.primary) : (theme.inactiveChipBg || theme.cardBg),
              borderColor: active ? theme.primary : theme.border,
              borderWidth: 1,
              shadowColor: active ? theme.primary : "#000",
              shadowOffset: { width: 0, height: active ? 2 : 1 },
              shadowOpacity: active ? 0.25 : (theme.isDark ? 0.2 : 0.04),
              shadowRadius: active ? 4 : 2
            }}
          >
            <Ionicons
              name={conf.icon}
              size={13}
              color={active ? (theme.activeChipText || "#FFFFFF") : theme.primary}
            />
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 11.5,
                color: active ? (theme.activeChipText || "#FFFFFF") : (theme.inactiveChipText || theme.text),
                letterSpacing: 0.2
              }}
            >
              {conf.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function PostCard({ session, post, onComment, onPreview, onSelectUser, onDeletePost, onApplyJob, onJobDetails, onToggleLike, onOpenActionSheet }) {
  const { theme } = useTheme();
  const metrics = post.metrics || {};
  const media = post.media || {};
  const isPinnedCard = Boolean(post.isPinned || post.pinned);

  const isJob = post.postType === "job_news" || Boolean(post.jobData);
  const job = post.jobData || {
    id: post.id,
    title: post.title || post.text?.split("\n")[0] || "Software Developer Opening",
    company: post.company || "Last Class Hiring Partner",
    mentorName: post.authorName || "Mentor",
    mentorAvatarUrl: post.authorAvatarUrl,
    mentorRole: post.authorRole,
    description: post.text,
    minSalary: "3,50,000",
    maxSalary: "6,50,000",
    salaryPeriod: "LPA",
    requiredCandidates: 3,
    appliedCandidates: 1,
    deadline: "Open until filled",
    imageUrl: post.media?.imageUrl,
    documentUrl: post.documentUrl,
    documentName: post.documentName,
    status: "active"
  };

  const selectedCount = job.selectedCandidates || (job.applicants || []).filter((a) => a.status === "selected").length;
  const isFilled = job.status === "filled" || selectedCount >= Number(job.requiredCandidates || 1);
  const reqCount = job.requiredCandidates || 1;
  const fillPercent = Math.min(100, Math.round((selectedCount / reqCount) * 100));

  if (isJob) {
    const isValidBanner = job.imageUrl && !(Platform.OS === "web" && typeof job.imageUrl === "string" && job.imageUrl.startsWith("file://"));

    return (
      <View
        style={[
          styles.postCard,
          {
            borderRadius: 0,
            borderWidth: 1,
            borderColor: isPinnedCard ? "#F59E0B" : theme.border,
            backgroundColor: theme.cardBg,
            padding: 16,
            marginBottom: 12,
            shadowColor: "transparent",
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0
          }
        ]}
      >
        {isPinnedCard && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: theme.isDark ? "#312E81" : "#FEF3C7",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 10,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: theme.isDark ? "#4338CA" : "#FDE68A"
            }}
          >
            <Ionicons name="pushpin" size={15} color="#D97706" />
            <Text style={{ fontSize: 11.5, fontFamily: fonts.bold, color: "#D97706", letterSpacing: 0.3 }}>
              PINNED JOB DRIVE
            </Text>
          </View>
        )}

        {/* Header Row */}
        <View style={styles.postHeader}>
          <Pressable
            onPress={() =>
              onSelectUser &&
              onSelectUser({
                id: post.authorId || job.mentorName || "m1",
                name: job.mentorName || post.authorName,
                avatarUrl: job.mentorAvatarUrl || post.authorAvatarUrl,
                role: job.mentorRole || post.authorRole || "Senior Mentor",
                isMentor: true
              })
            }
            style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
          >
            {/* Avatar with Online Dot */}
            <View style={{ position: "relative", marginRight: 8 }}>
              <Avatar name={job.mentorName || post.authorName} uri={job.mentorAvatarUrl || post.authorAvatarUrl} size={34} />
              <View style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: 5, backgroundColor: "#22C55E", borderWidth: 1.5, borderColor: theme.cardBg }} />
            </View>
            <View style={styles.postAuthor}>
              <View style={styles.authorLine}>
                <Text numberOfLines={1} style={[styles.authorName, { fontSize: 15, fontFamily: fonts.bold, color: theme.text }]}>{job.mentorName || post.authorName}</Text>
                <View style={{ backgroundColor: theme.badgeBg || "#E8F5E9", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, flexDirection: "row", alignItems: "center", gap: 3, marginLeft: 4, borderWidth: 1, borderColor: theme.badgeBorder || "#C8E6C9" }}>
                  <Ionicons name="shield-checkmark" size={10} color={theme.badgeText || theme.primary} />
                  <Text style={{ fontSize: 9.5, fontFamily: fonts.bold, color: theme.badgeText || theme.primary }}>Mentor Drive</Text>
                </View>
              </View>
              <Text numberOfLines={1} style={[styles.authorRole, { color: theme.subtext, fontSize: 11 }]}>{job.company || "Last Class Hiring Partner"} • {job.mentorRole || "Mentor"}</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              if (onOpenActionSheet) {
                onOpenActionSheet(post);
              } else if (onDeletePost) {
                onDeletePost(job.id || post.id);
              }
            }}
            style={{ padding: 6 }}
          >
            <Feather name="more-vertical" size={20} color={theme.subtext} />
          </Pressable>
        </View>

        {/* Category Pill Tag */}
        <View style={{ backgroundColor: theme.badgeBg || "#E8F5E9", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginTop: 10, borderWidth: 1, borderColor: theme.badgeBorder || "#C8E6C9" }}>
          <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: theme.badgeText || theme.primary, textTransform: "uppercase", letterSpacing: 0.5 }}>INTERNSHIP</Text>
        </View>

        {/* Job Title */}
        <Text style={{ fontSize: 18, fontFamily: fonts.extraBold, color: theme.text, marginTop: 6, lineHeight: 24 }}>
          {job.title}
        </Text>

        {/* Salary / Stipend Box */}
        <View style={{ backgroundColor: theme.isDark ? "#161B33" : "#F0F7F1", borderRadius: 14, padding: 12, marginTop: 10, borderWidth: 1, borderColor: theme.badgeBorder || theme.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialCommunityIcons name="wallet-outline" size={20} color={theme.primary} />
            <Text style={{ fontSize: 15, fontFamily: fonts.extraBold, color: theme.primary }}>
              ₹{job.minSalary}{job.maxSalary ? ` – ₹${job.maxSalary}` : ""}
            </Text>
          </View>
          <Text style={{ fontSize: 11, fontFamily: fonts.medium, color: theme.subtext, marginTop: 2, marginLeft: 28 }}>
            Stipend / Fixed
          </Text>
        </View>

        {/* Status & Duration Pills Grid */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          {/* Active Status Badge */}
          <View style={{ backgroundColor: isFilled ? (theme.isDark ? "#450A0A" : "#FEE2E2") : (theme.badgeBg || "#E8F5E9"), borderWidth: 1, borderColor: isFilled ? "#EF4444" : (theme.badgeBorder || theme.primary), paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name={isFilled ? "close-circle" : "checkmark-circle"} size={14} color={isFilled ? "#EF4444" : theme.primary} />
            <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: isFilled ? "#EF4444" : (theme.badgeText || theme.primary) }}>
              {isFilled ? "HIRING CLOSED" : `ACTIVE (${selectedCount}/${reqCount} Selected)`}
            </Text>
          </View>

          {/* Duration Badge */}
          <View style={{ backgroundColor: theme.badgeBg || "#E8F5E9", borderWidth: 1, borderColor: theme.badgeBorder || theme.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Feather name="clock" size={13} color={theme.primary} />
            <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: theme.badgeText || theme.primary }}>{job.deadline || "30 Days"}</Text>
          </View>
        </View>

        {/* AI Selection Tracker Box */}
        <View style={{ backgroundColor: theme.isDark ? "#131927" : "#F8FAFD", padding: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.border, marginTop: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialCommunityIcons name="chip" size={16} color={theme.primary} />
              <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.text }}>AI Candidate Limit Tracker</Text>
            </View>
            <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: isFilled ? "#DC2626" : theme.primary }}>
              {selectedCount} / {reqCount} Selected ({fillPercent}%)
            </Text>
          </View>
          <View style={{ height: 6, width: "100%", backgroundColor: theme.isDark ? "#1E263B" : "#E2E8F0", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
            <View style={{ height: "100%", width: `${fillPercent}%`, backgroundColor: isFilled ? "#EF4444" : theme.primary, borderRadius: 3 }} />
          </View>
        </View>

        {/* Job Description */}
        <View style={{ marginTop: 10 }}>
          <ReadMoreText text={job.description || post.text} />
        </View>

        {/* Job Banner Image (Only if user attached an image) */}
        {isValidBanner ? (
          <View style={{ marginTop: 10, borderRadius: 12, overflow: "hidden" }}>
            <Pressable
              onPress={() =>
                onPreview &&
                onPreview({
                  type: "image",
                  title: job.title || "Job Cover",
                  subtitle: job.company || "Last Class Hiring Partner",
                  imageUrl: job.imageUrl
                })
              }
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Image
                source={{ uri: job.imageUrl }}
                style={{ width: "100%", height: 160, borderRadius: 12 }}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        ) : null}

        {/* JD PDF Attachment Reader Box */}
        {job.documentUrl ? (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.isDark ? "#450A0A" : "#FEF2F2", borderWidth: 1, borderColor: "#EF4444", padding: 10, borderRadius: 10, marginTop: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
              <MaterialCommunityIcons name="file-pdf-box" size={26} color="#EF4444" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.text }} numberOfLines={1}>{job.documentName || "Job_Description.pdf"}</Text>
                <Text style={{ fontSize: 10.5, color: theme.subtext }}>{job.documentSize || "2.1 MB"} • Official JD Document</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Professional Footer CTA Row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border }}>
          <TouchableOpacity
            onPress={() => onJobDetails && onJobDetails(job)}
            activeOpacity={0.8}
            style={{
              backgroundColor: theme.isDark ? "#131B2E" : "#F8FAFC",
              borderWidth: 1,
              borderColor: theme.border,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 5
            }}
          >
            <Ionicons name="information-circle-outline" size={16} color={theme.subtext} />
            <Text style={{ fontSize: 12.5, fontFamily: fonts.bold, color: theme.subtext }}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onApplyJob && onApplyJob(job)}
            disabled={isFilled}
            activeOpacity={0.85}
            style={{ borderRadius: 12, overflow: "hidden" }}
          >
            <LinearGradient
              colors={isFilled ? ["#64748B", "#64748B"] : [theme.primary, theme.primaryDark || "#4F46E5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 6
              }}
            >
              <Feather name={isFilled ? "lock" : "send"} size={14} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontSize: 12.5, fontFamily: fonts.bold }}>
                {isFilled ? "Hiring Closed" : "Apply Now →"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <PostActions post={post} session={session} metrics={metrics} onComment={() => onComment(post)} onToggleLike={onToggleLike} onSelectUser={onSelectUser} />
      </View>
    );
  }

  return (
    <View style={[styles.postCard, { backgroundColor: theme.cardBg, borderWidth: 0, borderBottomWidth: 0, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderRadius: 0, paddingHorizontal: 0, paddingVertical: 8, marginBottom: 12 }]}>
      {isPinnedCard && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: theme.isDark ? "#312E81" : "#FEF3C7",
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 10,
            marginBottom: 12,
            marginHorizontal: 14,
            borderWidth: 1,
            borderColor: theme.isDark ? "#4338CA" : "#FDE68A"
          }}
        >
          <Ionicons name="pushpin" size={15} color="#D97706" />
          <Text style={{ fontSize: 11.5, fontFamily: fonts.bold, color: "#D97706", letterSpacing: 0.3 }}>
            PINNED POST
          </Text>
        </View>
      )}

      {Boolean(post.isReposted || post.repostedByName) && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, marginBottom: 6 }}>
          <MaterialCommunityIcons name="repeat" size={15} color="#10B981" />
          <Text style={{ fontSize: 11.5, fontFamily: fonts.bold, color: "#10B981" }}>
            {post.repostedByName ? `${post.repostedByName} reposted` : "You reposted"}
          </Text>
        </View>
      )}

      {/* Modern Feed Post Header (Avatar, Name, Verification, Follow, Options) */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, marginBottom: 8 }}>
        <Pressable
          onPress={() =>
            onSelectUser &&
            onSelectUser(
              post.author || {
                id: post.authorId || post.authorName,
                name: post.authorName,
                avatarUrl: post.authorAvatarUrl,
                role: post.authorRole,
                isMentor: Boolean(post.isMentor || post.authorRole?.toLowerCase().includes("mentor"))
              }
            )
          }
          style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}
        >
          <Avatar name={post.authorName} uri={post.authorAvatarUrl} size={32} />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text numberOfLines={1} style={{ fontSize: 14.5, fontFamily: fonts.bold, color: theme.text, flexShrink: 1 }}>
                {post.authorName}
              </Text>
              <MaterialCommunityIcons name="check-decagram" size={15} color={theme.primary} />
            </View>
          </View>
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {session?.user?.id && String(session.user.id) !== String(post.authorId || post.authorName) ? (
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                backgroundColor: theme.isDark ? "#1E263B" : "#F1F5F9",
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 8
              }}
            >
              <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.text }}>Follow</Text>
            </TouchableOpacity>
          ) : null}

          <Pressable
            onPress={() => {
              if (onOpenActionSheet) {
                onOpenActionSheet(post);
              } else if (onDeletePost) {
                onDeletePost(post.id);
              }
            }}
            style={{ padding: 4 }}
          >
            <Feather name="more-horizontal" size={22} color={theme.text} />
          </Pressable>
        </View>
      </View>

      {/* Media Block (Video or Image) */}
      <PostMedia post={post} onPreview={onPreview} />

      {/* Modern Feed Action Bar (Directly below media) */}
      <PostActions post={post} session={session} metrics={metrics} onComment={() => onComment(post)} onToggleLike={onToggleLike} onSelectUser={onSelectUser} />

      {/* Caption, Hashtags & Time (Below Action Bar) */}
      <View style={{ paddingHorizontal: 14, marginTop: 4 }}>
        <ReadMoreText text={post.text} />

        {/* Highlighted Hashtags */}
        {post.tags?.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {post.tags.map((tag) => (
              <Text key={tag} style={{ fontSize: 12.5, fontFamily: fonts.medium, color: theme.primary }}>
                {tag.startsWith("#") ? tag : `#${tag}`}
              </Text>
            ))}
          </View>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            <Text style={{ fontSize: 12.5, fontFamily: fonts.medium, color: theme.primary }}>#tcm #learning #tech #foryou</Text>
          </View>
        )}

        {/* Time Ago Subtext */}
        <Text style={{ fontSize: 11, fontFamily: fonts.regular, color: theme.subtext, marginTop: 4 }}>
          {post.timeLabel || "Just now"}
        </Text>
      </View>
    </View>
  );
}

function MediaLabel({ media }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.mediaLabel, { backgroundColor: theme.isDark ? "#064E3B" : theme.badgeBg }]}>
      <MaterialCommunityIcons name={media.labelIcon || "tag"} size={12} color={theme.primary} />
      <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.mediaLabelText, { color: theme.primary }]}>{media.label}</Text>
    </View>
  );
}

function formatCleanText(rawText = "") {
  if (!rawText) return "";
  return rawText
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^[\*\-\+]\s+/gm, "• ")
    .trim();
}

function ReadMoreText({ text = "" }) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const rawLines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const isLong = text.length > 130 || rawLines.length > 3;
  const visibleLines = expanded ? rawLines : rawLines.slice(0, 3);

  return (
    <View style={{ marginTop: 6 }}>
      {visibleLines.map((rawLine, idx) => {
        const isHashHeader = /^#{1,6}\s+/.test(rawLine);
        const lineWithoutHashes = rawLine.replace(/^#{1,6}\s*/, "").trim();

        const isBullet = lineWithoutHashes.startsWith("•") || lineWithoutHashes.startsWith("- ") || lineWithoutHashes.startsWith("* ") || /^\d+[\.\)]\s/.test(lineWithoutHashes);
        const cleanLine = lineWithoutHashes.replace(/^[•\-\*]\s*|^\d+[\.\)]\s*/, "").trim();
        const isHeader = isHashHeader || (lineWithoutHashes.startsWith("**") && lineWithoutHashes.endsWith("**")) || (lineWithoutHashes.endsWith(":") && lineWithoutHashes.length < 50 && !lineWithoutHashes.includes("http"));

        if (isHeader) {
          const headerText = cleanLine.replace(/\*\*/g, "").trim();
          return (
            <Text
              key={idx}
              style={{
                fontSize: 13,
                fontFamily: fonts.bold,
                color: theme.primary,
                marginTop: idx === 0 ? 0 : 8,
                marginBottom: 3
              }}
            >
              {headerText}
            </Text>
          );
        }

        if (isBullet) {
          const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
          return (
            <View key={idx} style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 4, paddingLeft: 4 }}>
              <Text style={{ fontSize: 13, color: theme.primary, marginRight: 6, lineHeight: 19 }}>•</Text>
              <Text style={{ flex: 1, fontSize: 12.5, fontFamily: fonts.regular, color: theme.text, lineHeight: 19 }}>
                {parts.map((part, pIdx) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <Text key={pIdx} style={{ fontFamily: fonts.bold, color: theme.text }}>
                        {part.slice(2, -2)}
                      </Text>
                    );
                  }
                  return part;
                })}
              </Text>
            </View>
          );
        }

        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
        return (
          <Text
            key={idx}
            numberOfLines={expanded ? undefined : (idx === 2 ? 1 : undefined)}
            style={{
              fontSize: 12.5,
              fontFamily: fonts.regular,
              color: theme.text,
              lineHeight: 19,
              marginTop: idx === 0 ? 0 : 4
            }}
          >
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <Text key={pIdx} style={{ fontFamily: fonts.bold, color: theme.text }}>
                    {part.slice(2, -2)}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        );
      })}

      {isLong ? (
        <Pressable hitSlop={8} onPress={() => setExpanded((val) => !val)} style={styles.readMoreButton}>
          <Text style={[styles.readMoreText, { color: theme.primary }]}>{expanded ? "Show less ↑" : "Read more ↓"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SingleFeedImage({ singleImage, fKey, onPreview, mediaTitle, mediaSubtitle }) {
  const [naturalAspect, setNaturalAspect] = useState(null);

  useEffect(() => {
    if (singleImage) {
      const uri = sanitizeImageUri(singleImage);
      if (uri) {
        if (Platform.OS === "web") {
          if (typeof window !== "undefined") {
            try {
              const img = new window.Image();
              img.onload = () => {
                if (img.width && img.height && img.height > 0) {
                  setNaturalAspect(img.width / img.height);
                }
              };
              img.src = uri;
            } catch (e) {}
          }
        } else {
          try {
            if (typeof Image?.getSize === "function") {
              Image.getSize(
                uri,
                (width, height) => {
                  if (width && height && height > 0) {
                    setNaturalAspect(width / height);
                  }
                },
                () => {}
              );
            }
          } catch (e) {}
        }
      }
    }
  }, [singleImage]);

  let targetAspect = naturalAspect || 1.6;
  if (fKey === "square") {
    targetAspect = 1.0;
  } else if (fKey === "landscape") {
    targetAspect = 1.7778;
  } else if (fKey === "portrait") {
    targetAspect = 0.8;
  }

  return (
    <Pressable
      onPress={() =>
        onPreview({
          type: "image",
          title: mediaTitle || "Photo Post",
          subtitle: mediaSubtitle || "Last Class Community",
          imageUrl: singleImage
        })
      }
      style={({ pressed }) => [
        styles.videoMedia,
        {
          aspectRatio: targetAspect,
          height: undefined,
          backgroundColor: "transparent"
        },
        fKey === "polaroid" && styles.videoMediaPolaroid,
        fKey === "rounded" && styles.videoMediaRounded,
        pressed && styles.pressed
      ]}
    >
      <Image
        source={{ uri: sanitizeImageUri(singleImage) }}
        style={{ width: "100%", height: "100%", borderRadius: 0 }}
        resizeMode="cover"
      />
    </Pressable>
  );
}

function PostMedia({ post, onPreview }) {
  const { theme } = useTheme();
  const media = post.media || {};

  if (media.kind === "notes" || post.documentUrl || post.documentName) {
    const resolvedDocUri = media.fileUri || media.documentUrl || post.documentUrl || media.imageUrl || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view";
    const documentItem = {
      type: "document",
      title: media.fileName || post.documentName || media.subtitle || media.title || "Document",
      subtitle: media.title || media.label || "Last Class Document",
      fileSize: media.fileSize || post.documentSize || "PDF Document",
      imageUrl: media.imageUrl || post.imageUrl || "",
      fileUri: resolvedDocUri,
      mimeType: media.mimeType || "application/pdf",
      authorName: post.authorName
    };

    return (
      <Pressable onPress={() => onPreview(documentItem)} style={({ pressed }) => [styles.pdfCardContainer, pressed && styles.pressed]}>
        <View style={styles.pdfIconWrap}>
          <MaterialCommunityIcons name="file-pdf-box" size={34} color="#FF465F" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text numberOfLines={1} style={styles.pdfTitle}>{media.fileName || media.subtitle || "Last Class Document.pdf"}</Text>
          <Text style={styles.pdfSize}>{media.fileSize || "PDF Document"} • Tap to view</Text>
        </View>
        <Feather name="external-link" size={18} color="#6366F1" style={{ marginLeft: 8 }} />
      </Pressable>
    );
  }

  if (media.kind === "showcase" || media.kind === "photo" || (media.imageUrl && media.kind !== "video" && media.kind !== "notes")) {
    const carouselImages = (media.carouselImages && media.carouselImages.length > 0)
      ? media.carouselImages
      : [media.imageUrl].filter(Boolean);

    if (carouselImages.length === 1) {
      const singleImage = carouselImages[0];
      const fKey = media.frameKey || "none";

      return (
        <SingleFeedImage
          singleImage={singleImage}
          fKey={fKey}
          onPreview={onPreview}
          mediaTitle={media.title}
          mediaSubtitle={media.subtitle}
        />
      );
    }

    const fKey = media.frameKey || "none";
    let slideWidth = 240;
    let slideHeight = 240;

    if (fKey === "square") {
      slideWidth = 220;
      slideHeight = 220;
    } else if (fKey === "landscape") {
      slideWidth = 280;
      slideHeight = 160;
    } else if (fKey === "portrait") {
      slideWidth = 200;
      slideHeight = 260;
    }

    return (
      <ScrollView horizontal contentContainerStyle={styles.carouselContent} showsHorizontalScrollIndicator={false} style={styles.carouselMedia}>
        {carouselImages.map((imageUrl, index) => {
          return (
            <Pressable
              key={`${imageUrl}-${index}`}
              onPress={() =>
                onPreview({
                  type: "image",
                  title: media.title || "Photo Post",
                  subtitle: media.subtitle || "Last Class Community",
                  imageUrl: sanitizeImageUri(imageUrl)
                })
              }
              style={({ pressed }) => [
                styles.carouselSlide,
                { width: slideWidth, height: slideHeight, backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderRadius: 6 },
                pressed && styles.pressed
              ]}
            >
              <Image
                source={{ uri: sanitizeImageUri(imageUrl) }}
                style={{ width: "100%", height: "100%", borderRadius: 6 }}
                resizeMode="contain"
              />
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
      'String str = "Last Class is awesome";',
      "String rev = new StringBuilder(str).reverse().toString();",
      "System.out.println(rev);"
    ];

    return <CodeBlock lines={codeLines} />;
  }

  if (media.kind !== "video") return null;

  return <VideoFeedPlayer media={media} onPreviewItem={onPreview} />;
}

function VideoFeedPlayer({ media, onPreviewItem }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const userPausedRef = useRef(false);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const frameKey = media.frameKey || "portrait";
  const sourceUri = media.videoUrl || media.fileUri || (media.mimeType?.startsWith("video/") ? media.imageUrl : "");
  const posterUri = media.thumbnailUrl || (media.imageUrl && media.imageUrl !== sourceUri ? media.imageUrl : "");
  const player = useVideoPlayer(sourceUri ? { uri: sourceUri } : null, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });

  const { status: playerStatus } = useEvent(player, "statusChange", { status: player?.status });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player?.playing });

  useEffect(() => {
    if (isPlaying !== undefined) {
      setPlaying(Boolean(isPlaying));
    }
  }, [isPlaying]);

  useEffect(() => {
    if (playerStatus === "error") setPlayerError(true);
    else if (playerStatus === "readyToPlay") setPlayerError(false);
  }, [playerStatus]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Web IntersectionObserver: Instagram-style flow
  // Autoplay when >= 50% in view. Pause IMMEDIATELY when < 50% visible (post half hidden / off-screen)
  useEffect(() => {
    if (Platform.OS === "web" && containerRef.current && typeof IntersectionObserver !== "undefined") {
      const targetElement = containerRef.current.node || containerRef.current;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.50) {
            if (!userPausedRef.current && player) {
              try {
                const res = player.play();
                if (res && typeof res.catch === "function") res.catch(() => {});
                setPlaying(true);
              } catch (e) {}
            }
          } else {
            // Post half hidden (< 50% visible) or scrolled off-screen -> pause immediately
            if (player) {
              try {
                const res = player.pause();
                if (res && typeof res.catch === "function") res.catch(() => {});
                setPlaying(false);
              } catch (e) {}
            }
            // Reset user pause state when scrolled off-screen so next/previous video autoplays when scrolled to
            userPausedRef.current = false;
            setUserPaused(false);
          }
        },
        { threshold: [0, 0.25, 0.50, 0.75, 1.0] }
      );

      if (targetElement && typeof observer.observe === "function") {
        observer.observe(targetElement);
      }
      return () => observer.disconnect();
    }
  }, [player]);

  // Native Viewport Scroll Check: Instagram-style flow (>= 50% in viewport)
  useEffect(() => {
    let checkInterval;
    if (Platform.OS !== "web" && containerRef.current) {
      checkInterval = setInterval(() => {
        if (containerRef.current && containerRef.current.measureInWindow) {
          containerRef.current.measureInWindow((x, y, width, height) => {
            const windowHeight = Dimensions.get("window").height;
            const topBoundary = y;
            const bottomBoundary = y + height;

            // Calculate visible height in window
            const visibleTop = Math.max(0, topBoundary);
            const visibleBottom = Math.min(windowHeight, bottomBoundary);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            const visibleRatio = height > 0 ? visibleHeight / height : 0;

            const isFullyOrMostlyVisible = visibleRatio >= 0.50;

            if (isFullyOrMostlyVisible) {
              if (!userPausedRef.current && player) {
                try {
                  const res = player.play();
                  if (res && typeof res.catch === "function") res.catch(() => {});
                  setPlaying(true);
                } catch (e) {}
              }
            } else {
              if (player) {
                try {
                  const res = player.pause();
                  if (res && typeof res.catch === "function") res.catch(() => {});
                  setPlaying(false);
                } catch (e) {}
              }
              userPausedRef.current = false;
              setUserPaused(false);
            }
          });
        }
      }, 350);
    }
    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [player]);

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  // Web Inline Video Configuration Guard:
  // Force playsinline, webkit-playsinline & pointer-events: none on HTML5 <video> elements
  // to prevent mobile Safari/Chrome native fullscreen video trigger on touch/scroll.
  useEffect(() => {
    if (Platform.OS === "web" && containerRef.current) {
      const elem = containerRef.current.node || containerRef.current;
      if (elem && typeof elem.querySelectorAll === "function") {
        const videos = elem.querySelectorAll("video");
        videos.forEach((v) => {
          v.setAttribute("playsinline", "true");
          v.setAttribute("webkit-playsinline", "true");
          v.setAttribute("x5-playsinline", "true");
          v.setAttribute("disablepictureinpicture", "true");
          v.controls = false;
          v.style.pointerEvents = "none";
          v.style.webkitUserSelect = "none";
          v.style.userSelect = "none";
        });
      }
    }
  }, [player, sourceUri]);

  function handleTouchStart(e) {
    if (Platform.OS === "web" && e?.nativeEvent) {
      const touch = e.nativeEvent.touches ? e.nativeEvent.touches[0] : e.nativeEvent;
      if (touch) {
        touchStartRef.current = { x: touch.clientX || 0, y: touch.clientY || 0, time: Date.now() };
      }
    }
  }

  function handleTapPress(e) {
    if (playerError) return;
    if (Platform.OS === "web" && e?.nativeEvent) {
      const touch = e.nativeEvent.changedTouches ? e.nativeEvent.changedTouches[0] : e.nativeEvent;
      if (touch && touchStartRef.current.time > 0) {
        const dx = Math.abs((touch.clientX || 0) - touchStartRef.current.x);
        const dy = Math.abs((touch.clientY || 0) - touchStartRef.current.y);
        const dt = Date.now() - touchStartRef.current.time;
        // If finger moved > 6px or press was held > 400ms, user is scrolling or dragging, NOT tapping!
        if (dx > 6 || dy > 6 || dt > 400) {
          return;
        }
      }
    }
    togglePlay();
  }

  function togglePlay() {
    if (!sourceUri || !player) return;
    const isCurrentlyPlaying = player.playing || playing;
    if (isCurrentlyPlaying) {
      try {
        player.pause();
      } catch (e) {}
      setPlaying(false);
      userPausedRef.current = true;
      setUserPaused(true);
    } else {
      try {
        player.play();
      } catch (e) {}
      setPlaying(true);
      userPausedRef.current = false;
      setUserPaused(false);
    }

    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 1200);
  }

  function toggleMute() {
    if (!player) return;
    const nextMuted = !muted;
    player.muted = nextMuted;
    setMuted(nextMuted);
  }

  const isActuallyPlaying = player?.playing || playing;

  return (
    <View
      ref={containerRef}
      style={[
        styles.videoMedia,
        frameKey === "square" && styles.videoMediaSquare,
        frameKey === "landscape" && styles.videoMediaLandscape,
        frameKey === "polaroid" && styles.videoMediaPolaroid,
        frameKey === "rounded" && styles.videoMediaRounded
      ]}
    >
      {sourceUri && !playerError ? (
        <VideoView
          player={player}
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          contentFit="cover"
          style={[styles.videoPlayerView, Platform.OS === "web" && { pointerEvents: "none" }]}
        />
      ) : posterUri ? (
        <Image source={{ uri: sanitizeImageUri(posterUri) }} style={styles.videoThumbImage} />
      ) : null}
      {!isActuallyPlaying && !playerError && posterUri && posterUri !== sourceUri ? (
        <Image source={{ uri: sanitizeImageUri(posterUri) }} style={styles.videoPosterImage} />
      ) : null}
      {playerError ? (
        <View style={styles.videoErrorBadge}>
          <Feather name="alert-triangle" size={14} color="#FFFFFF" />
          <Text numberOfLines={2} style={styles.videoErrorText}>Video can't be played on this device</Text>
        </View>
      ) : null}
      <LinearGradient colors={["rgba(8,7,28,0.04)", "rgba(8,7,28,0.78)"]} style={styles.videoShade} />
      <Pressable onPressIn={handleTouchStart} onPress={handleTapPress} style={styles.videoTapLayer} />
      <View style={styles.videoCopy}>
        <Text numberOfLines={1} style={styles.videoTitle}>{media.title || "Video Post"}</Text>
        <Text numberOfLines={1} style={styles.videoSmall}>{media.subtitle || "Last Class Community"}</Text>
      </View>

      {/* Auto-Hiding Play/Pause Icon Overlay */}
      {!playerError && (showControls || !isActuallyPlaying) ? (
        <Pressable onPressIn={handleTouchStart} onPress={handleTapPress} style={styles.playCircle}>
          <FontAwesome name={isActuallyPlaying ? "pause" : "play"} size={18} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <View style={styles.videoControlRow}>
        <Pressable onPress={toggleMute} style={styles.videoMiniControl}>
          <Feather name={muted ? "volume-x" : "volume-2"} size={15} color="#FFFFFF" />
        </Pressable>
        {onPreviewItem ? (
          <Pressable
            onPress={() => {
              onPreviewItem({
                type: "video",
                kind: "video",
                title: media.title || "Video Post",
                subtitle: media.subtitle || "Last Class Community",
                imageUrl: posterUri,
                videoUrl: sourceUri,
                fileUri: sourceUri
              });
            }}
            style={styles.videoMiniControl}
          >
            <Feather name="maximize-2" size={15} color="#FFFFFF" />
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            const targetUrl = sourceUri || posterUri;
            if (Platform.OS === "web" && typeof document !== "undefined") {
              const a = document.createElement("a");
              a.href = targetUrl;
              a.download = media.title || "video.mp4";
              a.target = "_blank";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              Alert.alert("Downloading 📥", "Video download initiated.");
            } else {
              Linking.openURL(targetUrl).catch(() => {});
              Alert.alert("Downloading 📥", "Opening video download link.");
            }
          }}
          style={styles.videoMiniControl}
        >
          <Feather name="download" size={15} color="#FFFFFF" />
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

function PostActions({ post, session, metrics = {}, onComment, onToggleLike, onSelectUser }) {
  const { theme } = useTheme();
  const targetPostId = post?.id || post?._id;
  const isLikedByMe = Boolean(
    post?.isLiked ||
    (Array.isArray(post?.likedBy) && post.likedBy.map(String).includes(String(session?.user?.id)))
  );
  const [liked, setLiked] = useState(isLikedByMe);
  const currentLikesCount = post?.metrics?.likes !== undefined ? post.metrics.likes : (post?.likes !== undefined ? post.likes : (metrics?.likes || 0));
  const [likesCount, setLikesCount] = useState(currentLikesCount);
  const postCommentCount = post?.metrics?.comments !== undefined ? post.metrics.comments : (post?.commentsList ? post.commentsList.length : (metrics?.comments || 0));
  const [commentsCount, setCommentsCount] = useState(postCommentCount);
  const [sharesCount, setSharesCount] = useState(metrics?.shares || 0);
  const [saved, setSaved] = useState(Boolean(post?.bookmarked || post?.userAction?.saved));

  useEffect(() => {
    setLiked(isLikedByMe);
  }, [isLikedByMe, targetPostId]);

  useEffect(() => {
    setLikesCount(currentLikesCount);
  }, [currentLikesCount, targetPostId]);

  useEffect(() => {
    setCommentsCount(postCommentCount);
  }, [postCommentCount, post?.metrics?.comments, post?.commentsList?.length]);

  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Animated scale for Clapping bounce animation
  const clapScaleAnim = useRef(new Animated.Value(1)).current;

  async function handleToggleClap() {
    if (!targetPostId) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));

    if (onToggleLike) {
      onToggleLike(targetPostId);
    }

    // Pop / bounce spring animation for clapping
    Animated.sequence([
      Animated.timing(clapScaleAnim, { toValue: 1.5, duration: 110, useNativeDriver: true }),
      Animated.spring(clapScaleAnim, { toValue: 1, friction: 3, tension: 150, useNativeDriver: true })
    ]).start();

    if (session?.token && targetPostId) {
      try {
        const res = await togglePostLike(session.token, targetPostId);
        if (res && typeof res.likes === "number") setLikesCount(res.likes);
        if (res && typeof res.isLiked === "boolean") setLiked(res.isLiked);
      } catch (e) {}
    }
  }

  async function handleToggleSave() {
    if (!targetPostId) return;
    const nextSaved = !saved;
    setSaved(nextSaved);

    if (session?.token && targetPostId) {
      try {
        const res = await toggleSavePost(session.token, targetPostId);
        if (res && typeof res.saved === "boolean") {
          setSaved(res.saved);
        }
      } catch (e) {}
    }
    Alert.alert(
      nextSaved ? "Post Saved" : "Post Removed",
      nextSaved ? "Added to your Saved Posts in Profile Settings!" : "Removed from Saved Posts."
    );
  }

  const postMedia = post?.media || {};
  const isVideo = Boolean(post?.videoUrl || postMedia.videoUrl || post?.mediaType === "video" || post?.kind === "video" || postMedia.kind === "video");
  const isDoc = Boolean(post?.isDocument || postMedia.documentUrl || post?.documentUrl || postMedia.kind === "document");
  const isJob = Boolean(post?.isJob || post?.postType === "job_news" || post?.jobData);
  const shareType = isJob ? "job" : isDoc ? "document" : isVideo ? "video" : "post";
  const targetId = post?.id || post?._id || "p1";
  const shareUrl = `https://app.thecodemunk.in/post/${targetId}`;

  const carouselImages = (Array.isArray(postMedia.carouselImages) && postMedia.carouselImages.length > 0)
    ? postMedia.carouselImages
    : (Array.isArray(post?.carouselImages) && post?.carouselImages.length > 0)
    ? post?.carouselImages
    : (Array.isArray(postMedia.images) && postMedia.images.length > 0)
    ? postMedia.images
    : (Array.isArray(post?.images) && post?.images.length > 0)
    ? post?.images
    : [];

  const rawMediaUrl = isVideo
    ? (postMedia.videoUrl || post?.videoUrl || postMedia.fileUri || post?.fileUri || "")
    : isDoc
    ? (postMedia.documentUrl || post?.documentUrl || postMedia.fileUri || "")
    : (postMedia.imageUrl || post?.imageUrl || carouselImages[0] || post?.jobData?.imageUrl || post?.jobData?.media?.imageUrl || postMedia.thumbnailUrl || post?.thumbnailUrl || "");

  const hasMediaUrl = typeof rawMediaUrl === "string" && /^https?:\/\//i.test(rawMediaUrl);
  const rawTitle = (post?.title || post?.text || post?.content || "Last Class Update")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const cleanTitle = rawTitle.length > 70 ? `${rawTitle.slice(0, 67)}...` : rawTitle;
  const authorName = post?.authorName || "Last Class Educator";

  // Sleek, professional message formatting
  const captionBody = `✨ ${cleanTitle}\n— by ${authorName} on Last Class`;
  const formattedShareMsg = `${captionBody}\n\n🔗 ${shareUrl}`;

  async function handleNativeShare() {
    setShareModalOpen(false);
    setSharesCount((prev) => prev + 1);
    try {
      await sharePostWithMedia({
        title: cleanTitle,
        authorName,
        targetId,
        mediaUrl: rawMediaUrl,
        images: carouselImages,
        isVideo,
        isDoc
      });
      if (session?.token && post?.id) {
        sharePost(session.token, post.id).catch(() => {});
      }
    } catch (e) {}
  }

  function handleShareWhatsApp() {
    setShareModalOpen(false);
    setSharesCount((prev) => prev + 1);
    if (session?.token && post?.id) {
      sharePost(session.token, post.id).catch(() => {});
    }
    sharePostWithMedia({
      title: cleanTitle,
      authorName,
      targetId,
      mediaUrl: rawMediaUrl,
      images: carouselImages,
      isVideo,
      isDoc
    }).catch(() => {
      const text = encodeURIComponent(formattedShareMsg);
      Linking.openURL(`whatsapp://send?text=${text}`).catch(() => {
        Linking.openURL(`https://api.whatsapp.com/send?text=${text}`).catch(() => {});
      });
    });
  }

  function handleShareFacebook() {
    setShareModalOpen(false);
    setSharesCount((prev) => prev + 1);
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(cleanTitle)}`;
    Linking.openURL(fbUrl).catch(() => {});
  }

  function handleCopyLink() {
    setShareModalOpen(false);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    }
    Alert.alert("Link Copied 🔗", "Post link copied to clipboard!");
  }

  function handleDirectShare(platform) {
    setShareModalOpen(false);
    if (platform === "whatsapp") {
      handleShareWhatsApp();
    } else if (platform === "telegram") {
      sharePostWithMedia({
        title: cleanTitle,
        authorName,
        targetId,
        mediaUrl: rawMediaUrl,
        images: carouselImages,
        isVideo,
        isDoc
      }).catch(() => {
        Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(captionBody)}`).catch(() => {});
      });
    } else if (platform === "linkedin") {
      Linking.openURL(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`).catch(() => {});
    } else if (platform === "twitter" || platform === "x") {
      Linking.openURL(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`✨ ${cleanTitle}\n— by ${authorName} on Last Class`)}`).catch(() => {});
    } else if (platform === "copy") {
      handleCopyLink();
    } else {
      handleNativeShare();
    }
  }

  function handleShareOption(option) {
    setShareModalOpen(false);
    Alert.alert("Link Copied", "Post URL copied to clipboard.");
  }

  const [likedByModalOpen, setLikedByModalOpen] = useState(false);

  const currentUserId = session?.user?.id || session?.user?._id;
  const currentUserName = session?.user?.name || "You";
  const currentUserAvatar = session?.user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";

  function cleanMemberName(u, idx) {
    if (!u) return post?.authorName || "Last Class Member";
    if (typeof u === "object") {
      const uid = String(u.id || u._id || "");
      if (uid && String(uid) === String(currentUserId)) {
        return currentUserName;
      }
      if (u.name && !/^[0-9a-fA-F]{18,}$/.test(u.name)) {
        return u.name;
      }
      if (u.username) return u.username;
      if (u.email) return u.email.split("@")[0];
    }
    if (typeof u === "string") {
      if (String(u) === String(currentUserId)) {
        return currentUserName;
      }
      if (post?.authorId && String(u) === String(post.authorId) && post.authorName) {
        return post.authorName;
      }
      if (!/^[0-9a-fA-F]{18,}$/.test(u) && !u.startsWith("usr_")) {
        return u;
      }
    }
    return post?.authorName || "Last Class Member";
  }

  let rawUsers = [];
  if (Array.isArray(post?.likedByUsers) && post.likedByUsers.length > 0) {
    rawUsers = post.likedByUsers.map((u, idx) => ({
      id: u.id || u._id || `user_${idx}`,
      name: cleanMemberName(u, idx),
      role: u.role || "Last Class Member",
      avatarUrl: u.avatarUrl || u.avatar || (String(u.id || u._id) === String(currentUserId) ? currentUserAvatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"),
      isMentor: Boolean(u.isMentor || u.role === "mentor")
    }));
  } else if (Array.isArray(post?.likedBy) && post.likedBy.length > 0) {
    rawUsers = post.likedBy
      .map((item, idx) => {
        if (typeof item === "object" && item !== null) {
          return {
            id: item.id || item._id || `user_${idx}`,
            name: cleanMemberName(item, idx),
            role: item.role || "Last Class Member",
            avatarUrl: item.avatarUrl || item.avatar || (String(item.id || item._id) === String(currentUserId) ? currentUserAvatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"),
            isMentor: Boolean(item.isMentor || item.role === "mentor")
          };
        } else if (typeof item === "string" && item.trim().length > 0) {
          const isMe = String(item) === String(currentUserId);
          const resolvedName = isMe ? currentUserName : (post?.authorId && String(item) === String(post.authorId) ? post.authorName : cleanMemberName(item, idx));
          return {
            id: item,
            name: resolvedName,
            role: isMe ? (session?.user?.role || "Last Class Member") : "Last Class Member",
            avatarUrl: isMe ? currentUserAvatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
            isMentor: false
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  let realLikedUsers = [...rawUsers];
  if (liked && currentUserId && !realLikedUsers.some((u) => String(u.id || u._id) === String(currentUserId))) {
    realLikedUsers.unshift({
      id: currentUserId,
      name: currentUserName,
      role: session?.user?.role || "Last Class Member",
      avatarUrl: currentUserAvatar,
      isMentor: Boolean(session?.user?.role === "mentor" || session?.user?.isMentor)
    });
  }

  const totalRealLikersCount = realLikedUsers.length;

  function formatCount(num) {
    if (!num || isNaN(num)) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(num);
  }

  const [isReposted, setIsReposted] = useState(Boolean(post?.isReposted));
  const [repostsCount, setRepostsCount] = useState(
    post?.metrics?.reposts !== undefined ? post.metrics.reposts : (post?.reposts !== undefined ? post.reposts : (Array.isArray(post?.repostedBy) ? post.repostedBy.length : 0))
  );

  function handleToggleRepost() {
    const nextState = !isReposted;
    setIsReposted(nextState);
    setRepostsCount((prev) => Math.max(0, prev + (nextState ? 1 : -1)));

    if (session?.token && targetPostId) {
      repostPost(session.token, targetPostId).catch((e) => {
        console.warn("Failed to sync repost with backend:", e);
      });
    }
  }

  return (
    <View style={{ width: "100%", marginTop: 4 }}>
      {/* Modern Feed Action Bar matching Instagram/Reels screenshot */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          {/* 1. Like Heart Icon + Count */}
          <Pressable onPress={handleToggleClap} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Animated.View style={{ transform: [{ scale: clapScaleAnim }] }}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={24}
                color={liked ? "#EF4444" : theme.text}
              />
            </Animated.View>
            <Text style={{ fontSize: 13.5, fontFamily: fonts.bold, color: theme.text }}>
              {formatCount(likesCount)}
            </Text>
          </Pressable>

          {/* 2. Comments Icon + Count */}
          <Pressable onPress={onComment} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name="chatbubble-outline" size={21} color={theme.text} />
            <Text style={{ fontSize: 13.5, fontFamily: fonts.bold, color: theme.text }}>
              {formatCount(commentsCount)}
            </Text>
          </Pressable>

          {/* 3. Repost / Retweet Icon + Count */}
          <Pressable onPress={handleToggleRepost} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <MaterialCommunityIcons
              name="repeat"
              size={22}
              color={isReposted ? "#10B981" : theme.text}
            />
            <Text style={{ fontSize: 13.5, fontFamily: fonts.bold, color: isReposted ? "#10B981" : theme.text }}>
              {formatCount(repostsCount)}
            </Text>
          </Pressable>

          {/* 4. Share Paper Plane Icon + Count */}
          <Pressable onPress={() => setShareModalOpen(true)} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Feather name="send" size={20} color={theme.text} />
            <Text style={{ fontSize: 13.5, fontFamily: fonts.bold, color: theme.text }}>
              {formatCount(sharesCount)}
            </Text>
          </Pressable>
        </View>

        {/* 5. Bookmark Save Icon (Far Right) */}
        <Pressable onPress={handleToggleSave} style={{ padding: 2 }}>
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={23}
            color={saved ? theme.primary : theme.text}
          />
        </Pressable>
      </View>

      {/* Real Overlapping Liked-By Avatar Stack Row */}
      {totalRealLikersCount > 0 ? (
        <TouchableOpacity
          onPress={() => setLikedByModalOpen(true)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 2,
            marginBottom: 4,
            paddingHorizontal: 14
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginRight: 8 }}>
            {realLikedUsers.slice(0, 3).map((u, idx) => (
              <Image
                key={`liked_avatar_${u.id || u._id || idx}_${idx}`}
                source={{ uri: u.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" }}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: theme.cardBg,
                  marginLeft: idx === 0 ? 0 : -6
                }}
              />
            ))}
          </View>
          <Text style={{ fontSize: 11.5, fontFamily: fonts.medium, color: theme.subtext, flex: 1 }} numberOfLines={1}>
            Liked by <Text style={{ fontFamily: fonts.bold, color: theme.text }}>{realLikedUsers[0]?.name}</Text>
            {totalRealLikersCount > 1 ? ` and ${totalRealLikersCount - 1} ${totalRealLikersCount - 1 === 1 ? "other" : "others"}` : ""}
          </Text>
          <Feather name="chevron-right" size={14} color={theme.subtext} />
        </TouchableOpacity>
      ) : null}

      {/* Liked By Bottom Sheet Modal */}
      <Modal visible={likedByModalOpen} transparent animationType="slide" onRequestClose={() => setLikedByModalOpen(false)}>
        <Pressable onPress={() => setLikedByModalOpen(false)} style={styles.modalOverlay}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalContent, { backgroundColor: theme.cardBg, maxHeight: "70%" }]}>
            <View style={styles.sheetHandle} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="hand-clap" size={20} color="#EAB308" />
                <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: theme.text }}>Liked & Clapped ({totalRealLikersCount})</Text>
              </View>
              <Pressable onPress={() => setLikedByModalOpen(false)} style={{ padding: 4 }}>
                <Feather name="x" size={20} color={theme.subtext} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              {realLikedUsers.map((likedUser, idx) => (
                <TouchableOpacity
                  key={`liked_sheet_row_${likedUser.id || likedUser._id || idx}_${idx}`}
                  onPress={() => {
                    setLikedByModalOpen(false);
                    if (onSelectUser) {
                      onSelectUser(likedUser);
                    }
                  }}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border
                  }}
                >
                  <Image
                    source={{ uri: likedUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" }}
                    style={{ width: 42, height: 42, borderRadius: 21, marginRight: 12, borderWidth: 1, borderColor: theme.border }}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: theme.text }}>{likedUser.name}</Text>
                      {likedUser.isMentor ? (
                        <View style={{ backgroundColor: theme.isDark ? "#1E1B4B" : "#FEF3C7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}>
                          <Text style={{ fontSize: 9.5, fontWeight: "700", color: "#D97706" }}>Mentor</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: theme.subtext, marginTop: 2 }}>{likedUser.role || "Last Class Member"}</Text>
                  </View>
                  <View style={{ backgroundColor: theme.badgeBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={{ fontSize: 11.5, fontFamily: fonts.bold, color: theme.primary }}>Profile</Text>
                    <Feather name="chevron-right" size={13} color={theme.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Social Share Sheet Modal (Clean Vector Icons, No Emojis) */}
      <Modal visible={shareModalOpen} transparent animationType="fade" onRequestClose={() => setShareModalOpen(false)}>
        <Pressable onPress={() => setShareModalOpen(false)} style={styles.modalOverlay}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
            <View style={styles.sheetHandle} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: theme.text }}>Share Content</Text>
              <Pressable onPress={() => setShareModalOpen(false)}>
                <Feather name="x" size={18} color={theme.subtext} />
              </Pressable>
            </View>
            <Text style={{ fontSize: 12, color: theme.subtext, marginBottom: 16 }}>Choose a platform to share this content</Text>

            <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 12 }}>
              <TouchableOpacity onPress={handleShareWhatsApp} activeOpacity={0.8} style={{ alignItems: "center", gap: 6 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#25D366", alignItems: "center", justifyContent: "center" }}>
                  <FontAwesome name="whatsapp" size={24} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 11, fontFamily: fonts.medium, color: theme.text }}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleShareFacebook} activeOpacity={0.8} style={{ alignItems: "center", gap: 6 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#1877F2", alignItems: "center", justifyContent: "center" }}>
                  <FontAwesome name="facebook" size={22} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 11, fontFamily: fonts.medium, color: theme.text }}>Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCopyLink} activeOpacity={0.8} style={{ alignItems: "center", gap: 6 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.isDark ? "#334155" : "#64748B", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="copy" size={20} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 11, fontFamily: fonts.medium, color: theme.text }}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleNativeShare} activeOpacity={0.8} style={{ alignItems: "center", gap: 6 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" }}>
                  <Feather name="share-2" size={20} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 11, fontFamily: fonts.medium, color: theme.text }}>More</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setShareModalOpen(false)} style={{ marginTop: 10, backgroundColor: theme.isDark ? "#1E263B" : "#F1F5F9", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: theme.subtext }}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function isPublicHttpUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  const lower = url.toLowerCase();
  if (lower.includes("localhost") || lower.includes("127.0.0.1") || lower.includes("192.168.") || lower.includes("10.0.") || lower.includes("172.16.")) return false;
  return true;
}

function MediaPreviewModal({ item, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const safeTopPadding = Platform.OS === "ios" ? 54 : Platform.OS === "android" ? (StatusBar.currentHeight || 28) + 8 : 12;
  const isDocument = item?.type === "document";
  const isVideo = item?.kind === "video" || item?.type === "video" || Boolean(item?.videoUrl) || item?.mimeType?.startsWith("video/");
  const videoSource = item?.videoUrl || item?.fileUri || item?.imageUrl || "";
  const docUri = item?.fileUri || item?.imageUrl || item?.documentUrl || "";
  const isImageDoc = Boolean(item?.imageUrl || item?.mimeType?.startsWith("image/") || (typeof docUri === "string" && (docUri.endsWith(".png") || docUri.endsWith(".jpg") || docUri.endsWith(".jpeg") || docUri.endsWith(".webp"))));

  async function handleDownloadMedia(mediaUrl, fileName = "download") {
    if (!mediaUrl) {
      Alert.alert("Download Error", "Media URL is missing.");
      return;
    }
    setDownloading(true);
    try {
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const a = document.createElement("a");
        a.href = mediaUrl;
        a.download = fileName || "media_file";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        Alert.alert("Downloading 📥", "File download initiated.");
      } else {
        await Linking.openURL(mediaUrl);
        Alert.alert("Downloading 📥", `Opening download link for ${fileName}`);
      }
      setDownloaded(true);
    } catch (err) {
      try {
        await Share.share({ url: mediaUrl, message: `Download Media: ${fileName} - ${mediaUrl}` });
      } catch (e) {
        Alert.alert("Media Link", mediaUrl);
      }
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    setDownloading(false);
    setDownloaded(false);

    if (item && isDocument && docUri && !isImageDoc) {
      const timer = setTimeout(() => {
        handleOpenDocument(item);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [item, docUri, isImageDoc, isDocument]);

  async function handleOpenDocument(target = item) {
    if (!target) return;
    const targetUri = target.fileUri || target.imageUrl || target.documentUrl || "";
    if (!targetUri) {
      Alert.alert("File Unavailable", "Document link is missing.");
      return;
    }

    setDownloading(true);
    try {
      if (Platform.OS === "web") {
        let viewUrl = targetUri;
        if (targetUri.startsWith("http://") || targetUri.startsWith("https://")) {
          const lower = targetUri.toLowerCase();
          if (lower.endsWith(".doc") || lower.endsWith(".docx") || target.mimeType?.includes("word")) {
            viewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(targetUri)}`;
          } else if (lower.endsWith(".pdf") || target.mimeType?.includes("pdf")) {
            viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(targetUri)}`;
          }
        }
        window.open(viewUrl, "_blank");
      } else if (targetUri.startsWith("http://") || targetUri.startsWith("https://")) {
        let viewUrl = targetUri;
        const lower = targetUri.toLowerCase();
        if (lower.endsWith(".doc") || lower.endsWith(".docx") || target.mimeType?.includes("word") || target.title?.toLowerCase().includes(".doc")) {
          viewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(targetUri)}`;
        } else if (lower.endsWith(".pdf") || target.mimeType?.includes("pdf") || target.title?.toLowerCase().includes(".pdf")) {
          viewUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(targetUri)}`;
        }
        await WebBrowser.openBrowserAsync(viewUrl);
      } else {
        if (Platform.OS === "ios") {
          await Share.share({ url: targetUri, title: target.title || "Document" });
        } else {
          try {
            await Linking.openURL(targetUri);
          } catch (e) {
            await Share.share({ message: `Document: ${target.title || "File"} - ${targetUri}` });
          }
        }
      }
      setDownloaded(true);
    } catch (error) {
      Alert.alert("Document Reader 📄", `${target.title || "Document"} is attached.`);
    } finally {
      setDownloading(false);
    }
  }

  if (!item) return null;

  return (
    <Modal animationType="slide" visible={Boolean(item)} onRequestClose={onClose} statusBarTranslucent={true}>
      {isDocument ? (
        <SafeAreaView style={styles.documentViewer}>
          <View style={styles.viewerHeader}>
            <View style={styles.viewerFileIcon}>
              <MaterialCommunityIcons name="file-pdf-box" size={22} color="#FF465F" />
            </View>
            <View style={styles.previewTitleWrap}>
              <Text numberOfLines={1} style={styles.previewTitle}>{item.title}</Text>
              <Text numberOfLines={1} style={styles.previewSub}>
                {item.fileSize || "Document"} | {item.authorName || "Last Class"}
              </Text>
            </View>
            <Pressable hitSlop={10} onPress={onClose} style={styles.previewClose}>
              <Feather name="x" size={20} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.documentToolbar}>
            <View style={styles.documentPreviewPill}>
              <Feather name="eye" size={13} color={colors.primary} />
              <Text style={styles.documentPreviewText}>In-App Viewer</Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {/* Open With Option */}
              <TouchableOpacity
                onPress={() => handleOpenDocument(item)}
                activeOpacity={0.8}
                style={[styles.documentButton, { backgroundColor: colors.primary, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10 }]}
              >
                <Feather name="external-link" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={[styles.documentButtonText, { fontSize: 11.5 }]}>Open With</Text>
              </TouchableOpacity>

              {/* Optional Share Option */}
              <TouchableOpacity
                onPress={() => {
                  const docShareUrl = `https://app.thecodemunk.in/document/${item.id || item._id || "doc1"}`;
                  Share.share({ url: docShareUrl, message: `Check out this document on Last Class: ${item.title || "File Attachment"}\n\nLink: ${docShareUrl}` }).catch(() => {});
                }}
                activeOpacity={0.8}
                style={[styles.documentButton, { backgroundColor: "rgba(100, 116, 139, 0.12)", borderWidth: 1, borderColor: "rgba(100, 116, 139, 0.25)", paddingVertical: 5, paddingHorizontal: 8, borderRadius: 10 }]}
              >
                <Feather name="share-2" size={13} color={colors.ink} style={{ marginRight: 3 }} />
                <Text style={[styles.documentButtonText, { color: colors.ink, fontSize: 11.5 }]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.documentCanvas}>
            <View style={styles.documentPage}>
              {isImageDoc && docUri ? (
                <Image resizeMode="contain" source={{ uri: sanitizeImageUri(docUri) }} style={styles.previewImage} />
              ) : Platform.OS === "web" && docUri ? (
                <iframe
                  src={
                    docUri.includes("drive.google.com/file/d/")
                      ? docUri.replace(/\/view(\?.*)?$/, "/preview").replace(/\/view\?usp=sharing/, "/preview")
                      : docUri.includes(".doc") || docUri.includes(".docx") || item.mimeType?.includes("word") || item.title?.toLowerCase().includes(".doc")
                      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(docUri)}`
                      : docUri.startsWith("blob:") || docUri.startsWith("data:") || docUri.endsWith(".pdf")
                      ? docUri
                      : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(docUri)}`
                  }
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="Document Reader"
                />
              ) : (
                <View style={styles.previewEmpty}>
                  <View style={styles.previewFileCard}>
                    <View style={styles.previewFileIcon}>
                      <MaterialCommunityIcons name="file-document-outline" size={54} color={colors.primary} />
                    </View>
                    <Text numberOfLines={2} style={styles.previewFileName}>{item.title || "Document"}</Text>
                    <Text numberOfLines={1} style={styles.previewEmptyText}>
                      {item.fileSize || "File Attachment"} {item.mimeType ? `| ${item.mimeType}` : ""}
                    </Text>

                    <View style={{ marginTop: 18, width: "100%" }}>
                      <TouchableOpacity
                        onPress={() => handleOpenDocument(item)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: colors.primary,
                          paddingVertical: 14,
                          paddingHorizontal: 18,
                          borderRadius: 14
                        }}
                      >
                        <Feather name="book-open" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>Open Document</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      ) : isVideo ? (
        <SafeAreaView style={styles.imageViewer}>
          <View style={styles.imagePreviewStage}>
            <VideoFeedPlayer media={{ ...item, videoUrl: videoSource, frameKey: "landscape" }} />
          </View>
          <View style={[styles.imageCaption, { paddingTop: safeTopPadding }]}>
            <View style={styles.imageCaptionCopy}>
              <Text numberOfLines={1} style={styles.imageCaptionTitle}>{item.title || "Video Preview"}</Text>
              <Text numberOfLines={1} style={styles.imageCaptionSub}>{item.subtitle || "Last Class Video Update"}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TouchableOpacity
                onPress={() => handleDownloadMedia(videoSource, item.title || "video.mp4")}
                style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Feather name="download" size={16} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>Download</Text>
              </TouchableOpacity>
              <Pressable hitSlop={12} onPress={onClose} style={styles.imageCloseButton}>
                <Feather name="x" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      ) : (
        <SafeAreaView style={styles.imageViewer}>
          <View style={styles.imagePreviewStage}>
            <Image resizeMode="contain" source={{ uri: sanitizeImageUri(item.imageUrl) }} style={styles.fullPreviewImage} />
          </View>
          <View style={[styles.imageCaption, { paddingTop: safeTopPadding }]}>
            <View style={styles.imageCaptionCopy}>
              <Text numberOfLines={1} style={styles.imageCaptionTitle}>{item.title || "Photo Attachment"}</Text>
              <Text numberOfLines={1} style={styles.imageCaptionSub}>{item.subtitle || "Last Class Photo Update"}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TouchableOpacity
                onPress={() => handleDownloadMedia(item.imageUrl, item.title || "photo.jpg")}
                style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Feather name="download" size={16} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>Download</Text>
              </TouchableOpacity>
              <Pressable hitSlop={12} onPress={onClose} style={styles.imageCloseButton}>
                <Feather name="x" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      )}
    </Modal>
  );
}

function renderFormattedCommentText(text, theme) {
  if (!text) return null;
  const regex = /(@[A-Za-z0-9_.\-]+)/g;
  const parts = text.split(regex);
  const textColor = theme?.text || "#181725";
  const tagColor = theme?.primary || "#3897F0";

  return (
    <Text style={[styles.commentText, { color: textColor }]}>
      {parts.map((part, index) => {
        if (part.match(regex)) {
          return (
            <Text key={index} style={{ color: tagColor, fontFamily: fonts.bold }}>
              {part}
            </Text>
          );
        }
        return <Text key={index} style={{ color: textColor }}>{part}</Text>;
      })}
    </Text>
  );
}

function CommentsBottomSheet({ session, post, onClose, onSelectUser, onCommentAdded }) {
  const { theme } = useTheme();
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(post?.commentsList || []);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const targetPostId = post?.id || post?._id;

  useEffect(() => {
    setCommentText("");
    setReplyingTo(null);
    if (Array.isArray(post?.commentsList) && post.commentsList.length > 0) {
      setComments(post.commentsList);
    }
    if (targetPostId) {
      loadComments(targetPostId);
    } else {
      setLoadingComments(false);
    }
  }, [targetPostId]);

  async function loadComments(postIdToUse) {
    const activeId = postIdToUse || targetPostId;
    if (!activeId) return;
    setLoadingComments(true);
    try {
      const res = await getPostComments(session?.token, activeId);
      if (res?.comments && Array.isArray(res.comments)) {
        setComments(res.comments);
      }
    } catch (e) {
      console.log("Failed to load comments:", e);
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
        const cId = String(c.id || c._id);
        const matchId = String(commentId);
        if (cId === matchId) {
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

    if (session?.token && targetPostId) {
      try {
        await toggleCommentLike(session.token, targetPostId, commentId);
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

  async function handleDeleteComment(commentId) {
    if (!commentId || !targetPostId) return;

    setComments((prev) =>
      prev
        .filter((c) => String(c.id || c._id) !== String(commentId))
        .map((c) => ({
          ...c,
          replies: Array.isArray(c.replies)
            ? c.replies.filter((r) => String(r.id || r._id) !== String(commentId))
            : []
        }))
    );

    if (post) {
      const curCount = post?.metrics?.comments !== undefined ? post.metrics.comments : (post?.commentsList ? post.commentsList.length : 1);
      const newCount = Math.max(0, curCount - 1);
      if (!post.metrics) post.metrics = { likes: 0, comments: 0, shares: 0 };
      post.metrics.comments = newCount;
      if (Array.isArray(post.commentsList)) {
        post.commentsList = post.commentsList.filter((c) => String(c.id || c._id) !== String(commentId));
      }
    }

    if (session?.token) {
      try {
        const res = await deletePostComment(session.token, targetPostId, commentId);
        if (res && typeof res.commentsCount === "number" && post && post.metrics) {
          post.metrics.comments = res.commentsCount;
        }
      } catch (e) {}
    }
  }

  async function submitComment() {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    const textToSend = commentText.trim();
    const currentReplyTarget = replyingTo;
    setCommentText("");
    setReplyingTo(null);

    const tempId = `c_temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const optimisticComment = {
      id: tempId,
      name: session?.user?.name || "You",
      avatarUrl: session?.user?.avatarUrl,
      text: textToSend,
      time: "Just now",
      likes: 0,
      replies: []
    };

    // Optimistic UI Update: add comment instantly
    if (currentReplyTarget) {
      setComments((prev) =>
        prev.map((c) => {
          const cId = String(c.id || c._id);
          const rId = String(currentReplyTarget.id || currentReplyTarget._id);
          if (cId === rId) {
            return {
              ...c,
              replies: [...(c.replies || []), optimisticComment]
            };
          }
          return c;
        })
      );
    } else {
      setComments((prev) => [optimisticComment, ...prev]);
    }

    if (post) {
      const curCount = post?.metrics?.comments !== undefined ? post.metrics.comments : (post?.commentsList ? post.commentsList.length : 0);
      const newCommentCount = curCount + 1;
      if (!post.metrics) post.metrics = { likes: 0, comments: 0, shares: 0 };
      post.metrics.comments = newCommentCount;
      if (onCommentAdded && targetPostId) {
        onCommentAdded(targetPostId, newCommentCount);
      }
    }

    try {
      if (session?.token && targetPostId) {
        const parentId = currentReplyTarget ? (currentReplyTarget.id || currentReplyTarget._id) : undefined;
        const res = await addPostComment(session.token, targetPostId, textToSend, parentId);

        if (res?.comment && (res.comment.id || res.comment._id)) {
          const realComment = res.comment;
          setComments((prev) =>
            prev.map((c) => {
              if (c.id === tempId) return realComment;
              if (Array.isArray(c.replies)) {
                return {
                  ...c,
                  replies: c.replies.map((r) => (r.id === tempId ? realComment : r))
                };
              }
              return c;
            })
          );
        }
      }
    } catch (err) {
      console.warn("Failed to sync comment with backend:", err);
    } finally {
      setSubmittingComment(false);
    }
  }

  if (!post) return null;

  return (
    <Modal animationType="slide" transparent visible={Boolean(post)} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.commentSheetShell}>
          <Pressable style={styles.commentBackdrop} onPress={onClose} />
          <View style={[styles.commentSheet, { backgroundColor: theme.cardBg }]}>
            <View style={styles.sheetHandle} />
            <View style={[styles.commentHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.commentTitle, { color: theme.text }]}>Comments</Text>
              <Text style={[styles.commentCount, { color: theme.subtext }]}>{comments.length}</Text>
              <Pressable hitSlop={10} onPress={onClose} style={styles.commentClose}>
                <Feather name="x" size={21} color={theme.text} />
              </Pressable>
            </View>

            <View style={{ flex: 1 }}>
              {loadingComments ? (
                <ActivityIndicator size="medium" color={theme.primary} style={{ marginVertical: 30 }} />
              ) : comments.length === 0 ? (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40, paddingHorizontal: 20 }}>
                  <Feather name="message-circle" size={36} color={theme.subtext} style={{ marginBottom: 8 }} />
                  <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: theme.text }}>No comments yet</Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: theme.subtext, textAlign: "center", marginTop: 2 }}>
                    Be the first to share your thoughts on this post!
                  </Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.commentList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                            <View style={[styles.commentBubble, { backgroundColor: theme.isDark ? "#1E263B" : "#F7F6FB" }]}>
                              <TouchableOpacity onPress={() => handleCommentUserClick(comment)} activeOpacity={0.8}>
                                <Text numberOfLines={1} style={[styles.commentName, { color: theme.text }]}>{authorName}</Text>
                              </TouchableOpacity>
                              {renderFormattedCommentText(comment.text, theme)}
                            </View>
                            <View style={styles.commentActions}>
                              <Text style={[styles.commentActionText, { color: theme.subtext }]}>{comment.time || "Just now"}</Text>
                              <Text style={[styles.commentActionText, { color: theme.subtext }]}>{comment.likes || 0} likes</Text>
                              <TouchableOpacity onPress={() => handleReplyComment(comment)}>
                                <Text style={[styles.commentActionText, { color: theme.primary, fontFamily: fonts.semiBold }]}>Reply</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteComment(commentId)}>
                                <Text style={[styles.commentActionText, { color: "#EF4444", fontFamily: fonts.medium }]}>Delete</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                          <Pressable hitSlop={8} onPress={() => handleToggleCommentLike(commentId)} style={styles.commentLike}>
                            <Ionicons name={comment.isLiked ? "heart" : "heart-outline"} size={16} color={comment.isLiked ? "#EAB308" : theme.subtext} />
                          </Pressable>
                        </View>

                        {/* Instagram-Style Nested Replies */}
                        {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                          <View style={{ paddingLeft: 42, borderLeftWidth: 1.5, borderLeftColor: theme.border, marginLeft: 18, marginTop: 4, gap: 8 }}>
                            {comment.replies.map((reply) => {
                              const replyId = reply.id || reply._id;
                              const replyAuthor = reply.name || reply.userName || "Learner";
                              return (
                                <View key={replyId} style={styles.commentRow}>
                                  <TouchableOpacity onPress={() => handleCommentUserClick(reply)} activeOpacity={0.8}>
                                    <Avatar name={replyAuthor} uri={reply.avatarUrl} size={28} />
                                  </TouchableOpacity>
                                  <View style={styles.commentBody}>
                                    <View style={[styles.commentBubble, { backgroundColor: theme.isDark ? "#1E263B" : "#F7F6FB" }]}>
                                      <TouchableOpacity onPress={() => handleCommentUserClick(reply)} activeOpacity={0.8}>
                                        <Text numberOfLines={1} style={[styles.commentName, { color: theme.text }]}>{replyAuthor}</Text>
                                      </TouchableOpacity>
                                      {renderFormattedCommentText(reply.text, theme)}
                                    </View>
                                    <View style={styles.commentActions}>
                                      <Text style={[styles.commentActionText, { color: theme.subtext }]}>{reply.time || "Just now"}</Text>
                                      <TouchableOpacity onPress={() => handleDeleteComment(replyId)}>
                                        <Text style={[styles.commentActionText, { color: "#EF4444", fontFamily: fonts.medium }]}>Delete</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {replyingTo && (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.isDark ? "#064E3B" : "#E8F5E9", paddingHorizontal: 12, paddingVertical: 6, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ fontSize: 11, color: theme.primary, fontFamily: fonts.semiBold }}>
                  Replying to @{replyingTo.name || replyingTo.userName || "Learner"}
                </Text>
                <Pressable onPress={() => { setReplyingTo(null); setCommentText(""); }}>
                  <Feather name="x" size={14} color={theme.primary} />
                </Pressable>
              </View>
            )}

            <View style={[styles.commentInputRow, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
              <Avatar name="You" size={34} />
              <TextInput
                placeholder="Add a comment..."
                placeholderTextColor={theme.subtext}
                style={[styles.commentInput, { backgroundColor: theme.isDark ? "#1E263B" : "#F8F7FC", color: theme.text }]}
                value={commentText}
                onChangeText={setCommentText}
              />
              <Pressable disabled={!commentText.trim() || submittingComment} onPress={submitComment} style={[styles.commentSend, (!commentText.trim() || submittingComment) && styles.commentSendDisabled]}>
                {submittingComment ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Feather name="send" size={17} color="#FFFFFF" />}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function LearnDashboard({ learn, user, onSelectUser }) {
  if (!learn) return <LoadingState />;
  const hero = learn.hero || {};
  const progressValue = Math.max(0, Math.min(100, hero.progressValue || user.progress || 0));

  return (
    <View style={styles.learnWrap}>
      <LinearGradient colors={["#0A6836", "#044324"]} style={styles.learnHero}>
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

      <Text style={styles.sectionTitle}>Explore Last Class</Text>
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

function CreatePostScreen({ config, draft, posting, user, uploadType, setUploadType, setDraft, onClose, onSubmit, onPreviewMedia }) {
  const { theme } = useTheme();
  const textLength = draft.text.length;
  const canSubmit = (Boolean(draft.text.trim()) || Boolean(draft.mediaUrl?.trim?.()) || (draft.carouselImages && draft.carouselImages.length > 0) || Boolean(draft.fileUri?.trim?.())) && !posting;
  const imagesList = (draft.carouselImages && draft.carouselImages.length > 0)
    ? draft.carouselImages
    : draft.mediaUrl.trim() ? [draft.mediaUrl.trim()] : [];
  const previewImage = imagesList[0] || draft.mediaUrl.trim();
  const hasDocumentPreview = uploadType === "document" && (draft.fileName.trim() || draft.fileSize.trim() || draft.fileUri?.trim?.() || previewImage);
  const hasMediaPreview = uploadType === "video" ? Boolean(draft.fileUri?.trim?.() || previewImage) : uploadType === "photo" && imagesList.length > 0;
  const previewCount = uploadType === "photo" ? imagesList.length : Number(Boolean(hasMediaPreview || hasDocumentPreview));
  const selectedFrameKey = uploadType === "video" && draft.frameKey === "none" ? "portrait" : draft.frameKey || "none";
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const mediaOptions = [
    { key: "photo", icon: "image", label: "Photo", color: theme.primary },
    { key: "document", icon: "file-document-outline", label: "Document", color: "#10B981" },
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

  async function fetchCurrentLocation() {
    setIsFetchingLocation(true);
    try {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const data = await res.json();
              if (data && data.address) {
                const city = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state_district || "";
                const country = data.address.country || "India";
                const locStr = city ? `${city}, ${country}` : country;
                setDraft((curr) => ({ ...curr, location: locStr, title: locStr }));
                Alert.alert("Location Detected", `Your current location: ${locStr}`);
              } else {
                const coordStr = `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
                setDraft((curr) => ({ ...curr, location: coordStr, title: coordStr }));
              }
            } catch (e) {
              setDraft((curr) => ({ ...curr, location: "Current Location", title: "Current Location" }));
            } finally {
              setIsFetchingLocation(false);
            }
          },
          (err) => {
            setIsFetchingLocation(false);
            promptManualLocation();
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        setIsFetchingLocation(false);
        promptManualLocation();
      }
    } catch (err) {
      setIsFetchingLocation(false);
      promptManualLocation();
    }
  }

  function promptManualLocation() {
    const presetLocations = ["Delhi, India", "Mumbai, India", "Bengaluru, India", "Hyderabad, India", "Remote / Online"];
    if (Platform.OS === "web") {
      const choice = typeof window !== "undefined" && window.prompt(
        "Enter or select location:\n(Options: Delhi, India / Mumbai, India / Bengaluru, India / Remote / Online)",
        draft.location || "Delhi, India"
      );
      if (choice !== null && choice !== undefined) {
        setDraft((curr) => ({ ...curr, location: choice.trim(), title: choice.trim() }));
      }
    } else {
      Alert.alert(
        "Select Location",
        "Choose location for your post:",
        [
          { text: "Detect Live Location", onPress: fetchCurrentLocation },
          ...presetLocations.map((loc) => ({
            text: loc,
            onPress: () => setDraft((curr) => ({ ...curr, location: loc, title: loc }))
          })),
          { text: "Clear Location", style: "destructive", onPress: () => setDraft((curr) => ({ ...curr, location: "", title: "" })) },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  }

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
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/rtf",
            "application/zip",
            "application/vnd.rar",
            "application/x-7z-compressed",
            "text/*",
            "image/*",
            "video/*"
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

      const mediaTypeSetting = uploadType === "video"
        ? (ImagePicker.MediaTypeOptions?.Videos || ImagePicker.MediaTypeOptions?.All || "videos")
        : (ImagePicker.MediaTypeOptions?.Images || "images");

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        allowsMultipleSelection: uploadType === "photo",
        selectionLimit: 10,
        mediaTypes: mediaTypeSetting,
        quality: 0.7,
        base64: true,
        videoMaxDuration: 60
      });

      if (result.canceled) return;

      const assets = result.assets || [];
      if (assets.length === 0) return;

      const selectedUris = assets.map((a) => a.uri).filter(Boolean);
      const firstAsset = assets[0];
      let previewUri = firstAsset.uri;

      if (uploadType === "video") {
        previewUri = "";
        try {
          const thumbnail = await VideoThumbnails.getThumbnailAsync(firstAsset.uri, { time: 1000 });
          previewUri = thumbnail.uri || "";
        } catch (error) {
          previewUri = "";
        }
      }

      setDraft((current) => {
        const existing = current.carouselImages || [];
        const combined = uploadType === "photo"
          ? Array.from(new Set([...existing, ...selectedUris]))
          : selectedUris;
        return {
          ...current,
          mediaUrl: uploadType === "video" ? (previewUri || firstAsset.uri) : (combined[0] || previewUri),
          carouselImages: combined,
          fileName: firstAsset.fileName || current.fileName,
          fileSize: formatFileSize(firstAsset.fileSize) || current.fileSize,
          fileUri: uploadType === "video" ? firstAsset.uri : "",
          mimeType: firstAsset.mimeType || (uploadType === "video" ? "video/mp4" : "image/jpeg")
        };
      });
    } catch (error) {
      Alert.alert("Upload failed", "Could not select media. Please try again.");
    }
  }

  function removeImageAtIndex(idx) {
    setDraft((current) => {
      const remaining = (current.carouselImages || []).filter((_, i) => i !== idx);
      return {
        ...current,
        carouselImages: remaining,
        mediaUrl: remaining[0] || ""
      };
    });
  }

  function removeAttachedMedia() {
    setDraft((current) => ({ ...current, mediaUrl: "", carouselImages: [], fileName: "", fileSize: "", fileUri: "", mimeType: "", frameKey: "none" }));
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={[styles.createScreen, { backgroundColor: theme.bg }]}>
        {/* Standardized App Header (iOS/Samsung Flagship Architecture) */}
        <View style={[styles.header, { backgroundColor: theme.cardBg, borderBottomColor: theme.border, position: "relative", justifyContent: "center", minHeight: 48 }]}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              {
                position: "absolute",
                left: 14,
                top: 10,
                zIndex: 10,
                padding: 4,
                flexDirection: "row",
                alignItems: "center"
              },
              pressed && styles.pressed
            ]}
          >
            <Feather name="chevron-left" size={24} color={theme.text} />
          </Pressable>

          <View style={{ position: "absolute", left: 0, right: 0, alignItems: "center", justifyContent: "center" }} pointerEvents="none">
            <Text style={[styles.screenTitle, { color: theme.text, textAlign: "center" }]}>{config?.title || "Create Post"}</Text>
          </View>

          <View style={{ position: "absolute", right: 14, top: 9, zIndex: 10 }}>
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={!canSubmit || posting}
              onPress={onSubmit}
              style={[
                {
                  backgroundColor: theme.primary,
                  paddingHorizontal: 18,
                  paddingVertical: 7,
                  borderRadius: 20,
                  elevation: 2,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  opacity: (!canSubmit || posting) ? 0.5 : 1
                }
              ]}
            >
              <Text style={{ color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 13 }}>{posting ? "..." : "Post"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.createScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.createComposerCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.createUserRow}>
              <Avatar name={user?.name} uri={user?.avatarUrl} size={42} />
              <View style={styles.createUserCopy}>
                <Text numberOfLines={1} style={[styles.createUserName, { color: theme.text }]}>{user?.name || "Last Class Learner"}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <View style={[styles.audiencePill, { backgroundColor: theme.isDark ? "#1E263B" : "#F1EDFF" }]}>
                    <Feather name="globe" size={11} color={theme.primary} />
                    <Text style={[styles.audienceText, { color: theme.primary }]}>Public</Text>
                  </View>

                  <TouchableOpacity
                    onPress={fetchCurrentLocation}
                    disabled={isFetchingLocation}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: theme.isDark ? "#1E263B" : (draft.location ? "#EEF2FF" : "#F4F3FA"),
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: theme.border
                    }}
                  >
                    {isFetchingLocation ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Ionicons name="location-sharp" size={12} color={draft.location ? theme.primary : theme.subtext} />
                    )}
                    <Text style={{ fontSize: 11, fontWeight: "600", color: draft.location ? theme.primary : theme.subtext }}>
                      {isFetchingLocation ? "Fetching..." : (draft.location || "Add Location")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={[styles.createTextBox, { backgroundColor: theme.inputBg || (theme.isDark ? "#131927" : "#F9FAFE"), borderColor: theme.border }]}>
              <TextInput
                multiline
                maxLength={2200}
                placeholder="Write a caption..."
                placeholderTextColor={theme.subtext || "#94A3B8"}
                style={[styles.createTextArea, { color: theme.text }]}
                value={draft.text}
                onChangeText={(text) => setDraft((current) => ({ ...current, text }))}
              />
              <Text style={[styles.charCount, { color: theme.subtext }]}>{textLength}/2200</Text>
            </View>

            <View style={[styles.mediaModeRow, { borderTopColor: theme.border }]}>
              {mediaOptions.map((item) => {
                const active = uploadType === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setUploadType(item.key)}
                    style={[
                      styles.mediaModeButton,
                      { backgroundColor: theme.isDark ? "#131927" : "#F9FAFE", borderColor: theme.border },
                      active && { backgroundColor: theme.isDark ? "#064E3B" : "#F0ECFF", borderColor: theme.primary }
                    ]}
                  >
                    <View style={[styles.mediaModeIcon, { backgroundColor: `${item.color}18` }]}>
                      <MaterialCommunityIcons name={item.icon} size={18} color={active ? theme.primary : item.color} />
                    </View>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.mediaModeText, { color: theme.subtext }, active && { color: theme.primary }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.createPanel, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.panelTitleRow}>
              <Text style={[styles.createSectionTitle, { color: theme.text }]}>Media Preview</Text>
              <Text style={[styles.panelCounter, { color: theme.subtext }]}>{previewCount}/10</Text>
            </View>
            <ScrollView horizontal contentContainerStyle={styles.previewPickerRow} showsHorizontalScrollIndicator={false}>
              {uploadType === "photo" && imagesList.length > 0 ? (
                imagesList.map((imgUri, idx) => (
                  <CreateMediaPreview
                    key={`${imgUri}-${idx}`}
                    imageUrl={imgUri}
                    label={`Image ${idx + 1}`}
                    onRemove={() => removeImageAtIndex(idx)}
                    type="image"
                    frameKey={selectedFrameKey}
                    onPress={() => {
                      onPreviewMedia?.({
                        type: "photo",
                        kind: "photo",
                        imageUrl: imgUri,
                        title: `Image ${idx + 1} Preview`
                      });
                    }}
                  />
                ))
              ) : uploadType === "video" && hasMediaPreview ? (
                <CreateMediaPreview
                  imageUrl={previewImage}
                  label="00:30"
                  onRemove={removeAttachedMedia}
                  type="video"
                  frameKey={selectedFrameKey}
                  videoUri={draft.fileUri.trim()}
                  onPress={() => {
                    onPreviewMedia?.({
                      type: "video",
                      kind: "video",
                      imageUrl: previewImage,
                      videoUrl: draft.fileUri.trim(),
                      title: "Video Preview"
                    });
                  }}
                />
              ) : null}
              {hasDocumentPreview ? (
                <CreateMediaPreview
                  fileSize={draft.fileSize.trim()}
                  imageUrl={previewImage}
                  onRemove={removeAttachedMedia}
                  type="document"
                  label={draft.fileName.trim() || "Document"}
                  onPress={() => {
                    onPreviewMedia?.({
                      type: "document",
                      kind: "document",
                      imageUrl: previewImage,
                      fileUri: draft.fileUri,
                      title: draft.fileName.trim() || "Document Preview"
                    });
                  }}
                />
              ) : null}
              <Pressable onPress={attachSelectedMedia} style={[styles.addMoreCard, { backgroundColor: theme.isDark ? "#131927" : "#FFFFFF", borderColor: theme.border }]}>
                <Feather name="plus" size={22} color={theme.primary} />
                <Text numberOfLines={2} style={[styles.addMoreText, { color: theme.primary }]}>{previewCount ? "+ Add" : uploadLabel}</Text>
              </Pressable>
            </ScrollView>
          </View>

          {uploadType === "photo" || uploadType === "video" ? (
            <View style={[styles.createPanel, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.createSectionTitle, { color: theme.text }]}>{uploadType === "video" ? "Frame (Videos)" : "Crop & Frame (Images)"}</Text>
              {hasMediaPreview ? (
                <ScrollView horizontal contentContainerStyle={styles.frameRow} showsHorizontalScrollIndicator={false}>
                  {frameOptions.map((item) => {
                    const active = selectedFrameKey === item.key;
                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => {
                          setFramePreview(item);
                          setDraft((current) => ({ ...current, frameKey: item.key }));
                        }}
                        style={[styles.frameOption, active && styles.frameOptionActive]}
                      >
                        <View style={[styles.frameThumb, { backgroundColor: theme.isDark ? "#131927" : "#F5F4FA", borderColor: theme.border }, active && { borderColor: theme.primary, borderWidth: 1.5 }]}>
                          {item.icon ? (
                            <Feather name={item.icon} size={22} color={theme.primary} />
                          ) : uploadType === "video" && !previewImage ? (
                            <View style={styles.frameVideoThumb}>
                              <FontAwesome name="play" size={14} color={theme.primary} />
                            </View>
                          ) : (
                            <Image source={{ uri: previewImage }} style={styles.frameImage} />
                          )}
                        </View>
                        <Text numberOfLines={1} style={[styles.frameLabel, { color: theme.subtext }]}>{item.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={[styles.emptyFrameState, { backgroundColor: theme.isDark ? "#131927" : "#F8F7FC", borderColor: theme.border }]}>
                  <Feather name={uploadType === "video" ? "video" : "image"} size={20} color={theme.primary} />
                  <Text style={[styles.emptyFrameText, { color: theme.subtext }]}>
                    {uploadType === "video"
                      ? "Frame options for your video will appear here after uploading."
                      : "Frame options for your image will appear here after uploading."}
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          <View style={[styles.createPanel, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={[styles.createSectionTitle, { color: theme.text }]}>Add Details</Text>
              <TouchableOpacity
                onPress={fetchCurrentLocation}
                disabled={isFetchingLocation}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.isDark ? "#1E263B" : "#EEF2FF", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}
              >
                {isFetchingLocation ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Ionicons name="location-sharp" size={14} color={theme.primary} />
                )}
                <Text style={{ fontSize: 11, fontWeight: "700", color: theme.primary }}>
                  {isFetchingLocation ? "Locating..." : "Detect Location"}
                </Text>
              </TouchableOpacity>
            </View>
            <DetailInputRow icon="map-pin" label="Location" placeholder="Add location" value={draft.title} onChangeText={(title) => setDraft((current) => ({ ...current, title, location: title }))} />
            <DetailInputRow icon="hash" label="Hashtags" placeholder="Add hashtags" value={draft.tags} onChangeText={(tags) => setDraft((current) => ({ ...current, tags }))} autoCapitalize="none" />
            <DetailInputRow icon="users" label="Audience" placeholder="Everyone" value={draft.mentions} onChangeText={(mentions) => setDraft((current) => ({ ...current, mentions }))} autoCapitalize="none" />
            {uploadType === "document" ? (
              <View style={styles.documentMetaRow}>
                <TextInput
                  placeholder="File name"
                  placeholderTextColor={theme.subtext || "#86839B"}
                  style={[styles.createInput, styles.inlineInput, { backgroundColor: theme.inputBg || (theme.isDark ? "#131927" : "#F8F7FC"), color: theme.text, borderColor: theme.border }]}
                  value={draft.fileName}
                  onChangeText={(fileName) => setDraft((current) => ({ ...current, fileName }))}
                />
                <TextInput
                  placeholder="Size"
                  placeholderTextColor={theme.subtext || "#86839B"}
                  style={[styles.createInput, styles.inlineInput, { backgroundColor: theme.inputBg || (theme.isDark ? "#131927" : "#F8F7FC"), color: theme.text, borderColor: theme.border }]}
                  value={draft.fileSize}
                  onChangeText={(fileSize) => setDraft((current) => ({ ...current, fileSize }))}
                />
              </View>
            ) : null}
          </View>

          <Pressable style={[styles.guidelinesCard, { backgroundColor: theme.isDark ? "#1E263B" : "#F0EDFF", borderColor: theme.border }]}>
            <View style={[styles.guidelineIcon, { backgroundColor: theme.isDark ? "#064E3B" : "#E2D9FF" }]}>
              <Feather name="shield" size={20} color={theme.primary} />
            </View>
            <View style={styles.guidelineCopy}>
              <Text style={[styles.guidelineTitle, { color: theme.text }]}>Community Guidelines</Text>
              <Text style={[styles.guidelineText, { color: theme.subtext }]}>Be respectful and follow Last Class community guidelines.</Text>
            </View>
            <Feather name="chevron-right" size={20} color={theme.subtext} />
          </Pressable>
        </ScrollView>
        <FramePreviewModal
          frame={framePreview}
          frames={frameOptions}
          imageUrl={previewImage}
          mediaType={uploadType}
          selectedKey={selectedFrameKey}
          videoUri={uploadType === "video" ? draft.fileUri.trim() : ""}
          onSelect={(item) => setFramePreview(item)}
          onApply={(key) => {
            setDraft((current) => ({ ...current, frameKey: key }));
            setFramePreview(null);
          }}
          onClose={() => setFramePreview(null)}
        />
      </View>
    </SafeAreaView>
  );
}

function FramePreviewModal({ frame, frames, imageUrl, mediaType, selectedKey, videoUri, onApply, onClose, onSelect }) {
  const { theme } = useTheme();
  if (!frame || (!imageUrl && !videoUri)) return null;
  const isVideo = mediaType === "video";

  return (
    <Modal animationType="fade" transparent visible={Boolean(frame)} onRequestClose={onClose}>
      <View style={styles.frameModalBackdrop}>
        <Pressable style={styles.frameModalDim} onPress={onClose} />
        <View style={[styles.frameModalSheet, { backgroundColor: theme.cardBg, borderColor: theme.border, borderWidth: 1 }]}>
          <View style={styles.frameModalHeader}>
            <View>
              <Text style={[styles.frameModalTitle, { color: theme.text }]}>Frame Preview</Text>
              <Text style={[styles.frameModalSub, { color: theme.subtext }]}>Post me {isVideo ? "video" : "image"} aise dikhegi</Text>
            </View>
            <Pressable onPress={onClose} style={[styles.frameModalClose, { backgroundColor: theme.badgeBg }]}>
              <Feather name="x" size={22} color={theme.text} />
            </Pressable>
          </View>

          <View style={[styles.framePreviewStage, { backgroundColor: theme.inputBg || (theme.isDark ? "#131927" : "#F7F6FC") }]}>
            <View
              style={[
                styles.framePreviewCanvas,
                { backgroundColor: theme.cardBg },
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
                <Image resizeMode={frame.key === "original" || frame.key === "none" ? "contain" : "cover"} source={{ uri: sanitizeImageUri(imageUrl) }} style={styles.framePreviewImage} />
              )}
            </View>
          </View>

          <ScrollView horizontal contentContainerStyle={styles.frameModalOptions} showsHorizontalScrollIndicator={false}>
            {frames.map((item) => {
              const active = item.key === frame.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => onSelect(item)}
                  style={[
                    styles.frameModalOption,
                    { backgroundColor: theme.isDark ? "#1E263B" : "#F7F6FC", borderColor: theme.border },
                    active && [styles.frameModalOptionActive, { backgroundColor: theme.badgeBg, borderColor: theme.primary }]
                  ]}
                >
                  <Text numberOfLines={1} style={[styles.frameModalOptionText, { color: theme.subtext }, active && { color: theme.primary, fontFamily: fonts.bold }]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable onPress={() => onApply(frame.key || selectedKey)} style={[styles.frameApplyButton, { backgroundColor: theme.primary }]}>
            <Text style={styles.frameApplyText}>Apply Frame</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function CreateMediaPreview({ type, imageUrl, videoUri, label, fileSize, onRemove, onPress, frameKey = "none" }) {
  const isPolaroid = frameKey === "polaroid";
  const isRounded = frameKey === "rounded";

  let cardStyle = { width: 140, height: 140 };
  if (frameKey === "square") cardStyle = { width: 140, height: 140 };
  else if (frameKey === "portrait") cardStyle = { width: 130, height: 162.5 };
  else if (frameKey === "landscape") cardStyle = { width: 180, height: 101.25 };
  else if (isPolaroid) cardStyle = { width: 140, height: 170, backgroundColor: "#FFFFFF", padding: 6, paddingBottom: 22, borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0" };
  else if (isRounded) cardStyle = { width: 140, height: 140, borderRadius: 24, overflow: "hidden" };

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.createPreviewCard,
        cardStyle
      ]}
    >
      {type === "image" ? (
        <Image
          source={{ uri: sanitizeImageUri(imageUrl) }}
          style={[styles.createPreviewImage, isRounded && { borderRadius: 18 }, isPolaroid && { borderRadius: 4 }]}
          resizeMode="cover"
        />
      ) : type === "document" ? (
        imageUrl ? (
          <Image source={{ uri: sanitizeImageUri(imageUrl) }} style={styles.createPreviewImage} resizeMode="cover" />
        ) : (
          <View style={styles.documentUploadPreview}>
            <View style={styles.documentUploadIcon}>
              <MaterialCommunityIcons name="file-document-outline" size={28} color="#00A86B" />
            </View>
            <Text numberOfLines={2} style={styles.documentUploadName}>{label}</Text>
            {fileSize ? <Text numberOfLines={1} style={styles.documentUploadSize}>{fileSize}</Text> : null}
          </View>
        )
      ) : (
        <VideoPreviewSurface videoUri={videoUri} imageUrl={imageUrl} />
      )}
      <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.62)"]} style={styles.createPreviewOverlay}>
        <Text numberOfLines={1} style={styles.createPreviewLabel}>{type === "document" ? "Document" : label}</Text>
        <View style={styles.cropIcon}>
          <Feather name="eye" size={16} color="#FFFFFF" />
        </View>
      </LinearGradient>
      <Pressable onPress={onRemove} style={styles.removeMediaButton}>
        <Feather name="x" size={18} color="#FFFFFF" />
      </Pressable>
    </Pressable>
  );
}

function VideoPreviewSurface({ videoUri, imageUrl }) {
  const sourceUri = videoUri || imageUrl || "";
  const player = useVideoPlayer(sourceUri ? { uri: sourceUri } : null, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = true;
    videoPlayer.pause();
  });

  return (
    <LinearGradient colors={["#343148", "#18162B"]} style={styles.createVideoPreview}>
      {sourceUri ? (
        <VideoView player={player} nativeControls={false} contentFit="cover" style={styles.createPreviewImage} />
      ) : imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.createPreviewImage} />
      ) : null}
      <View style={styles.videoPlayButton}>
        <FontAwesome name="play" size={14} color="#FFFFFF" />
      </View>
    </LinearGradient>
  );
}

function DetailInputRow({ icon, label, placeholder, value, onChangeText, autoCapitalize }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.detailRow, { backgroundColor: theme.inputBg || (theme.isDark ? "#131927" : "#F9FAFE"), borderColor: theme.border }]}>
      <View style={[styles.detailIcon, { backgroundColor: theme.isDark ? "#1E263B" : "#F0ECFF" }]}>
        <Feather name={icon} size={16} color={theme.primary} />
      </View>
      <Text style={[styles.detailLabel, { color: theme.text }]}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.subtext || "#64748B"}
        style={[styles.detailInput, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function ActionDock({ user, open, setOpen, onAction, tabs, activeTab, setActiveTab }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(6, insets?.bottom || 0);

  return (
    <View style={[styles.bottomDock, Platform.OS === "web" ? { position: "fixed", bottom: 10 } : { bottom: safeBottom }]}>
      <View style={styles.fabRow}>
        <Pressable onPress={() => onAction("post")} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
          <LinearGradient colors={[theme.fabBg || theme.primary, theme.primaryDark || "#044324"]} style={styles.fabGradient}>
            <Feather name="plus" size={22} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>

      <View style={[styles.floatingNavCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        {tabs.map(({ key, icon }) => {
          const active = activeTab === key;
          let iconName = icon;
          if (key === "Home") iconName = "home";
          if (key === "Learn") iconName = "compass";
          if (key === "Community") iconName = "users";
          if (key === "Doubts") iconName = "message-circle";
          if (key === "Profile") iconName = "user";

          const activeColor = theme.primary;
          const inactiveColor = theme.subtext;

          return (
            <Pressable key={key} onPress={() => setActiveTab(key)} style={({ pressed }) => [styles.tabItem, pressed && styles.pressed]}>
              {key === "Profile" && user?.avatarUrl ? (
                <View style={{ width: 23, height: 23, borderRadius: 12, borderWidth: active ? 2 : 0, borderColor: activeColor, padding: 1, justifyContent: "center", alignItems: "center" }}>
                  <Image source={{ uri: user.avatarUrl }} style={{ width: "100%", height: "100%", borderRadius: 12 }} />
                </View>
              ) : (
                <Feather name={iconName} size={21} color={active ? activeColor : inactiveColor} />
              )}
              <Text numberOfLines={1} style={[styles.tabLabel, { color: active ? activeColor : inactiveColor }, active && styles.tabLabelActive]}>{key}</Text>
              {active ? <View style={[styles.activeTabDot, { backgroundColor: activeColor }]} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DrawerFeatureModal({ feature, onClose, user }) {
  const { theme } = useTheme();
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
  const modalSurface = { backgroundColor: theme.cardBg, borderColor: theme.border };
  const softSurface = { backgroundColor: theme.isDark ? theme.inputBg || "#131927" : "#F4F3FB", borderColor: theme.border };
  const premiumGradient = theme.isDark ? ["#064E26", "#111827"] : ["#0A6836", "#044324"];

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
      <SafeAreaView style={[styles.modalSafeArea, { backgroundColor: theme.bg }]}>
        <View style={[styles.modalHeader, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
          <Pressable hitSlop={10} onPress={onClose} style={[styles.modalCloseBtn, softSurface]}>
            <Feather name="arrow-left" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.modalTitleText, { color: theme.text }]}>{feature}</Text>
          <Pressable hitSlop={10} onPress={onClose} style={[styles.modalCloseBtn, softSurface]}>
            <Feather name="x" size={22} color={theme.text} />
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
                    style={[styles.leaveNavTab, softSurface, activeLeaveTab === tab && styles.leaveNavTabActive]}
                  >
                    <Text style={[styles.leaveNavText, { color: theme.subtext }, activeLeaveTab === tab && styles.leaveNavTextActive]}>{tab}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {activeLeaveTab === "Leave Balance" || activeLeaveTab === "My Leaves" ? (
                <View style={styles.leaveMetricsGrid}>
                  <View style={[styles.leaveCard, modalSurface, { borderLeftColor: "#7D45EA" }]}>
                    <Text style={[styles.leaveCardVal, { color: theme.text }]}>8</Text>
                    <Text style={[styles.leaveCardLbl, { color: theme.subtext }]}>Casual Leaves</Text>
                  </View>
                  <View style={[styles.leaveCard, modalSurface, { borderLeftColor: "#2E7D32" }]}>
                    <Text style={[styles.leaveCardVal, { color: theme.text }]}>5</Text>
                    <Text style={[styles.leaveCardLbl, { color: theme.subtext }]}>Sick Leaves</Text>
                  </View>
                  <View style={[styles.leaveCard, modalSurface, { borderLeftColor: "#E7A900" }]}>
                    <Text style={[styles.leaveCardVal, { color: theme.text }]}>12</Text>
                    <Text style={[styles.leaveCardLbl, { color: theme.subtext }]}>Earned Leaves</Text>
                  </View>
                </View>
              ) : null}

              {activeLeaveTab === "Apply for Leave" ? (
                <View style={[styles.applyLeaveBox, modalSurface]}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>Leave Reason / Purpose</Text>
                  <TextInput
                    placeholder="Enter reason for leave..."
                    placeholderTextColor={theme.subtext}
                    value={leaveReason}
                    onChangeText={setLeaveReason}
                    style={[styles.formInput, softSurface, { color: theme.text }]}
                    multiline
                  />
                  <Text style={[styles.formLabel, { color: theme.text }]}>Number of Days</Text>
                  <TextInput
                    placeholder="1"
                    placeholderTextColor={theme.subtext}
                    keyboardType="number-pad"
                    value={leaveDays}
                    onChangeText={setLeaveDays}
                    style={[styles.formInputSingle, softSurface, { color: theme.text }]}
                  />
                  <Pressable onPress={handleApplyLeave} style={styles.submitLeaveBtn}>
                    <Text style={styles.submitLeaveText}>Submit Application</Text>
                  </Pressable>
                </View>
              ) : null}

              {activeLeaveTab === "My Leaves" || activeLeaveTab === "Leave Requests" ? (
                <View style={styles.leaveListSection}>
                  <Text style={[styles.subSectionTitle, { color: theme.text }]}>Recent Applications</Text>
                  {appliedLeaves.map((item) => (
                    <View key={item.id} style={[styles.leaveRecordCard, modalSurface]}>
                      <View style={styles.leaveRecordTop}>
                        <Text style={[styles.leaveRecordType, { color: theme.text }]}>{item.type}</Text>
                        <View style={[styles.statusBadge, item.status === "Approved" ? styles.statusApproved : styles.statusPending]}>
                          <Text style={styles.statusBadgeText}>{item.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.leaveRecordDates}>{item.dates} ({item.days})</Text>
                      <Text style={[styles.leaveRecordReason, { color: theme.subtext }]}>Reason: {item.reason}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {activeLeaveTab === "Leave Calendar" ? (
                <View style={[styles.calendarMockCard, modalSurface]}>
                  <MaterialCommunityIcons name="calendar-month" size={44} color={colors.primary} />
                  <Text style={[styles.calendarTitle, { color: theme.text }]}>Academic Calendar 2026</Text>
                  <Text style={[styles.calendarSub, { color: theme.subtext }]}>Holidays: Independence Day (15 Aug), Diwali (1 Nov), New Year (1 Jan)</Text>
                </View>
              ) : null}
            </View>
          ) : feature === "Settings" ? (
            <View style={styles.featureContainer}>
              <Pressable
                onPress={async () => {
                  const success = await setupPushNotifications(session?.token, true);
                  if (success) {
                    sendLocalNotification({
                      title: "Last Class Push Notifications Active 🔔",
                      body: "System notifications are active! You will receive live updates even when outside the app.",
                      data: { test: true }
                    });
                    Alert.alert("Push Notifications 🔔", "Notification permissions are active! A test system push notification has been sent to your device.");
                  } else {
                    Alert.alert("Permission Required ⚠️", "Notifications are currently blocked. Please click the lock icon in your browser address bar or check device permissions to allow notifications.");
                  }
                }}
                style={[styles.settingsRow, modalSurface]}
              >
                <View style={styles.settingsLeft}>
                  <Feather name="bell" size={20} color={theme.primary} />
                  <Text style={[styles.settingsText, { color: theme.text }]}>Push Notifications</Text>
                </View>
                <Text style={[styles.settingStateText, { color: theme.isDark ? "#C7D2FE" : theme.primary }]}>Tap to Enable / Test</Text>
              </Pressable>
              <View style={[styles.settingsRow, modalSurface]}>
                <View style={styles.settingsLeft}>
                  <Feather name="lock" size={20} color={theme.primary} />
                  <Text style={[styles.settingsText, { color: theme.text }]}>Privacy & Security</Text>
                </View>
                <Feather name="chevron-right" size={18} color={theme.subtext} />
              </View>
            </View>
          ) : feature === "Notifications" ? (
            <View style={styles.featureContainer}>
              {[
                { id: "1", title: "New Assignment Uploaded", desc: "System Design Chapter 4 notes are ready.", time: "10m ago" },
                { id: "2", title: "Doubt Solved", desc: "Mentor Rohit Singh answered your question.", time: "1h ago" },
                { id: "3", title: "Class Reminder", desc: "Live session starts at 5:00 PM today.", time: "3h ago" }
              ].map((item) => (
                <View key={item.id} style={[styles.notifCard, modalSurface]}>
                  <View style={[styles.notifIconWrap, { backgroundColor: theme.badgeBg }]}>
                    <Feather name="bell" size={18} color={theme.primary} />
                  </View>
                  <View style={styles.notifCopy}>
                    <Text style={[styles.notifTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.notifDesc, { color: theme.subtext }]}>{item.desc}</Text>
                    <Text style={[styles.notifTime, { color: theme.subtext }]}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : feature === "Payment & Billing" ? (
            <View style={styles.featureContainer}>
              <View style={[styles.billingCard, modalSurface]}>
                <Text style={[styles.billingPlanTitle, { color: theme.isDark ? "#C7D2FE" : theme.primary }]}>Active Plan: Premium</Text>
                <Text style={[styles.billingPlanSub, { color: theme.subtext }]}>Next renewal date: Nov 15, 2026</Text>
              </View>
            </View>
          ) : feature === "Go Premium" ? (
            <View style={styles.featureContainer}>
              <LinearGradient colors={premiumGradient} style={[styles.premiumHeroCard, { borderWidth: 1, borderColor: theme.isDark ? "#4338CA" : "#E6E1FF" }]}>
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
              <View style={[styles.genericFeatureCard, modalSurface]}>
                <MaterialCommunityIcons name="star-shooting" size={44} color={theme.primary} />
                <Text style={[styles.genericTitle, { color: theme.text }]}>{feature}</Text>
                <Text style={[styles.genericSub, { color: theme.subtext }]}>Welcome to {feature} section in Last Class.</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function LoadingState() {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 700,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true
        })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const skeletonBg = theme.isDark ? "#283046" : "#E2E8F0";

  return (
    <View style={{ width: "100%", gap: 14, marginVertical: 10 }}>
      {/* Top Banner Badge */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 20,
          backgroundColor: theme.badgeBg,
          borderWidth: 1,
          borderColor: theme.border,
          alignSelf: "center",
          marginBottom: 4
        }}
      >
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, color: theme.primary }}>
          Curating live LastClass feed & stories...
        </Text>
      </View>

      {/* 3 Animated Skeleton Feed Post Cards */}
      {[1, 2, 3].map((key) => (
        <View
          key={key}
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: theme.isDark ? 0.3 : 0.05,
            shadowRadius: 6
          }}
        >
          {/* Skeleton Header: Avatar + User Info */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Animated.View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: skeletonBg,
                opacity: pulseAnim
              }}
            />
            <View style={{ gap: 6, flex: 1 }}>
              <Animated.View
                style={{
                  width: "45%",
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: skeletonBg,
                  opacity: pulseAnim
                }}
              />
              <Animated.View
                style={{
                  width: "25%",
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: skeletonBg,
                  opacity: pulseAnim
                }}
              />
            </View>
          </View>

          {/* Skeleton Content Lines */}
          <View style={{ gap: 8, marginVertical: 4 }}>
            <Animated.View
              style={{
                width: "92%",
                height: 12,
                borderRadius: 6,
                backgroundColor: skeletonBg,
                opacity: pulseAnim
              }}
            />
            <Animated.View
              style={{
                width: "78%",
                height: 12,
                borderRadius: 6,
                backgroundColor: skeletonBg,
                opacity: pulseAnim
              }}
            />
          </View>

          {/* Skeleton Image/Media Box (rendered for cards 1 and 3) */}
          {key !== 2 && (
            <Animated.View
              style={{
                width: "100%",
                height: 160,
                borderRadius: 14,
                backgroundColor: skeletonBg,
                opacity: pulseAnim
              }}
            />
          )}

          {/* Skeleton Action Bar */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.border }}>
            <Animated.View style={{ width: 60, height: 22, borderRadius: 11, backgroundColor: skeletonBg, opacity: pulseAnim }} />
            <Animated.View style={{ width: 60, height: 22, borderRadius: 11, backgroundColor: skeletonBg, opacity: pulseAnim }} />
            <Animated.View style={{ width: 60, height: 22, borderRadius: 11, backgroundColor: skeletonBg, opacity: pulseAnim }} />
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyState({ title, text, icon = "text-search" }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.cardBg,
        borderColor: theme.border,
        borderRadius: 18,
        borderWidth: 1,
        marginTop: 16,
        paddingVertical: 32,
        paddingHorizontal: 20,
        gap: 10,
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.isDark ? 0.3 : 0.05,
        shadowRadius: 6
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.badgeBg,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4
        }}
      >
        <MaterialCommunityIcons name={icon} size={28} color={theme.primary} />
      </View>
      <Text
        style={{
          color: theme.text,
          fontFamily: fonts.bold,
          fontSize: 16,
          textAlign: "center"
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: theme.subtext,
          fontFamily: fonts.regular,
          fontSize: 12,
          lineHeight: 18,
          textAlign: "center",
          maxWidth: 280
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function TabPlaceholder({ activeTab }) {
  const { theme } = useTheme();
  const copy = {
    Learn: "Courses, notes and live classes will appear here.",
    Community: "Mentor posts, student stories and learning groups will appear here.",
    Doubts: "Ask doubts and track mentor replies here.",
    Profile: "Your account, progress and settings will appear here."
  };

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.cardBg,
        borderColor: theme.border,
        borderRadius: 18,
        borderWidth: 1,
        marginTop: 16,
        paddingVertical: 28,
        paddingHorizontal: 20,
        gap: 8,
        width: "100%"
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: theme.badgeBg,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4
        }}
      >
        <Feather name="layers" size={22} color={theme.primary} />
      </View>
      <Text style={{ color: theme.text, fontFamily: fonts.bold, fontSize: 15, textAlign: "center" }}>{activeTab}</Text>
      <Text style={{ color: theme.subtext, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, textAlign: "center" }}>{copy[activeTab]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "transparent",
    flex: 1
  },
  appShell: {
    flex: 1
  },
  scroll: {
    alignItems: "center",
    paddingBottom: 88,
    width: "100%"
  },
  page: {
    alignSelf: "center",
    paddingHorizontal: 0,
    width: "100%"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
    paddingTop: 8,
    paddingHorizontal: 14,
    width: "100%",
    position: Platform.OS === "web" ? "sticky" : "relative",
    top: 0,
    zIndex: 100,
    ...(Platform.OS === "web"
      ? {
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)"
        }
      : {})
  },
  brandRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minWidth: 0
  },
  menuButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 18
  },
  brandWrap: {
    flexShrink: 1,
    minWidth: 0
  },
  screenTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 19,
    lineHeight: 23,
    letterSpacing: -0.2,
    color: "#181725"
  },
  brand: {
    color: colors.primaryDark,
    fontFamily: fonts.extraBold,
    fontSize: 21,
    letterSpacing: 0.5,
    lineHeight: 24
  },
  brandSub: {
    color: "#64748B",
    fontFamily: fonts.medium,
    fontSize: 9.5,
    lineHeight: 12
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
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
    color: colors.primary
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
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 18
  },
  headerBadge: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: "#FFFFFF",
    borderRadius: 7,
    borderWidth: 1.5,
    height: 14,
    justifyContent: "center",
    minWidth: 14,
    paddingHorizontal: 2,
    position: "absolute",
    right: 2,
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
    borderRadius: 18,
    borderWidth: 1.5,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 14
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#F0EEF8",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    height: 52,
    paddingHorizontal: 16,
    shadowColor: "#261B94",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
  },
  searchInput: {
    color: "#181725",
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    marginLeft: 10,
    paddingVertical: 0
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#F0EEF8",
    borderRadius: 16,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52,
    shadowColor: "#261B94",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1
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
    height: 36,
    justifyContent: "center",
    minWidth: 70,
    paddingHorizontal: 12
  },
  categoryTabActive: {
    borderBottomColor: colors.primary,
    borderBottomWidth: 2.5
  },
  categoryText: {
    color: "#5F5D76",
    fontFamily: fonts.semiBold,
    fontSize: 12
  },
  categoryTextActive: {
    color: "#FFFFFF"
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
    gap: 4,
    paddingBottom: 80
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    borderWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 2,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
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
    fontSize: 14,
    lineHeight: 18
  },
  mentorBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5
  },
  mentorBadgeText: {
    color: "#D97706",
    fontFamily: fonts.bold,
    fontSize: 9
  },
  studentBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5
  },
  studentBadgeText: {
    color: "#475569",
    fontFamily: fonts.bold,
    fontSize: 9
  },
  authorRole: {
    color: "#64748B",
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 15,
    marginTop: 1
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
  pdfCardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0"
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
    backgroundColor: "#F1F5F9",
    borderRadius: 0,
    marginTop: 8,
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
    backgroundColor: "transparent",
    borderWidth: 0
  },
  videoMediaRounded: {
    borderRadius: 0
  },
  videoThumbImage: {
    height: "100%",
    width: "100%"
  },
  videoPlayerView: {
    height: "100%",
    width: "100%"
  },
  videoErrorBadge: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 60,
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: "absolute",
    top: 40,
    zIndex: 3
  },
  videoErrorText: {
    color: "#FFFFFF",
    fontFamily: fonts.medium,
    fontSize: 12
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
    minHeight: 48,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "ios" ? 12 : Platform.OS === "android" ? (StatusBar.currentHeight || 20) : 8,
    paddingBottom: 8,
    zIndex: 100
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
    height: "75%",
    overflow: "hidden",
    paddingTop: 8,
    display: "flex",
    flexDirection: "column"
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
    backgroundColor: "#F8F9FE",
    flex: 1
  },
  createHeader: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#EFEFF8",
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 48,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 2
  },
  createIconButton: {
    alignItems: "center",
    backgroundColor: "#F3F4F8",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  createHeaderCopy: {
    flex: 1,
    marginHorizontal: 8,
    minWidth: 0
  },
  createTitle: {
    color: "#18172B",
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20
  },
  createSubtitle: {
    color: "#66637F",
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 1
  },
  createPublish: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    minWidth: 58,
    paddingHorizontal: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },
  createPublishDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0
  },
  createPublishText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 13
  },
  createScroll: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 30
  },
  createComposerCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#ECEEF8",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    shadowColor: "#5B3CF5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1
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
    backgroundColor: "#F9FAFE",
    borderColor: "#E5E7F5",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    minHeight: 145,
    padding: 14
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
    color: "#9E9EB2",
    fontFamily: fonts.semiBold,
    fontSize: 11,
    marginTop: 4
  },
  mediaModeRow: {
    borderTopColor: "#F1F2F9",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingTop: 14
  },
  mediaModeButton: {
    alignItems: "center",
    backgroundColor: "#F9FAFE",
    borderColor: "#E5E7F5",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    height: 44,
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 10
  },
  mediaModeActive: {
    backgroundColor: "#F0ECFF",
    borderColor: colors.primary
  },
  mediaModeIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  mediaModeText: {
    color: "#475569",
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 12
  },
  mediaModeTextActive: {
    color: colors.primary
  },
  createPanel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#ECEEF8",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
    shadowColor: "#5B3CF5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1
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
    backgroundColor: "transparent",
    borderColor: "#E5E7F5",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 50,
    marginTop: 10,
    paddingHorizontal: 12
  },
  detailIcon: {
    alignItems: "center",
    backgroundColor: "#F0ECFF",
    borderRadius: 10,
    height: 32,
    justifyContent: "center",
    marginRight: 10,
    width: 32
  },
  detailLabel: {
    color: "#18172B",
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    marginRight: 8,
    width: 85
  },
  detailInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    height: 40,
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
    backgroundColor: "#F0EDFF",
    borderColor: "#D8CCFF",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    minHeight: 72,
    paddingHorizontal: 16
  },
  guidelineIcon: {
    alignItems: "center",
    backgroundColor: "#E2D9FF",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44
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
    position: Platform.OS === "web" ? "fixed" : "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingHorizontal: 16,
    paddingBottom: 0,
    paddingTop: 0,
    backgroundColor: "transparent",
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
    bottom: 68,
    position: "absolute",
    right: 14,
    zIndex: 10
  },
  fab: {
    borderRadius: 22,
    height: 44,
    width: 44,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: "hidden"
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  floatingNavCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F0EEF8",
    paddingVertical: 5,
    paddingHorizontal: 6,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  tabItem: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 3,
    position: "relative"
  },
  tabLabel: {
    color: "#7C7C9A",
    fontFamily: fonts.medium,
    fontSize: 9.5,
    marginTop: 2,
    letterSpacing: 0.1,
    textAlign: "center"
  },
  tabLabelActive: {
    color: colors.primary,
    fontFamily: fonts.bold
  },
  activeTabDot: {
    position: "absolute",
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary
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
    backgroundColor: colors.primary,
    borderColor: colors.primary
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
    backgroundColor: colors.primary,
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
    color: colors.primary
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
    color: colors.primary
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
    color: colors.primary
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
  },
  topUploadProgressTrack: {
    height: 4,
    width: "100%",
    backgroundColor: "rgba(91, 60, 245, 0.12)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    overflow: "hidden"
  },
  topUploadProgressBar: {
    height: "100%",
    borderRadius: 2
  },
  pushPermissionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1EDFF",
    borderColor: "#D8CCFF",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 10,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 10,
    zIndex: 9998
  },
  pushPermissionText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#2D1B69"
  },
  pushPermissionBtn: {
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 7
  },
  pushPermissionBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 11
  }
});
