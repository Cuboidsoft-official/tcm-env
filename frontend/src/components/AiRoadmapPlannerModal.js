import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Linking,
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
import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { generateInteractiveAiRoadmapAndChat } from "../api/gemini";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

const QUICK_SUGGESTIONS = [
  "Full Stack Web Plan",
  "AI & Data Science Plan",
  "Mobile App Dev Plan",
  "Python & DSA Plan",
  "Give me Day-by-Day Syllabus"
];

function FormattedAiMessage({ text, theme }) {
  if (!text) return null;

  const lines = text.split("\n");
  return (
    <View style={styles.formattedMsgWrap}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={idx} style={{ height: 6 }} />;

        // Header / Section Titles (e.g. 📌, 📅, 🗓️, 💡, ###, **)
        const isHeader =
          trimmed.startsWith("📌") ||
          trimmed.startsWith("📅") ||
          trimmed.startsWith("🗓️") ||
          trimmed.startsWith("💡") ||
          trimmed.startsWith("###") ||
          (trimmed.startsWith("**") && trimmed.endsWith("**"));

        if (isHeader) {
          const cleanHeader = trimmed.replace(/###/g, "").replace(/\*\*/g, "").trim();
          return (
            <View key={idx} style={[styles.sectionHeaderCard, { backgroundColor: theme.isDark ? "#1E293B" : "#EEF2FF" }]}>
              <Text style={[styles.sectionHeaderTitle, { color: theme.primary }]}>{cleanHeader}</Text>
            </View>
          );
        }

        // Bullet / Step items (e.g. - Day 1:, * Day 2:, Month 1:)
        const isStepItem =
          trimmed.startsWith("- ") ||
          trimmed.startsWith("* ") ||
          trimmed.startsWith("• ") ||
          /^(Day|Month|Phase)\s*\d+/i.test(trimmed);

        if (isStepItem) {
          const cleanStep = trimmed.replace(/^[-*•]\s*/, "");
          return (
            <View key={idx} style={styles.stepItemRow}>
              <View style={[styles.stepDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.stepItemText, { color: theme.text }]}>
                {cleanStep}
              </Text>
            </View>
          );
        }

        // Regular Paragraph Text
        return (
          <Text key={idx} style={[styles.msgParagraph, { color: theme.text }]}>
            {trimmed}
          </Text>
        );
      })}
    </View>
  );
}

export default function AiRoadmapPlannerModal({ visible, onClose, user = {} }) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (visible) {
      const initialGreeting = [
        {
          id: "m_1",
          sender: "ai",
          text: `Hello ${user.name || "Learner"}. I am TCM One AI.\n\nWhat skill, topic, or exam would you like to master? Tell me what you want to learn, and I will generate a complete roadmap tailored to your schedule using official TCM One courses and services.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ];
      setMessages(initialGreeting);
      setInputText("");
    }
  }, [visible]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, loading]);

  async function handleSend(textToSend = inputText) {
    const cleanText = (textToSend || "").trim();
    if (!cleanText || loading) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      sender: "user",
      text: cleanText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");
    setLoading(true);

    try {
      const aiReplyText = await generateInteractiveAiRoadmapAndChat(updatedMessages, cleanText);
      const aiMsg = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: aiReplyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: "ai",
          text: "I've processed your request! Based on your goal, we recommend starting with TCM One Full Stack Web Masterclass or AI Specialization. Tap below to export your roadmap to WhatsApp!",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSendToWhatsApp() {
    const userName = user.name || "TCM One Student";
    const lastAiMsg = [...messages].reverse().find((m) => m.sender === "ai")?.text || "Personalized Day-by-Day AI Learning Roadmap";

    const waMsg =
      `🎓 *TCM ONE ACADEMY - DAY-BY-DAY & MONTHLY ROADMAP* 🎓\n\n` +
      `👤 *Student Name:* ${userName}\n` +
      `----------------------------------------\n` +
      `⚡ *TCM ONE AI ROADMAP & SCHEDULE:*\n\n` +
      `${lastAiMsg.slice(0, 1400)}\n\n` +
      `----------------------------------------\n` +
      `📲 *Generated by TCM One AI*\n` +
      `Hotline Support: +91 9238695500`;

    const url = `https://wa.me/919238695500?text=${encodeURIComponent(waMsg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("WhatsApp Error", "Could not open WhatsApp automatically. Support number: +91 9238695500.");
    });
  }

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.overlayBg}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            {/* Top Handle Bar */}
            <View style={styles.handleBarWrap}>
              <View style={[styles.handleBar, { backgroundColor: theme.isDark ? "#334155" : "#E2E8F0" }]} />
            </View>

            {/* Header */}
            <View style={styles.headerRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={[styles.headerIcon, { backgroundColor: theme.badgeBg }]}>
                  <MaterialCommunityIcons name="robot" size={20} color={theme.primary} />
                </View>
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>TCM One AI</Text>
                    <View style={[styles.aiPill, { backgroundColor: theme.badgeBg }]}>
                      <Text style={[styles.aiPillText, { color: theme.primary }]}>TCM One AI</Text>
                    </View>
                  </View>
                  <Text style={[styles.headerSub, { color: theme.subtext }]}>Interactive Day-by-Day & Monthly Roadmap</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}>
                <Feather name="x" size={18} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            {/* Quick Suggestion Chips */}
            <View style={styles.quickChipsWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
                {QUICK_SUGGESTIONS.map((sug) => (
                  <TouchableOpacity
                    key={sug}
                    activeOpacity={0.8}
                    onPress={() => handleSend(`Create a day-by-day and monthly roadmap for ${sug}`)}
                    style={[styles.sugChip, { backgroundColor: theme.isDark ? "#1E293B" : "#F0EDFF", borderColor: theme.border }]}
                  >
                    <Text style={[styles.sugChipText, { color: theme.primary }]}>{sug}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Chat Messages Log */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.msgBubble,
                    msg.sender === "user"
                      ? [styles.userBubble, { backgroundColor: theme.primary }]
                      : [styles.aiBubble, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: theme.border }]
                  ]}
                >
                  {msg.sender === "ai" && (
                    <View style={styles.aiHeaderLine}>
                      <MaterialCommunityIcons name="lightning-bolt" size={14} color={theme.primary} />
                      <Text style={[styles.aiHeaderTitle, { color: theme.primary }]}>TCM AI</Text>
                    </View>
                  )}

                  {msg.sender === "ai" ? (
                    <FormattedAiMessage text={msg.text} theme={theme} />
                  ) : (
                    <Text style={[styles.msgText, { color: "#FFFFFF" }]}>
                      {msg.text}
                    </Text>
                  )}

                  <Text style={[styles.msgTime, { color: msg.sender === "user" ? "rgba(255,255,255,0.7)" : theme.subtext }]}>
                    {msg.time}
                  </Text>
                </View>
              ))}

              {loading && (
                <View style={[styles.msgBubble, styles.aiBubble, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: theme.border, flexDirection: "row", alignItems: "center", gap: 8 }]}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={{ fontSize: 13, color: theme.subtext, fontFamily: fonts.medium }}>
                    TCM AI is designing your Day-by-Day & Monthly roadmap...
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Bottom Export & Input Bar */}
            <View style={styles.bottomBarWrap}>
              {/* WhatsApp Share Button */}
              {messages.some((m) => m.sender === "ai" && m.id !== "m_1") && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSendToWhatsApp}
                  style={styles.waShareBtn}
                >
                  <FontAwesome name="whatsapp" size={16} color="#FFFFFF" />
                  <Text style={styles.waShareBtnText}>Export Full Roadmap to WhatsApp</Text>
                </TouchableOpacity>
              )}

              {/* Chat TextInput Row */}
              <View style={styles.inputRow}>
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask TCM AI what you want to learn or customize plan..."
                  placeholderTextColor={theme.subtext}
                  onSubmitEditing={() => handleSend()}
                  style={[
                    styles.chatInput,
                    {
                      backgroundColor: theme.isDark ? "#0F172A" : "#FAFAFA",
                      borderColor: theme.border,
                      color: theme.text
                    }
                  ]}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleSend()}
                  disabled={loading || !inputText.trim()}
                  style={[
                    styles.sendBtn,
                    { backgroundColor: inputText.trim() ? theme.primary : (theme.isDark ? "#334155" : "#CBD5E1") }
                  ]}
                >
                  <Feather name="send" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    height: "90%",
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 24 : 14
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
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.15)"
  },
  headerIcon: {
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
    fontSize: 11,
    marginTop: 1
  },
  aiPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8
  },
  aiPillText: {
    fontFamily: fonts.bold,
    fontSize: 10
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center"
  },
  quickChipsWrap: {
    marginBottom: 10
  },
  sugChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1
  },
  sugChipText: {
    fontFamily: fonts.bold,
    fontSize: 11
  },
  chatScroll: {
    flex: 1
  },
  chatContent: {
    gap: 12,
    paddingVertical: 10
  },
  msgBubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: "92%"
  },
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4
  },
  aiBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1
  },
  aiHeaderLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8
  },
  aiHeaderTitle: {
    fontFamily: fonts.bold,
    fontSize: 12
  },
  msgText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19
  },
  msgTime: {
    fontFamily: fonts.regular,
    fontSize: 10,
    marginTop: 6,
    alignSelf: "flex-end"
  },
  formattedMsgWrap: {
    gap: 4
  },
  sectionHeaderCard: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 4,
    alignSelf: "flex-start"
  },
  sectionHeaderTitle: {
    fontFamily: fonts.bold,
    fontSize: 13
  },
  stepItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginVertical: 2,
    paddingLeft: 4
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6
  },
  stepItemText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    flex: 1
  },
  msgParagraph: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    marginVertical: 2
  },
  bottomBarWrap: {
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.15)"
  },
  waShareBtn: {
    backgroundColor: "#25D366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12
  },
  waShareBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 12
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  chatInput: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
    fontFamily: fonts.regular
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  }
});
