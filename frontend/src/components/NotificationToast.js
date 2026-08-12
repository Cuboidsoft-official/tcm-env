import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../constants/fonts";

const { width } = Dimensions.get("window");

export default function NotificationToast({ toast, onDismiss, onPress }) {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 12,
          friction: 6,
          tension: 80,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();

      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
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
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
              {toast.title || "Notification"}
            </Text>
            <Text style={[styles.badge, { color: iconColor, backgroundColor: iconBg }]}>NEW</Text>
          </View>
          <Text numberOfLines={2} style={[styles.subtitle, { color: theme.subtext }]}>
            {toast.subtitle || toast.body || toast.text || "Tap to view update."}
          </Text>
        </View>
        <Pressable onPress={handleClose} hitSlop={10} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color={theme.subtext} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: "absolute",
    top: 44,
    left: 14,
    right: 14,
    zIndex: 99999,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  textContainer: {
    flex: 1,
    marginRight: 8
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2
  },
  title: {
    fontSize: 13.5,
    fontFamily: fonts.bold,
    flex: 1,
    marginRight: 6
  },
  badge: {
    fontSize: 9,
    fontFamily: fonts.bold,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: "hidden"
  },
  subtitle: {
    fontSize: 11.5,
    fontFamily: fonts.regular,
    lineHeight: 15
  },
  closeBtn: {
    padding: 4
  }
});
