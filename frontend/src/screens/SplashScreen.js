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
    marginTop: 38,
    textAlign: "center"
  },
  future: {
    color: colors.primary,
    fontWeight: "800"
  },
  loader: {
    flexDirection: "row",
    marginTop: 108
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
