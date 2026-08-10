import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { applyReferralCode, getProfile, updateProfile } from "../api/client";
import MyReviewsModal from "../components/MyReviewsModal";
import { useTheme } from "../context/ThemeContext";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import WalletScreen from "./WalletScreen";

const themesList = [
  {
    id: "Lime",
    name: "Lime",
    subtitle: "Fresh Energetic Lime Green Accent",
    icon: "zap",
    primaryColor: "#84CC16",
    bgColor: "#F7FEE7",
    badgeColor: "#ECFDF5"
  },
  {
    id: "Day",
    name: "Day",
    subtitle: "Classic Light & Crisp Daylight (Default)",
    icon: "sun",
    primaryColor: "#5B3CF5",
    bgColor: "#FFFFFF",
    badgeColor: "#F0EDFF"
  },
  {
    id: "Night",
    name: "Night",
    subtitle: "Deep Midnight Dark Mode",
    icon: "moon",
    primaryColor: "#6366F1",
    bgColor: "#0F172A",
    badgeColor: "#1E293B"
  },
  {
    id: "Evening",
    name: "Evening",
    subtitle: "Warm Sunset Tones",
    icon: "sunset",
    primaryColor: "#EA580C",
    bgColor: "#FFF7ED",
    badgeColor: "#FFEDD5"
  }
];

function ProfileAvatar({ name = "", uri, size = 74 }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "TCM";

  const isInvalidWebUri = Platform.OS === "web" && typeof uri === "string" && uri.startsWith("file://");

  if (uri && !isInvalidWebUri) {
    return <Image source={{ uri }} style={[styles.avatarImg, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  return (
    <View style={[styles.avatarInitialsContainer, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarInitialsText, { fontSize: Math.round(size * 0.36) }]}>{initials}</Text>
    </View>
  );
}

export default function ProfileSettingsScreen({ session, user: initialUser, onBack, onLogout, onUserUpdate }) {
  const [user, setUser] = useState(initialUser || session?.user || {});
  const [updating, setUpdating] = useState(false);
  const { currentTheme, changeTheme, themesList: appThemesList, theme: activeAppTheme } = useTheme();

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser]);

  const isMentorUser = Boolean(user.role === "mentor" || user.isMentor || user.memberBadge?.toLowerCase().includes("mentor"));

  // Toggle Preferences State
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailDigests, setEmailDigests] = useState(true);
  const [classReminders, setClassReminders] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [activityStatus, setActivityStatus] = useState(true);
  const [wifiOnlyDownloads, setWifiOnlyDownloads] = useState(false);

  // Language State
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  // Modals State
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [myReviewsModalOpen, setMyReviewsModalOpen] = useState(false);

  // Edit Form State
  const [form, setForm] = useState({
    name: "",
    handle: "",
    bio: "",
    location: "",
    website: "",
    avatarUrl: "",
    mentorCategory: "",
    yearsExperience: "",
    subjectsStr: ""
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const selectedThemeObj = activeAppTheme || themesList[1];
  const sectionCardStyle = { backgroundColor: activeAppTheme.cardBg, borderColor: activeAppTheme.border };
  const settingRowStyle = { borderBottomColor: activeAppTheme.border };
  const rowTitleStyle = { color: activeAppTheme.text };
  const rowSubStyle = { color: activeAppTheme.subtext };
  const sectionHeaderStyle = { color: activeAppTheme.subtext };
  const iconWrapStyle = { backgroundColor: activeAppTheme.badgeBg };
  const modalCardStyle = { backgroundColor: activeAppTheme.cardBg };
  const inputStyle = {
    backgroundColor: activeAppTheme.inputBg || activeAppTheme.bg,
    borderColor: activeAppTheme.border,
    color: activeAppTheme.text
  };
  const subtleButtonStyle = { backgroundColor: activeAppTheme.isDark ? "#1E263B" : "#F1F5F9" };

  // Referral Code 24h Window State
  const [referralInput, setReferralInput] = useState("");
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [timeRemainingStr, setTimeRemainingStr] = useState("");
  const [isReferralWindowValid, setIsReferralWindowValid] = useState(true);

  useEffect(() => {
    if (user.referredBy) return;

    function updateCountdown() {
      const createdTime = user.createdAt ? new Date(user.createdAt).getTime() : Date.now();
      const elapsedMs = Date.now() - createdTime;
      const windowMs = 24 * 60 * 60 * 1000;
      const remainingMs = windowMs - elapsedMs;

      if (remainingMs <= 0) {
        setIsReferralWindowValid(false);
        setTimeRemainingStr("00h 00m 00s");
      } else {
        setIsReferralWindowValid(true);
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
        setTimeRemainingStr(
          `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
        );
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [user.createdAt, user.referredBy]);

  async function handleApplyReferral() {
    if (!referralInput.trim()) {
      Alert.alert("Missing Referral Code", "Please enter a referral code.");
      return;
    }

    setApplyingReferral(true);
    try {
      const res = await applyReferralCode(session?.token, referralInput.trim());
      if (res && res.user) {
        setUser(res.user);
        if (onUserUpdate) onUserUpdate(res.user);
        Alert.alert("Referral Applied! 🎉", res.message || "Referral code applied successfully!");
        setReferralInput("");
      } else {
        Alert.alert("Error", res.message || "Failed to apply referral code.");
      }
    } catch (err) {
      Alert.alert("Application Failed", err.message || "Could not apply referral code.");
    } finally {
      setApplyingReferral(false);
    }
  }

  function openEditModal() {
    const subjectsArray = Array.isArray(user.subjects) ? user.subjects : [];
    setForm({
      name: user.name || "",
      handle: user.handle || "",
      bio: user.bio || "",
      location: user.location || "India",
      website: user.website || "thecodemunk.in",
      avatarUrl: user.avatarUrl || "",
      mentorCategory: user.mentorCategory || "TCM Information Tech",
      yearsExperience: user.yearsExperience || "5+ Yrs Exp",
      subjectsStr: subjectsArray.length ? subjectsArray.join(", ") : "Full Stack Development, Node.js, React Native, System Design"
    });
    setEditProfileModalOpen(true);
  }

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Please grant photo gallery permissions to change avatar.");
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
      } else if (Platform.OS === "web" && selectedUri?.startsWith("file://")) {
        selectedUri = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";
      }
      setForm((prev) => ({ ...prev, avatarUrl: selectedUri }));
    }
  }

  async function handleSaveProfile() {
    if (!form.name.trim()) {
      Alert.alert("Validation Error", "Name field cannot be empty.");
      return;
    }
    setUpdating(true);
    try {
      const parsedSubjects = form.subjectsStr
        ? form.subjectsStr.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        ...form,
        subjects: parsedSubjects
      };

      if (session?.token) {
        const res = await updateProfile(session.token, payload);
        if (res?.user) {
          setUser(res.user);
          if (onUserUpdate) onUserUpdate(res.user);
        }
      } else {
        setUser((prev) => ({ ...prev, ...payload }));
      }
      setEditProfileModalOpen(false);
      Alert.alert("Success", "Profile information & settings updated successfully!");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  }

  function handleChangePassword() {
    if (!passwordForm.currentPassword) {
      Alert.alert("Validation Error", "Please enter your current password.");
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      Alert.alert("Validation Error", "New password must be at least 6 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert("Validation Error", "New password and confirmation do not match.");
      return;
    }

    Alert.alert("Password Updated", "Your password has been changed successfully.");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setChangePasswordModalOpen(false);
  }

  function handleClearCache() {
    Alert.alert("Clear Cache", "Are you sure you want to clear app cache (approx 24.5 MB)?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        onPress: () => Alert.alert("Cache Cleared", "Temporary files and cache cleared successfully!")
      }
    ]);
  }

  function handleLogoutPress() {
    Alert.alert("Logout Confirmation", "Are you sure you want to logout from TCM?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          if (onLogout) {
            onLogout();
          } else if (session?.onLogout) {
            session.onLogout();
          }
        }
      }
    ]);
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: activeAppTheme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Top Inline Header Row */}
      <View style={styles.topBackHeader}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.8} style={[styles.inlineBackRow, { backgroundColor: activeAppTheme.badgeBg, borderColor: activeAppTheme.border }]}>
          <Feather name="arrow-left" size={16} color={activeAppTheme.primary} />
          <Text style={[styles.inlineBackText, { color: activeAppTheme.primary }]}>Back to Profile</Text>
        </TouchableOpacity>
        <Text style={[styles.topHeaderTitle, { color: activeAppTheme.text }]}>Account Settings</Text>
      </View>

      {/* 1. User Overview Card */}
      <View style={[styles.userSummaryCard, { backgroundColor: activeAppTheme.cardBg, borderColor: activeAppTheme.border }]}>
        <View style={styles.userSummaryLeft}>
          <View style={styles.avatarWrapper}>
            <ProfileAvatar name={user.name} uri={user.avatarUrl} size={70} />
            <TouchableOpacity onPress={openEditModal} activeOpacity={0.8} style={[styles.avatarEditBadge, { backgroundColor: activeAppTheme.primary, borderColor: activeAppTheme.cardBg }]}>
              <Feather name="camera" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.userInfoCol}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={[styles.userNameText, { color: activeAppTheme.text }]}>{user.name || "TCM Member"}</Text>
              {isMentorUser && (
                <View style={[styles.mentorRoleBadge, { backgroundColor: activeAppTheme.badgeBg }]}>
                  <Text style={[styles.mentorRoleBadgeText, { color: activeAppTheme.primary }]}>Mentor</Text>
                </View>
              )}
            </View>
            <Text style={[styles.userHandleText, { color: activeAppTheme.subtext }]}>@{user.handle || "tcm_member"}</Text>
            <Text style={[styles.userEmailText, { color: activeAppTheme.subtext }]}>{user.email || "user@thecodemunk.in"}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={openEditModal} activeOpacity={0.8} style={[styles.editProfileBtn, { backgroundColor: activeAppTheme.badgeBg, borderColor: activeAppTheme.border }]}>
          <Feather name="edit-3" size={14} color={activeAppTheme.primary} />
          <Text style={[styles.editProfileBtnText, { color: activeAppTheme.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Mentor Dedicated Section (Visible if Mentor User) */}
      {isMentorUser && (
        <View style={[styles.sectionCard, sectionCardStyle]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={[styles.sectionHeader, sectionHeaderStyle]}>MENTOR CREDENTIALS & SPECIALIZATION</Text>
            <TouchableOpacity onPress={openEditModal} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="edit-2" size={12} color="#5B3CF5" />
              <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: "#5B3CF5" }}>Edit Specs</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.settingRow, settingRowStyle]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, iconWrapStyle]}>
                <Feather name="award" size={18} color={activeAppTheme.primary} />
              </View>
              <View>
                <Text style={[styles.rowTitle, rowTitleStyle]}>Mentor Category</Text>
                <Text style={[styles.rowSub, rowSubStyle]}>{user.mentorCategory || "TCM Information Tech"}</Text>
              </View>
            </View>
            <View style={[styles.infoPillBadge, { backgroundColor: activeAppTheme.badgeBg }]}>
              <Text style={[styles.infoPillText, { color: activeAppTheme.primary }]}>{user.yearsExperience || "5+ Yrs Exp"}</Text>
            </View>
          </View>

          <View style={styles.settingRowNoBorder}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, iconWrapStyle]}>
                <Feather name="book-open" size={18} color="#2F79B9" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, rowTitleStyle]}>Specialization Subjects</Text>
                <Text style={[styles.rowSub, rowSubStyle]}>
                  {Array.isArray(user.subjects) && user.subjects.length > 0
                    ? user.subjects.join(", ")
                    : "Full Stack Development, Node.js & React Native, System Architecture"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 3. Account & Personal Info Section */}
      <View style={[styles.sectionCard, sectionCardStyle]}>
        <Text style={[styles.sectionHeader, sectionHeaderStyle]}>ACCOUNT & SECURITY</Text>

        <TouchableOpacity onPress={openEditModal} activeOpacity={0.7} style={[styles.settingRow, settingRowStyle]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, iconWrapStyle]}>
              <Feather name="user" size={18} color={activeAppTheme.primary} />
            </View>
            <View>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Edit Profile Info</Text>
              <Text style={[styles.rowSub, rowSubStyle]}>Name, Bio, Handle, Location & Links</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color="#8A879F" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setChangePasswordModalOpen(true)} activeOpacity={0.7} style={[styles.settingRow, settingRowStyle]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#EAF5FF" }]}>
              <Feather name="lock" size={18} color="#2F79B9" />
            </View>
            <View>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Password & Security</Text>
              <Text style={[styles.rowSub, rowSubStyle]}>Change password & security credentials</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color="#8A879F" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMyReviewsModalOpen(true)} activeOpacity={0.7} style={[styles.settingRow, settingRowStyle]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#FFF8EC" }]}>
              <FontAwesome name="star" size={18} color="#D97706" />
            </View>
            <View>
              <Text style={[styles.rowTitle, rowTitleStyle]}>My Class Reviews & Performance</Text>
              <Text style={[styles.rowSub, rowSubStyle]}>View class reflections & mentor feedback received</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color="#8A879F" />
        </TouchableOpacity>

        <View style={styles.settingRowNoBorder}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#ECF9E9" }]}>
              <Feather name="shield" size={18} color="#2E7D32" />
            </View>
            <View>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Public Profile Visibility</Text>
              <Text style={[styles.rowSub, rowSubStyle]}>Allow non-connections to see your posts</Text>
            </View>
          </View>
          <Switch
            value={publicProfile}
            onValueChange={setPublicProfile}
            trackColor={{ false: "#D1D0E0", true: "#A086FD" }}
            thumbColor={publicProfile ? "#5B3CF5" : "#F4F3FA"}
            style={styles.smallSwitch}
          />
        </View>
      </View>

      {/* 4. Appearance & Themes (NEW FEATURES) */}
      <View style={[styles.sectionCard, sectionCardStyle]}>
        <Text style={[styles.sectionHeader, sectionHeaderStyle]}>APPEARANCE & THEMES</Text>

        {/* Theme Selector Row */}
        <TouchableOpacity onPress={() => setThemeModalOpen(true)} activeOpacity={0.7} style={[styles.settingRow, settingRowStyle]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: activeAppTheme.badgeBg }]}>
              <Feather name={activeAppTheme.icon} size={18} color={activeAppTheme.primary} />
            </View>
            <View>
              <Text style={[styles.rowTitle, rowTitleStyle]}>App Theme</Text>
              <Text style={styles.rowSub}>{activeAppTheme.name} Mode • {activeAppTheme.subtitle}</Text>
            </View>
          </View>
          <View style={[styles.themeBadgePill, { backgroundColor: activeAppTheme.badgeBg, borderColor: activeAppTheme.primary }]}>
            <Text style={[styles.themeBadgePillText, { color: activeAppTheme.primary }]}>
              {activeAppTheme.name} Mode
            </Text>
            <Feather name="chevron-right" size={14} color={activeAppTheme.primary} />
          </View>
        </TouchableOpacity>

        {/* Language Row */}
        <TouchableOpacity onPress={() => setLanguageModalOpen(true)} activeOpacity={0.7} style={styles.settingRowNoBorder}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#EAF5FF" }]}>
              <Feather name="globe" size={18} color="#2F79B9" />
            </View>
            <View>
              <Text style={[styles.rowTitle, rowTitleStyle]}>App Language</Text>
              <Text style={[styles.rowSub, rowSubStyle]}>{selectedLanguage}</Text>
            </View>
          </View>
          <View style={[styles.badgePill, { backgroundColor: activeAppTheme.badgeBg }]}>
            <Text style={[styles.badgePillText, { color: activeAppTheme.primary }]}>{selectedLanguage}</Text>
            <Feather name="chevron-right" size={14} color={activeAppTheme.primary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* 5. Notifications & Downloads */}
      <View style={[styles.sectionCard, sectionCardStyle]}>
        <Text style={[styles.sectionHeader, sectionHeaderStyle]}>PREFERENCES & NOTIFICATIONS</Text>

        <View style={[styles.settingRow, settingRowStyle]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#FFF6DA" }]}>
              <Feather name="bell" size={18} color="#E7A900" />
            </View>
            <View>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Push Notifications</Text>
              <Text style={[styles.rowSub, rowSubStyle]}>Class alerts, mentions & community posts</Text>
            </View>
          </View>
          <Switch
            value={pushNotifs}
            onValueChange={setPushNotifs}
            trackColor={{ false: "#D1D0E0", true: "#A086FD" }}
            thumbColor={pushNotifs ? "#5B3CF5" : "#F4F3FA"}
            style={styles.smallSwitch}
          />
        </View>

        <View style={[styles.settingRow, settingRowStyle]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#F0EDFF" }]}>
              <Feather name="mail" size={18} color="#5B3CF5" />
            </View>
            <View>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Email Digests & Updates</Text>
              <Text style={[styles.rowSub, rowSubStyle]}>Weekly progress report & newsletter</Text>
            </View>
          </View>
          <Switch
            value={emailDigests}
            onValueChange={setEmailDigests}
            trackColor={{ false: "#D1D0E0", true: "#A086FD" }}
            thumbColor={emailDigests ? "#5B3CF5" : "#F4F3FA"}
            style={styles.smallSwitch}
          />
        </View>

        <View style={styles.settingRowNoBorder}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#FFF0F2" }]}>
              <Feather name="wifi" size={18} color="#FF465F" />
            </View>
            <View>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Wi-Fi Only Downloads</Text>
              <Text style={[styles.rowSub, rowSubStyle]}>Download course material only over Wi-Fi</Text>
            </View>
          </View>
          <Switch
            value={wifiOnlyDownloads}
            onValueChange={setWifiOnlyDownloads}
            trackColor={{ false: "#D1D0E0", true: "#A086FD" }}
            thumbColor={wifiOnlyDownloads ? "#5B3CF5" : "#F4F3FA"}
            style={styles.smallSwitch}
          />
        </View>
      </View>

      {/* 6. Membership & Storage */}
      <View style={[styles.sectionCard, sectionCardStyle]}>
        <Text style={[styles.sectionHeader, sectionHeaderStyle]}>MEMBERSHIP & BILLING</Text>

        <View style={[styles.settingRow, settingRowStyle]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#FFF6DA" }]}>
              <FontAwesome5 name="crown" size={16} color="#FFD700" />
            </View>
            <View>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Active Plan: TCM Pro Member</Text>
              <Text style={styles.rowSub}>Unlimited access • Verified Badge Active</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => Alert.alert("Plan Status", "Your TCM Pro subscription is active!")} style={styles.activePlanBadge}>
            <Text style={styles.activePlanText}>Active</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions & Wallet History Row */}
        <TouchableOpacity onPress={() => setWalletModalOpen(true)} activeOpacity={0.7} style={[styles.settingRow, settingRowStyle]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#ECFDF5" }]}>
              <Feather name="credit-card" size={18} color="#10B981" />
            </View>
            <View>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Transactions & Wallet History</Text>
              <Text style={[styles.rowSub, rowSubStyle]}>Fees, referrals, coin conversion & withdrawals</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color="#8A879F" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleClearCache} style={styles.settingRowNoBorder}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#F4F3FA" }]}>
              <Feather name="trash-2" size={18} color="#68677D" />
            </View>
            <View>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Clear App Cache</Text>
              <Text style={[styles.rowSub, rowSubStyle]}>Free up local temporary media storage</Text>
            </View>
          </View>
          <Text style={[styles.cacheSizeText, { color: activeAppTheme.subtext }]}>24.5 MB</Text>
        </TouchableOpacity>
      </View>

      {/* 6.5. Referral Code Program (24-Hour Window) */}
      <View style={[styles.sectionCard, sectionCardStyle]}>
        <Text style={[styles.sectionHeader, sectionHeaderStyle]}>REFERRAL PROGRAM 🎁</Text>
        {user.referredBy ? (
          <View style={styles.settingRowNoBorder}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "#ECFDF5" }]}>
                <Feather name="check-circle" size={18} color="#10B981" />
              </View>
              <View>
                <Text style={[styles.rowTitle, rowTitleStyle]}>Applied Referral Code</Text>
                <Text style={[styles.rowSub, rowSubStyle]}>Code: {user.referredBy} • Reward active</Text>
              </View>
            </View>
            <View style={styles.appliedRefBadge}>
              <Text style={styles.appliedRefText}>Applied</Text>
            </View>
          </View>
        ) : isReferralWindowValid ? (
          <View style={{ paddingVertical: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Feather name="clock" size={15} color="#5B3CF5" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontFamily: fonts.bold, color: "#5B3CF5" }}>
                24-Hour Registration Window: {timeRemainingStr}
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: activeAppTheme.subtext, marginBottom: 12 }}>
              Didn't add a referral code during sign up? Enter a friend's referral code within 24 hours of account creation to claim 10 TCM Coins!
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: activeAppTheme.inputBg || activeAppTheme.bg,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  fontFamily: fonts.semiBold,
                  color: activeAppTheme.text,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: activeAppTheme.border
                }}
                placeholder="Referral Code (e.g. ANK25X)"
                placeholderTextColor="#9CA3AF"
                value={referralInput}
                onChangeText={(txt) => setReferralInput(txt.toUpperCase())}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                onPress={handleApplyReferral}
                disabled={applyingReferral}
                style={{
                  backgroundColor: "#5B3CF5",
                  paddingHorizontal: 18,
                  paddingVertical: 11,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {applyingReferral ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ color: "#FFF", fontFamily: fonts.bold, fontSize: 13 }}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ paddingVertical: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <Feather name="alert-circle" size={15} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontFamily: fonts.bold, color: "#EF4444" }}>
                Referral Code Window Expired
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: activeAppTheme.subtext }}>
              Referral codes can only be claimed within the first 24 hours of account registration.
            </Text>
          </View>
        )}
      </View>

      {/* 7. Support & Legal */}
      <View style={[styles.sectionCard, sectionCardStyle]}>
        <Text style={[styles.sectionHeader, sectionHeaderStyle]}>SUPPORT & LEGAL</Text>

        <TouchableOpacity onPress={() => Alert.alert("Help Center", "Opening TCM Help Center & FAQ...")} style={[styles.settingRow, settingRowStyle]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#F0EDFF" }]}>
              <Feather name="help-circle" size={18} color="#5B3CF5" />
            </View>
            <Text style={[styles.rowTitle, rowTitleStyle]}>Help Center & Support</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#8A879F" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Alert.alert("Privacy Policy", "TCM protects your privacy and personal data.")} style={styles.settingRowNoBorder}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#EAF5FF" }]}>
              <Feather name="file-text" size={18} color="#2F79B9" />
            </View>
            <Text style={[styles.rowTitle, rowTitleStyle]}>Privacy Policy & Terms</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#8A879F" />
        </TouchableOpacity>
      </View>

      {/* 8. Logout Button */}
      <TouchableOpacity onPress={handleLogoutPress} activeOpacity={0.8} style={[styles.logoutBtn, { backgroundColor: activeAppTheme.isDark ? "#3F1D27" : "#FFF0F2", borderColor: activeAppTheme.isDark ? "#5A2734" : "#FFE0E4" }]}>
        <Feather name="log-out" size={18} color="#FF465F" />
        <Text style={styles.logoutBtnText}>Logout Account</Text>
      </TouchableOpacity>

      <Text style={[styles.appVersionText, { color: activeAppTheme.subtext }]}>TCM Mobile App v2.4.0 • Built for Curious Minds</Text>

      {/* --- MODALS --- */}

      {/* 1. Edit Profile Modal (Supports User & Mentor Fields) */}
      <Modal visible={editProfileModalOpen} animationType="slide" transparent onRequestClose={() => setEditProfileModalOpen(false)}>
        <Pressable onPress={() => setEditProfileModalOpen(false)} style={styles.modalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalCard, modalCardStyle]}>
            <View style={[styles.sheetHandleBar, { backgroundColor: activeAppTheme.border }]} />
            <Text style={[styles.modalTitle, { color: activeAppTheme.text }]}>{isMentorUser ? "Edit Mentor & Account Profile" : "Edit Account Profile"}</Text>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              <View style={styles.avatarEditRow}>
                <ProfileAvatar name={form.name} uri={form.avatarUrl} size={76} />
                <TouchableOpacity onPress={pickImage} style={[styles.changeAvatarBtn, { backgroundColor: activeAppTheme.badgeBg }]}>
                  <Feather name="camera" size={14} color={activeAppTheme.primary} />
                  <Text style={[styles.changeAvatarText, { color: activeAppTheme.primary }]}>Change Photo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: activeAppTheme.subtext }]}>Full Name</Text>
                <TextInput value={form.name} onChangeText={(t) => setForm((p) => ({ ...p, name: t }))} style={[styles.textInput, inputStyle]} placeholderTextColor={activeAppTheme.subtext} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: activeAppTheme.subtext }]}>Username Handle</Text>
                <TextInput value={form.handle} onChangeText={(t) => setForm((p) => ({ ...p, handle: t }))} style={[styles.textInput, inputStyle]} placeholderTextColor={activeAppTheme.subtext} />
              </View>

              {/* Dedicated Mentor Fields */}
              {isMentorUser && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: activeAppTheme.subtext }]}>Mentor Category</Text>
                    <TextInput
                      value={form.mentorCategory}
                      onChangeText={(t) => setForm((p) => ({ ...p, mentorCategory: t }))}
                      placeholder="e.g. TCM Information Tech"
                      placeholderTextColor={activeAppTheme.subtext}
                      style={[styles.textInput, inputStyle]}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: activeAppTheme.subtext }]}>Years of Experience</Text>
                    <TextInput
                      value={form.yearsExperience}
                      onChangeText={(t) => setForm((p) => ({ ...p, yearsExperience: t }))}
                      placeholder="e.g. 5+ Yrs Exp"
                      placeholderTextColor={activeAppTheme.subtext}
                      style={[styles.textInput, inputStyle]}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: activeAppTheme.subtext }]}>Specialization Subjects (comma separated)</Text>
                    <TextInput
                      value={form.subjectsStr}
                      onChangeText={(t) => setForm((p) => ({ ...p, subjectsStr: t }))}
                      placeholder="Full Stack, React Native, Node.js"
                      placeholderTextColor={activeAppTheme.subtext}
                      style={[styles.textInput, inputStyle]}
                    />
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: activeAppTheme.subtext }]}>Bio / Tagline</Text>
                <TextInput value={form.bio} onChangeText={(t) => setForm((p) => ({ ...p, bio: t }))} multiline numberOfLines={3} style={[styles.textInput, inputStyle, { height: 75, textAlignVertical: "top" }]} placeholderTextColor={activeAppTheme.subtext} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: activeAppTheme.subtext }]}>Location</Text>
                <TextInput value={form.location} onChangeText={(t) => setForm((p) => ({ ...p, location: t }))} style={[styles.textInput, inputStyle]} placeholderTextColor={activeAppTheme.subtext} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: activeAppTheme.subtext }]}>Website / Portfolio</Text>
                <TextInput value={form.website} onChangeText={(t) => setForm((p) => ({ ...p, website: t }))} style={[styles.textInput, inputStyle]} placeholderTextColor={activeAppTheme.subtext} />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditProfileModalOpen(false)} style={[styles.cancelModalBtn, subtleButtonStyle]}>
                <Text style={[styles.cancelModalBtnText, { color: activeAppTheme.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveProfile} style={styles.saveModalBtn}>
                {updating ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveModalBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 2. Change Password Modal */}
      <Modal visible={changePasswordModalOpen} animationType="slide" transparent onRequestClose={() => setChangePasswordModalOpen(false)}>
        <Pressable onPress={() => setChangePasswordModalOpen(false)} style={styles.modalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalCard, modalCardStyle]}>
            <View style={[styles.sheetHandleBar, { backgroundColor: activeAppTheme.border }]} />
            <Text style={[styles.modalTitle, { color: activeAppTheme.text }]}>Change Password</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: activeAppTheme.subtext }]}>Current Password</Text>
              <TextInput secureTextEntry value={passwordForm.currentPassword} onChangeText={(t) => setPasswordForm((p) => ({ ...p, currentPassword: t }))} style={[styles.textInput, inputStyle]} placeholderTextColor={activeAppTheme.subtext} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: activeAppTheme.subtext }]}>New Password</Text>
              <TextInput secureTextEntry value={passwordForm.newPassword} onChangeText={(t) => setPasswordForm((p) => ({ ...p, newPassword: t }))} style={[styles.textInput, inputStyle]} placeholderTextColor={activeAppTheme.subtext} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: activeAppTheme.subtext }]}>Confirm New Password</Text>
              <TextInput secureTextEntry value={passwordForm.confirmPassword} onChangeText={(t) => setPasswordForm((p) => ({ ...p, confirmPassword: t }))} style={[styles.textInput, inputStyle]} placeholderTextColor={activeAppTheme.subtext} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setChangePasswordModalOpen(false)} style={[styles.cancelModalBtn, subtleButtonStyle]}>
                <Text style={[styles.cancelModalBtnText, { color: activeAppTheme.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleChangePassword} style={styles.saveModalBtn}>
                <Text style={styles.saveModalBtnText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 3. Theme Customization Modal (Lime, Day, Night, Evening) */}
      <Modal visible={themeModalOpen} animationType="slide" transparent onRequestClose={() => setThemeModalOpen(false)}>
        <Pressable onPress={() => setThemeModalOpen(false)} style={styles.modalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalCard, modalCardStyle]}>
            <View style={[styles.sheetHandleBar, { backgroundColor: activeAppTheme.border }]} />
            <Text style={[styles.modalTitle, { color: activeAppTheme.text }]}>Choose App Theme</Text>
            <Text style={[styles.modalSubText, { color: activeAppTheme.subtext }]}>Select your visual theme preference for TCM Mobile</Text>

            <View style={{ gap: 10, marginVertical: 14 }}>
              {appThemesList.map((item) => {
                const isActive = currentTheme === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onPress={() => {
                      changeTheme(item.id);
                      setThemeModalOpen(false);
                      Alert.alert("Theme Updated", `App theme changed to ${item.name} Mode.`);
                    }}
                    style={[
                      styles.themeOptionCard,
                      { backgroundColor: activeAppTheme.inputBg || activeAppTheme.bg, borderColor: activeAppTheme.border },
                      isActive && { borderColor: item.primary, backgroundColor: activeAppTheme.isDark ? activeAppTheme.badgeBg : item.badgeBg }
                    ]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                      <View style={[styles.themeColorCircle, { backgroundColor: item.primary }]}>
                        <Feather name={item.icon} size={18} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.themeOptionTitle, { color: activeAppTheme.text }, isActive && { color: item.primary, fontFamily: fonts.bold }]}>
                          {item.name} Mode
                        </Text>
                        <Text style={[styles.themeOptionSub, { color: activeAppTheme.subtext }]}>{item.subtitle}</Text>
                      </View>
                    </View>
                    {isActive && <Feather name="check-circle" size={20} color={item.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={() => setThemeModalOpen(false)} style={[styles.cancelModalBtn, subtleButtonStyle]}>
              <Text style={[styles.cancelModalBtnText, { color: activeAppTheme.subtext }]}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 4. Language Selector Modal */}
      <Modal visible={languageModalOpen} animationType="slide" transparent onRequestClose={() => setLanguageModalOpen(false)}>
        <Pressable onPress={() => setLanguageModalOpen(false)} style={styles.modalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalCard, modalCardStyle]}>
            <View style={[styles.sheetHandleBar, { backgroundColor: activeAppTheme.border }]} />
            <Text style={[styles.modalTitle, { color: activeAppTheme.text }]}>Select App Language</Text>

            {["English", "Hindi (हिंदी)", "Hinglish"].map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => {
                  setSelectedLanguage(lang.split(" ")[0]);
                  setLanguageModalOpen(false);
                }}
                style={[styles.langOptionRow, { borderBottomColor: activeAppTheme.border }]}
              >
                <Text style={[styles.langOptionText, { color: activeAppTheme.text }]}>{lang}</Text>
                {selectedLanguage === lang.split(" ")[0] && <Feather name="check" size={18} color={activeAppTheme.primary} />}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* 5. Transactions & Wallet History Full Screen Modal */}
      <Modal visible={walletModalOpen} animationType="slide" onRequestClose={() => setWalletModalOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
          <WalletScreen session={session} user={user} onBack={() => setWalletModalOpen(false)} />
        </SafeAreaView>
      </Modal>
      <MyReviewsModal
        visible={myReviewsModalOpen}
        session={session}
        userId={user.id || session?.user?.id}
        user={user}
        onClose={() => setMyReviewsModalOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 34
  },
  smallSwitch: {
    transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }]
  },

  topBackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 2,
    paddingHorizontal: 2
  },
  inlineBackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E1FF"
  },
  inlineBackText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#5B3CF5"
  },
  topHeaderTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725"
  },

  // User Summary Card
  userSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  userSummaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1
  },
  avatarWrapper: {
    position: "relative"
  },
  avatarImg: {
    width: 70,
    height: 70,
    borderRadius: 35
  },
  avatarInitialsContainer: {
    backgroundColor: "#5B3CF5",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarInitialsText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#5B3CF5",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  userInfoCol: {
    gap: 3,
    flex: 1
  },
  userNameText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: "#181725"
  },
  mentorRoleBadge: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD6FE"
  },
  mentorRoleBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },
  userHandleText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#7C7C9A"
  },
  userEmailText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#94A3B8"
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10
  },
  editProfileBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#5B3CF5"
  },

  // Section Card
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#8A879F",
    letterSpacing: 0.8,
    marginBottom: 12
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F3FA"
  },
  settingRowNoBorder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  rowTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: "#181725"
  },
  rowSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C7C9A",
    marginTop: 2
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  badgePillText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#5B3CF5"
  },
  themeBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1
  },
  themeBadgePillText: {
    fontFamily: fonts.bold,
    fontSize: 12
  },
  infoPillBadge: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10
  },
  infoPillText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },
  activePlanBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#A7F3D0"
  },
  activePlanText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#10B981"
  },
  appliedRefBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#A7F3D0"
  },
  appliedRefText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#10B981"
  },
  cacheSizeText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#94A3B8"
  },

  // Logout Button
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF0F2",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FFE0E4"
  },
  logoutBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FF465F"
  },
  appVersionText: {
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 20
  },

  // Modals Base
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end"
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%"
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 16
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: "#0F172A",
    marginBottom: 4
  },
  modalSubText: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12
  },

  // Form Inputs
  avatarEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginVertical: 14
  },
  changeAvatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  changeAvatarText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#5B3CF5"
  },
  inputGroup: {
    marginBottom: 14
  },
  inputLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#475569",
    marginBottom: 6
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: "#0F172A"
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  cancelModalBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#64748B"
  },
  saveModalBtn: {
    flex: 1,
    backgroundColor: "#5B3CF5",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  saveModalBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FFFFFF"
  },

  // Theme Card Item
  themeOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0"
  },
  themeColorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center"
  },
  themeOptionTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: "#0F172A"
  },
  themeOptionSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1
  },
  langOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  langOptionText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: "#0F172A"
  }
});
