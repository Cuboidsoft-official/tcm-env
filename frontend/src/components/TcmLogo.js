import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

const logoImg = require("../../assets/icon.png");

export default function TcmLogo({ compact = false }) {
  const { theme } = useTheme();
  const primaryColor = theme?.primary || colors.primary;
  const primaryDarkColor = theme?.primaryDark || colors.primaryDark;

  const lastColor = theme?.isDark ? "#F8FAFC" : "#0F172A";
  const classColor = "#EF4444";

  return (
    <View style={styles.wrap}>
      <Image
        source={logoImg}
        style={[styles.logoImage, compact && styles.logoImageCompact]}
        resizeMode="contain"
      />
      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
        <Text style={[styles.title, compact && styles.titleCompact, { color: lastColor }]}>Last</Text>
        <Text style={[styles.title, compact && styles.titleCompact, { color: classColor, fontWeight: "900" }]}>Class</Text>
      </View>
      <View style={styles.subtitleRow}>
        <View style={[styles.line, { backgroundColor: primaryColor }]} />
        <Text style={[styles.subtitle, compact && styles.subtitleCompact, { color: theme?.subtext || "#64748B" }]}>Decoding The Mind</Text>
        <View style={[styles.line, { backgroundColor: primaryColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center"
  },
  logoImage: {
    width: 84,
    height: 84,
    marginBottom: 8,
    borderRadius: 20
  },
  logoImageCompact: {
    width: 52,
    height: 52,
    marginBottom: 4,
    borderRadius: 12
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

