import { useState, useRef, useEffect } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Feather, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { getCategoryCourses, getAllMentors } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

const categoryDetails = {
  inform: {
    id: "inform",
    badge: "FEATURED CATEGORY",
    badgeBg: "#EEECFE",
    badgeColor: "#5B3CF5",
    title: "Last Class Information Tech",
    subtitle: "Full Stack Web Dev, Python, AI/ML & DevOps",
    categoryKey: "Last Class Information Tech",
    icon: "play",
    iconBg: "#EEECFE",
    iconColor: "#5B3CF5",
    heroImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000",
    banners: [
      {
        id: "b_inf1",
        tag: "LIVE BATCH",
        title: "Full Stack MERN\nMastery Batch",
        subtitle: "React • Node.js • Express • MongoDB",
        buttonText: "Explore Batch →",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80",
        cardBg: "#F0EDFF",
        borderColor: "#E5E1FF"
      },
      {
        id: "b_inf2",
        tag: "DEVOPS & CLOUD",
        title: "Docker, K8s &\nAWS Masterclass",
        subtitle: "CI/CD • Kubernetes • Terraform",
        buttonText: "Join DevOps →",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
        cardBg: "#EBF5FF",
        borderColor: "#D6EAFF"
      }
    ]
  },
  academy: {
    id: "academy",
    badge: "ACADEMIC EXCELLENCE",
    badgeBg: "#EAF7EC",
    badgeColor: "#2E7D32",
    title: "Last Class Academy",
    subtitle: "NEET, JEE Main & Board Exam Preparation",
    icon: "school",
    iconBg: "#EAF7EC",
    iconColor: "#2E7D32",
    banners: [
      {
        id: "b_ac1",
        tag: "NEET LIVE",
        title: "NEET Ultimate\nCrash Course",
        subtitle: "Physics • Chemistry • Biology",
        buttonText: "Join NEET Batch →",
        image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
        cardBg: "#EAF7EC",
        borderColor: "#D2EBD5"
      }
    ]
  },
  govt: {
    id: "govt",
    badge: "GOVERNMENT EXAMS",
    badgeBg: "#FFF8EC",
    badgeColor: "#E7A900",
    title: "Last Class Government",
    subtitle: "UPSC, SSC CGL, Banking & Govt Exams",
    icon: "bank",
    iconBg: "#FFF8EC",
    iconColor: "#E7A900",
    banners: [
      {
        id: "b_gv1",
        tag: "UPSC CSE Target",
        title: "UPSC Civil Services\nFoundation Batch",
        subtitle: "GS Paper I-IV • CSAT • Essay",
        buttonText: "Join UPSC Batch →",
        image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80",
        cardBg: "#FFF8EC",
        borderColor: "#FEE8C6"
      }
    ]
  },
  career: {
    id: "career",
    badge: "CAREER & PLACEMENT",
    badgeBg: "#EBF5FF",
    badgeColor: "#2F79B9",
    title: "Last Class Career",
    subtitle: "Internships & Hiring Drives",
    icon: "briefcase",
    iconBg: "#EBF5FF",
    iconColor: "#2F79B9",
    banners: [
      {
        id: "b_cr1",
        tag: "PLACEMENT TRACK",
        title: "Last Class Placement\nTrack Batch",
        subtitle: "Tech Interviews • Hiring Partners",
        buttonText: "Apply Now →",
        image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=600&q=80",
        cardBg: "#EBF5FF",
        borderColor: "#D6EAFF"
      }
    ]
  }
};

export default function ExploreTcmCategoryScreen({ session, categoryKey = "inform", onBack, onSelectCourse, onSelectUser }) {
  const { theme } = useTheme();
  const cat = categoryDetails[categoryKey] || categoryDetails.inform;
  const [realCourses, setRealCourses] = useState([]);
  const [realMentors, setRealMentors] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  useEffect(() => {
    fetchCategoryRealCourses();
    fetchCategoryRealMentors();
  }, [session?.token, categoryKey]);

  async function fetchCategoryRealCourses() {
    setLoadingCourses(true);
    try {
      const res = await getCategoryCourses(session?.token, categoryKey);
      if (res && Array.isArray(res.courses)) {
        setRealCourses(res.courses);
      } else {
        setRealCourses([]);
      }
    } catch (err) {
      setRealCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }

  async function fetchCategoryRealMentors() {
    try {
      const res = await getAllMentors(session?.token);
      if (res && Array.isArray(res.mentors)) {
        setRealMentors(res.mentors);
      } else {
        setRealMentors([]);
      }
    } catch (err) {
      setRealMentors([]);
    }
  }

  const categoryMentors = realMentors.filter((m) => {
    const catStr = String(m.category || "").toLowerCase();
    const roleStr = String(m.role || "").toLowerCase();
    const bioStr = String(m.bio || "").toLowerCase();
    const nameStr = String(m.name || "").toLowerCase();
    const key = String(categoryKey || "").toLowerCase();

    if (key === "inform") {
      return (
        catStr.includes("inform") ||
        catStr.includes("tech") ||
        catStr.includes("it") ||
        roleStr.includes("developer") ||
        roleStr.includes("tech") ||
        roleStr.includes("software") ||
        roleStr.includes("frontend") ||
        roleStr.includes("backend") ||
        roleStr.includes("fullstack") ||
        roleStr.includes("engineer") ||
        roleStr.includes("architect") ||
        roleStr.includes("code") ||
        bioStr.includes("tech") ||
        bioStr.includes("code") ||
        nameStr.includes("tech")
      );
    }
    if (key === "academy") {
      return (
        catStr.includes("academy") ||
        catStr.includes("academic") ||
        roleStr.includes("neet") ||
        roleStr.includes("jee") ||
        roleStr.includes("physics") ||
        roleStr.includes("chemistry") ||
        roleStr.includes("biology") ||
        roleStr.includes("math") ||
        roleStr.includes("teacher") ||
        roleStr.includes("faculty")
      );
    }
    if (key === "govt") {
      return (
        catStr.includes("govt") ||
        catStr.includes("government") ||
        roleStr.includes("upsc") ||
        roleStr.includes("ssc") ||
        roleStr.includes("civil") ||
        roleStr.includes("ias") ||
        roleStr.includes("bank")
      );
    }
    if (key === "career") {
      return (
        catStr.includes("career") ||
        catStr.includes("placement") ||
        roleStr.includes("placement") ||
        roleStr.includes("hr") ||
        roleStr.includes("hiring")
      );
    }
    return catStr.includes(key) || roleStr.includes(key);
  });

  function handleScrollBanner(event) {
    const slide = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
    if (slide !== activeBannerIndex && slide >= 0 && slide < (cat.banners?.length || 1)) {
      setActiveBannerIndex(slide);
    }
  }

  const themedSurface = { backgroundColor: theme.cardBg, borderColor: theme.border };
  const themedSoftSurface = {
    backgroundColor: theme.isDark ? theme.inputBg || "#131927" : "#F8F7FF",
    borderColor: theme.border
  };
  const themedBadgeSurface = { backgroundColor: theme.badgeBg, borderColor: theme.border };
  const accentColor = theme.isDark ? theme.primaryDark || theme.primary : cat.iconColor;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Standardized App Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderBottomColor: theme.border, position: "relative", justifyContent: "center", minHeight: 48 }]}>
        <Pressable
          onPress={() => {
            if (onBack) {
              onBack();
            } else if (typeof window !== "undefined" && window.history && window.history.length > 1) {
              window.history.back();
            }
          }}
          style={({ pressed }) => [
            {
              position: "absolute",
              left: 14,
              top: 10,
              zIndex: 10,
              padding: 4,
              flexDirection: "row",
              alignItems: "center"
            },
            pressed && styles.pressed
          ]}
        >
          <Feather name="chevron-left" size={24} color={theme.text} />
        </Pressable>

        <View style={{ position: "absolute", left: 0, right: 0, alignItems: "center", justifyContent: "center" }} pointerEvents="none">
          <Text numberOfLines={1} style={[styles.screenTitle, { color: theme.text, textAlign: "center" }]}>{cat.title}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 2. Reused Hero Carousel Banner (Matching LearnScreen Design) */}
        {cat.banners && cat.banners.length > 0 ? (
          <View style={styles.bannerContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScrollBanner}
              scrollEventThrottle={16}
            >
              {cat.banners.map((banner) => (
                <View
                  key={banner.id}
                  style={[
                    styles.bannerCard,
                    theme.isDark ? themedSurface : { backgroundColor: banner.cardBg, borderColor: banner.borderColor }
                  ]}
                >
                  <View style={styles.bannerLeft}>
                    <View style={[styles.newBatchPill, theme.isDark ? themedBadgeSurface : { backgroundColor: cat.badgeBg }]}>
                      <Text style={[styles.newBatchText, { color: theme.isDark ? accentColor : cat.badgeColor }]}>{banner.tag}</Text>
                    </View>

                    <Text style={[styles.bannerTitle, { color: theme.text }]}>{banner.title}</Text>
                    <Text style={[styles.bannerSubtitle, { color: theme.subtext }]}>{banner.subtitle}</Text>

                    <Pressable
                      onPress={() => (onSelectCourse ? onSelectCourse(banner.id) : Alert.alert(banner.title.replace("\n", " "), "Opening specialized batch details..."))}
                      style={[styles.exploreBtn, { backgroundColor: theme.isDark ? theme.primary : cat.iconColor }]}
                    >
                      <Text style={styles.exploreBtnText}>{banner.buttonText}</Text>
                    </Pressable>
                  </View>

                  <View style={styles.bannerRight}>
                    <Image source={{ uri: banner.image }} style={styles.bannerGraphic} />
                    <View style={[styles.techBadgeReact, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                      <MaterialCommunityIcons name="star-decagram" size={18} color="#00D8FF" />
                    </View>
                    <View style={[styles.techBadgeNode, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                      <MaterialCommunityIcons name="lightning-bolt" size={18} color="#FFB800" />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Carousel Pagination Dots */}
            <View style={styles.dotsRow}>
              {cat.banners.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: theme.isDark ? "#334155" : "#C8C4E6" },
                    i === activeBannerIndex && [styles.activeDot, { backgroundColor: theme.isDark ? theme.primary : cat.iconColor }]
                  ]}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* 3. Specialized Courses Section - REAL DATA OR COMING SOON FALLBACK */}
        {realCourses.length > 0 ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Featured Real Courses & Batches</Text>
              <Text style={[styles.totalCountText, { color: theme.subtext }]}>{realCourses.length} Live Available</Text>
            </View>

            <View style={styles.coursesGrid}>
              {realCourses.map((course) => (
                <Pressable
                  key={course.id}
                  onPress={() => (onSelectCourse ? onSelectCourse(course.id) : Alert.alert(course.title, "Opening course details..."))}
                  style={({ pressed }) => [styles.courseCard, themedSurface, pressed && styles.pressed]}
                >
                  <Image source={{ uri: course.image }} style={styles.courseImage} />
                  <View style={styles.courseBody}>
                    <View style={styles.ratingRow}>
                      <FontAwesome name="star" size={12} color="#FFB800" />
                      <Text style={[styles.ratingText, { color: theme.text }]}>{course.rating}</Text>
                      <Text style={[styles.reviewsText, { color: theme.subtext }]}>({course.reviews})</Text>
                      <View style={[styles.lessonsBadge, { backgroundColor: theme.badgeBg }]}>
                        <Text style={[styles.lessonsText, { color: theme.primary }]}>{course.lessons}</Text>
                      </View>
                    </View>
                    <Text style={[styles.courseTitle, { color: theme.text }]} numberOfLines={2}>{course.title}</Text>
                    <Text style={[styles.courseTags, { color: theme.subtext }]} numberOfLines={1}>{course.tags}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <View style={[styles.emptyCoursesCard, themedSoftSurface]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: theme.badgeBg }]}>
              <MaterialCommunityIcons name="book-open-page-variant-outline" size={30} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Live Courses Published Yet</Text>
            <Text style={[styles.emptySub, { color: theme.subtext }]}>
              Mentors have not published live courses in {cat.title} yet.
            </Text>
          </View>
        )}

        {/* 4. Dedicated Real Category Mentors Section */}
        <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{cat.title} Mentors</Text>
          <Text style={[styles.totalCountText, { color: theme.subtext }]}>{categoryMentors.length} Available</Text>
        </View>

        {categoryMentors.length > 0 ? (
          <View style={styles.mentorsRow}>
            {categoryMentors.map((mentor) => (
              <Pressable
                key={mentor.id || mentor._id}
                onPress={() => (onSelectUser ? onSelectUser({ id: mentor.id || mentor._id, name: mentor.name, role: mentor.role }) : Alert.alert(mentor.name, mentor.role || "Mentor"))}
                style={({ pressed }) => [styles.mentorCard, themedSurface, pressed && styles.pressed]}
              >
                <Image source={{ uri: mentor.avatar || mentor.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200" }} style={styles.mentorAvatar} />
                <View style={styles.mentorContent}>
                  <Text style={[styles.mentorName, { color: theme.text }]}>{mentor.name}</Text>
                  <Text style={[styles.mentorRole, { color: theme.subtext }]}>{mentor.role || "Mentor"}</Text>
                  <View style={styles.mentorMeta}>
                    <View style={styles.ratingRow}>
                      <FontAwesome name="star" size={11} color="#FFB800" />
                      <Text style={[styles.ratingText, { color: theme.text }]}>{mentor.rating || "4.9"}</Text>
                    </View>
                    <Text style={[styles.expText, { color: theme.primary }]}>{mentor.exp || mentor.experience || "Verified Mentor"}</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color="#9E9EB2" />
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyCoursesCard, themedSoftSurface, { marginTop: 6 }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: theme.badgeBg }]}>
              <MaterialCommunityIcons name="account-search-outline" size={28} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Mentors Available</Text>
            <Text style={[styles.emptySub, { color: theme.subtext }]}>
              There are currently no active mentors listed under {cat.title}.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 0
  },

  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 100
  },
  pressed: {
    opacity: 0.7
  },
  screenTitle: {
    fontSize: 19,
    fontFamily: fonts.semiBold,
    color: "#181725"
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center"
  },
  titleWrap: {
    flex: 1,
    marginLeft: 10
  },
  badgePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 9
  },
  screenTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725"
  },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },

  // Ticker Marquee Announcement Bar
  tickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  tickerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8
  },
  tickerBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    color: "#5B3CF5",
    marginLeft: 3
  },
  tickerClip: {
    flex: 1,
    overflow: "hidden"
  },
  tickerText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#4A4A6A",
    width: width * 2
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 100,
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center"
  },

  // Hero Carousel Banner (Reused LearnScreen Design System)
  bannerContainer: {
    marginBottom: 18
  },
  bannerCard: {
    width: Math.min(width - 28, 560),
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    ...shadow.medium
  },
  bannerLeft: {
    flex: 1.1,
    paddingRight: 8
  },
  newBatchPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8
  },
  newBatchText: {
    fontFamily: fonts.bold,
    fontSize: 10,
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
    right: -6,
    backgroundColor: "#FFFFFF",
    padding: 5,
    borderRadius: 10,
    ...shadow.soft
  },
  techBadgeNode: {
    position: "absolute",
    bottom: -6,
    left: -6,
    backgroundColor: "#FFFFFF",
    padding: 5,
    borderRadius: 10,
    ...shadow.soft
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

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 4
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#181725"
  },
  totalCountText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#7C7C9A"
  },

  emptyCoursesCard: {
    backgroundColor: "#F8F7FF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEAFA",
    marginBottom: 16,
    ...shadow.soft
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEECFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#181725",
    marginBottom: 4,
    textAlign: "center"
  },
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    textAlign: "center",
    lineHeight: 16,
    maxWidth: "90%"
  },

  comingSoonCard: {
    width: 230,
    borderRadius: 18,
    overflow: "hidden",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E1FF",
    marginBottom: 16,
    ...shadow.soft
  },
  comingSoonImg: {
    width: "100%",
    height: 100
  },
  comingSoonBody: {
    padding: 12
  },
  comingSoonTagPill: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6
  },
  comingSoonTagText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "#5B3CF5"
  },
  comingSoonTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725",
    marginBottom: 4,
    lineHeight: 17
  },
  comingSoonSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#52506E",
    marginBottom: 6
  },
  comingSoonDate: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: "#7C7C9A",
    marginBottom: 10
  },
  notifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B3CF5",
    paddingVertical: 9,
    borderRadius: 10
  },
  notifyBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#FFFFFF"
  },

  coursesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 18
  },
  courseCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  courseImage: {
    width: "100%",
    height: 95
  },
  courseBody: {
    padding: 10
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4
  },
  ratingText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#181725",
    marginLeft: 3
  },
  reviewsText: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: "#7C7C9A",
    marginLeft: 2
  },
  lessonsBadge: {
    marginLeft: "auto",
    backgroundColor: "#F4F3FA",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4
  },
  lessonsText: {
    fontFamily: fonts.medium,
    fontSize: 8,
    color: "#5B3CF5"
  },
  courseTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725",
    lineHeight: 16,
    marginBottom: 2
  },
  courseTags: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A"
  },

  mentorsRow: {
    gap: 8,
    marginBottom: 20
  },
  mentorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  mentorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10
  },
  mentorContent: {
    flex: 1
  },
  mentorName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725"
  },
  mentorRole: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    marginTop: 1
  },
  mentorMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8
  },
  expText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: "#5B3CF5"
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  }
});
