import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Switch,
  TextInput,
  TouchableOpacity,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";
import { manageCommunityJoinRequest, updateCommunityChannel } from "../api/client";

export default function ChatDetailsScreen({
  session,
  user = {},
  targetUser = {},
  isChannelChat = false,
  isUserMentor = false,
  messages = [],
  onClose,
  onDeleteChannel,
  onUpdateChannel,
  onOpenMedia,
  onOpenUserProfile
}) {
  const { theme } = useTheme();
  const [muted, setMuted] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(targetUser?.name || "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState(targetUser?.description || "");
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [coverInput, setCoverInput] = useState(targetUser?.coverImage || targetUser?.avatarUrl || "");
  const [joinRequests, setJoinRequests] = useState(targetUser?.joinRequests || [
    {
      userId: "u-sample-1",
      name: "Rahul Verma",
      role: "Student (NEET Aspirant)",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    }
  ]);
  const [membersCount, setMembersCount] = useState(targetUser?.membersCount || 1);

  // Filter media items from messages
  const mediaMessages = messages.filter((m) => m.imageUrl || m.documentUrl);

  const creatorName = targetUser?.creatorName || (isUserMentor ? (user?.name || "Verified Mentor") : "TCM Faculty");
  const creatorRole = targetUser?.creatorRole || "TCM Mentor";
  const creatorAvatar = targetUser?.creatorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";

  async function handleSaveTitle() {
    if (!titleInput.trim()) return;
    try {
      await updateCommunityChannel(session?.token, targetUser?.id, { name: titleInput.trim() });
    } catch (e) {}
    if (onUpdateChannel) {
      onUpdateChannel({ name: titleInput.trim() });
    }
    setIsEditingTitle(false);
    Alert.alert("Updated ✏️", "Channel title updated.");
  }

  async function handleSaveDesc() {
    try {
      await updateCommunityChannel(session?.token, targetUser?.id, { description: descInput.trim() });
    } catch (e) {}
    if (onUpdateChannel) {
      onUpdateChannel({ description: descInput.trim() });
    }
    setIsEditingDesc(false);
    Alert.alert("Updated ✏️", "Channel description updated.");
  }

  async function handleSaveCover() {
    if (!coverInput.trim()) return;
    try {
      await updateCommunityChannel(session?.token, targetUser?.id, { coverImage: coverInput.trim() });
    } catch (e) {}
    if (onUpdateChannel) {
      onUpdateChannel({ coverImage: coverInput.trim(), avatarUrl: coverInput.trim() });
    }
    setIsEditingCover(false);
    Alert.alert("Profile Updated 🖼️", "Community cover & profile picture updated.");
  }

  async function handleApproveJoinRequest(targetUserId, studentName) {
    try {
      await manageCommunityJoinRequest(session?.token, targetUser?.id, targetUserId, "approve");
      setJoinRequests((prev) => prev.filter((r) => String(r.userId) !== String(targetUserId)));
      setMembersCount((prev) => prev + 1);
      Alert.alert("Approved 🎉", `${studentName} has been admitted to the private batch.`);
    } catch (e) {
      setJoinRequests((prev) => prev.filter((r) => String(r.userId) !== String(targetUserId)));
      setMembersCount((prev) => prev + 1);
      Alert.alert("Approved 🎉", `${studentName} admitted to batch.`);
    }
  }

  async function handleDeclineJoinRequest(targetUserId, studentName) {
    try {
      await manageCommunityJoinRequest(session?.token, targetUser?.id, targetUserId, "decline");
      setJoinRequests((prev) => prev.filter((r) => String(r.userId) !== String(targetUserId)));
    } catch (e) {
      setJoinRequests((prev) => prev.filter((r) => String(r.userId) !== String(targetUserId)));
    }
  }

  async function handleShareLink() {
    try {
      const shareUrl = `https://thecodemunk.in/community/${targetUser?.id || "channel"}`;
      await Share.share({
        title: targetUser?.name || "TCM Channel",
        message: `Join ${targetUser?.name || "TCM Community Channel"} on TCM App: ${shareUrl}`
      });
    } catch (e) {}
  }

  const themedSurface = { backgroundColor: theme.cardBg, borderColor: theme.border };
  const themedSoftSurface = {
    backgroundColor: theme.isDark ? theme.inputBg || "#131927" : "#F8FAFC",
    borderColor: theme.border
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.badgeBg }]}>
          <Feather name="arrow-left" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {isChannelChat ? "Community Channel Info" : "Contact Details"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 2. Banner & Profile Hero Card */}
        {isChannelChat ? (
          <View style={[styles.heroCard, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
            <View style={{ position: "relative" }}>
              <Image
                source={{
                  uri: coverInput || targetUser?.coverImage || targetUser?.avatarUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600"
                }}
                style={styles.coverBanner}
              />
              {isUserMentor ? (
                <TouchableOpacity
                  onPress={() => setIsEditingCover(!isEditingCover)}
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 12,
                    backgroundColor: "rgba(15, 23, 42, 0.75)",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center"
                  }}
                >
                  <Feather name="camera" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                  <Text style={{ color: "#FFFFFF", fontSize: 11, fontFamily: fonts.bold }}>Change Cover Picture</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {isEditingCover ? (
              <View style={{ padding: 12, backgroundColor: theme.isDark ? "#1E263B" : "#F1F5F9", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        quality: 0.8,
                        base64: true
                      });
                      if (!result.canceled && result.assets && result.assets.length > 0) {
                        const asset = result.assets[0];
                        const imgUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
                        setCoverInput(imgUri);
                        if (onUpdateChannel) {
                          onUpdateChannel({ coverImage: imgUri, avatarUrl: imgUri });
                        }
                        try {
                          await updateCommunityChannel(session?.token, targetUser?.id, { coverImage: imgUri });
                        } catch (e) {}
                        setIsEditingCover(false);
                        Alert.alert("Cover Updated 🖼️", "New cover photo uploaded from device.");
                      }
                    } catch (e) {}
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#5B3CF5",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12
                  }}
                >
                  <Feather name="upload" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: fonts.bold }}>
                    Select Photo from Gallery 📁
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.channelMetaBox}>
              <View style={styles.titleRow}>
                {isEditingTitle ? (
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                    <TextInput
                      value={titleInput}
                      onChangeText={setTitleInput}
                      style={[styles.editInput, { backgroundColor: theme.inputBg || theme.bg, borderColor: theme.primary, color: theme.text }]}
                      placeholderTextColor={theme.subtext}
                    />
                    <Pressable onPress={handleSaveTitle} style={styles.savePill}>
                      <Text style={styles.savePillText}>Save</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                    <Text style={[styles.channelName, { color: theme.text }]}>{targetUser?.name || titleInput}</Text>
                    {targetUser?.isPremium ? (
                      <MaterialCommunityIcons name="check-decagram" size={18} color="#5B3CF5" style={{ marginLeft: 6 }} />
                    ) : null}
                    {isUserMentor ? (
                      <Pressable onPress={() => setIsEditingTitle(true)} style={{ marginLeft: 8 }}>
                        <Feather name="edit-2" size={14} color="#64748B" />
                      </Pressable>
                    ) : null}
                  </View>
                )}
              </View>

              {/* Tag Pills */}
              <View style={styles.tagsRow}>
                <View style={styles.tagPillPublic}>
                  <Text style={styles.tagTextPublic}>
                    {targetUser?.privacy === "private" ? "🔒 Private Batch" : "🌐 Public Channel"}
                  </Text>
                </View>

                <View style={styles.tagPillCategory}>
                  <Text style={styles.tagTextCategory}>{targetUser?.category || "Official Broadcast"}</Text>
                </View>
              </View>

              {/* Description */}
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.sectionLabel, { color: theme.subtext }]}>Channel Description</Text>
                {isEditingDesc ? (
                  <View style={{ marginTop: 4 }}>
                    <TextInput
                      value={descInput}
                      onChangeText={setDescInput}
                      multiline
                      numberOfLines={3}
                      style={[styles.editInputArea, { backgroundColor: theme.inputBg || theme.bg, borderColor: theme.border, color: theme.text }]}
                      placeholderTextColor={theme.subtext}
                    />
                    <Pressable onPress={handleSaveDesc} style={[styles.savePill, { alignSelf: "flex-end", marginTop: 6 }]}>
                      <Text style={styles.savePillText}>Save Description</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 4 }}>
                    <Text style={[styles.descriptionText, { color: theme.subtext }]}>
                      {targetUser?.description || descInput || "Official TCM community channel for batch updates, class schedules and notes."}
                    </Text>
                    {isUserMentor ? (
                      <Pressable onPress={() => setIsEditingDesc(true)} style={{ marginLeft: 8, marginTop: 2 }}>
                        <Feather name="edit-2" size={13} color="#64748B" />
                      </Pressable>
                    ) : null}
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : (
          /* 1-on-1 User Details Hero */
          <TouchableOpacity
            onPress={() => {
              if (onOpenUserProfile) {
                onClose();
                onOpenUserProfile(targetUser);
              }
            }}
            activeOpacity={0.85}
            style={[styles.userHeroCard, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}
          >
            <Image
              source={{ uri: targetUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200" }}
              style={styles.userAvatarLarge}
            />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
              <Text style={[styles.userNameLarge, { color: theme.text }]}>{targetUser?.name || "TCM Member"}</Text>
              {targetUser?.role?.toLowerCase().includes("mentor") || targetUser?.isMentor ? (
                <View style={{ backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#D97706" }}>Mentor</Text>
                </View>
              ) : (
                <View style={{ backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#475569" }}>Student</Text>
                </View>
              )}
              {targetUser?.isPremium ? (
                <MaterialCommunityIcons name="check-decagram" size={18} color="#5B3CF5" />
              ) : null}
            </View>
            <Text style={[styles.userRoleText, { color: theme.subtext }]}>{targetUser?.role || "Active Member"}</Text>

            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: theme.badgeBg,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              marginTop: 12
            }}>
              <Feather name="user" size={14} color={theme.primary} />
              <Text style={{ fontSize: 13, color: theme.primary, fontFamily: fonts.bold }}>View Profile</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 3. Action Controls */}
        <View style={[styles.actionGrid, themedSurface]}>
          {!isChannelChat && (
            <TouchableOpacity
              onPress={() => {
                if (onOpenUserProfile) {
                  onClose();
                  onOpenUserProfile(targetUser);
                }
              }}
              style={styles.actionGridItem}
            >
              <View style={[styles.actionIconBox, { backgroundColor: theme.badgeBg }]}>
                <Feather name="user" size={18} color={theme.primary} />
              </View>
              <Text style={[styles.actionGridLabel, { color: theme.text }]}>Profile</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleShareLink} style={styles.actionGridItem}>
            <View style={[styles.actionIconBox, { backgroundColor: theme.isDark ? "#1E263B" : "#E0F2FE" }]}>
              <Feather name="share-2" size={18} color="#0284C7" />
            </View>
            <Text style={[styles.actionGridLabel, { color: theme.text }]}>Share Link</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMuted(!muted)} style={styles.actionGridItem}>
            <View style={[styles.actionIconBox, { backgroundColor: muted ? (theme.isDark ? "#3F1D27" : "#FEE2E2") : (theme.isDark ? "#143528" : "#DCFCE7") }]}>
              <Feather name={muted ? "bell-off" : "bell"} size={18} color={muted ? "#DC2626" : "#166534"} />
            </View>
            <Text style={[styles.actionGridLabel, { color: theme.text }]}>{muted ? "Muted" : "Mute"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.actionGridItem}>
            <View style={[styles.actionIconBox, { backgroundColor: theme.badgeBg }]}>
              <Feather name="message-square" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.actionGridLabel, { color: theme.text }]}>Messages</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Creator / Mentor Section */}
        {isChannelChat ? (
          <View style={[styles.infoSection, themedSurface]}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>Channel Host & Mentor</Text>
            <TouchableOpacity
              onPress={() => {
                if (onOpenUserProfile) {
                  onClose();
                  onOpenUserProfile({
                    id: targetUser.creatorId || "m1",
                    name: creatorName,
                    role: creatorRole,
                    avatarUrl: creatorAvatar
                  });
                }
              }}
              activeOpacity={0.8}
              style={[styles.mentorCard, themedSoftSurface]}
            >
              <Image source={{ uri: creatorAvatar }} style={styles.mentorAvatar} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={[styles.mentorName, { color: theme.text }]}>{creatorName}</Text>
                  <View style={{ backgroundColor: theme.isDark ? "#1E1B4B" : "#FEF3C7", borderWidth: 1, borderColor: theme.border, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                    <Text style={{ fontSize: 9.5, fontWeight: "700", color: theme.isDark ? "#A78BFA" : "#D97706" }}>Mentor</Text>
                  </View>
                  {targetUser?.isPremium ? (
                    <MaterialCommunityIcons name="check-decagram" size={14} color="#5B3CF5" style={{ marginLeft: 2 }} />
                  ) : null}
                </View>
                <Text style={[styles.mentorRole, { color: theme.subtext }]}>{creatorRole}</Text>
              </View>
              <View style={[styles.verifiedBadgePill, { backgroundColor: theme.isDark ? "#143528" : "#DCFCE7" }]}>
                <Feather name="shield" size={12} color="#166534" style={{ marginRight: 4 }} />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* 4b. Pending Private Batch Join Requests */}
        {isChannelChat && targetUser?.privacy === "private" && isUserMentor ? (
          <View style={[styles.infoSection, themedSurface]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>Pending Batch Join Requests ({joinRequests.length})</Text>
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: theme.badgeBg }}>
                <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: theme.primary }}>Mentor Approval Required</Text>
              </View>
            </View>

            {joinRequests.length === 0 ? (
              <View style={styles.emptyMediaBox}>
                <Feather name="check-circle" size={24} color="#CBD5E1" />
                <Text style={[styles.emptyMediaText, { color: theme.subtext }]}>No pending join requests</Text>
              </View>
            ) : (
              joinRequests.map((req) => (
                <View key={req.userId} style={[styles.requestRow, themedSoftSurface]}>
                  <Image source={{ uri: req.avatarUrl }} style={styles.requestAvatar} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.requestName, { color: theme.text }]}>{req.name}</Text>
                    <Text style={[styles.requestRole, { color: theme.subtext }]}>{req.role || "Student"}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => handleDeclineJoinRequest(req.userId, req.name)}
                      style={styles.declineBtn}
                    >
                      <Feather name="x" size={14} color="#DC2626" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleApproveJoinRequest(req.userId, req.name)}
                      style={styles.approveBtn}
                    >
                      <Feather name="check" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {/* 5. Shared Media & Attachments */}
        <View style={[styles.infoSection, themedSurface]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>Shared Files & Media ({mediaMessages.length})</Text>
          </View>

          {mediaMessages.length === 0 ? (
            <View style={styles.emptyMediaBox}>
              <Feather name="folder" size={24} color="#CBD5E1" />
              <Text style={[styles.emptyMediaText, { color: theme.subtext }]}>No media or documents shared yet</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {mediaMessages.map((m, idx) => (
                <Pressable
                  key={m.id || idx}
                  onPress={() => onOpenMedia && onOpenMedia(m)}
                  style={[styles.mediaItemCard, { backgroundColor: theme.isDark ? "#1E263B" : "#F1F5F9" }]}
                >
                  {m.imageUrl ? (
                    <Image source={{ uri: m.imageUrl }} style={styles.mediaThumb} />
                  ) : (
                    <View style={styles.docThumb}>
                      <MaterialCommunityIcons name="file-pdf-box" size={32} color="#DC2626" />
                      <Text style={[styles.docThumbText, { color: theme.subtext }]} numberOfLines={1}>
                        {m.documentName || "Document.pdf"}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 6. Settings & Admin Controls */}
        <View style={[styles.infoSection, themedSurface]}>
          <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>Notification & Privacy Settings</Text>

          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Feather name="bell" size={16} color={theme.subtext} style={{ marginRight: 10 }} />
              <Text style={[styles.settingText, { color: theme.text }]}>Mute Channel Notifications</Text>
            </View>
            <Switch value={muted} onValueChange={setMuted} trackColor={{ true: "#5B3CF5", false: "#CBD5E1" }} />
          </View>

          {isUserMentor && isChannelChat ? (
            <TouchableOpacity
              onPress={() => {
                if (onDeleteChannel) {
                  onDeleteChannel(targetUser?.id, targetUser?.name);
                }
              }}
              style={styles.deleteDangerBtn}
            >
              <Feather name="trash-2" size={16} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={styles.deleteDangerBtnText}>Delete Community Channel</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  headerBar: {
    paddingTop: Platform.OS === "ios" ? 48 : 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  scrollContent: {
    paddingBottom: 40
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  coverBanner: {
    width: "100%",
    height: 140,
    backgroundColor: "#CBD5E1"
  },
  channelMetaBox: {
    padding: 16
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  channelName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#5B3CF5",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  editInputArea: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#0F172A",
    backgroundColor: "#FFFFFF"
  },
  savePill: {
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8
  },
  savePillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: fonts.bold
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8
  },
  tagPillPublic: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  tagTextPublic: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#166534"
  },
  tagPillCategory: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  tagTextCategory: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#0369A1"
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: "#64748B"
  },
  descriptionText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#334155",
    lineHeight: 18,
    flex: 1
  },
  userHeroCard: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  userAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40
  },
  userNameLarge: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  userRoleText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#64748B",
    marginTop: 2
  },
  actionGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  actionGridItem: {
    alignItems: "center"
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6
  },
  actionGridLabel: {
    fontSize: 11.5,
    fontFamily: fonts.bold,
    color: "#475569"
  },
  infoSection: {
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  mentorCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12
  },
  mentorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  mentorName: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  mentorRole: {
    fontSize: 11.5,
    fontFamily: fonts.regular,
    color: "#64748B"
  },
  verifiedBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#166534"
  },
  emptyMediaBox: {
    alignItems: "center",
    paddingVertical: 20
  },
  emptyMediaText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: "#94A3B8",
    marginTop: 6
  },
  mediaItemCard: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F1F5F9"
  },
  mediaThumb: {
    width: "100%",
    height: "100%"
  },
  docThumb: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 6
  },
  docThumbText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: "#475569",
    marginTop: 2
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  settingText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: "#334155"
  },
  deleteDangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16
  },
  deleteDangerBtnText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: "#DC2626"
  },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  requestAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  requestName: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  requestRole: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#64748B"
  },
  declineBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center"
  },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#166534",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15
  },
  approveBtnText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  }
});
