import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/theme";

export default function TcmLogo({ compact = false }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.mark, compact && styles.markCompact]}>
        <Ionicons name="person" size={compact ? 20 : 30} color={colors.primaryDark} />
        <View style={styles.bookRow}>
          <View style={styles.bookPage} />
          <View style={[styles.bookPage, styles.bookPageRight]} />
        </View>
      </View>
      <Text style={[styles.title, compact && styles.titleCompact]}>TCM</Text>
      <View style={styles.subtitleRow}>
        <View style={styles.line} />
        <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>Talent & Career Mission</Text>
        <View style={styles.line} />
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
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 2,
    borderTopLeftRadius: 2,
    height: 43,
    transform: [{ skewY: "8deg" }],
    width: 42
  },
  bookPageRight: {
    backgroundColor: "#8A72FF",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 2,
    transform: [{ skewY: "-8deg" }]
  },
  title: {
    color: colors.primaryDark,
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
    backgroundColor: colors.primary,
    height: 1.5,
    marginHorizontal: 9,
    width: 20
  },
  subtitle: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: "700"
  },
  subtitleCompact: {
    fontSize: 12
  }
});
