import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

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
  const { theme } = useTheme();
  if (!job) return null;

  const selectedCount = job.selectedCandidates || (job.applicants || []).filter((a) => a.status === "selected").length;
  const isFilled = job.status === "filled" || selectedCount >= Number(job.requiredCandidates || 1);
  const reqCount = job.requiredCandidates || 1;
  const fillPercent = Math.min(100, Math.round((selectedCount / reqCount) * 100));
  const isValidBanner = job.imageUrl && !(Platform.OS === "web" && typeof job.imageUrl === "string" && job.imageUrl.startsWith("file://"));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: theme.isDark ? "rgba(0, 0, 0, 0.75)" : "rgba(15, 23, 42, 0.55)" }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {/* Sheet Handle */}
          <View style={styles.sheetHandleWrap}>
            <View style={[styles.sheetHandleBar, { backgroundColor: theme.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <View style={[styles.iconCircle, { backgroundColor: theme.badgeBg }]}>
                <Ionicons name="briefcase" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>{job.title}</Text>
                <Text style={[styles.modalSub, { color: theme.subtext }]}>{job.company || "Last Class Partner"}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <TouchableOpacity
                onPress={() => {
                  const shareUrl = `https://app.thecodemunk.in/job/${job.id || job._id || "job"}`;
                  Share.share({
                    title: job.title,
                    message: `Check out this Job Opportunity on TCM: "${job.title}" at ${job.company || "Last Class Partner"}\n\nApply via TCM: ${shareUrl}`
                  }).catch(() => {});
                }}
                style={[styles.closeBtn, { backgroundColor: theme.isDark ? "#1E263B" : theme.badgeBg }]}
              >
                <Feather name="share-2" size={17} color={theme.primary} />
              </TouchableOpacity>

              <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.isDark ? "#1E263B" : theme.badgeBg }]}>
                <Feather name="x" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Banner Image */}
            {isValidBanner ? (
              <Image source={{ uri: job.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
            ) : null}

            {/* Status & Salary Badges */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              <View style={[styles.statusBadge, { backgroundColor: isFilled ? (theme.isDark ? "#451A1A" : "#FEE2E2") : (theme.isDark ? "#064E3B" : "#DCFCE7"), borderColor: isFilled ? "#EF4444" : "#10B981" }]}>
                <Text style={[styles.statusBadgeText, { color: isFilled ? (theme.isDark ? "#FCA5A5" : "#991B1B") : (theme.isDark ? "#6EE7B7" : "#166534") }]}>
                  {isFilled ? "HIRING CLOSED (FILLED)" : `ACTIVE HIRING (${selectedCount}/${reqCount} Selected)`}
                </Text>
              </View>

              <View style={[styles.salaryBadge, { backgroundColor: theme.badgeBg }]}>
                <FontAwesome5 name="money-bill-wave" size={12} color={theme.primary} style={{ marginRight: 5 }} />
                <Text style={[styles.salaryBadgeText, { color: theme.primary }]}>₹{job.minSalary} – ₹{job.maxSalary} {job.salaryPeriod || "LPA"}</Text>
              </View>
            </View>

            {/* AI Candidate Limit Progress Tracker */}
            <View style={[styles.aiCard, { backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC", borderColor: theme.border }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="hardware-chip-outline" size={16} color={theme.primary} />
                  <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.text }}>
                    AI Candidate Limit Tracker
                  </Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "700", color: isFilled ? "#EF4444" : theme.primary }}>
                  {selectedCount} / {reqCount} Candidates Selected ({fillPercent}%)
                </Text>
              </View>

              <View style={{ height: 7, width: "100%", backgroundColor: theme.isDark ? "#334155" : "#E2E8F0", borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
                <View
                  style={{
                    height: "100%",
                    width: `${fillPercent}%`,
                    backgroundColor: isFilled ? "#EF4444" : theme.primary,
                    borderRadius: 4
                  }}
                />
              </View>
            </View>

            {/* Posted By Mentor */}
            <View style={[styles.mentorRow, { backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC", borderColor: theme.border }]}>
              <Image
                source={{ uri: job.mentorAvatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120" }}
                style={styles.mentorAvatar}
              />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: theme.text }}>{job.mentorName || "Mentor"}</Text>
                  <View style={{ backgroundColor: theme.isDark ? "#1E1B4B" : "#FEF3C7", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                    <Text style={{ fontSize: 9.5, fontWeight: "700", color: theme.isDark ? "#A78BFA" : "#D97706" }}>Mentor</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: theme.subtext }}>{job.mentorRole || "Senior Mentor"}</Text>
              </View>
            </View>

            {/* Job Description */}
            <Text style={[styles.sectionHeader, { color: theme.text }]}>Job Description & Requirements</Text>
            <Text style={[styles.descText, { color: theme.isDark ? "#CBD5E1" : "#334155" }]}>{formatCleanDesc(job.description)}</Text>

            {/* Quick Meta Details */}
            <View style={[styles.metaGrid, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9", borderColor: theme.border }]}>
              <View style={styles.metaItem}>
                <Feather name="calendar" size={14} color={theme.subtext} />
                <Text style={[styles.metaLabel, { color: theme.subtext }]}>Start Date: <Text style={[styles.metaVal, { color: theme.text }]}>{job.startDate || "Immediate"}</Text></Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="clock" size={14} color={theme.subtext} />
                <Text style={[styles.metaLabel, { color: theme.subtext }]}>Deadline: <Text style={[styles.metaVal, { color: theme.text }]}>{job.deadline || "Open"}</Text></Text>
              </View>
            </View>

            {/* Attachment Document Reader Card */}
            {job.documentUrl ? (
              <View style={[styles.docBox, { backgroundColor: theme.isDark ? "#2D1B28" : "#FEF2F2", borderColor: theme.isDark ? "#831843" : "#FCA5A5" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
                  <MaterialCommunityIcons name="file-pdf-box" size={26} color="#EF4444" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontFamily: fonts.bold, color: theme.text }} numberOfLines={1}>
                      {job.documentName || "Official_Job_Description.pdf"}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.subtext }}>{job.documentSize || "2.1 MB"} • Official JD Document</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => onOpenDocReader && onOpenDocReader(job.documentUrl, job.documentName)}
                  style={[styles.readDocBtn, { backgroundColor: theme.primary }]}
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
                style={[styles.applyBtn, { backgroundColor: isFilled ? (theme.isDark ? "#475569" : "#94A3B8") : theme.primary }]}
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
    justifyContent: "flex-end"
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
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
    borderRadius: 3
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center"
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.bold
  },
  modalSub: {
    fontSize: 11
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  salaryBadgeText: {
    fontSize: 12,
    fontFamily: fonts.bold
  },
  aiCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12
  },
  mentorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
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
    marginTop: 16,
    marginBottom: 6
  },
  descText: {
    fontSize: 13,
    lineHeight: 20
  },
  metaGrid: {
    flexDirection: "row",
    gap: 16,
    marginTop: 14,
    borderWidth: 1,
    padding: 12,
    borderRadius: 10
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  metaLabel: {
    fontSize: 12
  },
  metaVal: {
    fontFamily: fonts.bold
  },
  docBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginTop: 14
  },
  readDocBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8
  },
  applyBtn: {
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
