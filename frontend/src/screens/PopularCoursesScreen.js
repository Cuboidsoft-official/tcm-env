import { useState, useEffect } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Feather, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { getPopularCoursesDetails } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function PopularCoursesScreen({ session, onBack, onSelectCourse }) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilterBottomSheet, setShowFilterBottomSheet] = useState(false);
  const [sortBy, setSortBy] = useState("popularity"); // 'popularity' | 'rating' | 'price'

  useEffect(() => {
    loadDetails();
  }, [session?.token]);

  async function loadDetails() {
    setLoading(true);
    try {
      if (session?.token) {
        const res = await getPopularCoursesDetails(session.token);
        if (res) setData(res);
      }
    } catch (e) {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  }

  const fallbackData = {
    categories: [
      { id: "all", name: "All", icon: "widgets-outline" },
      { id: "dev", name: "Development", icon: "code-tags" },
      { id: "design", name: "Design", icon: "pencil-outline" },
      { id: "data", name: "Data", icon: "chart-bar" },
      { id: "biz", name: "Business", icon: "briefcase-outline" },
      { id: "mkt", name: "Marketing", icon: "bullhorn-outline" }
    ],
    courses: [],
    stats: [
      { id: "s1", title: "1+", sub: "Live Courses", icon: "broadcast", color: "#5B3CF5", bg: "#F0EDFF" },
      { id: "s2", title: "50K+", sub: "Active Learners", icon: "account-group", color: "#2E7D32", bg: "#ECF9E9" },
      { id: "s3", title: "200+", sub: "Expert Mentors", icon: "star-face", color: "#E7A900", bg: "#FFF6DA" },
      { id: "s4", title: "Certificate", sub: "On Completion", icon: "certificate", color: "#2F79B9", bg: "#EAF5FF" }
    ]
  };

  const payload = data || fallbackData;
  const categoriesList = payload.categories || [];
  const coursesList = payload.courses || [];
  const statsList = payload.stats || [];

  const filteredCourses = coursesList
    .filter((item) => {
      const matchesCat = activeCategory === "all" || item.category === activeCategory;
      if (!searchQuery.trim()) return matchesCat;
      const q = searchQuery.toLowerCase();
      const matchesQuery = item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q) || (item.instructor && item.instructor.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    })
    .sort((a, b) => {
      if (sortBy === "rating") {
        return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
      }
      if (sortBy === "price") {
        const pA = parseFloat(String(a.price).replace(/[^0-9.]/g, "")) || 0;
        const pB = parseFloat(String(b.price).replace(/[^0-9.]/g, "")) || 0;
        return pA - pB;
      }
      const rA = parseInt(String(a.reviews || "0").replace(/[^0-9]/g, "")) || 0;
      const rB = parseInt(String(b.reviews || "0").replace(/[^0-9]/g, "")) || 0;
      return rB - rA;
    });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg || colors.bg }]}>
      {/* 1. Top Header Bar (Flush 52px height, NO notification bell) */}
      <View style={[styles.topHeader, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}>
          <Feather name="arrow-left" size={18} color={theme.text || colors.ink} />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={[styles.screenTitle, { color: theme.text || colors.ink }]}>Popular Courses</Text>
          <Text style={[styles.screenSub, { color: theme.subtext || colors.muted }]} numberOfLines={1}>
            Live, expert-led programs & courses
          </Text>
        </View>

        {/* Top Header Filter Icon Button */}
        <Pressable
          onPress={() => setShowFilterBottomSheet(true)}
          style={[
            styles.filterHeaderBtn,
            {
              backgroundColor: (searchQuery.trim() || activeCategory !== 'all')
                ? (theme.isDark ? '#064E3B' : colors.mint)
                : (theme.cardBg || colors.card),
              borderColor: (searchQuery.trim() || activeCategory !== 'all')
                ? colors.primary
                : (theme.border || colors.border)
            }
          ]}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={18}
            color={(searchQuery.trim() || activeCategory !== 'all') ? colors.primary : (theme.text || colors.ink)}
          />
          {(searchQuery.trim() || activeCategory !== 'all') ? (
            <View style={styles.activeFilterDot} />
          ) : null}
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 3. Category Pills Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsScroll}>
          {categoriesList.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={[
                  styles.categoryPill,
                  { backgroundColor: theme.isDark ? "#1E263B" : "#F4F3FA", borderColor: theme.border },
                  isActive && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
              >
                <MaterialCommunityIcons name={cat.icon} size={15} color={isActive ? "#FFFFFF" : theme.primary} style={{ marginRight: 5 }} />
                <Text style={[styles.categoryPillText, { color: theme.subtext }, isActive && { color: "#FFFFFF", fontFamily: fonts.bold }]}>{cat.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 4. Popular Right Now Header Row with Real Sorting */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Feather name="trending-up" size={15} color="#FF6B00" />
            <Text style={[styles.sectionTitle, { color: theme.text || colors.ink }]}>Popular Courses</Text>
          </View>
          <Pressable
            onPress={() => {
              if (sortBy === "popularity") setSortBy("rating");
              else if (sortBy === "rating") setSortBy("price");
              else setSortBy("popularity");
            }}
            style={styles.sortRow}
          >
            <Text style={[styles.sortLabel, { color: theme.subtext || colors.muted }]}>Sort by </Text>
            <Text style={[styles.sortVal, { color: theme.primary || colors.primary }]}>
              {sortBy === "rating" ? "Rating (High)" : sortBy === "price" ? "Price (Low)" : "Popularity"}
            </Text>
            <Feather name="chevron-down" size={13} color={theme.primary || colors.primary} style={{ marginLeft: 2 }} />
          </Pressable>
        </View>

        {/* 5. Vertical Courses List */}
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <Pressable
              key={course.id}
              onPress={() => onSelectCourse ? onSelectCourse(course.id) : Alert.alert(course.title, `Opening course details...`)}
              style={[styles.courseCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            >
              {/* Thumbnail Left */}
              <View style={styles.thumbnailWrap}>
                <Image source={{ uri: course.image }} style={styles.thumbnailImg} />
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>
                    {String(course.badge || "LIVE").replace(/[\u1F600-\u1F64F\u1F300-\u1F5FF\u1F680-\u1F6FF\u1F1E0-\u1F1FF\u2600-\u26FF\u2700-\u27BF]/g, "").trim() || "LIVE"}
                  </Text>
                </View>
              </View>

              {/* Content Right */}
              <View style={styles.courseContentCol}>
                <View style={styles.cardTopRow}>
                  <Text style={[styles.courseTitle, { color: theme.text }]} numberOfLines={1}>{course.title}</Text>
                  <View style={styles.ratingRow}>
                    <FontAwesome name="star" size={11} color="#FFB800" />
                    <Text style={[styles.ratingText, { color: theme.text }]}>{course.rating}</Text>
                    <Text style={[styles.reviewsText, { color: theme.subtext }]}>({course.reviews})</Text>
                  </View>
                </View>

                <Text style={[styles.courseSub, { color: theme.subtext }]} numberOfLines={1}>{course.subtitle}</Text>

                {/* Instructor Row */}
                <View style={styles.instructorRow}>
                  <Image source={{ uri: course.instructorAvatar }} style={styles.instructorAvatar} />
                  <View style={styles.instructorTextWrap}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={[styles.instructorName, { color: theme.text }]}>{course.instructor}</Text>
                      <View style={{ backgroundColor: theme.isDark ? "#1E1B4B" : "#FEF3C7", borderWidth: 1, borderColor: theme.border, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                        <Text style={{ fontSize: 9.5, fontWeight: "700", color: theme.isDark ? "#A78BFA" : "#D97706" }}>Mentor</Text>
                      </View>
                      {course.isPremium ? (
                        <MaterialCommunityIcons name="check-decagram" size={13} color={theme.primary} style={{ marginLeft: 2 }} />
                      ) : null}
                    </View>
                    <Text style={[styles.instructorRole, { color: theme.subtext }]}>{course.instructorRole}</Text>
                  </View>

                  <View style={styles.priceCol}>
                    <Text style={[styles.priceText, { color: theme.primary }]}>{course.price}</Text>
                    <Text style={[styles.originalPriceText, { color: theme.subtext }]}>{course.originalPrice}</Text>
                  </View>
                </View>

                {/* Meta Row (Live classes, Learners, Discount badge) */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.metaLeft}>
                    <Feather name="calendar" size={11} color={theme.subtext} />
                    <Text style={[styles.metaText, { color: theme.subtext }]}>{course.type}</Text>
                    <Text style={[styles.metaDot, { color: theme.subtext }]}>•</Text>
                    <Feather name="users" size={11} color={theme.subtext} />
                    <Text style={[styles.metaText, { color: theme.subtext }]}>{course.learners}</Text>
                  </View>

                  <View style={[styles.discountPill, { backgroundColor: theme.badgeBg }]}>
                    <Text style={[styles.discountPillText, { color: theme.primary }]}>{course.discount}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={[styles.emptyPopularCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="magnify-remove-outline" size={32} color={theme.subtext} />
            <Text style={[styles.emptyPopularTitle, { color: theme.text }]}>No Courses Found</Text>
            <Text style={[styles.emptyPopularSub, { color: theme.subtext }]}>No courses match "{searchQuery}". Try selecting another category or clear search.</Text>
            <Pressable onPress={() => { setSearchQuery(""); setActiveCategory("all"); }} style={[styles.clearSearchBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <Text style={styles.clearSearchText}>Reset Filters</Text>
            </Pressable>
          </View>
        )}

        {/* 6. Summary Stats Highlights Bar */}
        <View style={[styles.statsBar, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {statsList.map((st) => (
            <View key={st.id} style={styles.statItemCol}>
              <View style={[styles.statIconWrap, { backgroundColor: theme.isDark ? "#1E263B" : st.bg }]}>
                <MaterialCommunityIcons name={st.icon} size={18} color={theme.isDark ? theme.primary : st.color} />
              </View>
              <Text style={[styles.statValText, { color: theme.text }]}>{st.title}</Text>
              <Text style={[styles.statSubText, { color: theme.subtext }]}>{st.sub}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 7. Filter Bottom Sheet Modal (Search & Category Concept) */}
      <Modal visible={showFilterBottomSheet} animationType="slide" transparent onRequestClose={() => setShowFilterBottomSheet(false)}>
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setShowFilterBottomSheet(false)}
        >
          <Pressable
            style={[styles.sheetContainer, { backgroundColor: theme.cardBg || colors.card, borderColor: theme.border || colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />

            {/* Title Header */}
            <View style={styles.sheetHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="tune-variant" size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: theme.text || colors.ink }]}>
                  Search & Filter Courses
                </Text>
              </View>

              <Pressable onPress={() => setShowFilterBottomSheet(false)} style={{ padding: 4 }}>
                <Feather name="x" size={20} color={theme.subtext || colors.muted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {/* SECTION 1: SEARCH BAR CONCEPT */}
              <Text style={[styles.sheetSectionLabel, { color: theme.text || colors.ink }]}>
                Search Course or Mentor
              </Text>
              <View style={[styles.sheetSearchWrap, { backgroundColor: theme.bg || colors.bg, borderColor: theme.border || colors.border }]}>
                <Feather name="search" size={17} color={colors.muted} style={{ marginRight: 8 }} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search courses, skills or mentors..."
                  placeholderTextColor={colors.muted}
                  style={[styles.sheetSearchInput, { color: theme.text || colors.ink }]}
                />
                {searchQuery ? (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Feather name="x-circle" size={17} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>

              {/* SECTION 2: CATEGORY SELECTION */}
              <View style={styles.sheetSectionHeader}>
                <Text style={[styles.sheetSectionLabel, { color: theme.text || colors.ink, marginBottom: 0 }]}>
                  Course Category
                </Text>
                {activeCategory !== 'all' && (
                  <Pressable onPress={() => setActiveCategory('all')}>
                    <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.primary }}>Reset Category</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.sheetCategoryGrid}>
                {categoriesList.map((cat) => {
                  const isSelected = activeCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setActiveCategory(cat.id)}
                      style={[
                        styles.sheetCategoryChip,
                        {
                          backgroundColor: isSelected ? colors.primary : (theme.bg || '#F1F5F9'),
                          borderColor: isSelected ? colors.primary : (theme.border || '#E2E8F0')
                        }
                      ]}
                    >
                      <MaterialCommunityIcons name={cat.icon} size={14} color={isSelected ? '#FFFFFF' : colors.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.sheetCategoryChipText, { color: isSelected ? '#FFFFFF' : (theme.text || colors.ink) }]}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* BOTTOM SHEET FOOTER ACTIONS */}
            <View style={[styles.sheetFooterRow, { borderTopColor: theme.border || colors.border }]}>
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                style={[styles.sheetResetBtn, { borderColor: theme.border || colors.border }]}
              >
                <Text style={[styles.sheetResetBtnText, { color: theme.subtext || colors.muted }]}>Reset All</Text>
              </Pressable>

              <Pressable
                onPress={() => setShowFilterBottomSheet(false)}
                style={[styles.sheetApplyBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.sheetApplyBtnText}>Apply Filters</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F8F7FF"
  },

  // Top Header (Flush 52px height)
  topHeader: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderBottomWidth: 1
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  titleWrap: {
    flex: 1,
    marginLeft: 10
  },
  screenTitle: {
    fontFamily: fonts.bold,
    fontSize: 15
  },
  screenSub: {
    fontFamily: fonts.regular,
    fontSize: 10
  },
  filterHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  activeFilterDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#EF4444"
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#181725"
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6
  },

  scrollContent: {
    paddingHorizontal: 2,
    paddingTop: 2,
    paddingBottom: 110,
    width: "100%"
  },

  // Category Pills
  categoryPillsScroll: {
    paddingBottom: 14,
    gap: 8
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0EFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    ...shadow.soft
  },
  categoryPillActive: {
    backgroundColor: "#5B3CF5",
    borderColor: "#5B3CF5"
  },
  categoryPillText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: "#181725"
  },
  categoryPillTextActive: {
    color: "#FFFFFF"
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725"
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  sortLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A"
  },
  sortVal: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#5B3CF5"
  },

  // Vertical Course Card
  courseCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    gap: 10,
    ...shadow.soft
  },
  thumbnailWrap: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative"
  },
  thumbnailImg: {
    width: "100%",
    height: "100%"
  },
  liveBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5
  },
  liveBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    color: "#FFFFFF"
  },

  courseContentCol: {
    flex: 1,
    justifyContent: "space-between"
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6
  },
  courseTitle: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: "#181725",
    flex: 1
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },
  ratingText: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: "#181725"
  },
  reviewsText: {
    fontFamily: fonts.regular,
    fontSize: 9.5,
    color: "#7C7C9A"
  },
  courseSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    marginTop: 1,
    marginBottom: 4
  },

  instructorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4
  },
  instructorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 5
  },
  instructorTextWrap: {
    flex: 1
  },
  instructorName: {
    fontFamily: fonts.bold,
    fontSize: 10.5,
    color: "#181725"
  },
  instructorRole: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: "#7C7C9A"
  },
  priceCol: {
    alignItems: "flex-end"
  },
  priceText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725"
  },
  originalPriceText: {
    fontFamily: fonts.regular,
    fontSize: 9.5,
    color: "#9A9A9A",
    textDecorationLine: "line-through"
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F4F3FA"
  },
  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  metaText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: "#7C7C9A"
  },
  metaDot: {
    color: "#7C7C9A",
    fontSize: 9
  },
  discountPill: {
    backgroundColor: "#ECF9E9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  discountPillText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "#2E7D32"
  },

  // Empty Card State
  emptyPopularCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  emptyPopularTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#181725",
    marginTop: 8
  },
  emptyPopularSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C7C9A",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14
  },
  clearSearchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  clearSearchText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#FFFFFF"
  },

  // Stats Bar
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  statItemCol: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 2
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },
  statValText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#181725"
  },
  statSubText: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: "#7C7C9A",
    textAlign: "center"
  },

  /* FILTER BOTTOM SHEET STYLES */
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '84%'
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginBottom: 12
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 16
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  sheetSectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    marginBottom: 8
  },
  sheetSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  sheetSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 20
  },
  sheetSearchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular
  },
  sheetCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20
  },
  sheetCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20
  },
  sheetCategoryChipText: {
    fontSize: 12,
    fontFamily: fonts.medium
  },
  sheetFooterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1
  },
  sheetResetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetResetBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13
  },
  sheetApplyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetApplyBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 13
  }
});
