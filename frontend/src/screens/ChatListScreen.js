import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getChatConversations, getDoubtsList, createDoubtThread, getDoubtRooms, createDoubtRoom, searchKnowledgeBase } from "../api/client";
import { shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

export default function ChatListScreen({ session, onSelectChat, onSelectDoubtRoom, showSearchInput: externalShowSearch, onToggleSearch, chatCreateTrigger, onOpenSidebar }) {
  const [activeTab, setActiveTab] = useState("chats"); // "chats" | "doubts"
  const [searchQuery, setSearchQuery] = useState("");
  const [internalShowSearch, setInternalShowSearch] = useState(false);
  const showSearchInput = externalShowSearch !== undefined ? externalShowSearch : internalShowSearch;
  const setShowSearchInput = (val) => {
    if (onToggleSearch) onToggleSearch(val);
    setInternalShowSearch(val);
  };
  const [conversations, setConversations] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [doubtRooms, setDoubtRooms] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingDoubts, setLoadingDoubts] = useState(true);

  useEffect(() => {
    if (chatCreateTrigger > 0) {
      if (activeTab === "chats") {
        setShowRoomModal(true);
      } else {
        setShowDoubtModal(true);
      }
    }
  }, [chatCreateTrigger]);

  // Create Individual Doubt Modal State
  const [showDoubtModal, setShowDoubtModal] = useState(false);
  const [doubtTitle, setDoubtTitle] = useState("");
  const [doubtSubject, setDoubtSubject] = useState("Full Stack Web & Mobile");
  const [creatingDoubt, setCreatingDoubt] = useState(false);

  // Create Doubt Room Modal State
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [roomCategory, setRoomCategory] = useState("NEET");
  const [roomDescription, setRoomDescription] = useState("");
  const [isRoomPrivate, setIsRoomPrivate] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Knowledge Base Modal State
  const [showKbModal, setShowKbModal] = useState(false);
  const [kbQuery, setKbQuery] = useState("");
  const [kbResults, setKbResults] = useState([]);
  const [loadingKb, setLoadingKb] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchDoubtsAndRooms();
  }, [session?.token]);

  async function fetchDoubtsAndRooms() {
    if (!session?.token) {
      setLoadingDoubts(false);
      return;
    }
    setLoadingDoubts(true);
    try {
      const [doubtsRes, roomsRes] = await Promise.all([
        getDoubtsList(session.token).catch(() => null),
        getDoubtRooms(session.token).catch(() => null)
      ]);

      if (doubtsRes && Array.isArray(doubtsRes.doubts)) {
        setDoubts(doubtsRes.doubts);
      }
      if (roomsRes && Array.isArray(roomsRes.rooms)) {
        setDoubtRooms(roomsRes.rooms);
      }
      if (roomsRes && Array.isArray(roomsRes.knowledgeBase)) {
        setKbResults(roomsRes.knowledgeBase);
      }
    } catch (e) {
      console.log("Error fetching doubts/rooms:", e);
    } finally {
      setLoadingDoubts(false);
    }
  }

  function handleSelectRoom(roomItem) {
    const currentUserId = String(session?.user?.id || session?.user?._id || "");
    if (roomItem.isPrivate) {
      const creatorId = String(roomItem.creatorId || "");
      const mentorId = String(roomItem.assignedMentor?.id || "");
      const membersList = (roomItem.members || []).map((m) => String(m.id || m.userId || m));
      const allowedList = (roomItem.allowedUsers || []).map((u) => String(u.id || u.userId || u));

      const isAllowed =
        currentUserId === creatorId ||
        currentUserId === mentorId ||
        membersList.includes(currentUserId) ||
        allowedList.includes(currentUserId);

      if (!isAllowed) {
        Alert.alert(
          "Private Doubt Room 🔒",
          "This room is private. Only students and mentors invited to this room can view or enter."
        );
        return;
      }
    }

    if (onSelectDoubtRoom) {
      onSelectDoubtRoom(roomItem);
    }
  }

  async function handleCreateRoom() {
    if (!roomTitle.trim()) {
      Alert.alert("Room Title Required", "Please enter a title for your room.");
      return;
    }
    try {
      setCreatingRoom(true);
      const res = await createDoubtRoom(session?.token, {
        title: roomTitle,
        category: roomCategory,
        isPrivate: isRoomPrivate,
        description: roomDescription,
        allowedUsers: selectedMemberIds
      });
      if (res && res.room) {
        Alert.alert("Success 🎉", `Created Doubt Room: ${res.room.title}`);
        setShowRoomModal(false);
        setRoomTitle("");
        setRoomDescription("");
        setIsRoomPrivate(false);
        setSelectedMemberIds([]);
        fetchDoubtsAndRooms();
        if (onSelectDoubtRoom) {
          onSelectDoubtRoom(res.room);
        }
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to create room.");
    } finally {
      setCreatingRoom(false);
    }
  }

  async function handleSearchKb(text) {
    setKbQuery(text);
    try {
      setLoadingKb(true);
      const res = await searchKnowledgeBase(session?.token, text);
      if (res && res.items) {
        setKbResults(res.items);
      }
    } catch (e) {
    } finally {
      setLoadingKb(false);
    }
  }

  async function fetchConversations() {
    if (!session?.token) {
      setLoadingChats(false);
      return;
    }
    setLoadingChats(true);
    try {
      const res = await getChatConversations(session.token);
      if (res?.conversations) {
        setConversations(res.conversations);
      }
    } catch (e) {
      // quiet fallback
    } finally {
      setLoadingChats(false);
    }
  }

  async function fetchDoubts() {
    if (!session?.token) {
      setLoadingDoubts(false);
      return;
    }
    setLoadingDoubts(true);
    try {
      const res = await getDoubtsList(session.token);
      if (res?.doubts) {
        setDoubts(res.doubts);
      }
    } catch (e) {
      // quiet fallback
    } finally {
      setLoadingDoubts(false);
    }
  }

  async function handleCreateDoubtSubmit() {
    if (!doubtTitle.trim()) {
      Alert.alert("Doubt Title Required", "Please enter your doubt description.");
      return;
    }
    setCreatingDoubt(true);
    try {
      const res = await createDoubtThread(session.token, {
        title: doubtTitle.trim(),
        subject: doubtSubject,
        tags: [doubtSubject.split(" ")[0] || "Question"]
      });
      if (res?.doubts) {
        setDoubts(res.doubts);
      } else if (res?.doubt) {
        setDoubts((prev) => [res.doubt, ...prev]);
      }
      setShowDoubtModal(false);
      setDoubtTitle("");
      Alert.alert("Doubt Posted 🎉", "Your doubt has been published! Mentors and community members will reply soon.");
    } catch (e) {
      Alert.alert("Error", "Could not post doubt. Please try again.");
    } finally {
      setCreatingDoubt(false);
    }
  }

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.lastMessage && c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.role && c.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={{ width: "100%", alignSelf: "center", flex: 1, paddingHorizontal: 0 }}>
        {/* 1. Toggled Search Bar */}

        {/* 2. Toggled Search Bar */}
        {showSearchInput ? (
          <View style={[styles.searchWrap, { backgroundColor: theme.cardBg, borderColor: theme.border, marginTop: 2, marginBottom: 10, marginHorizontal: 12 }]}>
            <Feather name="search" size={15} color={theme.subtext} style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, role, or message..."
              placeholderTextColor={theme.subtext}
              autoFocus
              style={[styles.searchInput, { color: theme.text }]}
            />
            <Pressable onPress={() => { setSearchQuery(""); setShowSearchInput(false); }}>
              <Feather name="x-circle" size={15} color={theme.subtext} />
            </Pressable>
          </View>
        ) : null}

        {/* 3. Full Width Underline Tabs (Zero Gap Left & Right) */}
        <View style={{ flexDirection: "row", width: "100%", borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 12 }}>
          <Pressable
            onPress={() => setActiveTab("chats")}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: "center",
              justifyContent: "center",
              borderBottomWidth: activeTab === "chats" ? 3 : 0,
              borderBottomColor: activeTab === "chats" ? theme.primary : "transparent"
            }}
          >
            <Text style={{ fontSize: 13.5, fontFamily: fonts.bold, color: activeTab === "chats" ? theme.primary : theme.subtext }}>
              Chats ({conversations.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("doubts")}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: "center",
              justifyContent: "center",
              borderBottomWidth: activeTab === "doubts" ? 3 : 0,
              borderBottomColor: activeTab === "doubts" ? theme.primary : "transparent"
            }}
          >
            <Text style={{ fontSize: 13.5, fontFamily: fonts.bold, color: activeTab === "doubts" ? theme.primary : theme.subtext }}>
              Doubts ({doubts.length})
            </Text>
          </Pressable>

          <Pressable onPress={onOpenSidebar} style={({ pressed }) => [{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: theme.isDark ? "rgba(255,255,255,0.08)" : "#F1F5F9", borderWidth: 1, borderColor: theme.isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0" }, pressed && { opacity: 0.75 }]}>
            <Ionicons name="grid-outline" size={17} color={theme.primary} />
          </Pressable>
        </View>

      {/* 4. Tab Content */}
      {activeTab === "chats" ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {loadingChats ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.subtext }]}>Fetching real conversations from database...</Text>
            </View>
          ) : filteredConversations.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.badgeBg }]}>
                <Feather name="message-square" size={24} color={theme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Conversations Found</Text>
              <Text style={[styles.emptySub, { color: theme.subtext }]}>Connect with members or mentors in the community to start direct messaging!</Text>
            </View>
          ) : (
            filteredConversations.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onSelectChat && onSelectChat(item)}
                style={[styles.chatRowCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
              >
                {/* Avatar with Online Badge */}
                <View style={styles.chatAvatarWrap}>
                  <Image source={{ uri: item.avatarUrl }} style={[styles.chatAvatar, { borderColor: theme.border }]} />
                  <View style={[styles.onlineBadge, { borderColor: theme.cardBg }]} />
                </View>

                {/* Info Column */}
                <View style={styles.chatInfoCol}>
                  <View style={styles.chatTitleRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1 }}>
                      <Text style={[styles.chatName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                      {item.role?.toLowerCase().includes("mentor") || item.isMentor ? (
                        <View style={{ backgroundColor: theme.isDark ? "#1E1B4B" : "#FEF3C7", borderWidth: 1, borderColor: theme.border, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                          <Text style={{ fontSize: 9.5, fontWeight: "700", color: theme.isDark ? "#A78BFA" : "#D97706" }}>Mentor</Text>
                        </View>
                      ) : (
                        <View style={{ backgroundColor: theme.isDark ? "#1E263B" : "#F1F5F9", borderWidth: 1, borderColor: theme.border, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                          <Text style={{ fontSize: 9.5, fontWeight: "700", color: theme.subtext }}>Student</Text>
                        </View>
                      )}
                      {item.isPremium ? (
                        <MaterialCommunityIcons name="check-decagram" size={14} color={theme.primary} style={{ marginLeft: 2 }} />
                      ) : null}
                    </View>
                    <Text style={[styles.chatTime, { color: theme.subtext }]}>{item.time}</Text>
                  </View>

                  <View style={[styles.rolePillWrap, { backgroundColor: theme.badgeBg }]}>
                    <Text style={[styles.chatRolePillText, { color: theme.isDark ? "#C7D2FE" : "#5B3CF5" }]} numberOfLines={1}>{item.role}</Text>
                  </View>

                  <View style={styles.lastMsgRow}>
                    <Text style={[styles.lastMsgText, { color: theme.subtext }]} numberOfLines={1}>
                      {item.lastMessage}
                    </Text>
                    {item.unreadCount > 0 ? (
                      <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                        <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Active Doubt Rooms Section */}
          {doubtRooms.length > 0 ? (
            <>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>Active Doubt Rooms</Text>
                <View style={[styles.roomCountPill, { backgroundColor: theme.badgeBg }]}>
                  <Text style={[styles.roomCountText, { color: theme.primary }]}>{doubtRooms.length} Rooms</Text>
                </View>
              </View>

              {doubtRooms.map((roomItem) => (
                <Pressable
                  key={roomItem.roomId}
                  onPress={() => handleSelectRoom(roomItem)}
                  style={[styles.doubtRoomCard, { backgroundColor: theme.cardBg, borderColor: theme.border, paddingVertical: 12, paddingHorizontal: 14 }]}
                >
                  <View style={styles.roomAvatarWrap}>
                    <Image source={{ uri: roomItem.assignedMentor?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" }} style={[styles.roomMentorAvatar, { borderColor: theme.border }]} />
                    <View style={[styles.onlineBadgeDot, { borderColor: theme.cardBg }]} />
                  </View>

                  <View style={styles.roomMainCol}>
                    <View style={styles.roomTitleRow}>
                      <Text style={[styles.roomTitleText, { color: theme.text }]} numberOfLines={1}>{roomItem.title}</Text>
                      {roomItem.isPrivate ? (
                        <View style={[styles.roomIdTag, { backgroundColor: theme.isDark ? "#7F1D1D" : "#FEE2E2", flexDirection: "row", alignItems: "center", gap: 3 }]}>
                          <Feather name="lock" size={10} color="#DC2626" />
                          <Text style={[styles.roomIdTagText, { color: "#DC2626" }]}>Private</Text>
                        </View>
                      ) : (
                        <View style={[styles.roomIdTag, { backgroundColor: theme.badgeBg }]}>
                          <Text style={[styles.roomIdTagText, { color: theme.primary }]}>{roomItem.roomId}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.roomSubInfoText, { color: theme.subtext }]} numberOfLines={1}>
                      Mentor: {roomItem.assignedMentor?.name || "Last Class Mentor"} • {roomItem.membersCount || "1.2K"} Members • {roomItem.onlineCount || 86} Online
                    </Text>
                  </View>

                  <Feather name="chevron-right" size={18} color={theme.subtext} style={{ marginLeft: 6 }} />
                </Pressable>
              ))}
            </>
          ) : null}

          {/* Individual Q&A Doubts Section */}
          {doubts.length > 0 ? (
            <>
              <View style={[styles.sectionHeaderRow, { marginTop: doubtRooms.length > 0 ? 16 : 0 }]}>
                <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>Individual Questions & Doubts</Text>
                <View style={[styles.roomCountPill, { backgroundColor: theme.badgeBg }]}>
                  <Text style={[styles.roomCountText, { color: theme.primary }]}>{doubts.length} Questions</Text>
                </View>
              </View>

              {doubts.map((doubt) => {
                let statusBg = theme.isDark ? "#064E3B" : "#E8F5E9";
                let statusColor = theme.isDark ? "#34D399" : "#2E7D32";
                if (doubt.status !== "Resolved") {
                  statusBg = theme.isDark ? "#1E1B4B" : "#F0EDFF";
                  statusColor = theme.isDark ? "#A78BFA" : "#5B3CF5";
                }

                return (
                  <Pressable
                    key={doubt.id}
                    onPress={() => Alert.alert("Doubt Details", `Question: ${doubt.title}\nStatus: ${doubt.status}`)}
                    style={[styles.doubtCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                  >
                    <View style={styles.doubtTopRow}>
                      <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusPillText, { color: statusColor }]}>{doubt.status}</Text>
                      </View>
                      <Text style={[styles.doubtSubjectText, { color: theme.subtext }]}>{doubt.subject}</Text>
                    </View>

                    <Text style={[styles.doubtTitle, { color: theme.text }]} numberOfLines={2}>{doubt.title}</Text>

                    <View style={styles.doubtFooterRow}>
                      <View style={styles.doubtAuthorRow}>
                        <Image source={{ uri: doubt.authorAvatar }} style={styles.doubtAuthorAvatar} />
                        <Text style={[styles.doubtAuthorName, { color: theme.text }]}>{doubt.authorName}</Text>
                        <Text style={[styles.doubtTimeAgo, { color: theme.subtext }]}>• {doubt.createdAt}</Text>
                      </View>

                      <View style={[styles.repliesCountBadge, { backgroundColor: theme.badgeBg }]}>
                        <Feather name="message-square" size={11} color={theme.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.repliesCountText, { color: theme.primary }]}>{doubt.repliesCount} Replies</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </>
          ) : null}

          {/* Loading Indicator */}
          {loadingDoubts ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#5B3CF5" />
              <Text style={styles.loadingText}>Loading Q&A doubts & rooms...</Text>
            </View>
          ) : null}

          {/* Empty State ONLY if BOTH doubtRooms and doubts are 0 */}
          {!loadingDoubts && doubtRooms.length === 0 && doubts.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.badgeBg }]}>
                <Feather name="help-circle" size={24} color={theme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Doubt Rooms or Questions Yet</Text>
              <Text style={[styles.emptySub, { color: theme.subtext }]}>Create a doubt room or post a question to get instant help from mentors & peers.</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
      </View>

      {/* Ask Doubt Modal */}
      {/* Ask Doubt Modal */}
      <Modal visible={showDoubtModal} transparent animationType="slide" onRequestClose={() => setShowDoubtModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather name="help-circle" size={18} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Post New Doubt ❓</Text>
              </View>
              <Pressable onPress={() => setShowDoubtModal(false)} style={[styles.modalCloseBtn, { backgroundColor: theme.isDark ? "#1E263B" : "#F8FAFC" }]}>
                <Feather name="x" size={18} color={theme.text} />
              </Pressable>
            </View>

            <Text style={[styles.inputLabelText, { color: theme.subtext }]}>Doubt Title / Question Description:</Text>
            <TextInput
              value={doubtTitle}
              onChangeText={setDoubtTitle}
              placeholder="e.g. How to handle state updates in React Native flatlist?"
              placeholderTextColor={theme.subtext}
              multiline
              numberOfLines={3}
              style={[styles.modalInput, { backgroundColor: theme.inputBg || (theme.isDark ? "#131927" : "#F8FAFC"), color: theme.text, borderColor: theme.border, height: 75, textAlignVertical: "top" }]}
            />

            <Text style={[styles.inputLabelText, { color: theme.subtext, marginTop: 10 }]}>Select Subject:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {["Full Stack Web & Mobile", "Frontend Architecture", "Database Systems", "Python & AI", "System Design"].map((sub, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setDoubtSubject(sub)}
                  style={[
                    styles.subjectChip,
                    { backgroundColor: doubtSubject === sub ? theme.primary : theme.badgeBg, borderColor: theme.border }
                  ]}
                >
                  <Text style={[styles.subjectChipText, { color: doubtSubject === sub ? "#FFFFFF" : theme.primary }]}>{sub}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              onPress={handleCreateDoubtSubmit}
              disabled={creatingDoubt}
              style={[styles.submitDoubtBtn, { backgroundColor: theme.primary }]}
            >
              {creatingDoubt ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="send" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitDoubtText}>Publish Doubt Thread 🚀</Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* CREATE DOUBT ROOM MODAL */}
      <Modal visible={showRoomModal} transparent animationType="slide" onRequestClose={() => setShowRoomModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons name="forum" size={18} color={theme.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Create Doubt Room 💬</Text>
              </View>
              <Pressable onPress={() => setShowRoomModal(false)} style={[styles.modalCloseBtn, { backgroundColor: theme.isDark ? "#1E263B" : "#F8FAFC" }]}>
                <Feather name="x" size={18} color={theme.text} />
              </Pressable>
            </View>

            <Text style={[styles.inputLabelText, { color: theme.subtext }]}>Room Title:</Text>
            <TextInput
              value={roomTitle}
              onChangeText={setRoomTitle}
              placeholder="e.g. NEET Biology & Chemistry Doubt Space"
              placeholderTextColor={theme.subtext}
              style={[styles.modalInput, { backgroundColor: theme.inputBg || (theme.isDark ? "#131927" : "#F8FAFC"), color: theme.text, borderColor: theme.border }]}
            />

            <Text style={[styles.inputLabelText, { color: theme.subtext, marginTop: 10 }]}>Category / Stream:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {["NEET", "JEE", "Full Stack", "Python & AI", "General"].map((cat, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setRoomCategory(cat)}
                  style={[
                    styles.subjectChip,
                    { backgroundColor: roomCategory === cat ? theme.primary : theme.badgeBg, borderColor: theme.border }
                  ]}
                >
                  <Text style={[styles.subjectChipText, { color: roomCategory === cat ? "#FFFFFF" : theme.primary }]}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabelText, { color: theme.subtext, marginTop: 10 }]}>Room Description (Optional):</Text>
            <TextInput
              value={roomDescription}
              onChangeText={setRoomDescription}
              placeholder="e.g. Dedicated room for Organic Chemistry derivations"
              placeholderTextColor={theme.subtext}
              style={[styles.modalInput, { backgroundColor: theme.inputBg || (theme.isDark ? "#131927" : "#F8FAFC"), color: theme.text, borderColor: theme.border }]}
            />

            <Text style={[styles.inputLabelText, { marginTop: 10 }]}>Privacy Type:</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <Pressable
                onPress={() => {
                  setIsRoomPrivate(false);
                  setSelectedMemberIds([]);
                }}
                style={[styles.subjectChip, !isRoomPrivate && styles.subjectChipActive]}
              >
                <Text style={[styles.subjectChipText, !isRoomPrivate && styles.subjectChipTextActive]}>🌐 Public Room</Text>
              </Pressable>
              <Pressable
                onPress={() => setIsRoomPrivate(true)}
                style={[styles.subjectChip, isRoomPrivate && styles.subjectChipActive]}
              >
                <Text style={[styles.subjectChipText, isRoomPrivate && styles.subjectChipTextActive]}>🔒 Private Room</Text>
              </Pressable>
            </View>

            {isRoomPrivate && (
              <View style={{ marginTop: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <Text style={styles.inputLabelText}>Select Students / Members to Invite (🔒):</Text>
                  <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: theme.primary }}>
                    {selectedMemberIds.length} Selected
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {(conversations || []).length === 0 ? (
                    <Text style={{ fontSize: 11, color: theme.subtext, fontStyle: "italic", paddingVertical: 4 }}>
                      No members loaded yet. Room creator has full access.
                    </Text>
                  ) : (
                    (conversations || []).map((m) => {
                      const mId = String(m.id || m.userId || m._id);
                      const isSelected = selectedMemberIds.includes(mId);

                      return (
                        <Pressable
                          key={mId}
                          onPress={() => {
                            setSelectedMemberIds((prev) =>
                              isSelected ? prev.filter((id) => id !== mId) : [...prev, mId]
                            );
                          }}
                          style={[
                            styles.subjectChip,
                            isSelected && { backgroundColor: theme.isDark ? "#1E1B4B" : "#F0EDFF", borderColor: theme.primary }
                          ]}
                        >
                          <Text style={[styles.subjectChipText, isSelected && { color: theme.primary, fontFamily: fonts.bold }]}>
                            {isSelected ? "✓ " : "+ "}{m.name || "Student"}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}

            <Pressable
              onPress={handleCreateRoom}
              disabled={creatingRoom}
              style={[styles.submitDoubtBtn, { backgroundColor: theme.primary, marginTop: 16 }]}
            >
              {creatingRoom ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitDoubtText}>Create & Enter Doubt Room 🚀</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingTop: 4
  },

  // 1. Main Section Header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: "#181725"
  },
  compactRefreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center"
  },

  // 2. Compact Search Bar
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    ...shadow.soft
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: "#181725"
  },

  // 3. Small Compact Segmented Tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#EFEFFF",
    borderRadius: 10,
    padding: 3,
    gap: 4,
    marginBottom: 12
  },
  smallTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "transparent"
  },
  smallTabBtnActive: {
    backgroundColor: "#FFFFFF",
    ...shadow.soft
  },
  smallTabText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#686780"
  },
  smallTabTextActive: {
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },

  scrollContent: {
    paddingBottom: 100
  },

  // Chat Cards
  chatRowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  chatAvatarWrap: {
    position: "relative"
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EBE8FF"
  },
  onlineBadge: {
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
  chatInfoCol: {
    flex: 1
  },
  chatTitleRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  chatName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#181725",
    maxWidth: 160
  },
  chatTime: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#8A879F",
    marginLeft: "auto"
  },
  rolePillWrap: {
    alignSelf: "flex-start",
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginTop: 2
  },
  chatRolePillText: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
    color: "#5B3CF5"
  },
  lastMsgRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4
  },
  lastMsgText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: "#686780"
  },
  unreadBadge: {
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    marginLeft: 6
  },
  unreadBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
    color: "#FFFFFF"
  },

  // Doubts CTA & Cards
  askDoubtCtaBtn: {
    marginBottom: 12,
    borderRadius: 14,
    overflow: "hidden",
    ...shadow.soft
  },
  askDoubtGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  askDoubtCtaText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: "#FFFFFF"
  },
  doubtCard: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  doubtTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  statusPillText: {
    fontFamily: fonts.bold,
    fontSize: 10
  },
  doubtSubjectText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: "#7C7C9A"
  },
  doubtTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725",
    lineHeight: 18,
    marginBottom: 8
  },
  doubtFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F4F3FA",
    paddingTop: 6
  },
  doubtAuthorRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  doubtAuthorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 5
  },
  doubtAuthorName: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: "#4A4A6A"
  },
  doubtTimeAgo: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#8A879F",
    marginLeft: 3
  },
  repliesCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  repliesCountText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#5B3CF5"
  },

  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 8
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#7C7C9A"
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    marginTop: 6,
    gap: 6,
    ...shadow.soft
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#181725"
  },
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#8A879F",
    textAlign: "center",
    lineHeight: 17
  },

  // Modal
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
  inputLabelText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: "#4A4A6A",
    marginBottom: 4
  },
  modalInput: {
    backgroundColor: "#F8F7FF",
    borderWidth: 1,
    borderColor: "#EBE8FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: "#181725",
    marginBottom: 8
  },
  subjectChip: {
    backgroundColor: "#F4F3FA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EBE8FF"
  },
  subjectChipActive: {
    backgroundColor: "#F0EDFF",
    borderColor: "#5B3CF5"
  },
  subjectChipText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#686780"
  },
  subjectChipTextActive: {
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },
  submitDoubtBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B3CF5",
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 14
  },
  submitDoubtText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: "#FFFFFF"
  },
  actionBtnRow: {
    flexDirection: "row",
    marginBottom: 16
  },
  roomCountPill: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  roomCountText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#5B3CF5"
  },
  doubtRoomCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EBE8FF",
    ...shadow.soft
  },
  roomAvatarWrap: {
    position: "relative",
    marginRight: 12
  },
  roomMentorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23
  },
  onlineBadgeDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  roomMainCol: {
    flex: 1
  },
  roomTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2
  },
  roomTitleText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#181725",
    flex: 1
  },
  roomIdTag: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6
  },
  roomIdTagText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#5B3CF5"
  },
  roomSubInfoText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: "#686780",
    marginBottom: 4
  },
  roomMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  roomMembersText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#64748B"
  },
  joinRoomBtn: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  joinRoomText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: "#5B3CF5"
  },
  kbSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10
  },
  kbSearchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A"
  },
  kbCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  kbBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  kbCategoryPill: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  kbCategoryText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0284C7"
  },
  kbAuthorText: {
    fontSize: 11,
    color: "#64748B"
  },
  kbQuestionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4
  },
  kbSolutionText: {
    fontSize: 12.5,
    color: "#334155",
    lineHeight: 18
  }
});
