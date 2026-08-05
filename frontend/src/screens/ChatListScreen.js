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
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getChatConversations, getDoubtsList, createDoubtThread, getDoubtRooms, createDoubtRoom, searchKnowledgeBase } from "../api/client";
import { shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";

export default function ChatListScreen({ session, onSelectChat, onSelectDoubtRoom }) {
  const [activeTab, setActiveTab] = useState("chats"); // "chats" | "doubts"
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [doubtRooms, setDoubtRooms] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingDoubts, setLoadingDoubts] = useState(true);

  // Create Individual Doubt Modal State
  const [showDoubtModal, setShowDoubtModal] = useState(false);
  const [doubtTitle, setDoubtTitle] = useState("");
  const [doubtSubject, setDoubtSubject] = useState("Full Stack Web & Mobile");
  const [creatingDoubt, setCreatingDoubt] = useState(false);

  // Create Doubt Room Modal State
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [roomCategory, setRoomCategory] = useState("NEET");
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

  async function handleCreateRoom() {
    if (!roomTitle.trim()) {
      Alert.alert("Missing Title", "Please enter a Doubt Room title.");
      return;
    }
    try {
      setCreatingRoom(true);
      const res = await createDoubtRoom(session?.token, {
        title: roomTitle,
        category: roomCategory
      });
      if (res && res.room) {
        Alert.alert("Success 🎉", `Created Doubt Room: ${res.room.title}`);
        setShowRoomModal(false);
        setRoomTitle("");
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

  return (
    <View style={styles.container}>
      {/* 1. Main Section Header (No Duplicate App Header) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>All Chats</Text>
        <Pressable onPress={() => fetchConversations()} style={styles.compactRefreshBtn}>
          <Feather name="refresh-cw" size={14} color="#5B3CF5" />
        </Pressable>
      </View>

      {/* 2. Compact Search Bar */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={15} color="#8A879F" style={{ marginRight: 8 }} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, role, or message..."
          placeholderTextColor="#8A879F"
          style={styles.searchInput}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery("")}>
            <Feather name="x-circle" size={15} color="#8A879F" />
          </Pressable>
        ) : null}
      </View>

      {/* 3. Small Compact Segmented Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => setActiveTab("chats")}
          style={[styles.smallTabBtn, activeTab === "chats" && styles.smallTabBtnActive]}
        >
          <MaterialCommunityIcons
            name="chat-processing-outline"
            size={15}
            color={activeTab === "chats" ? "#5B3CF5" : "#686780"}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.smallTabText, activeTab === "chats" && styles.smallTabTextActive]}>
            Chats ({conversations.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("doubts")}
          style={[styles.smallTabBtn, activeTab === "doubts" && styles.smallTabBtnActive]}
        >
          <Feather
            name="help-circle"
            size={14}
            color={activeTab === "doubts" ? "#5B3CF5" : "#686780"}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.smallTabText, activeTab === "doubts" && styles.smallTabTextActive]}>
            Doubts ({doubts.length})
          </Text>
        </Pressable>
      </View>

      {/* 4. Tab Content */}
      {activeTab === "chats" ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {loadingChats ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#5B3CF5" />
              <Text style={styles.loadingText}>Fetching real conversations from database...</Text>
            </View>
          ) : filteredConversations.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Feather name="message-square" size={24} color="#5B3CF5" />
              </View>
              <Text style={styles.emptyTitle}>No Conversations Found</Text>
              <Text style={styles.emptySub}>Connect with members or mentors in the community to start direct messaging!</Text>
            </View>
          ) : (
            filteredConversations.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onSelectChat && onSelectChat(item)}
                style={styles.chatRowCard}
              >
                {/* Avatar with Online Badge */}
                <View style={styles.chatAvatarWrap}>
                  <Image source={{ uri: item.avatarUrl }} style={styles.chatAvatar} />
                  <View style={styles.onlineBadge} />
                </View>

                {/* Info Column */}
                <View style={styles.chatInfoCol}>
                  <View style={styles.chatTitleRow}>
                    <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
                    {item.verified ? (
                      <MaterialCommunityIcons name="check-decagram" size={14} color="#5B3CF5" style={{ marginLeft: 4 }} />
                    ) : null}
                    <Text style={styles.chatTime}>{item.time}</Text>
                  </View>

                  <View style={styles.rolePillWrap}>
                    <Text style={styles.chatRolePillText} numberOfLines={1}>{item.role}</Text>
                  </View>

                  <View style={styles.lastMsgRow}>
                    <Text style={styles.lastMsgText} numberOfLines={1}>
                      {item.lastMessage}
                    </Text>
                    {item.unreadCount > 0 ? (
                      <View style={styles.unreadBadge}>
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
          {/* Action Row: Create Doubt Room */}
          <View style={styles.actionBtnRow}>
            <Pressable onPress={() => setShowRoomModal(true)} style={[styles.askDoubtCtaBtn, { flex: 1 }]}>
              <LinearGradient
                colors={["#5B3CF5", "#7F65FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.askDoubtGradient}
              >
                <Feather name="plus-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.askDoubtCtaText}>+ Create Doubt Room</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* COLLABORATIVE DOUBT ROOMS SECTION */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Collaborative Doubt Rooms 💬</Text>
            <View style={styles.roomCountPill}>
              <Text style={styles.roomCountText}>{doubtRooms.length} Active</Text>
            </View>
          </View>

          {doubtRooms.map((roomItem) => (
            <Pressable
              key={roomItem.roomId}
              onPress={() => onSelectDoubtRoom && onSelectDoubtRoom(roomItem)}
              style={styles.doubtRoomCard}
            >
              <View style={styles.roomAvatarWrap}>
                <Image source={{ uri: roomItem.assignedMentor?.avatarUrl }} style={styles.roomMentorAvatar} />
                <View style={styles.onlineBadgeDot} />
              </View>

              <View style={styles.roomMainCol}>
                <View style={styles.roomTitleRow}>
                  <Text style={styles.roomTitleText} numberOfLines={1}>{roomItem.title}</Text>
                  <View style={styles.roomIdTag}>
                    <Text style={styles.roomIdTagText}>{roomItem.roomId}</Text>
                  </View>
                </View>

                <Text style={styles.roomSubInfoText}>
                  Assigned Mentor: <Text style={{ fontWeight: "700", color: "#1E293B" }}>{roomItem.assignedMentor?.name}</Text> ({roomItem.assignedMentor?.role})
                </Text>

                <View style={styles.roomMetaRow}>
                  <Text style={styles.roomMembersText}>{roomItem.membersCount || "1.2K"} Members • <Text style={{ color: "#10B981" }}>🟢 {roomItem.onlineCount || 86} Online</Text></Text>
                  <View style={styles.joinRoomBtn}>
                    <Text style={styles.joinRoomText}>Enter Room &gt;</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}

          {loadingDoubts ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#5B3CF5" />
              <Text style={styles.loadingText}>Loading Q&A doubts & rooms...</Text>
            </View>
          ) : doubts.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Feather name="help-circle" size={24} color="#5B3CF5" />
              </View>
              <Text style={styles.emptyTitle}>No Doubts Posted Yet</Text>
              <Text style={styles.emptySub}>Ask a doubt and get instant help from mentors & peers!</Text>
            </View>
          ) : (
            doubts.map((doubt) => {
              let statusBg = "#FFF3E0";
              let statusColor = "#EF6C00";
              if (doubt.status === "Resolved") {
                statusBg = "#E8F5E9";
                statusColor = "#2E7D32";
              } else if (doubt.status === "Answered") {
                statusBg = "#F0EDFF";
                statusColor = "#5B3CF5";
              }

              return (
                <Pressable
                  key={doubt.id}
                  onPress={() => Alert.alert("Doubt Details", `Question: ${doubt.title}\nStatus: ${doubt.status}`)}
                  style={styles.doubtCard}
                >
                  <View style={styles.doubtTopRow}>
                    <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusPillText, { color: statusColor }]}>{doubt.status}</Text>
                    </View>
                    <Text style={styles.doubtSubjectText}>{doubt.subject}</Text>
                  </View>

                  <Text style={styles.doubtTitle}>{doubt.title}</Text>

                  <View style={styles.doubtFooterRow}>
                    <View style={styles.doubtAuthorRow}>
                      <Image source={{ uri: doubt.authorAvatar }} style={styles.doubtAuthorAvatar} />
                      <Text style={styles.doubtAuthorName}>{doubt.authorName}</Text>
                      <Text style={styles.doubtTimeAgo}>• {doubt.createdAt}</Text>
                    </View>

                    <View style={styles.repliesCountBadge}>
                      <Feather name="message-square" size={11} color="#5B3CF5" style={{ marginRight: 4 }} />
                      <Text style={styles.repliesCountText}>{doubt.repliesCount} Replies</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Ask Doubt Modal */}
      <Modal visible={showDoubtModal} transparent animationType="slide" onRequestClose={() => setShowDoubtModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather name="help-circle" size={18} color="#5B3CF5" style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>Post New Doubt ❓</Text>
              </View>
              <Pressable onPress={() => setShowDoubtModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="#686780" />
              </Pressable>
            </View>

            <Text style={styles.inputLabelText}>Doubt Title / Question Description:</Text>
            <TextInput
              value={doubtTitle}
              onChangeText={setDoubtTitle}
              placeholder="e.g. How to handle state updates in React Native flatlist?"
              placeholderTextColor="#8A879F"
              multiline
              numberOfLines={3}
              style={[styles.modalInput, { height: 75, textAlignVertical: "top" }]}
            />

            <Text style={[styles.inputLabelText, { marginTop: 10 }]}>Select Subject:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {["Full Stack Web & Mobile", "Frontend Architecture", "Database Systems", "Python & AI", "System Design"].map((sub, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setDoubtSubject(sub)}
                  style={[styles.subjectChip, doubtSubject === sub && styles.subjectChipActive]}
                >
                  <Text style={[styles.subjectChipText, doubtSubject === sub && styles.subjectChipTextActive]}>{sub}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              onPress={handleCreateDoubtSubmit}
              disabled={creatingDoubt}
              style={styles.submitDoubtBtn}
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons name="forum" size={18} color="#5B3CF5" style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>Create Doubt Room 💬</Text>
              </View>
              <Pressable onPress={() => setShowRoomModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="#686780" />
              </Pressable>
            </View>

            <Text style={styles.inputLabelText}>Room Title:</Text>
            <TextInput
              value={roomTitle}
              onChangeText={setRoomTitle}
              placeholder="e.g. NEET Biology & Chemistry Doubt Space"
              placeholderTextColor="#8A879F"
              style={styles.modalInput}
            />

            <Text style={[styles.inputLabelText, { marginTop: 10 }]}>Category / Stream:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {["NEET", "JEE", "Full Stack", "Python & AI", "General"].map((cat, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setRoomCategory(cat)}
                  style={[styles.subjectChip, roomCategory === cat && styles.subjectChipActive]}
                >
                  <Text style={[styles.subjectChipText, roomCategory === cat && styles.subjectChipTextActive]}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              onPress={handleCreateRoom}
              disabled={creatingRoom}
              style={[styles.submitDoubtBtn, { backgroundColor: "#5B3CF5", marginTop: 16 }]}
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
    backgroundColor: "#F8F7FF",
    paddingHorizontal: 16,
    paddingTop: 12
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
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBE8FF",
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
