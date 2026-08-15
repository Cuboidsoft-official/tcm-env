import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { updateProfile } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

export default function EditMentorProfileModal({ visible, session, user = {}, onClose, onProfileUpdated }) {
  const { theme } = useTheme();
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [yearsExperience, setYearsExperience] = useState(user.yearsExperience || "5+ Yrs Exp");

  const [subjectsText, setSubjectsText] = useState(
    Array.isArray(user.subjects) ? user.subjects.join(", ") : typeof user.subjects === "string" ? user.subjects : "Full Stack Development, React Native, Node.js & MongoDB"
  );

  const [certificationsText, setCertificationsText] = useState(
    Array.isArray(user.certifications) ? user.certifications.join(", ") : typeof user.certifications === "string" ? user.certifications : "Certified Technical Instructor, Full Stack Systems Architect"
  );

  const [interestsText, setInterestsText] = useState(
    Array.isArray(user.interests) ? user.interests.join(", ") : typeof user.interests === "string" ? user.interests : "System Architecture, AI & Machine Learning, Student Mentorship"
  );

  const [experiences, setExperiences] = useState(
    user.experiences?.length
      ? user.experiences
      : [
          { id: "exp1", role: "Senior Software Engineer & Mentor", company: "TCM Academy", durationPill: "3+ Years" }
        ]
  );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setYearsExperience(user.yearsExperience || "5+ Yrs Exp");
      setSubjectsText(
        Array.isArray(user.subjects)
          ? user.subjects.join(", ")
          : typeof user.subjects === "string"
          ? user.subjects
          : "Full Stack Development, React Native, Node.js & MongoDB"
      );
      setCertificationsText(
        Array.isArray(user.certifications)
          ? user.certifications.join(", ")
          : typeof user.certifications === "string"
          ? user.certifications
          : "Certified Technical Instructor, Full Stack Systems Architect"
      );
      setInterestsText(
        Array.isArray(user.interests)
          ? user.interests.join(", ")
          : typeof user.interests === "string"
          ? user.interests
          : "System Architecture, AI & Machine Learning, Student Mentorship"
      );
      setExperiences(
        user.experiences?.length
          ? user.experiences
          : [{ id: "exp1", role: "Senior Software Engineer & Mentor", company: "TCM Academy", durationPill: "3+ Years" }]
      );
    }
  }, [visible, user]);

  function handleAddExperience() {
    const newExp = {
      id: `exp_${Date.now()}`,
      role: "Software Developer & Mentor",
      company: "Tech Company",
      durationPill: "2+ Years"
    };
    setExperiences((prev) => [...prev, newExp]);
  }

  function handleUpdateExp(index, field, value) {
    setExperiences((prev) =>
      prev.map((exp, idx) => (idx === index ? { ...exp, [field]: value } : exp))
    );
  }

  function handleDeleteExp(index) {
    setExperiences((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your name.");
      return;
    }

    setSaving(true);
    try {
      const parsedSubjects = subjectsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const parsedCerts = certificationsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const parsedInterests = interestsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: name.trim(),
        bio: bio.trim(),
        yearsExperience: yearsExperience.trim(),
        subjects: parsedSubjects,
        certifications: parsedCerts,
        interests: parsedInterests,
        experiences
      };

      if (session?.token) {
        await updateProfile(session.token, payload);
      }

      Alert.alert("Profile Updated", "Your mentor profile has been saved successfully!");
      if (onProfileUpdated) onProfileUpdated(payload);
      onClose();
    } catch (err) {
      Alert.alert("Update Error", err.message || "Failed to update mentor profile.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = [
    styles.textInput,
    {
      backgroundColor: theme.inputBg || (theme.isDark ? "#1E293B" : "#F8F7FF"),
      color: theme.text,
      borderColor: theme.border
    }
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg || (theme.isDark ? "#0F172A" : "#FFFFFF"), borderColor: theme.border }]}>
            <View style={[styles.sheetHandleBar, { backgroundColor: theme.border }]} />

            {/* Header */}
            <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Mentor Profile</Text>
              <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC" }]}>
                <Feather name="x" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* 1. Basic Info */}
              <Text style={[styles.sectionHeading, { color: theme.text }]}>Basic Information</Text>

              <Text style={[styles.inputLabel, { color: theme.subtext }]}>Full Name</Text>
              <TextInput value={name} onChangeText={setName} style={inputStyle} placeholderTextColor={theme.subtext} />

              <Text style={[styles.inputLabel, { color: theme.subtext }]}>Bio / Introduction</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                placeholder="Tell students about your expertise and teaching philosophy..."
                placeholderTextColor={theme.subtext}
                style={[inputStyle, { height: 75, textAlignVertical: "top" }]}
              />

              <Text style={[styles.inputLabel, { color: theme.subtext }]}>Years of Experience</Text>
              <TextInput
                value={yearsExperience}
                onChangeText={setYearsExperience}
                placeholder="e.g. 6+ Yrs Exp"
                placeholderTextColor={theme.subtext}
                style={inputStyle}
              />

              {/* 2. Subjects They Want to Teach */}
              <Text style={[styles.sectionHeading, { color: theme.text }]}>Subjects You Want to Teach</Text>
              <Text style={[styles.inputSubLabel, { color: theme.subtext }]}>Separate subjects with commas (e.g. MERN Stack, NEET Physics, Python AI)</Text>
              <TextInput
                value={subjectsText}
                onChangeText={setSubjectsText}
                multiline
                placeholder="MERN Stack, Python AI, React Native, NEET Physics"
                placeholderTextColor={theme.subtext}
                style={[inputStyle, { height: 60, textAlignVertical: "top" }]}
              />

              {/* 3. Experiences & Industry History */}
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeading, { color: theme.text }]}>Work Experiences</Text>
                <TouchableOpacity onPress={handleAddExperience} style={[styles.addSmallBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#E8F5E9" }]}>
                  <Feather name="plus" size={13} color={theme.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.addSmallBtnText, { color: theme.primary }]}>Add</Text>
                </TouchableOpacity>
              </View>

              {experiences.map((exp, idx) => (
                <View key={exp.id || idx} style={[styles.expBox, { backgroundColor: theme.isDark ? "#1E293B" : "#F9F8FF", borderColor: theme.border }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={[styles.expIndexText, { color: theme.primary }]}>Experience #{idx + 1}</Text>
                    <Pressable onPress={() => handleDeleteExp(idx)}>
                      <Feather name="trash-2" size={15} color="#EF4444" />
                    </Pressable>
                  </View>

                  <TextInput
                    value={exp.role}
                    onChangeText={(val) => handleUpdateExp(idx, "role", val)}
                    placeholder="Role (e.g. Senior Software Engineer)"
                    placeholderTextColor={theme.subtext}
                    style={[inputStyle, { marginBottom: 6 }]}
                  />

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput
                      value={exp.company}
                      onChangeText={(val) => handleUpdateExp(idx, "company", val)}
                      placeholder="Company (e.g. Google)"
                      placeholderTextColor={theme.subtext}
                      style={[inputStyle, { flex: 1 }]}
                    />
                    <TextInput
                      value={exp.durationPill}
                      onChangeText={(val) => handleUpdateExp(idx, "durationPill", val)}
                      placeholder="Duration (e.g. 3+ Yrs)"
                      placeholderTextColor={theme.subtext}
                      style={[inputStyle, { width: 110 }]}
                    />
                  </View>
                </View>
              ))}

              {/* 4. Certifications & Achievements */}
              <Text style={[styles.sectionHeading, { color: theme.text }]}>Certifications & Achievements</Text>
              <Text style={[styles.inputSubLabel, { color: theme.subtext }]}>Separate certifications with commas</Text>
              <TextInput
                value={certificationsText}
                onChangeText={setCertificationsText}
                multiline
                placeholder="Certified Technical Instructor, AWS Solutions Architect"
                placeholderTextColor={theme.subtext}
                style={[inputStyle, { height: 55, textAlignVertical: "top" }]}
              />

              {/* 5. Specialization Interests */}
              <Text style={[styles.sectionHeading, { color: theme.text }]}>Interests & Specializations</Text>
              <Text style={[styles.inputSubLabel, { color: theme.subtext }]}>Separate interest tags with commas</Text>
              <TextInput
                value={interestsText}
                onChangeText={setInterestsText}
                multiline
                placeholder="System Architecture, LLMs, Student Mentorship"
                placeholderTextColor={theme.subtext}
                style={[inputStyle, { height: 55, textAlignVertical: "top" }]}
              />
            </ScrollView>

            {/* Footer Actions */}
            <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
              <Pressable onPress={onClose} style={[styles.cancelBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#F4F3FA" }]}>
                <Text style={[styles.cancelBtnText, { color: theme.subtext }]}>Cancel</Text>
              </Pressable>

              <Pressable onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
                {saving ? <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 6 }} /> : null}
                <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Profile"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end"
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    padding: 16,
    borderWidth: 1
  },
  sheetHandleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 10
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 8
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 17
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10
  },
  scrollContent: {
    paddingBottom: 20
  },
  sectionHeading: {
    fontFamily: fonts.bold,
    fontSize: 14,
    marginTop: 12,
    marginBottom: 4
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 4
  },
  addSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  addSmallBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 8,
    marginBottom: 4
  },
  inputSubLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    marginBottom: 6
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    borderWidth: 1
  },
  expBox: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1
  },
  expIndexText: {
    fontFamily: fonts.bold,
    fontSize: 11
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center"
  },
  cancelBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13
  },
  saveBtn: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  saveBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#FFFFFF"
  }
});
