import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { CommunityPost } from "../models/CommunityPost.js";
import { User } from "../models/User.js";
import { ClassReview } from "../models/ClassReview.js";
import { publicUser } from "./auth.js";

export const profileRouter = express.Router();

const initialFollowers = [
  {
    id: "user-ankit",
    name: "Ankit Sharma",
    handle: "ankit_dev",
    role: "Full Stack Developer",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=160&q=80",
    isFollowing: true
  },
  {
    id: "user-priya",
    name: "Priya Verma",
    handle: "priya_data",
    role: "Data Science Expert",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    isFollowing: true
  },
  {
    id: "user-rohit",
    name: "Rohit Singh",
    handle: "rohit_dsa",
    role: "Java & System Design",
    verified: false,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
    isFollowing: false
  },
  {
    id: "user-pooja",
    name: "Pooja Verma",
    handle: "pooja_ui",
    role: "UI/UX Designer",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
    isFollowing: false
  },
  {
    id: "user-tcm",
    name: "TCM Academy",
    handle: "tcm_official",
    role: "Official Channel",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=160&q=80",
    isFollowing: true
  }
];

const initialFollowing = [
  {
    id: "user-ankit",
    name: "Ankit Sharma",
    handle: "ankit_dev",
    role: "Full Stack Developer",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=160&q=80",
    isFollowing: true
  },
  {
    id: "user-priya",
    name: "Priya Verma",
    handle: "priya_data",
    role: "Data Science Expert",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    isFollowing: true
  },
  {
    id: "user-tcm",
    name: "TCM Academy",
    handle: "tcm_official",
    role: "Official Channel",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=160&q=80",
    isFollowing: true
  }
];

const initialProfilePosts = [];

function formatCommunityPostToProfileCard(post) {
  const media = post.media || {};
  let type = "image";
  if (media.kind === "video") type = "video";
  else if (media.kind === "code") type = "code";
  else if (media.kind === "notes" || post.category === "Notes") type = "image";
  else if (post.category === "Certificates") type = "certificate";

  return {
    id: post._id?.toString() || post.id,
    title: media.title || post.text?.slice(0, 35) || "New Post",
    category: post.category || "Posts",
    type,
    tags: post.tags || ["#TCM"],
    likes: post.metrics?.likes || 0,
    comments: post.metrics?.comments || 0,
    bookmarked: false,
    isLiked: false,
    imageUrl: media.imageUrl || media.thumbnailUrl || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=640&q=80",
    codeSnippet: media.codeLines?.join("\n") || post.text
  };
}

function calculateReputationString(posts = []) {
  const totalLikes = posts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalComments = posts.reduce((acc, p) => acc + (p.comments || 0), 0);
  const score = totalLikes * 10 + totalComments * 5 + posts.length * 50;

  if (score >= 1000) {
    return (score / 1000).toFixed(1) + "K";
  }
  return score.toString();
}

profileRouter.get("/", requireAuth, async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;

    if (memoryStore) {
      const userInMem = memoryStore.users?.find((u) => String(u._id) === String(req.user._id)) || memoryStore.user;
      if (!memoryStore.userFollowers) memoryStore.userFollowers = [];
      if (!memoryStore.userFollowing) memoryStore.userFollowing = [];

      const userCreatedPosts = (memoryStore.posts || [])
        .filter((p) => String(p.authorId) === String(req.user._id) || (p.authorName && p.authorName === userInMem?.name))
        .map(formatCommunityPostToProfileCard);

      const totalReviews = userCreatedPosts.reduce((sum, p) => sum + (p.metrics?.comments || 0), 0);
      const pubUser = publicUser(userInMem);
      pubUser.stats = {
        postsCount: userCreatedPosts.length,
        followers: memoryStore.userFollowers.length,
        following: memoryStore.userFollowing.length,
        reviews: totalReviews.toString()
      };

      return res.json({
        user: pubUser,
        posts: userCreatedPosts,
        followers: memoryStore.userFollowers,
        following: memoryStore.userFollowing
      });
    }

    const dbUser = await User.findById(req.user._id).lean();
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const userPosts = await CommunityPost.find({
      $or: [{ authorId: req.user._id }, { authorName: dbUser.name }]
    })
      .sort({ publishedAt: -1 })
      .lean();

    const formattedUserPosts = userPosts.map(formatCommunityPostToProfileCard);
    const totalReviews = formattedUserPosts.reduce((sum, p) => sum + (p.metrics?.comments || 0), 0);

    const userFollowers = Array.isArray(dbUser.followers) ? dbUser.followers : [];
    const userFollowing = Array.isArray(dbUser.following) ? dbUser.following : [];

    const pubUser = publicUser(dbUser);
    pubUser.stats = {
      postsCount: formattedUserPosts.length,
      followers: userFollowers.length,
      following: userFollowing.length,
      reviews: totalReviews.toString()
    };

    res.json({
      user: pubUser,
      posts: formattedUserPosts,
      followers: userFollowers,
      following: userFollowing
    });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch profile data" });
  }
});

async function handleUpdateProfile(req, res) {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { name, handle, bio, location, website, avatarUrl, mentorCategory, yearsExperience, subjects, experiences, certifications, interests } = req.body;

    if (memoryStore) {
      const user = memoryStore.users?.find((u) => u._id === req.user._id) || memoryStore.user;
      if (user) {
        if (name !== undefined && name.trim()) user.name = name.trim();
        if (handle !== undefined) user.handle = handle.trim().replace(/^@/, "");
        if (bio !== undefined) user.bio = bio.trim();
        if (location !== undefined) user.location = location.trim();
        if (website !== undefined) user.website = website.trim();
        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();
        if (mentorCategory !== undefined) user.mentorCategory = mentorCategory;
        if (yearsExperience !== undefined) user.yearsExperience = yearsExperience;
        if (Array.isArray(subjects)) user.subjects = subjects;
        if (Array.isArray(experiences)) user.experiences = experiences;
        if (Array.isArray(certifications)) user.certifications = certifications;
        if (Array.isArray(interests)) user.interests = interests;

        (memoryStore.posts || []).forEach((post) => {
          if (post.authorId === req.user._id || post.authorName === req.user.name) {
            if (name) post.authorName = name.trim();
            if (avatarUrl) post.authorAvatarUrl = avatarUrl.trim();
          }
        });
      }
      return res.json({ user: publicUser(user) });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          ...(name && name.trim() && { name: name.trim() }),
          ...(handle && { handle: handle.trim().replace(/^@/, "") }),
          ...(bio !== undefined && { bio: bio.trim() }),
          ...(location !== undefined && { location: location.trim() }),
          ...(website !== undefined && { website: website.trim() }),
          ...(avatarUrl !== undefined && { avatarUrl: avatarUrl.trim() }),
          ...(mentorCategory !== undefined && { mentorCategory }),
          ...(yearsExperience !== undefined && { yearsExperience }),
          ...(Array.isArray(subjects) && { subjects }),
          ...(Array.isArray(experiences) && { experiences }),
          ...(Array.isArray(certifications) && { certifications }),
          ...(Array.isArray(interests) && { interests })
        }
      },
      { new: true }
    );

    if (name || avatarUrl) {
      await CommunityPost.updateMany(
        { authorId: req.user._id },
        {
          $set: {
            ...(name && { authorName: name.trim() }),
            ...(avatarUrl && { authorAvatarUrl: avatarUrl.trim() })
          }
        }
      );
    }

    res.json({ user: publicUser(updatedUser) });
  } catch (error) {
    res.status(500).json({ message: "Could not update profile" });
  }
}

// Toggle follow endpoint
profileRouter.post("/follow", requireAuth, async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { targetUserId, targetUserHandle } = req.body;

    if (memoryStore) {
      if (!memoryStore.following) memoryStore.following = initialFollowing;

      const index = memoryStore.following.findIndex((u) => u.id === targetUserId || u.handle === targetUserHandle);
      let isFollowingNow = false;

      if (index > -1) {
        memoryStore.following.splice(index, 1);
      } else {
        const newTarget = initialFollowers.find((u) => u.id === targetUserId || u.handle === targetUserHandle) || {
          id: targetUserId || `user-${Date.now()}`,
          name: targetUserHandle || "TCM Member",
          handle: targetUserHandle || "member",
          role: "TCM Member",
          verified: false,
          avatarUrl: "",
          isFollowing: true
        };
        memoryStore.following.push({ ...newTarget, isFollowing: true });
        isFollowingNow = true;
      }

      const userInMem = memoryStore.users?.find((u) => u._id === req.user._id) || memoryStore.user;
      if (userInMem.stats) {
        userInMem.stats.following = memoryStore.following.length;
      }

      return res.json({
        success: true,
        isFollowing: isFollowingNow,
        followingCount: memoryStore.following.length,
        following: memoryStore.following
      });
    }

    res.json({ success: true, isFollowing: true });
  } catch (error) {
    res.status(500).json({ message: "Could not process follow action" });
  }
});

// Get target user profile details + friend status
profileRouter.get("/user/:targetUserId", requireAuth, async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { targetUserId } = req.params;
    const currentUserId = req.user._id?.toString() || req.user.id;

    if (memoryStore) {
      if (!memoryStore.friendRequests) memoryStore.friendRequests = [];
      if (!memoryStore.friends) memoryStore.friends = {};

      const followerMatch = (initialFollowers || []).find((u) => u.id === targetUserId || u.handle === targetUserId);
      const followingMatch = (initialFollowing || []).find((u) => u.id === targetUserId || u.handle === targetUserId);
      const mentorMatch = (memoryStore.mentors || []).find((m) => m._id === targetUserId || m.id === targetUserId || m.name === targetUserId);
      const postMatch = (memoryStore.posts || []).find((p) => p.authorId === targetUserId || p.id === targetUserId || p.authorName === targetUserId);

      const userInMem = memoryStore.users?.find((u) => u._id === targetUserId || u.id === targetUserId || u.handle === targetUserId) ||
        followerMatch ||
        followingMatch ||
        mentorMatch ||
        (postMatch ? {
          id: postMatch.authorId || targetUserId,
          name: postMatch.authorName,
          handle: postMatch.authorName?.toLowerCase().replace(/[^a-z0-9]/g, "_") || targetUserId,
          role: postMatch.authorRole || "TCM Author",
          avatarUrl: postMatch.authorAvatarUrl,
          verified: postMatch.verified ?? true
        } : null);

      const formattedName = userInMem?.name || targetUserId.replace(/^user-/, "").replace(/_/g, " ");

      // Find real posts created by target user
      const targetUserPosts = (memoryStore.posts || [])
        .filter((p) =>
          String(p.authorId) === String(targetUserId) ||
          String(p._id) === String(targetUserId) ||
          (p.authorName && formattedName && p.authorName.toLowerCase().trim() === formattedName.toLowerCase().trim())
        )
        .map(formatCommunityPostToProfileCard);

      const targetId = userInMem?._id || userInMem?.id || targetUserId;

      if (!req.app.locals.globalFriendStore) {
        req.app.locals.globalFriendStore = {};
      }

      let friendStatus = "none";
      const reqKey = [currentUserId, String(targetId)].sort().join("_");
      const existingReq = req.app.locals.friendRequests ? req.app.locals.friendRequests[reqKey] : null;

      // Check DB user friends array & globalFriendStore for 100% persistent friendship
      const currentDbUserFriends = req.user?.friends || [];
      const globalKey1 = `${currentUserId}_${targetId}`;
      const globalKey2 = `${currentUserId}_${targetUserId}`;
      const isGlobalFriend = req.app.locals.globalFriendStore[globalKey1] || req.app.locals.globalFriendStore[globalKey2];

      if (
        isGlobalFriend ||
        currentDbUserFriends.includes(String(targetId)) ||
        currentDbUserFriends.includes(String(targetUserId)) ||
        currentDbUserFriends.includes(String(userInMem?.handle))
      ) {
        friendStatus = "friends";
      } else if (existingReq) {
        if (existingReq.status === "friends") {
          friendStatus = "friends";
        } else if (existingReq.senderId === currentUserId) {
          friendStatus = "pending_sent";
        } else {
          friendStatus = "pending_received";
        }
      } else if (memoryStore) {
        const userFriends = (memoryStore.friends && memoryStore.friends[currentUserId]) || [];
        if (userFriends.includes(targetId) || userFriends.includes(targetUserId)) {
          friendStatus = "friends";
        } else if (memoryStore.friendRequests) {
          const reqSent = memoryStore.friendRequests.find(
            (r) => (r.fromUserId === currentUserId || r.senderId === currentUserId) && (r.toUserId === targetId || r.targetId === targetId) && r.status === "pending"
          );
          const reqReceived = memoryStore.friendRequests.find(
            (r) => (r.fromUserId === targetId || r.senderId === targetId) && (r.toUserId === currentUserId || r.targetId === currentUserId) && r.status === "pending"
          );

          if (reqSent) friendStatus = "pending_sent";
          else if (reqReceived) friendStatus = "pending_received";
        }
      }

      // Derive dynamic followers and following lists
      const userFollowersList = Array.isArray(userInMem?.followers) ? userInMem.followers : [];
      const userFollowingList = Array.isArray(userInMem?.following) ? userInMem.following : [];

      if (friendStatus === "friends" && !userFollowersList.some((u) => u.id === req.user._id)) {
        userFollowersList.unshift({
          id: req.user._id || req.user.id,
          name: req.user.name,
          handle: req.user.handle || req.user.email?.split("@")[0] || "you",
          role: req.user.role || "TCM Member",
          avatarUrl: req.user.avatarUrl,
          verified: true,
          isFollowing: true
        });
      }

      // Dynamic profile object
      const targetUserObj = {
        id: targetId,
        name: formattedName,
        handle: userInMem?.handle || formattedName.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        role: userInMem?.role || userInMem?.title || "TCM Member",
        bio: userInMem?.bio || `${formattedName} is an active member of the TCM learning community.`,
        avatarUrl: userInMem?.avatarUrl || userInMem?.authorAvatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        verified: userInMem?.verified ?? true,
        location: userInMem?.location || "India",
        joinedDate: userInMem?.joinedDate || "Joined Jan 2024",
        website: userInMem?.website || "thecodemunk.in",
        stats: {
          postsCount: targetUserPosts.length,
          followers: userFollowersList.length,
          following: userFollowingList.length,
          reviews: targetUserPosts.reduce((sum, p) => sum + (p.metrics?.comments || 0), 0).toString()
        }
      };

      return res.json({
        user: targetUserObj,
        friendStatus,
        posts: targetUserPosts,
        followers: userFollowersList,
        following: userFollowingList
      });
    }

    let dbUser = await User.findById(targetUserId).lean();
    if (!dbUser) {
      dbUser = await User.findOne({ handle: targetUserId }).lean();
    }
    if (!dbUser) {
      dbUser = await User.findOne({ name: new RegExp(`^${targetUserId}$`, "i") }).lean();
    }

    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const dbUserPosts = await CommunityPost.find({
      $or: [{ authorId: dbUser._id }, { authorName: dbUser.name }]
    })
      .sort({ publishedAt: -1 })
      .lean();

    const formattedPosts = dbUserPosts.map(formatCommunityPostToProfileCard);
    const pubUser = publicUser(dbUser);
    const userFollowersList = Array.isArray(dbUser.followers) ? dbUser.followers : [];
    const userFollowingList = Array.isArray(dbUser.following) ? dbUser.following : [];

    let dbFriendStatus = "none";
    const dbReqKey = [currentUserId, String(targetUserId)].sort().join("_");
    const dbExistingReq = req.app.locals.friendRequests ? req.app.locals.friendRequests[dbReqKey] : null;
    if (dbExistingReq) {
      if (dbExistingReq.status === "friends") dbFriendStatus = "friends";
      else if (dbExistingReq.senderId === currentUserId) dbFriendStatus = "pending_sent";
      else dbFriendStatus = "pending_received";
    }

    pubUser.stats = {
      postsCount: formattedPosts.length,
      followers: userFollowersList.length,
      following: userFollowingList.length,
      reviews: formattedPosts.reduce((sum, p) => sum + (p.metrics?.comments || 0), 0).toString()
    };

    res.json({
      user: pubUser,
      friendStatus: dbFriendStatus,
      posts: formattedPosts,
      followers: userFollowersList,
      following: userFollowingList
    });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch user profile" });
  }
});

// Friend Request / Connect Endpoint
profileRouter.post("/friend-request", requireAuth, async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { targetUserId, action = "send" } = req.body;
    const currentUserId = req.user._id?.toString() || req.user.id || "user-current";

    if (!targetUserId) {
      return res.status(400).json({ message: "targetUserId is required" });
    }

    if (!req.app.locals.userNotifications) {
      req.app.locals.userNotifications = {};
    }
    if (!req.app.locals.friendRequests) {
      req.app.locals.friendRequests = {};
    }

    // Resolve target user ID from memoryStore if available
    let resolvedTargetId = String(targetUserId);
    if (memoryStore) {
      const matchInMem =
        (memoryStore.users || []).find((u) => u._id === targetUserId || u.id === targetUserId || u.handle === targetUserId || u.name === targetUserId) ||
        (memoryStore.posts || []).find((p) => p.authorId === targetUserId || p.authorName === targetUserId);
      if (matchInMem) {
        resolvedTargetId = String(matchInMem.authorId || matchInMem._id || matchInMem.id || targetUserId);
      }
    }

    const reqKey1 = [currentUserId, String(targetUserId)].sort().join("_");
    const reqKey2 = [currentUserId, resolvedTargetId].sort().join("_");

    let newStatus = "none";

    if (action === "send") {
      newStatus = "pending_sent";
      const senderRealName = req.user?.name || req.user?.handle || "Learner";
      const senderRealAvatar = req.user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";

      const reqObj = {
        senderId: currentUserId,
        senderName: senderRealName,
        senderAvatar: senderRealAvatar,
        targetId: resolvedTargetId,
        rawTargetId: String(targetUserId),
        status: "pending",
        createdAt: new Date()
      };

      req.app.locals.friendRequests[reqKey1] = reqObj;
      req.app.locals.friendRequests[reqKey2] = reqObj;

      if (memoryStore) {
        if (!memoryStore.friendRequests) memoryStore.friendRequests = [];
        memoryStore.friendRequests = memoryStore.friendRequests.filter(
          (r) => !((r.fromUserId === currentUserId || r.senderId === currentUserId) && (r.toUserId === resolvedTargetId || r.targetId === resolvedTargetId))
        );
        memoryStore.friendRequests.push({
          id: `fr-${Date.now()}`,
          fromUserId: currentUserId,
          toUserId: resolvedTargetId,
          senderId: currentUserId,
          targetId: resolvedTargetId,
          status: "pending",
          createdAt: new Date().toISOString()
        });
      }

      // Push In-App Notification to target user (deduplicated across target IDs)
      const notifObj = {
        id: `notif_${Date.now()}`,
        type: "friend_request",
        title: "New Friend Request 📩",
        subtitle: `${senderRealName} sent you a friend request. Accept to connect & start chatting!`,
        avatarUrl: senderRealAvatar,
        time: "Just now",
        unread: true,
        section: "Today",
        senderId: currentUserId,
        senderName: senderRealName,
        targetId: resolvedTargetId
      };

      Array.from(new Set([resolvedTargetId, String(targetUserId)])).forEach((recId) => {
        if (!req.app.locals.userNotifications[recId]) req.app.locals.userNotifications[recId] = [];
        const exists = req.app.locals.userNotifications[recId].some(
          (n) => n.type === "friend_request" && n.senderId === currentUserId && n.unread
        );
        if (!exists) {
          req.app.locals.userNotifications[recId].unshift(notifObj);
        }
      });
    } else if (action === "accept") {
      newStatus = "friends";
      if (req.app.locals.friendRequests[reqKey1]) req.app.locals.friendRequests[reqKey1].status = "friends";
      if (req.app.locals.friendRequests[reqKey2]) req.app.locals.friendRequests[reqKey2].status = "friends";

      if (!req.app.locals.globalFriendStore) req.app.locals.globalFriendStore = {};
      const senderRealName = req.user?.name || req.user?.handle || "Learner";
      const senderRealAvatar = req.user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";

      req.app.locals.globalFriendStore[`${currentUserId}_${resolvedTargetId}`] = true;
      req.app.locals.globalFriendStore[`${resolvedTargetId}_${currentUserId}`] = true;
      req.app.locals.globalFriendStore[`${currentUserId}_${targetUserId}`] = true;
      req.app.locals.globalFriendStore[`${targetUserId}_${currentUserId}`] = true;

      if (memoryStore) {
        if (!memoryStore.friends) memoryStore.friends = {};
        if (!memoryStore.friends[currentUserId]) memoryStore.friends[currentUserId] = [];
        if (!memoryStore.friends[resolvedTargetId]) memoryStore.friends[resolvedTargetId] = [];
        if (!memoryStore.friends[currentUserId].includes(resolvedTargetId)) memoryStore.friends[currentUserId].push(resolvedTargetId);
        if (!memoryStore.friends[resolvedTargetId].includes(currentUserId)) memoryStore.friends[resolvedTargetId].push(currentUserId);
      }

      // Persist in MongoDB database for re-login/logout survival
      try {
        await User.findByIdAndUpdate(currentUserId, { $addToSet: { friends: { $each: [resolvedTargetId, String(targetUserId)] } } });
        await User.findByIdAndUpdate(resolvedTargetId, { $addToSet: { friends: { $each: [currentUserId, String(req.user.handle || "")] } } });
      } catch (e) {}

      // Push confirmation in-app notification back to sender
      const acceptNotif = {
        id: `notif_${Date.now()}`,
        type: "friend_accepted",
        title: "Request Accepted! 🎉",
        subtitle: `${req.user.name || "User"} accepted your friend request! You can now send direct messages.`,
        avatarUrl: req.user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
        time: "Just now",
        unread: true,
        section: "Today",
        senderId: currentUserId,
        senderName: req.user.name
      };

      Array.from(new Set([resolvedTargetId, String(targetUserId)])).forEach((recId) => {
        if (!req.app.locals.userNotifications[recId]) req.app.locals.userNotifications[recId] = [];
        const exists = req.app.locals.userNotifications[recId].some(
          (n) => n.type === "friend_accepted" && n.senderId === currentUserId && n.unread
        );
        if (!exists) {
          req.app.locals.userNotifications[recId].unshift(acceptNotif);
        }
      });
    } else if (action === "cancel" || action === "unfriend" || action === "reject") {
      newStatus = "none";
      delete req.app.locals.friendRequests[reqKey1];
      delete req.app.locals.friendRequests[reqKey2];
      if (memoryStore && memoryStore.friends) {
        if (memoryStore.friends[currentUserId]) memoryStore.friends[currentUserId] = memoryStore.friends[currentUserId].filter((id) => id !== resolvedTargetId);
        if (memoryStore.friends[resolvedTargetId]) memoryStore.friends[resolvedTargetId] = memoryStore.friends[resolvedTargetId].filter((id) => id !== currentUserId);
      }

      try {
        await User.findByIdAndUpdate(currentUserId, { $pull: { friends: resolvedTargetId } });
        await User.findByIdAndUpdate(resolvedTargetId, { $pull: { friends: currentUserId } });
      } catch (e) {}
    }

    return res.json({
      success: true,
      action,
      friendStatus: newStatus,
      isMutual: newStatus === "friends"
    });
  } catch (error) {
    res.status(500).json({ message: "Could not process friend request" });
  }
});

profileRouter.put("/", requireAuth, handleUpdateProfile);
profileRouter.post("/", requireAuth, handleUpdateProfile);
profileRouter.put("/update", requireAuth, handleUpdateProfile);
profileRouter.post("/update", requireAuth, handleUpdateProfile);

// ==========================================
// CLASS REVIEWS & MENTOR STUDENT FEEDBACK ENDPOINTS
// ==========================================

// 1. Post Mentor Review for a Student
profileRouter.post("/class-reviews/mentor-review", requireAuth, async (req, res) => {
  try {
    const mentorId = req.user._id?.toString() || req.user.id;
    const mentorName = req.user.name || "TCM Mentor";
    const mentorAvatar = req.user.avatarUrl || "";

    const {
      studentId,
      studentName,
      studentAvatar,
      classId,
      className,
      courseId,
      rating,
      answeredQuestions,
      activeStatus,
      askedQuestions,
      comment
    } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required." });
    }

    const newReview = await ClassReview.create({
      mentorId,
      mentorName,
      mentorAvatar,
      studentId: String(studentId),
      studentName: studentName || "Learner",
      studentAvatar: studentAvatar || "",
      classId: classId || "lc1",
      className: className || "Live Class Session",
      courseId: courseId || "c1",
      type: "mentor_feedback",
      rating: Number(rating) || 5,
      answeredQuestions: answeredQuestions || "Yes",
      activeStatus: activeStatus || "High",
      askedQuestions: askedQuestions || "Yes",
      comment: comment?.trim() || ""
    });

    // Update Student Average Rating Stats in DB
    try {
      const studentReviews = await ClassReview.find({ studentId: String(studentId), type: "mentor_feedback" });
      const avg = (studentReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / studentReviews.length).toFixed(1);
      
      await User.findByIdAndUpdate(studentId, {
        $set: {
          "stats.reputation": `${avg} ★`,
          "stats.reviews": studentReviews.length
        }
      });
    } catch (e) {}

    res.json({
      success: true,
      message: "Student review & feedback submitted successfully!",
      review: newReview
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit student review." });
  }
});

// 2. Get Mentor's Submitted & Received Class Reviews
profileRouter.get("/class-reviews/mentor", requireAuth, async (req, res) => {
  try {
    const mentorId = req.user._id?.toString() || req.user.id;
    let reviews = [];
    try {
      reviews = await ClassReview.find({
        $or: [
          { mentorId: String(mentorId) },
          { mentorId: "m1" },
          { type: "student_reflection" }
        ]
      }).sort({ createdAt: -1 });
    } catch (e) {}

    const mentorReviews = reviews.filter((r) => r.type === "mentor_feedback");
    const reflections = reviews.filter((r) => r.type === "student_reflection");

    res.json({
      success: true,
      reviews,
      mentorReviews,
      reflections
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch mentor class reviews." });
  }
});

// 3. Get All Reviews For a Student User (Given & Received)
profileRouter.get("/class-reviews/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let reviews = [];
    try {
      reviews = await ClassReview.find({ studentId: String(userId) }).sort({ createdAt: -1 });
    } catch (e) {}

    const mentorReviews = reviews.filter((r) => r.type === "mentor_feedback");
    const reflections = reviews.filter((r) => r.type === "student_reflection");

    let averageRating = 4.9;
    if (mentorReviews.length > 0) {
      const sum = mentorReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
      averageRating = Number((sum / mentorReviews.length).toFixed(1));
    }

    res.json({
      success: true,
      userId,
      averageRating,
      totalReviews: mentorReviews.length,
      mentorReviews,
      reflections,
      reviews
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user class reviews." });
  }
});

// 4. Get All Enrolled Students (For Mentors to evaluate)
profileRouter.get("/enrolled-students", requireAuth, async (req, res) => {
  try {
    let students = await User.find({ role: { $ne: "mentor" } }).select("name email handle role avatarUrl").lean();
    if (!students || students.length === 0) {
      students = await User.find({}).select("name email handle role avatarUrl").limit(10).lean();
    }
    const formatted = students.map((s) => ({
      id: String(s._id || s.id),
      name: s.name,
      email: s.email,
      role: s.role || "student",
      avatarUrl: s.avatarUrl || ""
    }));

    res.json({
      success: true,
      students: formatted
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch enrolled students." });
  }
});

// 5. Apply Referral Code within 24 hours of registration
profileRouter.post("/apply-referral", requireAuth, async (req, res) => {
  try {
    const memoryStore = req.app.locals.memoryStore;
    const { referralCode } = req.body;

    if (!referralCode || !referralCode.trim()) {
      return res.status(400).json({ message: "Referral code is required." });
    }

    const cleanCode = referralCode.trim().toUpperCase();
    const userId = req.user._id?.toString() || req.user.id;

    if (memoryStore) {
      const userInMem = memoryStore.users?.find((u) => String(u._id) === String(userId)) || memoryStore.user;
      if (!userInMem) {
        return res.status(404).json({ message: "User not found." });
      }

      if (userInMem.referredBy) {
        return res.status(400).json({ message: "Referral code has already been applied for this account." });
      }

      const createdTime = userInMem.createdAt ? new Date(userInMem.createdAt).getTime() : (userInMem.createdAtIso ? new Date(userInMem.createdAtIso).getTime() : Date.now());
      const hoursPassed = (Date.now() - createdTime) / (1000 * 60 * 60);

      if (hoursPassed > 24) {
        return res.status(400).json({ message: "Referral code can only be applied within 24 hours of account registration." });
      }

      userInMem.referredBy = cleanCode;
      userInMem.referralAppliedAt = new Date().toISOString();

      return res.json({
        success: true,
        message: `Referral code ${cleanCode} applied successfully! You earned 10 TCM Coins.`,
        user: publicUser(userInMem)
      });
    }

    const dbUser = await User.findById(userId);
    if (!dbUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (dbUser.referredBy) {
      return res.status(400).json({ message: "Referral code has already been applied for this account." });
    }

    const createdTime = dbUser.createdAt ? new Date(dbUser.createdAt).getTime() : Date.now();
    const hoursPassed = (Date.now() - createdTime) / (1000 * 60 * 60);

    if (hoursPassed > 24) {
      return res.status(400).json({ message: "Referral code can only be applied within 24 hours of account registration." });
    }

    dbUser.referredBy = cleanCode;
    dbUser.referralAppliedAt = new Date();
    await dbUser.save();

    return res.json({
      success: true,
      message: `Referral code ${cleanCode} applied successfully! You earned 10 TCM Coins.`,
      user: publicUser(dbUser)
    });
  } catch (error) {
    res.status(500).json({ message: "Could not apply referral code." });
  }
});



