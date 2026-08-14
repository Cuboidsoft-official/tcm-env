import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

export default function TcmLogo({ compact = false }) {
  const { theme } = useTheme();
  const primaryColor = theme?.primary || colors.primary;
  const primaryDarkColor = theme?.primaryDark || colors.primaryDark;

  return (
    <View style={styles.wrap}>
      <View style={[styles.mark, compact && styles.markCompact]}>
        <Ionicons name="person" size={compact ? 20 : 30} color={primaryDarkColor} />
        <View style={styles.bookRow}>
          <View style={[styles.bookPage, { backgroundColor: primaryColor }]} />
          <View style={[styles.bookPage, styles.bookPageRight, { backgroundColor: "#15803D" }]} />
        </View>
      </View>
      <Text style={[styles.title, compact && styles.titleCompact, { color: primaryDarkColor }]}>TCM One</Text>
      <View style={styles.subtitleRow}>
        <View style={[styles.line, { backgroundColor: primaryColor }]} />
        <Text style={[styles.subtitle, compact && styles.subtitleCompact, { color: primaryDarkColor }]}>Talent & Career Mission</Text>
        <View style={[styles.line, { backgroundColor: primaryColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center"
  },
  mark: {
    alignItems: "center",
    height: 82,
    justifyContent: "flex-end",
    marginBottom: 8,
    width: 92
  },
  markCompact: {
    height: 52,
    marginBottom: 3,
    transform: [{ scale: 0.78 }]
  },
  bookRow: {
    flexDirection: "row",
    marginTop: -5
  },
  bookPage: {
    borderBottomLeftRadius: 2,
    borderTopLeftRadius: 2,
    height: 43,
    transform: [{ skewY: "8deg" }],
    width: 42
  },
  bookPageRight: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 2,
    transform: [{ skewY: "-8deg" }]
  },
  title: {
    fontSize: 72,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 80
  },
  titleCompact: {
    fontSize: 58,
    lineHeight: 63
  },
  subtitleRow: {
    alignItems: "center",
    flexDirection: "row"
  },
  line: {
    height: 1.5,
    marginHorizontal: 9,
    width: 20
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "700"
  },
  subtitleCompact: {
    fontSize: 12
  }
});

