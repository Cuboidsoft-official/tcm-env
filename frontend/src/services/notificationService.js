import { Platform } from "react-native";
import { registerPushTokenApi } from "../api/client";

export const VAPID_PUBLIC_KEY = "BKfFsEAwiqI4h42Z0OC0sx0In8j8g3CrjmyN_TNjHaj4kLlu26_h1gFwdsj4uDURFcljxo4-3F3NBVLWG3ly3So";

let isRegistered = false;

export async function checkNotificationPermissionStatus() {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && "Notification" in window) {
      return window.Notification.permission; // 'granted', 'denied', or 'default'
    }
    return "unsupported";
  }

  try {
    let Notifications = require("expo-notifications");
    if (Notifications && Notifications.getPermissionsAsync) {
      const { status } = await Notifications.getPermissionsAsync();
      return status; // 'granted', 'denied', 'undetermined'
    }
  } catch (e) {
    console.log("Error checking mobile notification permissions:", e.message);
  }
  return "unsupported";
}

export async function setupPushNotifications(sessionToken, force = false) {
  if ((isRegistered && !force) || !sessionToken) return isRegistered;

  try {
    // ----------------------------------------------------
    // 1. WEB BROWSER NOTIFICATIONS (Web App)
    // ----------------------------------------------------
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && "Notification" in window) {
        let permission = window.Notification.permission;

        // If permission is 'default' (not yet asked) or forced by user click
        if (permission === "default" || force) {
          try {
            permission = await window.Notification.requestPermission();
          } catch (e) {
            console.log("Error requesting web notification permission:", e);
          }
        }

        if (permission === "granted") {
          const webToken = `web_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await registerPushTokenApi(sessionToken, webToken, "web");
          isRegistered = true;
          console.log("Web push notification permission granted and registered successfully.");
          return true;
        } else {
          console.log("Web notification permission status:", permission);
          return false;
        }
      } else {
        console.log("Browser does not support HTML5 Notifications API.");
        return false;
      }
    }

    // ----------------------------------------------------
    // 2. MOBILE APP NOTIFICATIONS (Android / iOS with Expo)
    // ----------------------------------------------------
    let Notifications = null;
    try {
      Notifications = require("expo-notifications");
    } catch (e) {
      console.log("expo-notifications module not loaded:", e.message);
      return false;
    }

    if (!Notifications || typeof Notifications.setNotificationHandler !== "function") return false;

    // MANDATORY Android Notification Channel creation (Android 8.0+)
    if (Platform.OS === "android" && Notifications.setNotificationChannelAsync) {
      await Notifications.setNotificationChannelAsync("default", {
        name: "TCM Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#5B3CF5",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
    }

    // Configure foreground notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Request permissions from device OS
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted" || force) {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnounce: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission not granted on mobile device.");
      return false;
    }

    // Obtain Push Token
    let token = null;
    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: "2d7e5eca-03da-47ea-b63c-85deeca77d83"
        })
      ).data;
    } catch (e) {
      console.log("getExpoPushTokenAsync error with projectId:", e.message);
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch (e2) {
        try {
          token = (await Notifications.getDevicePushTokenAsync()).data;
        } catch (err) {}
      }
    }

    if (!token) {
      token = `dev_token_${Platform.OS}_${Date.now()}`;
    }

    // Register token with backend
    await registerPushTokenApi(sessionToken, token, Platform.OS);
    isRegistered = true;
    console.log("Successfully registered Push Notification Token:", token);
    return true;
  } catch (err) {
    console.warn("Push notification setup error:", err.message);
    return false;
  }
}

export async function sendLocalNotification({ title, body, data }) {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
        new window.Notification(title, {
          body: body || "",
          data: data || {},
          icon: "/favicon.ico",
        });
      }
    } else {
      let Notifications = require("expo-notifications");
      if (Notifications && Notifications.scheduleNotificationAsync) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: data || {},
            sound: "default",
          },
          trigger: null,
        });
      }
    }
  } catch (err) {
    console.log("Error displaying local notification:", err.message);
  }
}
