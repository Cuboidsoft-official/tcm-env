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
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { manageDoubtRoom } from "../api/client";

export default function RoomDetailsScreen({ session, room: initialRoom, isAdmin = false, onClose, onRoomUpdated }) {
  const [room, setRoom] = useState(initialRoom);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(room?.title || "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState(room?.description || "");
  const [muted, setMuted] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const currentUserId = String(session?.user?._id || session?.user?.id || "");
  const joinRequests = room?.joinRequests || [];
  const membersList = room?.members || [];

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
        Alert.alert("Approved 🎉", "Member joined the room successfully.");
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
        Alert.alert("Admin Promoted 👑", "Member is now a Room Admin.");
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
    Alert.alert(
      "Delete Group Room 🗑️",
      "Are you sure you want to permanently delete this Doubt Room? All messages, files and member permissions will be removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Group",
          style: "destructive",
          onPress: async () => {
            try {
              setUpdating(true);
              const res = await manageDoubtRoom(session?.token, room.roomId, { action: "delete_group" });
              if (res && (res.success || res.deleted)) {
                Alert.alert("Group Deleted 🗑️", "This doubt room has been deleted permanently.");
                if (onRoomUpdated) onRoomUpdated(null);
                if (onClose) onClose();
              }
            } catch (e) {
              Alert.alert("Error", e.message || "Failed to delete group room.");
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  }

  async function handleLeaveGroup() {
    Alert.alert(
      "Leave Group Room",
      "Are you sure you want to leave this room?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              setUpdating(true);
              await manageDoubtRoom(session?.token, room.roomId, { action: "leave_room" });
              Alert.alert("Left Room", "You have left this doubt room.");
              if (onClose) onClose();
            } catch (e) {
              if (onClose) onClose();
            } finally {
              setUpdating(false);
            }
          }
        }
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

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER */}
      <View style={styles.topHeader}>
        <Pressable onPress={onClose} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>Group Room Details</Text>
        <Pressable onPress={() => Alert.alert("Options", "Group options menu")} style={styles.moreBtn}>
          <Feather name="more-vertical" size={20} color="#0F172A" />
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
                onPress={() =>
                  Alert.alert("Edit Avatar 📸", "Enter image URL for room avatar:", [
                    { text: "Cancel" },
                    {
                      text: "Save",
                      onPress: () =>
                        handleSaveTitle()
                    }
                  ])
                }
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
                style={styles.inlineInput}
                autoFocus
              />
              <Pressable onPress={handleSaveTitle} style={styles.saveCheckBtn}>
                <Feather name="check" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.titleRow}>
              <Text style={styles.roomTitle}>{room?.title || "Full Stack Developers"}</Text>
              {isAdmin ? (
                <Pressable onPress={() => setIsEditingTitle(true)} style={styles.pencilBtn}>
                  <Feather name="edit-2" size={14} color="#8B5CF6" />
                </Pressable>
              ) : null}
            </View>
          )}

          {/* GROUP ID */}
          <Pressable onPress={handleCopyGroupId} style={styles.groupIdPill}>
            <Text style={styles.groupIdText}>Group ID: {room?.roomId || "FSD-1024"}</Text>
            <Feather name="copy" size={12} color="#7C3AED" style={{ marginLeft: 4 }} />
          </Pressable>
        </View>

        {/* 3. DESCRIPTION BOX */}
        <View style={styles.descBox}>
          {isEditingDesc && isAdmin ? (
            <View style={{ gap: 8 }}>
              <TextInput
                value={descInput}
                onChangeText={setDescInput}
                multiline
                style={styles.descInputArea}
                placeholder="Enter room description..."
              />
              <Pressable onPress={handleSaveDesc} style={styles.saveDescBtn}>
                <Text style={styles.saveDescText}>Save Description</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Text style={styles.descText}>
                {room?.description || "A place for learners to ask doubts, share resources and grow together! 🚀"}
              </Text>
              {isAdmin ? (
                <Pressable onPress={() => setIsEditingDesc(true)} style={{ padding: 4, marginLeft: 6 }}>
                  <Feather name="edit-2" size={14} color="#8B5CF6" />
                </Pressable>
              ) : null}
            </View>
          )}
        </View>

        {/* 4. STATS BAR */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Feather name="users" size={18} color="#7C3AED" />
            <Text style={styles.statNumber}>{room?.membersCount || 1}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Feather name="user" size={18} color="#7C3AED" />
            <Text style={styles.statNumber}>{Math.max(1, (room?.membersCount || 1))}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Feather name="calendar" size={18} color="#7C3AED" />
            <Text style={styles.statNumber}>12 May</Text>
            <Text style={styles.statLabel}>Created On</Text>
          </View>
        </View>

        {/* 5. PENDING JOIN REQUESTS (ADMIN ONLY) */}
        {isAdmin && joinRequests.length > 0 ? (
          <View style={styles.requestsSection}>
            <View style={styles.requestsHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Feather name="clock" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
                <Text style={styles.requestsTitle}>Pending Join Requests</Text>
                <View style={styles.reqBadge}>
                  <Text style={styles.reqBadgeText}>{joinRequests.length}</Text>
                </View>
              </View>
              <Pressable onPress={() => Alert.alert("Join Requests", `${joinRequests.length} pending requests.`)}>
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
              {joinRequests.map((reqItem, idx) => (
                <View key={idx} style={styles.reqCard}>
                  <Image source={{ uri: reqItem.userAvatar }} style={styles.reqAvatar} />
                  <Text style={styles.reqName} numberOfLines={1}>{reqItem.userName}</Text>
                  <Text style={styles.reqTime}>{reqItem.requestedAt || "2h ago"}</Text>

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

            <Text style={styles.lockNoticeText}>🔒 Only admins can see and manage requests</Text>
          </View>
        ) : null}

        {/* 6. ACTION ROWS */}
        <View style={styles.actionsCard}>
          <Pressable onPress={() => setShowMembersModal(true)} style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Feather name="users" size={18} color="#7C3AED" style={{ marginRight: 12 }} />
              <Text style={styles.actionLabel}>Members ({room?.membersCount || 1})</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {isAdmin && <Text style={{ fontSize: 13, color: "#7C3AED", fontWeight: "600", marginRight: 4 }}>+ Add Members</Text>}
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </View>
          </Pressable>

          <Pressable onPress={() => Alert.alert("Pinned Resources", "5 resources pinned in group.")} style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Feather name="pin" size={18} color="#7C3AED" style={{ marginRight: 12 }} />
              <Text style={styles.actionLabel}>Pinned Resources</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.numBadge}><Text style={styles.numBadgeText}>5</Text></View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </View>
          </Pressable>

          <Pressable onPress={() => Alert.alert("Media & Links", "128 items shared.")} style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Feather name="folder" size={18} color="#10B981" style={{ marginRight: 12 }} />
              <Text style={styles.actionLabel}>Media, Links & Files</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.numBadge}><Text style={styles.numBadgeText}>128</Text></View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </View>
          </Pressable>

          <View style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Feather name="bell" size={18} color="#7C3AED" style={{ marginRight: 12 }} />
              <Text style={styles.actionLabel}>Mute Notifications</Text>
            </View>
            <Switch
              value={muted}
              onValueChange={setMuted}
              trackColor={{ false: "#E2E8F0", true: "#C4B5FD" }}
              thumbColor={muted ? "#7C3AED" : "#F8FAFC"}
            />
          </View>

          <Pressable onPress={() => Alert.alert("Search", "Search room messages")} style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Feather name="search" size={18} color="#38BDF8" style={{ marginRight: 12 }} />
              <Text style={styles.actionLabel}>Search Messages</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#94A3B8" />
          </Pressable>

          <Pressable onPress={() => Alert.alert("Invite Link", `Share link: tcm.academy/room/${room?.roomId}`)} style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Feather name="link" size={18} color="#7C3AED" style={{ marginRight: 12 }} />
              <Text style={styles.actionLabel}>Invite via Link</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#94A3B8" />
          </Pressable>

          <Pressable onPress={() => Alert.alert("QR Code", "Displaying room QR code...")} style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Feather name="grid" size={18} color="#10B981" style={{ marginRight: 12 }} />
              <Text style={styles.actionLabel}>Share QR Code</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#94A3B8" />
          </Pressable>
        </View>

        {/* DANGER ZONE */}
        <View style={[styles.actionsCard, { marginTop: 16 }]}>
          {isAdmin ? (
            <Pressable onPress={handleDeleteGroup} style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <Feather name="trash-2" size={18} color="#EF4444" style={{ marginRight: 12 }} />
                <Text style={[styles.actionLabel, { color: "#EF4444", fontWeight: "700" }]}>Delete Group Room</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#FCA5A5" />
            </Pressable>
          ) : null}

          <Pressable onPress={() => Alert.alert("Report Group", "Group reported for review.")} style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Feather name="flag" size={18} color="#EF4444" style={{ marginRight: 12 }} />
              <Text style={[styles.actionLabel, { color: "#EF4444" }]}>Report Group</Text>
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

      {/* MEMBERS LIST MODAL */}
      <Modal visible={showMembersModal} transparent animationType="slide" onRequestClose={() => setShowMembersModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.membersModalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Room Members ({membersList.length})</Text>
              <Pressable onPress={() => setShowMembersModal(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 300, marginVertical: 10 }}>
              {membersList.map((mId, idx) => (
                <View key={idx} style={styles.memberRow}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={styles.memberAvatarCircle}>
                      <Text style={styles.avatarInitials}>U</Text>
                    </View>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.memberName}>User_{String(mId).slice(-4)}</Text>
                      <Text style={styles.memberRole}>{(room?.admins || []).includes(mId) ? "Admin 👑" : "Student Member"}</Text>
                    </View>
                  </View>

                  {isAdmin && mId !== currentUserId ? (
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <Pressable onPress={() => handlePromoteAdmin(mId)} style={styles.makeAdminBtn}>
                        <Text style={styles.makeAdminText}>Make Admin</Text>
                      </Pressable>
                      <Pressable onPress={() => handleRemoveMember(mId)} style={styles.removeBtn}>
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
    backgroundColor: "#7C3AED",
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
    backgroundColor: "#7C3AED",
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
    borderColor: "#7C3AED",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: "700",
    minWidth: 180
  },
  saveCheckBtn: {
    backgroundColor: "#7C3AED",
    padding: 8,
    borderRadius: 8,
    marginLeft: 6
  },
  groupIdPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6
  },
  groupIdText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7C3AED"
  },
  descBox: {
    backgroundColor: "#F5F3FF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EDE9FE"
  },
  descText: {
    flex: 1,
    fontSize: 13,
    color: "#4C1D95",
    lineHeight: 19
  },
  descInputArea: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#7C3AED"
  },
  saveDescBtn: {
    backgroundColor: "#7C3AED",
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
    color: "#7C3AED"
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7C3AED"
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
  lockNoticeText: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8
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
  membersModalBox: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16
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
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  memberAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center"
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  memberName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A"
  },
  memberRole: {
    fontSize: 11,
    color: "#64748B"
  },
  makeAdminBtn: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  makeAdminText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7C3AED"
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
  }
});
