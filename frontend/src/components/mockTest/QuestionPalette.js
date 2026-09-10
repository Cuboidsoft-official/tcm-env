import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../constants/fonts";

export default function QuestionPalette({
  questions = [],
  currentIndex = 0,
  answers = {},
  visitedSet = new Set(),
  onSelectQuestion,
  onCloseMobile,
  selectedLanguage = "en"
}) {
  const { theme } = useTheme();

  let answeredCount = 0;
  let notAnsweredCount = 0;
  let markedCount = 0;
  let markedAndAnsweredCount = 0;
  let notVisitedCount = 0;

  questions.forEach((q, idx) => {
    const qId = q.id || `q_${idx + 1}`;
    const ansState = answers[qId] || {};
    const isVisited = visitedSet.has(idx) || visitedSet.has(qId);
    const hasAns = Boolean(ansState.selectedOption);
    const isMarked = Boolean(ansState.isMarked);

    if (hasAns && isMarked) {
      markedAndAnsweredCount++;
    } else if (isMarked) {
      markedCount++;
    } else if (hasAns) {
      answeredCount++;
    } else if (isVisited) {
      notAnsweredCount++;
    } else {
      notVisitedCount++;
    }
  });

  function getStatusStyle(idx, q) {
    const qId = q.id || `q_${idx + 1}`;
    const ansState = answers[qId] || {};
    const isVisited = visitedSet.has(idx) || visitedSet.has(qId);
    const hasAns = Boolean(ansState.selectedOption);
    const isMarked = Boolean(ansState.isMarked);

    if (hasAns && isMarked) {
      return { bg: "#7C3AED", text: "#FFFFFF", border: "#6D28D9", badge: "✓" };
    }
    if (isMarked) {
      return { bg: "#9333EA", text: "#FFFFFF", border: "#7E22CE", badge: "★" };
    }
    if (hasAns) {
      return { bg: "#16A34A", text: "#FFFFFF", border: "#15803D", badge: null };
    }
    if (isVisited) {
      return { bg: "#DC2626", text: "#FFFFFF", border: "#B91C1C", badge: null };
    }
    return { bg: theme.isDark ? "#1F2937" : "#F1F5F9", text: theme.text, border: theme.border, badge: null };
  }

  const isHindi = selectedLanguage === "hi";

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {isHindi ? "प्रश्न पैलेट" : "Question Palette"}
        </Text>
        {onCloseMobile ? (
          <Pressable onPress={onCloseMobile} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={18} color={theme.subtext} />
          </Pressable>
        ) : null}
      </View>

      {/* Legend Grid */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: "#16A34A" }]} />
          <Text style={[styles.legendText, { color: theme.subtext }]}>
            {isHindi ? "उत्तर दिया" : "Answered"} ({answeredCount})
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: "#DC2626" }]} />
          <Text style={[styles.legendText, { color: theme.subtext }]}>
            {isHindi ? "उत्तर नहीं दिया" : "Not Answered"} ({notAnsweredCount})
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: theme.isDark ? "#1F2937" : "#F1F5F9", borderWidth: 1, borderColor: theme.border }]} />
          <Text style={[styles.legendText, { color: theme.subtext }]}>
            {isHindi ? "देखा नहीं" : "Not Visited"} ({notVisitedCount})
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: "#9333EA" }]} />
          <Text style={[styles.legendText, { color: theme.subtext }]}>
            {isHindi ? "समीक्षा के लिए" : "Marked"} ({markedCount})
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: "#7C3AED" }]}>
            <Text style={{ fontSize: 8, color: "#FFFFFF", fontWeight: "bold" }}>✓</Text>
          </View>
          <Text style={[styles.legendText, { color: theme.subtext }]}>
            {isHindi ? "उत्तर & समीक्षा" : "Ans & Marked"} ({markedAndAnsweredCount})
          </Text>
        </View>
      </View>

      {/* Questions Numbers Grid */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContent}>
        <View style={styles.grid}>
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const status = getStatusStyle(idx, q);

            return (
              <Pressable
                key={q.id || idx}
                onPress={() => {
                  onSelectQuestion(idx);
                  if (onCloseMobile) onCloseMobile();
                }}
                style={({ pressed }) => [
                  styles.qBtn,
                  {
                    backgroundColor: status.bg,
                    borderColor: isCurrent ? theme.primary : status.border,
                    borderWidth: isCurrent ? 2 : 1
                  },
                  pressed && { opacity: 0.8 }
                ]}
              >
                <Text style={[styles.qText, { color: status.text }]}>{idx + 1}</Text>
                {status.badge ? (
                  <Text style={styles.badgeMark}>{status.badge}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    minHeight: 260
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  headerTitle: {
    fontSize: 13.5,
    fontFamily: fonts.bold
  },
  closeBtn: {
    padding: 3
  },
  legendContainer: {
    gap: 4,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.2)"
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  legendBox: {
    width: 13,
    height: 13,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center"
  },
  legendText: {
    fontSize: 10,
    fontFamily: fonts.medium
  },
  gridContent: {
    paddingBottom: 8
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  qBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  qText: {
    fontSize: 11,
    fontFamily: fonts.bold
  },
  badgeMark: {
    position: "absolute",
    top: 1,
    right: 2,
    fontSize: 7,
    color: "#FFFFFF",
    fontFamily: fonts.bold
  }
});
