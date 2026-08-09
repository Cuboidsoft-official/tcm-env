import { useState, useEffect } from "react";
import {
  Alert,
  Dimensions,
  Image,
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

const { width } = Dimensions.get("window");

export default function PopularCoursesScreen({ session, onBack, onNotifications, onSelectCourse }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const filteredCourses = coursesList.filter((item) => {
    const matchesCat = activeCategory === "all" || item.category === activeCategory;
    if (!searchQuery.trim()) return matchesCat;
    const q = searchQuery.toLowerCase();
    const matchesQuery = item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q) || item.instructor.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <View style={styles.container}>
      {/* 1. Top Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#181725" />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.screenTitle}>All Popular Courses</Text>
            <Text style={styles.screenSub}>Explore live, expert-led programs and grow your skills</Text>
          </View>
        </View>

        <Pressable onPress={onNotifications || (() => Alert.alert("Notifications", "You have course updates."))} style={styles.headerIconBtn}>
          <Feather name="bell" size={18} color="#181725" />
          <View style={styles.notifDot} />
        </Pressable>
      </View>

      {/* 2. Floating Search Bar with Filter */}
      <View style={styles.searchBoxCard}>
        <Feather name="search" size={18} color="#8A879F" style={{ marginRight: 10 }} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search courses, skills or mentors..."
          placeholderTextColor="#8A879F"
          style={styles.searchInput}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery("")} style={{ marginRight: 6 }}>
            <Feather name="x" size={16} color="#8A879F" />
          </Pressable>
        ) : null}
        <Pressable onPress={() => Alert.alert("Filter Courses", "Filter by Category, Difficulty & Rating")} style={styles.filterBtn}>
          <MaterialCommunityIcons name="tune-variant" size={18} color="#181725" />
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
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              >
                <MaterialCommunityIcons name={cat.icon} size={15} color={isActive ? "#FFFFFF" : "#5B3CF5"} style={{ marginRight: 5 }} />
                <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>{cat.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 4. Popular Right Now Header Row */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Feather name="trending-up" size={16} color="#FF6B00" />
            <Text style={styles.sectionTitle}>Popular Right Now</Text>
          </View>
          <Pressable onPress={() => Alert.alert("Sort Courses", "Sorting options: Popularity, Rating, Price Low-High")} style={styles.sortRow}>
            <Text style={styles.sortLabel}>Sort by </Text>
            <Text style={styles.sortVal}>Popularity</Text>
            <Feather name="chevron-down" size={14} color="#5B3CF5" style={{ marginLeft: 2 }} />
          </Pressable>
        </View>

        {/* 5. Vertical Courses List */}
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <Pressable
              key={course.id}
              onPress={() => onSelectCourse ? onSelectCourse(course.id) : Alert.alert(course.title, `Opening course details...`)}
              style={styles.courseCard}
            >
              {/* Thumbnail Left */}
              <View style={styles.thumbnailWrap}>
                <Image source={{ uri: course.image }} style={styles.thumbnailImg} />
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>{(course.badge || "LIVE").replace(/[^a-zA-Z0-9\s]/g, "").trim()}</Text>
                </View>
              </View>

              {/* Content Right */}
              <View style={styles.courseContentCol}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
                  <View style={styles.ratingRow}>
                    <FontAwesome name="star" size={11} color="#FFB800" />
                    <Text style={styles.ratingText}>{course.rating}</Text>
                    <Text style={styles.reviewsText}>({course.reviews})</Text>
                  </View>
                </View>

                <Text style={styles.courseSub} numberOfLines={1}>{course.subtitle}</Text>

                {/* Instructor Row */}
                <View style={styles.instructorRow}>
                  <Image source={{ uri: course.instructorAvatar }} style={styles.instructorAvatar} />
                  <View style={styles.instructorTextWrap}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={styles.instructorName}>{course.instructor}</Text>
                      <View style={{ backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                        <Text style={{ fontSize: 9.5, fontWeight: "700", color: "#D97706" }}>Mentor</Text>
                      </View>
                      {course.isPremium ? (
                        <MaterialCommunityIcons name="check-decagram" size={13} color="#5B3CF5" style={{ marginLeft: 2 }} />
                      ) : null}
                    </View>
                    <Text style={styles.instructorRole}>{course.instructorRole}</Text>
                  </View>

                  <View style={styles.priceCol}>
                    <Text style={styles.priceText}>{course.price}</Text>
                    <Text style={styles.originalPriceText}>{course.originalPrice}</Text>
                  </View>
                </View>

                {/* Meta Row (Live classes, Learners, Discount badge) */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.metaLeft}>
                    <Feather name="calendar" size={11} color="#7C7C9A" />
                    <Text style={styles.metaText}>{course.type}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Feather name="users" size={11} color="#7C7C9A" />
                    <Text style={styles.metaText}>{course.learners}</Text>
                  </View>

                  <View style={styles.discountPill}>
                    <Text style={styles.discountPillText}>{course.discount}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyPopularCard}>
            <MaterialCommunityIcons name="magnify-remove-outline" size={32} color="#7C7C9A" />
            <Text style={styles.emptyPopularTitle}>No Courses Found</Text>
            <Text style={styles.emptyPopularSub}>No courses match "{searchQuery}". Try selecting another category or clear search.</Text>
            <Pressable onPress={() => { setSearchQuery(""); setActiveCategory("all"); }} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>Reset Filters</Text>
            </Pressable>
          </View>
        )}

        {/* 6. Summary Stats Highlights Bar */}
        <View style={styles.statsBar}>
          {statsList.map((st) => (
            <View key={st.id} style={styles.statItemCol}>
              <View style={[styles.statIconWrap, { backgroundColor: st.bg }]}>
                <MaterialCommunityIcons name={st.icon} size={18} color={st.color} />
              </View>
              <Text style={styles.statValText}>{st.title}</Text>
              <Text style={styles.statSubText}>{st.sub}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F8F7FF"
  },

  // Top Header
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center"
  },
  titleWrap: {
    flex: 1
  },
  screenTitle: {
    fontFamily: fonts.bold,
    fontSize: 21,
    color: "#181725"
  },
  screenSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 1
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#5B3CF5"
  },

  // Search Box
  searchBoxCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
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
    fontSize: 12,
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
    marginBottom: 12
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725"
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  sortLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C7C9A"
  },
  sortVal: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#5B3CF5"
  },

  // Vertical Course Card
  courseCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    gap: 12,
    ...shadow.soft
  },
  thumbnailWrap: {
    width: 90,
    height: 90,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative"
  },
  thumbnailImg: {
    width: "100%",
    height: "100%"
  },
  liveBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
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
    fontSize: 14,
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
    fontSize: 11,
    color: "#181725"
  },
  reviewsText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A"
  },
  courseSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 1,
    marginBottom: 6
  },

  instructorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6
  },
  instructorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6
  },
  instructorTextWrap: {
    flex: 1
  },
  instructorName: {
    fontFamily: fonts.bold,
    fontSize: 11,
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
    fontSize: 14,
    color: "#181725"
  },
  originalPriceText: {
    fontFamily: fonts.regular,
    fontSize: 10,
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
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E1FF"
  },
  clearSearchText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#5B3CF5"
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
  }
});
