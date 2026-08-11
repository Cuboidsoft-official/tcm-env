import { useState } from "react";
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
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

export default function ApplyJobModal({ visible, job, user = {}, onClose, onSubmitApplication }) {
  const { theme } = useTheme();
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "student@tcm.edu");
  const [phone, setPhone] = useState(user.phone || "+91 9876543210");
  const [portfolioUrl, setPortfolioUrl] = useState(user.github || "");
  const [resumeUrl, setResumeUrl] = useState("https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view");
  const [resumeName, setResumeName] = useState("My_Updated_Resume.pdf");
  const [resumeSize, setResumeSize] = useState("1.4 MB");
  const [coverNote, setCoverNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handlePickResume() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets?.[0]) {
        const file = result.assets[0];
        setResumeUrl(file.uri);
        setResumeName(file.name || "Resume_Uploaded.pdf");
        setResumeSize(file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : "1.5 MB");
        Alert.alert("Resume Selected", `Attached: ${file.name}`);
      }
    } catch (e) {
      Alert.alert("File Notice", "You can also enter a direct PDF Google Drive/Dropbox resume URL below.");
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Required Field", "Please enter your Full Name.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Required Field", "Please enter your Email Address.");
      return;
    }
    if (!resumeUrl.trim()) {
      Alert.alert("Required Field", "Please upload or provide your Resume file/link.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        userId: user.id || user._id || `u-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || "+91 9876543210",
        portfolioUrl: portfolioUrl.trim(),
        resumeUrl: resumeUrl.trim(),
        resumeName: resumeName.trim() || "Student_Resume.pdf",
        resumeSize: resumeSize || "1.2 MB",
        coverNote: coverNote.trim()
      };

      if (onSubmitApplication) {
        await onSubmitApplication(payload);
      }
      onClose();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!job) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
          {/* Sheet Handle */}
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandleBar} />
          </View>

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="briefcase" size={18} color={theme.primary} />
                <Text style={styles.modalTitle} numberOfLines={1}>Apply for {job.title}</Text>
              </View>
              <Text style={styles.modalSub}>{job.company || "TCM Partner"} • Salary: ₹{job.minSalary} – ₹{job.maxSalary} {job.salaryPeriod}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
            {/* 1. Full Name & Email */}
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ankit Sharma"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ankit@gmail.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+91 9876543210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* 2. Portfolio / Github Link */}
            <Text style={styles.label}>Portfolio / LinkedIn / GitHub Link</Text>
            <TextInput
              style={styles.input}
              placeholder="https://github.com/your-username"
              placeholderTextColor="#94A3B8"
              value={portfolioUrl}
              onChangeText={setPortfolioUrl}
            />

            {/* 3. Resume Upload (Mandatory for Mentor View) */}
            <View style={styles.resumeBox}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <MaterialCommunityIcons name="file-pdf-box" size={22} color="#EF4444" />
                  <Text style={{ fontSize: 13, fontFamily: fonts.bold, color: "#0F172A" }}>
                    Attach Resume (PDF / Doc) *
                  </Text>
                </View>

                <TouchableOpacity onPress={handlePickResume} style={styles.pickFileBtn}>
                  <Feather name="upload" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={{ color: "#FFFFFF", fontSize: 11, fontFamily: fonts.bold }}>Upload File</Text>
                </TouchableOpacity>
              </View>

              {resumeName ? (
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0" }}>
                  <Feather name="check-circle" size={15} color="#166534" style={{ marginRight: 6 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: "#0F172A" }} numberOfLines={1}>
                      {resumeName}
                    </Text>
                    <Text style={{ fontSize: 10, color: "#64748B" }}>{resumeSize} • Ready for Mentor</Text>
                  </View>
                </View>
              ) : null}

              <Text style={{ fontSize: 10.5, color: "#64748B", marginTop: 8 }}>or enter direct Resume Link below:</Text>
              <TextInput
                style={[styles.input, { backgroundColor: "#FFFFFF", marginTop: 4, marginBottom: 0 }]}
                placeholder="https://drive.google.com/file/d/..."
                placeholderTextColor="#94A3B8"
                value={resumeUrl}
                onChangeText={setResumeUrl}
              />
            </View>

            {/* 4. Note for Mentor */}
            <Text style={styles.label}>Message / Note for Mentor</Text>
            <TextInput
              style={[styles.input, { height: 75, textAlignVertical: "top" }]}
              placeholder="Briefly explain your experience, key skills, and why you are a great fit..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={coverNote}
              onChangeText={setCoverNote}
            />

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>Submit Application to Mentor</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    paddingBottom: 24,
    ...shadow.lg
  },
  sheetHandleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4
  },
  sheetHandleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#CBD5E1"
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  modalSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center"
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30
  },
  label: {
    fontSize: 12.5,
    fontFamily: fonts.bold,
    color: "#334155",
    marginBottom: 6
  },
  subLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0F172A",
    marginBottom: 14
  },
  resumeBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14
  },
  pickFileBtn: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center"
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    ...shadow.md
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: fonts.bold
  }
});
