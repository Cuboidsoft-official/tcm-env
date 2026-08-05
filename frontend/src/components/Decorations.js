import { StyleSheet, View } from "react-native";
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../constants/theme";

export default function Decorations() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Feather name="book-open" size={34} color="#C8BCFF" style={[styles.icon, styles.book]} />
      <Ionicons name="briefcase-outline" size={32} color="#C8BCFF" style={[styles.icon, styles.case]} />
      <FontAwesome5 name="graduation-cap" size={28} color="#C8BCFF" style={[styles.icon, styles.cap]} />
      <MaterialCommunityIcons name="trophy-outline" size={32} color="#C8BCFF" style={[styles.icon, styles.trophy]} />
      <Ionicons name="chatbubble-ellipses-outline" size={34} color="#C8BCFF" style={[styles.icon, styles.chat]} />
      <Ionicons name="headset-outline" size={36} color="#C8BCFF" style={[styles.icon, styles.headset]} />
      <View style={[styles.star, styles.starOne]} />
      <View style={[styles.star, styles.starTwo]} />
      <View style={[styles.dot, styles.dotOne]} />
      <View style={[styles.dot, styles.dotTwo]} />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    opacity: 0.7,
    position: "absolute"
  },
  book: {
    left: "18%",
    top: "13%",
    transform: [{ rotate: "-8deg" }]
  },
  case: {
    left: "6%",
    top: "34%",
    transform: [{ rotate: "-9deg" }]
  },
  cap: {
    right: "14%",
    top: "16%"
  },
  trophy: {
    right: "8%",
    top: "31%"
  },
  chat: {
    left: "7%",
    top: "64%"
  },
  headset: {
    right: "8%",
    top: "64%"
  },
  star: {
    backgroundColor: colors.amber,
    height: 9,
    position: "absolute",
    transform: [{ rotate: "45deg" }],
    width: 9
  },
  starOne: {
    left: "45%",
    top: "29%"
  },
  starTwo: {
    left: "9%",
    top: "51%"
  },
  dot: {
    backgroundColor: "#B9A9FF",
    borderRadius: 5,
    height: 8,
    position: "absolute",
    width: 8
  },
  dotOne: {
    right: "14%",
    top: "48%"
  },
  dotTwo: {
    right: "16%",
    top: "77%"
  }
});
