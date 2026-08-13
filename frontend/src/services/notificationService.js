import { Platform } from "react-native";
import { registerPushTokenApi } from "../api/client";

export const VAPID_PUBLIC_KEY = "BKfFsEAwiqI4h42Z0OC0sx0In8j8g3CrjmyN_TNjHaj4kLlu26_h1gFwdsj4uDURFcljxo4-3F3NBVLWG3ly3So";

let isRegistered = false;

export async function checkNotificationPermissionStatus() {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && "Notification" in window) {
      return window.Notification.permission;
    }
    return "unsupported";
  }

  try {
    let Notifications = require("expo-notifications");
    if (Notifications && Notifications.getPermissionsAsync) {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    }
  } catch (e) {
    console.log("Error checking mobile notification permissions:", e.message);
  }
  return "unsupported";
}

function urlBase64ToUint8Array(base64String) {
  try {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (e) {
    return null;
  }
}

export async function setupPushNotifications(sessionToken, force = false) {
  if ((isRegistered && !force) || !sessionToken) return isRegistered;

  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && "Notification" in window) {
        let permission = window.Notification.permission;

        if (permission === "default" || force) {
          try {
            permission = await window.Notification.requestPermission();
          } catch (e) {
            console.log("Error requesting web notification permission:", e);
          }
        }

        if (permission === "granted") {
          let pushTokenStr = `web_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          let platformType = "web";

          if ("serviceWorker" in navigator && "PushManager" in window) {
            try {
              let reg = await navigator.serviceWorker.getRegistration();
              if (!reg) {
                reg = await navigator.serviceWorker.register("/sw.js");
              }
              if (reg && reg.pushManager) {
                let sub = await reg.pushManager.getSubscription();
                if (!sub) {
                  const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
                  if (applicationServerKey) {
                    sub = await reg.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey
                    });
                  }
                }
                if (sub) {
                  pushTokenStr = JSON.stringify(sub);
                  platformType = "web_push";
                }
              }
            } catch (swErr) {
              console.log("Service Worker Web Push subscription note:", swErr.message);
            }
          }

          await registerPushTokenApi(sessionToken, pushTokenStr, platformType);
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

    let Notifications = null;
    try {
      Notifications = require("expo-notifications");
    } catch (e) {
      console.log("expo-notifications module not loaded:", e.message);
      return false;
    }

    if (!Notifications || typeof Notifications.setNotificationHandler !== "function") return false;

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

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

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
      if (typeof window !== "undefined" && "Notification" in window) {
        let perm = window.Notification.permission;
        if (perm === "default") {
          try {
            perm = await window.Notification.requestPermission();
          } catch (e) {}
        }
        if (perm === "granted") {
          const notif = new window.Notification(title || "TCM Alert 🔔", {
            body: body || "You have a new update on TCM Mobile",
            data: data || {},
            icon: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=128&q=80",
            badge: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=128&q=80"
          });
          notif.onclick = function () {
            if (window.focus) window.focus();
            notif.close();
          };
        }
      }
    } else {
      let Notifications = require("expo-notifications");
      if (Notifications && Notifications.scheduleNotificationAsync) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: title || "TCM Alert 🔔",
            body: body || "You have a new update on TCM Mobile",
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

export function setupNotificationListeners(onReceived, onResponse) {
  if (Platform.OS === "web") return () => {};
  try {
    const Notifications = require("expo-notifications");
    if (!Notifications) return () => {};

    const receivedSub = Notifications.addNotificationReceivedListener && Notifications.addNotificationReceivedListener((notification) => {
      if (onReceived) onReceived(notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener && Notifications.addNotificationResponseReceivedListener((response) => {
      if (onResponse) onResponse(response);
    });

    return () => {
      if (receivedSub && receivedSub.remove) receivedSub.remove();
      if (responseSub && responseSub.remove) responseSub.remove();
    };
  } catch (e) {
    return () => {};
  }
}
