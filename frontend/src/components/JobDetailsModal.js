import {
  Image,
  Modal,
  Platform,
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

function formatCleanDesc(rawText = "") {
  if (!rawText) return "";
  return rawText
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^[\*\-\+]\s+/gm, "• ")
    .trim();
}

export default function JobDetailsModal({ visible, job, isMentor, onClose, onApply, onOpenDocReader }) {
  if (!job) return null;

  const selectedCount = job.selectedCandidates || (job.applicants || []).filter((a) => a.status === "selected").length;
  const isFilled = job.status === "filled" || selectedCount >= Number(job.requiredCandidates || 1);
  const reqCount = job.requiredCandidates || 1;
  const fillPercent = Math.min(100, Math.round((selectedCount / reqCount) * 100));
  const isValidBanner = job.imageUrl && !(Platform.OS === "web" && typeof job.imageUrl === "string" && job.imageUrl.startsWith("file://"));

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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="briefcase" size={20} color="#5B3CF5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>{job.title}</Text>
                <Text style={styles.modalSub}>{job.company || "TCM Partner"}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Banner Image */}
            {isValidBanner ? (
              <Image source={{ uri: job.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
            ) : null}

            {/* Status & Salary Badges */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              <View style={[styles.statusBadge, { backgroundColor: isFilled ? "#FEE2E2" : "#DCFCE7", borderColor: isFilled ? "#FCA5A5" : "#86EFAC" }]}>
                <Text style={[styles.statusBadgeText, { color: isFilled ? "#991B1B" : "#166534" }]}>
                  {isFilled ? "🔴 HIRING CLOSED (FILLED)" : `🟢 ACTIVE HIRING (${selectedCount}/${reqCount} Selected)`}
                </Text>
              </View>

              <View style={styles.salaryBadge}>
                <FontAwesome5 name="money-bill-wave" size={12} color="#5B3CF5" style={{ marginRight: 5 }} />
                <Text style={styles.salaryBadgeText}>₹{job.minSalary} – ₹{job.maxSalary} {job.salaryPeriod || "LPA"}</Text>
              </View>
            </View>

            {/* AI Candidate Limit Progress Tracker */}
            <View style={styles.aiCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="hardware-chip-outline" size={16} color="#5B3CF5" />
                  <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: "#334155" }}>
                    AI Candidate Limit Tracker
                  </Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "700", color: isFilled ? "#DC2626" : "#5B3CF5" }}>
                  {selectedCount} / {reqCount} Candidates Selected ({fillPercent}%)
                </Text>
              </View>

              <View style={{ height: 7, width: "100%", backgroundColor: "#E2E8F0", borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
                <View
                  style={{
                    height: "100%",
                    width: `${fillPercent}%`,
                    backgroundColor: isFilled ? "#EF4444" : "#5B3CF5",
                    borderRadius: 4
                  }}
                />
              </View>
            </View>

            {/* Posted By Mentor */}
            <View style={styles.mentorRow}>
              <Image
                source={{ uri: job.mentorAvatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120" }}
                style={styles.mentorAvatar}
              />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: "#0F172A" }}>{job.mentorName || "Mentor"}</Text>
                  <View style={{ backgroundColor: "#FEF3C7", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                    <Text style={{ fontSize: 9.5, fontWeight: "700", color: "#D97706" }}>Mentor</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: "#64748B" }}>{job.mentorRole || "Senior Mentor"}</Text>
              </View>
            </View>

            {/* Job Description */}
            <Text style={styles.sectionHeader}>Job Description & Requirements</Text>
            <Text style={styles.descText}>{formatCleanDesc(job.description)}</Text>

            {/* Quick Meta Details */}
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Feather name="calendar" size={14} color="#64748B" />
                <Text style={styles.metaLabel}>Start Date: <Text style={styles.metaVal}>{job.startDate || "Immediate"}</Text></Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="clock" size={14} color="#64748B" />
                <Text style={styles.metaLabel}>Deadline: <Text style={styles.metaVal}>{job.deadline || "Open"}</Text></Text>
              </View>
            </View>

            {/* Attachment Document Reader Card */}
            {job.documentUrl ? (
              <View style={styles.docBox}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
                  <MaterialCommunityIcons name="file-pdf-box" size={26} color="#EF4444" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontFamily: fonts.bold, color: "#0F172A" }} numberOfLines={1}>
                      {job.documentName || "Official_Job_Description.pdf"}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#64748B" }}>{job.documentSize || "2.1 MB"} • Official JD Document</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => onOpenDocReader && onOpenDocReader(job.documentUrl, job.documentName)}
                  style={styles.readDocBtn}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: fonts.bold }}>Read JD PDF</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Action Button */}
            {!isMentor ? (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  if (onApply) onApply(job);
                }}
                disabled={isFilled}
                activeOpacity={0.85}
                style={[styles.applyBtn, isFilled && { backgroundColor: "#94A3B8" }]}
              >
                <Text style={styles.applyBtnText}>
                  {isFilled ? "Hiring Closed (Vacancies Full)" : "Apply for this Job →"}
                </Text>
              </TouchableOpacity>
            ) : null}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30
  },
  bannerImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 8
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700"
  },
  salaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  salaryBadgeText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },
  aiCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginTop: 12
  },
  mentorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginTop: 12
  },
  mentorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  sectionHeader: {
    fontSize: 13.5,
    fontFamily: fonts.bold,
    color: "#0F172A",
    marginTop: 16,
    marginBottom: 6
  },
  descText: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 20
  },
  metaGrid: {
    flexDirection: "row",
    gap: 16,
    marginTop: 14,
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 10
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  metaLabel: {
    fontSize: 12,
    color: "#475569"
  },
  metaVal: {
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  docBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    padding: 12,
    borderRadius: 12,
    marginTop: 14
  },
  readDocBtn: {
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8
  },
  applyBtn: {
    backgroundColor: "#5B3CF5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
    ...shadow.md
  },
  applyBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: fonts.bold
  }
});
