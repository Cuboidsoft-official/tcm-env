import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { updateProfile } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";

export default function EditMentorProfileModal({ visible, session, user = {}, onClose, onProfileUpdated }) {
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [yearsExperience, setYearsExperience] = useState(user.yearsExperience || "5+ Yrs Exp");
  
  // Subjects
  const [subjectsText, setSubjectsText] = useState(
    Array.isArray(user.subjects) ? user.subjects.join(", ") : "Full Stack Development, React Native, Node.js & MongoDB"
  );
  
  // Certifications
  const [certificationsText, setCertificationsText] = useState(
    Array.isArray(user.certifications) ? user.certifications.join(", ") : "Certified Technical Instructor, Full Stack Systems Architect"
  );

  // Interests
  const [interestsText, setInterestsText] = useState(
    Array.isArray(user.interests) ? user.interests.join(", ") : "System Architecture, AI & Machine Learning, Student Mentorship"
  );

  // Experiences List
  const [experiences, setExperiences] = useState(
    user.experiences?.length
      ? user.experiences
      : [
          { id: "exp1", role: "Senior Software Engineer & Mentor", company: "TCM Academy", durationPill: "3+ Years" }
        ]
  );

  const [saving, setSaving] = useState(false);

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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Edit Mentor Profile</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color="#181725" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* 1. Basic Info */}
            <Text style={styles.sectionHeading}>Basic Information</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput value={name} onChangeText={setName} style={styles.textInput} />

            <Text style={styles.inputLabel}>Bio / Introduction</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              placeholder="Tell students about your expertise and teaching philosophy..."
              placeholderTextColor="#A0A0B8"
              style={[styles.textInput, { height: 75, textAlignVertical: "top" }]}
            />

            <Text style={styles.inputLabel}>Years of Experience</Text>
            <TextInput
              value={yearsExperience}
              onChangeText={setYearsExperience}
              placeholder="e.g. 6+ Yrs Exp"
              placeholderTextColor="#A0A0B8"
              style={styles.textInput}
            />

            {/* 2. Subjects They Want to Teach */}
            <Text style={styles.sectionHeading}>Subjects You Want to Teach</Text>
            <Text style={styles.inputSubLabel}>Separate subjects with commas (e.g. MERN Stack, NEET Physics, Python AI)</Text>
            <TextInput
              value={subjectsText}
              onChangeText={setSubjectsText}
              multiline
              placeholder="MERN Stack, Python AI, React Native, NEET Physics"
              placeholderTextColor="#A0A0B8"
              style={[styles.textInput, { height: 60, textAlignVertical: "top" }]}
            />

            {/* 3. Experiences & Industry History */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Work Experiences</Text>
              <Pressable onPress={handleAddExperience} style={styles.addSmallBtn}>
                <Feather name="plus" size={13} color="#5B3CF5" style={{ marginRight: 4 }} />
                <Text style={styles.addSmallBtnText}>Add Experience</Text>
              </Pressable>
            </View>

            {experiences.map((exp, idx) => (
              <View key={exp.id || idx} style={styles.expBox}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={styles.expIndexText}>Experience #{idx + 1}</Text>
                  <Pressable onPress={() => handleDeleteExp(idx)}>
                    <Feather name="trash-2" size={15} color="#D32F2F" />
                  </Pressable>
                </View>

                <TextInput
                  value={exp.role}
                  onChangeText={(val) => handleUpdateExp(idx, "role", val)}
                  placeholder="Role (e.g. Senior Software Engineer)"
                  placeholderTextColor="#A0A0B8"
                  style={[styles.textInput, { marginBottom: 6 }]}
                />

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    value={exp.company}
                    onChangeText={(val) => handleUpdateExp(idx, "company", val)}
                    placeholder="Company (e.g. Google)"
                    placeholderTextColor="#A0A0B8"
                    style={[styles.textInput, { flex: 1 }]}
                  />
                  <TextInput
                    value={exp.durationPill}
                    onChangeText={(val) => handleUpdateExp(idx, "durationPill", val)}
                    placeholder="Duration (e.g. 3+ Yrs)"
                    placeholderTextColor="#A0A0B8"
                    style={[styles.textInput, { width: 110 }]}
                  />
                </View>
              </View>
            ))}

            {/* 4. Certifications & Achievements */}
            <Text style={styles.sectionHeading}>Certifications & Achievements</Text>
            <Text style={styles.inputSubLabel}>Separate certifications with commas</Text>
            <TextInput
              value={certificationsText}
              onChangeText={setCertificationsText}
              multiline
              placeholder="Certified Technical Instructor, AWS Solutions Architect"
              placeholderTextColor="#A0A0B8"
              style={[styles.textInput, { height: 55, textAlignVertical: "top" }]}
            />

            {/* 5. Specialization Interests */}
            <Text style={styles.sectionHeading}>Interests & Specializations</Text>
            <Text style={styles.inputSubLabel}>Separate interest tags with commas</Text>
            <TextInput
              value={interestsText}
              onChangeText={setInterestsText}
              multiline
              placeholder="System Architecture, LLMs, Student Mentorship"
              placeholderTextColor="#A0A0B8"
              style={[styles.textInput, { height: 55, textAlignVertical: "top" }]}
            />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <Pressable onPress={handleSave} disabled={saving} style={styles.saveBtn}>
              {saving ? <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 6 }} /> : null}
              <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Profile"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    padding: 16
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EFFF",
    marginBottom: 8
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: "#181725"
  },
  closeBtn: {
    padding: 4
  },
  scrollContent: {
    paddingBottom: 20
  },
  sectionHeading: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#181725",
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
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  addSmallBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#5B3CF5"
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#55556A",
    marginTop: 8,
    marginBottom: 4
  },
  inputSubLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    marginBottom: 6
  },
  textInput: {
    backgroundColor: "#F8F7FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: "#181725",
    borderWidth: 1,
    borderColor: "#EBEAFA"
  },
  expBox: {
    backgroundColor: "#F9F8FF",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EBEAFA"
  },
  expIndexText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#5B3CF5"
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0EFFF"
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#F4F3FA",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center"
  },
  cancelBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#55556A"
  },
  saveBtn: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: "#5B3CF5",
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
