import { useState, useEffect } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Platform } from "react-native";
import { Feather, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { getMentorDetails } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";

const { width } = Dimensions.get("window");

export default function MentorProfileScreen({ session, user = {}, targetMentor = null, mentorId, onClose, onOpenCourseDetails, onOpenChat, onEditCourse }) {
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    loadMentor();
  }, [session?.token, mentorId]);

  async function loadMentor() {
    setLoading(true);
    try {
      if (session?.token) {
        const res = await getMentorDetails(session.token, mentorId || "m1");
        if (res) setMentor(res);
      }
    } catch (e) {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  }

  const fallbackMentor = {
    id: "m1",
    name: "Rahul Sharma",
    verified: true,
    badge: "Top Mentor",
    role: "Full Stack Developer & Mentor",
    rating: "4.9",
    reviewsCount: "1.2K",
    studentsCount: "12K+",
    tags: [
      { label: "NEET Mentor", bg: "#F0EDFF", color: "#5B3CF5" },
      { label: "JEE Mentor", bg: "#EAF5FF", color: "#2F79B9" },
      { label: "Coding Mentor", bg: "#ECF9E9", color: "#2E7D32" },
      { label: "+2 More", bg: "#F4F3FA", color: "#7C7C9A" }
    ],
    bio: "Helping students master concepts and build real-world skills with 6+ years of teaching & industry experience.",
    avatarUrl: "",
    stats: [
      { title: "6+", sub: "Years Exp.", icon: "school-outline", bg: "#F0EDFF" },
      { title: "250+", sub: "Live Sessions", icon: "play-circle-outline", bg: "#F0EDFF" },
      { title: "12K+", sub: "Students", icon: "account-group-outline", bg: "#F0EDFF" },
      { title: "98%", sub: "Satisfaction", icon: "medal-outline", bg: "#F0EDFF" }
    ],
    about: "I specialize in Full Stack Development (MERN Stack). I love breaking down complex concepts into simple, practical lessons that help students build confidence and real-world skills.",
    subjects: [
      { id: "sub1", title: "Coding", desc: "Web Dev, DSA, Python, JS", icon: "code-tags", bg: "#F0EDFF" },
      { id: "sub2", title: "NEET", desc: "Physics, Chemistry, Biology", icon: "book-open-outline", bg: "#EAF5FF" },
      { id: "sub3", title: "JEE", desc: "Physics, Chemistry, Maths", icon: "calculator-variant-outline", bg: "#ECF9E9" },
      { id: "sub4", title: "Others", desc: "Interview Prep, Career Guidance", icon: "widgets-outline", bg: "#FFF7EE" }
    ],
    experiences: [
      {
        id: "exp1",
        role: "Senior Software Engineer",
        company: "Google • 2021 - Present",
        durationPill: "3+ Years",
        icon: "google",
        iconColor: "#EA4335"
      },
      {
        id: "exp2",
        role: "Software Engineer",
        company: "Microsoft • 2019 - 2021",
        durationPill: "2+ Years",
        icon: "microsoft",
        iconColor: "#00A4EF"
      },
      {
        id: "exp3",
        role: "Software Developer",
        company: "Infosys • 2018 - 2019",
        durationPill: "1+ Year",
        icon: "domain",
        iconColor: "#007CC3"
      }
    ],
    ratingsOverview: {
      score: "4.9",
      reviewsLabel: "(1.2K Reviews)",
      breakdown: [
        { star: "5 Stars", percent: 91 },
        { star: "4 Stars", percent: 7 },
        { star: "3 Stars", percent: 2 },
        { star: "2 Stars", percent: 0 },
        { star: "1 Star", percent: 0 }
      ],
      featuredReview: {
        authorName: "Ananya Verma",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
        timeAgo: "2 days ago",
        text: "Sir explains concepts in such a simple way. His sessions are super helpful!"
      }
    }
  };

  const activeMentorObj = targetMentor || mentor || {};
  const data = {
    ...fallbackMentor,
    ...activeMentorObj,
    ...(user && (user.isMentor || user.id === activeMentorObj.id || user.id === mentorId) ? {
      name: user.name || activeMentorObj.name || fallbackMentor.name,
      avatarUrl: user.avatarUrl || user.avatar || user.photoUrl || activeMentorObj.avatarUrl || activeMentorObj.avatar,
      role: user.role || activeMentorObj.role || fallbackMentor.role,
      bio: user.bio || activeMentorObj.bio || fallbackMentor.bio
    } : {
      avatarUrl: activeMentorObj.avatarUrl || activeMentorObj.avatar || activeMentorObj.photoUrl || activeMentorObj.image || ""
    })
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
  const ratings = data.ratingsOverview || fallbackMentor.ratingsOverview;

  return (
    <View style={styles.container}>
      {/* 1. Top Header Bar */}
      <View style={styles.topHeader}>
        <Pressable onPress={onClose} style={styles.headerIconBtn}>
          <Feather name="arrow-left" size={20} color="#181725" />
        </Pressable>

        <View style={styles.headerRightActions}>
          <Pressable onPress={() => setBookmarked((p) => !p)} style={styles.headerIconBtn}>
            <Feather name="bookmark" size={18} color={bookmarked ? "#5B3CF5" : "#181725"} fill={bookmarked ? "#5B3CF5" : "none"} />
          </Pressable>
          <Pressable onPress={() => Alert.alert("Options", "Share Mentor Profile, Report, or Copy Link")} style={styles.headerIconBtn}>
            <Feather name="more-horizontal" size={20} color="#181725" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 2. Top Mentor Header Card */}
        <View style={styles.mentorHeroCard}>
          <View style={styles.heroTopRow}>
            {/* Mentor Image */}
            <View style={styles.mentorImgWrap}>
              {data.avatarUrl && !data.avatarUrl.includes("photo-1507003211169-0a1dd7228f2d") && !(Platform.OS === "web" && typeof data.avatarUrl === "string" && data.avatarUrl.startsWith("file://")) ? (
                <Image source={{ uri: data.avatarUrl }} style={styles.mentorImg} />
              ) : (
                <View style={styles.mentorInitialsWrap}>
                  <Text style={styles.mentorInitialsText}>{mentorInitials}</Text>
                </View>
              )}
              <View style={styles.onlineDot} />
            </View>

            {/* Mentor Copy Right */}
            <View style={styles.heroRightCol}>
              <View style={styles.topBadgePill}>
                <Text style={styles.topBadgeText}>{data.badge}</Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Text style={styles.mentorName}>{data.name}</Text>
                <View style={{ backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5 }}>
                  <Text style={{ fontSize: 9.5, fontWeight: "700", color: "#D97706" }}>Mentor</Text>
                </View>
                {data.isPremium ? (
                  <MaterialCommunityIcons name="check-decagram" size={16} color="#5B3CF5" style={{ marginLeft: 2 }} />
                ) : null}
              </View>

              <Text style={styles.mentorRole}>{data.role}</Text>

              {/* Rating & Students Meta */}
              <View style={styles.metaRow}>
                <FontAwesome name="star" size={12} color="#FFB800" />
                <Text style={styles.metaScore}>{data.rating}</Text>
                <Text style={styles.metaReviews}>({data.reviewsCount} reviews)</Text>
                <Text style={styles.metaDot}>•</Text>
                <Feather name="users" size={11} color="#7C7C9A" />
                <Text style={styles.metaStudents}>{data.studentsCount} Students</Text>
              </View>

              {/* Tag Pills */}
              <View style={styles.tagPillsRow}>
                {data.tags.map((t, i) => (
                  <View key={i} style={[styles.tagPill, { backgroundColor: t.bg }]}>
                    <Text style={[styles.tagPillText, { color: t.color }]}>{t.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.bioText}>{data.bio}</Text>
        </View>

        {/* 3. Action Buttons Row */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => (onOpenChat ? onOpenChat(data) : Alert.alert("Message Mentor", `Opening chat with ${data.name}...`))}
            style={styles.msgBtn}
          >
            <Feather name="message-circle" size={18} color="#5B3CF5" style={{ marginRight: 6 }} />
            <Text style={styles.msgBtnText}>Message</Text>
          </Pressable>

          <Pressable
            onPress={() => Alert.alert("Book a Session", `Schedule 1:1 mentorship session with ${data.name}.`)}
            style={styles.bookBtn}
          >
            <Feather name="calendar" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.bookBtnText}>Book a Session</Text>
          </Pressable>
        </View>

        {/* 4. Stats Grid Row */}
        <View style={styles.statsGrid}>
          {statsList.map((st, i) => (
            <View key={i} style={styles.statCard}>
              <View style={styles.statIconCircle}>
                <MaterialCommunityIcons name={st.icon} size={20} color="#5B3CF5" />
              </View>
              <Text style={styles.statVal}>{st.title}</Text>
              <Text style={styles.statSub}>{st.sub}</Text>
            </View>
          ))}
        </View>

        {/* 5. About Me Section */}
        <Text style={styles.sectionTitle}>About Me</Text>
        <View style={styles.aboutCard}>
          <View style={styles.aboutTextCol}>
            <Text style={styles.aboutDescText}>{data.about}</Text>
          </View>
          <View style={styles.aboutGraphicCol}>
            <MaterialCommunityIcons name="laptop" size={54} color="#5B3CF5" />
          </View>
        </View>

        {/* 6. Subjects I Mentor */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Subjects I Mentor</Text>
          <Pressable onPress={() => Alert.alert("Subjects", "Showing all mentored topics.")}>
            <Text style={styles.viewAllText}>View All ›</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
          {subjectsList.map((sub) => (
            <View key={sub.id} style={styles.subjectCard}>
              <View style={[styles.subjectIconWrap, { backgroundColor: sub.bg }]}>
                <MaterialCommunityIcons name={sub.icon} size={22} color="#5B3CF5" />
              </View>
              <Text style={styles.subjectTitle}>{sub.title}</Text>
              <Text style={styles.subjectDesc}>{sub.desc}</Text>
            </View>
          ))}
        </ScrollView>

        {/* 6.5. Courses Uploaded by Mentor */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Courses by {data.name?.split(" ")[0] || "Mentor"}</Text>
          <Text style={styles.viewAllText}>{data.courses?.length || 0} Published</Text>
        </View>

        {data.courses && data.courses.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
            {data.courses.map((course) => (
              <Pressable
                key={course.id}
                onPress={() => onOpenCourseDetails && onOpenCourseDetails(course.id)}
                style={styles.mentorCourseCard}
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
                      backgroundColor: "#5B3CF5",
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
                  <View style={styles.badgePillSmall}>
                    <Text style={styles.badgePillSmallText}>{course.category || "TCM Course"}</Text>
                  </View>
                  <Text numberOfLines={2} style={styles.mentorCourseTitle}>
                    {course.title}
                  </Text>
                  <View style={styles.mentorCourseMetaRow}>
                    <FontAwesome name="star" size={11} color="#FFB800" />
                    <Text style={styles.mentorCourseRating}>{course.rating || "5.0"}</Text>
                    <Text style={styles.mentorCoursePrice}>{course.price || "₹1,499"}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyCourseBox}>
            <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#A0A0B8" />
            <Text style={styles.emptyCourseText}>No courses uploaded yet by this mentor.</Text>
          </View>
        )}

        {/* 7. Experience Timeline */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <Pressable onPress={() => Alert.alert("Experience", "Viewing career history.")}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.experienceCard}>
          {expList.map((exp, index) => (
            <View key={exp.id} style={styles.expRowWrapper}>
              {/* Stepper Node Left */}
              <View style={styles.stepperCol}>
                <View style={styles.stepperNodeDot} />
                {index < expList.length - 1 ? <View style={styles.stepperVerticalLine} /> : null}
              </View>

              {/* Item Content */}
              <View style={styles.expContentRow}>
                <View style={styles.companyLogoWrap}>
                  <MaterialCommunityIcons name={exp.icon || "domain"} size={22} color={exp.iconColor || "#5B3CF5"} />
                </View>

                <View style={styles.expTextCol}>
                  <Text style={styles.expRoleTitle}>{exp.role}</Text>
                  <Text style={styles.expCompanyText}>{exp.company}</Text>
                </View>

                <View style={styles.durationPill}>
                  <Text style={styles.durationPillText}>{exp.durationPill}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 7.5. Certifications & Achievements */}
        {data.certifications && data.certifications.length > 0 ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Certifications & Achievements</Text>
            </View>
            <View style={styles.certCardContainer}>
              {data.certifications.map((cert, cIdx) => (
                <View key={cIdx} style={styles.certRow}>
                  <View style={styles.certBadgeIcon}>
                    <MaterialCommunityIcons name="certificate" size={18} color="#2E7D32" />
                  </View>
                  <Text style={styles.certTitleText}>{typeof cert === "string" ? cert : cert.title}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* 7.6. Interests & Specializations */}
        {data.interests && data.interests.length > 0 ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Interests & Specializations</Text>
            </View>
            <View style={styles.interestsWrap}>
              {data.interests.map((tag, tIdx) => (
                <View key={tIdx} style={styles.interestPill}>
                  <MaterialCommunityIcons name="star-four-points" size={12} color="#5B3CF5" style={{ marginRight: 4 }} />
                  <Text style={styles.interestPillText}>{typeof tag === "string" ? tag : tag.label}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* 8. Ratings & Reviews */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
          <Pressable onPress={() => Alert.alert("Reviews", "Showing all student reviews.")}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.reviewsOverviewCard}>
          {/* Left Rating Summary */}
          <View style={styles.reviewsSummaryLeft}>
            <Text style={styles.bigScoreText}>{ratings.score}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <FontAwesome key={s} name="star" size={11} color="#FFB800" />
              ))}
            </View>
            <Text style={styles.reviewsCountText}>{ratings.reviewsLabel}</Text>

            {/* Bars */}
            <View style={styles.ratingBarsCol}>
              {ratings.breakdown.map((b) => (
                <View key={b.star} style={styles.barRow}>
                  <Text style={styles.starLabelText}>{b.star}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${b.percent}%` }]} />
                  </View>
                  <Text style={styles.percentText}>{b.percent}%</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Right Featured Review Card */}
          <View style={styles.featuredReviewCard}>
            <View style={styles.reviewAuthorRow}>
              <Image source={{ uri: ratings.featuredReview.authorAvatar }} style={styles.reviewAvatar} />
              <View style={styles.reviewAuthorWrap}>
                <Text style={styles.reviewAuthorName}>{ratings.featuredReview.authorName}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FontAwesome key={s} name="star" size={10} color="#FFB800" />
                  ))}
                  <Text style={styles.reviewTimeAgo}> • {ratings.featuredReview.timeAgo}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.reviewBodyText}>"{ratings.featuredReview.text}"</Text>
            <MaterialCommunityIcons name="format-quote-close" size={32} color="#EAE7FF" style={styles.quoteIcon} />
          </View>
        </View>
      </ScrollView>

      {/* 9. Sticky Bottom Booking Bar */}
      <View style={styles.stickyPurchaseBar}>
        <View style={styles.stickyLeftCol}>
          <View style={styles.stickyIconCircle}>
            <Feather name="calendar" size={18} color="#5B3CF5" />
          </View>
          <View style={styles.stickyTextWrap}>
            <Text style={styles.stickyTitle}>Want to learn from {data.name.split(" ")[0]}?</Text>
            <Text style={styles.stickySub}>Book a 1:1 session and achieve your goals.</Text>
          </View>
        </View>

        <Pressable
          onPress={() => Alert.alert("Book a Session", `Redirecting to 1:1 booking checkout for ${data.name}.`)}
          style={styles.stickyBookBtn}
        >
          <Text style={styles.stickyBookBtnText}>Book a Session →</Text>
        </Pressable>
      </View>
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
    backgroundColor: "#5B3CF5",
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
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  topBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#5B3CF5"
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
    borderColor: "#5B3CF5",
    paddingVertical: 12,
    borderRadius: 14,
    ...shadow.soft
  },
  msgBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#5B3CF5"
  },
  bookBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B3CF5",
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
    backgroundColor: "#F0EDFF",
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
    color: "#5B3CF5"
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
    backgroundColor: "#5B3CF5"
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
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  durationPillText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "#5B3CF5"
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
    backgroundColor: "#5B3CF5",
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
    backgroundColor: "#F0EDFF"
  },
  mentorCourseContent: {
    padding: 10
  },
  badgePillSmall: {
    alignSelf: "flex-start",
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4
  },
  badgePillSmallText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "#5B3CF5"
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
    color: "#5B3CF5"
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
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2DDFF"
  },
  interestPillText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#5B3CF5"
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
    backgroundColor: "#F0EDFF",
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
    backgroundColor: "#5B3CF5",
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
