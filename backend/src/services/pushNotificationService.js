// Push Notification Service supporting FCM & Expo Push API for Outside-of-App Notifications

export const VAPID_PUBLIC_KEY = "BKfFsEAwiqI4h42Z0OC0sx0In8j8g3CrjmyN_TNjHaj4kLlu26_h1gFwdsj4uDURFcljxo4-3F3NBVLWG3ly3So";

const userPushTokens = {}; // userId -> Array of { token, platform, registeredAt }

export function registerPushToken(userId, token, platform = "android") {
  if (!userId || !token) return;
  const key = String(userId);
  if (!userPushTokens[key]) {
    userPushTokens[key] = [];
  }
  const exists = userPushTokens[key].some((t) => t.token === token);
  if (!exists) {
    userPushTokens[key].push({ token, platform, registeredAt: new Date() });
  }
}

export function getUserPushTokens(userId) {
  return userPushTokens[String(userId)] || [];
}

export async function sendPushNotification({ userIds = [], title, body, data = {}, type = "general" }) {
  const targetIds = Array.isArray(userIds) ? userIds.map(String) : [String(userIds)];
  const tokensToSend = [];

  for (const uid of targetIds) {
    const list = userPushTokens[uid] || [];
    list.forEach((entry) => tokensToSend.push(entry.token));
  }

  // Fallback to Expo Push HTTP endpoint (Transparently routes to FCM via google-services.json)
  if (tokensToSend.length > 0) {
    try {
      const messages = tokensToSend.map((token) => ({
        to: token,
        sound: "default",
        title: title,
        body: body,
        data: { ...data, type },
        channelId: "default",
        priority: "high"
      }));

      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(messages)
      });
    } catch (err) {
      console.error("Push notification send error:", err.message);
    }
  }

  return { success: true, recipients: targetIds.length };
}

// 1. Trigger: Mentor publishes new course
export async function notifyCoursePublished({ mentorName, courseTitle, courseId, allUserIds = [] }) {
  return sendPushNotification({
    userIds: allUserIds,
    title: "🎓 New Course Live!",
    body: `${mentorName || "A Mentor"} published "${courseTitle}". Enroll & start learning now!`,
    data: { courseId, screen: "CourseDetails" },
    type: "mentor_course_publish"
  });
}

// 2. Trigger: 1-on-1 Messages
export async function notifyChatMessage({ senderId, senderName, targetUserId, text }) {
  return sendPushNotification({
    userIds: [targetUserId],
    title: `💬 ${senderName || "New Message"}`,
    body: text ? (text.length > 80 ? text.substring(0, 77) + "..." : text) : "Sent an attachment",
    data: { senderId, screen: "Chat" },
    type: "chat_message"
  });
}

// 3. Trigger: New Community Broadcast / Channel Post
export async function notifyNewCommunityPost({ authorName, channelName, postTitle, channelId, memberIds = [] }) {
  return sendPushNotification({
    userIds: memberIds,
    title: `📢 ${channelName || "Community Channel"}`,
    body: `${authorName}: ${postTitle || "Posted a new update"}`,
    data: { channelId, screen: "Community" },
    type: "new_post"
  });
}

// 4. Trigger: Post Likes
export async function notifyPostLiked({ likerName, postAuthorId, postId }) {
  return sendPushNotification({
    userIds: [postAuthorId],
    title: "❤️ New Like on your post",
    body: `${likerName || "Someone"} liked your post.`,
    data: { postId, screen: "Community" },
    type: "post_like"
  });
}

// 5. Trigger: Post Comments
export async function notifyPostCommented({ commenterName, postAuthorId, commentText, postId }) {
  return sendPushNotification({
    userIds: [postAuthorId],
    title: "💬 New Comment on your post",
    body: `${commenterName}: ${commentText || "Commented on your post."}`,
    data: { postId, screen: "Community" },
    type: "post_comment"
  });
}
