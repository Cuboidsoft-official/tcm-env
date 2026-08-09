import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Decorations from "../components/Decorations";
import TcmLogo from "../components/TcmLogo";
import WaveFooter from "../components/WaveFooter";
import { colors } from "../constants/theme";

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Decorations />
      <View style={styles.center}>
        <TcmLogo />
        <Text style={styles.tagline}>
          Learn. Grow. Achieve.{"\n"}Your <Text style={styles.future}>Future</Text> Starts Here.
        </Text>

        <View style={styles.sloganCard}>
          <Text style={styles.sloganText}>
            "Hum wada wahi karte hain jo hum nibha paayein." ✨
          </Text>
        </View>

        <View style={styles.loader}>
          <View style={[styles.loaderPill, styles.active]} />
          <View style={styles.loaderPill} />
          <View style={styles.loaderPill} />
        </View>
        <Text style={styles.loading}>Loading...</Text>
      </View>
      <WaveFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#FBFAFF",
    flex: 1
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 70
  },
  tagline: {
    color: colors.ink,
    fontSize: 18,
    lineHeight: 28,
    marginTop: 34,
    textAlign: "center"
  },
  future: {
    color: colors.primary,
    fontWeight: "800"
  },
  sloganCard: {
    backgroundColor: "#F0EDFF",
    borderWidth: 1,
    borderColor: "#C4B5FD",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginTop: 20,
    shadowColor: "#5B3CF5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  sloganText: {
    color: colors.primary,
    fontSize: 13.5,
    fontWeight: "700",
    textAlign: "center",
    fontStyle: "italic"
  },
  loader: {
    flexDirection: "row",
    marginTop: 60
  },
  loaderPill: {
    backgroundColor: colors.lavenderLine,
    borderRadius: 20,
    height: 7,
    marginHorizontal: 5,
    width: 34
  },
  active: {
    backgroundColor: colors.primary
  },
  loading: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10
  }
});
