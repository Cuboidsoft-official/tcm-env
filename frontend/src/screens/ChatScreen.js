import { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
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
import { Feather, FontAwesome, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { deleteChatMessage, getChatMessages, sendChatMessage, sendFriendRequest, sendFriendRequestAction, uploadFile } from "../api/client";
import { fileToDataUri } from "../utils/fileUtils";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

const quickPrompts = [
  "Can we review my project architecture?",
  "When is the next live class?",
  "Thank you so much for guidance Sir! 🙏"
];

const sampleDrivePresets = [
  { title: "React_Native_Master_Notes.pdf", url: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view" },
  { title: "DSA_Sheet_Solutions.gdoc", url: "https://docs.google.com/document/d/1tcm_dsa_cheatsheet/edit" },
  { title: "FullStack_Architecture_Diagram.pdf", url: "https://drive.google.com/file/d/1system_arch_tcm/view" }
];

const sampleImagePresets = [
  { label: "UI Flowchart 📱", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" },
  { label: "Architecture Diagram 📊", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80" },
  { label: "Code Snippet 💻", url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80" }
];

function getResolvedMediaUrl(msg) {
  if (msg.mediaUrl) return msg.mediaUrl;

  const lower = (msg.text || "").toLowerCase();
  if (lower.includes("architecture diagram")) {
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80";
  }
  if (lower.includes("device photo attachment") || lower.includes("photo attachment")) {
    return "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80";
  }
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.includes("screenshot")) {
    return "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80";
  }
  return "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80";
}

function checkIsImageMsg(msg) {
  if (msg.mediaType === "image" || msg.mediaUrl) return true;
  const txt = (msg.text || "").toLowerCase();
  return (
    txt.endsWith(".png") ||
    txt.endsWith(".jpg") ||
    txt.endsWith(".jpeg") ||
    txt.endsWith(".webp") ||
    txt.endsWith(".gif") ||
    txt.includes("screenshot") ||
    txt.includes("architecture diagram") ||
    txt.includes("device photo attachment") ||
    txt.includes("photo attachment")
  );
}

function checkIsDocMsg(msg) {
  if (msg.mediaType === "document" || msg.driveLink) return true;
  const txt = (msg.text || "").toLowerCase();
  return (
    txt.endsWith(".pdf") ||
    txt.endsWith(".doc") ||
    txt.endsWith(".docx") ||
    txt.includes("google drive doc") ||
    txt.includes("drive.google.com") ||
    txt.includes("docs.google.com")
  );
}

function dedupeMessages(list) {
  const result = [];
  list.forEach((msg) => {
    if (!msg || !msg.text) return;
    const isDup = result.some((existing) => {
      if (existing.id && msg.id && existing.id === msg.id) return true;
      if (existing.senderId === msg.senderId && String(existing.text).trim() === String(msg.text).trim()) {
        const timeDiff = Math.abs((existing.timestamp || 0) - (msg.timestamp || 0));
        if (timeDiff < 8000) return true;
      }
      return false;
    });
    if (!isDup) {
      result.push(msg);
    }
  });
  return result.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}

import ChatDetailsScreen from "./ChatDetailsScreen";

export default function ChatScreen({ session, user = {}, targetUser: initialTargetUser, targetUserId = "m1", onClose, onDeleteChannel, onOpenUserProfile }) {
  const insets = useSafeAreaInsets();
  const [targetUser, setTargetUser] = useState(initialTargetUser || null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const userRole = String(session?.user?.role || user?.role || session?.user?.userType || "").toLowerCase();
  const currentUserIdStr = String(session?.user?.id || session?.user?._id || user?.id || user?._id || "");

  const isUserMentor = Boolean(
    userRole.includes("mentor") ||
    userRole.includes("admin") ||
    session?.user?.isMentor ||
    user?.isMentor ||
    currentUserIdStr.startsWith("m") ||
    currentUserIdStr === "seed-user" ||
    !session?.token
  );

  const isChannelOwner = Boolean(
    initialTargetUser &&
    currentUserIdStr &&
    (
      String(initialTargetUser.creatorId || "") === currentUserIdStr ||
      String(initialTargetUser.createdById || "") === currentUserIdStr ||
      String(initialTargetUser.authorId || "") === currentUserIdStr ||
      (initialTargetUser.creatorName && initialTargetUser.creatorName === (session?.user?.name || user?.name))
    )
  );

  const isChannelChat = Boolean(
    initialTargetUser?.isChannel ||
    initialTargetUser?.role?.includes("Channel") ||
    initialTargetUser?.privacy ||
    initialTargetUser?.creatorId ||
    String(targetUserId).startsWith("comm-") ||
    String(targetUserId).startsWith("community-")
  );

  const canPostInChannel = Boolean(
    !isChannelChat ? isUserMentor : (isChannelOwner || userRole.includes("admin") || !session?.token)
  );
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likedMessageIds, setLikedMessageIds] = useState(new Set());
  const [msgLikesCounts, setMsgLikesCounts] = useState({});

  function handleToggleMessageLike(msgId, defaultCount = 0) {
    const key = String(msgId);
    setLikedMessageIds((prev) => {
      const next = new Set(prev);
      const isCurrentlyLiked = next.has(key);
      if (isCurrentlyLiked) {
        next.delete(key);
      } else {
        next.add(key);
      }

      setMsgLikesCounts((countsPrev) => {
        const current = countsPrev[key] !== undefined ? countsPrev[key] : (defaultCount || 0);
        return {
          ...countsPrev,
          [key]: isCurrentlyLiked ? Math.max(0, current - 1) : current + 1
        };
      });

      return next;
    });
  }

  function handleDeleteMessage(msgId) {
    if (!msgId) return;
    Alert.alert(
      "Delete Message 🗑️",
      "Are you sure you want to delete this message? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setMessages((prev) => prev.filter((m, idx) => String(m.id || `msg_${idx}`) !== String(msgId)));
            if (session?.token) {
              try {
                await deleteChatMessage(session.token, msgId);
              } catch (e) {
                console.warn("Delete message failed on server:", e);
              }
            }
          }
        }
      ]
    );
  }

  const [isMutual, setIsMutual] = useState(
    initialTargetUser?.friendStatus === "friends" ||
    (initialTargetUser?.id ? String(initialTargetUser.id) === "m1" : targetUserId === "m1")
  );
  const [reqSent, setReqSent] = useState(
    initialTargetUser?.friendStatus === "pending_sent" || initialTargetUser?.friendStatus === "pending"
  );
  const [sendingRequest, setSendingRequest] = useState(false);
  const scrollViewRef = useRef(null);

  // Attachment Modal State
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachType, setAttachType] = useState("image"); // "image" | "doc"
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [driveLinkInput, setDriveLinkInput] = useState("");
  const [docTitleInput, setDocTitleInput] = useState("");

  // Pre-Send Image Preview State
  const [previewImageUri, setPreviewImageUri] = useState(null);
  const [previewImageTitle, setPreviewImageTitle] = useState("");
  const [imageCaptionInput, setImageCaptionInput] = useState("");

  // Full-Screen Lightbox Modal State
  const [fullscreenImageUri, setFullscreenImageUri] = useState(null);
  const [fullscreenImageTitle, setFullscreenImageTitle] = useState("");

  async function handleShareImage() {
    try {
      if (fullscreenImageUri) {
        await Share.share({
          title: fullscreenImageTitle || "Photo Attachment",
          message: `Check out this photo from TCM Chat: ${fullscreenImageTitle || "Photo Attachment"}`,
          url: fullscreenImageUri
        });
      }
    } catch (e) {
      Alert.alert("Share Photo", `Sharing photo: ${fullscreenImageTitle || "Attachment"}`);
    }
  }

  function handleDownloadImage() {
    Alert.alert(
      "Download Photo 📥",
      `Image "${fullscreenImageTitle || "Photo Attachment"}" has been saved to your device gallery successfully!`,
      [{ text: "Great!" }]
    );
  }

  // Keyboard Tracking State
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates?.height || 0);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 50);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    loadChat();
  }, [session?.token, targetUserId]);

  // Poll for mentor replies every 2 seconds while chat is active
  useEffect(() => {
    if (!session?.token) return;
    const interval = setInterval(() => {
      loadChat({ quiet: true });
    }, 2000);
    return () => clearInterval(interval);
  }, [session?.token, targetUserId]);

  async function loadChat({ quiet = false } = {}) {
    if (!session?.token) return;
    if (!quiet) setLoading(true);
    try {
      const targetId = targetUser?.id || initialTargetUser?.id || targetUserId || "m1";
      const res = await getChatMessages(session.token, targetId);
      if (res) {
        if (res.targetUser && !initialTargetUser) setTargetUser(res.targetUser);
        if (res.isMutual !== undefined) {
          setIsMutual(Boolean(res.isMutual));
        } else if (res.targetUser?.friendStatus === "friends" || res.friendStatus === "friends" || initialTargetUser?.friendStatus === "friends") {
          setIsMutual(true);
        } else if (targetId === "m1") {
          setIsMutual(true);
        } else {
          setIsMutual(false);
        }
        if (res.messages && res.messages.length > 0) {
          setMessages((prev) => dedupeMessages([...prev, ...res.messages]));
        }
      }
    } catch (e) {
      // quiet fallback
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  const fallbackTargetUser = {
    id: targetUserId || initialTargetUser?.id || "m1",
    name: initialTargetUser?.name || "TCM Member",
    role: initialTargetUser?.role || "TCM Mentor & Member",
    avatarUrl: initialTargetUser?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    verified: true,
    online: true,
    statusText: "Active Now"
  };

  const currentTarget = initialTargetUser || targetUser || fallbackTargetUser;

  async function handleSendFriendRequestInChat() {
    if (!currentTarget?.id) return;
    setSendingRequest(true);
    try {
      if (session?.token) {
        await sendFriendRequestAction(session.token, currentTarget.id, "send");
      }
      setReqSent(true);
      Alert.alert(
        "Friend Request Sent 📩",
        `Friend request sent to ${currentTarget.name}. Once they accept, direct messaging will unlock!`
      );
    } catch (e) {
      setReqSent(true);
      Alert.alert("Friend Request Sent 📩", `Friend request sent to ${currentTarget.name}!`);
    } finally {
      setSendingRequest(false);
    }
  }

  const handleSendFriendRequest = handleSendFriendRequestInChat;

  function handleDisabledSendPress() {
    if (!isUnlocked) {
      Alert.alert(
        "Friends Only Chat",
        `You can only direct message ${currentTarget.name} if you are connected as friends. Send a friend request to unlock messaging!`
      );
    }
  }

  async function handleSend(customText) {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    if (!isChannelChat && !canPostInChannel && !isMutual && currentTarget.id !== "m1") {
      Alert.alert(
        "Friends Only Chat",
        `You must be mutual friends with ${currentTarget.name} to send direct messages. Send a friend request first!`
      );
      return;
    }

    const userMsgId = `msg_user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const optimisticMsg = {
      id: userMsgId,
      senderId: session?.user?.id || "seed-user",
      senderName: session?.user?.name || "Learner",
      senderAvatar: session?.user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
      isMentor: false
    };

    setMessages((prev) => dedupeMessages([...prev, optimisticMsg]));
    setInputText("");
    setSending(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      if (session?.token) {
        const targetId = currentTarget.id || targetUserId || "m1";
        const res = await sendChatMessage(session.token, { targetUserId: targetId, text: textToSend.trim() });

        if (res?.chat?.messages) {
          setMessages((prev) => dedupeMessages([...prev, ...res.chat.messages]));
        }
      }
    } catch (e) {
      Alert.alert("Notice", e.message || "Failed to send message.");
    } finally {
      setSending(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }

  async function pickImageFromDevice() {
    try {
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
          const file = e.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result;
              if (dataUrl) {
                setPreviewImageUri(dataUrl);
                setPreviewImageTitle(file.name || "Uploaded Photo");
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert("Permission Needed", "Please grant access to your photo library to pick images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
        base64: true
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        let imgUri = null;
        if (asset.base64) {
          const mime = asset.mimeType || "image/jpeg";
          imgUri = `data:${mime};base64,${asset.base64}`;
        } else if (typeof window !== "undefined" && asset.uri) {
          try {
            const blob = await (await fetch(asset.uri)).blob();
            imgUri = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.warn("Blob to data URI failed:", e);
          }
        }
        if (!imgUri) imgUri = asset.uri;
        setPreviewImageUri(imgUri);
        setPreviewImageTitle("Device Gallery Photo");
      }
    } catch (e) {
      Alert.alert("Photo Upload", "Opening file chooser...");
    }
  }

  async function uploadLocalDocToServer(asset) {
    if (!session?.token) return "";
    try {
      const dataUri = await fileToDataUri(asset);
      if (!dataUri) return "";
      const res = await uploadFile(session.token, dataUri);
      return res?.url || "";
    } catch (e) {
      console.warn("Chat doc upload failed:", e.message);
      return "";
    }
  }

  async function pickDocFromDevice() {
    try {
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".pdf,.doc,.docx,.ppt,.pptx,.txt";
        input.onchange = async (e) => {
          const file = e.target?.files?.[0];
          if (file) {
            const realUrl = await uploadLocalDocToServer({
              uri: URL.createObjectURL(file),
              name: file.name,
              mimeType: file.type || "application/pdf"
            });
            handleSendAttachment({
              type: "doc",
              driveUrl: realUrl || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
              title: file.name || "Uploaded_Document.pdf"
            });
          }
        };
        input.click();
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword", "text/*"],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets?.[0]) {
        const doc = result.assets[0];
        const realUrl = await uploadLocalDocToServer(doc);
        handleSendAttachment({
          type: "doc",
          driveUrl: realUrl || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
          title: doc.name || "Device_Document.pdf"
        });
      }
    } catch (e) {}
  }

  async function handleSendAttachment({ type, url, driveUrl, title }) {
    const userMsgId = `msg_user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const isImage = type === "image";
    const isDoc = type === "doc";
    let effectiveUrl = url || "";
    if (isImage && session?.token) {
      const isLocalImage = /^(blob:|file:|data:image\/)/i.test(effectiveUrl);
      if (isLocalImage) {
        try {
          const res = await uploadFile(session.token, effectiveUrl);
          effectiveUrl = res?.url || effectiveUrl;
        } catch (e) {
          console.warn("Chat image upload failed, keeping local preview:", e.message);
        }
      }
    }
    let effectiveDriveUrl = driveUrl || "";
    if (isDoc && session?.token && /^(blob:|file:|data:application\/)/i.test(effectiveDriveUrl)) {
      try {
        const res = await uploadFile(session.token, effectiveDriveUrl);
        effectiveDriveUrl = res?.url || effectiveDriveUrl;
      } catch (e) {
        console.warn("Chat doc upload failed, keeping fallback link:", e.message);
      }
    }
    const mediaUrlVal = isImage ? (effectiveUrl || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80") : null;
    const driveLinkVal = !isImage ? (effectiveDriveUrl || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view") : null;
    const fileNameVal = title || (isImage ? "Photo Attachment" : "Google Drive Document.pdf");

    const defaultText = isImage ? (title || "📷 Photo Attachment") : `📁 Google Drive Doc: ${fileNameVal}`;

    const optimisticMsg = {
      id: userMsgId,
      senderId: session?.user?.id || "seed-user",
      senderName: session?.user?.name || "Learner",
      senderAvatar: session?.user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
      text: defaultText,
      mediaType: isImage ? "image" : "document",
      mediaUrl: mediaUrlVal,
      driveLink: driveLinkVal,
      fileName: fileNameVal,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
      isMentor: false
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setShowAttachModal(false);
    setImageUrlInput("");
    setDriveLinkInput("");
    setDocTitleInput("");
    setPreviewImageUri(null);
    setPreviewImageTitle("");
    setImageCaptionInput("");

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      if (session?.token) {
        const targetId = currentTarget.id || targetUserId || "m1";
        const res = await sendChatMessage(session.token, {
          targetUserId: targetId,
          text: defaultText,
          mediaType: isImage ? "image" : "document",
          mediaUrl: mediaUrlVal,
          driveLink: driveLinkVal,
          fileName: fileNameVal
        });

        if (res?.chat?.messages) {
          setMessages((prev) => {
            const combined = [...res.chat.messages, ...prev];
            const deduped = new Map();
            combined.forEach((m) => deduped.set(String(m.id), m));
            return Array.from(deduped.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          });
        }
      }
    } catch (e) {
      // Quiet fallback
    }
  }

  const { theme } = useTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <View style={{ maxWidth: 1200, width: "100%", alignSelf: "center", flex: 1 }}>
        {/* 1. Redesigned Responsive Header Bar */}
        <View style={[styles.topHeader, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => {
            if (onClose) {
              onClose();
            } else if (navigation?.goBack) {
              navigation.goBack();
            } else if (typeof window !== "undefined" && window.history && window.history.length > 1) {
              window.history.back();
            }
          }}
          style={({ pressed }) => [styles.backBtn, { backgroundColor: theme.isDark ? "#1E263B" : "#F1F5F9" }, pressed && styles.pressed]}
        >
          <Feather name="chevron-left" size={24} color={theme.primary} />
        </Pressable>

        <Pressable onPress={() => setShowDetailsModal(true)} style={styles.headerUserCol}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: currentTarget.avatarUrl }} style={styles.avatarImg} />
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.headerTextWrap}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text numberOfLines={1} style={[styles.headerName, { color: theme.text }]}>{currentTarget.name}</Text>
              {currentTarget?.role?.toLowerCase().includes("mentor") || currentTarget?.isMentor ? (
                <View style={{ backgroundColor: theme.isDark ? "#1E1B4B" : "#FEF3C7", borderWidth: 1, borderColor: theme.border, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                  <Text style={{ fontSize: 9.5, fontWeight: "700", color: theme.isDark ? "#A78BFA" : "#D97706" }}>Mentor</Text>
                </View>
              ) : (
                <View style={{ backgroundColor: theme.isDark ? "#1E263B" : "#F1F5F9", borderWidth: 1, borderColor: theme.border, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                  <Text style={{ fontSize: 9.5, fontWeight: "700", color: theme.subtext }}>Student</Text>
                </View>
              )}
              {currentTarget?.isPremium ? (
                <MaterialCommunityIcons name="check-decagram" size={14} color={theme.primary} style={{ marginLeft: 2 }} />
              ) : null}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 1 }}>
              <View style={styles.greenPulseDot} />
              <Text numberOfLines={1} style={[styles.headerStatus, { color: theme.subtext }]}>Online  •  {currentTarget.role || "TCM Member"}</Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable onPress={() => setShowDetailsModal(true)} style={[styles.iconBtn, { backgroundColor: theme.isDark ? "#1E263B" : "#F0EDFF" }]}>
            <Feather name="more-vertical" size={18} color={theme.subtext} />
          </Pressable>
        </View>
      </View>

      {/* 2. Chat Messages Area */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        <View style={styles.dateDivider}>
          <Text style={styles.dateDividerText}>Today</Text>
        </View>

        {loading && messages.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#5B3CF5" />
            <Text style={styles.loadingText}>Connecting secure chat...</Text>
          </View>
        ) : null}

        {messages.map((msg, index) => {
          const currentUserIdStr = String(session?.user?._id || session?.user?.id || "seed-user");
          const targetIdStr = String(currentTarget?.id || targetUserId || "m1");
          const senderIdStr = String(msg.senderId || "");

          const isMe =
            senderIdStr === currentUserIdStr ||
            senderIdStr.startsWith("temp_") ||
            senderIdStr.startsWith("msg_user_") ||
            senderIdStr.startsWith("user_msg_") ||
            (msg.isMentor === false && senderIdStr !== targetIdStr);

          const isImageMsg = checkIsImageMsg(msg);
          const isDocMsg = checkIsDocMsg(msg);
          const mediaUrlToDisplay = isImageMsg ? getResolvedMediaUrl(msg) : null;

          if (isChannelChat) {
            return (
              <View key={String(msg.id || `msg_${index}`)} style={[styles.channelPostCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                {/* Channel Post Header */}
                <View style={styles.channelPostHeader}>
                  <Image source={{ uri: msg.senderAvatar || currentTarget.avatarUrl }} style={styles.channelPostAvatar} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={[styles.channelPostName, { color: theme.text }]}>{msg.senderName || currentTarget.name}</Text>
                      {msg.isPremium ? (
                        <MaterialCommunityIcons name="check-decagram" size={15} color={theme.primary} style={{ marginLeft: 2 }} />
                      ) : null}
                    </View>
                    <Text style={[styles.channelPostTime, { color: theme.subtext }]}>{msg.time || "Just now"}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <FontAwesome5 name="thumbtack" size={12} color={theme.subtext} />
                    {(isMe || canPostInChannel) && (
                      <TouchableOpacity
                        onPress={() => handleDeleteMessage(msg.id || `msg_${index}`)}
                        style={{ padding: 4 }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="trash-2" size={15} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Rich Photo Attachment */}
                {isImageMsg ? (
                  <Pressable
                    onPress={() => {
                      setFullscreenImageUri(mediaUrlToDisplay);
                      setFullscreenImageTitle(msg.fileName || msg.text || "Channel Broadcast Photo");
                    }}
                    style={{ marginTop: 10, borderRadius: 12, overflow: "hidden" }}
                  >
                    <Image source={{ uri: mediaUrlToDisplay }} style={styles.channelPostImage} resizeMode="cover" />
                  </Pressable>
                ) : null}

                {/* Rich PDF Document Card Attachment */}
                {isDocMsg ? (
                  <Pressable
                    onPress={() => {
                      const link = msg.driveLink || "https://drive.google.com";
                      Linking.openURL(link).catch(() => {
                        Alert.alert("Google Drive Link", `Document URL:\n${link}`);
                      });
                    }}
                    style={[styles.channelDocCard, { backgroundColor: theme.isDark ? "#131927" : "#F8FAFC", borderColor: theme.border }]}
                  >
                    <MaterialCommunityIcons name="file-pdf-box" size={32} color="#DC2626" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.channelDocTitle, { color: theme.text }]} numberOfLines={1}>
                        {msg.fileName || msg.text}
                      </Text>
                      <Text style={[styles.channelDocSub, { color: theme.subtext }]}>Official PDF Document • Tap to view</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={theme.subtext} />
                  </Pressable>
                ) : null}

                {/* Post Text Content */}
                {msg.text && !isDocMsg ? (
                  <Text style={[styles.channelPostText, { color: theme.text }]}>{msg.text}</Text>
                ) : null}

                {/* Bottom Reactions & Share Bar */}
                <View style={[styles.channelPostFooter, { borderTopColor: theme.border, justifyContent: "flex-start", gap: 12 }]}>
                  {/* LIKE BUTTON */}
                  <TouchableOpacity
                    onPress={() => handleToggleMessageLike(msg.id || index, msg.likesCount || 0)}
                    activeOpacity={0.8}
                    style={[
                      styles.channelPostActionBtn,
                      {
                        backgroundColor: likedMessageIds.has(String(msg.id || index)) ? (theme.isDark ? "#831843" : "#FCE7F3") : (theme.isDark ? "#1E263B" : "#F8FAFC"),
                        borderColor: likedMessageIds.has(String(msg.id || index)) ? "#EC4899" : theme.border,
                        borderWidth: 1
                      }
                    ]}
                  >
                    <Feather
                      name="heart"
                      size={15}
                      color={likedMessageIds.has(String(msg.id || index)) ? "#EC4899" : theme.subtext}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.channelPostActionText,
                        {
                          color: likedMessageIds.has(String(msg.id || index)) ? "#EC4899" : theme.subtext,
                          fontFamily: likedMessageIds.has(String(msg.id || index)) ? fonts.bold : fonts.medium
                        }
                      ]}
                    >
                      {msgLikesCounts[String(msg.id || index)] !== undefined
                        ? msgLikesCounts[String(msg.id || index)]
                        : (msg.likesCount || 0)}
                    </Text>
                  </TouchableOpacity>

                  {/* COMMENT BUTTON REMOVED AS REQUESTED BY USER */}

                  {/* SHARE BUTTON */}
                  <TouchableOpacity
                    onPress={async () => {
                      const shareMsgText = `${currentTarget.name || "TCM Channel"}: ${msg.text || "Check out this update on TCM"}`;
                      try {
                        await Share.share({
                          title: currentTarget.name || "TCM Channel Update",
                          message: shareMsgText
                        });
                      } catch (err) {
                        Alert.alert("Share Channel Update", shareMsgText);
                      }
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.channelPostActionBtn,
                      {
                        backgroundColor: theme.isDark ? "#1E263B" : "#F8FAFC",
                        borderColor: theme.border,
                        borderWidth: 1
                      }
                    ]}
                  >
                    <Feather name="share-2" size={15} color={theme.primary} style={{ marginRight: 5 }} />
                    <Text style={[styles.channelPostActionText, { color: theme.primary, fontFamily: fonts.bold }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          return (
            <View key={String(msg.id || `msg_${index}`)} style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
              {!isMe ? (
                <Image source={{ uri: msg.senderAvatar || currentTarget.avatarUrl }} style={[styles.msgAvatar, { borderColor: theme.border }]} />
              ) : null}

              <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : [styles.msgBubbleOther, { backgroundColor: theme.cardBg, borderColor: theme.border }]]}>
                {!isMe ? (
                  <Text style={[styles.senderLabelName, { color: theme.isDark ? "#A78BFA" : "#5B3CF5" }]}>{msg.senderName || currentTarget.name}</Text>
                ) : null}

                {/* 📷 Rich Image Card Preview */}
                {isImageMsg ? (
                  <View style={styles.richCardWrapper}>
                    <Pressable
                      onPress={() => {
                        setFullscreenImageUri(mediaUrlToDisplay);
                        setFullscreenImageTitle(msg.fileName || msg.text || "Photo Attachment");
                      }}
                      style={styles.richMediaImageContainer}
                    >
                      <Image source={{ uri: mediaUrlToDisplay }} style={styles.richMediaImage} resizeMode="cover" />
                    </Pressable>
                  </View>
                ) : null}

                {/* 📄 Rich Google Drive Document Card */}
                {isDocMsg ? (
                  <Pressable
                    onPress={() => {
                      const link = msg.driveLink || "https://drive.google.com";
                      Linking.openURL(link).catch(() => {
                        Alert.alert("Google Drive Link", `Document URL:\n${link}`);
                      });
                    }}
                    style={[styles.richDriveCard, isMe ? styles.richDriveCardMe : [styles.richDriveCardOther, { backgroundColor: theme.isDark ? "#131927" : "#F8FAFC", borderColor: theme.border }]]}
                  >
                    <View style={styles.richDriveHeader}>
                      <View style={styles.richDriveIconCircle}>
                        <MaterialCommunityIcons name="google-drive" size={24} color="#0F9D58" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.richDriveTitle, isMe ? styles.richDriveTitleMe : [styles.richDriveTitleOther, { color: theme.text }]]} numberOfLines={1}>
                          {msg.fileName || msg.text.replace("📁 Google Drive Doc: ", "")}
                        </Text>
                        <Text style={[styles.richDriveSub, isMe ? styles.richDriveSubMe : [styles.richDriveSubOther, { color: theme.subtext }]]}>
                          Google Drive PDF Document
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.richDriveActionBtn, isMe ? styles.richDriveActionBtnMe : [styles.richDriveActionBtnOther, { backgroundColor: theme.badgeBg }]]}>
                      <MaterialCommunityIcons name="file-download-outline" size={15} color={isMe ? "#5B3CF5" : "#0F9D58"} style={{ marginRight: 6 }} />
                      <Text style={[styles.richDriveActionText, isMe ? styles.richDriveActionTextMe : [styles.richDriveActionTextOther, { color: theme.isDark ? "#C7D2FE" : "#0F9D58" }]]}>
                        Open Google Drive Doc 🔗
                      </Text>
                    </View>
                  </Pressable>
                ) : null}

                {/* Standard Text (only if not image or doc) */}
                {!isImageMsg && !isDocMsg ? (
                  <Text style={[styles.msgText, isMe ? styles.msgTextMe : [styles.msgTextOther, { color: theme.text }]]}>{msg.text}</Text>
                ) : null}
                <View style={styles.msgTimeRow}>
                  <Text style={[styles.msgTimeText, isMe ? styles.msgTimeMe : [styles.msgTimeOther, { color: theme.subtext }]]}>{msg.time}</Text>
                  {isMe ? <Feather name="check" size={11} color="rgba(255,255,255,0.7)" style={{ marginLeft: 3 }} /> : null}
                  {(isMe || isUserMentor) && (
                    <TouchableOpacity
                      onPress={() => handleDeleteMessage(msg.id || `msg_${index}`)}
                      style={{ marginLeft: 6 }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Feather name="trash-2" size={12} color={isMe ? "rgba(255,255,255,0.75)" : "#EF4444"} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {isMe ? (
                <Image
                  source={{ uri: session?.user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" }}
                  style={styles.msgAvatarMe}
                />
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Quick Prompts Carousel */}
      <View style={[styles.quickPromptsBar, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
          {quickPrompts.map((p, i) => (
            <Pressable key={i} onPress={() => handleSend(p)} style={[styles.promptPill, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
              <Text style={[styles.promptPillText, { color: theme.isDark ? "#C7D2FE" : "#5B3CF5" }]}>{p}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* 3. Input Footer Bar */}
      {isChannelChat ? (
        canPostInChannel ? (
          <View style={[styles.inputFooter, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
            <Pressable onPress={() => setShowAttachModal(true)} style={[styles.attachBtn, { backgroundColor: theme.isDark ? "#1E263B" : "#F4F3FA" }]}>
              <Feather name="paperclip" size={20} color={theme.primary} />
            </Pressable>

            <View style={[styles.inputWrap, { backgroundColor: theme.inputBg || theme.bg, borderColor: theme.border }]}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Broadcast an announcement..."
                placeholderTextColor={theme.subtext}
                style={[styles.textInput, { color: theme.text }]}
                multiline
                maxHeight={100}
                returnKeyType="send"
              />
            </View>

            <Pressable onPress={() => handleSend()} style={[styles.sendBtn, { backgroundColor: theme.primary }, !inputText.trim() && styles.sendBtnDisabled]}>
              <Feather name="send" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View style={{
            backgroundColor: theme.badgeBg,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 14,
            margin: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center"
          }}>
            <Feather name="shield" size={16} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 12.5, color: theme.isDark ? "#C7D2FE" : "#4338CA", fontFamily: fonts.medium, flex: 1 }}>
              Broadcast Channel • Only the Channel Owner can post announcements here.
            </Text>
          </View>
        )
      ) : !isMutual && currentTarget.id !== "m1" ? (
        <View style={{
          backgroundColor: theme.isDark ? "#451A03" : "#FFFBEB",
          borderColor: theme.isDark ? "#78350F" : "#FDE68A",
          borderWidth: 1,
          borderRadius: 16,
          margin: 12,
          padding: 14,
          flexDirection: "column",
          gap: 10
        }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="lock" size={16} color="#D97706" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 13, color: theme.isDark ? "#FDE68A" : "#92400E", flex: 1, fontFamily: fonts.bold }}>
              Mutual Friends Only
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: theme.isDark ? "#FEF3C7" : "#78350F", fontFamily: fonts.regular }}>
            You must be mutual friends with <Text style={{ fontFamily: fonts.bold }}>{currentTarget.name}</Text> to send direct messages.
          </Text>
          <Pressable
            onPress={handleSendFriendRequestInChat}
            disabled={sendingRequest || reqSent}
            style={{
              backgroundColor: (reqSent || sendingRequest) ? (theme.isDark ? "#334155" : "#CBD5E1") : theme.primary,
              borderRadius: 12,
              paddingVertical: 10,
              alignItems: "center",
              marginTop: 2,
              opacity: (reqSent || sendingRequest) ? 0.85 : 1
            }}
          >
            {sendingRequest ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontSize: 13, fontFamily: fonts.bold }}>
                {reqSent ? "Friend Request Sent ✓" : "Send Friend Request"}
              </Text>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={[styles.inputFooter, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
          <Pressable onPress={() => setShowAttachModal(true)} style={[styles.attachBtn, { backgroundColor: theme.isDark ? "#1E263B" : "#F4F3FA" }]}>
            <Feather name="paperclip" size={20} color={theme.primary} />
          </Pressable>

          <View style={[styles.inputWrap, { backgroundColor: theme.inputBg || theme.bg, borderColor: theme.border }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={theme.subtext}
              style={[styles.textInput, { color: theme.text }]}
              multiline
              maxHeight={100}
              returnKeyType="send"
            />
          </View>

          <Pressable onPress={() => handleSend()} style={[styles.sendBtn, { backgroundColor: theme.primary }, !inputText.trim() && styles.sendBtnDisabled]}>
            <Feather name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
      </View>

      {/* 4. Attachment Options Modal */}
      <Modal visible={showAttachModal} transparent animationType="slide" onRequestClose={() => setShowAttachModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather name="paperclip" size={18} color="#5B3CF5" style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>Share Attachment</Text>
              </View>
              <Pressable onPress={() => setShowAttachModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="#686780" />
              </Pressable>
            </View>

            {/* Type Selector Tabs */}
            <View style={styles.modalTabsRow}>
              <Pressable
                onPress={() => setAttachType("image")}
                style={[styles.modalTabBtn, attachType === "image" && styles.modalTabBtnActive]}
              >
                <Feather name="image" size={15} color={attachType === "image" ? "#5B3CF5" : "#686780"} style={{ marginRight: 6 }} />
                <Text style={[styles.modalTabText, attachType === "image" && styles.modalTabTextActive]}>Photo / Image</Text>
              </Pressable>

              <Pressable
                onPress={() => setAttachType("doc")}
                style={[styles.modalTabBtn, attachType === "doc" && styles.modalTabBtnActive]}
              >
                <MaterialCommunityIcons name="google-drive" size={16} color={attachType === "doc" ? "#0F9D58" : "#686780"} style={{ marginRight: 6 }} />
                <Text style={[styles.modalTabText, attachType === "doc" && styles.modalTabTextActive]}>Google Drive Doc</Text>
              </Pressable>
            </View>

            {attachType === "image" ? (
              previewImageUri ? (
                <View style={{ marginTop: 12 }}>
                  <View style={styles.previewHeaderRow}>
                    <Text style={styles.previewTitle}>Photo Attachment Preview</Text>
                    <Pressable onPress={() => setPreviewImageUri(null)} style={styles.clearPreviewBtn}>
                      <Feather name="x" size={16} color="#7C7C9A" />
                    </Pressable>
                  </View>

                  <Image source={{ uri: previewImageUri }} style={styles.previewImageCard} resizeMode="cover" />

                  <Text style={[styles.inputLabelText, { marginTop: 10 }]}>Add Caption / Message (Optional):</Text>
                  <TextInput
                    value={imageCaptionInput}
                    onChangeText={setImageCaptionInput}
                    placeholder="e.g. Check out this project architecture diagram..."
                    placeholderTextColor="#8A879F"
                    style={styles.modalInput}
                  />

                  <View style={styles.previewActionsRow}>
                    <Pressable onPress={() => setPreviewImageUri(null)} style={styles.cancelPreviewBtn}>
                      <Text style={styles.cancelPreviewBtnText}>Change Photo</Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        handleSendAttachment({
                          type: "image",
                          url: previewImageUri,
                          title: imageCaptionInput || previewImageTitle || "Photo Attachment"
                        })
                      }
                      style={styles.confirmSendPhotoBtn}
                    >
                      <Feather name="send" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.confirmSendPhotoBtnText}>Send Photo Now</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={{ marginTop: 12 }}>
                  {/* 1. Primary Device Gallery Pick Button */}
                  <Pressable onPress={pickImageFromDevice} style={styles.devicePickPrimaryBtn}>
                    <Feather name="upload" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.devicePickPrimaryBtnText}>Pick & Upload Photo from Device 📁</Text>
                  </Pressable>

                  <View style={styles.orDividerRow}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>OR PRESET SAMPLES</Text>
                    <View style={styles.orLine} />
                  </View>

                  <Text style={styles.inputLabelText}>Select Sample Image Preset:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                    {sampleImagePresets.map((preset, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() => {
                          setPreviewImageUri(preset.url);
                          setPreviewImageTitle(preset.label);
                        }}
                        style={styles.presetChip}
                      >
                        <Text style={styles.presetChipText}>{preset.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )
            ) : (
              <View style={{ marginTop: 12 }}>
                {/* Google Drive Info Banner */}
                <View style={styles.driveNoticeBanner}>
                  <MaterialCommunityIcons name="google-drive" size={18} color="#0F9D58" style={{ marginRight: 6 }} />
                  <Text style={styles.driveNoticeText}>Only Google Drive / Google Docs links or PDF files supported.</Text>
                </View>

                {/* Pick Document File Button */}
                <Pressable onPress={pickDocFromDevice} style={[styles.devicePickPrimaryBtn, { backgroundColor: "#0F9D58" }]}>
                  <MaterialCommunityIcons name="file-upload-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.devicePickPrimaryBtnText}>Pick & Upload Document File 📄</Text>
                </Pressable>

                <View style={styles.orDividerRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR PASTE GOOGLE DRIVE LINK</Text>
                  <View style={styles.orLine} />
                </View>

                <Text style={styles.inputLabelText}>Select Sample Google Drive Document:</Text>
                <View style={{ gap: 6, marginVertical: 4 }}>
                  {sampleDrivePresets.map((preset, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleSendAttachment({ type: "doc", driveUrl: preset.url, title: preset.title })}
                      style={styles.drivePresetRow}
                    >
                      <MaterialCommunityIcons name="file-document-outline" size={16} color="#0F9D58" style={{ marginRight: 6 }} />
                      <Text style={styles.drivePresetText} numberOfLines={1}>{preset.title}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.inputLabelText, { marginTop: 6 }]}>Paste Google Drive / Docs Link:</Text>
                <TextInput
                  value={driveLinkInput}
                  onChangeText={setDriveLinkInput}
                  placeholder="https://drive.google.com/file/d/..."
                  placeholderTextColor="#8A879F"
                  style={styles.modalInput}
                />

                <Text style={[styles.inputLabelText, { marginTop: 4 }]}>Document Title:</Text>
                <TextInput
                  value={docTitleInput}
                  onChangeText={setDocTitleInput}
                  placeholder="e.g. Master_Notes.pdf"
                  placeholderTextColor="#8A879F"
                  style={styles.modalInput}
                />

                <Pressable
                  onPress={() => {
                    if (driveLinkInput && !driveLinkInput.includes("drive.google.com") && !driveLinkInput.includes("docs.google.com")) {
                      Alert.alert("Google Drive Only", "Please enter a valid Google Drive or Google Docs link.");
                      return;
                    }
                    handleSendAttachment({ type: "doc", driveUrl: driveLinkInput, title: docTitleInput || "Google Drive Document" });
                  }}
                  style={[styles.sendAttachmentSubmitBtn, { backgroundColor: "#0F9D58" }]}
                >
                  <MaterialCommunityIcons name="google-drive" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.sendAttachmentSubmitText}>Share Google Drive Doc</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 5. Full-Screen Image Lightbox Modal */}
      <Modal
        visible={!!fullscreenImageUri}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setFullscreenImageUri(null)}
      >
        <View style={styles.fullscreenContainer}>
          {/* Header Bar with Share & Download */}
          <View style={styles.fullscreenHeader}>
            <Pressable onPress={() => setFullscreenImageUri(null)} style={styles.fullscreenBackBtn}>
              <Feather name="x" size={22} color="#FFFFFF" />
            </Pressable>

            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <Text style={styles.fullscreenHeaderTitle} numberOfLines={1}>
                {fullscreenImageTitle || "Photo Preview"}
              </Text>
              <Text style={styles.fullscreenHeaderSub}>Full Resolution View</Text>
            </View>

            <View style={styles.fullscreenHeaderActions}>
              <Pressable onPress={handleShareImage} style={styles.fullscreenActionIconBtn}>
                <Feather name="share-2" size={18} color="#FFFFFF" />
              </Pressable>

              <Pressable onPress={handleDownloadImage} style={styles.fullscreenActionIconBtn}>
                <Feather name="download" size={19} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Full Screen Center Image Display */}
          <View style={styles.fullscreenBody}>
            {fullscreenImageUri ? (
              <Image
                source={{ uri: fullscreenImageUri }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            ) : null}
          </View>

          {/* Footer Caption */}
          <View style={styles.fullscreenFooter}>
            <Text style={styles.fullscreenFooterText} numberOfLines={2}>
              📷 {fullscreenImageTitle || "Shared Attachment"}
            </Text>
          </View>
        </View>
      </Modal>

      {/* 6. Chat & Community Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" onRequestClose={() => setShowDetailsModal(false)}>
        <ChatDetailsScreen
          session={session}
          user={user}
          targetUser={currentTarget}
          isChannelChat={isChannelChat}
          isUserMentor={isUserMentor}
          messages={messages}
          onClose={() => setShowDetailsModal(false)}
          onOpenUserProfile={(u) => {
            setShowDetailsModal(false);
            if (onClose) onClose();
            if (onOpenUserProfile) onOpenUserProfile(u || currentTarget);
          }}
          onDeleteChannel={(id, name) => {
            setShowDetailsModal(false);
            if (onDeleteChannel) {
              onDeleteChannel(id, name);
            }
          }}
          onUpdateChannel={(updatedFields) => {
            setTargetUser((prev) => ({ ...prev, ...updatedFields }));
          }}
          onOpenMedia={(m) => {
            setShowDetailsModal(false);
            if (m.imageUrl) {
              setFullscreenImageUri(m.imageUrl);
              setFullscreenImageTitle(m.text || "Shared Media");
              setFullscreenModalVisible(true);
            } else if (m.documentUrl) {
              setReaderPdfUrl(m.documentUrl);
              setReaderPdfTitle(m.documentName || "Shared Document.pdf");
              setDocReaderOpen(true);
            }
          }}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent"
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center"
  },
  headerUserCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8
  },
  avatarWrap: {
    position: "relative",
    marginRight: 10
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#F0EDFF"
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: "#00C853",
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00C853",
    marginRight: 5
  },
  headerTextWrap: {
    flex: 1
  },
  headerName: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: "#181725"
  },
  headerStatus: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: "#7C7C9A"
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center"
  },

  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8
  },
  dateDivider: {
    alignSelf: "center",
    backgroundColor: "#EAE7FF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10
  },
  dateDividerText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#5B3CF5"
  },

  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    gap: 6
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C7C9A"
  },

  // Messages
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
    gap: 8
  },
  msgRowMe: {
    justifyContent: "flex-end"
  },
  msgRowOther: {
    justifyContent: "flex-start"
  },
  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#F0EDFF",
    marginBottom: 2
  },
  msgAvatarMe: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#0A6836",
    marginBottom: 2
  },
  senderLabelName: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#0A6836",
    marginBottom: 3
  },
  msgBubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...shadow.soft
  },
  msgBubbleMe: {
    backgroundColor: "#0A6836",
    borderBottomRightRadius: 4
  },
  msgBubbleOther: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#EBE8FF"
  },
  msgText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18
  },
  msgTextMe: {
    color: "#FFFFFF"
  },
  msgTextOther: {
    color: "#181725"
  },

  msgTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 3
  },
  msgTimeText: {
    fontFamily: fonts.regular,
    fontSize: 9
  },
  msgTimeMe: {
    color: "rgba(255,255,255,0.7)"
  },
  msgTimeOther: {
    color: "#7C7C9A"
  },

  // Quick Prompts
  quickPromptsBar: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "#F4F3FA"
  },
  quickScroll: {
    paddingHorizontal: 10,
    gap: 6
  },
  promptPill: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C8E6C9"
  },
  promptPillText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: "#0A6836"
  },

  // Input Footer
  inputFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0EFFF",
    gap: 8
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2
  },
  inputWrap: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 6 : 2,
    minHeight: 42,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  textInput: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: "#181725",
    paddingVertical: Platform.OS === "ios" ? 4 : 2,
    maxHeight: 100
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0A6836",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    ...shadow.soft
  },
  sendBtnDisabled: {
    backgroundColor: "#81C784"
  },

  // Media & Drive Attachments inside Bubbles
  chatMediaContainer: {
    marginBottom: 6,
    borderRadius: 12,
    overflow: "hidden"
  },
  chatMediaImage: {
    width: 210,
    height: 140,
    borderRadius: 12,
    backgroundColor: "#F0EDFF"
  },

  driveCardContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
    gap: 10,
    borderWidth: 1
  },
  driveCardContainerMe: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderColor: "rgba(255, 255, 255, 0.3)"
  },
  driveCardContainerOther: {
    backgroundColor: "#F4FAF6",
    borderColor: "#D3EBDC"
  },
  driveIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft
  },
  driveFileName: {
    fontFamily: fonts.bold,
    fontSize: 12
  },
  driveFileNameMe: {
    color: "#FFFFFF"
  },
  driveFileNameOther: {
    color: "#181725"
  },
  driveSubtext: {
    fontFamily: fonts.regular,
    fontSize: 9.5,
    marginTop: 2
  },
  driveSubtextMe: {
    color: "#E0D9FF"
  },
  driveSubtextOther: {
    color: "#2E7D32"
  },

  // Attachment Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(24, 23, 37, 0.5)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    ...shadow.soft
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725"
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center"
  },

  // Modal Tabs
  modalTabsRow: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#F4F3FA",
    padding: 4,
    borderRadius: 12
  },
  modalTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10
  },
  modalTabBtnActive: {
    backgroundColor: "#FFFFFF",
    ...shadow.soft
  },
  modalTabText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#686780"
  },
  modalTabTextActive: {
    fontFamily: fonts.bold,
    color: "#181725"
  },

  inputLabelText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: "#4A4A6A",
    marginBottom: 4
  },
  presetChip: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E1FF"
  },
  presetChipText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#5B3CF5"
  },
  modalInput: {
    backgroundColor: "#F8F7FF",
    borderWidth: 1,
    borderColor: "#EBE8FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: "#181725",
    marginBottom: 8
  },
  sendAttachmentSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B3CF5",
    paddingVertical: 11,
    borderRadius: 14,
    marginTop: 10
  },
  sendAttachmentSubmitText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#FFFFFF"
  },

  // Drive Notice & Presets
  driveNoticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 10
  },
  driveNoticeText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: "#2E7D32",
    flex: 1
  },
  drivePresetRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4FAF6",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D3EBDC"
  },
  drivePresetText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: "#2E7D32",
    flex: 1
  },

  // Primary Device Pick Buttons
  devicePickPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B3CF5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    ...shadow.soft
  },
  devicePickPrimaryBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: "#FFFFFF"
  },
  orDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    gap: 8
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#EBE8FF"
  },
  orText: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
    color: "#8A879F"
  },

  // Image Pre-Send Preview Card Styles
  previewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  previewTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: "#181725"
  },
  clearPreviewBtn: {
    padding: 4
  },
  previewImageCard: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    backgroundColor: "#F0EDFF",
    marginBottom: 6
  },
  previewActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8
  },
  cancelPreviewBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F3FA",
    paddingVertical: 10,
    borderRadius: 12
  },
  cancelPreviewBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: "#686780"
  },
  confirmSendPhotoBtn: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B3CF5",
    paddingVertical: 10,
    borderRadius: 12,
    ...shadow.soft
  },
  confirmSendPhotoBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: "#FFFFFF"
  },

  // Rich Media Image Card
  richCardWrapper: {
    marginBottom: 4
  },
  richMediaImageContainer: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 4,
    ...shadow.soft
  },
  richMediaImage: {
    width: 220,
    height: 150,
    borderRadius: 14,
    backgroundColor: "#F0EDFF"
  },
  imageOverlayPill: {
    position: "absolute",
    bottom: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(24, 23, 37, 0.65)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  imageOverlayPillText: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
    color: "#FFFFFF"
  },
  imageCaptionFilename: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2
  },
  imageCaptionFilenameMe: {
    color: "rgba(255,255,255,0.9)"
  },
  imageCaptionFilenameOther: {
    color: "#5B3CF5"
  },

  // Rich Document Card
  richDriveCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 4,
    width: 220,
    borderWidth: 1.5
  },
  richDriveCardMe: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderColor: "rgba(255, 255, 255, 0.35)"
  },
  richDriveCardOther: {
    backgroundColor: "#F4FAF6",
    borderColor: "#C5E7D1"
  },
  richDriveHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8
  },
  richDriveIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft
  },
  richDriveTitle: {
    fontFamily: fonts.bold,
    fontSize: 12.5
  },
  richDriveTitleMe: {
    color: "#FFFFFF"
  },
  richDriveTitleOther: {
    color: "#181725"
  },
  richDriveSub: {
    fontFamily: fonts.regular,
    fontSize: 9.5,
    marginTop: 1
  },
  richDriveSubMe: {
    color: "#E0D9FF"
  },
  richDriveSubOther: {
    color: "#2E7D32"
  },

  richDriveActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10
  },
  richDriveActionBtnMe: {
    backgroundColor: "#FFFFFF"
  },
  richDriveActionBtnOther: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C5E7D1"
  },
  richDriveActionText: {
    fontFamily: fonts.bold,
    fontSize: 11
  },
  richDriveActionTextMe: {
    color: "#5B3CF5"
  },
  richDriveActionTextOther: {
    color: "#2E7D32"
  },

  // Full-Screen Image Lightbox Styles
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#0A0A10"
  },
  fullscreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 14,
    backgroundColor: "rgba(10, 10, 16, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)"
  },
  fullscreenBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  fullscreenHeaderTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FFFFFF"
  },
  fullscreenHeaderSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#A295F7"
  },
  fullscreenHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  fullscreenActionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center"
  },

  fullscreenBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000"
  },
  fullscreenImage: {
    width: "100%",
    height: "100%"
  },

  fullscreenFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "rgba(10, 10, 16, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)"
  },
  fullscreenFooterText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center"
  },

  // WhatsApp Channel Broadcast Post Card Styles
  channelPostCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    width: "100%",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1
  },
  channelPostHeader: {
    flexDirection: "row",
    alignItems: "center"
  },
  channelPostAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19
  },
  channelPostName: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  channelPostTime: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#94A3B8",
    marginTop: 1
  },
  channelPostImage: {
    width: "100%",
    height: 220,
    borderRadius: 12
  },
  channelDocCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  channelDocTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  channelDocSub: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#64748B",
    marginTop: 2
  },
  channelPostText: {
    fontSize: 13.5,
    fontFamily: fonts.regular,
    color: "#1E293B",
    lineHeight: 20,
    marginTop: 10
  },
  channelPostFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9"
  },
  channelPostActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#F8FAFC"
  },
  channelPostActionText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: "#475569"
  }
});
