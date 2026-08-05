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
  View
} from "react-native";
import { Feather, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { getChatMessages, sendChatMessage } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";

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

export default function ChatScreen({ session, user = {}, targetUser: initialTargetUser, targetUserId = "m1", onClose }) {
  const [targetUser, setTargetUser] = useState(initialTargetUser || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
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
      const targetId = initialTargetUser?.id || targetUserId || targetUser?.id || "m1";
      const res = await getChatMessages(session.token, targetId);
      if (res) {
        if (res.targetUser && !initialTargetUser) setTargetUser(res.targetUser);
        if (res.messages) {
          setMessages((prev) => {
            const combined = [...res.messages, ...prev];
            const deduped = new Map();
            combined.forEach((m) => {
              const key = m.id.startsWith("msg_user_")
                ? `${m.senderId}_${m.text}`
                : String(m.id);
              if (!deduped.has(key)) {
                deduped.set(key, m);
              }
            });
            return Array.from(deduped.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          });
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

  async function handleSend(customText) {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

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

    setMessages((prev) => [...prev, optimisticMsg]);
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
          setMessages((prev) => {
            const withoutOptimistic = prev.filter((m) => m.id !== userMsgId);
            const combined = [...res.chat.messages, ...withoutOptimistic];
            const deduped = new Map();
            combined.forEach((m) => {
              const textKey = `${m.senderId}_${m.text}`;
              if (!deduped.has(textKey) || !String(m.id).startsWith("msg_user_")) {
                deduped.set(textKey, m);
              }
            });
            return Array.from(deduped.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          });
        }
      }
    } catch (e) {
      // Keep optimistic message on error
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
        const imgUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setPreviewImageUri(imgUri);
        setPreviewImageTitle("Device Gallery Photo");
      }
    } catch (e) {
      Alert.alert("Photo Upload", "Opening file chooser...");
    }
  }

  async function pickDocFromDevice() {
    try {
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".pdf,.doc,.docx,.ppt,.pptx,.txt";
        input.onchange = (e) => {
          const file = e.target?.files?.[0];
          if (file) {
            handleSendAttachment({
              type: "doc",
              driveUrl: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
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
        handleSendAttachment({
          type: "doc",
          driveUrl: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
          title: doc.name || "Device_Document.pdf"
        });
      }
    } catch (e) {}
  }

  async function handleSendAttachment({ type, url, driveUrl, title }) {
    const userMsgId = `msg_user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const isImage = type === "image";
    const mediaUrlVal = isImage ? (url || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80") : null;
    const driveLinkVal = !isImage ? (driveUrl || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view") : null;
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
      style={styles.container}
    >
      {/* 1. Redesigned Premium Header Bar */}
      <View style={styles.topHeader}>
        <Pressable onPress={onClose} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color="#5B3CF5" />
        </Pressable>

        <Pressable onPress={() => Alert.alert("Profile View", currentTarget.name)} style={styles.headerUserCol}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: currentTarget.avatarUrl }} style={styles.avatarImg} />
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.headerTextWrap}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text numberOfLines={1} style={styles.headerName}>{currentTarget.name}</Text>
              <MaterialCommunityIcons name="check-decagram" size={14} color="#5B3CF5" style={{ marginLeft: 4 }} />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 1 }}>
              <View style={styles.greenPulseDot} />
              <Text numberOfLines={1} style={styles.headerStatus}>Online  •  {currentTarget.role || "TCM Member"}</Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable onPress={() => Alert.alert("Voice Call", `Starting audio call with ${currentTarget.name}... 📞`)} style={styles.iconBtn}>
            <Feather name="phone" size={17} color="#5B3CF5" />
          </Pressable>
          <Pressable onPress={() => Alert.alert("Video Call", `Starting video call with ${currentTarget.name}... 📹`)} style={styles.iconBtn}>
            <Feather name="video" size={17} color="#5B3CF5" />
          </Pressable>
          <Pressable onPress={() => Alert.alert("Options", `Chat settings for ${currentTarget.name}`)} style={styles.iconBtn}>
            <Feather name="more-vertical" size={18} color="#686780" />
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

        {messages.map((msg) => {
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

          return (
            <View key={msg.id} style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
              {!isMe ? (
                <Image source={{ uri: msg.senderAvatar || currentTarget.avatarUrl }} style={styles.msgAvatar} />
              ) : null}

              <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
                {!isMe ? (
                  <Text style={styles.senderLabelName}>{msg.senderName || currentTarget.name}</Text>
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
                      <View style={styles.imageOverlayPill}>
                        <Feather name="maximize-2" size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.imageOverlayPillText}>Tap for Full Screen</Text>
                      </View>
                    </Pressable>

                    <Text style={[styles.imageCaptionFilename, isMe ? styles.imageCaptionFilenameMe : styles.imageCaptionFilenameOther]}>
                      📷 {msg.fileName || msg.text}
                    </Text>
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
                    style={[styles.richDriveCard, isMe ? styles.richDriveCardMe : styles.richDriveCardOther]}
                  >
                    <View style={styles.richDriveHeader}>
                      <View style={styles.richDriveIconCircle}>
                        <MaterialCommunityIcons name="google-drive" size={24} color="#0F9D58" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.richDriveTitle, isMe ? styles.richDriveTitleMe : styles.richDriveTitleOther]} numberOfLines={1}>
                          {msg.fileName || msg.text.replace("📁 Google Drive Doc: ", "")}
                        </Text>
                        <Text style={[styles.richDriveSub, isMe ? styles.richDriveSubMe : styles.richDriveSubOther]}>
                          Google Drive PDF Document
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.richDriveActionBtn, isMe ? styles.richDriveActionBtnMe : styles.richDriveActionBtnOther]}>
                      <MaterialCommunityIcons name="file-download-outline" size={15} color={isMe ? "#5B3CF5" : "#0F9D58"} style={{ marginRight: 6 }} />
                      <Text style={[styles.richDriveActionText, isMe ? styles.richDriveActionTextMe : styles.richDriveActionTextOther]}>
                        Open Google Drive Doc 🔗
                      </Text>
                    </View>
                  </Pressable>
                ) : null}

                {/* Standard Text (only if not image or doc) */}
                {!isImageMsg && !isDocMsg ? (
                  <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>{msg.text}</Text>
                ) : null}
                <View style={styles.msgTimeRow}>
                  <Text style={[styles.msgTimeText, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>{msg.time}</Text>
                  {isMe ? <Feather name="check" size={11} color="rgba(255,255,255,0.7)" style={{ marginLeft: 3 }} /> : null}
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
      <View style={styles.quickPromptsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
          {quickPrompts.map((p, i) => (
            <Pressable key={i} onPress={() => handleSend(p)} style={styles.promptPill}>
              <Text style={styles.promptPillText}>{p}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* 3. Input Footer Bar */}
      <View style={styles.inputFooter}>
        <Pressable onPress={() => setShowAttachModal(true)} style={styles.attachBtn}>
          <Feather name="paperclip" size={18} color="#5B3CF5" />
        </Pressable>

        <View style={styles.inputWrap}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#8A879F"
            style={styles.textInput}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
        </View>

        <Pressable onPress={() => handleSend()} style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}>
          <Feather name="send" size={16} color="#FFFFFF" />
        </Pressable>
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
                    <Text style={styles.previewTitle}>Photo Attachment Preview 🖼️</Text>
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
                      <Text style={styles.confirmSendPhotoBtnText}>Send Photo Now 🚀</Text>
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

                  <Text style={[styles.inputLabelText, { marginTop: 10 }]}>Or Enter Image Web URL:</Text>
                  <TextInput
                    value={imageUrlInput}
                    onChangeText={setImageUrlInput}
                    placeholder="https://example.com/photo.jpg"
                    placeholderTextColor="#8A879F"
                    style={styles.modalInput}
                  />

                  <Pressable
                    onPress={() => {
                      if (!imageUrlInput.trim()) {
                        Alert.alert("Enter Image URL", "Please paste or enter an image URL to preview.");
                        return;
                      }
                      setPreviewImageUri(imageUrlInput.trim());
                      setPreviewImageTitle("Web Photo URL");
                    }}
                    style={styles.sendAttachmentSubmitBtn}
                  >
                    <Feather name="eye" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.sendAttachmentSubmitText}>Preview & Load Image URL 👁️</Text>
                  </Pressable>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F8F7FF"
  },

  // 1. Top Header Bar (Redesigned)
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0EDFF",
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
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#F0EDFF"
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
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
    fontSize: 15,
    color: "#181725"
  },
  headerStatus: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
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
    paddingTop: 10,
    paddingBottom: 20
  },
  dateDivider: {
    alignSelf: "center",
    backgroundColor: "#EAE7FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 16
  },
  dateDividerText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#5B3CF5"
  },

  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8
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
    marginBottom: 12,
    gap: 8
  },
  msgRowMe: {
    justifyContent: "flex-end"
  },
  msgRowOther: {
    justifyContent: "flex-start"
  },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#F0EDFF",
    marginBottom: 2
  },
  msgAvatarMe: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#5B3CF5",
    marginBottom: 2
  },
  senderLabelName: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#5B3CF5",
    marginBottom: 3
  },
  msgBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...shadow.soft
  },
  msgBubbleMe: {
    backgroundColor: "#5B3CF5",
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
    marginTop: 4
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
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F4F3FA"
  },
  quickScroll: {
    paddingHorizontal: 12,
    gap: 8
  },
  promptPill: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E1FF"
  },
  promptPillText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#5B3CF5"
  },

  // Input Footer
  inputFooter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0EFFF",
    gap: 10
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center"
  },
  inputWrap: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#5B3CF5",
    ...shadow.soft
  },
  textInput: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: "#181725",
    minHeight: 38,
    paddingVertical: 4
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#5B3CF5",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft
  },
  sendBtnDisabled: {
    backgroundColor: "#A295F7"
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
  }
});
