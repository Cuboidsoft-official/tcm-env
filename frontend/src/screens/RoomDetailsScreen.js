import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { manageDoubtRoom, uploadImageToServer } from "../api/client";
import { useTheme } from "../context/ThemeContext";

const PRESET_AVATARS = [
  { label: "Code Dev", url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80" },
  { label: "Python AI", url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80" },
  { label: "Biology", url: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=300&q=80" },
  { label: "Physics", url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=300&q=80" },
  { label: "Chemistry", url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=300&q=80" },
  { label: "Academy", url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=300&q=80" },
  { label: "Tech Lead", url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=300&q=80" },
  { label: "Discussion", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80" }
];

function getDetailedMembersList(room, session) {
  const memberMap = new Map();

  const currentUserId = String(session?.user?._id || session?.user?.id || "u_self");
  const currentUserName = session?.user?.name || "Student Learner";
  const currentUserAvatar = session?.user?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80";

  const roomAdmins = new Set((room?.admins || []).map(String));
  if (room?.creatorId) roomAdmins.add(String(room.creatorId));

  memberMap.set(currentUserId, {
    id: currentUserId,
    name: currentUserName,
    roleText: roomAdmins.has(currentUserId) ? "Room Administrator" : "Student Member",
    badge: roomAdmins.has(currentUserId) ? "Admin" : "Student",
    badgeBg: roomAdmins.has(currentUserId) ? "#EDE9FE" : "#F1F5F9",
    badgeColor: roomAdmins.has(currentUserId) ? "#6366F1" : "#475569",
    avatar: currentUserAvatar,
    isSelf: true
  });

  if (room?.assignedMentor) {
    const m = room.assignedMentor;
    memberMap.set(m.id || "m1", {
      id: m.id || "m1",
      name: m.name || "Rahul Sharma",
      roleText: m.role || "Lead Academic Mentor",
      badge: "Mentor",
      badgeBg: "#FEF3C7",
      badgeColor: "#D97706",
      avatar: m.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      isMentor: true
    });
  }

  const msgs = room?.messages || [];
  msgs.forEach((msg) => {
    if (msg.isAi || msg.type === "ai_response") return;
    const authorId = String(msg.authorId || msg.id || msg.authorName || "");
    if (!authorId || memberMap.has(authorId)) return;

    const isAdmin = msg.isAdmin || msg.authorRole === "Admin" || roomAdmins.has(authorId);
    memberMap.set(authorId, {
      id: authorId,
      name: msg.authorName || "Group Learner",
      roleText: isAdmin ? "Room Administrator" : "Active Learner",
      badge: isAdmin ? "Admin" : "Student",
      badgeBg: isAdmin ? "#EDE9FE" : "#F1F5F9",
      badgeColor: isAdmin ? "#6366F1" : "#475569",
      avatar: msg.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
    });
  });

  const rawMembers = room?.members || [];
  rawMembers.forEach((mId, idx) => {
    const strId = String(mId);
    if (!memberMap.has(strId)) {
      const isAdmin = roomAdmins.has(strId);
      memberMap.set(strId, {
        id: strId,
        name: `Learner ${strId.slice(-4) || idx + 1}`,
        roleText: isAdmin ? "Room Administrator" : "Student Member",
        badge: isAdmin ? "Admin" : "Student",
        badgeBg: isAdmin ? "#EDE9FE" : "#F1F5F9",
        badgeColor: isAdmin ? "#6366F1" : "#475569",
        avatar: `https://images.unsplash.com/photo-${1535713875002 + idx}?auto=format&fit=crop&w=100&q=80`
      });
    }
  });

  return Array.from(memberMap.values());
}

function extractSharedMediaAndFiles(messages = []) {
  const links = [];
  const codeSnippets = [];
  const attachments = [];

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  messages.forEach((msg) => {
    if (msg.codeSnippet) {
      codeSnippets.push({
        id: msg.id,
        author: msg.authorName || "Learner",
        content: msg.codeSnippet,
        time: msg.time || "Recently"
      });
    }
    if (msg.text) {
      const foundUrls = msg.text.match(urlRegex);
      if (foundUrls) {
        foundUrls.forEach((url) => {
          links.push({
            id: `${msg.id}_${url}`,
            url,
            author: msg.authorName || "Learner",
            time: msg.time || "Recently"
          });
        });
      }
    }
    if (msg.imageUrl || msg.fileUrl) {
      attachments.push({
        id: msg.id,
        url: msg.imageUrl || msg.fileUrl,
        author: msg.authorName || "Learner",
        time: msg.time || "Recently"
      });
    }
  });

  return { links, codeSnippets, attachments, totalCount: links.length + codeSnippets.length + attachments.length };
}

function extractPinnedResources(room) {
  const pinned = [];
  if (room?.pinnedAnnouncement?.text) {
    pinned.push({
      id: "announcement",
      type: "Announcement",
      title: `Announcement by ${room.pinnedAnnouncement.authorName || "Admin"}`,
      content: room.pinnedAnnouncement.text
    });
  }
  (room?.messages || []).forEach((msg) => {
    if (msg.codeSnippet || msg.isSolved || msg.type === "ai_response") {
      pinned.push({
        id: msg.id,
        type: msg.codeSnippet ? "Code Solution" : (msg.isSolved ? "Solved Doubt" : "AI Explanation"),
        title: msg.authorName || "Academic Resource",
        content: (msg.codeSnippet || msg.text || "").slice(0, 200) + "..."
      });
    }
  });
  return pinned;
}

export default function RoomDetailsScreen({ session, room: initialRoom, isAdmin = false, onClose, onRoomUpdated }) {
  const { theme } = useTheme();
  const [room, setRoom] = useState(initialRoom);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(room?.title || "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState(room?.description || "");
  const [muted, setMuted] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Modals
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Search & Media State
  const [searchQuery, setSearchQuery] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [mediaTab, setMediaTab] = useState("links"); // "links" | "snippets" | "media"
  const [avatarInput, setAvatarInput] = useState(room?.roomAvatar || "");

  const currentUserId = String(session?.user?._id || session?.user?.id || "");
  const joinRequests = room?.joinRequests || [];
  const detailedMembers = getDetailedMembersList(room, session);
  const sharedMedia = extractSharedMediaAndFiles(room?.messages || []);
  const pinnedList = extractPinnedResources(room);

  const filteredMembers = detailedMembers.filter((m) =>
    (m.name || "").toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    (m.roleText || "").toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const searchedMessages = (room?.messages || []).filter((msg) =>
    searchQuery.trim() &&
    (msg.text || msg.codeSnippet || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleToggleMute(value) {
    setMuted(value);
    try {
      await manageDoubtRoom(session?.token, room.roomId, { action: "mute_room", isMuted: value });
    } catch (e) {}
    Alert.alert(
      value ? "Notifications Muted 🔕" : "Notifications Unmuted 🔔",
      value ? `You will not receive sound alerts for ${room?.title || "this room"}.` : `Sound alerts enabled for ${room?.title || "this room"}.`
    );
  }

  async function pickImageFromGallery() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required 📸", "Please grant photo gallery permissions to choose a group profile photo.");
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
        }
        setAvatarInput(selectedUri);
        await handleSaveAvatar(selectedUri);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to pick image from gallery.");
    }
  }

  async function handleSaveAvatar(selectedUrl) {
    const urlToSave = (selectedUrl || avatarInput).trim();
    if (!urlToSave) {
      Alert.alert("Invalid Image URL", "Please select a preset avatar or enter an image URL.");
      return;
    }
    try {
      setUpdating(true);
      let finalUrl = urlToSave;
      if (!/^(https?:\/\/|\/uploads\/)/i.test(urlToSave)) {
        try {
          const hosted = await uploadImageToServer(session?.token, urlToSave);
          if (hosted) finalUrl = hosted;
        } catch (e) {}
      }
      const res = await manageDoubtRoom(session?.token, room.roomId, {
        action: "update_info",
        roomAvatar: finalUrl
      });
      if (res && res.room) {
        setRoom(res.room);
        if (onRoomUpdated) onRoomUpdated(res.room);
        setShowAvatarModal(false);
        Alert.alert("Avatar Updated 📸", "Group profile photo updated successfully!");
      }
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to update profile photo.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleSaveTitle() {
    if (!titleInput.trim()) return;
    try {
      setUpdating(true);
      const res = await manageDoubtRoom(session?.token, room.roomId, {
        action: "update_info",
        title: titleInput.trim()
      });
      if (res && res.room) {
        setRoom(res.room);
        if (onRoomUpdated) onRoomUpdated(res.room);
        setIsEditingTitle(false);
      }
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to update title");
    } finally {
      setUpdating(false);
    }
  }

  async function handleSaveDesc() {
    try {
      setUpdating(true);
      const res = await manageDoubtRoom(session?.token, room.roomId, {
        action: "update_info",
        description: descInput.trim()
      });
      if (res && res.room) {
        setRoom(res.room);
        if (onRoomUpdated) onRoomUpdated(res.room);
        setIsEditingDesc(false);
      }
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to update description");
    } finally {
      setUpdating(false);
    }
  }

  async function handleApproveRequest(targetUserId) {
    try {
      const res = await manageDoubtRoom(session?.token, room.roomId, {
        action: "approve_request",
        targetUserId
      });
      if (res && res.room) {
        setRoom(res.room);
        if (onRoomUpdated) onRoomUpdated(res.room);
        Alert.alert("Approved", "Member joined the room successfully.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to approve request.");
    }
  }

  async function handleDeclineRequest(targetUserId) {
    try {
      const res = await manageDoubtRoom(session?.token, room.roomId, {
        action: "decline_request",
        targetUserId
      });
      if (res && res.room) {
        setRoom(res.room);
        if (onRoomUpdated) onRoomUpdated(res.room);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to decline request.");
    }
  }

  async function handlePromoteAdmin(targetUserId) {
    try {
      const res = await manageDoubtRoom(session?.token, room.roomId, {
        action: "promote_admin",
        targetUserId
      });
      if (res && res.room) {
        setRoom(res.room);
        if (onRoomUpdated) onRoomUpdated(res.room);
        Alert.alert("Admin Promoted ⭐", "Member is now a Room Admin.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to promote admin.");
    }
  }

  async function handleRemoveMember(targetUserId) {
    try {
      const res = await manageDoubtRoom(session?.token, room.roomId, {
        action: "remove_member",
        targetUserId
      });
      if (res && res.room) {
        setRoom(res.room);
        if (onRoomUpdated) onRoomUpdated(res.room);
        Alert.alert("Removed", "Member removed from room.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to remove member.");
    }
  }

  async function handleDeleteGroup() {
    const isCreator = String(room?.creatorId || "") === String(session?.user?.id || session?.user?._id || "") ||
                      String(room?.assignedMentor?.id || "") === String(session?.user?.id || session?.user?._id || "") ||
                      isAdmin;

    const performDelete = async () => {
      try {
        setUpdating(true);
        const res = await manageDoubtRoom(session?.token, room.roomId, { action: "delete_group" });
        if (res && (res.success || res.deleted || res.deletedForUser)) {
          Alert.alert(
            isCreator ? "Group Deleted" : "Group Removed",
            isCreator ? "This doubt room has been deleted permanently." : "This doubt room has been removed for you."
          );
          if (onRoomUpdated) onRoomUpdated(null);
          if (onClose) onClose();
        }
      } catch (e) {
        Alert.alert("Error", e.message || "Failed to delete group room.");
      } finally {
        setUpdating(false);
      }
    };

    const confirmMsg = isCreator
      ? "Are you sure you want to permanently delete this Doubt Room? It will be removed for all members."
      : "Are you sure you want to remove this Doubt Room? It will be removed from your room list.";

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(confirmMsg)) {
        performDelete();
      }
      return;
    }

    Alert.alert(
      isCreator ? "Delete Group Room" : "Remove Group Room",
      confirmMsg,
      [
        { text: "Cancel", style: "cancel" },
        { text: isCreator ? "Delete Group" : "Remove", style: "destructive", onPress: performDelete }
      ]
    );
  }

  async function handleLeaveGroup() {
    const isCreator = String(room?.creatorId || "") === String(session?.user?.id || session?.user?._id || "") ||
                      String(room?.assignedMentor?.id || "") === String(session?.user?.id || session?.user?._id || "") ||
                      isAdmin;

    const performLeave = async () => {
      try {
        setUpdating(true);
        const res = await manageDoubtRoom(session?.token, room.roomId, { action: "leave_room" });
        if (res && (res.success || res.left || res.deleted)) {
          Alert.alert("Left Room", isCreator ? "You deleted/left this doubt room." : "You have left this doubt room.");
          if (onRoomUpdated) onRoomUpdated(null);
          if (onClose) onClose();
        }
      } catch (e) {
        if (onClose) onClose();
      } finally {
        setUpdating(false);
      }
    };

    const confirmMsg = isCreator
      ? "As creator, leaving will delete this Doubt Room for all members. Continue?"
      : "Are you sure you want to leave this room?";

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(confirmMsg)) {
        performLeave();
      }
      return;
    }

    Alert.alert(
      "Leave Group Room",
      confirmMsg,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: performLeave }
      ]
    );
  }

  function handleCopyGroupId() {
    try {
      Clipboard.setString(room?.roomId || "NEET-DOUBT-001");
      Alert.alert("Copied 📋", `Group ID "${room?.roomId}" copied to clipboard!`);
    } catch (e) {
      Alert.alert("Group ID", room?.roomId || "NEET-DOUBT-001");
    }
  }

  async function handleInviteViaLink() {
    const inviteUrl = `https://app.thecodemunk.in/community/${room?.roomId || "room-001"}`;
    try {
      Clipboard.setString(inviteUrl);
      await Share.share({
        message: `Join our Last Class Doubt Room "${room?.title || "Learning Group"}":\n${inviteUrl}`,
        url: inviteUrl,
        title: `Join ${room?.title}`
      });
    } catch (e) {
      Alert.alert("Invite Link", inviteUrl);
    }
  }

  const themedSurface = { backgroundColor: theme.cardBg, borderColor: theme.border };
  const themedSoftSurface = { backgroundColor: theme.isDark ? theme.inputBg || "#131927" : "#F8FAFC", borderColor: theme.border };
  const themedBadgeSurface = { backgroundColor: theme.badgeBg, borderColor: theme.border };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. TOP HEADER */}
      <View style={[styles.topHeader, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <Pressable onPress={onClose} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Group Room Details</Text>
        <Pressable onPress={() => setShowQrModal(true)} style={styles.moreBtn}>
          <Feather name="qr-code" size={20} color={theme.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 2. AVATAR SECTION */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {room?.roomAvatar ? (
              <Image source={{ uri: room.roomAvatar }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="code-tags" size={36} color="#FFFFFF" />
              </View>
            )}
            {isAdmin ? (
              <Pressable
                onPress={() => {
                  setAvatarInput(room?.roomAvatar || "");
                  setShowAvatarModal(true);
                }}
                style={styles.cameraBadge}
              >
                <Feather name="camera" size={14} color="#FFFFFF" />
              </Pressable>
            ) : null}
          </View>

          {/* ROOM TITLE */}
          {isEditingTitle && isAdmin ? (
            <View style={styles.inlineEditRow}>
              <TextInput
                value={titleInput}
                onChangeText={setTitleInput}
                style={[styles.inlineInput, { backgroundColor: theme.inputBg || theme.bg, borderColor: theme.primary, color: theme.text }]}
                placeholderTextColor={theme.subtext}
                autoFocus
              />
              <Pressable onPress={handleSaveTitle} style={styles.saveCheckBtn}>
                <Feather name="check" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.titleRow}>
              <Text style={[styles.roomTitle, { color: theme.text }]}>{room?.title || "Last Class Doubt Room"}</Text>
              {isAdmin ? (
                <Pressable onPress={() => setIsEditingTitle(true)} style={styles.pencilBtn}>
                  <Feather name="edit-2" size={14} color="#6366F1" />
                </Pressable>
              ) : null}
            </View>
          )}

          {/* GROUP ID */}
          <Pressable onPress={handleCopyGroupId} style={[styles.groupIdPill, { backgroundColor: theme.badgeBg }]}>
            <Text style={[styles.groupIdText, { color: theme.primary }]}>Group ID: {room?.roomId || "FSD-1024"}</Text>
            <Feather name="copy" size={12} color={theme.primary} style={{ marginLeft: 4 }} />
          </Pressable>
        </View>

        {/* 3. DESCRIPTION BOX */}
        <View style={[styles.descBox, themedSoftSurface]}>
          {isEditingDesc && isAdmin ? (
            <View style={{ gap: 8 }}>
              <TextInput
                value={descInput}
                onChangeText={setDescInput}
                multiline
                style={[styles.descInputArea, { backgroundColor: theme.inputBg || theme.bg, borderColor: theme.primary, color: theme.text }]}
                placeholder="Enter room description..."
                placeholderTextColor={theme.subtext}
              />
              <Pressable onPress={handleSaveDesc} style={styles.saveDescBtn}>
                <Text style={styles.saveDescText}>Save Description</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Text style={[styles.descText, { color: theme.subtext }]}>
                {room?.description || "A place for learners to ask doubts, share resources and grow together with Last Class Academy Mentors!"}
              </Text>
              {isAdmin ? (
                <Pressable onPress={() => setIsEditingDesc(true)} style={{ padding: 4, marginLeft: 6 }}>
                  <Feather name="edit-2" size={14} color="#6366F1" />
                </Pressable>
              ) : null}
            </View>
          )}
        </View>

        {/* 4. STATS BAR */}
        <View style={[styles.statsCard, themedSurface]}>
          <View style={styles.statCol}>
            <Feather name="users" size={18} color="#6366F1" />
            <Text style={[styles.statNumber, { color: theme.text }]}>{detailedMembers.length}</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Members</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

          <View style={styles.statCol}>
            <Feather name="user" size={18} color="#6366F1" />
            <Text style={[styles.statNumber, { color: theme.text }]}>{Math.max(1, detailedMembers.filter((m) => !m.isMentor).length)}</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Students</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

          <View style={styles.statCol}>
            <Feather name="folder" size={18} color="#6366F1" />
            <Text style={[styles.statNumber, { color: theme.text }]}>{sharedMedia.totalCount}</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Shared Files</Text>
          </View>
        </View>

        {/* 5. PENDING JOIN REQUESTS (ADMIN ONLY) */}
        {isAdmin && joinRequests.length > 0 ? (
          <View style={[styles.requestsSection, themedSurface]}>
            <View style={styles.requestsHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather name="clock" size={16} color="#6366F1" style={{ marginRight: 6 }} />
                <Text style={[styles.requestsTitle, { color: theme.text }]}>Pending Join Requests</Text>
                <View style={[styles.reqBadge, { backgroundColor: theme.badgeBg }]}>
                  <Text style={[styles.reqBadgeText, { color: theme.primary }]}>{joinRequests.length}</Text>
                </View>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
              {joinRequests.map((reqItem, idx) => (
                <View key={idx} style={[styles.reqCard, themedSoftSurface]}>
                  <Image source={{ uri: reqItem.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" }} style={styles.reqAvatar} />
                  <Text style={[styles.reqName, { color: theme.text }]} numberOfLines={1}>{reqItem.userName || "Student"}</Text>
                  <Text style={[styles.reqTime, { color: theme.subtext }]}>{reqItem.requestedAt || "Recently"}</Text>

                  <View style={styles.reqActionRow}>
                    <Pressable onPress={() => handleApproveRequest(reqItem.userId)} style={styles.approveBtn}>
                      <Feather name="check" size={14} color="#166534" />
                    </Pressable>
                    <Pressable onPress={() => handleDeclineRequest(reqItem.userId)} style={styles.declineBtn}>
                      <Feather name="x" size={14} color="#991B1B" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* 6. ACTION ROWS */}
        <View style={[styles.actionsCard, themedSurface]}>
          {/* MEMBERS ROW */}
          <Pressable onPress={() => setShowMembersModal(true)} style={[styles.actionRow, { borderBottomColor: theme.border }]}>
            <View style={styles.actionLeft}>
              <Feather name="users" size={18} color="#6366F1" style={{ marginRight: 12 }} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Members ({detailedMembers.length})</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </View>
          </Pressable>

          {/* PINNED RESOURCES */}
          <Pressable onPress={() => setShowPinnedModal(true)} style={[styles.actionRow, { borderBottomColor: theme.border }]}>
            <View style={styles.actionLeft}>
              <Feather name="pin" size={18} color="#6366F1" style={{ marginRight: 12 }} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Pinned Resources</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[styles.numBadge, { backgroundColor: theme.badgeBg }]}>
                <Text style={[styles.numBadgeText, { color: theme.primary }]}>{pinnedList.length}</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </View>
          </Pressable>

          {/* MEDIA, LINKS & FILES */}
          <Pressable onPress={() => setShowMediaModal(true)} style={[styles.actionRow, { borderBottomColor: theme.border }]}>
            <View style={styles.actionLeft}>
              <Feather name="folder" size={18} color="#10B981" style={{ marginRight: 12 }} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Media, Links & Files</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[styles.numBadge, { backgroundColor: theme.badgeBg }]}>
                <Text style={[styles.numBadgeText, { color: theme.primary }]}>{sharedMedia.totalCount}</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </View>
          </Pressable>

          {/* MUTE NOTIFICATIONS */}
          <View style={[styles.actionRow, { borderBottomColor: theme.border }]}>
            <View style={styles.actionLeft}>
              <Feather name={muted ? "bell-off" : "bell"} size={18} color={muted ? "#94A3B8" : "#6366F1"} style={{ marginRight: 12 }} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Mute Notifications</Text>
            </View>
            <Switch
              value={muted}
              onValueChange={handleToggleMute}
              trackColor={{ false: "#E2E8F0", true: "#C4B5FD" }}
              thumbColor={muted ? "#6366F1" : "#F8FAFC"}
            />
          </View>

          {/* SEARCH MESSAGES */}
          <Pressable onPress={() => setShowSearchModal(true)} style={[styles.actionRow, { borderBottomColor: theme.border }]}>
            <View style={styles.actionLeft}>
              <Feather name="search" size={18} color="#38BDF8" style={{ marginRight: 12 }} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Search Messages</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#94A3B8" />
          </Pressable>

          {/* INVITE VIA LINK */}
          <Pressable onPress={handleInviteViaLink} style={[styles.actionRow, { borderBottomColor: theme.border }]}>
            <View style={styles.actionLeft}>
              <Feather name="link" size={18} color="#6366F1" style={{ marginRight: 12 }} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Invite via Link</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#94A3B8" />
          </Pressable>

          {/* SHARE QR CODE */}
          <Pressable onPress={() => setShowQrModal(true)} style={[styles.actionRow, { borderBottomWidth: 0 }]}>
            <View style={styles.actionLeft}>
              <Feather name="grid" size={18} color="#10B981" style={{ marginRight: 12 }} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Share QR Code</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#94A3B8" />
          </Pressable>
        </View>

        {/* DANGER ZONE */}
        <View style={[styles.actionsCard, themedSurface, { marginTop: 16 }]}>
          <Pressable onPress={handleDeleteGroup} style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Feather name="trash-2" size={18} color="#EF4444" style={{ marginRight: 12 }} />
              <Text style={[styles.actionLabel, { color: "#EF4444", fontWeight: "700" }]}>
                {isAdmin ? "Delete Group Room" : "Remove Group Room"}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#FCA5A5" />
          </Pressable>

          <Pressable onPress={handleLeaveGroup} style={[styles.actionRow, { borderBottomWidth: 0 }]}>
            <View style={styles.actionLeft}>
              <Feather name="log-out" size={18} color="#EF4444" style={{ marginRight: 12 }} />
              <Text style={[styles.actionLabel, { color: "#EF4444" }]}>Leave Group</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#FCA5A5" />
          </Pressable>
        </View>
      </ScrollView>

      {/* 1. MEMBERS LIST MODAL */}
      <Modal visible={showMembersModal} transparent animationType="slide" onRequestClose={() => setShowMembersModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Room Members ({detailedMembers.length})</Text>
              <Pressable onPress={() => setShowMembersModal(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.searchBarBox}>
              <Feather name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                value={memberSearchQuery}
                onChangeText={setMemberSearchQuery}
                placeholder="Search members..."
                style={{ flex: 1, fontSize: 13, color: "#0F172A" }}
              />
            </View>

            <ScrollView style={{ maxHeight: 320, marginVertical: 8 }}>
              {filteredMembers.map((m, idx) => (
                <View key={idx} style={styles.memberRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <Image source={{ uri: m.avatar }} style={styles.memberAvatarCircle} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={styles.memberName} numberOfLines={1}>{m.name}</Text>
                        <View style={[styles.roleBadge, { backgroundColor: m.badgeBg }]}>
                          <Text style={[styles.roleBadgeText, { color: m.badgeColor }]}>{m.badge}</Text>
                        </View>
                      </View>
                      <Text style={styles.memberRole}>{m.roleText}</Text>
                    </View>
                  </View>

                  {isAdmin && !m.isSelf && !m.isMentor ? (
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {m.badge !== "Admin" && (
                        <Pressable onPress={() => handlePromoteAdmin(m.id)} style={styles.makeAdminBtn}>
                          <Text style={styles.makeAdminText}>Make Admin</Text>
                        </Pressable>
                      )}
                      <Pressable onPress={() => handleRemoveMember(m.id)} style={styles.removeBtn}>
                        <Text style={styles.removeText}>Remove</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. PINNED RESOURCES MODAL */}
      <Modal visible={showPinnedModal} transparent animationType="slide" onRequestClose={() => setShowPinnedModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pinned Resources ({pinnedList.length})</Text>
              <Pressable onPress={() => setShowPinnedModal(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 340, marginVertical: 8 }}>
              {pinnedList.length === 0 ? (
                <Text style={styles.emptyText}>No pinned resources in this group yet.</Text>
              ) : (
                pinnedList.map((item, idx) => (
                  <View key={idx} style={styles.resourceCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <Text style={styles.resourceType}>{item.type}</Text>
                      <Pressable
                        onPress={() => {
                          Clipboard.setString(item.content);
                          Alert.alert("Copied 📋", "Resource copied to clipboard!");
                        }}
                      >
                        <Feather name="copy" size={14} color="#6366F1" />
                      </Pressable>
                    </View>
                    <Text style={styles.resourceTitle}>{item.title}</Text>
                    <Text style={styles.resourceContent}>{item.content}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 3. MEDIA, LINKS & FILES MODAL */}
      <Modal visible={showMediaModal} transparent animationType="slide" onRequestClose={() => setShowMediaModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Media & Shared Files ({sharedMedia.totalCount})</Text>
              <Pressable onPress={() => setShowMediaModal(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            {/* TAB SELECTOR */}
            <View style={styles.mediaTabsRow}>
              <Pressable onPress={() => setMediaTab("links")} style={[styles.mediaTabBtn, mediaTab === "links" && styles.mediaTabActive]}>
                <Text style={[styles.mediaTabText, mediaTab === "links" && styles.mediaTabTextActive]}>Links ({sharedMedia.links.length})</Text>
              </Pressable>
              <Pressable onPress={() => setMediaTab("snippets")} style={[styles.mediaTabBtn, mediaTab === "snippets" && styles.mediaTabActive]}>
                <Text style={[styles.mediaTabText, mediaTab === "snippets" && styles.mediaTabTextActive]}>Code ({sharedMedia.codeSnippets.length})</Text>
              </Pressable>
              <Pressable onPress={() => setMediaTab("media")} style={[styles.mediaTabBtn, mediaTab === "media" && styles.mediaTabActive]}>
                <Text style={[styles.mediaTabText, mediaTab === "media" && styles.mediaTabTextActive]}>Media ({sharedMedia.attachments.length})</Text>
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 300, marginVertical: 8 }}>
              {mediaTab === "links" && (
                sharedMedia.links.length === 0 ? <Text style={styles.emptyText}>No links shared yet.</Text> :
                sharedMedia.links.map((lnk, idx) => (
                  <View key={idx} style={styles.mediaItemCard}>
                    <Feather name="link" size={16} color="#6366F1" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mediaItemUrl} numberOfLines={1}>{lnk.url}</Text>
                      <Text style={styles.mediaItemSub}>Shared by {lnk.author} • {lnk.time}</Text>
                    </View>
                    <Pressable onPress={() => { Clipboard.setString(lnk.url); Alert.alert("Copied 📋", "Link copied!"); }}>
                      <Feather name="copy" size={14} color="#6366F1" />
                    </Pressable>
                  </View>
                ))
              )}

              {mediaTab === "snippets" && (
                sharedMedia.codeSnippets.length === 0 ? <Text style={styles.emptyText}>No code snippets shared yet.</Text> :
                sharedMedia.codeSnippets.map((snp, idx) => (
                  <View key={idx} style={styles.mediaItemCard}>
                    <Feather name="code" size={16} color="#10B981" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mediaItemUrl} numberOfLines={1}>{snp.content.slice(0, 40)}...</Text>
                      <Text style={styles.mediaItemSub}>Shared by {snp.author} • {snp.time}</Text>
                    </View>
                    <Pressable onPress={() => { Clipboard.setString(snp.content); Alert.alert("Copied 📋", "Code copied!"); }}>
                      <Feather name="copy" size={14} color="#6366F1" />
                    </Pressable>
                  </View>
                ))
              )}

              {mediaTab === "media" && (
                sharedMedia.attachments.length === 0 ? <Text style={styles.emptyText}>No media files shared yet.</Text> :
                sharedMedia.attachments.map((att, idx) => (
                  <View key={idx} style={styles.mediaItemCard}>
                    <Feather name="image" size={16} color="#F59E0B" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mediaItemUrl} numberOfLines={1}>{att.url}</Text>
                      <Text style={styles.mediaItemSub}>Shared by {att.author} • {att.time}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 4. SEARCH MESSAGES MODAL */}
      <Modal visible={showSearchModal} transparent animationType="slide" onRequestClose={() => setShowSearchModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Room Messages</Text>
              <Pressable onPress={() => setShowSearchModal(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.searchBarBox}>
              <Feather name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Type keyword (e.g. python, formula, doubt)..."
                style={{ flex: 1, fontSize: 13, color: "#0F172A" }}
                autoFocus
              />
            </View>

            <ScrollView style={{ maxHeight: 300, marginVertical: 8 }}>
              {!searchQuery.trim() ? (
                <Text style={styles.emptyText}>Type above to search messages in this doubt room.</Text>
              ) : searchedMessages.length === 0 ? (
                <Text style={styles.emptyText}>No messages matching "{searchQuery}".</Text>
              ) : (
                searchedMessages.map((msg, idx) => (
                  <View key={idx} style={styles.searchCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={styles.searchAuthor}>{msg.authorName || "Learner"}</Text>
                      <Text style={styles.searchTime}>{msg.time || "Today"}</Text>
                    </View>
                    <Text style={styles.searchText}>{msg.text || msg.codeSnippet}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 5. SHARE QR CODE MODAL */}
      <Modal visible={showQrModal} transparent animationType="fade" onRequestClose={() => setShowQrModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { alignItems: "center", paddingVertical: 24 }]}>
            <Pressable onPress={() => setShowQrModal(false)} style={{ alignSelf: "flex-end", marginBottom: 10 }}>
              <Feather name="x" size={20} color="#64748B" />
            </Pressable>

            <Text style={styles.qrHeaderTitle}>{room?.title || "Last Class Doubt Room"}</Text>
            <Text style={styles.qrHeaderSub}>{room?.category || "Last Class Academic Group"} • ID: {room?.roomId}</Text>

            {/* VISUAL QR CARD */}
            <View style={styles.qrCardContainer}>
              <View style={styles.qrMatrixGrid}>
                {[...Array(16)].map((_, i) => (
                  <View key={i} style={[styles.qrMatrixCell, { backgroundColor: (i % 2 === 0 || i % 5 === 0) ? "#0F172A" : "#6366F1" }]} />
                ))}
              </View>
              <View style={styles.qrCenterBadge}>
                <MaterialCommunityIcons name="code-tags" size={20} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.qrScanText}>Scan to join room on Last Class Academy</Text>
            <Text style={styles.qrUrlText}>app.thecodemunk.in/community/{room?.roomId}</Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 16, width: "100%" }}>
              <TouchableOpacity onPress={handleInviteViaLink} style={[styles.qrBtn, { backgroundColor: "#6366F1", flex: 1 }]}>
                <Feather name="share-2" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.qrBtnText}>Share Link</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCopyGroupId} style={[styles.qrBtn, { backgroundColor: "#F1F5F9", flex: 1 }]}>
                <Feather name="copy" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={[styles.qrBtnText, { color: "#0F172A" }]}>Copy ID</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* 6. EDIT AVATAR MODAL */}
      <Modal visible={showAvatarModal} transparent animationType="slide" onRequestClose={() => setShowAvatarModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Group Profile Photo 📸</Text>
              <Pressable onPress={() => setShowAvatarModal(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            {/* 1. UPLOAD FROM GALLERY BUTTON */}
            <TouchableOpacity
              onPress={pickImageFromGallery}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#EEF2FF",
                borderWidth: 1.5,
                borderColor: "#6366F1",
                borderStyle: "dashed",
                borderRadius: 12,
                paddingVertical: 14,
                marginBottom: 14
              }}
            >
              <Feather name="upload-cloud" size={20} color="#6366F1" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#6366F1" }}>
                Upload Photo from Gallery / Device
              </Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}>Or select a preset avatar / custom URL below:</Text>

            {/* PRESET AVATARS GRID */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              {PRESET_AVATARS.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSaveAvatar(preset.url)}
                  style={{ alignItems: "center", width: "22%" }}
                >
                  <Image
                    source={{ uri: preset.url }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      borderWidth: avatarInput === preset.url ? 3 : 1,
                      borderColor: avatarInput === preset.url ? "#6366F1" : "#CBD5E1"
                    }}
                  />
                  <Text style={{ fontSize: 10, fontWeight: "600", color: "#334155", marginTop: 4, textAlign: "center" }} numberOfLines={1}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 12, fontWeight: "700", color: "#0F172A", marginBottom: 6 }}>Or Enter Custom Image URL:</Text>
            <View style={styles.searchBarBox}>
              <Feather name="image" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                value={avatarInput}
                onChangeText={setAvatarInput}
                placeholder="https://images.unsplash.com/..."
                style={{ flex: 1, fontSize: 13, color: "#0F172A" }}
              />
            </View>

            <TouchableOpacity onPress={() => handleSaveAvatar()} disabled={updating} style={[styles.saveDescBtn, { marginTop: 12 }]}>
              {updating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveDescText}>Save Group Profile Photo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 14 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  backBtn: {
    padding: 4
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A"
  },
  moreBtn: {
    padding: 4
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 16
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 12
  },
  avatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center"
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  roomTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A"
  },
  pencilBtn: {
    padding: 4,
    marginLeft: 6
  },
  inlineEditRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  inlineInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#6366F1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: "700",
    minWidth: 180
  },
  saveCheckBtn: {
    backgroundColor: "#6366F1",
    padding: 8,
    borderRadius: 8,
    marginLeft: 6
  },
  groupIdPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6
  },
  groupIdText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366F1"
  },
  descBox: {
    backgroundColor: "#F5F3FF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DDD6FE"
  },
  descText: {
    flex: 1,
    fontSize: 13,
    color: "#3730A3",
    lineHeight: 19
  },
  descInputArea: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#6366F1"
  },
  saveDescBtn: {
    backgroundColor: "#6366F1",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center"
  },
  saveDescText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  statCol: {
    flex: 1,
    alignItems: "center"
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 4
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#F1F5F9"
  },
  requestsSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  requestsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  requestsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A"
  },
  reqBadge: {
    backgroundColor: "#DDD6FE",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6
  },
  reqBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6366F1"
  },
  reqCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    width: 110,
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  reqAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 6
  },
  reqName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A"
  },
  reqTime: {
    fontSize: 10,
    color: "#94A3B8",
    marginBottom: 8
  },
  reqActionRow: {
    flexDirection: "row",
    gap: 6
  },
  approveBtn: {
    backgroundColor: "#DCFCE7",
    padding: 6,
    borderRadius: 8
  },
  declineBtn: {
    backgroundColor: "#FEE2E2",
    padding: 6,
    borderRadius: 8
  },
  actionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B"
  },
  numBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6
  },
  numBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end"
  },
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    width: "100%"
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A"
  },
  searchBarBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  memberAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  memberName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A"
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700"
  },
  memberRole: {
    fontSize: 11,
    color: "#64748B"
  },
  makeAdminBtn: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  makeAdminText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6366F1"
  },
  removeBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  removeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EF4444"
  },
  emptyText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginVertical: 20
  },
  resourceCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  resourceType: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6366F1",
    textTransform: "uppercase"
  },
  resourceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2
  },
  resourceContent: {
    fontSize: 12,
    color: "#334155"
  },
  mediaTabsRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 3,
    marginBottom: 10
  },
  mediaTabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 8
  },
  mediaTabActive: {
    backgroundColor: "#FFFFFF"
  },
  mediaTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B"
  },
  mediaTabTextActive: {
    color: "#6366F1"
  },
  mediaItemCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  mediaItemUrl: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A"
  },
  mediaItemSub: {
    fontSize: 11,
    color: "#94A3B8"
  },
  searchCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  searchAuthor: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366F1"
  },
  searchTime: {
    fontSize: 10,
    color: "#94A3B8"
  },
  searchText: {
    fontSize: 13,
    color: "#0F172A",
    marginTop: 4
  },
  qrHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A"
  },
  qrHeaderSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 16
  },
  qrCardContainer: {
    width: 140,
    height: 140,
    backgroundColor: "#0F172A",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 16
  },
  qrMatrixGrid: {
    width: 100,
    height: 100,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4
  },
  qrMatrixCell: {
    width: 20,
    height: 20,
    borderRadius: 4
  },
  qrCenterBadge: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  qrScanText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A"
  },
  qrUrlText: {
    fontSize: 12,
    color: "#6366F1",
    fontWeight: "600",
    marginTop: 2
  },
  qrBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10
  },
  qrBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF"
  }
});
