import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Feather, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { getNotifications, respondToFriendRequestNotification, markAllNotificationsReadApi } from "../api/client";
import { setupPushNotifications, checkNotificationPermissionStatus } from "../services/notificationService";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

const filterTabs = ["All", "Unread", "Mentor", "Sessions", "System"];

export default function NotificationsScreen({
  session,
  onBack,
  onOpenChat,
  onOpenCourseDetails,
  onOpenContinueLearning
}) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("All");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permStatus, setPermStatus] = useState("granted");

  useEffect(() => {
    loadNotificationData();
    checkNotificationPermissionStatus().then((status) => setPermStatus(status));
  }, [session?.token]);

  async function handleEnableNotifications() {
    if (!session?.token) return;
    const ok = await setupPushNotifications(session.token, true);
    const newStatus = await checkNotificationPermissionStatus();
    setPermStatus(newStatus);
    if (ok) {
      Alert.alert("Notifications Activated 🔔", "Push notifications are now active on your device!");
    } else {
      Alert.alert("Permission Required ⚠️", "Notifications are currently blocked. Please allow notification access in your browser/device permissions dialog.");
    }
  }

  async function loadNotificationData(isPull = false) {
    if (!session?.token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (isPull) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await getNotifications(session.token);
      if (data?.notifications) {
        setNotifications(data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      if (!isPull) setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleMarkAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    if (session?.token) {
      try {
        await markAllNotificationsReadApi(session.token);
      } catch (e) {}
    }
  }

  async function handleFriendRequestAction(item, action) {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === item.id
          ? {
              ...n,
              unread: false,
              actionTaken: action,
              subtitle:
                action === "accept"
                  ? `You accepted ${item.senderName || "User"}'s friend request. You can now chat!`
                  : `Friend request declined.`
            }
          : n
      )
    );

    if (session?.token && item.id) {
      try {
        await respondToFriendRequestNotification(session.token, item.id, action);
        if (action === "accept") {
          Alert.alert("Connected", `You and ${item.senderName || "User"} are now friends! Direct chat unlocked.`);
        }
      } catch (e) {}
    }
  }

  function handleNotificationPress(item) {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );

    if (item.type === "friend_request" || item.type === "friend_accepted") {
      if (onOpenChat && item.senderId) {
        onOpenChat({ id: item.senderId, name: item.senderName || "Friend" });
      }
    } else if (item.targetMentorId && onOpenChat) {
      onOpenChat({ id: item.targetMentorId, name: "Rahul Sharma", role: "Full Stack Developer & Mentor" });
    } else if (item.targetCourseId && onOpenCourseDetails) {
      onOpenCourseDetails(item.targetCourseId);
    } else if (item.type === "sessions" && onOpenContinueLearning) {
      onOpenContinueLearning();
    } else {
      Alert.alert("Notification Details", `${item.title}\n\n${item.subtitle}`);
    }
  }

  const filteredItems = notifications.filter((item) => {
    if (activeTab === "Unread") return item.unread;
    if (activeTab === "Mentor") return item.type === "mentor";
    if (activeTab === "Sessions") return item.type === "sessions";
    if (activeTab === "System") return item.type === "system";
    return true;
  });

  const unreadCount = notifications.filter(n => n.unread).length;

  const sections = ["Today", "Yesterday", "Earlier"].filter((sec) =>
    filteredItems.some((item) => item.section === sec)
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. Floating Header Bar */}
      <View style={[styles.topHeader, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.headerLeftRow}>
          <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.badgeBg }]}>
            <Feather name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {unreadCount > 0 ? (
            <Pressable onPress={handleMarkAllAsRead} style={[styles.markReadBtn, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
              <Feather name="check-circle" size={14} color={theme.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.markReadText, { color: theme.primary }]}>Read All</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={handleEnableNotifications}
            style={[styles.settingsBtn, { backgroundColor: theme.badgeBg }]}
          >
            <Feather name="settings" size={18} color={theme.primary} />
          </Pressable>
        </View>
      </View>

      {/* Permission Request Banner if not yet granted */}
      {permStatus !== "granted" ? (
        <View style={[styles.permBanner, { backgroundColor: theme.isDark ? "#281F50" : "#F0EDFF", borderColor: theme.primary }]}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={[styles.permIconCircle, { backgroundColor: theme.primary }]}>
              <Feather name="bell" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.permBannerTitle, { color: theme.text }]}>Notifications Disabled</Text>
              <Text style={[styles.permBannerSub, { color: theme.subtext }]}>
                Allow notifications to get instant alerts for jobs, live classes & doubt replies.
              </Text>
            </View>
          </View>
          <Pressable onPress={handleEnableNotifications} style={[styles.permEnableBtn, { backgroundColor: theme.primary }]}>
            <Text style={styles.permEnableBtnText}>Allow</Text>
          </Pressable>
        </View>
      ) : null}

      {/* 2. Category Filter Tabs Row */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
                <Text style={[styles.tabText, { color: theme.subtext }, isActive && { color: theme.primary, fontFamily: fonts.bold }]}>{tab}</Text>
                {isActive ? <View style={[styles.activeUnderline, { backgroundColor: theme.primary }]} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Notifications Timeline List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadNotificationData(true)} colors={[theme.primary]} />
        }
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.subtext }]}>Fetching updates...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.badgeBg }]}>
              <Feather name="bell-off" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Notifications Yet</Text>
            <Text style={[styles.emptyText, { color: theme.subtext }]}>When you receive updates, messages, or course alerts, they will appear here.</Text>
          </View>
        ) : null}

        {!loading &&
          sections.map((sectionName) => {
            const sectionItems = filteredItems.filter((i) => i.section === sectionName);

            return (
              <View key={sectionName} style={styles.sectionGroup}>
                <Text style={[styles.sectionHeader, { color: theme.text }]}>{sectionName}</Text>

                <View style={[styles.itemsCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  {sectionItems.map((item, index) => {
                    const isLast = index === sectionItems.length - 1;

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => handleNotificationPress(item)}
                        style={({ pressed }) => [
                          styles.notificationRow,
                          { backgroundColor: theme.cardBg },
                          !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border },
                          pressed && { backgroundColor: theme.isDark ? "#1E263B" : "#F8F7FF" }
                        ]}
                      >
                        {/* Left Icon / Avatar */}
                        <View style={styles.leftCol}>
                          {item.avatarUrl ? (
                            <View style={styles.avatarWrap}>
                              <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} />
                              <View style={styles.chatBadge}>
                                <Feather name="message-square" size={8} color="#FFFFFF" />
                              </View>
                            </View>
                          ) : (
                            <View style={[styles.iconPill, { backgroundColor: item.iconBg || "#EDE7F6" }]}>
                              <Feather name={item.icon || "bell"} size={18} color={item.iconColor || "#5B3CF5"} />
                            </View>
                          )}
                        </View>

                        {/* Content Column */}
                        <View style={styles.contentCol}>
                          <View style={styles.titleRow}>
                            <Text style={styles.itemTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={styles.itemTime}>{item.time}</Text>
                          </View>
                          <Text style={styles.itemSubtitle} numberOfLines={2}>
                            {item.subtitle}
                          </Text>

                          {/* Friend Request Action Buttons */}
                          {item.type === "friend_request" ? (
                            <View style={styles.notifActionRow}>
                              {item.actionTaken === "accept" ? (
                                <View style={styles.actionSuccessBadge}>
                                  <Feather name="check" size={13} color="#2E7D32" />
                                  <Text style={styles.actionSuccessText}>Friends Connected ✓</Text>
                                </View>
                              ) : item.actionTaken === "decline" ? (
                                <Text style={styles.actionDeclinedText}>Declined</Text>
                              ) : (
                                <>
                                  <Pressable
                                    onPress={() => handleFriendRequestAction(item, "accept")}
                                    style={styles.acceptNotifBtn}
                                  >
                                    <Feather name="user-check" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                                    <Text style={styles.acceptNotifBtnText}>Accept Request</Text>
                                  </Pressable>
                                  <Pressable
                                    onPress={() => handleFriendRequestAction(item, "decline")}
                                    style={styles.declineNotifBtn}
                                  >
                                    <Text style={styles.declineNotifBtnText}>Decline</Text>
                                  </Pressable>
                                </>
                              )}
                            </View>
                          ) : null}
                        </View>

                        {/* Unread Active Blue Dot */}
                        {item.unread ? <View style={styles.unreadDot} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F8F7FF",
    paddingHorizontal: 2
  },

  // 1. Floating Header Bar
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  headerLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: "#181725"
  },
  markReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0D7FE"
  },
  markReadText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: "#5B3CF5"
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center"
  },

  // 2. Category Filter Tabs Row
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  tabsScroll: {
    paddingHorizontal: 14,
    gap: 20
  },
  tabItem: {
    paddingVertical: 10,
    alignItems: "center",
    position: "relative"
  },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#7C7C9A"
  },
  tabTextActive: {
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },
  activeUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "#5B3CF5"
  },

  // 3. Scroll Content
  scrollContent: {
    paddingBottom: 30
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    gap: 8
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C7C9A"
  },

  // Empty State
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    marginTop: 10,
    gap: 8,
    ...shadow.soft
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725"
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C7C9A",
    textAlign: "center",
    lineHeight: 18
  },

  // Timeline Sections
  sectionGroup: {
    marginBottom: 16
  },
  sectionHeader: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#4A4A6A",
    marginBottom: 8,
    marginLeft: 4
  },
  itemsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF"
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F4F3FA"
  },
  rowPressed: {
    backgroundColor: "#F8F7FF"
  },

  // Left Col
  leftCol: {
    marginRight: 12
  },
  avatarWrap: {
    position: "relative"
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  chatBadge: {
    position: "absolute",
    bottom: 0,
    right: -2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#5B3CF5",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },

  // Content Col
  contentCol: {
    flex: 1,
    marginRight: 8
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2
  },
  itemTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725",
    flex: 1,
    marginRight: 6
  },
  itemTime: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A"
  },
  itemSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#666680",
    lineHeight: 16
  },

  // Friend Request Action Row
  notifActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8
  },
  acceptNotifBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10
  },
  acceptNotifBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: "#FFFFFF"
  },
  declineNotifBtn: {
    backgroundColor: "#F4F3FA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EBE5FF"
  },
  declineNotifBtnText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: "#7C7C9A"
  },
  actionSuccessBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECF9E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  actionSuccessText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#2E7D32"
  },
  actionDeclinedText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#7C7C9A",
    fontStyle: "italic"
  },

  // Unread Dot
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#5B3CF5",
    marginLeft: 4
  },

  // Permission Banner
  permBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  permIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  permBannerTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    marginBottom: 2
  },
  permBannerSub: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 15
  },
  permEnableBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10
  },
  permEnableBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: "#FFFFFF"
  }
});
