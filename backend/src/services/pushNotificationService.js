// Push Notification Service supporting FCM, Expo Push API, & In-App Notification Center

export const VAPID_PUBLIC_KEY = "BKfFsEAwiqI4h42Z0OC0sx0In8j8g3CrjmyN_TNjHaj4kLlu26_h1gFwdsj4uDURFcljxo4-3F3NBVLWG3ly3So";

const userPushTokens = {}; // userId -> Array of { token, platform, registeredAt }
const userNotificationsStore = {}; // userId -> Array of In-App Notification objects

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

export function addInAppNotification(targetUserId, notifObj) {
  const key = String(targetUserId || "all");
  if (!userNotificationsStore[key]) {
    userNotificationsStore[key] = [];
  }
  const item = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    time: "Just now",
    timestamp: new Date().toISOString(),
    unread: true,
    ...notifObj
  };
  userNotificationsStore[key].unshift(item);

  // Keep max 50 notifications per user
  if (userNotificationsStore[key].length > 50) {
    userNotificationsStore[key] = userNotificationsStore[key].slice(0, 50);
  }
  return item;
}

export function getInAppNotifications(userId) {
  const specific = userNotificationsStore[String(userId)] || [];
  const globalNotifs = userNotificationsStore["all"] || [];
  const combined = [...specific, ...globalNotifs].sort(
    (a, b) => new Date(b.timestamp || b.id) - new Date(a.timestamp || a.id)
  );
  return combined;
}

export function markInAppNotificationRead(userId, notifId) {
  const key = String(userId);
  if (userNotificationsStore[key]) {
    userNotificationsStore[key] = userNotificationsStore[key].map((n) =>
      n.id === notifId ? { ...n, unread: false } : n
    );
  }
}

export async function sendPushNotification({ userIds = [], title, body, data = {}, type = "general" }) {
  const targetIds = Array.isArray(userIds) ? userIds.map(String) : [String(userIds)];
  const tokensToSend = [];

  // Also record in in-app notification center for target users
  for (const uid of targetIds) {
    addInAppNotification(uid, {
      title,
      subtitle: body,
      type,
      ...data
    });
    const list = userPushTokens[uid] || [];
    list.forEach((entry) => tokensToSend.push(entry.token));
  }

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

// 1. Trigger: New Job Posting
export async function notifyJobPosted({ mentorName, jobTitle, jobId, company, allUserIds = ["all"] }) {
  return sendPushNotification({
    userIds: allUserIds,
    title: "💼 New Job Drive Live!",
    body: `${mentorName || "TCM Mentor"} posted a new job: "${jobTitle}" at ${company || "TCM Partner"}. Apply now!`,
    data: { jobId, screen: "JobDetails" },
    type: "job_post"
  });
}

// 2. Trigger: Student Applied for Job (Alert to Mentor)
export async function notifyJobApplied({ studentName, studentId, jobTitle, jobId, mentorId }) {
  return sendPushNotification({
    userIds: [mentorId],
    title: "📄 New Job Application Received",
    body: `${studentName || "A student"} submitted their resume for "${jobTitle}". Review candidate now.`,
    data: { jobId, studentId, screen: "MentorDashboard" },
    type: "job_application"
  });
}

// 3. Trigger: Candidate Status Selection Update (Alert to Student)
export async function notifyApplicantStatusUpdated({ studentId, jobTitle, status, jobId, mentorName }) {
  const isSelected = status === "selected";
  return sendPushNotification({
    userIds: [studentId],
    title: isSelected ? "🎉 Candidate Selection Notice!" : "ℹ️ Application Status Update",
    body: isSelected
      ? `Congratulations! ${mentorName || "The Mentor"} marked you as SELECTED for "${jobTitle}".`
      : `Your application status for "${jobTitle}" was updated to ${status}.`,
    data: { jobId, status, screen: "JobDetails" },
    type: "job_selection"
  });
}

// 4. Trigger: Friend Request Notification
export async function notifyFriendRequest({ senderId, senderName, targetUserId, action = "send" }) {
  const isAccept = action === "accept";
  return sendPushNotification({
    userIds: [targetUserId],
    title: isAccept ? "🤝 Connection Request Accepted" : "👥 Friend Request Received",
    body: isAccept
      ? `${senderName || "User"} accepted your request! You can now chat directly.`
      : `${senderName || "User"} sent you a connection request.`,
    data: { senderId, senderName, action, screen: "Notifications" },
    type: "friend_request"
  });
}

// 5. Trigger: Mentor publishes new course
export async function notifyCoursePublished({ mentorName, courseTitle, courseId, allUserIds = ["all"] }) {
  return sendPushNotification({
    userIds: allUserIds,
    title: "🎓 New Course Live!",
    body: `${mentorName || "A Mentor"} published "${courseTitle}". Enroll & start learning now!`,
    data: { courseId, screen: "CourseDetails" },
    type: "mentor_course_publish"
  });
}

// 6. Trigger: Live Class Scheduled & Link Broadcast
export async function notifyLiveClassScheduled({ mentorName, topic, classLink, minutesLeft = 15, allUserIds = ["all"] }) {
  return sendPushNotification({
    userIds: allUserIds,
    title: "🎥 Live Class Link Broadcast!",
    body: `${mentorName || "Mentor"} added the live class link for "${topic}". Starting in ${minutesLeft} mins!`,
    data: { topic, classLink, screen: "Learn" },
    type: "class_schedule"
  });
}

// 7. Trigger: Live Class Countdown Reminder
export async function notifyClassReminder({ topic, minutesLeft = 10, studentIds = ["all"] }) {
  return sendPushNotification({
    userIds: studentIds,
    title: "⏰ Live Class Starting Soon!",
    body: `Reminder: Your live class "${topic}" will start in ${minutesLeft} minutes. Join the session now!`,
    data: { topic, minutesLeft, screen: "Learn" },
    type: "class_reminder"
  });
}

// 8. Trigger: 1-on-1 Messages
export async function notifyChatMessage({ senderId, senderName, targetUserId, text }) {
  return sendPushNotification({
    userIds: [targetUserId],
    title: `💬 ${senderName || "New Message"}`,
    body: text ? (text.length > 80 ? text.substring(0, 77) + "..." : text) : "Sent an attachment",
    data: { senderId, screen: "Chat" },
    type: "chat_message"
  });
}

// 9. Trigger: New Community Broadcast / Channel Post
export async function notifyNewCommunityPost({ authorName, channelName, postTitle, channelId, memberIds = ["all"] }) {
  return sendPushNotification({
    userIds: memberIds,
    title: `📢 ${channelName || "Community Channel"}`,
    body: `${authorName}: ${postTitle || "Posted a new update"}`,
    data: { channelId, screen: "Community" },
    type: "new_post"
  });
}

// 10. Trigger: Post Likes
export async function notifyPostLiked({ likerName, postAuthorId, postId }) {
  return sendPushNotification({
    userIds: [postAuthorId],
    title: "❤️ New Like on your post",
    body: `${likerName || "Someone"} liked your post.`,
    data: { postId, screen: "Community" },
    type: "post_like"
  });
}

// 11. Trigger: Post Comments
export async function notifyPostCommented({ commenterName, postAuthorId, commentText, postId }) {
  return sendPushNotification({
    userIds: [postAuthorId],
    title: "💬 New Comment on your post",
    body: `${commenterName}: ${commentText || "Commented on your post."}`,
    data: { postId, screen: "Community" },
    type: "post_comment"
  });
}
