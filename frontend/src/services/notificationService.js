import { Platform } from "react-native";
import { registerPushTokenApi } from "../api/client";

export const VAPID_PUBLIC_KEY = "BKfFsEAwiqI4h42Z0OC0sx0In8j8g3CrjmyN_TNjHaj4kLlu26_h1gFwdsj4uDURFcljxo4-3F3NBVLWG3ly3So";

let isRegistered = false;

export async function setupPushNotifications(sessionToken) {
  if (isRegistered || !sessionToken) return;

  try {
    let Notifications = null;
    try {
      Notifications = require("expo-notifications");
    } catch (e) {
      console.log("expo-notifications module not loaded:", e.message);
      return;
    }

    if (!Notifications || typeof Notifications.setNotificationHandler !== "function") return;

    // 1. Configure foreground / background notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (Platform.OS === "web") {
      isRegistered = true;
      return;
    }

    // 2. Request User Permission for Push Notifications
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission not granted.");
      return;
    }

    // 3. Obtain Push Token
    let token = null;
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } catch (e) {
      try {
        token = (await Notifications.getDevicePushTokenAsync()).data;
      } catch (err) {}
    }

    if (!token) {
      token = `dev_token_${Platform.OS}_${Date.now()}`;
    }

    // 4. Register with backend
    await registerPushTokenApi(sessionToken, token, Platform.OS);
    isRegistered = true;
    console.log("Successfully registered Push Notification Token:", token);
  } catch (err) {
    console.warn("Push notification setup error:", err.message);
  }
}
