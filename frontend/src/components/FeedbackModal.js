import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Feather, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

const CATEGORY_OPTIONS = [
  { id: "app", label: "App Experience", icon: "smartphone" },
  { id: "course", label: "Course Content", icon: "book-open" },
  { id: "bug", label: "Performance & Bug", icon: "zap" },
  { id: "feature", label: "Feature Request", icon: "lightbulb" }
];

export default function FeedbackModal({ visible, onClose, user = {} }) {
  const { theme } = useTheme();
  const [rating, setRating] = useState(5);
  const [selectedCategoryId, setSelectedCategoryId] = useState("app");
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!visible) return null;

  function handleSubmit() {
    if (!feedbackText.trim()) {
      Alert.alert("Feedback Required", "Please write a brief feedback or review before submitting.");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert("Feedback Submitted", "Thank you for rating and helping us improve TCM Academy!");
      setFeedbackText("");
      onClose();
    }, 600);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlayBg}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheetCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {/* Top Handle Bar */}
          <View style={styles.handleBarWrap}>
            <View style={[styles.handleBar, { backgroundColor: theme.isDark ? "#334155" : "#E2E8F0" }]} />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={[styles.headerIconWrap, { backgroundColor: theme.badgeBg }]}>
                <FontAwesome name="star" size={18} color="#D97706" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Feedback & Suggestions</Text>
                <Text style={[styles.headerSub, { color: theme.subtext }]}>Share ratings, reviews & feature ideas</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}>
              <Feather name="x" size={18} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Star Rating Section */}
            <View style={styles.sectionBox}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>Rate Your Experience</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((starNum) => (
                  <TouchableOpacity
                    key={starNum}
                    activeOpacity={0.7}
                    onPress={() => setRating(starNum)}
                    style={styles.starTouch}
                  >
                    <FontAwesome
                      name={starNum <= rating ? "star" : "star-o"}
                      size={28}
                      color={starNum <= rating ? "#F59E0B" : (theme.isDark ? "#475569" : "#CBD5E1")}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                <Feather name="thumbs-up" size={13} color="#D97706" />
                <Text style={styles.ratingReflectionText}>
                  {rating === 5 ? "Outstanding Experience" : rating === 4 ? "Great Experience" : rating === 3 ? "Good, can improve" : "Needs Improvement"}
                </Text>
              </View>
            </View>

            {/* Category Select Section */}
            <View style={styles.sectionBox}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>Select Category</Text>
              <View style={styles.categoriesWrap}>
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.8}
                      onPress={() => setSelectedCategoryId(cat.id)}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: isSelected ? theme.primary : (theme.isDark ? "#1E293B" : "#F1F5F9"),
                          borderColor: isSelected ? theme.primary : theme.border
                        }
                      ]}
                    >
                      <Feather name={cat.icon} size={14} color={isSelected ? "#FFFFFF" : theme.primary} />
                      <Text style={[styles.catChipText, { color: isSelected ? "#FFFFFF" : theme.text }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Feedback Multiline Input */}
            <View style={styles.sectionBox}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>Your Review & Feedback</Text>
              <TextInput
                multiline
                numberOfLines={4}
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="Tell us what you loved or how we can improve TCM Academy..."
                placeholderTextColor={theme.subtext}
                style={[
                  styles.multilineInput,
                  {
                    backgroundColor: theme.isDark ? "#0F172A" : "#FAFAFA",
                    borderColor: theme.border,
                    color: theme.text
                  }
                ]}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            >
              <Feather name="send" size={15} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                {submitting ? "Submitting..." : "Submit Feedback & Review"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayBg: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  sheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: "85%",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24
  },
  handleBarWrap: {
    alignItems: "center",
    paddingVertical: 10
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.15)"
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 16
  },
  headerSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 1
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center"
  },
  scrollBody: {
    gap: 16,
    paddingBottom: 10
  },
  sectionBox: {
    gap: 8
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 13
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4
  },
  starTouch: {
    padding: 2
  },
  ratingReflectionText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#D97706"
  },
  categoriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1
  },
  catChipText: {
    fontFamily: fonts.semiBold,
    fontSize: 12
  },
  multilineInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    minHeight: 90,
    textAlignVertical: "top",
    fontFamily: fonts.regular,
    fontSize: 13
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 6
  },
  submitBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FFFFFF"
  }
});
