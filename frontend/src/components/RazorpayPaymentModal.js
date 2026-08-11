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

  const courseTitle = course.title || "TCM Course";
  const coursePrice = course.price || "₹1,499";
  const originalPrice = course.originalPrice || "₹4,999";
  const whatsappNumber = "9238695500";

  function handleOpenWhatsApp() {
    const message = `Hi TCM Support Team! I want to purchase the course: "${courseTitle}" (${coursePrice}). Please share Razorpay / UPI payment details so I can complete my payment.`;
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/91${whatsappNumber}?text=${encoded}`;

    Linking.openURL(url).catch(() => {
      Alert.alert(
        "WhatsApp Direct Contact 💬",
        `Please send a WhatsApp message to +91 ${whatsappNumber} with course title: "${courseTitle}".`
      );
    });
  }

  function handleConfirmPayment() {
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      Alert.alert(
        "Payment Verification Submitted 🚀",
        `Thank you! Your payment for "${courseTitle}" has been recorded. Once verified on WhatsApp (+91 ${whatsappNumber}), your course access will remain unlocked forever!`,
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
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={styles.razorpayLogoBadge}>
                <MaterialCommunityIcons name="credit-card-chip-outline" size={22} color="#0066FF" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Razorpay Checkout</Text>
                <Text style={styles.headerSub}>Payment Gateway Integration Notice</Text>
              </View>
            </View>
            <Pressable hitSlop={12} onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Warning Alert Banner */}
            <View style={styles.warningBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#D97706" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>Payment Gateway Under Maintenance</Text>
                <Text style={styles.warningDesc}>
                  Automated Razorpay checkout is currently unavailable. Please send details directly on WhatsApp to <Text style={{ fontWeight: "700", color: "#B45309" }}>9238695500</Text> to complete your payment and unlock course access.
                </Text>
              </View>
            </View>

            {/* Course Summary Card */}
            <View style={[styles.courseCard, { backgroundColor: theme.isDark ? theme.inputBg || "#131927" : "#F4F7F4", borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={[styles.courseTitle, { color: theme.text }]}>{courseTitle}</Text>
                <Text style={[styles.courseCategory, { color: theme.subtext }]}>{course.category || "TCM Certification"} • Lifetime Access</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <MaterialCommunityIcons name="gift-outline" size={13} color="#059669" />
                  <Text style={{ fontSize: 10.5, fontFamily: fonts.bold, color: "#059669" }}>₹300 Cash Referrer Reward Active</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.priceText, { color: theme.primary }]}>{coursePrice}</Text>
                <Text style={styles.originalPriceText}>{originalPrice}</Text>
              </View>
            </View>

            {/* Wallet Cash Course Purchase Banner */}
            <View style={{ backgroundColor: "#E8F5E9", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "#C8E6C9", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <MaterialCommunityIcons name="wallet-outline" size={18} color="#0A6836" />
                  <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: "#0A6836" }}>Eligible for Wallet Course Purchase 🎓</Text>
                </View>
                <Text style={{ fontFamily: fonts.bold, fontSize: 11.5, color: "#0A6836", backgroundColor: "#C8E6C9", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  500 Coins = ₹100 Cash
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.regular, fontSize: 11.5, color: "#1E293B", lineHeight: 17 }}>
                Aap apne converted referral wallet balance (ya converted coins cash) se iss course ko direct purchase/discount kar sakte hain!
              </Text>
            </View>

            {/* WhatsApp Contact Action */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>Step 1: Contact via WhatsApp</Text>
              <Text style={[styles.sectionSub, { color: theme.subtext }]}>
                Send your course name to <Text style={{ fontFamily: fonts.bold, color: theme.text }}>+91 {whatsappNumber}</Text> to get UPI / QR / Bank transfer details.
              </Text>

              <TouchableOpacity
                onPress={handleOpenWhatsApp}
                style={styles.whatsappButton}
                activeOpacity={0.85}
              >
                <FontAwesome5 name="whatsapp" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
                <Text style={styles.whatsappButtonText}>Send Details on WhatsApp (9238695500) 💬</Text>
              </TouchableOpacity>
            </View>

            {/* Step 2: Confirm Payment */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>Step 2: Confirm & Access Course</Text>
              <Text style={[styles.sectionSub, { color: theme.subtext }]}>
                Once payment is sent on WhatsApp, tap below to complete your enrollment and unlock your course.
              </Text>

              {!showUtrField ? (
                <TouchableOpacity
                  onPress={() => setShowUtrField(true)}
                  style={[styles.utrToggleBtn, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}
                >
                  <Feather name="shield-check" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.utrToggleText, { color: theme.primary }]}>Enter UTR / Transaction ID (Optional)</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ marginTop: 8 }}>
                  <TextInput
                    placeholder="Enter 12-digit UTR / UPI Ref Number"
                    placeholderTextColor={theme.subtext}
                    style={[styles.utrInput, { backgroundColor: theme.inputBg || "#F8FAFC", color: theme.text, borderColor: theme.border }]}
                    value={utrInput}
                    onChangeText={setUtrInput}
                  />
                </View>
              )}

              <TouchableOpacity
                onPress={handleConfirmPayment}
                style={[styles.confirmButton, { backgroundColor: theme.primary }]}
                activeOpacity={0.85}
                disabled={confirming}
              >
                <Feather name="check-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.confirmButtonText}>{confirming ? "Processing..." : "Complete Payment & Unlock Course 🚀"}</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 16,
    maxHeight: "90%",
    ...shadow.soft
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  razorpayLogoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE"
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 17
  },
  headerSub: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#64748B"
  },
  closeBtn: {
    padding: 6
  },
  scrollBody: {
    padding: 20,
    gap: 16
  },
  warningBanner: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDE68A"
  },
  warningTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#92400E",
    marginBottom: 3
  },
  warningDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#78350F",
    lineHeight: 18
  },
  courseCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1
  },
  courseTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    marginBottom: 4
  },
  courseCategory: {
    fontFamily: fonts.medium,
    fontSize: 11
  },
  priceText: {
    fontFamily: fonts.bold,
    fontSize: 18
  },
  originalPriceText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#94A3B8",
    textDecorationLine: "line-through"
  },
  sectionWrap: {
    gap: 8
  },
  sectionHeading: {
    fontFamily: fonts.bold,
    fontSize: 14
  },
  sectionSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#334155",
    ...shadow.soft
  },
  whatsappButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FFFFFF"
  },
  utrToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4
  },
  utrToggleText: {
    fontFamily: fonts.bold,
    fontSize: 12
  },
  utrInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: fonts.medium,
    borderWidth: 1
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
    ...shadow.soft
  },
  confirmButtonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FFFFFF"
  }
});
