import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

export default function AuthRequiredModal({
  visible,
  onClose,
  onLogin,
  actionTitle = "perform this action",
  actionIcon = "lock"
}) {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <View style={[styles.bottomSheet, { backgroundColor: theme.cardBg || "#FFFFFF" }]}>
          {/* Grab Handle Indicator */}
          <View style={styles.handleBar} />

          {/* Icon Circle */}
          <LinearGradient
            colors={theme.isDark ? ["#4C1D95", "#6D28D9"] : ["#EEF2FF", "#E0E7FF"]}
            style={styles.iconCircle}
          >
            <Ionicons
              name="lock-closed"
              size={28}
              color={theme.isDark ? "#C7D2FE" : "#4F46E5"}
            />
          </LinearGradient>

          {/* Heading */}
          <Text style={[styles.title, { color: theme.text }]}>
            Login or Sign Up Required
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: theme.subtext }]}>
            To <Text style={{ fontFamily: fonts.bold, color: theme.primary }}>{actionTitle}</Text>, please log in or create your free account on TCM.
          </Text>

          {/* Features List */}
          <View style={[styles.featuresBox, { backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC", borderColor: theme.border }]}>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={15} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={[styles.featureText, { color: theme.text }]}>Apply to top tech & dev job opportunities</Text>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={15} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={[styles.featureText, { color: theme.text }]}>Download study material, notes & PDFs</Text>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={15} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={[styles.featureText, { color: theme.text }]}>Connect with mentors & active learners</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Pressable onPress={onClose} style={[styles.cancelBtn, { borderColor: theme.border }]}>
              <Text style={[styles.cancelBtnText, { color: theme.subtext }]}>Continue Previewing</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onClose();
                if (onLogin) onLogin();
              }}
              style={styles.loginBtnContainer}
            >
              <LinearGradient
                colors={["#0A6836", "#044421"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtn}
              >
                <Text style={styles.loginBtnText}>Log In / Sign Up</Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  bottomSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    marginBottom: 18
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 19,
    textAlign: "center",
    marginBottom: 6
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 10
  },
  featuresBox: {
    width: "100%",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 20
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center"
  },
  featureText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    flex: 1
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  cancelBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13.5
  },
  loginBtnContainer: {
    flex: 1.4,
    borderRadius: 14,
    overflow: "hidden"
  },
  loginBtn: {
    flexDirection: "row",
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center"
  },
  loginBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FFFFFF"
  }
});
