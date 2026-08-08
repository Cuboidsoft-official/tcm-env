import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getUserClassReviews } from "../api/client";
import { fonts } from "../constants/fonts";
import { colors, shadow } from "../constants/theme";

const { width } = Dimensions.get("window");

export default function MyReviewsModal({ visible, session, userId, user = {}, onClose }) {
  const [activeTab, setActiveTab] = useState("mentor_feedback"); // "mentor_feedback" | "my_reflections"
  const [loading, setLoading] = useState(true);
  const [reviewsData, setReviewsData] = useState({
    averageRating: 4.9,
    totalReviews: 8,
    mentorReviews: [],
    reflections: []
  });

  const defaultMentorReviews = [
    {
      id: "rev1",
      mentorName: "Rahul Sharma",
      mentorRole: "Full Stack Lead Mentor",
      mentorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      className: "Day 1: React State Architecture & Hooks",
      rating: 5,
      answeredQuestions: "Yes",
      activeStatus: "High",
      askedQuestions: "Yes",
      comment: "Excellent participation! Ayushman answered all live coding questions promptly and demonstrated great understanding of state management.",
      createdAt: "2 days ago"
    },
    {
      id: "rev2",
      mentorName: "Priya Verma",
      mentorRole: "Data Structures & Algorithms Instructor",
      mentorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      className: "Day 3: Graph Traversal Algorithms & BFS/DFS",
      rating: 5,
      answeredQuestions: "Yes",
      activeStatus: "High",
      askedQuestions: "Yes",
      comment: "Very active in doubt clearance session. Cleared BFS implementation questions with optimal time complexity.",
      createdAt: "1 week ago"
    },
    {
      id: "rev3",
      mentorName: "Amit Kumar",
      mentorRole: "System Design Faculty",
      mentorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      className: "Day 5: Microservices & Database Sharding",
      rating: 4,
      answeredQuestions: "Partially",
      activeStatus: "Medium",
      askedQuestions: "Yes",
      comment: "Good interest in database scaling. Asked thoughtful questions regarding Redis cache eviction policies.",
      createdAt: "2 weeks ago"
    }
  ];

  const defaultReflections = [
    {
      id: "ref1",
      className: "Full Stack Masterclass - Day 1",
      rating: 5,
      comment: "Understood React custom hooks deeply! Practice project completed successfully.",
      createdAt: "2 days ago"
    },
    {
      id: "ref2",
      className: "DSA Advanced Batch - Day 3",
      rating: 5,
      comment: "Solved 3 Medium LeetCode problems post class. Great explanation by mentor!",
      createdAt: "1 week ago"
    }
  ];

  useEffect(() => {
    if (visible) {
      loadUserReviews();
    }
  }, [visible, userId, session?.token]);

  async function loadUserReviews() {
    setLoading(true);
    const targetId = userId || session?.user?.id || session?.user?._id || "seed-user";
    try {
      const res = await getUserClassReviews(targetId, session?.token);
      if (res && res.success) {
        setReviewsData({
          averageRating: res.averageRating || 5.0,
          totalReviews: res.totalReviews || res.mentorReviews?.length || 0,
          mentorReviews: res.mentorReviews || [],
          reflections: res.reflections || []
        });
      } else {
        setReviewsData({
          averageRating: 5.0,
          totalReviews: 0,
          mentorReviews: [],
          reflections: []
        });
      }
    } catch (e) {
      setReviewsData({
        averageRating: 5.0,
        totalReviews: 0,
        mentorReviews: [],
        reflections: []
      });
    } finally {
      setLoading(false);
    }
  }

  const mentorRevList = reviewsData.mentorReviews;
  const reflectionsList = reviewsData.reflections;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.sheetBox}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <FontAwesome name="star" size={18} color="#E7A900" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>Class Reviews & Performance</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Performance Hero Card */}
          <View style={styles.heroRatingCard}>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.avgRatingNum}>{reviewsData.averageRating}</Text>
              <View style={{ flexDirection: "row", gap: 3, marginVertical: 4 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <FontAwesome
                    key={star}
                    name={star <= Math.round(reviewsData.averageRating) ? "star" : "star-o"}
                    size={14}
                    color="#E7A900"
                  />
                ))}
              </View>
              <Text style={styles.ratingSub}>Overall Performance Score</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={{ flex: 1, paddingLeft: 12 }}>
              <View style={styles.heroStatItem}>
                <Feather name="award" size={14} color="#5B3CF5" style={{ marginRight: 6 }} />
                <Text style={styles.heroStatText}>
                  <Text style={styles.boldText}>{reviewsData.totalReviews}</Text> Mentor Feedbacks
                </Text>
              </View>
              <View style={[styles.heroStatItem, { marginTop: 6 }]}>
                <Feather name="check-circle" size={14} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={styles.heroStatText}>
                  High Class Participation
                </Text>
              </View>
              <View style={[styles.heroStatItem, { marginTop: 6 }]}>
                <Feather name="help-circle" size={14} color="#3B82F6" style={{ marginRight: 6 }} />
                <Text style={styles.heroStatText}>
                  Active Doubt Resolver
                </Text>
              </View>
            </View>
          </View>

          {/* Sub Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              onPress={() => setActiveTab("mentor_feedback")}
              style={[styles.tabBtn, activeTab === "mentor_feedback" && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === "mentor_feedback" && styles.tabBtnTextActive]}>
                Mentor Reviews ({mentorRevList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("my_reflections")}
              style={[styles.tabBtn, activeTab === "my_reflections" && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === "my_reflections" && styles.tabBtnTextActive]}>
                Class Reflections ({reflectionsList.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content List */}
          {loading ? (
            <ActivityIndicator size="medium" color="#5B3CF5" style={{ marginVertical: 30 }} />
          ) : activeTab === "mentor_feedback" ? (
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {mentorRevList.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 36 }}>
                  <FontAwesome name="star-o" size={32} color="#CBD5E1" />
                  <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: "#64748B", marginTop: 8 }}>
                    No mentor reviews received yet
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "#94A3B8", marginTop: 4, textAlign: "center", paddingHorizontal: 20 }}>
                    Attend live classes and participate in doubt clearance sessions to receive performance feedback from mentors!
                  </Text>
                </View>
              ) : (
                mentorRevList.map((item, index) => (
                  <View key={item.id || index} style={styles.reviewCard}>
                    {/* Mentor Header */}
                    <View style={styles.cardHeader}>
                      <Image
                        source={{ uri: item.mentorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" }}
                        style={styles.mentorAvatar}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={styles.mentorName}>{item.mentorName}</Text>
                          <MaterialCommunityIcons name="check-decagram" size={14} color="#5B3CF5" style={{ marginLeft: 4 }} />
                        </View>
                        <Text style={styles.classNameText}>{item.className}</Text>
                      </View>

                      {/* Star Rating Badge */}
                      <View style={styles.starBadge}>
                        <FontAwesome name="star" size={12} color="#E7A900" style={{ marginRight: 4 }} />
                        <Text style={styles.starBadgeText}>{item.rating}.0</Text>
                      </View>
                    </View>

                    {/* Attendance Performance Metrics Pills */}
                    <View style={styles.metricsPillsRow}>
                      <View style={[styles.metricPill, { backgroundColor: item.answeredQuestions === "Yes" ? "#DCFCE7" : "#FEF3C7" }]}>
                        <Feather name="message-square" size={11} color={item.answeredQuestions === "Yes" ? "#166534" : "#92400E"} />
                        <Text style={[styles.metricPillText, { color: item.answeredQuestions === "Yes" ? "#166534" : "#92400E" }]}>
                          Answered: {item.answeredQuestions || "Yes"}
                        </Text>
                      </View>

                      <View style={[styles.metricPill, { backgroundColor: "#E0F2FE" }]}>
                        <Feather name="activity" size={11} color="#0369A1" />
                        <Text style={[styles.metricPillText, { color: "#0369A1" }]}>
                          Active: {item.activeStatus || "High"}
                        </Text>
                      </View>

                      <View style={[styles.metricPill, { backgroundColor: "#F3E8FF" }]}>
                        <Feather name="help-circle" size={11} color="#6B21A8" />
                        <Text style={[styles.metricPillText, { color: "#6B21A8" }]}>
                          Questions Asked: {item.askedQuestions || "Yes"}
                        </Text>
                      </View>
                    </View>

                    {/* Mentor Comments / Notes */}
                    {item.comment ? (
                      <Text style={styles.commentText}>"{item.comment}"</Text>
                    ) : null}

                    <Text style={styles.timeText}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recently"}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          ) : (
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {reflectionsList.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 36 }}>
                  <Feather name="book-open" size={32} color="#CBD5E1" />
                  <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: "#64748B", marginTop: 8 }}>
                    No class reflections submitted yet
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "#94A3B8", marginTop: 4, textAlign: "center", paddingHorizontal: 20 }}>
                    After finishing a live class session in Continue Learning, complete your post-class reflection to earn +20 XP!
                  </Text>
                </View>
              ) : (
                reflectionsList.map((ref, index) => (
                  <View key={ref.id || index} style={styles.reviewCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={styles.classNameText}>{ref.className}</Text>
                      <View style={styles.starBadge}>
                        <FontAwesome name="star" size={12} color="#E7A900" style={{ marginRight: 4 }} />
                        <Text style={styles.starBadgeText}>{ref.rating || 5}.0</Text>
                      </View>
                    </View>
                    <Text style={[styles.commentText, { marginTop: 8 }]}>"{ref.comment}"</Text>
                    <Text style={styles.timeText}>{ref.createdAt ? new Date(ref.createdAt).toLocaleDateString() : "Submitted"}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end"
  },
  sheetBox: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: "85%"
  },
  handleBar: {
    width: 38,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  closeBtn: {
    padding: 6
  },
  heroRatingCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16
  },
  avgRatingNum: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: "#0F172A",
    lineHeight: 36
  },
  ratingSub: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: "#64748B"
  },
  heroDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 14
  },
  heroStatItem: {
    flexDirection: "row",
    alignItems: "center"
  },
  heroStatText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: "#334155"
  },
  boldText: {
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 3,
    marginBottom: 14
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 9
  },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    ...shadow.sm
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: "#64748B"
  },
  tabBtnTextActive: {
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...shadow.sm
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center"
  },
  mentorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  mentorName: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  classNameText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: "#64748B",
    marginTop: 1
  },
  starBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8EC",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  starBadgeText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: "#D97706"
  },
  metricsPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginVertical: 10
  },
  metricPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  metricPillText: {
    fontSize: 10.5,
    fontFamily: fonts.bold
  },
  commentText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: "#334155",
    lineHeight: 17
  },
  timeText: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: "#94A3B8",
    marginTop: 6,
    textAlign: "right"
  }
});
