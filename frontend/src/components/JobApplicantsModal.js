import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

export default function JobApplicantsModal({ visible, job, onClose, onOpenDocReader, onUpdateApplicantStatus, onOpenUserProfile }) {
  const { theme } = useTheme();
  if (!job) return null;

  const applicants = job.applicants || [];
  const selectedCount = applicants.filter((a) => a.status === "selected").length;
  const requiredCount = Number(job.requiredCandidates || 1);
  const isFilled = job.status === "filled" || selectedCount >= requiredCount;

  async function handleToggleSelect(app) {
    if (!onUpdateApplicantStatus) return;
    const currentStatus = app.status || "pending";
    const nextStatus = currentStatus === "selected" ? "pending" : "selected";

    try {
      await onUpdateApplicantStatus(job.id, app.userId, nextStatus);
      if (nextStatus === "selected") {
        Alert.alert(
          "Candidate Selected 🎉",
          `${app.name} has been marked as SELECTED.\n\nCurrent Selections: ${selectedCount + 1} / ${requiredCount}`
        );
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update candidate status.");
    }
  }

  async function handleReject(app) {
    if (!onUpdateApplicantStatus) return;
    try {
      await onUpdateApplicantStatus(job.id, app.userId, "rejected");
      Alert.alert("Candidate Status", `${app.name} status updated to REJECTED.`);
    } catch (e) {
      Alert.alert("Error", "Failed to update candidate status.");
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {/* Sheet Handle */}
          <View style={styles.sheetHandleWrap}>
            <View style={[styles.sheetHandleBar, { backgroundColor: theme.isDark ? "#334155" : "#CBD5E1" }]} />
          </View>

          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="people" size={20} color={theme.primary} />
                <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>Applicants for {job.title}</Text>
              </View>
              <Text style={[styles.modalSub, { color: theme.subtext }]}>
                {applicants.length} Total Applicants • <Text style={{ fontFamily: fonts.bold, color: isFilled ? "#DC2626" : theme.primary }}>{selectedCount} / {requiredCount} Selected</Text>
              </Text>
            </View>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.isDark ? "#1E263B" : "#F8FAFC" }]}>
              <Feather name="x" size={20} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Selection Progress Tracker Banner */}
            <View style={[styles.trackerBanner, { backgroundColor: isFilled ? "#FEF2F2" : "#F0EDFF", borderColor: isFilled ? "#FCA5A5" : "#C4B5FD" }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: isFilled ? "#991B1B" : "#5B3CF5" }}>
                  {isFilled ? "🔴 HIRING COMPLETED (VACANCIES FULL)" : "🟢 SELECTION IN PROGRESS"}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: isFilled ? "#DC2626" : "#5B3CF5" }}>
                  {selectedCount} / {requiredCount} Candidates Selected
                </Text>
              </View>
              <Text style={{ fontSize: 10.5, color: "#475569", marginTop: 4 }}>
                {isFilled
                  ? "You have marked the required number of candidates as SELECTED. This job is automatically closed from active feeds."
                  : "Review resumes below and click 'Mark as Selected ✅' to fill your vacancies."}
              </Text>
            </View>

            {applicants.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="folder-open-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Applications Yet</Text>
                <Text style={styles.emptySub}>
                  When students apply for this role, their profiles and uploaded resumes will appear here for your evaluation.
                </Text>
              </View>
            ) : (
              applicants.map((app, idx) => {
                const appStatus = app.status || "pending";
                const isSelected = appStatus === "selected";
                const isRejected = appStatus === "rejected";

                return (
                  <View key={app.userId || idx} style={[styles.applicantCard, { backgroundColor: theme.cardBg, borderColor: theme.border }, isSelected && styles.selectedCard, isRejected && styles.rejectedCard]}>
                    {/* Student Top Info */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 160 }}>
                        {app.avatarUrl || app.avatar ? (
                          <Image source={{ uri: app.avatarUrl || app.avatar }} style={{ width: 38, height: 38, borderRadius: 19 }} />
                        ) : (
                          <View style={[styles.avatarCircle, isSelected && { backgroundColor: "#166534" }, isRejected && { backgroundColor: "#991B1B" }]}>
                            <Text style={styles.avatarInitials}>
                              {(app.name || "S").split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
                            </Text>
                          </View>
                        )}

                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: theme.text }}>{app.name || "Student Applicant"}</Text>
                          <Text style={{ fontSize: 11, color: theme.subtext }}>Applied: {app.appliedAt || "Recent"}</Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        {/* View Profile Action */}
                        <TouchableOpacity
                          onPress={() => {
                            onClose();
                            if (onOpenUserProfile) {
                              onOpenUserProfile({
                                id: app.userId || app.id || app.email,
                                name: app.name || "Student",
                                avatarUrl: app.avatarUrl || app.avatar || "",
                                role: app.role || "Student"
                              });
                            }
                          }}
                          style={{
                            backgroundColor: theme.badgeBg,
                            paddingHorizontal: 9,
                            paddingVertical: 5,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: theme.border
                          }}
                        >
                          <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: theme.primary }}>View Profile</Text>
                        </TouchableOpacity>

                        {/* Candidate Selection Status Badge */}
                        <View
                          style={[
                            styles.statusBadge,
                            isSelected && { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" },
                            isRejected && { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" },
                            !isSelected && !isRejected && { backgroundColor: theme.isDark ? "#1E263B" : "#FEF3C7", borderColor: theme.border }
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isSelected && { color: "#166534" },
                              isRejected && { color: "#991B1B" },
                              !isSelected && !isRejected && { color: theme.isDark ? "#F59E0B" : "#D97706" }
                            ]}
                          >
                            {isSelected ? "SELECTED ✅" : isRejected ? "REJECTED ❌" : "PENDING ⏳"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Contact Info */}
                    <View style={styles.contactGrid}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Feather name="mail" size={12} color={theme.subtext} />
                        <Text style={{ fontSize: 11.5, color: theme.text }}>{app.email || "student@tcm.edu"}</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Feather name="phone" size={12} color={theme.subtext} />
                        <Text style={{ fontSize: 11.5, color: theme.text }}>{app.phone || "+91 9876543210"}</Text>
                      </View>
                    </View>

                    {/* Portfolio Link */}
                    {app.portfolioUrl ? (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(app.portfolioUrl).catch(() => {})}
                        style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}
                      >
                        <Feather name="globe" size={12} color={theme.primary} />
                        <Text style={{ fontSize: 11.5, color: theme.primary, textDecorationLine: "underline" }} numberOfLines={1}>
                          {app.portfolioUrl}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {/* Cover Note */}
                    {app.coverNote ? (
                      <View style={{ backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC", padding: 8, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: theme.border }}>
                        <Text style={{ fontSize: 11.5, color: theme.subtext, fontStyle: "italic" }}>
                          "{app.coverNote}"
                        </Text>
                      </View>
                    ) : null}

                    {/* Resume PDF Box */}
                    <View style={[styles.resumeBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
                        <MaterialCommunityIcons name="file-pdf-box" size={24} color="#EF4444" style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.text }} numberOfLines={1}>
                            {app.resumeName || "Candidate_Resume.pdf"}
                          </Text>
                          <Text style={{ fontSize: 10, color: theme.subtext }}>{app.resumeSize || "1.4 MB"} • Candidate Resume</Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          const rUrl = app.resumeUrl || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view";
                          if (onOpenDocReader) {
                            onOpenDocReader(rUrl, app.resumeName || `${app.name}_Resume.pdf`);
                          } else {
                            Linking.openURL(rUrl).catch(() => Alert.alert("Resume Link", rUrl));
                          }
                        }}
                        style={[styles.viewResumeBtn, { backgroundColor: theme.primary }]}
                      >
                        <Feather name="book-open" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={{ color: "#FFFFFF", fontSize: 11.5, fontFamily: fonts.bold }}>View Resume</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Mentor Candidate Decision Action Bar */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        onPress={() => handleToggleSelect(app)}
                        activeOpacity={0.8}
                        style={[
                          styles.selectActionBtn,
                          isSelected && { backgroundColor: "#166534" }
                        ]}
                      >
                        <Ionicons name={isSelected ? "checkmark-circle" : "checkmark-outline"} size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.actionBtnText}>
                          {isSelected ? "Selected ✅ (Undo)" : "Mark as Selected ✅"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleReject(app)}
                        activeOpacity={0.8}
                        style={[
                          styles.rejectActionBtn,
                          isRejected && { backgroundColor: "#991B1B" }
                        ]}
                      >
                        <Ionicons name="close-circle-outline" size={14} color={isRejected ? "#FFFFFF" : "#DC2626"} style={{ marginRight: 4 }} />
                        <Text style={[styles.actionBtnText, { color: isRejected ? "#FFFFFF" : "#DC2626" }]}>
                          {isRejected ? "Rejected ❌" : "Reject"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30
  },
  trackerBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: "#334155",
    marginTop: 10
  },
  emptySub: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20
  },
  applicantCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12
  },
  selectedCard: {
    borderColor: "#86EFAC",
    backgroundColor: "#F0FDF4"
  },
  rejectedCard: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2"
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#5B3CF5",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarInitials: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold
  },
  contactGrid: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    flexWrap: "wrap"
  },
  resumeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    borderRadius: 10,
    marginTop: 10
  },
  viewResumeBtn: {
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center"
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9"
  },
  selectActionBtn: {
    flex: 1,
    backgroundColor: "#16A34A",
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  rejectActionBtn: {
    flex: 1,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  actionBtnText: {
    fontSize: 11.5,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  }
});
