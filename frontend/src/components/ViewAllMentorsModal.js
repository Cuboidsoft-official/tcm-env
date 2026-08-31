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
  View
} from "react-native";
import { Feather, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { getAllMentors } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

export default function ViewAllMentorsModal({ visible, session, onClose, onSelectMentor }) {
  const { theme } = useTheme();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (visible) {
      fetchMentors();
    }
  }, [visible, session?.token]);

  async function fetchMentors() {
    setLoading(true);
    try {
      if (session?.token) {
        const res = await getAllMentors(session.token);
        if (res && Array.isArray(res.mentors)) {
          setMentors(res.mentors);
        }
      }
    } catch (err) {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  }

  const filteredMentors = mentors.filter((m) => {
    if (m.isApproved === false) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(m.name || "").toLowerCase().includes(q) ||
      String(m.role || "").toLowerCase().includes(q) ||
      String(m.category || "").toLowerCase().includes(q)
    );
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>All Expert Mentors</Text>
              <Text style={[styles.headerSub, { color: theme.subtext }]}>{mentors.length} Verified Educators</Text>
            </View>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.isDark ? "#1E263B" : "#F8FAFC" }]}>
              <Feather name="x" size={22} color={theme.text} />
            </Pressable>
          </View>

          {/* Search Input */}
          <View style={[styles.searchBox, { backgroundColor: theme.inputBg || (theme.isDark ? "#131927" : "#F8FAFC"), borderColor: theme.border }]}>
            <Feather name="search" size={16} color={theme.subtext} style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search mentors by name or specialization..."
              placeholderTextColor={theme.subtext}
              style={[styles.searchInput, { color: theme.text }]}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery("")}>
                <Feather name="x" size={16} color={theme.subtext} />
              </Pressable>
            ) : null}
          </View>

          {/* Body List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#5B3CF5" />
              <Text style={styles.loadingText}>Fetching real mentors...</Text>
            </View>
          ) : filteredMentors.length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {filteredMentors.map((mentor) => (
                <Pressable
                  key={mentor.id}
                  onPress={() => {
                    onClose();
                    if (onSelectMentor) onSelectMentor(mentor.id);
                  }}
                  style={[styles.mentorCard, { backgroundColor: theme.isDark ? "#1E263B" : "#F9F8FF", borderColor: theme.border }]}
                >
                  {mentor.avatarUrl && typeof mentor.avatarUrl === "string" && mentor.avatarUrl.trim().length > 5 ? (
                    <Image source={{ uri: mentor.avatarUrl }} style={styles.avatarImg} />
                  ) : (
                    <View style={[styles.avatarImg, { backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" }]}>
                      <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: "#FFFFFF" }}>
                        {(mentor.name || "M").split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.infoCol}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.mentorName, { color: theme.text }]}>{mentor.name}</Text>
                      <MaterialCommunityIcons name="check-decagram" size={15} color={theme.primary} style={{ marginLeft: 3 }} />
                    </View>

                    <Text style={[styles.mentorRole, { color: theme.primary }]}>{mentor.role}</Text>

                    <View style={[styles.badgePill, { backgroundColor: theme.badgeBg }]}>
                      <Text style={[styles.badgeText, { color: theme.primary }]}>{mentor.category || "Last Class Mentor"}</Text>
                    </View>
                  </View>

                  <View style={styles.actionRightCol}>
                    <View style={styles.ratingRow}>
                      <FontAwesome name="star" size={11} color="#FFB800" />
                      <Text style={[styles.ratingText, { color: theme.text }]}>{mentor.rating}</Text>
                    </View>
                    <Text style={[styles.expText, { color: theme.subtext }]}>{mentor.experience || "5+ Yrs Exp"}</Text>

                    <View style={[styles.viewProfileSmallBtn, { backgroundColor: theme.primary }]}>
                      <Text style={styles.viewProfileSmallText}>Profile →</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="account-search-outline" size={36} color="#7C7C9A" />
              <Text style={styles.emptyTitle}>No Mentors Found</Text>
              <Text style={styles.emptySub}>No registered mentors match your search query.</Text>
            </View>
          )}
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
    maxHeight: "88%",
    padding: 16
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EFFF"
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: "#181725"
  },
  headerSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 2
  },
  closeBtn: {
    padding: 4
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F7FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#EBEAFA"
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#181725"
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: "center"
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#7C7C9A",
    marginTop: 8
  },
  scrollContent: {
    paddingBottom: 20
  },
  mentorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F8FF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EBEAFA",
    ...shadow.soft
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12
  },
  infoCol: {
    flex: 1
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  mentorName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#181725"
  },
  mentorRole: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#52506E",
    marginTop: 1
  },
  badgePill: {
    alignSelf: "flex-start",
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "#5B3CF5"
  },
  actionRightCol: {
    alignItems: "flex-end"
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  ratingText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725",
    marginLeft: 3
  },
  expText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    marginTop: 2
  },
  viewProfileSmallBtn: {
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 6
  },
  viewProfileSmallText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#FFFFFF"
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: "center"
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#181725",
    marginTop: 8
  },
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 4
  }
});
