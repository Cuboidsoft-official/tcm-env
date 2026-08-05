import { NativeModules, Platform } from "react-native";

const DEFAULT_API_PORT = 5000;
const REQUEST_TIMEOUT_MS = 6000;
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;

function normalizeApiUrl(url) {
  return url?.replace(/\/$/, "");
}

function inferApiUrlFromRuntime() {
  if (Platform.OS === "web" && globalThis.location?.hostname) {
    return `http://${globalThis.location.hostname}:${DEFAULT_API_PORT}/api`;
  }

  const scriptUrl = NativeModules.SourceCode?.scriptURL;
  const host = scriptUrl?.match(/^https?:\/\/([^/:]+)/)?.[1];

  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:${DEFAULT_API_PORT}/api`;
  }

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${DEFAULT_API_PORT}/api`;
  }

  return `http://localhost:${DEFAULT_API_PORT}/api`;
}

function getApiUrlCandidates() {
  const inferredApiUrl = normalizeApiUrl(inferApiUrlFromRuntime());
  const configuredUrl = normalizeApiUrl(configuredApiUrl);
  const shouldPreferInferredUrl =
    configuredUrl?.includes("10.0.2.2") &&
    inferredApiUrl &&
    !inferredApiUrl.includes("10.0.2.2");

  return [
    ...(shouldPreferInferredUrl ? [inferredApiUrl, configuredUrl] : [configuredUrl, inferredApiUrl]),
    `http://10.0.2.2:${DEFAULT_API_PORT}/api`,
    `http://127.0.0.1:${DEFAULT_API_PORT}/api`,
    `http://localhost:${DEFAULT_API_PORT}/api`
  ].filter((url, index, urls) => url && urls.indexOf(url) === index);
}

async function fetchWithTimeout(url, options) {
  if (typeof AbortController === "undefined") {
    return fetch(url, options);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function request(path, options = {}) {
  const apiUrlCandidates = getApiUrlCandidates();
  let lastNetworkError;
  const triedUrls = [];

  for (const apiUrl of apiUrlCandidates) {
    triedUrls.push(apiUrl);

    try {
      const { headers: optionHeaders = {}, ...requestOptions } = options;
      const response = await fetchWithTimeout(`${apiUrl}${path}`, {
        ...requestOptions,
        headers: {
          "Content-Type": "application/json",
          ...optionHeaders
        }
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw Object.assign(new Error(data.message || "Request failed"), {
          status: response.status
        });
      }

      return data;
    } catch (error) {
      if (error.status) {
        throw error;
      }

      lastNetworkError = error;
    }
  }

  const triedLabel = triedUrls.join(", ");
  const detail = lastNetworkError?.message ? ` ${lastNetworkError.message}` : "";

  throw new Error(`Unable to connect to backend. Tried: ${triedLabel}.${detail}`);
}

export function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function register(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getHome(token) {
  return request("/home", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createCommunityPost(token, payload) {
  return request("/home/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function createCourse(token, payload) {
  return request("/home/courses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function getProfile(token) {
  return request("/profile", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export async function updateProfile(token, payload) {
  try {
    return await request("/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    if (error.status === 404) {
      return await request("/profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    }
    throw error;
  }
}

export function toggleFollowUser(token, payload) {
  return request("/profile/follow", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}

export function getTargetUserProfile(token, targetUserId) {
  return request(`/profile/user/${encodeURIComponent(targetUserId)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function sendFriendRequestAction(token, targetUserId, action = "send") {
  return request("/profile/friend-request", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ targetUserId, action })
  });
}

export function getCourseDetails(token, courseId) {
  return request(`/home/course/${encodeURIComponent(courseId)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
}

export function getContinueLearningDetails(token) {
  return request("/home/continue-learning", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getPopularCoursesDetails(token) {
  return request("/home/popular-courses", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function searchGlobal(token, query) {
  return request(`/home/search?q=${encodeURIComponent(query)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getMentorDetails(token, mentorId) {
  return request(`/home/mentor/${encodeURIComponent(mentorId || "m1")}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getChatMessages(token, targetUserId) {
  return request(`/chat/messages/${encodeURIComponent(targetUserId || "m1")}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function sendChatMessage(token, { targetUserId, text }) {
  return request("/chat/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ targetUserId, text })
  });
}

export function getNotifications(token) {
  return request("/home/notifications", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function submitClassReflection(token, reflectionData) {
  return request("/home/class-reflection", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(reflectionData)
  });
}

export function getWallet(token) {
  return request("/home/wallet", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function withdrawWalletFunds(token, data) {
  return request("/home/wallet/withdraw", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
}

export function addWalletMoney(token, data) {
  return request("/home/wallet/add-money", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
}

export function getCategoryCourses(token, categoryKey) {
  return request(`/home/category-courses/${categoryKey}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
}

export function getAllMentors(token) {
  return request("/home/all-mentors", {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
}

export function updateCourse(token, courseId, courseData) {
  return request(`/home/courses/${courseId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(courseData)
  });
}

export function createWebinar(token, webinarData) {
  return request("/home/webinars", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(webinarData)
  });
}

export function getWebinars(token) {
  return request("/home/webinars", {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
}

export function togglePostLike(token, postId) {
  return request(`/home/post/${postId}/like`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function addPostComment(token, postId, text) {
  return request(`/home/post/${postId}/comment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ text })
  });
}

export function getPostComments(token, postId) {
  return request(`/home/post/${postId}/comments`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
}

export function sharePost(token, postId) {
  return request(`/home/post/${postId}/share`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
}

export function respondToFriendRequestNotification(token, notificationId, action) {
  return request(`/home/notifications/${notificationId}/action`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ action })
  });
}

export function getChatConversations(token) {
  return request("/chat/conversations", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getDoubtsList(token) {
  return request("/home/doubts", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function createDoubtThread(token, data) {
  return request("/home/doubts", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
}

export function getDoubtRooms(token) {
  return request("/home/doubt-rooms", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function createDoubtRoom(token, data) {
  return request("/home/doubt-rooms", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
}

export function getDoubtRoomDetails(token, roomId) {
  return request(`/home/doubt-rooms/${roomId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function sendDoubtRoomMessage(token, roomId, data) {
  return request(`/home/doubt-rooms/${roomId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
}

export function askAiDoubt(token, roomId, data) {
  return request(`/home/doubt-rooms/${roomId}/ask-ai`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
}

export function createDoubtRoomPoll(token, roomId, data) {
  return request(`/home/doubt-rooms/${roomId}/polls`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
}

export function voteDoubtRoomPoll(token, roomId, pollId, optionId) {
  return request(`/home/doubt-rooms/${roomId}/polls/${pollId}/vote`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ optionId })
  });
}

export function markDoubtRoomSolved(token, roomId, data) {
  return request(`/home/doubt-rooms/${roomId}/mark-solved`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data || {})
  });
}

export function searchKnowledgeBase(token, query) {
  return request(`/home/knowledge-base/search?q=${encodeURIComponent(query || "")}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function joinDoubtRoom(token, roomId) {
  return request(`/home/doubt-rooms/${roomId}/join`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function manageDoubtRoom(token, roomId, data) {
  return request(`/home/doubt-rooms/${roomId}/manage`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
}
