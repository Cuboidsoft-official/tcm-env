import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Linking,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Feather, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../constants/fonts";
import { shadow } from "../constants/theme";

export default function RazorpayPaymentModal({ visible, course, onClose, onPaymentComplete }) {
  const { theme } = useTheme();
  const [utrInput, setUtrInput] = useState("");
  const [showUtrField, setShowUtrField] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!visible || !course) return null;

  const courseTitle = course.title || "TCM One Course";
  const coursePrice = course.price || "₹1,499";
  const originalPrice = course.originalPrice || "₹4,999";
  const whatsappNumber = "9238695500";

  function handleOpenWhatsApp() {
    const message = `Hi TCM One Support Team! I want to purchase the course: "${courseTitle}" (${coursePrice}). Please share payment details so I can complete my purchase.`;
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/91${whatsappNumber}?text=${encoded}`;

    Linking.openURL(url).catch(() => {
      Alert.alert(
        "WhatsApp Contact",
        `Please send a message to +91 ${whatsappNumber} with course title: "${courseTitle}".`
      );
    });
  }

  function handleConfirmPayment() {
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      Alert.alert(
        "Payment Verification Submitted",
        `Thank you. Your request for "${courseTitle}" has been recorded. Once verified, your course access will be unlocked.`,
        [
          {
            text: "Access Course Now",
            onPress: () => {
              onPaymentComplete?.(course);
              onClose?.();
            }
          }
        ]
      );
    }, 800);
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.backdrop}>
          <Pressable style={styles.dimLayer} onPress={onClose} />
          <View style={[styles.modalSheet, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            {/* Sheet Handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginBottom: 12 }} />

            {/* Header */}
            <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={styles.razorpayLogoBadge}>
                  <MaterialCommunityIcons name="credit-card-chip-outline" size={20} color="#0066FF" />
                </View>
                <View>
                  <Text style={[styles.headerTitle, { color: theme.text }]}>Razorpay Checkout</Text>
                  <Text style={[styles.headerSub, { color: theme.subtext }]}>Instant Payment & Access</Text>
                </View>
              </View>
              <Pressable hitSlop={12} onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}>
                <Feather name="x" size={18} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {/* Course Card Preview */}
              <View style={[styles.courseCard, { backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC", borderColor: theme.border }]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text numberOfLines={2} style={[styles.courseTitle, { color: theme.text }]}>{courseTitle}</Text>
                  <Text style={[styles.courseCategory, { color: theme.subtext }]}>{course.category || "TCM One Certification"} • Lifetime Access</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.priceText, { color: theme.primary }]}>{coursePrice}</Text>
                  {originalPrice ? <Text style={styles.originalPriceText}>{originalPrice}</Text> : null}
                </View>
              </View>

              {/* Direct WhatsApp Connect Action (Theme Aligned) */}
              <TouchableOpacity
                onPress={handleOpenWhatsApp}
                style={[styles.whatsappButton, { backgroundColor: theme.badgeBg, borderColor: theme.border, borderWidth: 1 }]}
                activeOpacity={0.85}
              >
                <FontAwesome5 name="whatsapp" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.whatsappButtonText, { color: theme.primary }]}>Connect with Course Provider on WhatsApp</Text>
              </TouchableOpacity>

              {/* UTR Optional Input Toggle */}
              {!showUtrField ? (
                <TouchableOpacity
                  onPress={() => setShowUtrField(true)}
                  style={[styles.utrToggleBtn, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}
                >
                  <Feather name="shield-check" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.utrToggleText, { color: theme.primary }]}>Enter Transaction / UTR Ref ID (Optional)</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ marginTop: 4 }}>
                  <TextInput
                    placeholder="Enter 12-digit UTR / UPI Ref Number"
                    placeholderTextColor={theme.subtext}
                    style={[styles.utrInput, { backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC", color: theme.text, borderColor: theme.border }]}
                    value={utrInput}
                    onChangeText={setUtrInput}
                  />
                </View>
              )}

              {/* Complete Payment Button */}
              <TouchableOpacity
                onPress={handleConfirmPayment}
                style={[styles.confirmButton, { backgroundColor: theme.primary }]}
                activeOpacity={0.85}
                disabled={confirming}
              >
                <Feather name="check-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.confirmButtonText}>{confirming ? "Processing Access..." : "Complete Payment & Unlock Course"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end"
  },
  dimLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.65)"
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 12,
    maxHeight: "85%",
    ...shadow.soft
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  razorpayLogoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE"
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 16
  },
  headerSub: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#64748B"
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  scrollBody: {
    padding: 16,
    gap: 12
  },
  courseCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1
  },
  courseTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    marginBottom: 2
  },
  courseCategory: {
    fontFamily: fonts.medium,
    fontSize: 11
  },
  priceText: {
    fontFamily: fonts.bold,
    fontSize: 17
  },
  originalPriceText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#94A3B8",
    textDecorationLine: "line-through"
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    ...shadow.soft
  },
  whatsappButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: "#FFFFFF"
  },
  utrToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1
  },
  utrToggleText: {
    fontFamily: fonts.bold,
    fontSize: 11.5
  },
  utrInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 12.5,
    fontFamily: fonts.medium,
    borderWidth: 1
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 4,
    ...shadow.soft
  },
  confirmButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: "#FFFFFF"
  }
});
