import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getProfile, updateProfile } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";

function ProfileAvatar({ name = "", uri, size = 74 }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "TCM";

  if (uri) {
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

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser]);

  // Toggle Preferences State
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailDigests, setEmailDigests] = useState(true);
  const [classReminders, setClassReminders] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [activityStatus, setActivityStatus] = useState(true);
  const [wifiOnlyDownloads, setWifiOnlyDownloads] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("System");
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  // Modals state
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);

  // Edit profile form state
  const [form, setForm] = useState({
    name: user.name || "",
    handle: user.handle || "",
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || "",
    avatarUrl: user.avatarUrl || ""
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  function openEditModal() {
    setForm({
      name: user.name || "",
      handle: user.handle || "",
      bio: user.bio || "",
      location: user.location || "India",
      website: user.website || "thecodemunk.in",
      avatarUrl: user.avatarUrl || ""
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
      quality: 0.8
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setForm((prev) => ({ ...prev, avatarUrl: result.assets[0].uri }));
    }
  }

  async function handleSaveProfile() {
    if (!form.name.trim()) {
      Alert.alert("Validation Error", "Name field cannot be empty.");
      return;
    }
    setUpdating(true);
    try {
      if (session?.token) {
        const res = await updateProfile(session.token, form);
        if (res?.user) {
          setUser(res.user);
          if (onUserUpdate) onUserUpdate(res.user);
        }
      } else {
        setUser((prev) => ({ ...prev, ...form }));
      }
      setEditProfileModalOpen(false);
      Alert.alert("Success 🎉", "Profile information updated successfully!");
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

    Alert.alert("Password Updated 🔒", "Your password has been changed successfully.");
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
    <View style={styles.container}>
      {/* Top Inline Header Row */}
      <View style={styles.topBackHeader}>
        <Pressable onPress={onBack} style={styles.inlineBackRow}>
          <Feather name="arrow-left" size={16} color="#5B3CF5" />
          <Text style={styles.inlineBackText}>Back to Profile</Text>
        </Pressable>
        <Text style={styles.topHeaderTitle}>Account Settings</Text>
      </View>

      {/* 1. User Overview Card */}
      <View style={styles.userSummaryCard}>
        <View style={styles.userSummaryLeft}>
          <View style={styles.avatarWrapper}>
            <ProfileAvatar name={user.name} uri={user.avatarUrl} size={70} />
            <Pressable onPress={openEditModal} style={styles.avatarEditBadge}>
              <Feather name="camera" size={12} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={styles.userInfoCol}>
            <Text style={styles.userNameText}>{user.name || "TCM Member"}</Text>
            <Text style={styles.userHandleText}>@{user.handle || "tcm_member"}</Text>
            <Text style={styles.userEmailText}>{user.email || "user@thecodemunk.in"}</Text>
          </View>
        </View>

        <Pressable onPress={openEditModal} style={styles.editProfileBtn}>
          <Feather name="edit-3" size={14} color="#5B3CF5" />
          <Text style={styles.editProfileBtnText}>Edit</Text>
        </Pressable>
      </View>

      {/* 2. Account & Personal Info Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>ACCOUNT & SECURITY</Text>

        <Pressable onPress={openEditModal} style={styles.settingRow}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#F0EDFF" }]}>
              <Feather name="user" size={18} color="#5B3CF5" />
            </View>
            <View>
              <Text style={styles.rowTitle}>Edit Profile Info</Text>
              <Text style={styles.rowSub}>Name, Bio, Handle, Location & Links</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color="#8A879F" />
        </Pressable>

        <Pressable onPress={() => setChangePasswordModalOpen(true)} style={styles.settingRow}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#EAF5FF" }]}>
              <Feather name="lock" size={18} color="#2F79B9" />
            </View>
            <View>
              <Text style={styles.rowTitle}>Password & Security</Text>
              <Text style={styles.rowSub}>Change password & security credentials</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color="#8A879F" />
        </Pressable>

        <View style={styles.settingRowNoBorder}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#ECF9E9" }]}>
              <Feather name="shield" size={18} color="#2E7D32" />
            </View>
            <View>
              <Text style={styles.rowTitle}>Public Profile Visibility</Text>
              <Text style={styles.rowSub}>Allow non-connections to see your posts</Text>
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

      {/* 3. Notifications & Preferences */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>PREFERENCES & NOTIFICATIONS</Text>

        <View style={styles.settingRow}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#FFF6DA" }]}>
              <Feather name="bell" size={18} color="#E7A900" />
            </View>
            <View>
              <Text style={styles.rowTitle}>Push Notifications</Text>
              <Text style={styles.rowSub}>Class alerts, mentions & community posts</Text>
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

        <View style={styles.settingRow}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#F0EDFF" }]}>
              <Feather name="mail" size={18} color="#5B3CF5" />
            </View>
            <View>
              <Text style={styles.rowTitle}>Email Digests & Updates</Text>
              <Text style={styles.rowSub}>Weekly progress report & newsletter</Text>
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

        <Pressable onPress={() => setLanguageModalOpen(true)} style={styles.settingRow}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#EAF5FF" }]}>
              <Feather name="globe" size={18} color="#2F79B9" />
            </View>
            <View>
              <Text style={styles.rowTitle}>App Language</Text>
              <Text style={styles.rowSub}>{selectedLanguage}</Text>
            </View>
          </View>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>{selectedLanguage}</Text>
            <Feather name="chevron-right" size={14} color="#5B3CF5" />
          </View>
        </Pressable>

        <View style={styles.settingRowNoBorder}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: "#FFF0F2" }]}>
              <Feather name="wifi" size={18} color="#FF465F" />
            </View>
            <View>
              <Text style={styles.rowTitle}>Wi-Fi Only Downloads</Text>
              <Text style={styles.rowSub}>Download course material only over Wi-Fi</Text>
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

        {/* 5. Subscription & Membership */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>MEMBERSHIP & BILLING</Text>

          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "#FFF6DA" }]}>
                <FontAwesome5 name="crown" size={16} color="#FFD700" />
              </View>
              <View>
                <Text style={styles.rowTitle}>Active Plan: TCM Pro Learner</Text>
                <Text style={styles.rowSub}>Unlimited access • Renews Dec 2026</Text>
              </View>
            </View>
            <Pressable onPress={() => Alert.alert("Plan Status", "Your TCM Pro subscription is active!")} style={styles.activePlanBadge}>
              <Text style={styles.activePlanText}>Active</Text>
            </Pressable>
          </View>

          <Pressable onPress={handleClearCache} style={styles.settingRowNoBorder}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "#F4F3FA" }]}>
                <Feather name="trash-2" size={18} color="#68677D" />
              </View>
              <View>
                <Text style={styles.rowTitle}>Clear App Cache</Text>
                <Text style={styles.rowSub}>Free up local temporary media storage</Text>
              </View>
            </View>
            <Text style={styles.cacheSizeText}>24.5 MB</Text>
          </Pressable>
        </View>

        {/* 6. Support & Legal */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>SUPPORT & LEGAL</Text>

          <Pressable onPress={() => Alert.alert("Help Center", "Opening TCM Help Center & FAQ...")} style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "#F0EDFF" }]}>
                <Feather name="help-circle" size={18} color="#5B3CF5" />
              </View>
              <Text style={styles.rowTitle}>Help Center & Support</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#8A879F" />
          </Pressable>

          <Pressable onPress={() => Alert.alert("Privacy Policy", "TCM protects your privacy and personal data.")} style={styles.settingRowNoBorder}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "#EAF5FF" }]}>
                <Feather name="file-text" size={18} color="#2F79B9" />
              </View>
              <Text style={styles.rowTitle}>Privacy Policy & Terms</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#8A879F" />
          </Pressable>
        </View>

        {/* 7. Logout Button */}
        <Pressable onPress={handleLogoutPress} style={styles.logoutBtn}>
          <Feather name="log-out" size={18} color="#FF465F" />
          <Text style={styles.logoutBtnText}>Logout Account</Text>
        </Pressable>

        <Text style={styles.appVersionText}>TCM Mobile App v2.4.0 • Built for Curious Minds</Text>

      {/* --- MODALS --- */}

      {/* 1. Edit Profile Modal */}
      <Modal visible={editProfileModalOpen} animationType="slide" transparent onRequestClose={() => setEditProfileModalOpen(false)}>
        <Pressable onPress={() => setEditProfileModalOpen(false)} style={styles.modalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalCard}>
            <View style={styles.sheetHandleBar} />
            <Text style={styles.modalTitle}>Edit Account Profile</Text>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={styles.avatarEditRow}>
                <ProfileAvatar name={form.name} uri={form.avatarUrl} size={76} />
                <Pressable onPress={pickImage} style={styles.changeAvatarBtn}>
                  <Feather name="camera" size={14} color="#5B3CF5" />
                  <Text style={styles.changeAvatarText}>Change Photo</Text>
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput value={form.name} onChangeText={(t) => setForm((p) => ({ ...p, name: t }))} style={styles.textInput} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username Handle</Text>
                <TextInput value={form.handle} onChangeText={(t) => setForm((p) => ({ ...p, handle: t }))} style={styles.textInput} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio / Tagline</Text>
                <TextInput value={form.bio} onChangeText={(t) => setForm((p) => ({ ...p, bio: t }))} multiline numberOfLines={3} style={[styles.textInput, { height: 75, textAlignVertical: "top" }]} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput value={form.location} onChangeText={(t) => setForm((p) => ({ ...p, location: t }))} style={styles.textInput} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Website / Portfolio</Text>
                <TextInput value={form.website} onChangeText={(t) => setForm((p) => ({ ...p, website: t }))} style={styles.textInput} />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setEditProfileModalOpen(false)} style={styles.cancelModalBtn}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveProfile} style={styles.saveModalBtn}>
                {updating ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveModalBtnText}>Save Changes</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 2. Change Password Modal */}
      <Modal visible={changePasswordModalOpen} animationType="slide" transparent onRequestClose={() => setChangePasswordModalOpen(false)}>
        <Pressable onPress={() => setChangePasswordModalOpen(false)} style={styles.modalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalCard}>
            <View style={styles.sheetHandleBar} />
            <Text style={styles.modalTitle}>Change Password</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput secureTextEntry value={passwordForm.currentPassword} onChangeText={(t) => setPasswordForm((p) => ({ ...p, currentPassword: t }))} style={styles.textInput} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput secureTextEntry value={passwordForm.newPassword} onChangeText={(t) => setPasswordForm((p) => ({ ...p, newPassword: t }))} style={styles.textInput} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput secureTextEntry value={passwordForm.confirmPassword} onChangeText={(t) => setPasswordForm((p) => ({ ...p, confirmPassword: t }))} style={styles.textInput} />
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setChangePasswordModalOpen(false)} style={styles.cancelModalBtn}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleChangePassword} style={styles.saveModalBtn}>
                <Text style={styles.saveModalBtnText}>Update Password</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 3. Language Selector Modal */}
      <Modal visible={languageModalOpen} animationType="slide" transparent onRequestClose={() => setLanguageModalOpen(false)}>
        <Pressable onPress={() => setLanguageModalOpen(false)} style={styles.modalBg}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalCard}>
            <View style={styles.sheetHandleBar} />
            <Text style={styles.modalTitle}>Select App Language</Text>

            {["English", "Hindi (हिंदी)", "Hinglish"].map((lang) => (
              <Pressable
                key={lang}
                onPress={() => {
                  setSelectedLanguage(lang.split(" ")[0]);
                  setLanguageModalOpen(false);
                }}
                style={styles.langOptionRow}
              >
                <Text style={styles.langOptionText}>{lang}</Text>
                {selectedLanguage === lang.split(" ")[0] && <Feather name="check" size={18} color="#5B3CF5" />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24
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
    marginBottom: 16,
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
    bottom: 0,
    right: 0,
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
    flex: 1
  },
  userNameText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725"
  },
  userHandleText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#5B3CF5",
    marginTop: 1
  },
  userEmailText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 2
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E1FF"
  },
  editProfileBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#5B3CF5"
  },

  // Section Cards
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  sectionHeader: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#8A879F",
    letterSpacing: 0.8,
    marginBottom: 10
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
    fontSize: 11,
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
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#5B3CF5"
  },
  activePlanBadge: {
    backgroundColor: "#ECF9E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  activePlanText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#2E7D32"
  },
  cacheSizeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#7C7C9A"
  },

  // Logout Button
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF0F2",
    borderWidth: 1,
    borderColor: "#FFE0E4",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 6,
    marginBottom: 16
  },
  logoutBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FF465F"
  },
  appVersionText: {
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#A4A3B8"
  },

  // Modal Styles
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(10, 9, 26, 0.55)",
    justifyContent: "flex-end"
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 26
  },
  sheetHandleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E0EE",
    alignSelf: "center",
    marginBottom: 14
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725",
    marginBottom: 16,
    textAlign: "center"
  },
  avatarEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16
  },
  changeAvatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E1FF"
  },
  changeAvatarText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#5B3CF5"
  },
  inputGroup: {
    marginBottom: 14
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#4A4A6A",
    marginBottom: 6
  },
  textInput: {
    backgroundColor: "#F8F7FF",
    borderWidth: 1,
    borderColor: "#EAE7FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#181725"
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: "#F4F3FA",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  cancelModalBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: "#4A4A6A"
  },
  saveModalBtn: {
    flex: 2,
    backgroundColor: "#5B3CF5",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    ...shadow.soft
  },
  saveModalBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: "#FFFFFF"
  },
  langOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F3FA"
  },
  langOptionText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: "#181725"
  }
});
