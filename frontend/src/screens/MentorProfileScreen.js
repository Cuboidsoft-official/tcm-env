import { useState, useEffect } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Platform } from "react-native";
import { Feather, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { getMentorDetails } from "../api/client";
import MyReviewsModal from "../components/MyReviewsModal";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function MentorProfileScreen({ session, user = {}, targetMentor = null, mentorId, onClose, onOpenCourseDetails, onOpenChat, onEditCourse, onSelectPost }) {
  const { theme } = useTheme();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [myReviewsModalOpen, setMyReviewsModalOpen] = useState(false);

  useEffect(() => {
    loadMentor();
  }, [session?.token, mentorId]);

  async function loadMentor() {
    setLoading(true);
    try {
      if (session?.token) {
        const targetIdToQuery = mentorId || targetMentor?.id || targetMentor?.userId || targetMentor?.name || "m1";
        const res = await getMentorDetails(session.token, targetIdToQuery);
        if (res) setMentor(res);
      }
    } catch (e) {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  }

  const isTargetUser = Boolean(user && (user.isMentor || user.id === targetMentor?.id || user.id === mentorId));
  const rawActive = {
    ...(isTargetUser ? user : {}),
    ...(targetMentor || {}),
    ...(mentor || {})
  };

  const mentorName = rawActive.name || rawActive.fullName || (isTargetUser ? user.name : "") || "TCM Certified Mentor";
  const mentorRole = rawActive.role || rawActive.headline || rawActive.specialization || rawActive.category || "Educator & Mentor";
  const mentorAvatar = rawActive.avatarUrl || rawActive.avatar || rawActive.photoUrl || rawActive.image || (isTargetUser ? user.avatarUrl : "") || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
  const mentorBio = rawActive.bio || rawActive.about || rawActive.description || (isTargetUser ? user.bio : "") || `${mentorName} is a verified TCM mentor specializing in ${mentorRole.toLowerCase()} and hands-on student mentoring.`;

  let initialExpList = [];
  if (Array.isArray(rawActive.experiences) && rawActive.experiences.length > 0) {
    initialExpList = rawActive.experiences;
  } else if (Array.isArray(rawActive.experienceList) && rawActive.experienceList.length > 0) {
    initialExpList = rawActive.experienceList;
  } else {
    const expText = rawActive.yearsExperience || rawActive.experience || "3+ Years";
    initialExpList = [
      {
        id: "exp1",
        role: mentorRole,
        company: `${rawActive.organization || rawActive.company || "TCM Educator Network"} • Active Instructor`,
        durationPill: expText,
        icon: "school-outline",
        iconColor: theme.primary || "#6E42F5"
      }
    ];
  }

  const expTitle = rawActive.yearsExperience || rawActive.experience || "3+ Yrs";
  const initialStatsList = rawActive.stats || [
    { title: expTitle, sub: "Years Exp.", icon: "school-outline", bg: "#E8F5E9" },
    { title: `${rawActive.sessionsCount || 45}+`, sub: "Live Sessions", icon: "play-circle-outline", bg: "#E8F5E9" },
    { title: `${rawActive.studentsCount || rawActive.totalStudents || 1200}+`, sub: "Students", icon: "account-group-outline", bg: "#E8F5E9" },
    { title: rawActive.satisfaction || "98%", sub: "Satisfaction", icon: "medal-outline", bg: "#E8F5E9" }
  ];

  const data = {
    id: rawActive.id || rawActive._id || mentorId || "m1",
    name: mentorName,
    verified: Boolean(rawActive.verified ?? true),
    badge: rawActive.badge || "Verified Mentor",
    role: mentorRole,
    rating: rawActive.rating || "4.9",
    reviewsCount: rawActive.reviewsCount || "120",
    studentsCount: `${rawActive.studentsCount || rawActive.totalStudents || "1.2K"}`,
    tags: rawActive.tags || [
      { label: mentorRole, bg: "#EAF5FF", color: "#2F79B9" },
      { label: "TCM Educator", bg: "#ECF9E9", color: "#2E7D32" }
    ],
    bio: mentorBio,
    about: rawActive.about || mentorBio,
    avatarUrl: mentorAvatar,
    stats: initialStatsList,
    subjects: rawActive.subjects || [
      { id: "sub1", title: "Live Mentorship", desc: "Interactive doubt solving & skills guidance", icon: "school-outline", bg: "#E8F5E9" },
      { id: "sub2", title: "Course Guidance", desc: "Step by step syllabus & career roadmap", icon: "book-open-outline", bg: "#EAF5FF" }
    ],
    experiences: initialExpList,
    courses: rawActive.courses || rawActive.createdCourses || [],
    createdCourses: rawActive.createdCourses || rawActive.courses || [],
    certifications: rawActive.certifications || rawActive.certificates || [],
    interests: rawActive.interests || rawActive.specializations || [],
    ratingsOverview: rawActive.ratingsOverview
  };

  const mentorInitials = (data.name || "Mentor")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "M";
  const statsList = data.stats || [];
  const subjectsList = data.subjects || [];
  const expList = data.experiences || [];
  const ratings = data.ratingsOverview || rawActive.ratingsOverview || {
    score: data.rating || "4.9",
    reviewsLabel: `(${data.reviewsCount || "120"} Reviews)`,
    breakdown: [
      { star: "5 Stars", percent: 91 },
      { star: "4 Stars", percent: 7 },
      { star: "3 Stars", percent: 2 },
      { star: "2 Stars", percent: 0 },
      { star: "1 Star", percent: 0 }
    ],
    featuredReview: {
      authorName: "Ananya Sharma",
      authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
      timeAgo: "2 days ago",
      text: "The mentorship session was extremely structured! Helped me clear all my technical doubts."
    }
  };

  const featuredReview = ratings.featuredReview || {
    authorName: "Ananya Sharma",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    timeAgo: "2 days ago",
    text: "The mentorship session was extremely structured! Helped me clear all my technical doubts."
  };
  const themedSurface = { backgroundColor: theme.cardBg, borderColor: theme.border };
  const themedSoftSurface = {
    backgroundColor: theme.isDark ? theme.inputBg || "#131927" : "#F8F7FF",
    borderColor: theme.border
  };
  const themedBadgeSurface = { backgroundColor: theme.badgeBg, borderColor: theme.border };
  const accentColor = theme.primary;

  function handleBookSessionWhatsApp() {
    const mentorNameStr = data.name || "Mentor";
    const roleStr = data.role || "TCM Educator";
    const msg = `Hello! I would like to book a 1:1 mentorship session with ${mentorNameStr} (${roleStr}).`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    Linking.openURL(waUrl).catch(() => {
      Alert.alert("WhatsApp", "Could not open WhatsApp on this device.");
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. Top Header Bar */}
      <View style={[styles.topHeader, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Pressable onPress={onClose} style={[styles.headerIconBtn, { backgroundColor: theme.badgeBg }]}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>

        <View style={styles.headerRightActions}>
          <Pressable onPress={() => setBookmarked((p) => !p)} style={[styles.headerIconBtn, { backgroundColor: theme.badgeBg }]}>
            <Feather name="bookmark" size={18} color={bookmarked ? theme.primary : theme.text} fill={bookmarked ? theme.primary : "none"} />
          </Pressable>
          <Pressable onPress={() => Alert.alert("Options", "Share Mentor Profile, Report, or Copy Link")} style={[styles.headerIconBtn, { backgroundColor: theme.badgeBg }]}>
            <Feather name="more-horizontal" size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 2. Top Mentor Header Card */}
        <View style={[styles.mentorHeroCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.heroTopRow}>
            {/* Mentor Image */}
            <View style={styles.mentorImgWrap}>
              {data.avatarUrl && typeof data.avatarUrl === "string" && data.avatarUrl.trim().length > 5 ? (
                <Image source={{ uri: data.avatarUrl }} style={[styles.mentorImg, { borderColor: theme.border }]} />
              ) : (
                <View style={[styles.mentorInitialsWrap, { backgroundColor: theme.primary, borderColor: theme.border }]}>
                  <Text style={styles.mentorInitialsText}>{mentorInitials}</Text>
                </View>
              )}
              <View style={[styles.onlineDot, { borderColor: theme.cardBg }]} />
            </View>

            {/* Mentor Copy Right */}
            <View style={styles.heroRightCol}>
              <View style={[styles.topBadgePill, { backgroundColor: theme.badgeBg }]}>
                <Text style={[styles.topBadgeText, { color: theme.primary }]}>{data.badge}</Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Text style={[styles.mentorName, { color: theme.text }]}>{data.name}</Text>
                <View style={{ backgroundColor: theme.isDark ? "#1E1B4B" : "#FEF3C7", borderWidth: 1, borderColor: theme.border, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                  <Text style={{ fontSize: 9.5, fontWeight: "700", color: theme.isDark ? "#A78BFA" : "#D97706" }}>Mentor</Text>
                </View>
                {data.isPremium ? (
                  <MaterialCommunityIcons name="check-decagram" size={16} color={theme.primary} style={{ marginLeft: 2 }} />
                ) : null}
              </View>

              <Text style={[styles.mentorRole, { color: theme.subtext }]}>{data.role}</Text>

              {/* Rating & Students Meta */}
              <View style={styles.metaRow}>
                <FontAwesome name="star" size={12} color="#FFB800" />
                <Text style={[styles.metaScore, { color: theme.text }]}>{data.rating}</Text>
                <Text style={[styles.metaReviews, { color: theme.subtext }]}>({data.reviewsCount} reviews)</Text>
                <Text style={[styles.metaDot, { color: theme.subtext }]}>•</Text>
                <Feather name="users" size={11} color={theme.subtext} />
                <Text style={[styles.metaStudents, { color: theme.subtext }]}>{data.studentsCount} Students</Text>
              </View>

              {/* Tag Pills */}
              <View style={styles.tagPillsRow}>
                {data.tags.map((t, i) => (
                  <View key={i} style={[styles.tagPill, { backgroundColor: theme.isDark ? "#1E263B" : t.bg }]}>
                    <Text style={[styles.tagPillText, { color: theme.isDark ? "#C7D2FE" : t.color }]}>{t.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <Text style={[styles.bioText, { color: theme.subtext }]}>{data.bio}</Text>
        </View>

        {/* 3. Action Buttons Row */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => {
              if (onClose) onClose();
              if (onOpenChat) onOpenChat(data);
            }}
            style={[styles.msgBtn, { backgroundColor: theme.cardBg, borderColor: theme.primary }]}
          >
            <Feather name="message-circle" size={18} color={theme.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.msgBtnText, { color: theme.primary }]}>Message</Text>
          </Pressable>

          <Pressable
            onPress={handleBookSessionWhatsApp}
            style={styles.bookBtn}
          >
            <Feather name="calendar" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.bookBtnText}>Book a Session</Text>
          </Pressable>
        </View>

        {/* 4. Stats Grid Row */}
        <View style={[styles.statsGrid, themedSurface]}>
          {statsList.map((st, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: theme.badgeBg }]}>
                <MaterialCommunityIcons name={st.icon} size={20} color={accentColor} />
              </View>
              <Text style={[styles.statVal, { color: theme.text }]}>{st.title}</Text>
              <Text style={[styles.statSub, { color: theme.subtext }]}>{st.sub}</Text>
            </View>
          ))}
        </View>

        {/* 5. About Me Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>About Me</Text>
        <View style={[styles.aboutCard, themedSurface]}>
          <View style={styles.aboutTextCol}>
            <Text style={[styles.aboutDescText, { color: theme.subtext }]}>{data.about}</Text>
          </View>
          <View style={styles.aboutGraphicCol}>
            <MaterialCommunityIcons name="laptop" size={54} color={accentColor} />
          </View>
        </View>


        {/* 6.5. Courses Uploaded by Mentor */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Courses by {data.name?.split(" ")[0] || "Mentor"}</Text>
          <Text style={[styles.viewAllText, { color: theme.primary }]}>{data.courses?.length || 0} Published</Text>
        </View>

        {data.courses && data.courses.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
            {data.courses.map((course) => (
              <Pressable
                key={course.id}
                onPress={() => onOpenCourseDetails && onOpenCourseDetails(course.id)}
                style={[styles.mentorCourseCard, themedSurface]}
              >
                <Image source={{ uri: course.imageUrl || course.image }} style={styles.mentorCourseImg} />
                
                {Boolean(user?.role === "mentor" || user?.isMentor) ? (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      if (onEditCourse) onEditCourse(course);
                    }}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: "#0A6836",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      zIndex: 10
                    }}
                  >
                    <Feather name="edit-3" size={11} color="#FFFFFF" />
                    <Text style={{ fontFamily: fonts.semiBold, fontSize: 10, color: "#FFFFFF" }}>Edit</Text>
                  </Pressable>
                ) : null}

                <View style={styles.mentorCourseContent}>
                  <View style={[styles.badgePillSmall, { backgroundColor: theme.badgeBg }]}>
                    <Text style={[styles.badgePillSmallText, { color: theme.primary }]}>{course.category || "TCM Course"}</Text>
                  </View>
                  <Text numberOfLines={2} style={[styles.mentorCourseTitle, { color: theme.text }]}>
                    {course.title}
                  </Text>
                  <View style={styles.mentorCourseMetaRow}>
                    <FontAwesome name="star" size={11} color="#FFB800" />
                    <Text style={[styles.mentorCourseRating, { color: theme.text }]}>{course.rating || "5.0"}</Text>
                    <Text style={[styles.mentorCoursePrice, { color: theme.primary }]}>{course.price || "₹1,499"}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.emptyCourseBox, themedSoftSurface]}>
            <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#A0A0B8" />
            <Text style={[styles.emptyCourseText, { color: theme.subtext }]}>No courses uploaded yet by this mentor.</Text>
          </View>
        )}

        {/* 7. Experience Timeline */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Experience</Text>
          <Pressable onPress={() => Alert.alert("Experience", "Viewing career history.")}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View>

        <View style={[styles.experienceCard, themedSurface]}>
          {expList.map((exp, index) => (
            <View key={exp.id} style={styles.expRowWrapper}>
              {/* Stepper Node Left */}
              <View style={styles.stepperCol}>
                <View style={[styles.stepperNodeDot, { backgroundColor: theme.primary }]} />
                {index < expList.length - 1 ? <View style={[styles.stepperVerticalLine, { backgroundColor: theme.border }]} /> : null}
              </View>

              {/* Item Content */}
              <View style={[styles.expContentRow, themedSoftSurface]}>
                <View style={[styles.companyLogoWrap, { backgroundColor: theme.cardBg }]}>
                  <MaterialCommunityIcons name={exp.icon || "domain"} size={22} color={exp.iconColor || "#0A6836"} />
                </View>

                <View style={styles.expTextCol}>
                  <Text style={[styles.expRoleTitle, { color: theme.text }]}>{exp.role}</Text>
                  <Text style={[styles.expCompanyText, { color: theme.subtext }]}>{exp.company}</Text>
                </View>

                <View style={[styles.durationPill, { backgroundColor: theme.badgeBg }]}>
                  <Text style={[styles.durationPillText, { color: theme.primary }]}>{exp.durationPill}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 7.5. Certifications & Achievements */}
        {data.certifications && data.certifications.length > 0 ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Certifications & Achievements</Text>
            </View>
            <View style={[styles.certCardContainer, themedSurface]}>
              {data.certifications.map((cert, cIdx) => (
                <View key={cIdx} style={styles.certRow}>
                  <View style={[styles.certBadgeIcon, { backgroundColor: theme.badgeBg }]}>
                    <MaterialCommunityIcons name="certificate" size={18} color="#2E7D32" />
                  </View>
                  <Text style={[styles.certTitleText, { color: theme.text }]}>{typeof cert === "string" ? cert : cert.title}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* 7.6. Interests & Specializations */}
        {data.interests && data.interests.length > 0 ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Interests & Specializations</Text>
            </View>
            <View style={styles.interestsWrap}>
              {data.interests.map((tag, tIdx) => (
                <View key={tIdx} style={[styles.interestPill, themedBadgeSurface]}>
                  <MaterialCommunityIcons name="star-four-points" size={12} color={theme.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.interestPillText, { color: theme.primary }]}>{typeof tag === "string" ? tag : tag.label}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* 8. Ratings & Reviews */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Ratings & Reviews</Text>
          <Pressable onPress={() => setMyReviewsModalOpen(true)}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => setMyReviewsModalOpen(true)} style={[styles.reviewsOverviewCard, themedSurface]}>
          {/* Left Rating Summary */}
          <View style={[styles.reviewsSummaryLeft, { borderRightColor: theme.border }]}>
            <Text style={[styles.bigScoreText, { color: theme.text }]}>{ratings.score}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <FontAwesome key={s} name="star" size={11} color="#FFB800" />
              ))}
            </View>
            <Text style={[styles.reviewsCountText, { color: theme.subtext }]}>{ratings.reviewsLabel}</Text>

            {/* Bars */}
            <View style={styles.ratingBarsCol}>
              {ratings.breakdown.map((b) => (
                <View key={b.star} style={styles.barRow}>
                  <Text style={[styles.starLabelText, { color: theme.subtext }]}>{b.star}</Text>
                  <View style={[styles.barTrack, { backgroundColor: theme.isDark ? "#1E263B" : "#F4F3FA" }]}>
                    <View style={[styles.barFill, { backgroundColor: theme.primary, width: `${b.percent}%` }]} />
                  </View>
                  <Text style={[styles.percentText, { color: theme.subtext }]}>{b.percent}%</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Right Featured Review Card */}
          <View style={[styles.featuredReviewCard, themedSoftSurface]}>
            <View style={styles.reviewAuthorRow}>
              <Image source={{ uri: featuredReview.authorAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" }} style={styles.reviewAvatar} />
              <View style={styles.reviewAuthorWrap}>
                <Text style={[styles.reviewAuthorName, { color: theme.text }]}>{featuredReview.authorName || "TCM Student"}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FontAwesome key={s} name="star" size={10} color="#FFB800" />
                  ))}
                  <Text style={styles.reviewTimeAgo}> • {featuredReview.timeAgo || "Recently"}</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.reviewBodyText, { color: theme.subtext }]}>"{featuredReview.text || "Extremely helpful mentorship session!"}"</Text>
            <MaterialCommunityIcons name="format-quote-close" size={32} color={theme.border} style={styles.quoteIcon} />
          </View>
        </Pressable>
      </ScrollView>

      {/* 9. Sticky Bottom Booking Bar */}
      <View style={[styles.stickyPurchaseBar, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
        <View style={styles.stickyLeftCol}>
          <View style={[styles.stickyIconCircle, { backgroundColor: theme.badgeBg }]}>
            <Feather name="calendar" size={18} color={theme.primary} />
          </View>
          <View style={styles.stickyTextWrap}>
            <Text style={[styles.stickyTitle, { color: theme.text }]}>Want to learn from {data.name.split(" ")[0]}?</Text>
            <Text style={[styles.stickySub, { color: theme.subtext }]}>Book a 1:1 session and achieve your goals.</Text>
          </View>
        </View>

        <Pressable
          onPress={handleBookSessionWhatsApp}
          style={styles.stickyBookBtn}
        >
          <Text style={styles.stickyBookBtnText}>Book a Session →</Text>
        </Pressable>
      </View>

      <MyReviewsModal
        visible={myReviewsModalOpen}
        session={session}
        userId={data.id || mentorId || "m1"}
        user={data}
        onClose={() => setMyReviewsModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F8FAFC"
  },

  // 1. Top Header Bar
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
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center"
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },

  scrollContent: {
    paddingHorizontal: 2,
    paddingTop: 4,
    paddingBottom: 110,
    width: "100%"
  },

  // 2. Top Mentor Header Card
  mentorHeroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  heroTopRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 12
  },
  mentorImgWrap: {
    position: "relative"
  },
  mentorImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  mentorInitialsWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0A6836",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  mentorInitialsText: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  onlineDot: {
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
  heroRightCol: {
    flex: 1,
    justifyContent: "center"
  },
  topBadgePill: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  topBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#0A6836"
  },
  mentorName: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: "#181725"
  },
  mentorRole: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C7C9A",
    marginTop: 1
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6
  },
  metaScore: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#181725"
  },
  metaReviews: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A"
  },
  metaDot: {
    color: "#7C7C9A",
    fontSize: 9
  },
  metaStudents: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: "#7C7C9A"
  },

  tagPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  tagPillText: {
    fontFamily: fonts.bold,
    fontSize: 9
  },
  bioText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#52506E",
    lineHeight: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F4F3FA"
  },

  // 3. Action Buttons Row
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18
  },
  msgBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#0A6836",
    paddingVertical: 12,
    borderRadius: 14,
    ...shadow.soft
  },
  msgBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#0A6836"
  },
  bookBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A6836",
    paddingVertical: 12,
    borderRadius: 14,
    ...shadow.soft
  },
  bookBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FFFFFF"
  },

  // 4. Stats Grid Row
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  statCard: {
    flex: 1,
    alignItems: "center"
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },
  statVal: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#181725"
  },
  statSub: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: "#7C7C9A",
    textAlign: "center"
  },

  // Section Headers
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725",
    marginBottom: 10
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  viewAllText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#0A6836"
  },

  // 5. About Me Section Card
  aboutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  aboutTextCol: {
    flex: 1,
    paddingRight: 10
  },
  aboutDescText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#52506E",
    lineHeight: 18
  },
  aboutGraphicCol: {
    width: 70,
    alignItems: "center",
    justifyContent: "center"
  },

  // 6. Subjects I Mentor Cards
  horizontalScrollContent: {
    paddingBottom: 18
  },
  subjectCard: {
    width: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  subjectIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  subjectTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725",
    marginBottom: 2
  },
  subjectDesc: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    lineHeight: 14
  },

  // 7. Experience Timeline Card
  experienceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  expRowWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10
  },
  stepperCol: {
    width: 16,
    alignItems: "center",
    marginTop: 14
  },
  stepperNodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0A6836"
  },
  stepperVerticalLine: {
    width: 2,
    height: 38,
    backgroundColor: "#EAE7FF",
    marginTop: 4
  },
  expContentRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F7FF",
    borderRadius: 14,
    padding: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#F0EFFF"
  },
  companyLogoWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    ...shadow.soft
  },
  expTextCol: {
    flex: 1
  },
  expRoleTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725"
  },
  expCompanyText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 1
  },
  durationPill: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  durationPillText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "#0A6836"
  },

  // 8. Ratings & Reviews Overview
  reviewsOverviewCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    gap: 12,
    ...shadow.soft
  },
  reviewsSummaryLeft: {
    width: 140,
    borderRightWidth: 1,
    borderRightColor: "#F4F3FA",
    paddingRight: 10
  },
  bigScoreText: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: "#181725",
    lineHeight: 36
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
    marginVertical: 4
  },
  reviewsCountText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    marginBottom: 10
  },

  ratingBarsCol: {
    gap: 3
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  starLabelText: {
    fontFamily: fonts.regular,
    fontSize: 8,
    color: "#7C7C9A",
    width: 32
  },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "#F4F3FA",
    borderRadius: 2,
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    backgroundColor: "#0A6836",
    borderRadius: 2
  },
  percentText: {
    fontFamily: fonts.regular,
    fontSize: 8,
    color: "#7C7C9A",
    width: 20,
    textAlign: "right"
  },

  featuredReviewCard: {
    flex: 1,
    backgroundColor: "#F8F7FF",
    borderRadius: 14,
    padding: 10,
    position: "relative",
    justifyContent: "space-between"
  },
  reviewAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6
  },
  reviewAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8
  },
  reviewAuthorWrap: {
    flex: 1
  },
  reviewAuthorName: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#181725"
  },
  reviewTimeAgo: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: "#7C7C9A"
  },
  reviewBodyText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#52506E",
    lineHeight: 16
  },
  quoteIcon: {
    alignSelf: "flex-end"
  },

  mentorCourseCard: {
    width: 200,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#EBEAFA",
    ...shadow.soft
  },
  mentorCourseImg: {
    width: "100%",
    height: 105,
    backgroundColor: "#E8F5E9"
  },
  mentorCourseContent: {
    padding: 10
  },
  badgePillSmall: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4
  },
  badgePillSmallText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "#0A6836"
  },
  mentorCourseTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725",
    marginBottom: 6,
    lineHeight: 16
  },
  mentorCourseMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  mentorCourseRating: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#181725",
    marginLeft: 3
  },
  mentorCoursePrice: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#0A6836"
  },
  emptyCourseBox: {
    backgroundColor: "#F9F8FF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EBEAFA"
  },
  emptyCourseText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 4
  },

  certCardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EBEAFA",
    gap: 8,
    marginBottom: 8
  },
  certRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  certBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#ECF9E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  certTitleText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#181725",
    flex: 1
  },
  interestsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8
  },
  interestPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2DDFF"
  },
  interestPillText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#0A6836"
  },

  // 9. Sticky Bottom Booking Bar
  stickyPurchaseBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F0EFFF",
    ...shadow.soft
  },
  stickyLeftCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1
  },
  stickyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center"
  },
  stickyTextWrap: {
    flex: 1
  },
  stickyTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725"
  },
  stickySub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A"
  },
  stickyBookBtn: {
    backgroundColor: "#0A6836",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    ...shadow.soft
  },
  stickyBookBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#FFFFFF"
  }
});
