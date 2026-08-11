import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";

export default function WaveFooter() {
  const { theme } = useTheme();
  const colorOne = theme?.badgeBg || "#E8F5E9";
  const colorTwo = theme?.badgeBorder || "#C8E6C9";
  const gradientStart = theme?.accent || "#0D7D3D";
  const gradientEnd = theme?.primary || "#0A6836";

  return (
    <View style={styles.wrap}>
      <View style={[styles.wave, styles.waveOne, { backgroundColor: colorOne }]} />
      <View style={[styles.wave, styles.waveTwo, { backgroundColor: colorTwo }]} />
      <LinearGradient colors={[gradientStart, gradientEnd]} style={[styles.wave, styles.waveThree]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    bottom: 0,
    height: 180,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0
  },
  wave: {
    borderTopLeftRadius: 260,
    borderTopRightRadius: 260,
    height: 150,
    left: "-12%",
    position: "absolute",
    width: "124%"
  },
  waveOne: {
    bottom: 54,
    transform: [{ rotate: "9deg" }]
  },
  waveTwo: {
    bottom: 25,
    opacity: 0.88,
    transform: [{ rotate: "-7deg" }]
  },
  waveThree: {
    bottom: -34,
    transform: [{ rotate: "5deg" }]
  }
});

