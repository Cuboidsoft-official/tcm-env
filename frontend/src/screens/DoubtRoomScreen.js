import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Share
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getDoubtRoomDetails,
  sendDoubtRoomMessage,
  askAiDoubt,
  createDoubtRoomPoll,
  voteDoubtRoomPoll,
  markDoubtRoomSolved,
  joinDoubtRoom,
  manageDoubtRoom
} from "../api/client";
import RoomDetailsScreen from "./RoomDetailsScreen";

export default function DoubtRoomScreen({ session, roomId = "NEET-DOUBT-001", onClose, onOpenMentorProfile }) {
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  // Modals & Tools
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [pollModalVisible, setPollModalVisible] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("Who wants to learn this topic again in a live session?");
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [codeSnippetText, setCodeSnippetText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Admin Management Modal State
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [editDescInput, setEditDescInput] = useState("");
  const [editAvatarInput, setEditAvatarInput] = useState("");

  const currentUserId = String(session?.user?._id || session?.user?.id || "");
  const isMember = Boolean((room?.members || []).includes(currentUserId) || room?.creatorId === currentUserId);
  const isAdmin = Boolean((room?.admins || []).includes(currentUserId) || room?.creatorId === currentUserId);
  const hasRequestedJoin = Boolean((room?.joinRequests || []).some((r) => String(r.userId) === currentUserId));

  async function handleJoinRoom() {
    try {
      setJoining(true);
      const token = session?.token;
      const res = await joinDoubtRoom(token, roomId);
      if (res && res.room) {
        setRoom(res.room);
        if (res.status === "requested") {
          Alert.alert("Request Sent ⏳", "Your request to join this Private Room has been sent to the Room Admin for approval.");
        } else {
          Alert.alert("Welcome 🎉", `You joined ${res.room.title}! You can now participate in discussions.`);
        }
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to join room.");
    } finally {
      setJoining(false);
    }
  }

  async function handleManageAction(action, extra = {}) {
    try {
      const token = session?.token;
      const res = await manageDoubtRoom(token, roomId, { action, ...extra });
      if (res && res.room) {
        setRoom(res.room);
        Alert.alert("Updated ⚡", "Room settings updated successfully!");
        setManageModalVisible(false);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update room settings.");
    }
  }

  const scrollViewRef = useRef();

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
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    loadRoomDetails();
  }, [roomId]);

  async function loadRoomDetails() {
    try {
      setLoading(true);
      const token = session?.token;
      const res = await getDoubtRoomDetails(token, roomId);
      if (res && res.room) {
        setRoom(res.room);
        setMessages(res.room.messages || []);
      }
    } catch (err) {
      console.log("Error loading doubt room:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!inputText.trim()) return;
    try {
      setSending(true);
      const token = session?.token;
      const res = await sendDoubtRoomMessage(token, roomId, { text: inputText });
      if (res && res.room) {
        setRoom(res.room);
        setMessages(res.room.messages || []);
        setInputText("");
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function handleReaction(msgId, emoji) {
    try {
      const token = session?.token;
      const res = await sendDoubtRoomMessage(token, roomId, { replyToId: msgId, reactionEmoji: emoji });
      if (res && res.room) {
        setRoom(res.room);
        setMessages(res.room.messages || []);
      }
    } catch (e) {}
  }

  async function handleAskAi(doubtMessage) {
    try {
      setAiLoading(true);
      const token = session?.token;
      const res = await askAiDoubt(token, roomId, {
        messageId: doubtMessage.id,
        doubtText: doubtMessage.text
      });
      if (res && res.room) {
        setRoom(res.room);
        setMessages(res.room.messages || []);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300);
      }
    } catch (err) {
      Alert.alert("AI Error", "Could not reach AI Tutor.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleVotePoll(pollId, optionId) {
    try {
      const token = session?.token;
      const res = await voteDoubtRoomPoll(token, roomId, pollId, optionId);
      if (res && res.room) {
        setRoom(res.room);
        setMessages(res.room.messages || []);
      }
    } catch (err) {
      Alert.alert("Vote Error", "Failed to cast vote.");
    }
  }

  async function handleCreatePoll() {
    if (!pollQuestion.trim()) return;
    try {
      const token = session?.token;
      const res = await createDoubtRoomPoll(token, roomId, {
        question: pollQuestion,
        options: ["Yes, I want to learn again", "No, I understood"]
      });
      if (res && res.room) {
        setRoom(res.room);
        setMessages(res.room.messages || []);
        setPollModalVisible(false);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300);
      }
    } catch (err) {
      Alert.alert("Poll Error", "Failed to create poll.");
    }
  }

  async function handleSendCodeSnippet() {
    if (!codeSnippetText.trim()) return;
    try {
      const token = session?.token;
      const res = await sendDoubtRoomMessage(token, roomId, { codeSnippet: codeSnippetText });
      if (res && res.room) {
        setRoom(res.room);
        setMessages(res.room.messages || []);
        setCodeSnippetText("");
        setCodeModalVisible(false);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to send code snippet.");
    }
  }

  async function handleMarkSolved() {
    try {
      const token = session?.token;
      const res = await markDoubtRoomSolved(token, roomId, {
        questionText: "Why does p-block element have lower electronegativity?",
        solutionText: "Atomic size increases down group & halogens have maximum effective nuclear pull."
      });
      if (res && res.success) {
        Alert.alert("Success 🎉", "Doubt thread marked as Solved and archived to TCM Knowledge Base!");
        loadRoomDetails();
        setMenuVisible(false);
      }
    } catch (err) {
      Alert.alert("Error", "Could not mark as solved.");
    }
  }

  const assignedMentor = room?.assignedMentor || {
    id: "m1",
    name: "Rahul Sharma",
    role: "Chemistry Expert",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    online: true
  };

  if (showRoomDetails) {
    return (
      <RoomDetailsScreen
        session={session}
        room={room}
        isAdmin={isAdmin}
        onClose={() => setShowRoomDetails(false)}
        onRoomUpdated={(updatedRoom) => setRoom(updatedRoom)}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* 1. TOP HEADER MATCHING CHATSCREEN */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#5B3CF5" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerUserCol} onPress={() => setShowRoomDetails(true)}>
          <View style={styles.avatarWrap}>
            {room?.roomAvatar ? (
              <Image source={{ uri: room.roomAvatar }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarImg, { backgroundColor: "#7C3AED", justifyContent: "center", alignItems: "center" }]}>
                <MaterialCommunityIcons name="code-tags" size={20} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.onlineDotHeader} />
          </View>

          <View style={styles.headerTextWrap}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.headerName} numberOfLines={1}>{room?.title || "Doubt Room"}</Text>
              <MaterialCommunityIcons name="check-decagram" size={14} color="#5B3CF5" style={{ marginLeft: 4 }} />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>{room?.roomId || "DOUBT-ROOM"}</Text>
              </View>
              <Text style={styles.headerStatus} numberOfLines={1}>
                {room?.membersCount || "1"} Member • <Text style={{ color: "#10B981" }}>🟢 Online</Text>
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert("Search", "Search in discussion messages.")}>
            <MaterialCommunityIcons name="magnify" size={18} color="#5B3CF5" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuVisible(true)}>
            <MaterialCommunityIcons name="dots-vertical" size={18} color="#686780" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {/* 2. PERMANENTLY PINNED ASSIGNED MENTOR CARD (ONLY IF CREATED BY MENTOR) */}
        {room?.assignedMentor?.name ? (
          <TouchableOpacity
            style={styles.assignedMentorCard}
            onPress={() => onOpenMentorProfile && onOpenMentorProfile(room.assignedMentor.id || "m1")}
            activeOpacity={0.85}
          >
            <View style={styles.mentorAvatarWrap}>
              <Image source={{ uri: room.assignedMentor.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" }} style={styles.mentorAvatar} />
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.mentorInfo}>
              <Text style={styles.mentorLabel}>Assigned Mentor</Text>
              <Text style={styles.mentorName}>{room.assignedMentor.name}</Text>
              <Text style={styles.mentorSpecialty}>{room.assignedMentor.role || "TCM Mentor"}</Text>
            </View>

            <MaterialCommunityIcons name="chevron-right" size={22} color="#64748B" />
          </TouchableOpacity>
        ) : null}

        {/* 3. PINNED ANNOUNCEMENT BANNER */}
        <View style={styles.pinnedBanner}>
          <View style={styles.pinnedIconWrap}>
            <MaterialCommunityIcons name="pin" size={18} color="#5B3CF5" />
          </View>
          <View style={styles.pinnedTextWrap}>
            <Text style={styles.pinnedAuthor}>Pinned by Admin</Text>
            <Text style={styles.pinnedText}>{room?.pinnedAnnouncement?.text || "Please use this group only for NEET related doubts."}</Text>
          </View>
          <TouchableOpacity style={styles.viewBannerBtn} onPress={() => Alert.alert("Announcement", room?.pinnedAnnouncement?.text)}>
            <Text style={styles.viewBannerText}>View</Text>
          </TouchableOpacity>
        </View>

        {/* DATE DIVIDER */}
        <View style={styles.dateDivider}>
          <Text style={styles.dateDividerText}>Today</Text>
        </View>

        {/* 4. CHAT MESSAGES LIST */}
        {loading ? (
          <ActivityIndicator size="large" color="#5B3CF5" style={{ marginVertical: 20 }} />
        ) : (
          messages.map((item) => {
            if (item.type === "poll") {
              // INTERACTIVE POLL CARD MATCHING MOCKUP
              return (
                <View key={item.id} style={styles.pollCard}>
                  <View style={styles.pollHeader}>
                    <MaterialCommunityIcons name="poll" size={18} color="#5B3CF5" />
                    <Text style={styles.pollHeaderTitle}>Poll by {item.authorName}</Text>
                    {item.authorRole ? <View style={styles.adminTag}><Text style={styles.adminTagText}>{item.authorRole}</Text></View> : null}
                    <Text style={styles.pollTime}>{item.time}</Text>
                  </View>

                  <Text style={styles.pollQuestion}>{item.question}</Text>
                  <Text style={styles.pollSubText}>Select one option</Text>

                  {item.options?.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.pollOptionBox, opt.isVoted && styles.pollOptionBoxVoted]}
                      onPress={() => handleVotePoll(item.pollId || item.id, opt.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.pollOptionRow}>
                        <View style={[styles.radioCircle, opt.isVoted && styles.radioCircleSelected]}>
                          {opt.isVoted && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}
                        </View>
                        <Text style={[styles.pollOptionText, opt.isVoted && styles.pollOptionTextVoted]}>{opt.text}</Text>
                        <Text style={styles.pollPercentageText}>{opt.percentage || 0}% ({opt.count || 0})</Text>
                      </View>
                      {/* PROGRESS BAR */}
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${opt.percentage || 0}%` }]} />
                      </View>
                    </TouchableOpacity>
                  ))}

                  <View style={styles.pollFooter}>
                    <Text style={styles.pollMetaText}>{item.totalVotes || 0} votes • Poll ends in {item.endsIn || "22h"}</Text>
                    <TouchableOpacity onPress={() => Alert.alert("Poll Details", `Total votes cast: ${item.totalVotes || 0}`)}>
                      <Text style={styles.viewPollText}>View Poll</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            // CODE SNIPPET MESSAGE
            if (item.type === "code" || item.codeSnippet) {
              return (
                <View key={item.id} style={styles.msgRowLeft}>
                  <Image source={{ uri: item.authorAvatar }} style={styles.msgAvatar} />
                  <View style={styles.msgBodyLeft}>
                    <Text style={styles.msgAuthor}>{item.authorName} <Text style={styles.msgTime}>{item.time}</Text></Text>
                    <View style={styles.codeSnippetBlock}>
                      <View style={styles.codeHeader}>
                        <Text style={styles.codeLangText}>JavaScript / Code</Text>
                        <TouchableOpacity onPress={() => Alert.alert("Copied", "Code snippet copied!")}>
                          <Text style={styles.copyCodeText}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.codeContentText}>{item.codeSnippet || item.text}</Text>
                    </View>
                  </View>
                </View>
              );
            }

            // REGULAR CHAT BUBBLE (Self)
            if (item.isSelf) {
              return (
                <View key={item.id} style={styles.msgRowRight}>
                  <View style={styles.msgBodyRight}>
                    <Text style={styles.msgTextRight}>{item.text}</Text>
                    <View style={styles.metaRowRight}>
                      <Text style={styles.msgTimeRight}>{item.time}</Text>
                      <MaterialCommunityIcons name="check-all" size={14} color="#C4B5FD" style={{ marginLeft: 4 }} />
                    </View>

                    {/* ASK WITH AI BUTTON (RIGHT SIDE SELF MESSAGE) */}
                    {item.canAskAi !== false && !item.isAi && item.type !== "poll" && (
                      <TouchableOpacity
                        style={[styles.askAiBtn, { alignSelf: "flex-end", marginTop: 6 }]}
                        onPress={() => handleAskAi(item)}
                        disabled={aiLoading}
                      >
                        <MaterialCommunityIcons name="robot" size={16} color="#5B3CF5" />
                        <Text style={styles.askAiText}>
                          {aiLoading ? "Asking AI..." : "Ask with AI 🤖"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }

            // PARTICIPANT OR AI RESPONSE
            return (
              <View key={item.id} style={styles.msgRowLeft}>
                <Image source={{ uri: item.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" }} style={styles.msgAvatar} />
                <View style={styles.msgBodyLeft}>
                  <View style={styles.authorHeaderRow}>
                    <Text style={styles.msgAuthor}>{item.authorName}</Text>
                    {item.isAdmin || item.authorRole === "Admin" ? (
                      <View style={styles.adminTag}><Text style={styles.adminTagText}>Admin</Text></View>
                    ) : null}
                    {item.isAi ? (
                      <View style={styles.aiTag}><Text style={styles.aiTagText}>AI Assistant</Text></View>
                    ) : null}
                    <Text style={styles.msgTime}>{item.time}</Text>
                  </View>

                  <View style={[styles.bubbleLeft, item.isAi && styles.bubbleAi]}>
                    <Text style={[styles.msgTextLeft, item.isAi && styles.msgTextAi]}>{item.text}</Text>
                  </View>

                  {/* ASK WITH AI BUTTON (LEFT SIDE PARTICIPANT MESSAGE) */}
                  {item.canAskAi !== false && !item.isAi && item.type !== "poll" && (
                    <TouchableOpacity
                      style={styles.askAiBtn}
                      onPress={() => handleAskAi(item)}
                      disabled={aiLoading}
                    >
                      <MaterialCommunityIcons name="robot" size={16} color="#5B3CF5" />
                      <Text style={styles.askAiText}>
                        {aiLoading ? "Asking AI..." : "Ask with AI 🤖"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* NEED MENTOR HELP BUTTON */}
                  {item.canRequestMentorHelp && (
                    <TouchableOpacity
                      style={styles.mentorHelpBtn}
                      onPress={() => Alert.alert("Mentor Alerted 🆘", `${assignedMentor.name} has been notified and will review this doubt.`)}
                    >
                      <MaterialCommunityIcons name="shield-account" size={16} color="#EF4444" />
                      <Text style={styles.mentorHelpText}>Need Mentor Help 🆘</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 5. INPUT BAR OR JOIN ROOM BAR */}
      {!isMember ? (
        <View style={styles.joinRoomContainer}>
          {hasRequestedJoin ? (
            <View style={[styles.joinRoomButton, { backgroundColor: "#64748B" }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.joinRoomButtonText}>Join Request Pending Approval ⏳</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.joinRoomButton} onPress={handleJoinRoom} disabled={joining}>
              {joining ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name={room?.isPrivate ? "lock-outline" : "account-plus"} size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.joinRoomButtonText}>
                    {room?.isPrivate ? "Request to Join Private Room 🔒" : "Join Room to Participate 💬"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={[styles.inputContainer, { paddingBottom: Platform.OS === "ios" ? 12 : 8 }]}>
          <TouchableOpacity style={styles.plusBtn} onPress={() => setPollModalVisible(true)}>
            <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TextInput
            style={styles.inputField}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
          />

          <TouchableOpacity style={styles.inputActionBtn} onPress={() => setCodeModalVisible(true)}>
            <MaterialCommunityIcons name="code-tags" size={22} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} disabled={sending}>
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL: OPTIONS & ADMIN MENU */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuHeaderTitle}>Doubt Room Options</Text>

            {isAdmin ? (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setManageModalVisible(true); }}>
                  <MaterialCommunityIcons name="shield-account" size={20} color="#5B3CF5" />
                  <Text style={styles.menuItemText}>
                    Admin Tools & Requests 👑 {(room?.joinRequests?.length || 0) > 0 ? `(${room.joinRequests.length} Pending)` : ""}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}

            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setPollModalVisible(true); }}>
              <MaterialCommunityIcons name="poll" size={20} color="#5B3CF5" />
              <Text style={styles.menuItemText}>Create Live Poll 📊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setCodeModalVisible(true); }}>
              <MaterialCommunityIcons name="code-json" size={20} color="#3B82F6" />
              <Text style={styles.menuItemText}>Share Code Snippet 💻</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleMarkSolved}>
              <MaterialCommunityIcons name="check-circle-outline" size={20} color="#10B981" />
              <Text style={styles.menuItemText}>Mark Doubt as Solved ✅</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: ADMIN MANAGEMENT TOOLS */}
      <Modal visible={manageModalVisible} transparent animationType="slide" onRequestClose={() => setManageModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.pollModalBox}>
            <Text style={styles.modalBoxTitle}>Room Admin Settings 👑</Text>

            {/* PENDING JOIN REQUESTS SECTION */}
            {(room?.joinRequests || []).length > 0 ? (
              <View style={{ backgroundColor: "#FFFBEB", borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: "#FDE68A" }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#D97706", marginBottom: 6 }}>
                  ⏳ Pending Join Requests ({room.joinRequests.length})
                </Text>
                {room.joinRequests.map((reqItem, idx) => (
                  <View key={idx} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, color: "#1E293B", fontWeight: "600" }}>
                      {reqItem.userName || "Student"}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => handleManageAction("approve_request", { targetUserId: reqItem.userId })}
                        style={{ backgroundColor: "#10B981", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}
                      >
                        <Text style={{ fontSize: 11, color: "#FFFFFF", fontWeight: "700" }}>Approve ✅</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleManageAction("decline_request", { targetUserId: reqItem.userId })}
                        style={{ backgroundColor: "#EF4444", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}
                      >
                        <Text style={{ fontSize: 11, color: "#FFFFFF", fontWeight: "700" }}>Decline ❌</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={styles.modalBoxLabel}>Edit Room Description:</Text>
            <TextInput
              style={styles.modalTextInput}
              value={editDescInput}
              onChangeText={setEditDescInput}
              placeholder={room?.description || "Enter room description..."}
            />

            <TouchableOpacity
              style={[styles.submitModalBtn, { marginTop: 10, marginBottom: 16 }]}
              onPress={() => handleManageAction("update_info", { description: editDescInput })}
            >
              <Text style={styles.submitModalText}>Save Room Description</Text>
            </TouchableOpacity>

            <Text style={styles.modalBoxLabel}>Manage Room Members & Admins:</Text>
            <ScrollView style={{ maxHeight: 120, marginVertical: 6 }}>
              {(room?.members || [currentUserId]).map((mId, idx) => (
                <View key={idx} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
                  <Text style={{ fontSize: 13, color: "#1E293B", fontWeight: "600" }}>
                    Member: {mId === currentUserId ? "You (Admin)" : `User_${String(mId).slice(-4)}`}
                  </Text>
                  {mId !== currentUserId ? (
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => handleManageAction("promote_admin", { targetUserId: mId })}
                        style={{ backgroundColor: "#F0EDFF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                      >
                        <Text style={{ fontSize: 11, color: "#5B3CF5", fontWeight: "700" }}>Make Admin</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleManageAction("remove_member", { targetUserId: mId })}
                        style={{ backgroundColor: "#FEE2E2", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                      >
                        <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "700" }}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={[styles.cancelModalBtn, { marginTop: 12 }]} onPress={() => setManageModalVisible(false)}>
              <Text style={styles.cancelModalText}>Close Settings</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: CREATE POLL */}
      <Modal visible={pollModalVisible} transparent animationType="slide" onRequestClose={() => setPollModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.pollModalBox}>
            <Text style={styles.modalBoxTitle}>Create Live Poll 📊</Text>
            <Text style={styles.modalBoxLabel}>Poll Question:</Text>
            <TextInput
              style={styles.modalTextInput}
              value={pollQuestion}
              onChangeText={setPollQuestion}
              placeholder="e.g. Who wants a live revision session?"
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setPollModalVisible(false)}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitModalBtn} onPress={handleCreatePoll}>
                <Text style={styles.submitModalText}>Publish Poll</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: CODE SNIPPET */}
      <Modal visible={codeModalVisible} transparent animationType="slide" onRequestClose={() => setCodeModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.pollModalBox}>
            <Text style={styles.modalBoxTitle}>Share Code Snippet 💻</Text>
            <TextInput
              style={[styles.modalTextInput, { height: 120 }]}
              multiline
              value={codeSnippetText}
              onChangeText={setCodeSnippetText}
              placeholder="Paste code or derivation equations here..."
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setCodeModalVisible(false)}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitModalBtn} onPress={handleSendCodeSnippet}>
                <Text style={styles.submitModalText}>Send Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "ios" ? 10 : 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F3FA"
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F3FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10
  },
  headerUserCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center"
  },
  avatarWrap: {
    position: "relative",
    marginRight: 10
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  onlineDotHeader: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  headerTextWrap: {
    flex: 1,
    marginRight: 6,
    overflow: "hidden"
  },
  headerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#181725",
    flexShrink: 1
  },
  headerStatus: {
    fontSize: 11,
    color: "#8A879F",
    flexShrink: 1
  },
  idBadge: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginRight: 6
  },
  idBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#5B3CF5"
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center"
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F4F3FA",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6
  },
  scrollBody: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30
  },
  assignedMentorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  mentorAvatarWrap: {
    position: "relative",
    marginRight: 12
  },
  mentorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  onlineDot: {
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
  mentorInfo: {
    flex: 1
  },
  mentorLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500"
  },
  mentorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A"
  },
  mentorSpecialty: {
    fontSize: 12,
    color: "#64748B"
  },
  pinnedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DDD6FE"
  },
  pinnedIconWrap: {
    marginRight: 10
  },
  pinnedTextWrap: {
    flex: 1
  },
  pinnedAuthor: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5B3CF5"
  },
  pinnedText: {
    fontSize: 12,
    color: "#334155"
  },
  viewBannerBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  viewBannerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5B3CF5"
  },
  dateDivider: {
    alignItems: "center",
    marginVertical: 12
  },
  dateDividerText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  msgRowLeft: {
    flexDirection: "row",
    marginBottom: 16
  },
  msgAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10
  },
  msgBodyLeft: {
    flex: 1
  },
  authorHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4
  },
  msgAuthor: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginRight: 6
  },
  msgTime: {
    fontSize: 11,
    color: "#94A3B8"
  },
  adminTag: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 6
  },
  adminTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#5B3CF5"
  },
  aiTag: {
    backgroundColor: "#ECF9E9",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 6
  },
  aiTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2E7D32"
  },
  bubbleLeft: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignSelf: "flex-start"
  },
  bubbleAi: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0"
  },
  msgTextLeft: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20
  },
  msgTextAi: {
    color: "#166534"
  },
  askAiBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EDFF",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 6
  },
  askAiText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5B3CF5",
    marginLeft: 4
  },
  mentorHelpBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 6
  },
  mentorHelpText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 4
  },
  reactionsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4
  },
  reactionBadge: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6
  },
  reactionText: {
    fontSize: 12,
    color: "#334155"
  },
  addReactionBtn: {
    padding: 4,
    marginRight: 4
  },
  msgRowRight: {
    alignItems: "flex-end",
    marginBottom: 16
  },
  msgBodyRight: {
    backgroundColor: "#5B3CF5",
    borderRadius: 14,
    padding: 12,
    maxWidth: "80%"
  },
  msgTextRight: {
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 20
  },
  metaRowRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4
  },
  msgTimeRight: {
    fontSize: 11,
    color: "#DDD6FE"
  },
  reactionsRowRight: {
    flexDirection: "row",
    marginTop: 4
  },
  pollCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16
  },
  pollHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  pollHeaderTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5B3CF5",
    marginLeft: 6,
    marginRight: 6
  },
  pollTime: {
    fontSize: 11,
    color: "#94A3B8",
    marginLeft: "auto"
  },
  pollQuestion: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2
  },
  pollSubText: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12
  },
  pollOptionBox: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8
  },
  pollOptionBoxVoted: {
    borderColor: "#5B3CF5",
    backgroundColor: "#F0EDFF"
  },
  pollOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8
  },
  radioCircleSelected: {
    backgroundColor: "#5B3CF5",
    borderColor: "#5B3CF5"
  },
  pollOptionText: {
    flex: 1,
    fontSize: 13,
    color: "#334155",
    fontWeight: "500"
  },
  pollOptionTextVoted: {
    fontWeight: "700",
    color: "#5B3CF5"
  },
  pollPercentageText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B"
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden"
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#5B3CF5",
    borderRadius: 3
  },
  pollFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8
  },
  pollMetaText: {
    fontSize: 12,
    color: "#64748B"
  },
  viewPollText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5B3CF5"
  },
  codeSnippetBlock: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 12,
    marginTop: 4
  },
  codeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    paddingBottom: 4
  },
  codeLangText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600"
  },
  copyCodeText: {
    fontSize: 11,
    color: "#38BDF8",
    fontWeight: "600"
  },
  codeContentText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 13,
    color: "#F8FAFC",
    lineHeight: 18
  },
  joinRoomContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9"
  },
  joinRoomButton: {
    backgroundColor: "#5B3CF5",
    borderRadius: 24,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  joinRoomButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700"
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9"
  },
  plusBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#5B3CF5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8
  },
  inputField: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: "#0F172A",
    maxHeight: 100
  },
  inputActionBtn: {
    padding: 6,
    marginLeft: 4
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#5B3CF5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end"
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20
  },
  menuHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginLeft: 12
  },
  pollModalBox: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: "auto",
    marginTop: "auto"
  },
  modalBoxTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12
  },
  modalBoxLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 6
  },
  modalTextInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 16
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  cancelModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8
  },
  cancelModalText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600"
  },
  submitModalBtn: {
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12
  },
  submitModalText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700"
  }
});
