import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
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

const { width } = Dimensions.get("window");

const mentorCategories = [
  { id: "all", name: "All Mentors", icon: "account-group-outline" },
  { id: "inform", name: "Inform Tech", icon: "laptop" },
  { id: "academy", name: "Academy", icon: "school-outline" },
  { id: "govt", name: "Government", icon: "bank-outline" },
  { id: "career", name: "Career", icon: "briefcase-outline" }
];

export default function AllMentorsScreen({ session, onBack, onSelectMentor }) {
  const { theme } = useTheme();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    fetchMentors();
  }, [session?.token]);

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
    const catMatch =
      activeCategory === "all" ||
      String(m.category || "").toLowerCase().includes(activeCategory) ||
      String(m.role || "").toLowerCase().includes(activeCategory);

    if (!searchQuery.trim()) return catMatch;

    const q = searchQuery.toLowerCase();
    const queryMatch =
      String(m.name || "").toLowerCase().includes(q) ||
      String(m.role || "").toLowerCase().includes(q) ||
      String(m.category || "").toLowerCase().includes(q) ||
      String(m.bio || "").toLowerCase().includes(q);

    return catMatch && queryMatch;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. Header Bar */}
      <View style={[styles.topHeader, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.badgeBg }]}>
            <Feather name="arrow-left" size={20} color={theme.text} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={[styles.screenTitle, { color: theme.text }]}>All Expert Mentors</Text>
            <Text style={[styles.screenSub, { color: theme.subtext }]}>Browse verified educators & career advisors</Text>
          </View>
        </View>

        <View style={[styles.mentorCountBadge, { backgroundColor: theme.badgeBg }]}>
          <Text style={[styles.mentorCountText, { color: theme.primary }]}>{filteredMentors.length} Verified</Text>
        </View>
      </View>

      {/* 2. Search Input */}
      <View style={[styles.searchBarWrap, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Feather name="search" size={18} color={theme.subtext} style={{ marginRight: 8 }} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search mentors by name, tech stack, or subjects..."
          placeholderTextColor={theme.subtext}
          style={[styles.searchInput, { color: theme.text }]}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery("")}>
            <Feather name="x" size={16} color={theme.subtext} />
          </Pressable>
        ) : null}
      </View>

      {/* 3. Category Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {mentorCategories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={[styles.categoryChip, { backgroundColor: theme.isDark ? "#1E263B" : "#F4F3FA", borderColor: theme.border }, isActive && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            >
              <MaterialCommunityIcons
                name={cat.icon}
                size={16}
                color={isActive ? "#FFFFFF" : theme.subtext}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.categoryChipText, { color: theme.subtext }, isActive && { color: "#FFFFFF", fontFamily: fonts.bold }]}>{cat.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 4. Mentors Grid / List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.subtext }]}>Fetching registered mentors...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {filteredMentors.length > 0 ? (
            <View style={styles.mentorsGrid}>
              {filteredMentors.map((mentor) => (
                <View key={mentor.id} style={[styles.mentorCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  {/* Top Avatar & Badge Row */}
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarWrap}>
                      {mentor.avatarUrl && typeof mentor.avatarUrl === "string" && mentor.avatarUrl.trim().length > 5 ? (
                        <Image source={{ uri: mentor.avatarUrl }} style={[styles.avatarImg, { borderColor: theme.border }]} />
                      ) : (
                        <View style={[styles.avatarImg, { backgroundColor: theme.primary, alignItems: "center", justifyContent: "center", borderColor: theme.border }]}>
                          <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: "#FFFFFF" }}>
                            {(mentor.name || "M").split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
                          </Text>
                        </View>
                      )}
                      <View style={[styles.onlineBadge, { borderColor: theme.cardBg }]} />
                    </View>

                    <View style={styles.badgeCol}>
                      <View style={[styles.specializationPill, { backgroundColor: theme.badgeBg }]}>
                        <Text style={[styles.specializationText, { color: theme.primary }]}>{mentor.category || "TCM One Mentor"}</Text>
                      </View>

                      <View style={[styles.ratingBox, { backgroundColor: theme.isDark ? "#1E263B" : "#FFF8EC" }]}>
                        <FontAwesome name="star" size={11} color="#FFB800" />
                        <Text style={[styles.ratingVal, { color: theme.text }]}>{mentor.rating}</Text>
                        <Text style={[styles.reviewsVal, { color: theme.subtext }]}>({mentor.reviews})</Text>
                      </View>
                    </View>
                  </View>

                  {/* Body info */}
                  <View style={styles.cardBody}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={[styles.mentorName, { color: theme.text }]} numberOfLines={1}>{mentor.name}</Text>
                      <View style={{ backgroundColor: theme.isDark ? "#1E1B4B" : "#FEF3C7", borderWidth: 1, borderColor: theme.border, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                        <Text style={{ fontSize: 9.5, fontWeight: "700", color: theme.isDark ? "#A78BFA" : "#D97706" }}>Mentor</Text>
                      </View>
                      {mentor.isPremium ? (
                        <MaterialCommunityIcons name="check-decagram" size={15} color={theme.primary} style={{ marginLeft: 2 }} />
                      ) : null}
                    </View>

                    <Text style={[styles.mentorRole, { color: theme.primary }]} numberOfLines={1}>{mentor.role}</Text>
                    <Text style={[styles.mentorBio, { color: theme.subtext }]} numberOfLines={2}>{mentor.bio || "Experienced educator providing personalized 1-on-1 mentorship."}</Text>

                    <View style={styles.experienceRow}>
                      <Feather name="award" size={12} color={theme.subtext} />
                      <Text style={[styles.expText, { color: theme.subtext }]}>{mentor.experience || "5+ Yrs Exp"}</Text>
                    </View>
                  </View>

                  {/* Action Button */}
                  <Pressable
                    onPress={() => (onSelectMentor ? onSelectMentor(mentor.id) : Alert.alert(mentor.name, mentor.role))}
                    style={({ pressed }) => [styles.viewProfileBtn, { backgroundColor: theme.primary }, pressed && styles.pressed]}
                  >
                    <Text style={styles.viewProfileBtnText}>View Full Profile →</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="account-search-outline" size={40} color="#7C7C9A" />
              <Text style={styles.emptyTitle}>No Mentors Found</Text>
              <Text style={styles.emptySub}>No registered mentors match your search query or filter.</Text>
              <Pressable onPress={() => { setSearchQuery(""); setActiveCategory("all"); }} style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>Reset Filters</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7FF"
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EFFF"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  titleWrap: {
    flex: 1
  },
  screenTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: "#181725"
  },
  screenSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 1
  },
  mentorCountBadge: {
    backgroundColor: "#EEECFE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  mentorCountText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#5B3CF5"
  },

  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EBEAFA",
    ...shadow.soft
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#181725"
  },

  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E1FF"
  },
  activeCategoryChip: {
    backgroundColor: "#5B3CF5",
    borderColor: "#5B3CF5"
  },
  categoryChipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#52506E"
  },
  activeCategoryChipText: {
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },

  loadingBox: {
    paddingVertical: 60,
    alignItems: "center"
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#7C7C9A",
    marginTop: 10
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30
  },
  mentorsGrid: {
    gap: 12,
    marginTop: 4
  },
  mentorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  avatarWrap: {
    position: "relative"
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2E7D32",
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  badgeCol: {
    alignItems: "flex-end"
  },
  specializationPill: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4
  },
  specializationText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#5B3CF5"
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center"
  },
  ratingVal: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725",
    marginLeft: 3
  },
  reviewsVal: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    marginLeft: 2
  },

  cardBody: {
    marginBottom: 12
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2
  },
  mentorName: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#181725"
  },
  mentorRole: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#5B3CF5",
    marginBottom: 4
  },
  mentorBio: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    lineHeight: 16,
    marginBottom: 6
  },
  experienceRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  expText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#7C7C9A",
    marginLeft: 4
  },

  viewProfileBtn: {
    backgroundColor: "#5B3CF5",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center"
  },
  viewProfileBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#FFFFFF"
  },
  pressed: {
    opacity: 0.85
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#EBEAFA",
    ...shadow.soft
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725",
    marginTop: 10
  },
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C7C9A",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14
  },
  resetBtn: {
    backgroundColor: "#EEECFE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10
  },
  resetBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#5B3CF5"
  }
});
