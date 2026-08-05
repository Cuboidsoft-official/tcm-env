import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";

export const chatRouter = express.Router();

// In-memory chat storage by pair ID
const chatStore = {};

function getChatKey(u1, u2) {
  return [u1, u2].sort().join("::");
}

const defaultConversations = {
  m1: {
    targetUser: {
      id: "m1",
      name: "Rahul Sharma",
      role: "Full Stack Developer & Mentor",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      verified: true,
      online: true,
      statusText: "Active Now"
    },
    messages: [
      {
        id: "c1",
        senderId: "m1",
        senderName: "Rahul Sharma",
        senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        text: "Hey Ayushman! 👋 Welcome to TCM Mentorship. How can I help you with your Full Stack Development journey today?",
        time: "10:30 AM",
        timestamp: Date.now() - 3600000,
        isMentor: true
      },
      {
        id: "c2",
        senderId: "seed-user",
        senderName: "Ayushman Chaurasiya",
        senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        text: "Hi Rahul Sir! I have a doubt in React Native State Management and API integration.",
        time: "10:32 AM",
        timestamp: Date.now() - 3400000,
        isMentor: false
      },
      {
        id: "c3",
        senderId: "m1",
        senderName: "Rahul Sharma",
        senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        text: "That's a great topic! In React Native, always keep your global UI state separated from async fetch requests. Are you using Context API or Redux Toolkit?",
        time: "10:35 AM",
        timestamp: Date.now() - 3200000,
        isMentor: true
      }
    ]
  }
};

const mentorAutoReplies = [
  "Awesome question! I recommend modularizing your API calls using clean helper services.",
  "Great progress! Keep practicing this concept and try building a mini project on it.",
  "Feel free to ask any follow-up questions or book a 1:1 live session for detailed code review!",
  "I've attached a note on best practices for scalable architecture. Keep learning & growing!"
];

async function resolveChatTargetAsync(req, targetUserId) {
  const memoryStore = req.app.locals.memoryStore;

  try {
    let dbUser = await User.findById(targetUserId).lean();
    if (!dbUser) {
      dbUser = await User.findOne({ handle: targetUserId }).lean();
    }
    if (!dbUser) {
      dbUser = await User.findOne({ name: new RegExp(`^${targetUserId}$`, "i") }).lean();
    }
    if (dbUser) {
      return {
        id: String(dbUser._id),
        name: dbUser.name,
        role: dbUser.role || dbUser.mentorCategory || "TCM Member",
        avatarUrl: dbUser.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        verified: dbUser.verified ?? true,
        online: true,
        statusText: "Active Now"
      };
    }
  } catch (e) {}

  if (defaultConversations[targetUserId]) {
    return defaultConversations[targetUserId].targetUser;
  }

  if (memoryStore) {
    const memUser = (memoryStore.users || []).find((u) => u._id === targetUserId || u.id === targetUserId || u.handle === targetUserId || u.name === targetUserId) ||
      (memoryStore.mentors || []).find((m) => m._id === targetUserId || m.id === targetUserId || m.name === targetUserId) ||
      (memoryStore.posts || []).find((p) => p.authorId === targetUserId || p.authorName === targetUserId);

    if (memUser) {
      return {
        id: String(memUser.authorId || memUser._id || memUser.id || targetUserId),
        name: memUser.name || memUser.authorName || "TCM Member",
        role: memUser.role || memUser.authorRole || "TCM Learner",
        avatarUrl: memUser.avatarUrl || memUser.authorAvatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        verified: true,
        online: true,
        statusText: "Active Now"
      };
    }
  }

  return {
    id: targetUserId,
    name: targetUserId.replace(/^user-/, "").replace(/_/g, " "),
    role: "TCM Member",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    verified: true,
    online: true,
    statusText: "Active Now"
  };
}

function getGlobalChatStore(req) {
  if (!req.app.locals.globalChatStore) {
    req.app.locals.globalChatStore = {};
  }
  return req.app.locals.globalChatStore;
}

chatRouter.get("/conversations", requireAuth, async (req, res) => {
  try {
    const currentUserId = String(req.user?._id || req.user?.id || "");
    const currentUserHandle = String(req.user?.handle || "");
    const memoryStore = req.app.locals.memoryStore;
    const store = getGlobalChatStore(req);
    const globalFriendStore = req.app.locals.globalFriendStore || {};
    const friendRequests = req.app.locals.friendRequests || {};

    const result = [];
    const addedIds = new Set();

    function addConv(convUser, lastMsgObj) {
      if (!convUser || !convUser.id) return;
      const cId = String(convUser.id);
      if (cId === currentUserId || addedIds.has(cId)) return;

      addedIds.add(cId);
      result.push({
        id: cId,
        name: convUser.name || "TCM Member",
        role: convUser.role || "TCM Member",
        avatarUrl: convUser.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        verified: convUser.verified ?? true,
        online: convUser.online ?? true,
        lastMessage: lastMsgObj ? lastMsgObj.text : "Connected on TCM",
        time: lastMsgObj ? lastMsgObj.time : "Just now",
        unreadCount: 0
      });
    }

    // 1. Always include lead mentor (Rahul Sharma / m1)
    if (defaultConversations.m1) {
      const m1User = defaultConversations.m1.targetUser;
      const m1Key = getChatKey(currentUserId, m1User.id);
      const m1Data = store[m1Key] || defaultConversations.m1;
      const lastM1 = m1Data.messages?.[m1Data.messages.length - 1];
      addConv(m1User, lastM1);
    }

    // 2. Scan active chat store keys for ANY messages sent/received by current user
    Object.keys(store).forEach((key) => {
      if (key.includes(currentUserId) || (currentUserHandle && key.includes(currentUserHandle))) {
        const convData = store[key];
        if (convData && convData.targetUser) {
          const msgs = convData.messages || [];
          const lastMsg = msgs[msgs.length - 1];
          if (msgs.length > 0) {
            addConv(convData.targetUser, lastMsg);
          }
        }
      }
    });

    // 3. Collect ALL mutual friend IDs from MongoDB, memoryStore, globalFriendStore & friendRequests
    const friendIdSet = new Set(req.user?.friends || []);

    if (memoryStore && memoryStore.friends) {
      const memFriends = memoryStore.friends[currentUserId] || memoryStore.friends[currentUserHandle] || [];
      memFriends.forEach((id) => friendIdSet.add(String(id)));
    }

    Object.keys(globalFriendStore).forEach((gKey) => {
      const parts = gKey.split("_");
      if (parts[0] === currentUserId || parts[0] === currentUserHandle) {
        friendIdSet.add(parts[1]);
      }
    });

    Object.keys(friendRequests).forEach((rKey) => {
      const reqObj = friendRequests[rKey];
      if (reqObj && reqObj.status === "friends") {
        if (String(reqObj.senderId) === currentUserId) friendIdSet.add(String(reqObj.targetId));
        if (String(reqObj.targetId) === currentUserId) friendIdSet.add(String(reqObj.senderId));
      }
    });

    // Fetch details of all mutual friends from MongoDB User collection
    const friendIdsArr = Array.from(friendIdSet).filter(Boolean);

    if (friendIdsArr.length > 0) {
      let dbFriends = [];
      try {
        dbFriends = await User.find({
          $or: [
            { _id: { $in: friendIdsArr } },
            { handle: { $in: friendIdsArr } },
            { name: { $in: friendIdsArr } }
          ]
        }).lean();
      } catch (e) {}

      dbFriends.forEach((fUser) => {
        const fId = String(fUser._id || fUser.id);
        const key1 = getChatKey(currentUserId, fId);
        const key2 = getChatKey(currentUserId, fUser.handle || "");
        const convData = store[key1] || store[key2];
        const lastMsg = convData?.messages?.[convData.messages.length - 1];

        addConv({
          id: fId,
          name: fUser.name,
          role: fUser.role || fUser.mentorCategory || "TCM Member",
          avatarUrl: fUser.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
          verified: fUser.verified ?? true,
          online: true
        }, lastMsg);
      });
    }

    return res.json({ success: true, conversations: result });
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch conversations" });
  }
});

chatRouter.get("/messages/:targetUserId", requireAuth, async (req, res) => {
  const userId = String(req.user?._id || req.user?.id || "seed-user");
  const targetUserId = req.params.targetUserId || "m1";
  const targetUserObj = await resolveChatTargetAsync(req, targetUserId);
  const key = getChatKey(userId, targetUserObj.id);
  const store = getGlobalChatStore(req);

  if (!store[key]) {
    const preset = defaultConversations[targetUserId] || {
      targetUser: targetUserObj,
      messages: [
        {
          id: `c_${Date.now()}`,
          senderId: targetUserObj.id,
          senderName: targetUserObj.name,
          senderAvatar: targetUserObj.avatarUrl,
          text: `Hey! Connected via TCM. How can I help you today? 👋`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          timestamp: Date.now(),
          isMentor: false
        }
      ]
    };

    store[key] = {
      targetUser: targetUserObj,
      messages: [...preset.messages]
    };
  }

  return res.json(store[key]);
});

chatRouter.post("/send", requireAuth, async (req, res) => {
  const userId = String(req.user?._id || req.user?.id || "seed-user");
  const userName = req.user?.name || "Learner";
  const userAvatar = req.user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

  const { targetUserId = "m1", text = "", mediaType, mediaUrl, driveLink, fileName } = req.body;
  if (!text.trim() && !mediaUrl && !driveLink) {
    return res.status(400).json({ message: "Message content or attachment is required" });
  }

  const targetUserObj = await resolveChatTargetAsync(req, targetUserId);
  const key = getChatKey(userId, targetUserObj.id);
  const store = getGlobalChatStore(req);

  if (!store[key]) {
    store[key] = {
      targetUser: targetUserObj,
      messages: []
    };
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const userMsg = {
    id: `msg_${Date.now()}`,
    senderId: userId,
    senderName: userName,
    senderAvatar: userAvatar,
    text: text.trim() || (driveLink ? `📁 Google Drive Doc: ${fileName || "Shared File"}` : "📷 Shared Image"),
    mediaType: mediaType || (driveLink ? "document" : mediaUrl ? "image" : null),
    mediaUrl: mediaUrl || null,
    driveLink: driveLink || null,
    fileName: fileName || null,
    time: timeStr,
    timestamp: Date.now(),
    isMentor: false
  };

  store[key].messages.push(userMsg);

  // If chatting with mentor m1, generate mentor reply
  if (targetUserId === "m1" || targetUserObj.id === "m1") {
    setTimeout(() => {
      const randomReply = mentorAutoReplies[Math.floor(Math.random() * mentorAutoReplies.length)];
      const replyNow = new Date();
      const replyTimeStr = replyNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const mentorMsg = {
        id: `msg_reply_${Date.now()}`,
        senderId: targetUserObj.id,
        senderName: store[key].targetUser.name,
        senderAvatar: store[key].targetUser.avatarUrl,
        text: randomReply,
        time: replyTimeStr,
        timestamp: Date.now(),
        isMentor: true
      };

      store[key].messages.push(mentorMsg);
    }, 1000);
  }

  return res.json({
    success: true,
    message: userMsg,
    chat: store[key]
  });
});
