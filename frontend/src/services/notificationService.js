import { Platform } from "react-native";
import { registerPushTokenApi } from "../api/client";

export const VAPID_PUBLIC_KEY = "BKfFsEAwiqI4h42Z0OC0sx0In8j8g3CrjmyN_TNjHaj4kLlu26_h1gFwdsj4uDURFcljxo4-3F3NBVLWG3ly3So";

let isRegistered = false;

export async function setupPushNotifications(sessionToken) {
  if (isRegistered || !sessionToken) return;

  try {
    // Dynamic import to avoid web bundler breaks if expo-notifications is optional
    let Notifications = null;
    try {
      Notifications = require("expo-notifications");
    } catch (e) {
      return;
    }

    if (!Notifications) return;

    // 1. Configure foreground / background notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // 2. Request User Permission for Push Notifications
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notifications!");
      return;
    }

    // 3. Obtain Expo Push Token / FCM Device Push Token using VAPID Keypair
    let token = null;
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        vapidPublicKey: VAPID_PUBLIC_KEY
      })).data;
    } catch (e) {
      try {
        token = (await Notifications.getDevicePushTokenAsync()).data;
      } catch (err) {}
    }

    if (token) {
      // 4. Send Push Token to Backend Server
      await registerPushTokenApi(sessionToken, token, Platform.OS);
      isRegistered = true;
      console.log("Successfully registered Push Notification Token with backend:", token);
    }
  } catch (err) {
    console.warn("Could not register push notifications:", err.message);
  }
}
