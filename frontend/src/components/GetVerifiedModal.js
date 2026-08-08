import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
  Platform
} from "react-native";
import { Feather, MaterialCommunityIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function GetVerifiedModal({ visible, onClose, onVerifySuccess, currentPlan = "monthly" }) {
  const [selectedPlan, setSelectedPlan] = useState("monthly"); // "monthly" | "yearly"
  const [loading, setLoading] = useState(false);

  const advantages = [
    {
      id: "real_projects",
      iconName: "folder-code",
      iconType: "feather",
      title: "Real Domain Projects",
      desc: "Access & work on real-world industry production projects with verified completion credentials."
    },
    {
      id: "top_suggestions",
      iconName: "star",
      iconType: "feather",
      title: "Feature Profile on Top Suggestions",
      desc: "Get featured at the top of recommendations for mentors, employers & top recruiter searches."
    },
    {
      id: "ranking_profile",
      iconName: "trending-up",
      iconType: "feather",
      title: "Rank Your Profile",
      desc: "Boost your profile ranking & visibility across TCM community leaderboards."
    },
    {
      id: "ats_resume",
      iconName: "file-text",
      iconType: "feather",
      title: "Make Highly ATS-Optimized Resume with TCM",
      desc: "Build, format & export ATS-compliant resumes with verified TCM badges & skill ratings."
    }
  ];

  function handleSubscribe() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "🎉 Welcome to TCM Verified Pro!",
        `Your ${selectedPlan === "yearly" ? "Yearly (₹249/yr)" : "Monthly (₹29/mo)"} subscription has been activated successfully! Your profile is now verified.`,
        [
          {
            text: "Awesome!",
            onPress: () => {
              if (onVerifySuccess) onVerifySuccess(selectedPlan);
              onClose();
            }
          }
        ]
      );
    }, 1200);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdropOverlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
        <View style={styles.sheetContainer}>
          {/* Top Handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Close Button */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Feather name="x" size={18} color="#64748B" />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Hero Header */}
            <View style={styles.heroSection}>
              <View style={styles.crownBadgeIcon}>
                <MaterialCommunityIcons name="shield-check" size={34} color="#5B3CF5" />
              </View>
              <Text style={styles.heroTitle}>Get TCM Verified</Text>
              <Text style={styles.heroSub}>
                Unlock elite developer tools, top recruiter visibility & industry domain projects.
              </Text>
            </View>

            {/* Plans Selection Cards */}
            <Text style={styles.sectionHeaderTitle}>SELECT YOUR PLAN</Text>
            <View style={styles.plansRow}>
              {/* Monthly Plan Card */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setSelectedPlan("monthly")}
                style={[
                  styles.planCard,
                  selectedPlan === "monthly" && styles.planCardActive
                ]}
              >
                <View style={styles.planCardHeader}>
                  <Text style={[styles.planTitle, selectedPlan === "monthly" && styles.planTitleActive]}>
                    Monthly
                  </Text>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedPlan === "monthly" && styles.radioCircleActive
                    ]}
                  >
                    {selectedPlan === "monthly" && <View style={styles.radioInnerCircle} />}
                  </View>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <Text style={styles.priceNumber}>29</Text>
                  <Text style={styles.pricePeriod}> / month</Text>
                </View>
                <Text style={styles.planSubtext}>Flexible monthly billing. Cancel anytime.</Text>
              </TouchableOpacity>

              {/* Yearly Plan Card */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setSelectedPlan("yearly")}
                style={[
                  styles.planCard,
                  selectedPlan === "yearly" && styles.planCardActive
                ]}
              >
                <View style={styles.saveTagBadge}>
                  <Text style={styles.saveTagText}>SAVE 30% • BEST VALUE</Text>
                </View>
                <View style={styles.planCardHeader}>
                  <Text style={[styles.planTitle, selectedPlan === "yearly" && styles.planTitleActive]}>
                    Yearly
                  </Text>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedPlan === "yearly" && styles.radioCircleActive
                    ]}
                  >
                    {selectedPlan === "yearly" && <View style={styles.radioInnerCircle} />}
                  </View>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <Text style={styles.priceNumber}>249</Text>
                  <Text style={styles.pricePeriod}> / year</Text>
                </View>
                <Text style={styles.planSubtext}>Only ~₹20/mo! Billed annually.</Text>
              </TouchableOpacity>
            </View>

            {/* Advantages & Features Section */}
            <Text style={styles.sectionHeaderTitle}>VERIFIED ADVANTAGES & BENEFITS</Text>
            <View style={styles.advantagesContainer}>
              {advantages.map((item) => (
                <View key={item.id} style={styles.advantageRow}>
                  <View style={styles.advantageIconBox}>
                    <Feather name={item.iconName} size={18} color="#5B3CF5" />
                  </View>
                  <View style={styles.advantageTextContent}>
                    <Text style={styles.advantageTitle}>{item.title}</Text>
                    <Text style={styles.advantageDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Guarantee / Security Notice */}
            <View style={styles.securityBox}>
              <Feather name="lock" size={13} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.securityText}>100% Secure Payment • Instant Verification Activation</Text>
            </View>
          </ScrollView>

          {/* Bottom Action CTA Button */}
          <View style={styles.bottomFooter}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSubscribe}
              disabled={loading}
              style={styles.subscribeBtn}
            >
              <MaterialCommunityIcons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.subscribeBtnText}>
                {loading
                  ? "Processing..."
                  : `Get Verified Now (${selectedPlan === "yearly" ? "₹249/yr" : "₹29/mo"})`}
              </Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end"
  },
  backdropPressable: {
    flex: 1
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.88,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 10
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E2E8F0"
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center"
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16
  },
  heroSection: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 20
  },
  crownBadgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#DDD6FE"
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: -0.3
  },
  heroSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 12,
    lineHeight: 19
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 6
  },
  plansRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 22
  },
  planCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    position: "relative"
  },
  planCardActive: {
    backgroundColor: "#FAF5FF",
    borderColor: "#5B3CF5",
    shadowColor: "#5B3CF5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  saveTagBadge: {
    position: "absolute",
    top: -10,
    right: 8,
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  saveTagText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  planCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  planTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569"
  },
  planTitleActive: {
    color: "#5B3CF5"
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center"
  },
  radioCircleActive: {
    borderColor: "#5B3CF5"
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#5B3CF5"
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A"
  },
  priceNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A"
  },
  pricePeriod: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B"
  },
  planSubtext: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 15
  },
  advantagesContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16
  },
  advantageRow: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  advantageIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2
  },
  advantageTextContent: {
    flex: 1
  },
  advantageTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2
  },
  advantageDesc: {
    fontSize: 11.5,
    color: "#64748B",
    lineHeight: 16
  },
  securityBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6
  },
  securityText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500"
  },
  bottomFooter: {
    paddingHorizontal: 20,
    paddingTop: 10
  },
  subscribeBtn: {
    backgroundColor: "#5B3CF5",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5B3CF5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  subscribeBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700"
  }
});
