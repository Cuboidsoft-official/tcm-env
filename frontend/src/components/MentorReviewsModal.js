import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { submitMentorStudentReview, getMentorClassReviews, getEnrolledStudents } from "../api/client";
import { fonts } from "../constants/fonts";
import { shadow } from "../constants/theme";

export default function MentorReviewsModal({ visible, session, courses = [], onClose }) {
  const [activeTab, setActiveTab] = useState("write_review"); // "write_review" | "student_reflections" | "view_reviews"
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewsList, setReviewsList] = useState([]);
  const [reflectionsList, setReflectionsList] = useState([]);
  const [mentorReviewsList, setMentorReviewsList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [classList, setClassList] = useState([]);

  // Form State for Writing Review
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [answeredQuestions, setAnsweredQuestions] = useState("Yes"); // Yes | Partially | No
  const [activeStatus, setActiveStatus] = useState("High"); // High | Medium | Low
  const [askedQuestions, setAskedQuestions] = useState("Yes"); // Yes | No
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible, session?.token, courses]);

  async function loadInitialData() {
    setLoading(true);
    try {
      if (session?.token) {
        const [revRes, studRes] = await Promise.all([
          getMentorClassReviews(session.token),
          getEnrolledStudents(session.token)
        ]);

        if (revRes) {
          const allRev = revRes.reviews || [];
          setReviewsList(allRev);
          setReflectionsList(revRes.reflections || allRev.filter((r) => r.type === "student_reflection"));
          setMentorReviewsList(revRes.mentorReviews || allRev.filter((r) => r.type === "mentor_feedback"));
        }

        if (studRes && Array.isArray(studRes.students) && studRes.students.length > 0) {
          setStudentsList(studRes.students);
          setSelectedStudent(studRes.students[0]);
        } else {
          const fallbackStudents = [
            { id: "u-ankit", name: "Ankit Sharma", role: "React Aspirant", avatarUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=120" },
            { id: "u-priya", name: "Priya Verma", role: "NEET Aspirant", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120" },
            { id: "u-ayushman", name: "Ayushman", role: "Full Stack Student", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120" }
          ];
          setStudentsList(fallbackStudents);
          setSelectedStudent(fallbackStudents[0]);
        }
      }
    } catch (e) {} finally {
      setLoading(false);
    }

    // Extract real classes from mentor courses
    let extractedClasses = [];
    if (Array.isArray(courses) && courses.length > 0) {
      courses.forEach((c) => {
        if (Array.isArray(c.modules)) {
          c.modules.forEach((mod, idx) => {
            extractedClasses.push({
              id: `${c.id || "c1"}_m${idx + 1}`,
              name: `${c.title} - ${mod.dayNum || `Day ${idx + 1}`}: ${mod.topic || mod.title}`
            });
          });
        }
      });
    }

    if (extractedClasses.length === 0) {
      extractedClasses = [
        { id: "lc1", name: "Full Stack Masterclass - Day 1: React Foundations & Setup" },
        { id: "lc2", name: "Full Stack Masterclass - Day 2: Hooks & Context API" },
        { id: "lc3", name: "Full Stack Masterclass - Day 3: Node.js REST API & Express" },
        { id: "lc4", name: "Full Stack Masterclass - Day 4: MongoDB Schema & Queries" }
      ];
    }
    setClassList(extractedClasses);
    setSelectedClass(extractedClasses[0]);
  }

  async function handleSubmitReview() {
    if (!selectedStudent?.id) {
      Alert.alert("Validation Error", "Please select a student to review.");
      return;
    }

    setSubmitting(true);
    const payload = {
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentAvatar: selectedStudent.avatarUrl,
      classId: selectedClass.id,
      className: selectedClass.name,
      courseId: "c1",
      rating,
      answeredQuestions,
      activeStatus,
      askedQuestions,
      comment: commentText.trim() || `Great participation in ${selectedClass.name}!`
    };

    try {
      if (session?.token) {
        const res = await submitMentorStudentReview(session.token, payload);
        if (res && res.success) {
          Alert.alert("Review Submitted!", `Feedback for ${selectedStudent.name} saved successfully.`);
          if (res.review) {
            setReviewsList((prev) => [res.review, ...prev]);
          }
          setCommentText("");
          setActiveTab("view_reviews");
        }
      } else {
        Alert.alert("Review Saved!", `Feedback for ${selectedStudent.name} saved successfully.`);
        setReviewsList((prev) => [
          {
            id: `rev_${Date.now()}`,
            ...payload,
            mentorName: session?.user?.name || "TCM Mentor",
            createdAt: "Just now"
          },
          ...prev
        ]);
        setCommentText("");
        setActiveTab("view_reviews");
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable onPress={onClose} style={styles.overlay}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.sheetBox}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <FontAwesome name="star" size={18} color="#E7A900" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>Class & Student Reviews</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Tab Selection */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              onPress={() => setActiveTab("write_review")}
              style={[styles.tabBtn, activeTab === "write_review" && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === "write_review" && styles.tabBtnTextActive]}>
                + Evaluate Student
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("student_reflections")}
              style={[styles.tabBtn, activeTab === "student_reflections" && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === "student_reflections" && styles.tabBtnTextActive]}>
                Student Reflections ({reflectionsList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("view_reviews")}
              style={[styles.tabBtn, activeTab === "view_reviews" && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === "view_reviews" && styles.tabBtnTextActive]}>
                Evaluations ({mentorReviewsList.length})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "write_review" ? (
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* 1. Select Student */}
              <Text style={styles.inputLabel}>Select Student to Review:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {studentsList.map((st) => {
                  const isSel = selectedStudent?.id === st.id;
                  return (
                    <TouchableOpacity
                      key={st.id}
                      onPress={() => setSelectedStudent(st)}
                      style={[styles.studentPill, isSel && styles.studentPillActive]}
                    >
                      <Image source={{ uri: st.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120" }} style={styles.studentPillAvatar} />
                      <View>
                        <Text style={[styles.studentPillName, isSel && styles.studentPillNameActive]}>{st.name}</Text>
                        <Text style={styles.studentPillRole}>{st.role || "Learner"}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 2. Select Class Day */}
              <Text style={styles.inputLabel}>Select Live Class Session:</Text>
              <View style={styles.pickerBox}>
                {classList.map((cl) => {
                  const isSel = selectedClass?.id === cl.id;
                  return (
                    <TouchableOpacity
                      key={cl.id}
                      onPress={() => setSelectedClass(cl)}
                      style={[styles.classOptionRow, isSel && styles.classOptionActive]}
                    >
                      <Feather name={isSel ? "check-circle" : "circle"} size={16} color={isSel ? "#5B3CF5" : "#94A3B8"} />
                      <Text style={[styles.classOptionText, isSel && styles.classOptionTextActive]}>{cl.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 3. Answered Questions in Class? */}
              <Text style={styles.inputLabel}>Did student answer questions in class?</Text>
              <View style={styles.optionsRow}>
                {["Yes", "Partially", "No"].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setAnsweredQuestions(opt)}
                    style={[styles.chipBtn, answeredQuestions === opt && styles.chipBtnActive]}
                  >
                    <Text style={[styles.chipBtnText, answeredQuestions === opt && styles.chipBtnTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 4. Active Status */}
              <Text style={styles.inputLabel}>Class Active & Engagement Level:</Text>
              <View style={styles.optionsRow}>
                {["High", "Medium", "Low"].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setActiveStatus(opt)}
                    style={[styles.chipBtn, activeStatus === opt && styles.chipBtnActive]}
                  >
                    <Text style={[styles.chipBtnText, activeStatus === opt && styles.chipBtnTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 5. Asked Doubts / Questions? */}
              <Text style={styles.inputLabel}>Did student ask doubts/questions?</Text>
              <View style={styles.optionsRow}>
                {["Yes", "No"].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setAskedQuestions(opt)}
                    style={[styles.chipBtn, askedQuestions === opt && styles.chipBtnActive]}
                  >
                    <Text style={[styles.chipBtnText, askedQuestions === opt && styles.chipBtnTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 6. Star Rating */}
              <Text style={styles.inputLabel}>Student Rating (1 to 5 Stars):</Text>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <FontAwesome name={star <= rating ? "star" : "star-o"} size={26} color="#E7A900" />
                  </TouchableOpacity>
                ))}
              </View>

              {/* 7. Mentor Comments */}
              <Text style={styles.inputLabel}>Mentor Feedback & Notes:</Text>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="e.g. Great participation! Demonstrated clear understanding of React hooks..."
                placeholderTextColor="#A0A0B8"
                multiline
                numberOfLines={3}
                style={styles.textInputArea}
              />

              <TouchableOpacity onPress={handleSubmitReview} disabled={submitting} style={styles.submitBtn}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Student Feedback</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          ) : activeTab === "student_reflections" ? (
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {loading ? (
                <ActivityIndicator size="medium" color="#5B3CF5" style={{ marginVertical: 20 }} />
              ) : reflectionsList.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 36 }}>
                  <Feather name="book-open" size={32} color="#CBD5E1" />
                  <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: "#64748B", marginTop: 8 }}>
                    No student reflections received yet
                  </Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "#94A3B8", marginTop: 4, textAlign: "center", paddingHorizontal: 20 }}>
                    When students finish live classes in Continue Learning, their feedback & ratings will appear here!
                  </Text>
                </View>
              ) : (
                reflectionsList.map((ref, idx) => (
                  <View key={ref.id || idx} style={styles.reviewCard}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Image source={{ uri: ref.studentAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120" }} style={styles.studentAvatar} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.studentName}>{ref.studentName || "Student"}</Text>
                        <Text style={styles.classNameText}>{ref.className}</Text>
                      </View>
                      <View style={styles.starBadge}>
                        <FontAwesome name="star" size={12} color="#E7A900" style={{ marginRight: 4 }} />
                        <Text style={styles.starBadgeText}>{ref.rating || 5}.0</Text>
                      </View>
                    </View>

                    <View style={styles.pillsRow}>
                      <View style={styles.miniPill}><Text style={styles.miniPillText}>Speaking: {ref.activeStatus || "Yes"}</Text></View>
                      <View style={styles.miniPill}><Text style={styles.miniPillText}>Doubts Cleared: {ref.answeredQuestions || "Yes"}</Text></View>
                      <View style={styles.miniPill}><Text style={styles.miniPillText}>Asked Qs: {ref.askedQuestions || "Yes"}</Text></View>
                    </View>

                    {ref.comment ? <Text style={styles.commentText}>"{ref.comment}"</Text> : null}
                  </View>
                ))
              )}
            </ScrollView>
          ) : (
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {loading ? (
                <ActivityIndicator size="medium" color="#5B3CF5" style={{ marginVertical: 20 }} />
              ) : mentorReviewsList.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 30 }}>
                  <Feather name="star" size={32} color="#CBD5E1" />
                  <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: "#64748B", marginTop: 8 }}>
                    No evaluations submitted yet
                  </Text>
                </View>
              ) : (
                mentorReviewsList.map((rev, idx) => (
                  <View key={rev.id || idx} style={styles.reviewCard}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Image source={{ uri: rev.studentAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120" }} style={styles.studentAvatar} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.studentName}>{rev.studentName}</Text>
                        <Text style={styles.classNameText}>{rev.className}</Text>
                      </View>
                      <View style={styles.starBadge}>
                        <FontAwesome name="star" size={12} color="#E7A900" style={{ marginRight: 4 }} />
                        <Text style={styles.starBadgeText}>{rev.rating}.0</Text>
                      </View>
                    </View>

                    <View style={styles.pillsRow}>
                      <View style={styles.miniPill}><Text style={styles.miniPillText}>Answers: {rev.answeredQuestions}</Text></View>
                      <View style={styles.miniPill}><Text style={styles.miniPillText}>Active: {rev.activeStatus}</Text></View>
                      <View style={styles.miniPill}><Text style={styles.miniPillText}>Questions: {rev.askedQuestions}</Text></View>
                    </View>

                    {rev.comment ? <Text style={styles.commentText}>"{rev.comment}"</Text> : null}
                  </View>
                ))
              )}
            </ScrollView>
          )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
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
    maxHeight: "88%"
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
    fontSize: 11.5,
    fontFamily: fonts.medium,
    color: "#64748B"
  },
  tabBtnTextActive: {
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: "#334155",
    marginBottom: 6
  },
  studentPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  studentPillActive: {
    backgroundColor: "#F0EDFF",
    borderColor: "#5B3CF5"
  },
  studentPillAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8
  },
  studentPillName: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  studentPillNameActive: {
    color: "#5B3CF5"
  },
  studentPillRole: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: "#64748B"
  },
  pickerBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    gap: 6
  },
  classOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    gap: 8
  },
  classOptionActive: {
    backgroundColor: "#F0EDFF"
  },
  classOptionText: {
    fontSize: 11.5,
    fontFamily: fonts.medium,
    color: "#334155"
  },
  classOptionTextActive: {
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },
  optionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  chipBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  chipBtnActive: {
    backgroundColor: "#5B3CF5",
    borderColor: "#5B3CF5"
  },
  chipBtnText: {
    fontSize: 11.5,
    fontFamily: fonts.medium,
    color: "#475569"
  },
  chipBtnTextActive: {
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  textInputArea: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    textAlignVertical: "top",
    height: 70,
    marginBottom: 14
  },
  submitBtn: {
    backgroundColor: "#5B3CF5",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: fonts.bold
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
  studentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17
  },
  studentName: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: "#0F172A"
  },
  classNameText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: "#64748B"
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
  pillsRow: {
    flexDirection: "row",
    gap: 6,
    marginVertical: 6
  },
  miniPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  miniPillText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: "#475569"
  },
  commentText: {
    fontSize: 11.5,
    fontFamily: fonts.regular,
    color: "#334155"
  }
});
