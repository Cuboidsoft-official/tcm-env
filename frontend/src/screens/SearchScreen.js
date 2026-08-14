import { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
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
import { searchGlobal } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

const defaultRecentSearches = [
  "React Native",
  "Python Basics",
  "System Design",
  "UPSC Polity Notes",
  "Data Structures & Algorithms"
];

const defaultTrendingTags = [
  "#FullStackWeb",
  "#PythonDSA",
  "#MachineLearning",
  "#JEEPhysics",
  "#UPSC2024",
  "#UIUXDesign"
];

export default function SearchScreen({ session, user = {}, onBack, onSelectPost, onSelectCourse, onSelectUser }) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [recentSearches, setRecentSearches] = useState(defaultRecentSearches);
  const [results, setResults] = useState({ posts: [], courses: [], mentors: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto focus search input on mount
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ posts: [], courses: [], mentors: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, session?.token]);

  async function executeSearch(query) {
    setLoading(true);
    try {
      if (session?.token) {
        const res = await searchGlobal(session.token, query);
        if (res) setResults(res);
      }
    } catch (err) {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  }

  function handleSelectRecent(item) {
    setSearchQuery(item);
  }

  function handleRemoveRecent(item) {
    setRecentSearches((prev) => prev.filter((s) => s !== item));
  }

  function handleClearAllRecent() {
    setRecentSearches([]);
  }

  const postsList = results.posts || [];
  const coursesList = results.courses || [];
  const mentorsList = results.mentors || [];
  const usersList = results.users || [];

  const totalCount = postsList.length + coursesList.length + mentorsList.length + usersList.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. Search Bar Header */}
      <View style={[styles.headerRow, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.badgeBg }]}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>

        <View style={[styles.searchBox, { backgroundColor: theme.inputBg || (theme.isDark ? "#131927" : "#F4F3FA"), borderColor: theme.border }]}>
          <Feather name="search" size={16} color={theme.subtext} style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users, posts, courses, mentors..."
            placeholderTextColor={theme.subtext}
            style={[styles.searchInput, { color: theme.text }]}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")} style={styles.clearBtn}>
              <Feather name="x" size={14} color={theme.subtext} />
            </Pressable>
          ) : null}
        </View>

        <Pressable onPress={() => Alert.alert("Filter", "Filter by Date, Category & Type")} style={[styles.filterBtn, { backgroundColor: theme.badgeBg }]}>
          <MaterialCommunityIcons name="tune-variant" size={18} color={theme.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 2. When Search Query is Empty -> Show Recent Searches & Trending Tags */}
        {!searchQuery.trim() ? (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 ? (
              <View style={[styles.sectionContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Feather name="clock" size={14} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Searches</Text>
                  </View>
                  <Pressable onPress={handleClearAllRecent}>
                    <Text style={[styles.clearAllText, { color: theme.primary }]}>Clear All</Text>
                  </Pressable>
                </View>

                {recentSearches.map((item) => (
                  <View key={item} style={[styles.recentItemRow, { borderBottomColor: theme.border }]}>
                    <Pressable onPress={() => handleSelectRecent(item)} style={styles.recentLeft}>
                      <Feather name="clock" size={14} color={theme.subtext} style={{ marginRight: 10 }} />
                      <Text style={[styles.recentText, { color: theme.text }]}>{item}</Text>
                    </Pressable>
                    <Pressable onPress={() => handleRemoveRecent(item)} style={styles.recentRemoveBtn}>
                      <Feather name="x" size={14} color={theme.subtext} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Trending Tags */}
            <View style={[styles.sectionContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Feather name="trending-up" size={14} color="#FF6B00" />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Trending Topics</Text>
              </View>
              <View style={styles.tagsFlexWrap}>
                {defaultTrendingTags.map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => setSearchQuery(tag.replace("#", ""))}
                    style={[styles.tagPill, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}
                  >
                    <Text style={[styles.tagPillText, { color: theme.primary }]}>{tag}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        ) : (
          /* 3. When Search Query is Non-Empty -> Show Search Results */
          <>
            {/* Results Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={styles.tabsRow}>
                {[
                  { id: "all", label: `All (${totalCount})` },
                  { id: "users", label: `Users (${usersList.length})` },
                  { id: "posts", label: `Posts (${postsList.length})` },
                  { id: "courses", label: `Courses (${coursesList.length})` },
                  { id: "mentors", label: `Mentors (${mentorsList.length})` }
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => setActiveTab(tab.id)}
                      style={[
                        styles.tabItem,
                        {
                          backgroundColor: isActive ? theme.primary : theme.cardBg,
                          borderColor: isActive ? theme.primary : theme.border
                        }
                      ]}
                    >
                      <Text style={[styles.tabText, { color: isActive ? "#FFFFFF" : theme.text }]}>{tab.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.subtext }]}>Searching workspace...</Text>
              </View>
            ) : totalCount === 0 ? (
              /* Empty Search State */
              <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="magnify-remove-outline" size={38} color={theme.subtext} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No results found for "{searchQuery}"</Text>
                <Text style={[styles.emptySub, { color: theme.subtext }]}>
                  Try checking for typos or searching with different keywords like 'Python', 'Web Dev', or 'DSA'.
                </Text>
                <Pressable onPress={() => setSearchQuery("")} style={[styles.resetBtn, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
                  <Text style={[styles.resetBtnText, { color: theme.primary }]}>Clear Search</Text>
                </Pressable>
              </View>
            ) : (
              /* Results List */
              <View style={styles.resultsList}>
                {/* Users Section */}
                {(activeTab === "all" || activeTab === "users") && usersList.length > 0 ? (
                  <View style={styles.resultGroup}>
                    {activeTab === "all" ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <Feather name="users" size={14} color={theme.primary} />
                        <Text style={[styles.groupTitle, { color: theme.text }]}>People & Learners ({usersList.length})</Text>
                      </View>
                    ) : null}
                    {usersList.map((u) => (
                      <Pressable
                        key={u.id}
                        onPress={() => onSelectUser ? onSelectUser(u) : Alert.alert(u.name)}
                        style={[styles.mentorResultCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                      >
                        <Image source={{ uri: u.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" }} style={styles.mentorAvatar} />
                        <View style={styles.mentorContentCol}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={[styles.mentorName, { color: theme.text }]}>{u.name}</Text>
                            {u.role?.toLowerCase().includes("mentor") || u.isMentor ? (
                              <View style={{ backgroundColor: theme.isDark ? "#1E1B4B" : "#FEF3C7", borderWidth: 1, borderColor: theme.border, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                                <Text style={{ fontSize: 9.5, fontWeight: "700", color: theme.isDark ? "#A78BFA" : "#D97706" }}>Mentor</Text>
                              </View>
                            ) : (
                              <View style={{ backgroundColor: theme.isDark ? "#1E263B" : "#F1F5F9", borderWidth: 1, borderColor: theme.border, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                                <Text style={{ fontSize: 9.5, fontWeight: "700", color: theme.subtext }}>Student</Text>
                              </View>
                            )}
                            {u.isPremium ? (
                              <MaterialCommunityIcons name="check-decagram" size={13} color={theme.primary} style={{ marginLeft: 2 }} />
                            ) : null}
                          </View>
                          <Text style={[styles.mentorTitle, { color: theme.subtext }]}>@{u.handle || u.name?.toLowerCase().replace(/\s+/g, "")} • {u.role || "student"}</Text>
                        </View>
                        <View style={{ backgroundColor: theme.badgeBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                          <Text style={{ fontSize: 11, fontFamily: fonts.semiBold, color: theme.primary }}>View Profile</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {/* Courses Section */}
                {(activeTab === "all" || activeTab === "courses") && coursesList.length > 0 ? (
                  <View style={styles.resultGroup}>
                    {activeTab === "all" ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <Feather name="book-open" size={14} color={theme.primary} />
                        <Text style={[styles.groupTitle, { color: theme.text }]}>Courses ({coursesList.length})</Text>
                      </View>
                    ) : null}
                    {coursesList.map((course) => (
                      <Pressable
                        key={course.id}
                        onPress={() => onSelectCourse ? onSelectCourse(course.id) : Alert.alert(course.title)}
                        style={[styles.courseResultCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                      >
                        <Image source={{ uri: course.image }} style={styles.courseImg} />
                        <View style={styles.courseContentCol}>
                          <Text style={[styles.courseTitle, { color: theme.text }]} numberOfLines={1}>{course.title}</Text>
                          <Text style={[styles.courseSub, { color: theme.subtext }]} numberOfLines={1}>{course.subtitle || course.tags}</Text>
                          <View style={styles.courseMetaRow}>
                            <FontAwesome name="star" size={11} color="#FFB800" />
                            <Text style={[styles.courseRating, { color: theme.text }]}>{course.rating}</Text>
                            <Text style={[styles.coursePrice, { color: theme.primary }]}>{course.price || "₹699"}</Text>
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {/* Mentors Section */}
                {(activeTab === "all" || activeTab === "mentors") && mentorsList.length > 0 ? (
                  <View style={styles.resultGroup}>
                    {activeTab === "all" ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <Feather name="award" size={14} color={theme.primary} />
                        <Text style={[styles.groupTitle, { color: theme.text }]}>Mentors ({mentorsList.length})</Text>
                      </View>
                    ) : null}
                    {mentorsList.map((mentor) => (
                      <Pressable
                        key={mentor.id}
                        onPress={() => onSelectUser ? onSelectUser(mentor) : Alert.alert(mentor.name)}
                        style={[styles.mentorResultCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                      >
                        <Image source={{ uri: mentor.avatarUrl }} style={styles.mentorAvatar} />
                        <View style={styles.mentorContentCol}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={[styles.mentorName, { color: theme.text }]}>{mentor.name}</Text>
                            <View style={{ backgroundColor: theme.isDark ? "#1E1B4B" : "#FEF3C7", borderWidth: 1, borderColor: theme.border, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                              <Text style={{ fontSize: 9.5, fontWeight: "700", color: theme.isDark ? "#A78BFA" : "#D97706" }}>Mentor</Text>
                            </View>
                            {mentor.isPremium ? (
                              <MaterialCommunityIcons name="check-decagram" size={13} color={theme.primary} style={{ marginLeft: 2 }} />
                            ) : null}
                          </View>
                          <Text style={[styles.mentorTitle, { color: theme.subtext }]}>{mentor.title}</Text>
                        </View>
                        <View style={[styles.mentorRatingBadge, { backgroundColor: theme.isDark ? "#1E263B" : "#FFFBEB" }]}>
                          <FontAwesome name="star" size={11} color="#FFB800" />
                          <Text style={[styles.mentorRatingText, { color: theme.text }]}>{mentor.rating}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {/* Posts Section */}
                {(activeTab === "all" || activeTab === "posts") && postsList.length > 0 ? (
                  <View style={styles.resultGroup}>
                    {activeTab === "all" ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <Feather name="file-text" size={14} color={theme.primary} />
                        <Text style={[styles.groupTitle, { color: theme.text }]}>Posts & Notes ({postsList.length})</Text>
                      </View>
                    ) : null}
                    {postsList.map((post) => (
                      <Pressable
                        key={post.id}
                        onPress={() => onSelectPost ? onSelectPost(post) : Alert.alert(post.authorName, post.text)}
                        style={[styles.postResultCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                      >
                        <View style={styles.postTopRow}>
                          <Image source={{ uri: post.authorAvatarUrl }} style={styles.postAvatar} />
                          <View style={styles.postAuthorWrap}>
                            <Text style={[styles.postAuthorName, { color: theme.text }]}>{post.authorName}</Text>
                            <Text style={[styles.postCategoryPill, { backgroundColor: theme.badgeBg, color: theme.primary }]}>{post.category || "General"}</Text>
                          </View>
                          <Text style={[styles.postTimeLabel, { color: theme.subtext }]}>{post.timeLabel || "Just now"}</Text>
                        </View>
                        <Text style={[styles.postSnippetText, { color: theme.subtext }]} numberOfLines={2}>{post.text}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            )}
          </>
        )}
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

  // 1. Search Bar Header
  headerRow: {
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
    gap: 8,
    ...shadow.soft
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center"
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F7FF",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 38
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#181725"
  },
  clearBtn: {
    padding: 4
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center"
  },

  scrollContent: {
    paddingHorizontal: 2,
    paddingTop: 4,
    paddingBottom: 110,
    width: "100%"
  },

  // Section Container
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#181725",
    marginBottom: 10
  },
  clearAllText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#5B3CF5"
  },

  // Recent Item Row
  recentItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F3FA"
  },
  recentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  recentText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#181725"
  },
  recentRemoveBtn: {
    padding: 4
  },

  // Tags Flex Wrap
  tagsFlexWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tagPill: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E1FF"
  },
  tagPillText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#5B3CF5"
  },

  // Tabs Row
  tabsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14
  },
  tabItem: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0EFFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    ...shadow.soft
  },
  tabItemActive: {
    backgroundColor: "#5B3CF5",
    borderColor: "#5B3CF5"
  },
  tabText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#181725"
  },
  tabTextActive: {
    color: "#FFFFFF"
  },

  // Loading
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "#7C7C9A"
  },

  // Empty Search Card
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#181725",
    marginTop: 8
  },
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C7C9A",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 17
  },
  resetBtn: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E1FF"
  },
  resetBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#5B3CF5"
  },

  // Results List
  resultsList: {
    gap: 14
  },
  resultGroup: {
    gap: 8
  },
  groupTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#181725",
    marginBottom: 4
  },

  // Course Result Card
  courseResultCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    gap: 10,
    ...shadow.soft
  },
  courseImg: {
    width: 60,
    height: 60,
    borderRadius: 10
  },
  courseContentCol: {
    flex: 1,
    justifyContent: "center"
  },
  courseTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725"
  },
  courseSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 2
  },
  courseMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4
  },
  courseRating: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#181725",
    marginRight: 8
  },
  coursePrice: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#5B3CF5"
  },

  // Mentor Result Card
  mentorResultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    gap: 10,
    ...shadow.soft
  },
  mentorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21
  },
  mentorContentCol: {
    flex: 1
  },
  mentorName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725"
  },
  mentorTitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 1
  },
  mentorRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3
  },
  mentorRatingText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#181725"
  },

  // Post Result Card
  postResultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  postTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6
  },
  postAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8
  },
  postAuthorWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  postAuthorName: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725"
  },
  postCategoryPill: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: "#5B3CF5",
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  postTimeLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A"
  },
  postSnippetText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#4A4A6A",
    lineHeight: 17
  }
});
