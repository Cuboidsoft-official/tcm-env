import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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
import { applyReferralCode, askSupportAi, deleteAccount, getProfile, updateProfile, uploadImageToServer } from "../api/client";
import MyReviewsModal from "../components/MyReviewsModal";
import { useTheme } from "../context/ThemeContext";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import WalletScreen from "./WalletScreen";
import { DOMAIN_CATEGORIES, PRESET_SKILLS, getSkillIconInfo, renderSkillIcon, getSkillLevel, getSkillsAutocompleteSuggestions } from "../utils/skillIcons";

const themesList = [
  {
    id: "Nature",
    name: "Nature",
    subtitle: "Fresh Forest & Soft Mint Emerald (Default)",
    icon: "leaf",
    primaryColor: "#0A6836",
    bgColor: "#F4F7F4",
    badgeColor: "#E8F5E9"
  },
  {
    id: "Day",
    name: "Day",
    subtitle: "Classic Light & Crisp Daylight",
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
    primaryColor: "#10B981",
    bgColor: "#0F172A",
    badgeColor: "#064E3B"
  },
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
    .toUpperCase() || "Last Class";

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

  // Modals State
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [myReviewsModalOpen, setMyReviewsModalOpen] = useState(false);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);

  function sanitizeSkills(skList) {
    if (!Array.isArray(skList)) return [];
    if (skList.length === 5 && skList[0]?.name === "JavaScript" && Number(skList[0]?.strength) === 88) {
      return [];
    }
    return skList;
  }

  // Skills Matrix State
  const [userSkills, setUserSkills] = useState(sanitizeSkills(initialUser?.skills));
  const [skillNameInput, setSkillNameInput] = useState("");
  const [skillStrengthInput, setSkillStrengthInput] = useState(80);
  const [editingSkillIndex, setEditingSkillIndex] = useState(null);
  const [selectedDomainTab, setSelectedDomainTab] = useState("All");
  const [savingSkills, setSavingSkills] = useState(false);

  useEffect(() => {
    if (Array.isArray(user.skills)) {
      setUserSkills(sanitizeSkills(user.skills));
    }
  }, [user.skills]);

  function openSkillsModal() {
    setUserSkills(sanitizeSkills(user.skills));
    setSkillNameInput("");
    setSkillStrengthInput(80);
    setEditingSkillIndex(null);
    setSkillsModalOpen(true);
  }

  function handleAddOrUpdateSkill() {
    if (!skillNameInput.trim()) {
      Alert.alert("Skill Required", "Please enter a skill name (e.g. React, Python, C++).");
      return;
    }
    const cleanName = skillNameInput.trim();
    const strengthVal = Math.max(0, Math.min(100, Number(skillStrengthInput) || 50));

    setUserSkills((prev) => {
      const updated = [...prev];
      if (editingSkillIndex !== null && editingSkillIndex >= 0 && editingSkillIndex < updated.length) {
        updated[editingSkillIndex] = { name: cleanName, strength: strengthVal };
      } else {
        const existingIdx = updated.findIndex((s) => s.name.toLowerCase() === cleanName.toLowerCase());
        if (existingIdx >= 0) {
          updated[existingIdx] = { name: cleanName, strength: strengthVal };
        } else {
          updated.push({ name: cleanName, strength: strengthVal });
        }
      }
      return updated;
    });

    setSkillNameInput("");
    setSkillStrengthInput(80);
    setEditingSkillIndex(null);
  }

  function handleEditSkill(index) {
    const item = userSkills[index];
    if (!item) return;
    setSkillNameInput(item.name);
    setSkillStrengthInput(item.strength);
    setEditingSkillIndex(index);
  }

  function handleRemoveSkill(index) {
    setUserSkills((prev) => prev.filter((_, idx) => idx !== index));
    if (editingSkillIndex === index) {
      setEditingSkillIndex(null);
      setSkillNameInput("");
      setSkillStrengthInput(80);
    }
  }

  async function handleSaveSkills() {
    setSavingSkills(true);
    try {
      let finalSkillsList = [...userSkills];
      if (skillNameInput.trim()) {
        const cleanName = skillNameInput.trim();
        const strengthVal = Math.max(0, Math.min(100, Number(skillStrengthInput) || 50));
        const existingIdx = finalSkillsList.findIndex((s) => (s.name || s).toLowerCase() === cleanName.toLowerCase());
        if (existingIdx >= 0) {
          finalSkillsList[existingIdx] = { name: cleanName, strength: strengthVal };
        } else {
          finalSkillsList.push({ name: cleanName, strength: strengthVal });
        }
      }

      const payload = { skills: finalSkillsList };
      if (session?.token) {
        const res = await updateProfile(session.token, payload);
        if (res?.user) {
          setUser(res.user);
          setUserSkills(res.user.skills || finalSkillsList);
          if (onUserUpdate) onUserUpdate(res.user);
        }
      } else {
        setUser((prev) => ({ ...prev, skills: finalSkillsList }));
        setUserSkills(finalSkillsList);
        if (onUserUpdate) onUserUpdate({ ...user, skills: finalSkillsList });
      }
      setSkillNameInput("");
      setSkillsModalOpen(false);
      Alert.alert("Skills Saved!", "Your skills matrix & proficiency levels have been updated on your profile!");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update skills.");
    } finally {
      setSavingSkills(false);
    }
  }

  // Help & Support Modal State
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportQueryInput, setSupportQueryInput] = useState("");
  const [askingSupportAi, setAskingSupportAi] = useState(false);
  const [supportMessages, setSupportMessages] = useState([
    {
      id: "welcome_1",
      sender: "ai",
      text: "Hello! I am your Oveta AI Support Specialist 🤖. How can I help you today? Ask about course access, doubt rooms, wallet/coins, or mentor bookings."
    }
  ]);

  async function handleSendSupportQuery(queryText) {
    const textToSend = queryText || supportQueryInput;
    if (!textToSend || !textToSend.trim()) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: textToSend.trim()
    };

    setSupportMessages((prev) => [...prev, userMsg]);
    setSupportQueryInput("");
    setAskingSupportAi(true);

    try {
      const res = await askSupportAi(session?.token, textToSend.trim());
      const aiReplyText = res?.answer || "Thank you for reaching out! Your query has been logged. If your issue is still unresolved, please email our support team directly at support@cuboidsoft.in.";
      
      setSupportMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: aiReplyText
        }
      ]);
    } catch (err) {
      setSupportMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: "Here are recommended steps:\n\n1. Ensure you have active internet connectivity.\n2. If your issue is still unresolved, please send an email directly to support@cuboidsoft.in and our technical team will assist you within 24 hours."
        }
      ]);
    } finally {
      setAskingSupportAi(false);
    }
  }

  function handleSendEmailSupport() {
    const subject = encodeURIComponent("Last Class App Technical Support & Feedback");
    const body = encodeURIComponent(
      `Hello Last Class Support Team,\n\nI need help with my Last Class app account.\n\nUser ID: ${user.id || session?.user?.id || "N/A"}\nUser Name: ${user.name || "Last Class Learner"}\n\nDescription of my issue:\n`
    );
    const mailtoUrl = `mailto:support@cuboidsoft.in?subject=${subject}&body=${body}`;

    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.open(mailtoUrl, "_blank");
      }
      return;
    }

    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(mailtoUrl);
        } else {
          Alert.alert("Email Support ✉️", "Please send an email to: support@cuboidsoft.in");
        }
      })
      .catch(() => {
        Alert.alert("Email Support ✉️", "Please send an email to: support@cuboidsoft.in");
      });
  }

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

  // Custom Confirm Modals for Logout & Delete Account
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

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
      if (res && (res.user || res.success)) {
        const updatedUser = res.user || { ...user, referredBy: referralInput.trim().toUpperCase() };
        setUser(updatedUser);
        if (onUserUpdate) onUserUpdate(updatedUser);
        Alert.alert("Referral Applied! 🎉", res.message || "Referral code applied successfully!");
        setReferralInput("");
      } else {
        Alert.alert("Error", res?.message || "Failed to apply referral code.");
      }
    } catch (err) {
      Alert.alert("Application Failed", err.message || "Could not apply referral code.");
    } finally {
      setApplyingReferral(false);
    }
  }

  function openEditModal() {
    const subjectsArray = Array.isArray(user.subjects) ? user.subjects : [];
    const skillsArray = Array.isArray(user.skills)
      ? user.skills.map((s) => (typeof s === "string" ? s : s.name || s.label || s.title))
      : typeof user.skills === "string"
      ? user.skills.split(",")
      : [];

    const autoHandle = (user.handle && user.handle !== "ayushman" && user.handle !== "ayushman.dev")
      ? user.handle
      : (user.name ? user.name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "") : "tcm_member");

    setForm({
      name: user.name || "",
      handle: autoHandle,
      bio: user.bio || "",
      location: user.location || "India",
      website: user.website || "thecodemunk.in",
      avatarUrl: user.avatarUrl || "",
      mentorCategory: user.mentorCategory || "Last Class Information Tech",
      yearsExperience: user.yearsExperience || "5+ Yrs Exp",
      subjectsStr: subjectsArray.length ? subjectsArray.join(", ") : "Full Stack Development, Node.js, React Native, System Design",
      skillsStr: skillsArray.length ? skillsArray.join(", ") : ""
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
      }
      setForm((prev) => ({ ...prev, avatarUrl: selectedUri }));
      
      setUpdating(true);
      try {
        let finalHosted = selectedUri;
        if (session?.token) {
          const hosted = await uploadImageToServer(session.token, selectedUri);
          if (hosted) finalHosted = hosted;
          const res = await updateProfile(session.token, { avatarUrl: finalHosted });
          if (res?.user) {
            setUser(res.user);
            if (onUserUpdate) onUserUpdate(res.user);
          }
        } else {
          setUser((prev) => ({ ...prev, avatarUrl: finalHosted }));
          if (onUserUpdate) onUserUpdate({ ...user, avatarUrl: finalHosted });
        }
        Alert.alert("Profile Picture Updated!", "Your avatar image has been updated successfully.");
      } catch (err) {
        console.log("Avatar upload error:", err);
      } finally {
        setUpdating(false);
      }
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

      const parsedSkills = form.skillsStr
        ? form.skillsStr.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        ...form,
        subjects: parsedSubjects,
        skills: parsedSkills
      };

      if (session?.token) {
        if (form.avatarUrl) {
          const hosted = await uploadImageToServer(session.token, form.avatarUrl);
          if (hosted) payload.avatarUrl = hosted;
        }
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
    setLogoutConfirmVisible(true);
  }

  function confirmLogoutAction() {
    setLogoutConfirmVisible(false);
    if (onLogout) {
      onLogout();
    } else if (session?.onLogout) {
      session.onLogout();
    }
  }

  function handleDeleteAccountPress() {
    if (isMentorUser || user.role === "partner") {
      Alert.alert("Account Deletion Restricted", "Account deletion via Profile Settings is only available for Student accounts.");
      return;
    }
    setDeleteConfirmVisible(true);
  }

  async function confirmDeleteAccountAction() {
    setDeleteConfirmVisible(false);
    try {
      setUpdating(true);
      const token = session?.token || user.token;
      await deleteAccount(token);
      Alert.alert("Account Deleted", "Your student account has been deleted permanently.");
      if (onLogout) {
        onLogout();
      } else if (session?.onLogout) {
        session.onLogout();
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to delete account. Please try again.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: activeAppTheme.bg }]} contentContainerStyle={{ paddingTop: 12 }} showsVerticalScrollIndicator={false}>
      {/* 1. User Overview Card */}
      <View style={[styles.userSummaryCard, { backgroundColor: activeAppTheme.cardBg, borderColor: activeAppTheme.border }]}>
        <View style={styles.userSummaryLeft}>
          <View style={styles.avatarWrapper}>
            <ProfileAvatar name={user.name} uri={user.avatarUrl} size={56} />
            <TouchableOpacity onPress={openEditModal} activeOpacity={0.8} style={[styles.avatarEditBadge, { backgroundColor: activeAppTheme.primary, borderColor: activeAppTheme.cardBg }]}>
              <Feather name="camera" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.userInfoCol}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={[styles.userNameText, { color: activeAppTheme.text }]}>{user.name || "Last Class Member"}</Text>
              {isMentorUser && (
                <View style={[styles.mentorRoleBadge, { backgroundColor: activeAppTheme.badgeBg }]}>
                  <Text style={[styles.mentorRoleBadgeText, { color: activeAppTheme.primary }]}>Mentor</Text>
                </View>
              )}
            </View>
            <Text style={[styles.userHandleText, { color: activeAppTheme.subtext }]}>
              @{user.handle && user.handle !== "ayushman" && user.handle !== "ayushman.dev"
                ? user.handle.replace(/^@/, "")
                : (user.name ? user.name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "") : "tcm_member")}
            </Text>
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
                <Text style={[styles.rowSub, rowSubStyle]}>{user.mentorCategory || "Last Class Information Tech"}</Text>
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
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Edit Profile Info</Text>
              <Text numberOfLines={1} style={[styles.rowSub, rowSubStyle]}>Name, Bio, Handle, Location & Links</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color="#8A879F" />
        </TouchableOpacity>

        <TouchableOpacity onPress={openSkillsModal} activeOpacity={0.7} style={[styles.settingRow, settingRowStyle]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#EEF2FF" }]}>
              <MaterialCommunityIcons name="code-tags-check" size={20} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Skills & Proficiency Matrix</Text>
              <Text numberOfLines={1} style={[styles.rowSub, rowSubStyle]}>LeetCode style skills • Auto icons</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={[styles.infoPillBadge, { backgroundColor: "#EEF2FF" }]}>
              <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: "#4F46E5" }}>
                {(user.skills || userSkills).length} Skills
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#8A879F" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setChangePasswordModalOpen(true)} activeOpacity={0.7} style={[styles.settingRow, settingRowStyle]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#EAF5FF" }]}>
              <Feather name="lock" size={18} color="#2F79B9" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Password & Security</Text>
              <Text numberOfLines={1} style={[styles.rowSub, rowSubStyle]}>Change password & security credentials</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color="#8A879F" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMyReviewsModalOpen(true)} activeOpacity={0.7} style={[styles.settingRow, settingRowStyle]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#FFF8EC" }]}>
              <FontAwesome name="star" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, rowTitleStyle]}>My Class Reviews & Performance</Text>
              <Text numberOfLines={1} style={[styles.rowSub, rowSubStyle]}>Class reflections & mentor feedback</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color="#8A879F" />
        </TouchableOpacity>

        <View style={styles.settingRowNoBorder}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#ECF9E9" }]}>
              <Feather name="shield" size={18} color="#2E7D32" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Public Profile Visibility</Text>
              <Text numberOfLines={1} style={[styles.rowSub, rowSubStyle]}>Allow non-connections to see your posts</Text>
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

      {/* 4. Appearance & Themes */}
      <View style={[styles.sectionCard, sectionCardStyle]}>
        <Text style={[styles.sectionHeader, sectionHeaderStyle]}>APPEARANCE & THEMES</Text>

        {/* Theme Switching Row */}
        <TouchableOpacity onPress={() => setThemeModalOpen(true)} activeOpacity={0.7} style={styles.settingRowNoBorder}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: activeAppTheme.badgeBg }]}>
              <Feather name="moon" size={18} color={activeAppTheme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, rowTitleStyle]}>App Theme & Appearance</Text>
              <Text numberOfLines={1} style={[styles.rowSub, rowSubStyle]}>{activeAppTheme.name} Mode • Custom Accents</Text>
            </View>
          </View>
          <View style={[styles.themeBadgePill, { backgroundColor: activeAppTheme.badgeBg, borderColor: activeAppTheme.primary }]}>
            <Text style={[styles.themeBadgePillText, { color: activeAppTheme.primary }]}>
              {activeAppTheme.name} Mode
            </Text>
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
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Push Notifications</Text>
              <Text numberOfLines={1} style={[styles.rowSub, rowSubStyle]}>Class alerts & mentions</Text>
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
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Email Digests & Updates</Text>
              <Text numberOfLines={1} style={[styles.rowSub, rowSubStyle]}>Weekly progress report</Text>
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
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, rowTitleStyle]}>Wi-Fi Only Downloads</Text>
              <Text numberOfLines={1} style={[styles.rowSub, rowSubStyle]}>Download material over Wi-Fi</Text>
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
              <Text style={[styles.rowTitle, rowTitleStyle]}>Active Plan: Last Class Pro Member</Text>
              <Text style={styles.rowSub}>Unlimited access • Verified Badge Active</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => Alert.alert("Plan Status", "Your Last Class Pro subscription is active!")} style={styles.activePlanBadge}>
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
        </TouchableOpacity>
      </View>

      {/* 6.5. Referral Code Program */}
      <View style={[styles.sectionCard, sectionCardStyle]}>
        <Text style={[styles.sectionHeader, sectionHeaderStyle]}>REFERRAL PROGRAM 🎁</Text>
        {user.referredBy ? (
          <View style={styles.settingRowNoBorder}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "#ECFDF5" }]}>
                <Feather name="check-circle" size={18} color="#10B981" />
              </View>
              <View>
                <Text style={[styles.rowTitle, rowTitleStyle]}>Redeemed Referral Code</Text>
                <Text style={[styles.rowSub, rowSubStyle]}>Code: {user.referredBy} • +25 Last Class Coins Credited</Text>
              </View>
            </View>
            <View style={styles.appliedRefBadge}>
              <Text style={styles.appliedRefText}>Redeemed</Text>
            </View>
          </View>
        ) : (
          <View style={{ paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: activeAppTheme.subtext, marginBottom: 12 }}>
              Have a friend's referral code? Enter it below to claim +25 Last Class Coins! (Can be redeemed once per account).
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
                placeholder="Enter Referral Code (e.g. ANK25X)"
                placeholderTextColor="#9CA3AF"
                value={referralInput}
                onChangeText={(txt) => setReferralInput(txt.toUpperCase())}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                onPress={handleApplyReferral}
                disabled={applyingReferral}
                style={{
                  backgroundColor: activeAppTheme.primary,
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
        )}
      </View>

      {/* 7. Support & Legal */}
      <View style={[styles.sectionCard, sectionCardStyle]}>
        <Text style={[styles.sectionHeader, sectionHeaderStyle]}>SUPPORT & LEGAL</Text>

        <TouchableOpacity onPress={() => setSupportModalOpen(true)} style={[styles.settingRow, settingRowStyle]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#F0EDFF" }]}>
              <Feather name="help-circle" size={18} color="#5B3CF5" />
            </View>
            <Text style={[styles.rowTitle, rowTitleStyle]}>Help Center & Support</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#8A879F" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Alert.alert("Privacy Policy", "Last Class protects your privacy and personal data.")} style={styles.settingRowNoBorder}>
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

      {/* 9. Delete Account Button (Students Only) */}
      {!isMentorUser && user.role !== "partner" ? (
        <TouchableOpacity
          onPress={handleDeleteAccountPress}
          activeOpacity={0.8}
          disabled={updating}
          style={[
            styles.logoutBtn,
            {
              backgroundColor: activeAppTheme.isDark ? "#3A1B1F" : "#FFF5F5",
              borderColor: activeAppTheme.isDark ? "#5A242B" : "#FED7D7",
              marginTop: 10
            }
          ]}
        >
          <Feather name="trash-2" size={18} color="#EF4444" />
          <Text style={[styles.logoutBtnText, { color: "#EF4444" }]}>
            {updating ? "Deleting Account..." : "Delete Account (Students Only)"}
          </Text>
        </TouchableOpacity>
      ) : null}

      <Text style={[styles.appVersionText, { color: activeAppTheme.subtext }]}>Last Class Mobile App v2.4.0 • Built for Curious Minds</Text>

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
                      placeholder="e.g. Last Class Information Tech"
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
                <Text style={[styles.inputLabel, { color: activeAppTheme.subtext }]}>Technical Skills / Specialties (comma separated)</Text>
                <TextInput
                  value={form.skillsStr}
                  onChangeText={(t) => setForm((p) => ({ ...p, skillsStr: t }))}
                  placeholder="e.g. Python, React, JavaScript, Physics, Node.js"
                  placeholderTextColor={activeAppTheme.subtext}
                  style={[styles.textInput, inputStyle]}
                />
              </View>

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
            <Text style={[styles.modalSubText, { color: activeAppTheme.subtext }]}>Select your visual theme preference for Last Class Mobile</Text>

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

      {/* HELP & SUPPORT AI BOTTOM SHEET MODAL */}
      <Modal visible={supportModalOpen} animationType="slide" transparent onRequestClose={() => setSupportModalOpen(false)}>
        <Pressable onPress={() => setSupportModalOpen(false)} style={styles.modalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalCard, modalCardStyle, { maxHeight: "88%", paddingBottom: 20 }]}>
            <View style={[styles.sheetHandleBar, { backgroundColor: activeAppTheme.border }]} />
            
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: activeAppTheme.badgeBg, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                  <MaterialCommunityIcons name="bot" size={20} color={activeAppTheme.primary} />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: activeAppTheme.text, marginBottom: 0 }]}>Help & AI Support 🤖</Text>
                  <Text style={{ fontSize: 11, color: activeAppTheme.subtext }}>Instant AI Assistant & Customer Care</Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setSupportModalOpen(false)} style={{ padding: 4 }}>
                <Feather name="x" size={20} color={activeAppTheme.subtext} />
              </TouchableOpacity>
            </View>

            {/* Quick Topic Chips */}
            <Text style={{ fontSize: 11, fontWeight: "700", color: activeAppTheme.subtext, marginBottom: 6 }}>Quick Assistance Topics:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
              {[
                "Doubt Room Access",
                "Wallet & Coins",
                "Course Enrollment",
                "Mentor Booking",
                "App Bug Report"
              ].map((topic) => (
                <TouchableOpacity
                  key={topic}
                  onPress={() => handleSendSupportQuery(`Help me with ${topic}`)}
                  style={{
                    backgroundColor: activeAppTheme.badgeBg,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: activeAppTheme.border
                  }}
                >
                  <Text style={{ fontSize: 11.5, fontFamily: fonts.bold, color: activeAppTheme.primary }}>
                    💡 {topic}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Chat Messages Log */}
            <ScrollView style={{ maxHeight: 220, marginVertical: 8, backgroundColor: activeAppTheme.isDark ? "#1E263B" : "#F8FAFC", borderRadius: 14, padding: 10, borderWidth: 1, borderColor: activeAppTheme.border }}>
              {supportMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    backgroundColor: msg.sender === "user" ? activeAppTheme.primary : (activeAppTheme.isDark ? "#334155" : "#FFFFFF"),
                    borderRadius: 12,
                    padding: 10,
                    marginBottom: 8,
                    maxWidth: "85%",
                    borderWidth: msg.sender === "user" ? 0 : 1,
                    borderColor: activeAppTheme.border
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: msg.sender === "user" ? "#FFFFFF" : activeAppTheme.text, lineHeight: 17 }}>
                    {msg.text}
                  </Text>
                </View>
              ))}
              {askingSupportAi ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 }}>
                  <ActivityIndicator size="small" color={activeAppTheme.primary} />
                  <Text style={{ fontSize: 11.5, color: activeAppTheme.subtext, fontStyle: "italic" }}>Oveta AI Support is typing answer...</Text>
                </View>
              ) : null}
            </ScrollView>

            {/* AI Input Field */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, marginBottom: 12 }}>
              <TextInput
                value={supportQueryInput}
                onChangeText={setSupportQueryInput}
                placeholder="Describe your issue or ask a question..."
                placeholderTextColor={activeAppTheme.subtext}
                style={{
                  flex: 1,
                  backgroundColor: activeAppTheme.isDark ? "#1E293B" : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: activeAppTheme.border,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  fontSize: 12.5,
                  color: activeAppTheme.text
                }}
              />
              <TouchableOpacity
                onPress={() => handleSendSupportQuery()}
                disabled={askingSupportAi || !supportQueryInput.trim()}
                style={{
                  backgroundColor: activeAppTheme.primary,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  opacity: askingSupportAi || !supportQueryInput.trim() ? 0.6 : 1
                }}
              >
                <Feather name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Email Support Fallback (support@cuboidsoft.in) */}
            <View style={{ backgroundColor: activeAppTheme.isDark ? "#1E293B" : "#FFF8F8", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#FECDD3", marginTop: 4 }}>
              <Text style={{ fontSize: 11.5, fontFamily: fonts.bold, color: "#991B1B", marginBottom: 2 }}>
                Issue Still Not Resolved? ✉️
              </Text>
              <Text style={{ fontSize: 11, color: activeAppTheme.subtext, marginBottom: 8 }}>
                If our AI Assistant couldn't solve your issue, send feedback or email us directly at support@cuboidsoft.in.
              </Text>

              <TouchableOpacity
                onPress={handleSendEmailSupport}
                style={{
                  backgroundColor: "#DC2626",
                  paddingVertical: 9,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <Feather name="mail" size={15} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 12 }}>
                  Send Email to support@cuboidsoft.in
                </Text>
              </TouchableOpacity>
            </View>

          </Pressable>
        </Pressable>
      </Modal>

      {/* 5. SKILLS MATRIX BOTTOM SHEET MODAL (LEETCODE STYLE) */}
      <Modal visible={skillsModalOpen} animationType="slide" transparent onRequestClose={() => setSkillsModalOpen(false)}>
        <View style={styles.modalBg}>
          <Pressable onPress={() => setSkillsModalOpen(false)} style={StyleSheet.absoluteFill} />
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalCard, modalCardStyle, { maxHeight: "88%", paddingBottom: 20 }]}>
            <View style={[styles.sheetHandleBar, { backgroundColor: activeAppTheme.border }]} />
            
            {/* Modal Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: activeAppTheme.isDark ? "#1E1B4B" : "#EEF2FF", alignItems: "center", justifyContent: "center" }}>
                  <MaterialCommunityIcons name="code-tags-check" size={22} color="#4F46E5" />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: activeAppTheme.text, marginBottom: 0 }]}>Manage Skills & Strength</Text>
                  <Text style={{ fontSize: 11, color: activeAppTheme.subtext }}>LeetCode style skill matrix • Score out of 100</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSkillsModalOpen(false)} style={{ padding: 6 }}>
                <Feather name="x" size={20} color={activeAppTheme.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              style={{ flexShrink: 1, maxHeight: 520 }}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* Domain Category Filter Tabs */}
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: activeAppTheme.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Select Domain / Category:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {DOMAIN_CATEGORIES.map((cat) => {
                    const active = selectedDomainTab === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setSelectedDomainTab(cat.id)}
                        style={{
                          backgroundColor: active ? activeAppTheme.primary : activeAppTheme.cardBg,
                          paddingHorizontal: 12,
                          paddingVertical: 5,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: active ? activeAppTheme.primary : activeAppTheme.border
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: active ? "#FFFFFF" : activeAppTheme.text }}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Quick Preset Skills Chips for selected domain */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
                {PRESET_SKILLS.filter((s) => selectedDomainTab === "All" || s.category === selectedDomainTab).map((preset) => {
                  const isAdded = userSkills.some((s) => s.name.toLowerCase() === preset.name.toLowerCase());
                  const iconInfo = getSkillIconInfo(preset.name);
                  return (
                    <TouchableOpacity
                      key={preset.name}
                      onPress={() => {
                        const nameLower = preset.name.toLowerCase();
                        const exists = userSkills.some((s) => (s.name || s).toLowerCase() === nameLower);
                        if (exists) {
                          setUserSkills((prev) => prev.filter((s) => (s.name || s).toLowerCase() !== nameLower));
                        } else {
                          setUserSkills((prev) => [...prev, { name: preset.name, strength: preset.strength }]);
                        }
                        setSkillNameInput(preset.name);
                        setSkillStrengthInput(preset.strength);
                      }}
                      style={{
                        backgroundColor: isAdded ? iconInfo.bg : activeAppTheme.cardBg,
                        borderColor: isAdded ? iconInfo.accent : activeAppTheme.border,
                        borderWidth: 1,
                        borderRadius: 20,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      {renderSkillIcon(iconInfo, 14)}
                      <Text style={{ fontSize: 12, fontWeight: "600", color: isAdded ? iconInfo.color : activeAppTheme.text }}>
                        {preset.name}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: isAdded ? iconInfo.accent : activeAppTheme.subtext }}>
                        {preset.strength}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Add / Edit Skill Card */}
              <View style={{ backgroundColor: activeAppTheme.badgeBg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: activeAppTheme.border, marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: activeAppTheme.text, marginBottom: 10 }}>
                  {editingSkillIndex !== null ? "Edit Skill Strength" : "Add Skill or Subject"}
                </Text>

                {/* Skill Name Input & Auto Icon Preview */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: activeAppTheme.subtext, marginBottom: 4 }}>
                    Skill / Subject Name (NEET, JEE, Govt, Coding, etc.)
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: activeAppTheme.cardBg, borderWidth: 1, borderColor: activeAppTheme.border, borderRadius: 12, paddingHorizontal: 12 }}>
                    {skillNameInput.trim() ? (
                      renderSkillIcon(getSkillIconInfo(skillNameInput), 18, { marginRight: 8 })
                    ) : (
                      <Feather name="book-open" size={18} color={activeAppTheme.subtext} style={{ marginRight: 8 }} />
                    )}
                    <TextInput
                      value={skillNameInput}
                      onChangeText={setSkillNameInput}
                      placeholder="e.g. Biology, Organic Chemistry, Reasoning, React..."
                      placeholderTextColor={activeAppTheme.subtext}
                      style={{ flex: 1, height: 42, fontSize: 13, color: activeAppTheme.text }}
                    />
                  </View>

                  {/* Autocomplete Dropdown Suggestions */}
                  {skillNameInput.trim().length > 0 && (
                    <View style={{ marginTop: 6, backgroundColor: activeAppTheme.cardBg, borderRadius: 10, borderWidth: 1, borderColor: activeAppTheme.border, overflow: "hidden" }}>
                      {getSkillsAutocompleteSuggestions(skillNameInput).map((sug) => {
                        const sugIcon = getSkillIconInfo(sug.name);
                        return (
                          <TouchableOpacity
                            key={sug.name}
                            onPress={() => {
                              setSkillNameInput(sug.name);
                              setSkillStrengthInput(sug.strength);
                            }}
                            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: activeAppTheme.border }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              {renderSkillIcon(sugIcon, 14)}
                              <Text style={{ fontSize: 12, fontWeight: "600", color: activeAppTheme.text }}>{sug.name}</Text>
                            </View>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: activeAppTheme.primary }}>{sug.strength}%</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Strength Score (0 - 100) */}
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: activeAppTheme.subtext }}>Strength Score (Out of 100)</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={{ backgroundColor: getSkillLevel(skillStrengthInput).bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: getSkillLevel(skillStrengthInput).color }}>
                          {getSkillLevel(skillStrengthInput).title}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: activeAppTheme.primary }}>
                        {skillStrengthInput}/100
                      </Text>
                    </View>
                  </View>

                  {/* Preset Strength Buttons */}
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                    {[35, 60, 80, 95].map((lvl) => (
                      <TouchableOpacity
                        key={lvl}
                        onPress={() => setSkillStrengthInput(lvl)}
                        style={{
                          flex: 1,
                          paddingVertical: 6,
                          backgroundColor: Number(skillStrengthInput) === lvl ? activeAppTheme.primary : activeAppTheme.cardBg,
                          borderRadius: 8,
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: Number(skillStrengthInput) === lvl ? activeAppTheme.primary : activeAppTheme.border
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: Number(skillStrengthInput) === lvl ? "#FFFFFF" : activeAppTheme.text }}>
                          {lvl}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Visual Strength Progress Bar Preview */}
                  <View style={{ height: 10, backgroundColor: activeAppTheme.border, borderRadius: 5, overflow: "hidden" }}>
                    <View
                      style={{
                        height: "100%",
                        width: `${Math.max(0, Math.min(100, Number(skillStrengthInput) || 0))}%`,
                        backgroundColor: getSkillIconInfo(skillNameInput).accent || activeAppTheme.primary,
                        borderRadius: 5
                      }}
                    />
                  </View>
                </View>

                {/* Add / Update Button */}
                <TouchableOpacity
                  onPress={handleAddOrUpdateSkill}
                  style={{
                    backgroundColor: activeAppTheme.primary,
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <Feather name={editingSkillIndex !== null ? "check" : "plus"} size={16} color="#FFFFFF" />
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>
                    {editingSkillIndex !== null ? "Update Skill" : "Add to Skills Matrix"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Added Skills Matrix List */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: activeAppTheme.text }}>
                  Current Skills Matrix ({userSkills.length})
                </Text>
                {userSkills.length > 0 && (
                  <Text style={{ fontSize: 11, color: activeAppTheme.subtext }}>
                    Avg Strength: {Math.round(userSkills.reduce((a, b) => a + (Number(b.strength) || 0), 0) / userSkills.length)}%
                  </Text>
                )}
              </View>

              {userSkills.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 24, backgroundColor: activeAppTheme.cardBg, borderRadius: 14, borderWidth: 1, borderColor: activeAppTheme.border }}>
                  <MaterialCommunityIcons name="code-json" size={32} color="#94A3B8" />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: activeAppTheme.text, marginTop: 6 }}>No skills added yet</Text>
                  <Text style={{ fontSize: 11, color: activeAppTheme.subtext, marginTop: 2 }}>Use quick add above or type a custom skill name.</Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {userSkills.map((item, index) => {
                    const iconInfo = getSkillIconInfo(item.name);
                    const lvlInfo = getSkillLevel(item.strength);
                    return (
                      <View
                        key={index}
                        style={{
                          backgroundColor: activeAppTheme.cardBg,
                          borderRadius: 14,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: activeAppTheme.border
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: iconInfo.bg, alignItems: "center", justifyContent: "center" }}>
                              {renderSkillIcon(iconInfo, 18)}
                            </View>
                            <View>
                              <Text style={{ fontSize: 13, fontWeight: "700", color: activeAppTheme.text }}>{item.name}</Text>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                                <View style={{ backgroundColor: lvlInfo.bg, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                                  <Text style={{ fontSize: 9.5, fontWeight: "700", color: lvlInfo.color }}>{lvlInfo.title}</Text>
                                </View>
                                <Text style={{ fontSize: 11, fontWeight: "600", color: activeAppTheme.subtext }}>{item.strength}/100</Text>
                              </View>
                            </View>
                          </View>

                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <TouchableOpacity onPress={() => handleEditSkill(index)} style={{ padding: 6 }}>
                              <Feather name="edit-2" size={14} color={activeAppTheme.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleRemoveSkill(index)} style={{ padding: 6 }}>
                              <Feather name="trash-2" size={14} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Progress bar */}
                        <View style={{ height: 6, backgroundColor: activeAppTheme.border, borderRadius: 3, overflow: "hidden" }}>
                          <View
                            style={{
                              height: "100%",
                              width: `${Math.max(0, Math.min(100, Number(item.strength) || 0))}%`,
                              backgroundColor: iconInfo.accent,
                              borderRadius: 3
                            }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Save Skills Button */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity onPress={() => setSkillsModalOpen(false)} style={[styles.cancelModalBtn, subtleButtonStyle, { flex: 1 }]}>
                <Text style={[styles.cancelModalBtnText, { color: activeAppTheme.subtext }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveSkills} disabled={savingSkills} style={[styles.saveModalBtn, { flex: 2, backgroundColor: activeAppTheme.primary }]}>
                {savingSkills ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveModalBtnText}>Save Skills to Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </Modal>

      {/* Logout Custom Confirm Modal */}
      <Modal visible={logoutConfirmVisible} transparent animationType="fade" onRequestClose={() => setLogoutConfirmVisible(false)}>
        <Pressable onPress={() => setLogoutConfirmVisible(false)} style={styles.centeredModalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.confirmModalCard, modalCardStyle]}>
            <View style={[styles.confirmIconWrap, { backgroundColor: "#FFE0E4" }]}>
              <Feather name="log-out" size={28} color="#FF465F" />
            </View>
            <Text style={[styles.confirmTitle, { color: activeAppTheme.text }]}>Logout Confirmation</Text>
            <Text style={[styles.confirmSub, { color: activeAppTheme.subtext }]}>
              Are you sure you want to logout from your Last Class account?
            </Text>
            <View style={styles.confirmActionsRow}>
              <TouchableOpacity onPress={() => setLogoutConfirmVisible(false)} style={[styles.confirmCancelBtn, subtleButtonStyle]}>
                <Text style={[styles.confirmCancelText, { color: activeAppTheme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmLogoutAction} style={[styles.confirmActionBtn, { backgroundColor: "#FF465F" }]}>
                <Text style={styles.confirmActionText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Account Custom Confirm Modal */}
      <Modal visible={deleteConfirmVisible} transparent animationType="fade" onRequestClose={() => setDeleteConfirmVisible(false)}>
        <Pressable onPress={() => setDeleteConfirmVisible(false)} style={styles.centeredModalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.confirmModalCard, modalCardStyle]}>
            <View style={[styles.confirmIconWrap, { backgroundColor: "#FEE2E2" }]}>
              <Feather name="alert-triangle" size={28} color="#EF4444" />
            </View>
            <Text style={[styles.confirmTitle, { color: activeAppTheme.text }]}>Delete Account Permanently?</Text>
            <Text style={[styles.confirmSub, { color: activeAppTheme.subtext }]}>
              Are you sure you want to delete your student account? All your posts, progress, comments, and profile data will be permanently removed. This action CANNOT be undone.
            </Text>
            <View style={styles.confirmActionsRow}>
              <TouchableOpacity onPress={() => setDeleteConfirmVisible(false)} style={[styles.confirmCancelBtn, subtleButtonStyle]}>
                <Text style={[styles.confirmCancelText, { color: activeAppTheme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDeleteAccountAction} style={[styles.confirmActionBtn, { backgroundColor: "#EF4444" }]}>
                <Text style={styles.confirmActionText}>Delete Permanently</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    marginBottom: 10,
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
    borderRadius: 10
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
  userSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
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
    fontFamily: fonts.semiBold,
    fontSize: 14.5,
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
    fontSize: 12,
    color: "#7C7C9A"
  },
  userEmailText: {
    fontFamily: fonts.regular,
    fontSize: 11,
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
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#8A879F",
    letterSpacing: 0.8,
    marginBottom: 8
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F3FA"
  },
  settingRowNoBorder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  rowTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: "#181725"
  },
  rowSub: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: "#7C7C9A",
    marginTop: 1
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
  centeredModalBg: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
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
    backgroundColor: "#0A6836",
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
  },

  // Confirm Modal Styles
  confirmModalCard: {
    width: "88%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    ...shadow.soft
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14
  },
  confirmTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    textAlign: "center",
    marginBottom: 8
  },
  confirmSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20
  },
  confirmActionsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%"
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  confirmCancelText: {
    fontFamily: fonts.semiBold,
    fontSize: 14
  },
  confirmActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  confirmActionText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FFFFFF"
  }
});
