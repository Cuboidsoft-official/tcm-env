import React, { useState } from "react";
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons
} from "@expo/vector-icons";
import { shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

export default function SidebarDrawer({
  visible,
  onClose,
  user = {},
  activeItem = "Home",
  onSelectMenuItem,
  onLogout,
  onOpenGetVerified,
  onOpenInstallPwa
}) {
  const { theme } = useTheme();
  const [premiumExpanded, setPremiumExpanded] = useState(true);
  const name = user.name || "Student User";
  const rawHandle = (user.handle && user.handle !== "ayushman" && user.handle !== "ayushman.dev")
    ? user.handle.replace(/^@/, "")
    : (name ? name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "") : "tcm_student");
  const handle = `@${rawHandle}`;
  const memberBadge = user.memberBadge || (user.role === "mentor" ? "Verified Mentor" : user.verified ? "Verified Member" : "TCM Student");
  const rawAvatar = user.avatarUrl || "";
  const isInvalidWebUri = Platform.OS === "web" && typeof rawAvatar === "string" && rawAvatar.startsWith("file://");
  const avatarUri = isInvalidWebUri ? null : rawAvatar;

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "TC";
  const softSurface = theme.isDark ? theme.inputBg || "#131927" : "#F0EEF8";

  const enrolledCoursesCount = user?.enrolledCoursesCount ?? user?.enrolledCourses?.length ?? user?.coursesCount ?? 0;

  function handleConfirmLogout() {
    setShowLogoutConfirm(false);
    onClose();
    if (onLogout) onLogout();
  }
  const tcmCoins = user?.wallet?.tcmCoins ?? user?.tcmCoins ?? user?.coins ?? user?.points ?? 0;
  const certificatesCount = user?.certificatesCount ?? user?.completedCoursesCount ?? user?.certificates?.length ?? 0;

  function handleNavigate(itemKey) {
    onClose();
    if (onSelectMenuItem) {
      onSelectMenuItem(itemKey);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={[styles.overlayBg, { backgroundColor: theme.isDark ? "rgba(2, 6, 23, 0.72)" : "rgba(12, 10, 32, 0.45)" }]}>
        {/* Backdrop touch to close */}
        <Pressable style={styles.backdropTouch} onPress={onClose} />

        {/* Sliding Sidebar Panel */}
        <View style={[styles.drawerPanel, { backgroundColor: theme.bg }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* 1. Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.headerTopRow}>
                <View style={styles.avatarWrap}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={[styles.avatarImage, { borderColor: theme.cardBg }]} />
                  ) : (
                    <View style={[styles.avatarCircle, { backgroundColor: theme.primary, borderColor: theme.cardBg }]}>
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                  )}
                  <Pressable onPress={() => handleNavigate("Profile")} style={[styles.editBadge, { backgroundColor: theme.primaryDark, borderColor: theme.cardBg }]}>
                    <Feather name="edit-2" size={9} color="#FFFFFF" />
                  </Pressable>
                </View>

                <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: softSurface }]}>
                  <Feather name="x" size={20} color={theme.subtext} />
                </Pressable>
              </View>

              <View style={styles.userInfoRow}>
                <Text style={[styles.userName, { color: theme.text }]}>{name}</Text>
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    if (onOpenGetVerified) onOpenGetVerified();
                  }}
                  activeOpacity={0.8}
                  style={[styles.drawerGetVerifiedBtn, { backgroundColor: theme.primary }]}
                >
                  <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                  <Text style={styles.drawerGetVerifiedBtnText}>Get Verified</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.userHandle, { color: theme.subtext }]}>{handle}</Text>

              <View style={[styles.premiumPill, { backgroundColor: theme.badgeBg, borderColor: theme.badgeBorder || theme.border }]}>
                <FontAwesome5 name="crown" size={11} color={theme.primary} />
                <Text style={[styles.premiumPillText, { color: theme.badgeText || theme.primary }]}>{memberBadge}</Text>
              </View>
            </View>

            {/* 2. Real Dynamic User Metrics Row */}
            <View style={styles.metricsRow}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => handleNavigate("My Classes")} style={[styles.metricCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="book-open-page-variant" size={18} color={theme.primary} />
                <Text style={[styles.metricVal, { color: theme.text }]}>{enrolledCoursesCount}</Text>
                <Text style={[styles.metricLbl, { color: theme.subtext }]}>Enrolled Courses</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} onPress={() => handleNavigate("Wallet")} style={[styles.metricCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <FontAwesome5 name="coins" size={16} color="#FFB800" />
                <Text style={[styles.metricVal, { color: theme.text }]}>{typeof tcmCoins === "number" ? tcmCoins.toLocaleString() : tcmCoins}</Text>
                <Text style={[styles.metricLbl, { color: theme.subtext }]}>TCM One Coins</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} onPress={() => handleNavigate("Profile")} style={[styles.metricCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="shield-check" size={18} color={theme.primary} />
                <Text style={[styles.metricVal, { color: theme.text }]}>{certificatesCount}</Text>
                <Text style={[styles.metricLbl, { color: theme.subtext }]}>Certificates</Text>
              </TouchableOpacity>
            </View>

            {/* 3. MAIN MENU Section */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionTitle, { color: theme.subtext }]}>MAIN MENU</Text>

              <MenuItem
                icon={<Feather name="home" size={18} />}
                label="Home"
                active={activeItem === "Home"}
                onPress={() => handleNavigate("Home")}
              />
              {/* Premium Features Collapsible Header */}
              <Pressable
                onPress={() => setPremiumExpanded(!premiumExpanded)}
                style={({ pressed }) => [
                  styles.menuItem,
                  (activeItem === "Premium Features" || activeItem === "Go Premium") && { backgroundColor: theme.badgeBg },
                  pressed && styles.pressed
                ]}
              >
                <View style={styles.menuLeft}>
                  <View style={styles.iconWrap}>
                    <FontAwesome5 name="crown" size={15} color="#FFB800" />
                  </View>
                  <Text style={[styles.menuLabel, { color: theme.text, fontFamily: fonts.bold }]}>
                    Premium Features
                  </Text>
                </View>

                <View style={styles.menuRight}>
                  <View style={{ backgroundColor: "#FFB80022", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 9.5, fontFamily: fonts.bold, color: "#D97706" }}>PRO</Text>
                  </View>
                  <Feather name={premiumExpanded ? "chevron-up" : "chevron-down"} size={16} color={theme.primary} />
                </View>
              </Pressable>

              {/* Nested Expandable Submenu Items */}
              {premiumExpanded ? (
                <View style={{ marginLeft: 18, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: theme.badgeBorder || (theme.isDark ? "#334155" : "#E2E8F0"), marginTop: 2, marginBottom: 6 }}>
                  <SubMenuItem
                    icon={<Ionicons name="sparkles" size={14} color="#FFB800" />}
                    label="Feature Profile"
                    badge="Verified"
                    onPress={() => {
                      onClose();
                      if (onOpenGetVerified) onOpenGetVerified();
                      else handleNavigate("Feature Profile");
                    }}
                  />
                  <SubMenuItem
                    icon={<Feather name="code" size={14} color={theme.primary} />}
                    label="Get A Real Domain Project"
                    badge="Live"
                    onPress={() => {
                      onClose();
                      if (onOpenGetVerified) onOpenGetVerified();
                      else handleNavigate("Real Domain Project");
                    }}
                  />
                  <SubMenuItem
                    icon={<MaterialCommunityIcons name="file-account-outline" size={15} color="#10B981" />}
                    label="Build Your ATS Resume"
                    badge="AI"
                    onPress={() => {
                      onClose();
                      if (onOpenGetVerified) onOpenGetVerified();
                      else handleNavigate("ATS Resume");
                    }}
                  />
                  <SubMenuItem
                    icon={<Feather name="cpu" size={14} color="#6366F1" />}
                    label="Take A Lab Access"
                    badge="Cloud"
                    onPress={() => {
                      onClose();
                      if (onOpenGetVerified) onOpenGetVerified();
                      else handleNavigate("Lab Access");
                    }}
                  />
                </View>
              ) : null}
              <MenuItem
                icon={<Feather name="download" size={18} color={theme.primary} />}
                label="Install TCM App (PWA)"
                active={false}
                onPress={() => {
                  onClose();
                  if (onOpenInstallPwa) onOpenInstallPwa();
                }}
              />
              <MenuItem
                icon={<Feather name="users" size={18} />}
                label="TCM One Community"
                active={activeItem === "TCM Community" || activeItem === "Community" || activeItem === "TCM One Community"}
                onPress={() => handleNavigate("TCM Community")}
              />
              <MenuItem
                icon={<Feather name="tv" size={18} />}
                label="My Classes"
                active={activeItem === "My Classes"}
                onPress={() => handleNavigate("My Classes")}
              />
              <MenuItem
                icon={<Feather name="message-circle" size={18} />}
                label="Doubts Room"
                active={activeItem === "Doubts"}
                onPress={() => handleNavigate("Doubts")}
              />
            </View>

            {/* 4. ACCOUNT & REFERRALS Section */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionTitle, { color: theme.subtext }]}>ACCOUNT & REWARDS</Text>

              <MenuItem
                icon={<Feather name="credit-card" size={18} />}
                label="TCM One Wallet & Balance"
                active={activeItem === "Wallet"}
                onPress={() => handleNavigate("Wallet")}
              />
              <MenuItem
                icon={<FontAwesome5 name="gift" size={16} />}
                label="Refer & Earn (₹500 Bonus)"
                active={activeItem === "Referrals"}
                onPress={() => handleNavigate("Wallet")}
              />
              <MenuItem
                icon={<Feather name="user" size={18} />}
                label="Profile"
                active={activeItem === "Profile"}
                onPress={() => handleNavigate("Profile")}
              />
              <MenuItem
                icon={<Feather name="settings" size={18} />}
                label="Settings"
                active={activeItem === "Settings"}
                onPress={() => handleNavigate("Settings")}
              />
              <MenuItem
                icon={<Feather name="bell" size={18} />}
                label="Notifications"
                active={activeItem === "Notifications"}
                onPress={() => handleNavigate("Notifications")}
              />
              <MenuItem
                icon={<Feather name="message-square" size={18} />}
                label="Feedback & Suggestions"
                active={activeItem === "Feedback"}
                onPress={() => handleNavigate("Feedback")}
              />
            </View>

            {/* 6. Go Premium Banner */}
            <Pressable
              onPress={() => {
                onClose();
                if (onOpenGetVerified) {
                  onOpenGetVerified();
                } else {
                  handleNavigate("Go Premium");
                }
              }}
              style={({ pressed }) => [
                styles.premiumCard,
                { backgroundColor: theme.badgeBg, borderColor: activeItem === "Go Premium" ? theme.primary : theme.badgeBorder || theme.border },
                pressed && styles.pressed
              ]}
            >
              <View style={[styles.premiumIconWrap, { backgroundColor: theme.primary }]}>
                <FontAwesome5 name="crown" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.premiumTextWrap}>
                <Text style={[styles.premiumTitle, { color: theme.badgeText || theme.primary }]}>Get TCM One Verified Pro</Text>
                <Text style={[styles.premiumSub, { color: theme.subtext }]}>Verified Badge, Real Projects & ATS Resume from ₹29/mo</Text>
              </View>
              <Feather name="chevron-right" size={18} color={theme.primary} />
            </Pressable>


            {/* 7. Logout Button */}
            <Pressable
              onPress={() => setShowLogoutConfirm(true)}
              style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
            >
              <Feather name="log-out" size={18} color="#FF465F" />
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Custom Logout Confirm Modal inside Sidebar */}
        <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
          <Pressable onPress={() => setShowLogoutConfirm(false)} style={styles.backdrop}>
            <Pressable onPress={(e) => e.stopPropagation()} style={[styles.drawer, { width: 320, padding: 22, height: "auto", maxHeight: 260, borderRadius: 20, alignSelf: "center", justifyContent: "center" }]}>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#FFE0E4", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 12 }}>
                <Feather name="log-out" size={24} color="#FF465F" />
              </View>
              <Text style={{ fontFamily: fonts.bold, fontSize: 16, textAlign: "center", color: theme.text, marginBottom: 6 }}>Confirm Logout</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12.5, textAlign: "center", color: theme.subtext, marginBottom: 18 }}>Are you sure you want to log out of your TCM account?</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={() => setShowLogoutConfirm(false)} style={{ flex: 1, backgroundColor: theme.isDark ? "#1E263B" : "#F1F5F9", paddingVertical: 10, borderRadius: 10, alignItems: "center" }}>
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, color: theme.text }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleConfirmLogout} style={{ flex: 1, backgroundColor: "#FF465F", paddingVertical: 10, borderRadius: 10, alignItems: "center" }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: "#FFFFFF" }}>Logout</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </Modal>
  );
}

function MenuItem({ icon, label, badgeCount, active, onPress }) {
  const { theme } = useTheme();
  const iconElement = React.isValidElement(icon)
    ? React.cloneElement(icon, {
        color: active ? theme.primary : (icon.props.color || (theme.isDark ? "#94A3B8" : "#4A4A6A")),
        size: icon.props.size || 18
      })
    : icon;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        active && [styles.menuItemActive, { backgroundColor: theme.badgeBg }],
        pressed && styles.pressed
      ]}
    >
      <View style={styles.menuLeft}>
        <View style={styles.iconWrap}>{iconElement}</View>
        <Text style={[styles.menuLabel, { color: theme.subtext }, active && styles.menuLabelActive, active && { color: theme.isDark ? "#C7D2FE" : theme.primary }]}>{label}</Text>
      </View>

      <View style={styles.menuRight}>
        {badgeCount ? (
          <View style={styles.badgeCircle}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        ) : null}
        <Feather name="chevron-right" size={16} color={active ? theme.primary : theme.subtext} />
      </View>
    </Pressable>
  );
}

function SubMenuItem({ icon, label, badge, onPress }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 8,
          paddingHorizontal: 8,
          borderRadius: 8,
          marginBottom: 2
        },
        pressed && styles.pressed
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 6 }}>
        <View style={{ width: 18, alignItems: "center" }}>{icon}</View>
        <Text style={{ fontFamily: fonts.medium, fontSize: 12.5, color: theme.subtext, flexShrink: 1 }} numberOfLines={1}>
          {label}
        </Text>
      </View>
      {badge ? (
        <View style={{ backgroundColor: theme.isDark ? theme.inputBg || "#1E293B" : "#F1F5F9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ fontSize: 9, fontFamily: fonts.bold, color: theme.subtext }}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlayBg: {
    flex: 1,
    backgroundColor: "rgba(12, 10, 32, 0.45)",
    flexDirection: "row"
  },
  backdropTouch: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  drawerPanel: {
    width: "82%",
    maxWidth: 340,
    backgroundColor: "#FAF9FE",
    height: "100%",
    ...shadow.soft
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 52 : 44,
    paddingBottom: 40
  },

  // 1. Header Section
  headerSection: {
    marginBottom: 16
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8
  },
  avatarWrap: {
    position: "relative",
    width: 62,
    height: 62
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0A6836",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 22
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: -2,
    backgroundColor: "#0A6836",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0EEF8",
    alignItems: "center",
    justifyContent: "center"
  },

  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  userName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: "#18172B"
  },
  drawerGetVerifiedBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A6836",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4
  },
  drawerGetVerifiedBtnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700"
  },
  userHandle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#7C7C9A",
    marginTop: 1
  },
  premiumPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8
  },
  premiumPillText: {
    color: "#0A6836",
    fontFamily: fonts.semiBold,
    fontSize: 12
  },

  // 2. Metrics Row
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  metricVal: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#18172B",
    marginTop: 4
  },
  metricLbl: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: "#7C7C9A",
    textAlign: "center",
    marginTop: 1
  },

  // 3. Menu Sections
  sectionWrap: {
    marginBottom: 20
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#9A98B0",
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 6
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 2
  },
  menuItemActive: {
    backgroundColor: "#E8F5E9"
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  iconWrap: {
    width: 22,
    alignItems: "center"
  },
  menuLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: "#4A4A6A"
  },
  menuLabelActive: {
    fontFamily: fonts.bold,
    color: "#0A6836"
  },

  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  badgeCircle: {
    backgroundColor: "#FF465F",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center"
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: fonts.bold
  },

  // 6. Go Premium
  premiumCard: {
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C8E6C9"
  },
  premiumIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0A6836",
    alignItems: "center",
    justifyContent: "center"
  },
  premiumTextWrap: {
    flex: 1
  },
  premiumTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#0A6836"
  },
  premiumSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#6E6B89",
    marginTop: 1
  },

  // 7. Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10
  },
  logoutText: {
    color: "#FF465F",
    fontFamily: fonts.semiBold,
    fontSize: 14
  },

  pressed: {
    opacity: 0.75
  }
});
