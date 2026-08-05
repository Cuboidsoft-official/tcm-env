import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function WaveFooter() {
  return (
    <View style={styles.wrap}>
      <View style={[styles.wave, styles.waveOne]} />
      <View style={[styles.wave, styles.waveTwo]} />
      <LinearGradient colors={["#917BFF", "#5B3CF5"]} style={[styles.wave, styles.waveThree]} />
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
    backgroundColor: "#DDD6FF",
    bottom: 54,
    transform: [{ rotate: "9deg" }]
  },
  waveTwo: {
    backgroundColor: "#B9ACFF",
    bottom: 25,
    opacity: 0.88,
    transform: [{ rotate: "-7deg" }]
  },
  waveThree: {
    bottom: -34,
    transform: [{ rotate: "5deg" }]
  }
});
