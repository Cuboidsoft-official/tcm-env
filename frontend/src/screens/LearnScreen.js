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
import ViewAllMentorsModal from "../components/ViewAllMentorsModal";
import { getContinueLearningDetails } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";

const { width } = Dimensions.get("window");

const defaultHeroBanners = [
  {
    id: "b_neet",
    tag: "NEET 2026 LIVE",
    title: "NEET Ultimate\nCrash Course 2026",
    subtitle: "Physics • Chemistry • Biology • 5000+ MCQs & Mock Tests",
    buttonText: "Join NEET Batch →",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "b_jee",
    tag: "JEE MAIN & ADV",
    title: "JEE Rank Booster\nBatch 2026",
    subtitle: "Advanced Maths • Physics • Organic Chemistry • IITian Mentors",
    buttonText: "Enroll for JEE →",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "b1",
    tag: "NEW BATCH",
    title: "Full Stack\nDevelopment",
    subtitle: "Live Classes • Projects • Placement Support",
    buttonText: "Explore Course →",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "b2",
    tag: "POPULAR",
    title: "Data Science\n& AI Masterclass",
    subtitle: "Python • Pandas • Machine Learning • LLMs",
    buttonText: "Join Batch →",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80"
  }
];

const defaultContinueLearning = [
  {
    id: "c_webdev_fullstack",
    title: "Full Stack Web Development Masterclass",
    subtitle: "React, Node.js, Express & MongoDB",
    progress: 0,
    icon: "code-tags",
    iconColor: "#5B3CF5",
    bgColor: "#F0EDFF"
  }
];
const defaultPopularCourses = [];

const defaultTopCategories = [
  {
    id: "cat1",
    name: "Programming",
    coursesCount: "124 Courses",
    icon: "code-tags",
    color: "#5B3CF5",
    bgColor: "#F0EDFF"
  },
  {
    id: "cat2",
    name: "Data Science",
    coursesCount: "86 Courses",
    icon: "chart-line",
    color: "#2E7D32",
    bgColor: "#ECF9E9"
  },
  {
    id: "cat3",
    name: "Web Dev",
    coursesCount: "95 Courses",
    icon: "web",
    color: "#2F79B9",
    bgColor: "#EAF5FF"
  },
  {
    id: "cat4",
    name: "Design",
    coursesCount: "62 Courses",
    icon: "palette-outline",
    color: "#E76F51",
    bgColor: "#FFF2EE"
  },
  {
    id: "cat5",
    name: "Mobile Dev",
    coursesCount: "54 Courses",
    icon: "cellphone",
    color: "#00A6A6",
    bgColor: "#E6F7F7"
  },
  {
    id: "cat6",
    name: "Exam Prep",
    coursesCount: "73 Courses",
    icon: "book-open-outline",
    color: "#9C27B0",
    bgColor: "#FBEAFE"
  }
];

const defaultExpertMentors = [
  {
    id: "m1",
    name: "Rahul Sharma",
    role: "TCM Information Tech Mentor",
    badge: "TCM Mentor",
    badgeBg: "#F0EDFF",
    badgeColor: "#5B3CF5",
    cardBg: "#F6F4FF",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    verified: true,
    rating: "5.0",
    reviews: "1",
    experience: "5+ Yrs Exp"
  }
];

function safeImageUri(url, fallback = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=640&q=80") {
  if (!url || typeof url !== "string") return fallback;
  if (url.startsWith("blob:") || url.includes("blob:http")) return fallback;
  return url;
}

export default function LearnScreen({ learn = {}, user = {}, session, onOpenSidebar, onNotifications, onSelectUser, onSelectCourse, onOpenContinueLearning, onOpenPopularCourses, onOpenAllMentors, onOpenExploreCategory }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [allMentorsModalOpen, setAllMentorsModalOpen] = useState(false);

  const safeLearn = learn || {};
  const heroBanners = safeLearn.heroBanners?.length ? safeLearn.heroBanners : defaultHeroBanners;
  const topCategories = safeLearn.topCategories?.length ? safeLearn.topCategories : defaultTopCategories;
  const expertMentors = safeLearn.expertMentors?.length ? safeLearn.expertMentors : defaultExpertMentors;
  const initialPopular = Array.isArray(safeLearn.popularCourses) ? safeLearn.popularCourses : defaultPopularCourses;

  const [popularCourses, setPopularCourses] = useState(initialPopular);
  const [continueLearningList, setContinueLearningList] = useState(
    safeLearn.continueLearning?.length ? safeLearn.continueLearning : defaultContinueLearning
  );

  useEffect(() => {
    if (Array.isArray(learn?.popularCourses)) {
      setPopularCourses(learn.popularCourses);
    }
  }, [learn?.popularCourses]);

  useEffect(() => {
    loadRealContinueLearningData();
  }, [session?.token]);

  async function loadRealContinueLearningData() {
    try {
      if (session?.token) {
        const data = await getContinueLearningDetails(session.token);
        if (data && data.courseTitle) {
          setContinueLearningList([
            {
              id: data.courseId || "c_active",
              title: data.courseTitle,
              subtitle: `Mentor: ${data.mentorName || "Aayushmann C."} • Live Batch Ready`,
              progress: data.userProgress?.courseProgress || 0,
              icon: "code-tags",
              iconColor: "#5B3CF5",
              bgColor: "#F0EDFF"
            }
          ]);
        }
      }
    } catch (e) {}
  }

  const continueLearning = continueLearningList;

  function toggleBookmark(courseId) {
    setPopularCourses((prev) =>
      prev.map((item) => (item.id === courseId ? { ...item, bookmarked: !item.bookmarked } : item))
    );
  }

  function handleEnroll(course) {
    Alert.alert("Enrollment Confirmation", `Would you like to enroll in "${course.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Enroll Now",
        onPress: () => Alert.alert("Enrolled", `Successfully enrolled in ${course.title}. Happy learning!`)
      }
    ]);
  }

  function handleScrollBanner(event) {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const activeIndex = Math.round(offset / slideSize);
    setActiveBannerIndex(activeIndex);
  }

  const filteredCourses = popularCourses.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.title?.toLowerCase().includes(q) || c.tags?.toLowerCase().includes(q);
  });

  return (
    <View style={styles.container}>
      {/* 1. Top Header Bar matching reference UI */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onOpenSidebar} style={styles.menuBtn}>
            <Feather name="menu" size={22} color="#181725" />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.screenTitle}>Learn</Text>
            <Text style={styles.screenSub}>Explore courses and grow your skills</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable onPress={() => Alert.alert("Search", "Type in the search bar below to search courses.")} style={styles.headerIconBtn}>
            <Feather name="search" size={18} color="#181725" />
          </Pressable>
          <Pressable onPress={onNotifications || (() => Alert.alert("Notifications", "You have learning updates."))} style={styles.headerIconBtn}>
            <Feather name="bell" size={18} color="#181725" />
            <View style={styles.notifDot} />
          </Pressable>
        </View>
      </View>

      {/* 2. Floating Search Bar with Filter */}
      <View style={styles.searchBoxCard}>
        <Feather name="search" size={18} color="#8A879F" style={{ marginRight: 10 }} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for courses, topics or skills..."
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

      {/* 3. Hero Carousel Banner */}
      {heroBanners.length > 0 ? (
        <View style={styles.bannerContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScrollBanner}
            scrollEventThrottle={16}
          >
            {heroBanners.map((banner) => (
              <View key={banner.id} style={styles.bannerCard}>
                <View style={styles.bannerLeft}>
                  <View style={styles.newBatchPill}>
                    <Text style={styles.newBatchText}>{banner.tag}</Text>
                  </View>

                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>

                  <Pressable
                    onPress={() => (onSelectCourse ? onSelectCourse(banner.id) : Alert.alert(banner.title.replace("\n", " "), "Opening course details..."))}
                    style={styles.exploreBtn}
                  >
                    <Text style={styles.exploreBtnText}>{banner.buttonText}</Text>
                  </Pressable>
                </View>

                <View style={styles.bannerRight}>
                  <Image source={{ uri: safeImageUri(banner.image) }} style={styles.bannerGraphic} />
                  <View style={styles.techBadgeReact}>
                    <MaterialCommunityIcons name="react" size={18} color="#00D8FF" />
                  </View>
                  <View style={styles.techBadgeNode}>
                    <MaterialCommunityIcons name="nodejs" size={18} color="#68A063" />
                  </View>
                  <View style={styles.techBadgeJs}>
                    <Text style={styles.techBadgeJsText}>JS</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Carousel Pagination Dots */}
          <View style={styles.dotsRow}>
            {heroBanners.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeBannerIndex && styles.activeDot]} />
            ))}
          </View>
        </View>
      ) : null}

      {/* 3.5. Explore TCM Section (Matching Reference Screenshot) */}
      <View style={styles.exploreTcmSection}>
        <Text style={styles.exploreTcmHeaderTitle}>Explore TCM</Text>
        <View style={styles.exploreTcmGrid}>
          {/* 1. TCM Inform Tech */}
          <Pressable
            onPress={() => (onOpenExploreCategory ? onOpenExploreCategory("inform") : Alert.alert("TCM Inform Tech", "Opening Live Classes, Notes & Assignments..."))}
            style={({ pressed }) => [styles.exploreTcmCard, pressed && styles.pressed]}
          >
            <View style={styles.exploreTcmHeaderRow}>
              <View style={[styles.exploreIconBox, { backgroundColor: "#EEECFE" }]}>
                <MaterialCommunityIcons name="play" size={20} color="#5B3CF5" />
              </View>
              <Feather name="chevron-right" size={16} color="#9E9EB2" />
            </View>
            <Text style={styles.exploreTcmTitle}>TCM Inform Tech</Text>
            <Text style={styles.exploreTcmSub}>Live Classes, Notes, Assignments & More</Text>
          </Pressable>

          {/* 2. TCM Academy */}
          <Pressable
            onPress={() => (onOpenExploreCategory ? onOpenExploreCategory("academy") : Alert.alert("TCM Academy", "Opening Premium Courses & Specialized Programs..."))}
            style={({ pressed }) => [styles.exploreTcmCard, pressed && styles.pressed]}
          >
            <View style={styles.exploreTcmHeaderRow}>
              <View style={[styles.exploreIconBox, { backgroundColor: "#EAF7EC" }]}>
                <MaterialCommunityIcons name="school" size={20} color="#2E7D32" />
              </View>
              <Feather name="chevron-right" size={16} color="#9E9EB2" />
            </View>
            <Text style={styles.exploreTcmTitle}>TCM Academy</Text>
            <Text style={styles.exploreTcmSub}>Premium Courses, Specialized Programs</Text>
          </Pressable>

          {/* 3. TCM Government */}
          <Pressable
            onPress={() => (onOpenExploreCategory ? onOpenExploreCategory("govt") : Alert.alert("TCM Government", "Opening UPSC, SSC, Banking & Govt Exams..."))}
            style={({ pressed }) => [styles.exploreTcmCard, pressed && styles.pressed]}
          >
            <View style={styles.exploreTcmHeaderRow}>
              <View style={[styles.exploreIconBox, { backgroundColor: "#FFF8EC" }]}>
                <MaterialCommunityIcons name="bank" size={20} color="#E7A900" />
              </View>
              <Feather name="chevron-right" size={16} color="#9E9EB2" />
            </View>
            <Text style={styles.exploreTcmTitle}>TCM Government</Text>
            <Text style={styles.exploreTcmSub}>UPSC, SSC CGL, Banking & Govt Exams</Text>
          </Pressable>

          {/* 4. TCM Career */}
          <Pressable
            onPress={() => (onOpenExploreCategory ? onOpenExploreCategory("career") : Alert.alert("TCM Career", "Opening Internships, Jobs & Placements..."))}
            style={({ pressed }) => [styles.exploreTcmCard, pressed && styles.pressed]}
          >
            <View style={styles.exploreTcmHeaderRow}>
              <View style={[styles.exploreIconBox, { backgroundColor: "#EBF5FF" }]}>
                <MaterialCommunityIcons name="briefcase" size={20} color="#2F79B9" />
              </View>
              <Feather name="chevron-right" size={16} color="#9E9EB2" />
            </View>
            <Text style={styles.exploreTcmTitle}>TCM Career</Text>
            <Text style={styles.exploreTcmSub}>Internships, Jobs, Placements</Text>
          </Pressable>
        </View>
      </View>

      {/* 4. Continue Learning Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitleText}>Continue Learning</Text>
        <Pressable onPress={() => (onOpenContinueLearning ? onOpenContinueLearning() : Alert.alert("Continue Learning", "Showing all active enrolled courses."))}>
          <Text style={styles.viewAllText}>View All</Text>
        </Pressable>
      </View>

      {continueLearning && continueLearning.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
          {continueLearning.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => (onOpenContinueLearning ? onOpenContinueLearning() : onSelectCourse ? onSelectCourse(item.id) : null)}
              style={styles.continueCard}
            >
              <View style={styles.continueTopRow}>
                <View style={[styles.continueIconWrap, { backgroundColor: item.bgColor || "#F0EDFF" }]}>
                  <MaterialCommunityIcons name={item.icon || "book-open"} size={22} color={item.iconColor || "#5B3CF5"} />
                </View>
                <View style={styles.playCircleBtn}>
                  <Feather name="play" size={11} color="#5B3CF5" style={{ marginLeft: 1 }} />
                </View>
              </View>

              <Text style={styles.continueTitle} numberOfLines={2}>{item.title}</Text>

              <View style={styles.progressContainer}>
                <View style={styles.progressTrackBg}>
                  <View style={[styles.progressFillBar, { width: `${item.progress}%` }]} />
                </View>
                <Text style={styles.progressPercentText}>{item.progress}% Completed</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContinueCard}>
          <View style={styles.emptyIconCircle}>
            <MaterialCommunityIcons name="book-open-outline" size={24} color="#5B3CF5" />
          </View>
          <View style={styles.emptyTextCol}>
            <Text style={styles.emptyContinueTitle}>No Learning Started Yet</Text>
            <Text style={styles.emptyContinueSub}>You haven't enrolled in any active course yet. Explore courses below to start!</Text>
          </View>
        </View>
      )}

      {/* 5. Popular Courses Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitleText}>Popular Courses</Text>
        <Pressable onPress={() => (onOpenPopularCourses ? onOpenPopularCourses() : Alert.alert("Popular Courses", "Showing all popular featured courses."))}>
          <Text style={styles.viewAllText}>View All</Text>
        </Pressable>
      </View>

      {filteredCourses && filteredCourses.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
          {filteredCourses.map((course) => (
            <Pressable key={course.id} onPress={() => (onSelectCourse ? onSelectCourse(course.id) : handleEnroll(course))} style={styles.popularCard}>
              <View style={styles.popularImageWrap}>
                <Image source={{ uri: safeImageUri(course.image) }} style={styles.popularImage} />
                <Pressable onPress={() => toggleBookmark(course.id)} style={styles.bookmarkBadge}>
                  <Feather name="bookmark" size={14} color={course.bookmarked ? "#5B3CF5" : "#181725"} fill={course.bookmarked ? "#5B3CF5" : "none"} />
                </Pressable>
              </View>

              <View style={styles.popularBody}>
                <Text style={styles.popularTitle} numberOfLines={2}>{course.title}</Text>
                <Text style={styles.popularTags} numberOfLines={1}>{course.tags}</Text>

                <View style={styles.popularMetaRow}>
                  <View style={styles.metaRating}>
                    <FontAwesome name="star" size={12} color="#FFB800" />
                    <Text style={styles.ratingValText}>{course.rating}</Text>
                    <Text style={styles.reviewsText}>({course.reviews})</Text>
                  </View>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.lessonsText}>{course.lessons}</Text>
                </View>

                <Pressable onPress={() => (onSelectCourse ? onSelectCourse(course.id) : handleEnroll(course))} style={styles.enrollBtn}>
                  <Text style={styles.enrollBtnText}>Enroll Now</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyPopularCard}>
          <MaterialCommunityIcons name="magnify-remove-outline" size={32} color="#7C7C9A" />
          <Text style={styles.emptyPopularTitle}>No Courses Found</Text>
          <Text style={styles.emptyPopularSub}>No courses match "{searchQuery}". Try searching for 'Python', 'Web Dev', or 'AI'.</Text>
          <Pressable onPress={() => setSearchQuery("")} style={styles.clearSearchBtn}>
            <Text style={styles.clearSearchText}>Clear Search</Text>
          </Pressable>
        </View>
      )}

      {/* 6. Our Expert Mentors Carousel Section */}
      {expertMentors.length > 0 ? (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitleText}>Our Expert Mentors</Text>
            <Pressable onPress={() => (onOpenAllMentors ? onOpenAllMentors() : setAllMentorsModalOpen(true))}>
              <Text style={styles.viewAllText}>View All Mentors ›</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
            {expertMentors.map((mentor) => (
              <View key={mentor.id} style={[styles.mentorCard, { backgroundColor: mentor.cardBg || "#F6F4FF" }]}>
                <View style={styles.mentorTopRow}>
                  <View style={styles.mentorAvatarWrap}>
                    <Image source={{ uri: safeImageUri(mentor.avatarUrl) }} style={styles.mentorAvatarImg} />
                    <View style={styles.onlineDot} />
                  </View>
                  <View style={styles.mentorInfoCol}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={styles.mentorCardName} numberOfLines={1}>{mentor.name}</Text>
                      <MaterialCommunityIcons name="check-decagram" size={13} color="#5B3CF5" style={{ marginLeft: 2 }} />
                    </View>
                    <Text style={styles.mentorCardRole} numberOfLines={1}>{mentor.role}</Text>
                    <View style={[styles.mentorBadgePill, { backgroundColor: mentor.badgeBg || "#F0EDFF" }]}>
                      <Text style={[styles.mentorBadgeText, { color: mentor.badgeColor || "#5B3CF5" }]}>{mentor.badge}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.mentorMetaRow}>
                  <View style={styles.mentorRatingRow}>
                    <FontAwesome name="star" size={11} color="#FFB800" />
                    <Text style={styles.mentorRatingVal}>{mentor.rating}</Text>
                    <Text style={styles.mentorReviewsVal}>({mentor.reviews})</Text>
                  </View>
                  <Text style={styles.mentorExpText}>{mentor.experience}</Text>
                </View>

                <Pressable
                  onPress={() => (onSelectUser ? onSelectUser({ id: mentor.id, name: mentor.name, avatarUrl: mentor.avatarUrl, role: "mentor" }) : Alert.alert(mentor.name, mentor.role))}
                  style={styles.viewProfileBtn}
                >
                  <Text style={styles.viewProfileBtnText}>View Profile</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </>
      ) : null}

      {/* View All Mentors Modal */}
      <ViewAllMentorsModal
        visible={allMentorsModalOpen}
        session={session || { token: user?.token }}
        onClose={() => setAllMentorsModalOpen(false)}
        onSelectMentor={(mId) => {
          if (onSelectUser) onSelectUser({ id: mId, role: "mentor" });
        }}
      />

      {/* 7. Top Categories Section */}
      {topCategories.length > 0 ? (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitleText}>Top Categories</Text>
            <Pressable onPress={() => Alert.alert("Top Categories", "Browse all 18 learning categories.")}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
            {topCategories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => Alert.alert("Category Selected", `Browsing ${cat.name} courses...`)}
                style={styles.categoryCard}
              >
                <View style={[styles.categoryIconWrap, { backgroundColor: cat.bgColor || "#F0EDFF" }]}>
                  <MaterialCommunityIcons name={cat.icon || "code-tags"} size={22} color={cat.color || "#5B3CF5"} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryCount}>{cat.coursesCount}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 30
  },

  // 1. Top Header Bar
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  titleWrap: {},
  screenTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: "#181725"
  },
  screenSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C7C9A",
    marginTop: 1
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F0EFFF",
    position: "relative",
    ...shadow.soft
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

  // 2. Search Box Card
  searchBoxCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
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

  // 3. Hero Carousel Banner
  bannerContainer: {
    marginBottom: 22
  },
  bannerCard: {
    width: width - 40,
    backgroundColor: "#F0EDFF",
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E5E1FF"
  },
  bannerLeft: {
    flex: 1.1,
    paddingRight: 8
  },
  newBatchPill: {
    alignSelf: "flex-start",
    backgroundColor: "#E4DCFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8
  },
  newBatchText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#5B3CF5",
    letterSpacing: 0.6
  },
  bannerTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#181725",
    lineHeight: 20,
    marginBottom: 4
  },
  bannerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#52506E",
    marginBottom: 14,
    lineHeight: 16
  },
  exploreBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    ...shadow.soft
  },
  exploreBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#FFFFFF"
  },

  bannerRight: {
    flex: 0.9,
    height: 125,
    position: "relative",
    alignItems: "center",
    justifyContent: "center"
  },
  bannerGraphic: {
    width: "100%",
    height: "100%",
    borderRadius: 14
  },
  techBadgeReact: {
    position: "absolute",
    top: -6,
    left: -6,
    backgroundColor: "#FFFFFF",
    padding: 5,
    borderRadius: 10,
    ...shadow.soft
  },
  techBadgeNode: {
    position: "absolute",
    bottom: -6,
    right: -6,
    backgroundColor: "#FFFFFF",
    padding: 5,
    borderRadius: 10,
    ...shadow.soft
  },
  techBadgeJs: {
    position: "absolute",
    bottom: 8,
    left: -8,
    backgroundColor: "#F7DF1E",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6
  },
  techBadgeJsText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#000000"
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C8C4E6"
  },
  activeDot: {
    width: 18,
    backgroundColor: "#5B3CF5"
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 4
  },
  sectionTitleText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725"
  },
  viewAllText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: "#5B3CF5"
  },

  horizontalScrollContent: {
    paddingRight: 10,
    marginBottom: 20
  },

  // 4. Continue Learning Cards
  continueCard: {
    width: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    justifyContent: "space-between",
    ...shadow.soft
  },
  continueTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  continueIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  playCircleBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center"
  },
  continueTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725",
    marginBottom: 12,
    lineHeight: 17
  },
  progressContainer: {},
  progressTrackBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#EFEFFF",
    overflow: "hidden",
    marginBottom: 6
  },
  progressFillBar: {
    height: "100%",
    backgroundColor: "#5B3CF5",
    borderRadius: 3
  },
  progressPercentText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: "#7C7C9A"
  },

  // Empty State - Continue Learning
  emptyContinueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    gap: 14,
    ...shadow.soft
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center"
  },
  emptyTextCol: {
    flex: 1
  },
  emptyContinueTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#181725"
  },
  emptyContinueSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 2
  },

  // 5. Popular Courses Cards
  popularCard: {
    width: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 10,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  popularImageWrap: {
    position: "relative",
    width: "100%",
    height: 115,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10
  },
  popularImage: {
    width: "100%",
    height: "100%"
  },
  bookmarkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center"
  },
  popularBody: {
    paddingHorizontal: 2
  },
  popularTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725",
    marginBottom: 4,
    lineHeight: 17
  },
  popularTags: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginBottom: 8
  },
  popularMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12
  },
  metaRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  ratingValText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#181725"
  },
  reviewsText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A"
  },
  metaDot: {
    color: "#7C7C9A",
    fontSize: 10
  },
  lessonsText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#7C7C9A"
  },
  enrollBtn: {
    borderWidth: 1,
    borderColor: "#E5E1FF",
    backgroundColor: "#F8F7FF",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center"
  },
  enrollBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#5B3CF5"
  },

  // Empty State - Popular Courses
  emptyPopularCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    marginBottom: 20,
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

  // 6. Top Categories Cards
  categoryCard: {
    width: 108,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginRight: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  categoryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  categoryName: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725",
    textAlign: "center",
    marginBottom: 2
  },
  categoryCount: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    textAlign: "center"
  },

  // Expert Mentors Carousel
  mentorCard: {
    width: 175,
    borderRadius: 18,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    justifyContent: "space-between",
    ...shadow.soft
  },
  mentorTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10
  },
  mentorAvatarWrap: {
    position: "relative"
  },
  mentorAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2E7D32",
    borderWidth: 1.5,
    borderColor: "#FFFFFF"
  },
  mentorInfoCol: {
    flex: 1
  },
  mentorCardName: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725"
  },
  mentorCardRole: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: "#7C7C9A",
    marginTop: 1,
    marginBottom: 4
  },
  mentorBadgePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  mentorBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 8
  },
  mentorMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  mentorRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },
  mentorRatingVal: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#181725"
  },
  mentorReviewsVal: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: "#7C7C9A"
  },
  mentorExpText: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: "#7C7C9A"
  },
  viewProfileBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#5B3CF5",
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center"
  },
  viewProfileBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#5B3CF5"
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },

  // Explore TCM Styles
  exploreTcmSection: {
    marginVertical: 14,
    paddingHorizontal: 2
  },
  exploreTcmHeaderTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725",
    marginBottom: 12
  },
  exploreTcmGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10
  },
  exploreTcmCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  exploreTcmHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  exploreIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  exploreTcmTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725",
    marginBottom: 3
  },
  exploreTcmSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    lineHeight: 14
  }
});
