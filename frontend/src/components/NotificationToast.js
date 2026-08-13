import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../constants/fonts";

const { width } = Dimensions.get("window");

function stripEmojis(text = "") {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(
      /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E6}-\u{1F1FF}]|💼|🔥|✨|👥|🗑️|⚙️|🔗|📌/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

export default function NotificationToast({ toast, onDismiss, onPress }) {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 10,
          friction: 8,
          tension: 90,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true
        })
      ]).start();

      const timer = setTimeout(() => {
        handleClose();
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true
      })
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  }

  if (!toast) return null;

  const type = toast.type || "general";
  let iconName = "notifications";
  let iconColor = "#5B3CF5";
  let iconBg = "#F0EDFF";

  if (type === "post_like") {
    iconName = "heart";
    iconColor = "#EAB308";
    iconBg = "#FEF3C7";
  } else if (type === "post_comment") {
    iconName = "chatbubble-ellipses";
    iconColor = "#3B82F6";
    iconBg = "#EFF6FF";
  } else if (type === "chat_message") {
    iconName = "chatbubbles";
    iconColor = "#10B981";
    iconBg = "#ECFDF5";
  } else if (type.includes("job")) {
    iconName = "briefcase";
    iconColor = "#8B5CF6";
    iconBg = "#F5F3FF";
  } else if (type.includes("course") || type.includes("class")) {
    iconName = "school";
    iconColor = "#6366F1";
    iconBg = "#EEF2FF";
  } else if (type.includes("friend")) {
    iconName = "person-add";
    iconColor = "#EC4899";
    iconBg = "#FDF2F8";
  }

  const rawTitle = toast.title || "Notification";
  const rawSub = toast.subtitle || toast.body || toast.text || "Tap to view update.";
  const title = stripEmojis(rawTitle) || "Notification";
  const subtitle = stripEmojis(rawSub) || "Tap to view update.";

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: theme.isDark ? "#1E293B" : "#FFFFFF",
          borderColor: theme.isDark ? "#334155" : "#E2E8F0"
        }
      ]}
    >
      <Pressable
        onPress={() => {
          handleClose();
          if (onPress) onPress(toast);
        }}
        style={styles.toastContent}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={16} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
              {title}
            </Text>
            <Text style={[styles.badge, { color: iconColor, backgroundColor: iconBg }]}>NEW</Text>
          </View>
          <Text numberOfLines={1} style={[styles.subtitle, { color: theme.subtext }]}>
            {subtitle}
          </Text>
        </View>
        <Pressable onPress={handleClose} hitSlop={8} style={styles.closeBtn}>
          <Ionicons name="close" size={16} color={theme.subtext} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: "absolute",
    top: Platform.OS === "web" ? 12 : 24,
    left: 16,
    right: 16,
    maxWidth: 420,
    alignSelf: "center",
    zIndex: 99999,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 10
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8
  },
  textContainer: {
    flex: 1,
    marginRight: 6
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: {
    fontSize: 12.5,
    fontFamily: fonts.bold,
    flex: 1,
    marginRight: 4
  },
  badge: {
    fontSize: 8.5,
    fontFamily: fonts.bold,
    paddingHorizontal: 5,
    paddingVertical: 0.5,
    borderRadius: 4,
    overflow: "hidden"
  },
  subtitle: {
    fontSize: 11,
    fontFamily: fonts.regular,
    lineHeight: 14,
    marginTop: 1
  },
  closeBtn: {
    padding: 2
  }
});
