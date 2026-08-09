import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import * as ImagePicker from "expo-image-picker";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";

export default function CreateJobModal({ visible, user = {}, jobToEdit = null, onClose, onSubmitJob }) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState(user.company || "TCM Hiring Partner");
  const [description, setDescription] = useState("");
  const [minSalary, setMinSalary] = useState("3,50,000");
  const [maxSalary, setMaxSalary] = useState("6,50,000");
  const [salaryPeriod, setSalaryPeriod] = useState("LPA"); // "LPA" | "/ month" | "Fixed"
  const [requiredCandidates, setRequiredCandidates] = useState("3");
  const [startDate, setStartDate] = useState("Immediate");
  const [deadline, setDeadline] = useState("30 Days");
  const [imageUrl, setImageUrl] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      const targetJob = jobToEdit?.jobData || jobToEdit;
      if (targetJob) {
        setTitle(targetJob.title || targetJob.text?.split("\n")[0] || "");
        setCompany(targetJob.company || user.company || "TCM Hiring Partner");
        setDescription(targetJob.description || targetJob.text || "");
        setMinSalary(targetJob.minSalary !== undefined ? String(targetJob.minSalary) : "");
        setMaxSalary(targetJob.maxSalary !== undefined ? String(targetJob.maxSalary) : "");
        setSalaryPeriod(targetJob.salaryPeriod || "LPA");
        setRequiredCandidates(targetJob.requiredCandidates ? String(targetJob.requiredCandidates) : "3");
        setStartDate(targetJob.startDate || "Immediate");
        setDeadline(targetJob.deadline || "Open until filled");
        setImageUrl(targetJob.imageUrl || targetJob.media?.imageUrl || "");
        setDocumentUrl(targetJob.documentUrl || "");
        setDocumentName(targetJob.documentName || "");
      } else {
        setTitle("");
        setCompany(user.company || "TCM Hiring Partner");
        setDescription("");
        setMinSalary("3,50,000");
        setMaxSalary("6,50,000");
        setSalaryPeriod("LPA");
        setRequiredCandidates("3");
        setStartDate("Immediate");
        setDeadline("30 Days");
        setImageUrl("");
        setDocumentUrl("");
        setDocumentName("");
      }
    }
  }, [visible, jobToEdit]);

  async function handlePickImage() {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to photos to select a job banner image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        let uri = asset.uri;
        if (asset.base64) {
          uri = `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`;
        } else if (Platform.OS === "web" && uri.startsWith("file://")) {
          uri = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600";
        }
        setImageUrl(uri);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to pick image.");
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Required Field", "Please enter the Job Title.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Required Field", "Please enter a detailed Job Description.");
      return;
    }
    const reqCount = parseInt(requiredCandidates, 10);
    if (isNaN(reqCount) || reqCount <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid number of required candidates (min 1).");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        company: company.trim() || "TCM Hiring Partner",
        mentorName: user.name || "Mentor",
        mentorAvatarUrl: user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        mentorRole: user.role || "Senior Mentor",
        description: description.trim(),
        minSalary: minSalary.trim(),
        maxSalary: maxSalary.trim(),
        salaryPeriod,
        requiredCandidates: reqCount,
        startDate: startDate.trim() || "Immediate",
        deadline: deadline.trim() || "Open until filled",
        imageUrl: imageUrl.trim() || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600",
        documentUrl: documentUrl.trim(),
        documentName: documentName.trim() || (documentUrl.trim() ? "Job_Description.pdf" : ""),
        documentSize: "2.1 MB"
      };

      if (onSubmitJob) {
        await onSubmitJob(payload, jobToEdit?.id);
      }

      onClose();
      Alert.alert(jobToEdit ? "Job Updated!" : "Job Posted!", jobToEdit ? "Your job changes have been saved." : "Your job posting is live in the Job Feed. AI candidate tracking is active.");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to post job.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Sheet Handle */}
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandleBar} />
          </View>

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="briefcase" size={20} color="#5B3CF5" />
              </View>
              <View>
                <Text style={styles.modalTitle}>{jobToEdit ? "Edit Job Posting ✏️" : "Post a Job / Hiring Drive"}</Text>
                <Text style={styles.modalSub}>{jobToEdit ? "Update job opening details & requirements" : "Create a vacancy with automatic AI candidate limit tracking"}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
            {/* 1. Job Title & Company */}
            <Text style={styles.label}>Job Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Junior React Native Developer"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Company / Organization Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. TCM Tech Studio"
              placeholderTextColor="#94A3B8"
              value={company}
              onChangeText={setCompany}
            />

            {/* 2. Job Description */}
            <Text style={styles.label}>Job Description & Requirements *</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: "top" }]}
              placeholder="Describe roles, responsibilities, required skills, tools, and eligibility..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />

            {/* 3. Salary Range */}
            <Text style={styles.label}>Salary / Compensation Range</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>Min Salary (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3,50,000"
                  placeholderTextColor="#94A3B8"
                  value={minSalary}
                  onChangeText={setMinSalary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>Max Salary (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6,50,000"
                  placeholderTextColor="#94A3B8"
                  value={maxSalary}
                  onChangeText={setMaxSalary}
                />
              </View>
            </View>

            {/* Salary Period Select */}
            <Text style={styles.subLabel}>Salary Type</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {["LPA", "/ month", "Stipend / Fixed"].map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setSalaryPeriod(p)}
                  style={[
                    styles.periodPill,
                    salaryPeriod === p && styles.periodPillActive
                  ]}
                >
                  <Text style={[styles.periodPillText, salaryPeriod === p && styles.periodPillTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 4. Vacancies & AI Tracking Limit */}
            <View style={styles.aiCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="hardware-chip-outline" size={18} color="#5B3CF5" />
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: "#5B3CF5" }}>
                  AI Candidate Tracker Settings
                </Text>
              </View>
              <Text style={{ fontSize: 11.5, color: "#475569", marginTop: 3 }}>
                When candidate applications reach this number, AI automatically marks the job as EXPIRED / FILLED and closes applications.
              </Text>

              <Text style={[styles.label, { marginTop: 10 }]}>Required Candidates (Vacancies Count) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: "#FFFFFF" }]}
                placeholder="e.g. 5"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={requiredCandidates}
                onChangeText={setRequiredCandidates}
              />
            </View>

            {/* 5. Start Date & Deadline */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Immediate / 1st Sept"
                  placeholderTextColor="#94A3B8"
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>Application Deadline</Text>
                <TextInput
                  style={styles.input}
                  placeholder="30 Days"
                  placeholderTextColor="#94A3B8"
                  value={deadline}
                  onChangeText={setDeadline}
                />
              </View>
            </View>

            {/* 6. Image Banner Upload */}
            <Text style={styles.label}>Job Cover Banner Image</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12, alignItems: "center" }}>
              <TouchableOpacity onPress={handlePickImage} style={styles.uploadBtn}>
                <Feather name="image" size={16} color="#5B3CF5" />
                <Text style={styles.uploadBtnText}>Upload Image</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: "#64748B" }}>or enter Image URL</Text>
            </View>
            {imageUrl ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
                <TouchableOpacity onPress={() => setImageUrl("")} style={styles.removeImgBtn}>
                  <Feather name="trash-2" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="https://images.unsplash.com/photo-..."
                placeholderTextColor="#94A3B8"
                value={imageUrl}
                onChangeText={setImageUrl}
              />
            )}

            {/* 7. Attachment Upload */}
            <Text style={styles.label}>Attachment (PDF / Document Link)</Text>
            <TextInput
              style={styles.input}
              placeholder="Document URL e.g. https://drive.google.com/file/d/..."
              placeholderTextColor="#94A3B8"
              value={documentUrl}
              onChangeText={setDocumentUrl}
            />
            {documentUrl ? (
              <TextInput
                style={[styles.input, { marginTop: -6 }]}
                placeholder="Document Display Name (e.g. Official_JD.pdf)"
                placeholderTextColor="#94A3B8"
                value={documentName}
                onChangeText={setDocumentName}
              />
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>Publish Job Posting</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
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
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center"
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  modalSub: {
    fontSize: 11,
    color: "#64748B"
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
  periodPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC"
  },
  periodPillActive: {
    borderColor: "#5B3CF5",
    backgroundColor: "#5B3CF5"
  },
  periodPillText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600"
  },
  periodPillTextActive: {
    color: "#FFFFFF"
  },
  aiCard: {
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C4B5FD"
  },
  uploadBtnText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },
  imagePreviewWrap: {
    position: "relative",
    marginBottom: 14
  },
  imagePreview: {
    width: "100%",
    height: 140,
    borderRadius: 10
  },
  removeImgBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(225, 29, 72, 0.85)",
    padding: 6,
    borderRadius: 15
  },
  submitBtn: {
    backgroundColor: "#5B3CF5",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    ...shadow.md
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: fonts.bold
  }
});
