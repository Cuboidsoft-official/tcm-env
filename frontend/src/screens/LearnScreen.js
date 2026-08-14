import { useState, useEffect } from "react";
import {
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
import ViewAllMentorsModal from "../components/ViewAllMentorsModal";
import AiRoadmapPlannerModal from "../components/AiRoadmapPlannerModal";
import TcmAiExamModal from "../components/TcmAiExamModal";
import { getContinueLearningDetails, saveExamResult } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";
import RazorpayPaymentModal from "../components/RazorpayPaymentModal";

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

const defaultContinueLearning = [];
const defaultPopularCourses = [];

const defaultTopCategories = [
  {
    id: "cat1",
    name: "Programming",
    coursesCount: "124 Courses",
    icon: "code-tags",
    color: "#0A6836",
    bgColor: "#E8F5E9"
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
    badgeBg: "#E8F5E9",
    badgeColor: "#0A6836",
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
  if (Platform.OS === "web" && url.startsWith("file://")) return fallback;
  return url;
}

export default function LearnScreen({ learn = {}, user = {}, session, onOpenSidebar, onNotifications, onSelectUser, onSelectCourse, onOpenContinueLearning, onOpenPopularCourses, onOpenAllMentors, onOpenExploreCategory, onOpenDiscoverPartners }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [allMentorsModalVisible, setAllMentorsModalVisible] = useState(false);
  const [roadmapModalVisible, setRoadmapModalVisible] = useState(false);
  const [selectedPaymentCourse, setSelectedPaymentCourse] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const safeLearn = learn || {};
  const heroBanners = safeLearn.heroBanners?.length ? safeLearn.heroBanners : defaultHeroBanners;
  const topCategories = safeLearn.topCategories?.length ? safeLearn.topCategories : defaultTopCategories;
  const expertMentors = safeLearn.expertMentors?.length ? safeLearn.expertMentors : defaultExpertMentors;
  const initialPopular = Array.isArray(safeLearn.popularCourses) ? safeLearn.popularCourses : defaultPopularCourses;

  const [popularCourses, setPopularCourses] = useState(initialPopular);
  const [aiExamModalVisible, setAiExamModalVisible] = useState(false);
  const [continueLearningList, setContinueLearningList] = useState(
    safeLearn.continueLearning?.length ? safeLearn.continueLearning : defaultContinueLearning
  );

  async function handleSaveExamResult(resultData) {
    try {
      const token = session?.token || user?.token;
      if (token) {
        await saveExamResult(token, resultData);
      }
    } catch (e) {
      console.error("Could not save exam result:", e);
    }
  }

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
              subtitle: `Mentor: ${data.mentorName || "Mentor"} • Live Batch Ready`,
              progress: data.userProgress?.courseProgress || 0,
              icon: "code-tags",
              iconColor: "#0A6836",
              bgColor: "#E8F5E9"
            }
          ]);
        } else {
          setContinueLearningList([]);
        }
      }
    } catch (e) {
      setContinueLearningList([]);
    }
  }

  const continueLearning = continueLearningList;

  function toggleBookmark(courseId) {
    setPopularCourses((prev) =>
      prev.map((item) => (item.id === courseId ? { ...item, bookmarked: !item.bookmarked } : item))
    );
  }

  function handleEnroll(course) {
    setSelectedPaymentCourse(course);
    setShowPaymentModal(true);
  }

  function handlePaymentComplete(course) {
    if (!course) return;
    setContinueLearningList((prev) => {
      const exists = prev.some((c) => c.id === course.id);
      if (exists) return prev;
      return [
        {
          id: course.id || `course_${Date.now()}`,
          title: course.title,
          subtitle: `Enrolled • ${course.category || "TCM Course"}`,
          progress: 5,
          icon: "book-open",
          iconColor: "#0A6836",
          bgColor: "#E8F5E9"
        },
        ...prev
      ];
    });
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

  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onOpenSidebar} style={[styles.menuBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Feather name="menu" size={22} color={theme.text} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={[styles.screenTitle, { color: theme.text }]}>Learn</Text>
            <Text style={[styles.screenSub, { color: theme.subtext }]}>Explore courses and grow your skills</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable onPress={() => Alert.alert("Search", "Type in the search bar below to search courses.")} style={[styles.headerIconBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Feather name="search" size={18} color={theme.text} />
          </Pressable>
          <Pressable onPress={onNotifications || (() => Alert.alert("Notifications", "You have learning updates."))} style={[styles.headerIconBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Feather name="bell" size={18} color={theme.text} />
            <View style={[styles.notifDot, { backgroundColor: theme.primary }]} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchBoxCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Feather name="search" size={18} color={theme.subtext} style={{ marginRight: 10 }} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for courses, topics or skills..."
          placeholderTextColor={theme.subtext}
          style={[styles.searchInput, { color: theme.text }]}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery("")} style={{ marginRight: 6 }}>
            <Feather name="x" size={16} color={theme.subtext} />
          </Pressable>
        ) : null}
        <Pressable onPress={() => Alert.alert("Filter Courses", "Filter by Category, Difficulty & Rating")} style={styles.filterBtn}>
          <MaterialCommunityIcons name="tune-variant" size={18} color="#181725" />
        </Pressable>
      </View>

      <Pressable
        onPress={() => setRoadmapModalVisible(true)}
        style={({ pressed }) => [styles.quickAiRoadmapBar, { backgroundColor: theme.isDark ? "#1E1B4B" : "#E8F5E9", borderColor: theme.border }, pressed && styles.pressed]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          <View style={styles.quickAiBadgeIcon}>
            <MaterialCommunityIcons name="map-marker-path" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 13.5, fontFamily: fonts.bold, color: theme.text }}>Plan My Learning Roadmap</Text>
            <Text numberOfLines={1} style={{ fontSize: 11, fontFamily: fonts.medium, color: theme.primary }}>Interactive AI Career & Budget Guide</Text>
          </View>
        </View>
        <View style={[styles.quickAiBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.primary }}>Start →</Text>
        </View>
      </Pressable>

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
              <View key={banner.id} style={[styles.bannerCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.bannerLeft}>
                  <View style={[styles.newBatchPill, { backgroundColor: theme.badgeBg }]}>
                    <Text style={[styles.newBatchText, { color: theme.badgeText || theme.primary }]}>{banner.tag}</Text>
                  </View>

                  <Text style={[styles.bannerTitle, { color: theme.text }]}>{banner.title}</Text>
                  <Text style={[styles.bannerSubtitle, { color: theme.subtext }]}>{banner.subtitle}</Text>

                  <Pressable
                    onPress={() => (onSelectCourse ? onSelectCourse(banner.id) : Alert.alert(banner.title.replace("\n", " "), "Opening course details..."))}
                    style={[styles.exploreBtn, { backgroundColor: theme.primary }]}
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

          <View style={styles.dotsRow}>
            {heroBanners.map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: theme.border }, i === activeBannerIndex && [styles.activeDot, { backgroundColor: theme.primary }]]} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.exploreTcmSection}>
        <Text style={[styles.exploreTcmHeaderTitle, { color: theme.text }]}>Explore TCM</Text>
        <View style={styles.exploreTcmGrid}>
          <Pressable
            onPress={() => (onOpenExploreCategory ? onOpenExploreCategory("inform") : Alert.alert("TCM Inform Tech", "Opening Live Classes, Notes & Assignments..."))}
            style={({ pressed }) => [styles.exploreTcmCard, { backgroundColor: theme.cardBg, borderColor: theme.border }, pressed && styles.pressed]}
          >
            <View style={styles.exploreTcmHeaderRow}>
              <View style={[styles.exploreIconBox, { backgroundColor: theme.isDark ? "#1E1B4B" : "#EEECFE" }]}>
                <MaterialCommunityIcons name="play" size={20} color={theme.isDark ? "#A78BFA" : "#0A6836"} />
              </View>
              <Feather name="chevron-right" size={16} color={theme.subtext} />
            </View>
            <Text style={[styles.exploreTcmTitle, { color: theme.text }]}>TCM Inform Tech</Text>
            <Text style={[styles.exploreTcmSub, { color: theme.subtext }]}>Live Classes, Notes, Assignments & More</Text>
          </Pressable>

          <Pressable
            onPress={() => (onOpenExploreCategory ? onOpenExploreCategory("academy") : Alert.alert("TCM Academy", "Opening Premium Courses & Specialized Programs..."))}
            style={({ pressed }) => [styles.exploreTcmCard, { backgroundColor: theme.cardBg, borderColor: theme.border }, pressed && styles.pressed]}
          >
            <View style={styles.exploreTcmHeaderRow}>
              <View style={[styles.exploreIconBox, { backgroundColor: theme.isDark ? "#064E3B" : "#EAF7EC" }]}>
                <MaterialCommunityIcons name="school" size={20} color={theme.isDark ? "#34D399" : "#2E7D32"} />
              </View>
              <Feather name="chevron-right" size={16} color={theme.subtext} />
            </View>
            <Text style={[styles.exploreTcmTitle, { color: theme.text }]}>TCM Academy</Text>
            <Text style={[styles.exploreTcmSub, { color: theme.subtext }]}>Premium Courses, Specialized Programs</Text>
          </Pressable>

          <Pressable
            onPress={() => (onOpenExploreCategory ? onOpenExploreCategory("govt") : Alert.alert("TCM Government", "Opening UPSC, SSC, Banking & Govt Exams..."))}
            style={({ pressed }) => [styles.exploreTcmCard, { backgroundColor: theme.cardBg, borderColor: theme.border }, pressed && styles.pressed]}
          >
            <View style={styles.exploreTcmHeaderRow}>
              <View style={[styles.exploreIconBox, { backgroundColor: theme.isDark ? "#78350F" : "#FFF8EC" }]}>
                <MaterialCommunityIcons name="bank" size={20} color={theme.isDark ? "#FBBF24" : "#E7A900"} />
              </View>
              <Feather name="chevron-right" size={16} color={theme.subtext} />
            </View>
            <Text style={[styles.exploreTcmTitle, { color: theme.text }]}>TCM Government</Text>
            <Text style={[styles.exploreTcmSub, { color: theme.subtext }]}>UPSC, SSC CGL, Banking & Govt Exams</Text>
          </Pressable>

          <Pressable
            onPress={() => (onOpenExploreCategory ? onOpenExploreCategory("career") : Alert.alert("TCM Career", "Opening Internships, Jobs & Placements..."))}
            style={({ pressed }) => [styles.exploreTcmCard, { backgroundColor: theme.cardBg, borderColor: theme.border }, pressed && styles.pressed]}
          >
            <View style={styles.exploreTcmHeaderRow}>
              <View style={[styles.exploreIconBox, { backgroundColor: theme.isDark ? "#1E3A8A" : "#EBF5FF" }]}>
                <MaterialCommunityIcons name="briefcase" size={20} color={theme.isDark ? "#60A5FA" : "#2F79B9"} />
              </View>
              <Feather name="chevron-right" size={16} color={theme.subtext} />
            </View>
            <Text style={[styles.exploreTcmTitle, { color: theme.text }]}>TCM Career</Text>
            <Text style={[styles.exploreTcmSub, { color: theme.subtext }]}>Internships, Jobs, Placements</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitleText, { color: theme.text }]}>Continue Learning</Text>
        <Pressable onPress={() => (onOpenContinueLearning ? onOpenContinueLearning() : Alert.alert("Continue Learning", "Showing all active enrolled courses."))}>
          <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
        </Pressable>
      </View>

      {continueLearning && continueLearning.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
          {continueLearning.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => (onOpenContinueLearning ? onOpenContinueLearning() : onSelectCourse ? onSelectCourse(item.id) : null)}
              style={[styles.continueCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            >
              <View style={styles.continueTopRow}>
                <View style={[styles.continueIconWrap, { backgroundColor: item.bgColor || (theme.isDark ? "#1E1B4B" : "#E8F5E9") }]}>
                  <MaterialCommunityIcons name={item.icon || "book-open"} size={22} color={item.iconColor || theme.primary} />
                </View>
                <View style={[styles.playCircleBtn, { backgroundColor: theme.isDark ? "#1E1B4B" : "#E8F5E9" }]}>
                  <Feather name="play" size={11} color={theme.primary} style={{ marginLeft: 1 }} />
                </View>
              </View>

              <Text style={[styles.continueTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>

              <View style={styles.progressContainer}>
                <View style={[styles.progressTrackBg, { backgroundColor: theme.isDark ? "#1E263B" : "#EFEFFF" }]}>
                  <View style={[styles.progressFillBar, { width: `${item.progress}%`, backgroundColor: theme.primary }]} />
                </View>
                <Text style={[styles.progressPercentText, { color: theme.subtext }]}>{item.progress}% Completed</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.emptyContinueCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={[styles.emptyIconCircle, { backgroundColor: theme.badgeBg }]}>
            <MaterialCommunityIcons name="book-open-outline" size={24} color={theme.primary} />
          </View>
          <View style={styles.emptyTextCol}>
            <Text style={[styles.emptyContinueTitle, { color: theme.text }]}>No Learning Started Yet</Text>
            <Text style={[styles.emptyContinueSub, { color: theme.subtext }]}>You haven't enrolled in any active course yet. Explore courses below to start!</Text>
          </View>
        </View>
      )}

      {/* ALL PARTNERS & COLLABORATORS CARD SECTION */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitleText, { color: theme.text }]}>All Partners & Collaborators</Text>
        <Pressable onPress={() => (onOpenDiscoverPartners ? onOpenDiscoverPartners() : Alert.alert("Discover Partners", "Opening all partners list..."))}>
          <Text style={[styles.viewAllText, { color: theme.primary }]}>View All →</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => (onOpenDiscoverPartners ? onOpenDiscoverPartners() : Alert.alert("Discover Partners", "Opening all partners list..."))}
        style={({ pressed }) => [
          styles.partnersCollabCard,
          { backgroundColor: theme.isDark ? "#064E3B25" : colors.lavender, borderColor: colors.lavenderLine },
          pressed && styles.pressed
        ]}
      >
        <View style={styles.collabHeaderInfo}>
          <View style={[styles.collabBadge, { backgroundColor: colors.mint }]}>
            <MaterialCommunityIcons name="shield-check" size={13} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={{ color: colors.primary, fontFamily: fonts.bold, fontSize: 10 }}>ACCREDITED NETWORK</Text>
          </View>
          <Text style={[styles.collabTitle, { color: theme.text }]}>Verified IT Labs, Colleges & Govt Institutions</Text>
          <Text style={[styles.collabSub, { color: theme.subtext }]}>
            Access high-speed computer labs, research facilities, government public hubs, and campus training centers near you.
          </Text>
        </View>

        <View style={styles.collabPreviewRow}>
          <View style={styles.avatarGroupRow}>
            <View style={[styles.miniAvatarCircle, { backgroundColor: "#0F172A" }]}>
              <Text style={styles.miniAvatarText}>FT</Text>
            </View>
            <View style={[styles.miniAvatarCircle, { backgroundColor: "#1E293B", marginLeft: -8 }]}>
              <Text style={styles.miniAvatarText}>CC</Text>
            </View>
            <View style={[styles.miniAvatarCircle, { backgroundColor: "#044324", marginLeft: -8 }]}>
              <Text style={styles.miniAvatarText}>DS</Text>
            </View>
            <View style={[styles.miniAvatarCircle, { backgroundColor: "#4F46E5", marginLeft: -8 }]}>
              <Text style={styles.miniAvatarText}>GP</Text>
            </View>
          </View>

          <View style={[styles.explorePartnersBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.explorePartnersBtnText}>Discover Partners →</Text>
          </View>
        </View>
      </Pressable>

      {/* TCM AI EXAMINATIONS & ADAPTIVE SKILL TESTS CARD */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitleText, { color: theme.text }]}>TCM AI Examinations</Text>
        <Pressable onPress={() => setAiExamModalVisible(true)}>
          <Text style={[styles.viewAllText, { color: theme.primary }]}>Take Exam →</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => setAiExamModalVisible(true)}
        style={({ pressed }) => [
          {
            backgroundColor: theme.cardBg,
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.border,
            marginBottom: 20,
            ...shadow.sm
          },
          pressed && { opacity: 0.92 }
        ]}
      >
        {/* Top Badge */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.badgeBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
            <MaterialCommunityIcons name="brain" size={14} color={theme.primary} />
            <Text style={{ color: theme.primary, fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 0.5 }}>
              AI ADAPTIVE EVALUATION
            </Text>
          </View>

          <View style={{ backgroundColor: theme.badgeBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
            <Text style={{ color: theme.primary, fontFamily: fonts.bold, fontSize: 10 }}>ON-DEMAND</Text>
          </View>
        </View>

        {/* Content Info */}
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: theme.text, marginBottom: 4 }}>
            TCM AI Skill Examinations & Scorecards
          </Text>
          <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: theme.subtext, lineHeight: 18 }}>
            Take personalized assessments tailored to your NEET, JEE, Govt Exams, Coding or Business skills with real-time AI hints & instant verified certificates.
          </Text>
        </View>

        {/* Action Row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.bg, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: theme.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="clock" size={14} color={theme.primary} />
            <Text style={{ fontSize: 12, fontFamily: fonts.semiBold, color: theme.text }}>
              6 Mins • 10 MCQs • AI Hints
            </Text>
          </View>

          <View style={{ backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: "#FFFFFF" }}>Start Exam</Text>
            <Feather name="arrow-right" size={13} color="#FFFFFF" />
          </View>
        </View>
      </Pressable>

      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitleText, { color: theme.text }]}>Popular Courses</Text>
        <Pressable onPress={() => (onOpenPopularCourses ? onOpenPopularCourses() : Alert.alert("Popular Courses", "Showing all popular featured courses."))}>
          <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
        </Pressable>
      </View>

      {filteredCourses && filteredCourses.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
          {filteredCourses.map((course) => (
            <Pressable key={course.id} onPress={() => (onSelectCourse ? onSelectCourse(course.id) : handleEnroll(course))} style={[styles.popularCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.popularImageWrap}>
                <Image source={{ uri: safeImageUri(course.image) }} style={styles.popularImage} />
                <Pressable onPress={() => toggleBookmark(course.id)} style={[styles.bookmarkBadge, { backgroundColor: theme.isDark ? "rgba(17,22,37,0.9)" : "rgba(255, 255, 255, 0.9)" }]}>
                  <Feather name="bookmark" size={14} color={course.bookmarked ? theme.primary : theme.text} fill={course.bookmarked ? theme.primary : "none"} />
                </Pressable>
              </View>

              <View style={styles.popularBody}>
                <Text style={[styles.popularTitle, { color: theme.text }]} numberOfLines={2}>{course.title}</Text>
                <Text style={[styles.popularTags, { color: theme.subtext }]} numberOfLines={1}>{course.tags}</Text>

                <View style={styles.popularMetaRow}>
                  <View style={styles.metaRating}>
                    <FontAwesome name="star" size={12} color="#FFB800" />
                    <Text style={[styles.ratingValText, { color: theme.text }]}>{course.rating}</Text>
                    <Text style={[styles.reviewsText, { color: theme.subtext }]}>({course.reviews})</Text>
                  </View>
                  <Text style={[styles.metaDot, { color: theme.subtext }]}>•</Text>
                  <Text style={[styles.lessonsText, { color: theme.subtext }]}>{course.lessons}</Text>
                </View>

                <Pressable onPress={() => handleEnroll(course)} style={[styles.enrollBtn, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
                  <Text style={[styles.enrollBtnText, { color: theme.primary }]}>Enroll Now</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.emptyPopularCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="magnify-remove-outline" size={32} color={theme.subtext} />
          <Text style={[styles.emptyPopularTitle, { color: theme.text }]}>No Courses Found</Text>
          <Text style={[styles.emptyPopularSub, { color: theme.subtext }]}>No courses match "{searchQuery}". Try searching for 'Python', 'Web Dev', or 'AI'.</Text>
          <Pressable onPress={() => setSearchQuery("")} style={[styles.clearSearchBtn, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
            <Text style={[styles.clearSearchText, { color: theme.primary }]}>Clear Search</Text>
          </Pressable>
        </View>
      )}

      {expertMentors.length > 0 ? (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitleText, { color: theme.text }]}>Our Expert Mentors</Text>
            <Pressable onPress={() => (onOpenAllMentors ? onOpenAllMentors() : setAllMentorsModalVisible(true))}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>View All Mentors ›</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
            {expertMentors.map((mentor) => {
              const mAvatar = (user?.role === "mentor" || user?.isMentor) ? (user.avatarUrl || mentor.avatarUrl) : mentor.avatarUrl;
              const hasRealAvatar = mAvatar && !mAvatar.includes("photo-1507003211169-0a1dd7228f2d") && !(Platform.OS === "web" && typeof mAvatar === "string" && mAvatar.startsWith("file://"));
              const initials = (mentor.name || "Mentor").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "M";

              return (
                <View key={mentor.id} style={[styles.mentorCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <View style={styles.mentorTopRow}>
                    <View style={styles.mentorAvatarWrap}>
                      {hasRealAvatar ? (
                        <Image source={{ uri: mAvatar }} style={styles.mentorAvatarImg} />
                      ) : (
                        <View style={[styles.mentorAvatarImg, { backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" }]}>
                          <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: "#FFFFFF" }}>{initials}</Text>
                        </View>
                      )}
                      <View style={styles.onlineDot} />
                    </View>

                    <View style={styles.mentorInfoCol}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Text style={[styles.mentorCardName, { color: theme.text, flexShrink: 1 }]} numberOfLines={1}>
                          {mentor.name}
                        </Text>
                        {mentor.isPremium ? (
                          <MaterialCommunityIcons name="check-decagram" size={13} color={theme.primary} />
                        ) : null}
                      </View>
                      <Text style={[styles.mentorCardRole, { color: theme.subtext }]} numberOfLines={1}>
                        {mentor.role}
                      </Text>
                      {mentor.badge ? (
                        <View style={[styles.mentorBadgePill, { backgroundColor: theme.badgeBg }]}>
                          <Text style={[styles.mentorBadgeText, { color: theme.primary }]} numberOfLines={1}>
                            {mentor.badge}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                <View style={styles.mentorMetaRow}>
                  <View style={styles.mentorRatingRow}>
                    <FontAwesome name="star" size={11} color="#FFB800" />
                    <Text style={[styles.mentorRatingVal, { color: theme.text }]}>{mentor.rating}</Text>
                    <Text style={[styles.mentorReviewsVal, { color: theme.subtext }]}>({mentor.reviews})</Text>
                  </View>
                  <Text style={[styles.mentorExpText, { color: theme.subtext }]}>{mentor.experience}</Text>
                </View>

                <Pressable
                  onPress={() => (onSelectUser ? onSelectUser({ id: mentor.id, name: mentor.name, avatarUrl: mentor.avatarUrl, role: "mentor" }) : Alert.alert(mentor.name, mentor.role))}
                  style={[styles.viewProfileBtn, { backgroundColor: theme.badgeBg, borderColor: theme.border, borderWidth: 1 }]}
                >
                  <Text style={[styles.viewProfileBtnText, { color: theme.primary }]}>View Profile</Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
        </>
      ) : null}

      <ViewAllMentorsModal
        visible={allMentorsModalVisible}
        session={session || { token: user?.token }}
        onClose={() => setAllMentorsModalVisible(false)}
        onSelectMentor={(mId) => {
          if (onSelectUser) onSelectUser({ id: mId, role: "mentor" });
        }}
      />
      
      <AiRoadmapPlannerModal
        visible={roadmapModalVisible}
        user={user}
        onClose={() => setRoadmapModalVisible(false)}
        onSelectUser={onSelectUser}
      />

      <RazorpayPaymentModal
        visible={showPaymentModal}
        course={selectedPaymentCourse}
        onClose={() => setShowPaymentModal(false)}
        onPaymentComplete={handlePaymentComplete}
      />

      <TcmAiExamModal
        visible={aiExamModalVisible}
        onClose={() => setAiExamModalVisible(false)}
        user={user}
        onSaveResult={handleSaveExamResult}
      />

      {topCategories.length > 0 ? (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitleText, { color: theme.text }]}>Top Categories</Text>
            <Pressable onPress={() => Alert.alert("Top Categories", "Browse all 18 learning categories.")}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
            {topCategories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => Alert.alert("Category Selected", `Browsing ${cat.name} courses...`)}
                style={[styles.categoryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
              >
                <View style={[styles.categoryIconWrap, { backgroundColor: cat.bgColor || (theme.isDark ? "#1E1B4B" : "#E8F5E9") }]}>
                  <MaterialCommunityIcons name={cat.icon || "code-tags"} size={22} color={cat.color || theme.primary} />
                </View>
                <Text style={[styles.categoryName, { color: theme.text }]} numberOfLines={1}>{cat.name}</Text>
                <Text style={[styles.categoryCount, { color: theme.subtext }]}>{cat.coursesCount || "12+"} Courses</Text>
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
    backgroundColor: "#0A6836"
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
    backgroundColor: "#E8F5E9",
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
    color: "#0A6836",
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
    backgroundColor: "#0A6836",
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
    borderRadius: 12
  },
  quickAiRoadmapBar: {
    width: "100%",
    alignSelf: "stretch",
    marginTop: 8,
    marginBottom: 14,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C4B5FD",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  quickAiBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0A6836",
    alignItems: "center",
    justifyContent: "center"
  },
  quickAiBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD6FE"
  },
  roadmapCardBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: "#0A6836",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 4
  },
  roadmapCardLeft: {
    flex: 1,
    paddingRight: 10
  },
  aiBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8
  },
  aiBadgePillText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  roadmapCardTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: "#FFFFFF",
    marginBottom: 4
  },
  roadmapCardSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: "#E0E7FF",
    lineHeight: 17,
    marginBottom: 12
  },
  roadmapCardBtn: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12
  },
  roadmapCardBtnText: {
    fontSize: 12.5,
    fontFamily: fonts.bold,
    color: "#0A6836"
  },
  roadmapCardRight: {
    alignItems: "center",
    justifyContent: "center"
  },
  roadmapIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
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
    backgroundColor: "#0A6836"
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
    color: "#0A6836"
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
    backgroundColor: "#E8F5E9",
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
    backgroundColor: "#0A6836",
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
    backgroundColor: "#E8F5E9",
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
    color: "#0A6836"
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
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E1FF"
  },
  clearSearchText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#0A6836"
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
    width: 215,
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
    marginBottom: 8
  },
  mentorAvatarWrap: {
    position: "relative"
  },
  mentorAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23
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
    flex: 1,
    overflow: "hidden"
  },
  mentorCardName: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: "#181725"
  },
  mentorCardRole: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    marginTop: 2,
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
    borderColor: "#0A6836",
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center"
  },
  viewProfileBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#0A6836"
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
  },

  // Partners Collab Section Styles
  partnersCollabCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18
  },
  collabHeaderInfo: {
    gap: 4
  },
  collabBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4
  },
  collabTitle: {
    fontFamily: fonts.bold,
    fontSize: 14.5
  },
  collabSub: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16
  },
  collabPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12
  },
  avatarGroupRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  miniAvatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  miniAvatarText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 10
  },
  explorePartnersBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10
  },
  explorePartnersBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 11.5
  }
});
