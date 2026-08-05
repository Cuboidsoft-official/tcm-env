import express from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import { CommunityPost } from "../models/CommunityPost.js";
import { Mentor } from "../models/Mentor.js";
import { Story } from "../models/Story.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { Webinar } from "../models/Webinar.js";
import { DoubtRoom } from "../models/DoubtRoom.js";
import { KnowledgeBaseItem } from "../models/KnowledgeBaseItem.js";

export const homeRouter = express.Router();

const categories = ["For You", "Following", "Trending", "UPSC", "JEE", "NEET", "Coding", "AI / ML", "Design"];
const tabs = [
  { key: "Home", icon: "home" },
  { key: "Learn", icon: "book-open" },
  { key: "Community", icon: "users" },
  { key: "Doubts", icon: "message-circle" },
  { key: "Profile", icon: "user" }
];

const explore = [
  {
    id: "inform-tech",
    title: "TCM Inform Tech",
    subtitle: "Live Classes, Notes,\nAssignments & More",
    icon: "play-circle",
    color: "#5B3CF5",
    backgroundColor: "#F0EDFF"
  },
  {
    id: "academy",
    title: "TCM Academy",
    subtitle: "Premium Courses,\nSpecialized Programs",
    icon: "school",
    color: "#2E7D32",
    backgroundColor: "#ECF9E9"
  },
  {
    id: "guide",
    title: "TCM Guide",
    subtitle: "Guidance, Career Paths,\nMentorship",
    icon: "book-open-page-variant",
    color: "#E7A900",
    backgroundColor: "#FFF6DA"
  },
  {
    id: "career",
    title: "TCM Career",
    subtitle: "Internships, Jobs,\nPlacements",
    icon: "briefcase",
    color: "#2F79B9",
    backgroundColor: "#EAF5FF"
  }
];

function mapMentor(mentor) {
  return {
    id: mentor._id,
    name: mentor.name,
    title: mentor.title,
    rating: mentor.rating,
    learners: mentor.learners,
    avatarUrl: mentor.avatarUrl,
    skills: mentor.skills
  };
}

async function buildLearnPayload(user, mentors, learn = {}, memoryStore = null, globalCourses = []) {
  const safeLearn = learn || {};
  let allCreatedCourses = (globalCourses || []).concat(memoryStore?.courses || []);

  try {
    const dbCourses = await Course.find().sort({ createdAt: -1 }).lean();
    dbCourses.forEach((dbC) => {
      if (!allCreatedCourses.some((c) => String(c.id || c.customId || c._id) === String(dbC.customId || dbC.id || dbC._id))) {
        allCreatedCourses.unshift(dbC);
      }
    });
  } catch (e) {}

  const formattedCreated = allCreatedCourses.map((c) => ({
    id: c.customId || c.id || c._id,
    title: c.title,
    tags: `${c.category || "TCM"} • ${c.duration || "Live Batch"}`,
    rating: c.rating ? String(c.rating) : "5.0",
    reviews: c.reviewsCount || c.reviews || "1",
    lessons: c.duration ? `⏱️ ${c.duration}` : (c.modules?.length ? `${c.modules.length} Modules` : "Live Batch"),
    image: c.imageUrl || c.image || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80",
    price: c.price || "₹1,499",
    bookmarked: false
  }));

  const popularCourses = [...formattedCreated, ...(safeLearn.popularCourses || [])];

  return {
    heroBanners: safeLearn.heroBanners || [
      {
        id: "b_neet",
        tag: "🔴 NEET 2026 LIVE",
        title: "NEET Ultimate\nCrash Course 2026",
        subtitle: "Physics • Chemistry • Biology • 5000+ MCQs & Mock Tests",
        buttonText: "Join NEET Batch →",
        image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: "b_jee",
        tag: "⚡ JEE MAIN & ADV",
        title: "JEE Rank Booster\nBatch 2026",
        subtitle: "Advanced Maths • Physics • Organic Chemistry • IITian Mentors",
        buttonText: "Enroll for JEE →",
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: "b1",
        tag: "NEW BATCH",
        title: "Full Stack\nDevelopment",
        subtitle: "Live Classes • Projects • Placement Support",
        buttonText: "Explore Course →",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: "b2",
        tag: "POPULAR",
        title: "Data Science\n& AI Masterclass",
        subtitle: "Python • Pandas • Machine Learning • LLMs",
        buttonText: "Join Batch →",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80"
      }
    ],
    continueLearning: safeLearn.continueLearning || [],
    popularCourses,
    topCategories: safeLearn.topCategories || [
      {
        id: "cat1",
        name: "Programming",
        coursesCount: "124 Courses",
        icon: "code-tags",
        color: "#5B3CF5",
        bgColor: "#F0EDFF"
      },
      {
        id: "cat2",
        name: "Data Science",
        coursesCount: "86 Courses",
        icon: "chart-line",
        color: "#2E7D32",
        bgColor: "#ECF9E9"
      },
      {
        id: "cat3",
        name: "Web Dev",
        coursesCount: "95 Courses",
        icon: "web",
        color: "#2F79B9",
        bgColor: "#EAF5FF"
      },
      {
        id: "cat4",
        name: "Design",
        coursesCount: "62 Courses",
        icon: "palette-outline",
        color: "#E76F51",
        bgColor: "#FFF2EE"
      },
      {
        id: "cat5",
        name: "Mobile Dev",
        coursesCount: "54 Courses",
        icon: "cellphone",
        color: "#00A6A6",
        bgColor: "#E6F7F7"
      },
      {
        id: "cat6",
        name: "Exam Prep",
        coursesCount: "73 Courses",
        icon: "book-open-outline",
        color: "#9C27B0",
        bgColor: "#FBEAFE"
      }
    ],
    expertMentors: (() => {
      let mentorUsers = (memoryStore?.users || Array.isArray(mentors) ? mentors : []).filter((u) => u.role === "mentor" || u.isMentor);

      if (user && (user.role === "mentor" || user.isMentor) && !mentorUsers.some((u) => String(u._id || u.id) === String(user._id || user.id) || u.email === user.email)) {
        mentorUsers = [user, ...mentorUsers];
      }

      if (mentorUsers.length === 0) {
        mentorUsers = [
          {
            _id: "m1",
            name: "Rahul Sharma",
            mentorCategory: "TCM Information Tech",
            avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
          },
          {
            _id: "m2",
            name: "Ananya Patel",
            mentorCategory: "TCM Academy",
            avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
          }
        ];
      }

      return mentorUsers.map((u) => ({
        id: u._id || u.id || "m1",
        name: u.name || "TCM Educator",
        role: `${u.mentorCategory || "TCM"} Mentor & Educator`,
        badge: u.mentorCategory || "TCM Mentor",
        badgeBg: "#F0EDFF",
        badgeColor: "#5B3CF5",
        cardBg: "#F6F4FF",
        avatarUrl: u.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        verified: true,
        rating: "5.0",
        reviews: "1",
        experience: "5+ Yrs Exp"
      }));
    })(),
    hero: {
      greeting: "Welcome back,",
      name: user.name,
      subtitle: "Keep learning, keep growing!",
      progressLabel: "Today's Progress",
      progressValue: user.progress || 0
    },
    explore: safeLearn.explore || explore,
    mentors: mentors.map(mapMentor),
    support: safeLearn.support || {
      title: "Stuck on something?",
      subtitle: "Send a Help Request and get support"
    }
  };
}

function mapPost(post) {
  const isMentor = Boolean(
    post.isMentor ||
    post.authorRole?.toLowerCase().includes("mentor") ||
    post.authorRole?.toLowerCase().includes("lead") ||
    post.authorRole?.toLowerCase().includes("hod") ||
    post.authorRole?.toLowerCase().includes("ex-") ||
    post.authorRole?.toLowerCase().includes("expert")
  );

  return {
    id: post._id || post.id,
    authorId: post.authorId || post.author_id,
    authorName: post.authorName,
    authorRole: post.authorRole,
    authorAvatarUrl: post.authorAvatarUrl,
    verified: post.verified || isMentor,
    isMentor,
    category: post.category,
    text: post.text,
    media: post.media,
    metrics: post.metrics,
    tags: post.tags,
    timeLabel: getTimeLabel(post.publishedAt)
  };
}

function getTimeLabel(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Routes
homeRouter.get("/", requireAuth, async (req, res) => {
  const memoryStore = req.app.locals.memoryStore;

  if (memoryStore) {
    const stories = memoryStore.stories.sort((a, b) => a.order - b.order);
    const posts = memoryStore.posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    return res.json({
      user: {
        id: req.user.id || req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatarUrl: req.user.avatarUrl,
        progress: req.user.progress,
        wallet: getOrCreateUserWallet(req, req.user._id || req.user.id)
      },
      notifications: 5,
      progress: {
        label: "Today's Progress",
        value: req.user.progress
      },
      tabs,
      categories,
      learn: await buildLearnPayload(req.user, memoryStore.mentors || [], memoryStore.learn, memoryStore, req.app?.locals?.globalCourses || []),
      stories: [
        {
          id: "me",
          name: "Your Story",
          avatarUrl: req.user.avatarUrl,
          badge: "add",
          ringColors: ["#6E42F5", "#7D45EA"]
        },
        ...stories.map((story) => ({
          id: story._id,
          name: story.name,
          avatarUrl: story.avatarUrl,
          icon: story.icon,
          iconColor: story.iconColor,
          backgroundColor: story.backgroundColor,
          ringColors: story.ringColors,
          badge: story.badge
        }))
      ],
      posts: posts.map(mapPost)
    });
  }

  const [stories, posts, legacyMentors, registeredMentorUsers] = await Promise.all([
    Story.find().sort({ order: 1, createdAt: 1 }).lean(),
    CommunityPost.find().sort({ publishedAt: -1 }).limit(20).lean(),
    Mentor.find().sort({ rating: -1 }).limit(6).lean(),
    User.find({ role: "mentor" }).lean()
  ]);

  const mentors = [...registeredMentorUsers, ...legacyMentors];

  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatarUrl: req.user.avatarUrl,
      progress: req.user.progress,
      wallet: getOrCreateUserWallet(req, req.user._id || req.user.id)
    },
    notifications: 5,
    progress: {
      label: "Today's Progress",
      value: req.user.progress
    },
    tabs,
    categories,
    learn: await buildLearnPayload(req.user, mentors, memoryStore?.learn, memoryStore, req.app?.locals?.globalCourses || []),
    stories: [
      {
        id: "me",
        name: "Your Story",
        avatarUrl: req.user.avatarUrl,
        badge: "add",
        ringColors: ["#6E42F5", "#7D45EA"]
      },
      ...stories.map((story) => ({
        id: story._id,
        name: story.name,
        avatarUrl: story.avatarUrl,
        icon: story.icon,
        iconColor: story.iconColor,
        backgroundColor: story.backgroundColor,
        ringColors: story.ringColors,
        badge: story.badge
      }))
    ],
    posts: posts.map(mapPost)
  });
});

homeRouter.post("/posts", requireAuth, async (req, res) => {
  const memoryStore = req.app.locals.memoryStore;
  const { category = "Community", tags = [], media = { kind: "none" } } = req.body;
  const rawText = [req.body?.text, req.body?.content, req.body?.caption, req.body?.body].find(
    (value) => typeof value === "string" && value.trim()
  );
  const postText = rawText?.trim();

  if (!postText) {
    return res.status(400).json({ message: "Post text is required" });
  }

  const normalizedTags = tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .slice(0, 6);

  const isUserMentor = req.user.role === "mentor";
  const postPayload = {
    authorName: req.user.name,
    authorId: req.user._id?.toString(),
    authorRole: isUserMentor ? (req.user.memberBadge || "TCM Mentor") : "TCM Learner",
    authorAvatarUrl: req.user.avatarUrl,
    verified: isUserMentor ? true : (req.user.verified || false),
    isMentor: isUserMentor,
    category,
    text: postText,
    media,
    metrics: {
      likes: 0,
      comments: 0,
      shares: 0
    },
    tags: normalizedTags,
    publishedAt: new Date()
  };

  if (memoryStore) {
    const post = {
      _id: `post-${Date.now()}`,
      ...postPayload
    };

    memoryStore.posts.unshift(post);

    // Increment user post count in memoryStore
    const userInMem = memoryStore.users?.find((u) => u._id === req.user._id) || memoryStore.user;
    if (userInMem && userInMem.stats) {
      userInMem.stats.postsCount = (userInMem.stats.postsCount || 0) + 1;
    }

    return res.status(201).json({ post: mapPost(post) });
  }

  const post = await CommunityPost.create(postPayload);

  // Increment user post count in MongoDB
  try {
    await User.findByIdAndUpdate(req.user._id, { $inc: { "stats.postsCount": 1 } });
  } catch (e) {}

  res.status(201).json({ post: mapPost(post) });
});

homeRouter.post("/post/:postId/like", requireAuth, async (req, res) => {
  const { postId } = req.params;
  const userId = String(req.user._id);
  const memoryStore = req.app.locals.memoryStore;

  let post = null;
  try {
    post = await CommunityPost.findById(postId);
  } catch (e) {}

  if (!post && memoryStore) {
    post = memoryStore.posts?.find((p) => String(p.id || p._id) === String(postId));
  }

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (!post.likedBy) post.likedBy = [];
  if (!post.metrics) post.metrics = { likes: 0, comments: 0, shares: 0 };

  const userIndex = post.likedBy.findIndex((id) => String(id) === userId);
  let isLiked = false;

  if (userIndex > -1) {
    post.likedBy.splice(userIndex, 1);
    post.metrics.likes = Math.max(0, (post.metrics.likes || 1) - 1);
    isLiked = false;
  } else {
    post.likedBy.push(userId);
    post.metrics.likes = (post.metrics.likes || 0) + 1;
    isLiked = true;
  }

  if (typeof post.save === "function") {
    await post.save();
  }

  res.json({
    success: true,
    likes: post.metrics.likes,
    comments: post.metrics.comments,
    shares: post.metrics.shares,
    isLiked
  });
});

homeRouter.post("/post/:postId/comment", requireAuth, async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  const userId = String(req.user._id);
  const memoryStore = req.app.locals.memoryStore;

  if (!text || !text.trim()) {
    return res.status(400).json({ message: "Comment text is required" });
  }

  let post = null;
  try {
    post = await CommunityPost.findById(postId);
  } catch (e) {}

  if (!post && memoryStore) {
    post = memoryStore.posts?.find((p) => String(p.id || p._id) === String(postId));
  }

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (!post.commentsList) post.commentsList = [];
  if (!post.metrics) post.metrics = { likes: 0, comments: 0, shares: 0 };

  const newComment = {
    id: `comment-${Date.now()}`,
    userId,
    name: req.user.name || "TCM Learner",
    avatarUrl: req.user.avatarUrl || "",
    text: text.trim(),
    time: "Just now",
    likes: 0,
    createdAt: new Date()
  };

  post.commentsList.unshift(newComment);
  post.metrics.comments = post.commentsList.length;

  if (typeof post.save === "function") {
    await post.save();
  }

  res.status(201).json({
    comment: newComment,
    commentsCount: post.metrics.comments
  });
});

homeRouter.get("/post/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  const memoryStore = req.app.locals.memoryStore;

  let post = null;
  try {
    post = await CommunityPost.findById(postId);
  } catch (e) {}

  if (!post && memoryStore) {
    post = memoryStore.posts?.find((p) => String(p.id || p._id) === String(postId));
  }

  const comments = post?.commentsList || [];
  res.json({ comments });
});

homeRouter.post("/post/:postId/share", requireAuth, async (req, res) => {
  const { postId } = req.params;
  const memoryStore = req.app.locals.memoryStore;

  let post = null;
  try {
    post = await CommunityPost.findById(postId);
  } catch (e) {}

  if (!post && memoryStore) {
    post = memoryStore.posts?.find((p) => String(p.id || p._id) === String(postId));
  }

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (!post.metrics) post.metrics = { likes: 0, comments: 0, shares: 0 };
  post.metrics.shares = (post.metrics.shares || 0) + 1;

  if (typeof post.save === "function") {
    await post.save();
  }

  res.json({
    success: true,
    shares: post.metrics.shares
  });
});

homeRouter.post("/courses", requireAuth, async (req, res) => {
  const memoryStore = req.app.locals.memoryStore;
  const {
    title,
    subtitle,
    category = "TCM Academy",
    level = "All Levels",
    price = "₹1,499",
    duration = "20 Days",
    imageUrl,
    modules = []
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Course title is required" });
  }

  const mentorUserId = String(req.user._id || req.user.id || "");
  const courseId = `course-${Date.now()}`;

  const courseObj = {
    id: courseId,
    customId: courseId,
    title,
    subtitle: subtitle || `Master ${title} with expert live guidance`,
    category,
    level,
    price: price ? (price.startsWith("₹") ? price : `₹${price}`) : "₹1,499",
    rating: 5.0,
    reviewsCount: "1",
    studentsCount: "1",
    duration,
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=640&q=80",
    mentorId: mentorUserId,
    mentorName: req.user.name || "TCM Mentor",
    mentorRole: req.user.memberBadge || req.user.role || "TCM Educator",
    mentorAvatarUrl: req.user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    mentor: {
      name: req.user.name || "TCM Mentor",
      role: req.user.memberBadge || req.user.role || "TCM Educator",
      avatarUrl: req.user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    },
    modules
  };

  // 1. Create in MongoDB Database
  try {
    const dbCourse = await Course.create(courseObj);
    courseObj._id = dbCourse._id;
  } catch (dbErr) {
    console.warn("Could not save Course to MongoDB database:", dbErr);
  }

  // 2. Save in memoryStore & app locals
  if (!req.app.locals.globalCourses) {
    req.app.locals.globalCourses = [];
  }
  if (!req.app.locals.globalPopularCourses) {
    req.app.locals.globalPopularCourses = [];
  }

  req.app.locals.globalCourses.unshift(courseObj);
  req.app.locals.globalPopularCourses.unshift({
    id: courseObj.id,
    title: courseObj.title,
    tags: `${courseObj.category} • ${courseObj.level || "All Levels"}`,
    rating: courseObj.rating || "5.0",
    reviews: courseObj.reviewsCount || "1",
    lessons: courseObj.modules?.length ? `${courseObj.modules.length} Modules` : "24 Lessons",
    image: courseObj.imageUrl,
    price: courseObj.price,
    bookmarked: false
  });

  if (memoryStore) {
    if (!memoryStore.courses) {
      memoryStore.courses = [];
    }
    memoryStore.courses.unshift(courseObj);

    if (memoryStore.learn) {
      if (Array.isArray(memoryStore.learn.explore)) {
        memoryStore.learn.explore.unshift({
          id: courseObj.id,
          title: courseObj.title,
          subtitle: courseObj.subtitle,
          category: courseObj.category,
          price: courseObj.price,
          rating: courseObj.rating,
          reviewsCount: courseObj.reviewsCount,
          badge: "NEW LIVE",
          imageUrl: courseObj.imageUrl
        });
      }

      if (Array.isArray(memoryStore.learn.popularCourses)) {
        memoryStore.learn.popularCourses.unshift({
          id: courseObj.id,
          title: courseObj.title,
          tags: `${courseObj.category} • ${courseObj.level || "All Levels"}`,
          rating: courseObj.rating || "5.0",
          reviews: courseObj.reviewsCount || "1",
          lessons: courseObj.modules?.length ? `${courseObj.modules.length} Modules` : "24 Lessons",
          image: courseObj.imageUrl,
          price: courseObj.price,
          bookmarked: false
        });
      }
    }
  }

  res.status(201).json({ course: courseObj });
});

homeRouter.post("/webinars", requireAuth, async (req, res) => {
  const memoryStore = req.app.locals.memoryStore;
  const {
    eventType = "Webinar",
    webinarType = "Free Webinar",
    price = "Free",
    title,
    description,
    bannerUrl,
    learningPoints = [],
    dateTime = "Today • 6:00 PM",
    duration = "60 Mins",
    meetLink,
    pdfUrl,
    pdfName,
    registrationLimit = "",
    status = "upcoming"
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: "Title and Short Description are required" });
  }

  const mentorUserId = String(req.user._id || req.user.id || "");
  const customId = `webinar-${Date.now()}`;

  const webinarObj = {
    id: customId,
    customId,
    eventType,
    webinarType,
    price: webinarType === "Free Webinar" ? "Free" : price ? (price.startsWith("₹") ? price : `₹${price}`) : "₹499",
    title,
    description,
    bannerUrl: bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80",
    learningPoints,
    dateTime: dateTime || "Today • 6:00 PM",
    duration: duration || "60 Mins",
    meetLink: meetLink || "https://meet.google.com/tcm-live-session",
    pdfUrl,
    pdfName,
    registrationLimit,
    registeredStudentsCount: 1,
    mentorId: mentorUserId,
    mentorName: req.user.name || "TCM Educator",
    mentorRole: req.user.memberBadge || req.user.role || "TCM Mentor",
    mentorAvatarUrl: req.user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    status
  };

  try {
    const dbWebinar = await Webinar.create(webinarObj);
    webinarObj._id = dbWebinar._id;
  } catch (dbErr) {
    console.warn("Could not save Webinar to MongoDB database:", dbErr);
  }

  if (!req.app.locals.globalWebinars) {
    req.app.locals.globalWebinars = [];
  }
  req.app.locals.globalWebinars.unshift(webinarObj);

  if (memoryStore) {
    if (!memoryStore.webinars) {
      memoryStore.webinars = [];
    }
    memoryStore.webinars.unshift(webinarObj);
  }

  res.status(201).json({ webinar: webinarObj, message: `${eventType} created successfully!` });
});

homeRouter.get("/webinars", async (req, res) => {
  const memoryStore = req.app.locals.memoryStore;
  let allWebinars = (memoryStore?.webinars || []).concat(req.app.locals.globalWebinars || []);

  try {
    const dbWebinars = await Webinar.find().sort({ createdAt: -1 }).lean();
    dbWebinars.forEach((dbW) => {
      if (!allWebinars.some((w) => String(w.id || w.customId || w._id) === String(dbW.customId || dbW.id || dbW._id))) {
        allWebinars.push(dbW);
      }
    });
  } catch (e) {}

  res.json({ webinars: allWebinars });
});

homeRouter.put("/courses/:courseId", requireAuth, async (req, res) => {
  const { courseId } = req.params;
  const memoryStore = req.app.locals.memoryStore;
  const { title, subtitle, price, duration, level, imageUrl, modules } = req.body;

  const updateFields = {};
  if (title) updateFields.title = title;
  if (subtitle) updateFields.subtitle = subtitle;
  if (price) updateFields.price = price.startsWith("₹") ? price : `₹${price}`;
  if (duration) updateFields.duration = duration;
  if (level) updateFields.level = level;
  if (imageUrl) updateFields.imageUrl = imageUrl;
  if (modules && Array.isArray(modules)) updateFields.modules = modules;

  // 1. Update in MongoDB Database
  let updatedCourse = null;
  try {
    updatedCourse = await Course.findOneAndUpdate(
      { $or: [{ _id: courseId }, { customId: courseId }, { id: courseId }] },
      { $set: updateFields },
      { new: true }
    ).lean();
  } catch (e) {}

  // 2. Update memoryStore & globalCourses
  const allLiveCourses = (memoryStore?.courses || []).concat(req.app.locals.globalCourses || []);
  const memoryCourse = allLiveCourses.find((c) => String(c.id || c._id || c.customId) === String(courseId));
  if (memoryCourse) {
    Object.assign(memoryCourse, updateFields);
  }

  return res.json({ message: "Course updated successfully!", course: updatedCourse || memoryCourse });
});

homeRouter.get("/course/:courseId", async (req, res) => {
  const { courseId } = req.params;
  const memoryStore = req.app.locals.memoryStore;

  let query = { $or: [{ customId: courseId }, { id: courseId }] };
  if (mongoose.Types.ObjectId.isValid(courseId)) {
    query.$or.unshift({ _id: courseId });
  }

  let found = null;
  try {
    found = await Course.findOne(query).lean();
  } catch (e) {
    console.warn("Course.findOne query error:", e);
  }

  if (!found) {
    const allLiveCourses = (memoryStore?.courses || []).concat(req.app.locals.globalCourses || []);
    found = allLiveCourses.find((c) => String(c.id || c._id || c.customId) === String(courseId));
  }

  if (found) {
    const rawModules = found.modules || [];
    const formattedModules = rawModules.map((m, idx) => ({
      id: m.id || `m${idx + 1}`,
      number: idx + 1,
      title: m.title || `Module ${idx + 1}`,
      lessonsCount: m.lessons?.length ? `${m.lessons.length} Lessons` : "3 Lessons",
      duration: "2 Hours",
      lessons: m.lessons?.length ? m.lessons.map((les, lIdx) => ({
        id: `l-${idx}-${lIdx}`,
        title: typeof les === "string" ? les : les.title || `Lesson ${lIdx + 1}`,
        duration: "25 mins",
        type: "video"
      })) : [
        { id: `l-${idx}-1`, title: "Introduction & Setup", duration: "15 mins", type: "video" },
        { id: `l-${idx}-2`, title: "Core Concepts & Architecture", duration: "30 mins", type: "video" }
      ]
    }));

    const totalLessonCount = formattedModules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

    return res.json({
      id: found.id || found.customId || found._id,
      tag: found.category ? `🔴 ${found.category.toUpperCase()} LIVE` : "LIVE COURSE",
      title: found.title,
      subtitle: found.subtitle,
      rating: found.rating ? String(found.rating) : "5.0",
      reviews: found.reviewsCount ? String(found.reviewsCount) : "1",
      students: found.studentsCount ? String(found.studentsCount) : "1",
      totalLength: found.duration || "20 Days",
      level: found.level || "All Levels",
      imageUrl: found.imageUrl || found.image || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=640&q=80",
      image: found.imageUrl || found.image || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=640&q=80",
      about: found.about || [
        `🚀 Course Overview\nMaster ${found.title} under ${found.category || "TCM Specialization"} with live expert classes, structured practical labs, and production-ready portfolio projects. ${found.subtitle || ""}`,
        `🎯 Who Should Join?\nIdeal for ${found.level || "all skill level"} learners who want hands-on practical skills with 1-on-1 live mentor guidance and daily doubt clearance.`,
        `🏆 Career & Industry Placement\nWork on end-to-end capstone projects, build real portfolio apps, and receive an official TCM Verified Industry Certificate upon completion.`
      ].join("\n\n"),
      whatYouWillLearn: (found.whatYouWillLearn && found.whatYouWillLearn.length) ? found.whatYouWillLearn : [
        `Master core architecture and practical concepts of ${found.title}`,
        "Build real-world production-grade projects",
        "Hands-on labs and live doubt clearance with mentor",
        "Certificate of completion & placement support"
      ],
      features: (found.features && found.features.length) ? found.features : [
        { id: "f1", icon: "youtube-subscription", label: "Lifetime Access", color: "#5B3CF5", bg: "#F0EDFF" },
        { id: "f2", icon: "certificate", label: "Certificate Included", color: "#2E7D32", bg: "#ECF9E9" },
        { id: "f3", icon: "account-group", label: "Community Access", color: "#E7A900", bg: "#FFF6DA" },
        { id: "f4", icon: "download", label: "Downloadable Resources", color: "#2F79B9", bg: "#EAF5FF" }
      ],
      price: found.price || "₹1,499",
      originalPrice: found.originalPrice || "₹4,999",
      discountPill: found.discountPill || "70% OFF",
      mentor: found.mentor || {
        name: found.mentorName || "TCM Educator",
        role: found.mentorRole || "Top Mentor",
        avatarUrl: found.mentorAvatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
      },
      curriculum: {
        totalLessons: `${totalLessonCount || 12} Lessons`,
        totalModules: `${formattedModules.length || 1} Modules`,
        modules: formattedModules
      },
      modules: formattedModules
    });
  }

  const staticCourseRegistry = {
    b_neet: {
      id: "b_neet",
      tag: "🔴 NEET 2026 LIVE",
      title: "NEET Ultimate Crash Course 2026",
      subtitle: "Physics • Chemistry • Biology • 5000+ MCQs & Mock Tests",
      rating: "4.9",
      reviews: "3.4K",
      students: "15.2K",
      totalLength: "180 Days",
      level: "Medical Exam Aspirants",
      about: [
        "🚀 Course Overview\nComprehensive NEET 2026 preparation with daily live interactive problem solving, NCERT line-by-line coverage, and top AIIMS ranker mentorship.",
        "🎯 Who Should Join?\nNEET 2026 aspirants aiming for 680+ score with structured daily practice, test series, and live doubt resolution.",
        "🏆 Career & Exam Outcomes\nMaster 5000+ high-yield MCQs, weekly mock tests with AIR ranking, and 1-on-1 performance analysis."
      ].join("\n\n"),
      whatYouWillLearn: [
        "NCERT Physics Mechanics, Electrodynamics & Optics",
        "Physical, Organic & Inorganic Chemistry High-Yield Reactions",
        "Cell Biology, Genetics, Human Physiology & Ecology",
        "5000+ High-Yield NEET Pattern MCQs",
        "Weekly Full-Length NEET Mock Exams with Rank Analysis",
        "Direct 1-on-1 Doubt Sessions with AIIMS Educators"
      ],
      price: "₹3,999",
      originalPrice: "₹12,999",
      discountPill: "69% OFF",
      mentor: {
        name: "Dr. Ananya Roy (AIIMS)",
        role: "Senior NEET Faculty & Biology HOD",
        avatarUrl: "https://images.unsplash.com/photo-1594824813566-78a9c3d4a04d?auto=format&fit=crop&w=200&q=80"
      },
      curriculum: {
        totalLessons: "120 Lessons",
        totalModules: "4 Modules",
        modules: [
          {
            id: "m1",
            title: "Module 1 (Days 1–45): Core Physics & Physical Chemistry",
            lessonsCount: "30 Lessons",
            lessons: [
              "Lesson 1.1: Kinematics, Laws of Motion & Work-Energy",
              "Lesson 1.2: Thermodynamics & Kinetic Theory",
              "Lesson 1.3: Chemical Bonding & Electrochemistry",
              "Lesson 1.4: Weekly Live NEET MCQ Speed Practice"
            ]
          },
          {
            id: "m2",
            title: "Module 2 (Days 46–90): Organic Chemistry & Cell Biology",
            lessonsCount: "30 Lessons",
            lessons: [
              "Lesson 2.1: Hydrocarbons, Reaction Mechanisms & Named Reactions",
              "Lesson 2.2: Biomolecules, Enzymes & Cell Division",
              "Lesson 2.3: Plant Physiology & Photosynthesis",
              "Lesson 2.4: Mid-Term Full Length NEET Assessment"
            ]
          },
          {
            id: "m3",
            title: "Module 3 (Days 91–135): Human Physiology, Genetics & Optics",
            lessonsCount: "30 Lessons",
            lessons: [
              "Lesson 3.1: Human Circulation, Respiration & Nervous System",
              "Lesson 3.2: Molecular Basis of Inheritance & Biotechnology",
              "Lesson 3.3: Ray Optics, Wave Optics & Modern Physics",
              "Lesson 3.4: High-Yield Problem Solving Bootcamp"
            ]
          },
          {
            id: "m4",
            title: "Module 4 (Days 136–180): Full Mock Test Series & Rank Booster",
            lessonsCount: "30 Lessons",
            lessons: [
              "Lesson 4.1: Ecology, Reproduction & Evolution Revision",
              "Lesson 4.2: 10 Full-Length All India NEET Mock Tests",
              "Lesson 4.3: High Frequency Question Analysis & Mistakes Audit",
              "Lesson 4.4: Final Exam Strategy & Time Management Masterclass"
            ]
          }
        ]
      }
    },
    b_jee: {
      id: "b_jee",
      tag: "⚡ JEE MAIN & ADV",
      title: "JEE Rank Booster Batch 2026",
      subtitle: "Advanced Maths • Physics • Organic Chemistry • IITian Mentors",
      rating: "4.9",
      reviews: "4.1K",
      students: "18.5K",
      totalLength: "180 Days",
      level: "JEE Main & Advanced Aspirants",
      about: [
        "🚀 Course Overview\nRigorous JEE Main & Advanced 2026 preparation led by IITian faculty. Covers advanced calculus, coordinate geometry, mechanics, and organic mechanisms.",
        "🎯 Who Should Join?\nStudents targeting Class 11/12 JEE Main & Advanced with top percentiles and 99+ score strategy.",
        "🏆 Career & Exam Outcomes\nSolve 4000+ JEE Advanced level questions, previous year papers (PYQs), and All-India Live Mock Tests."
      ].join("\n\n"),
      whatYouWillLearn: [
        "Advanced Calculus, Vectors & 3D Geometry",
        "Rotational Dynamics, Electromagnetism & Modern Physics",
        "Reaction Mechanisms, Equilibrium & Coordination Compounds",
        "4000+ JEE Advanced Hard Problems",
        "Live PYQ Solving (2015 - 2025)",
        "IITian Mentor Guidance & Percentile Improvement"
      ],
      price: "₹4,499",
      originalPrice: "₹14,999",
      discountPill: "70% OFF",
      mentor: {
        name: "Prof. Rajesh Kumar (IIT Bombay)",
        role: "Head of JEE Mathematics & Physics",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
      },
      curriculum: {
        totalLessons: "120 Lessons",
        totalModules: "4 Modules",
        modules: [
          {
            id: "m1",
            title: "Module 1 (Days 1–45): Mechanics & Calculus Foundations",
            lessonsCount: "30 Lessons",
            lessons: [
              "Lesson 1.1: Newton's Laws & Rigid Body Dynamics",
              "Lesson 1.2: Limits, Derivatives & Application of Derivatives",
              "Lesson 1.3: Atomic Structure & Chemical Bonding",
              "Lesson 1.4: Live JEE Main Sprint Practice"
            ]
          },
          {
            id: "m2",
            title: "Module 2 (Days 46–90): Electromagnetism & Integral Calculus",
            lessonsCount: "30 Lessons",
            lessons: [
              "Lesson 2.1: Electrostatics, Capacitance & Magnetic Effects",
              "Lesson 2.2: Indefinite & Definite Integrals",
              "Lesson 2.3: Organic Chemistry Mechanisms & GOC",
              "Lesson 2.4: Mid-Term JEE Advanced Mock Exam"
            ]
          },
          {
            id: "m3",
            title: "Module 3 (Days 91–135): Algebra, Optics & Physical Chemistry",
            lessonsCount: "30 Lessons",
            lessons: [
              "Lesson 3.1: Matrices, Determinants, Vectors & 3D Geometry",
              "Lesson 3.2: Wave Optics & Dual Nature of Matter",
              "Lesson 3.3: Chemical Kinetics & Thermodynamics",
              "Lesson 3.4: Hard Problem Solving Laboratory"
            ]
          },
          {
            id: "m4",
            title: "Module 4 (Days 136–180): Full Mock Series & JEE Advanced Sprint",
            lessonsCount: "30 Lessons",
            lessons: [
              "Lesson 4.1: Coordinate Geometry & Probability",
              "Lesson 4.2: 10 Live JEE Main & Advanced Mock Tests",
              "Lesson 4.3: PYQ Solving Session (2018 - 2025)",
              "Lesson 4.4: Final Rank Booster & Exam Day Strategy"
            ]
          }
        ]
      }
    },
    b1: {
      id: "b1",
      tag: "NEW BATCH",
      title: "Full Stack Development Batch 2026",
      subtitle: "Live Classes • Projects • Placement Support",
      rating: "5.0",
      reviews: "2.8K",
      students: "9.6K",
      totalLength: "60 Days",
      level: "Beginner to Professional",
      about: [
        "🚀 Course Overview\nComplete Full Stack Web & Mobile Development course covering React, Node.js, Express, MongoDB, and React Native. Build 5 live production apps.",
        "🎯 Who Should Join?\nCollege students, freshers, and developers seeking full stack software engineering jobs with portfolio building.",
        "🏆 Career & Placement Support\nGet resume reviews, GitHub portfolio reviews, mock interviews, and referral support."
      ].join("\n\n"),
      whatYouWillLearn: [
        "Modern React 19, Hooks & State Architecture",
        "Node.js, Express.js RESTful APIs & Middleware",
        "MongoDB Schema Design, Indexing & Aggregations",
        "React Native Mobile App Development",
        "JWT Auth, Security Best Practices & Deployment",
        "5 Production-Grade Capstone Projects"
      ],
      price: "₹1,999",
      originalPrice: "₹6,999",
      discountPill: "71% OFF",
      mentor: {
        name: "Rahul Dev",
        role: "Lead Architect & Senior Mentor",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
      },
      curriculum: {
        totalLessons: "40 Lessons",
        totalModules: "4 Modules",
        modules: [
          {
            id: "m1",
            title: "Module 1 (Days 1–15): Frontend Architecture & React",
            lessonsCount: "10 Lessons",
            lessons: [
              "Lesson 1.1: HTML5, CSS3, Flexbox & Responsive Layouts",
              "Lesson 1.2: Modern JavaScript (ES6+), Promises & Async/Await",
              "Lesson 1.3: React Components, Hooks & State Management",
              "Lesson 1.4: Hands-on Lab: E-Commerce Frontend Prototype"
            ]
          },
          {
            id: "m2",
            title: "Module 2 (Days 16–30): Backend REST APIs & Databases",
            lessonsCount: "10 Lessons",
            lessons: [
              "Lesson 2.1: Node.js Core, Express Routing & Middleware",
              "Lesson 2.2: MongoDB & Mongoose Schema Modeling",
              "Lesson 2.3: JWT Authentication & Password Encryption",
              "Lesson 2.4: Hands-on Lab: Building Backend API Suite"
            ]
          },
          {
            id: "m3",
            title: "Module 3 (Days 31–45): Cross-Platform Mobile with React Native",
            lessonsCount: "10 Lessons",
            lessons: [
              "Lesson 3.1: React Native Core Components & Navigation",
              "Lesson 3.2: Native Styling, Animations & Device Storage",
              "Lesson 3.3: Connecting Mobile App with Node.js Backend",
              "Lesson 3.4: Hands-on Lab: Full Mobile Application Build"
            ]
          },
          {
            id: "m4",
            title: "Module 4 (Days 46–60): Full Capstone, Testing & Placement",
            lessonsCount: "10 Lessons",
            lessons: [
              "Lesson 4.1: End-to-End Live SaaS Capstone Project",
              "Lesson 4.2: AWS Cloud Deployment & CI/CD Pipelines",
              "Lesson 4.3: Resume Review, Portfolio Build & Mock Interviews",
              "Lesson 4.4: Final Capstone Defense & Certification"
            ]
          }
        ]
      }
    },
    b2: {
      id: "b2",
      tag: "POPULAR",
      title: "Data Science & AI Masterclass",
      subtitle: "Python • Pandas • Machine Learning • LLMs",
      rating: "4.9",
      reviews: "1.9K",
      students: "8.2K",
      totalLength: "90 Days",
      level: "Intermediate",
      about: [
        "🚀 Course Overview\nMaster Data Science, Machine Learning, Deep Learning, and Generative AI (LLMs, Prompt Engineering, RAG). Build real AI agents and models.",
        "🎯 Who Should Join?\nData enthusiasts, engineers, and analysts looking to transition into AI & Machine Learning roles.",
        "🏆 Career & Industry Outcomes\nDeploy ML models to production, build RAG pipelines, and gain a verified AI Certification."
      ].join("\n\n"),
      whatYouWillLearn: [
        "Python for Data Science, NumPy & Pandas Data Wrangling",
        "Exploratory Data Analysis (EDA) & Data Visualization",
        "Supervised & Unsupervised Machine Learning Algorithms",
        "Neural Networks & PyTorch Deep Learning",
        "Generative AI, LangChain, RAG Pipelines & Fine-tuning",
        "Production AI Model Deployment & APIs"
      ],
      price: "₹2,499",
      originalPrice: "₹7,999",
      discountPill: "68% OFF",
      mentor: {
        name: "Ananya Sharma",
        role: "Senior AI Researcher & Educator",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
      },
      curriculum: {
        totalLessons: "60 Lessons",
        totalModules: "4 Modules",
        modules: [
          {
            id: "m1",
            title: "Module 1 (Days 1–22): Python & Data Wrangling",
            lessonsCount: "15 Lessons",
            lessons: [
              "Lesson 1.1: Advanced Python Data Structures & Functions",
              "Lesson 1.2: NumPy Vectorization & Matrix Computation",
              "Lesson 1.3: Pandas DataFrames, Cleaning & Data Visualization",
              "Lesson 1.4: Practical Lab: Financial Data Analysis"
            ]
          },
          {
            id: "m2",
            title: "Module 2 (Days 23–45): Machine Learning Algorithms",
            lessonsCount: "15 Lessons",
            lessons: [
              "Lesson 2.1: Regression Models & Decision Trees",
              "Lesson 2.2: Classification Models & Random Forests",
              "Lesson 2.3: Clustering & Principal Component Analysis (PCA)",
              "Lesson 2.4: Real-World ML Model Assessment"
            ]
          },
          {
            id: "m3",
            title: "Module 3 (Days 46–68): Deep Learning with PyTorch",
            lessonsCount: "15 Lessons",
            lessons: [
              "Lesson 3.1: Neural Networks & Backpropagation Architecture",
              "Lesson 3.2: Convolutional Neural Networks (CNNs) for Vision",
              "Lesson 3.3: Recurrent Neural Networks (RNNs) & Transformers",
              "Lesson 3.4: Deep Learning Vision Project"
            ]
          },
          {
            id: "m4",
            title: "Module 4 (Days 69–90): Generative AI, RAG & Production",
            lessonsCount: "15 Lessons",
            lessons: [
              "Lesson 4.1: LLMs, LangChain & Retrieval-Augmented Generation",
              "Lesson 4.2: Vector Databases (ChromaDB, Pinecone) Integration",
              "Lesson 4.3: Fine-Tuning Open Source LLMs & API Deployment",
              "Lesson 4.4: Final AI Capstone Defense & Certification"
            ]
          }
        ]
      }
    },
    ac_3: {
      id: "ac_3",
      tag: "🏆 BOARD TOPPER",
      title: "Class 12th Board Physics & Maths Topper Batch",
      subtitle: "NCERT Complete Line-by-Line • 10 Year PYQs Solved",
      rating: "4.9",
      reviews: "1.8K",
      students: "6.4K",
      totalLength: "90 Days",
      level: "Class 12th Students",
      about: [
        "🚀 Course Overview\nComplete NCERT line-by-line coverage for Class 12 Physics & Maths designed to score 95%+ in Board Exams with 10-year previous year question solutions.",
        "🎯 Who Should Join?\nClass 12th students preparing for CBSE, State Boards, and competitive foundation exams.",
        "🏆 Exam Outcomes\nMaster derivation techniques, sample papers, chapter-wise formula notes, and mock board tests."
      ].join("\n\n"),
      whatYouWillLearn: [
        "Electrostatics, Optics & Modern Physics Derivations",
        "Calculus, Vectors, Matrices & 3D Geometry",
        "10-Year CBSE & State Board Previous Year Papers",
        "Chapter-wise Formulas & Concept Notes",
        "Board Answer Writing Techniques & Examiner Guidelines"
      ],
      price: "₹1,499",
      originalPrice: "₹4,999",
      discountPill: "70% OFF",
      mentor: {
        name: "Dr. Ananya Roy",
        role: "HOD Physics & Mathematics",
        avatarUrl: "https://images.unsplash.com/photo-1594824813566-78a9c3d4a04d?auto=format&fit=crop&w=200&q=80"
      },
      curriculum: {
        totalLessons: "60 Lessons",
        totalModules: "3 Modules",
        modules: [
          {
            id: "m1",
            title: "Module 1 (Days 1–30): Physics Electrostatics & Calculus",
            lessonsCount: "20 Lessons",
            lessons: ["Lesson 1.1: Electric Charges & Fields Derivations", "Lesson 1.2: Differentiation & Integration for Boards"]
          },
          {
            id: "m2",
            title: "Module 2 (Days 31–60): Optics, Magnetism & Vectors",
            lessonsCount: "20 Lessons",
            lessons: ["Lesson 2.1: Ray Optics & Wave Optics Proofs", "Lesson 2.2: 3D Geometry & Vector Algebra"]
          },
          {
            id: "m3",
            title: "Module 3 (Days 61–90): Board Sample Papers & Revision",
            lessonsCount: "20 Lessons",
            lessons: ["Lesson 3.1: 5 Board Sample Paper Solutions", "Lesson 3.2: Final Revision & Formula Audit"]
          }
        ]
      }
    },
    inf_1: {
      id: "inf_1",
      tag: "MERN LIVE",
      title: "MERN Stack Full Stack Development",
      subtitle: "React 19, Node.js, Express, MongoDB & Capstones",
      rating: "4.9",
      reviews: "2.1K",
      students: "8.7K",
      totalLength: "60 Days",
      level: "Beginner to Advanced",
      about: [
        "🚀 Course Overview\nMaster full stack web development using MERN stack. Build modern web applications with React 19, Node.js, Express, and MongoDB.",
        "🎯 Who Should Join?\nAspirants aiming for Web Developer and Full Stack Engineer job roles.",
        "🏆 Career Support\nPortfolio reviews, GitHub project building, and live mock interview practice."
      ].join("\n\n"),
      whatYouWillLearn: [
        "React 19 Components, State & Hooks",
        "Express RESTful API Design & Node.js Architecture",
        "MongoDB Aggregations & Database Indexing",
        "Full Stack App Security & Cloud Deployment"
      ],
      price: "₹1,999",
      originalPrice: "₹6,999",
      discountPill: "71% OFF",
      mentor: {
        name: "Rahul Dev",
        role: "Senior Software Architect",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
      },
      curriculum: {
        totalLessons: "40 Lessons",
        totalModules: "3 Modules",
        modules: [
          { id: "m1", title: "Module 1 (Days 1–20): React 19 Frontend", lessonsCount: "15 Lessons", lessons: ["React Hooks & Router", "State Management"] },
          { id: "m2", title: "Module 2 (Days 21–40): Node.js & MongoDB Backend", lessonsCount: "15 Lessons", lessons: ["Express APIs", "MongoDB Mongoose Schema"] },
          { id: "m3", title: "Module 3 (Days 41–60): Full Capstone Deployment", lessonsCount: "10 Lessons", lessons: ["Production AWS Build", "Interview Preparation"] }
        ]
      }
    },
    gov_1: {
      id: "gov_1",
      tag: "UPSC LIVE",
      title: "UPSC General Studies Prelims + Mains 2026",
      subtitle: "History, Polity, Geography, Economy & CSAT",
      rating: "5.0",
      reviews: "4.5K",
      students: "22.1K",
      totalLength: "365 Days",
      level: "Civil Services Aspirants",
      about: [
        "🚀 Course Overview\nComplete 1-Year UPSC Civil Services Preparation batch with daily answer writing, NCERT foundations, and Current Affairs booster.",
        "🎯 Who Should Join?\nUPSC IAS/IPS/IFS 2026 exam aspirants aiming for top AIR ranks.",
        "🏆 Exam Outcomes\nMaster Prelims GS + CSAT, Mains GS 1-4 papers, and 100+ answer evaluation tests."
      ].join("\n\n"),
      whatYouWillLearn: [
        "Indian Polity, Constitution & Governance",
        "Ancient, Medieval & Modern Indian History",
        "Indian Economy, Budget & Economic Survey Analysis",
        "Daily Current Affairs & Editorials Analysis",
        "Mains Answer Writing Practice & Feedback"
      ],
      price: "₹5,999",
      originalPrice: "₹24,999",
      discountPill: "76% OFF",
      mentor: {
        name: "Dr. Vikramaditya Singh",
        role: "Senior Civil Services Mentor",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80"
      },
      curriculum: {
        totalLessons: "200 Lessons",
        totalModules: "4 Modules",
        modules: [
          { id: "m1", title: "Module 1 (Months 1–3): NCERT Foundations & Polity", lessonsCount: "50 Lessons", lessons: ["Indian Constitution", "Preamble & Fundamental Rights"] },
          { id: "m2", title: "Module 2 (Months 4–6): History, Culture & Geography", lessonsCount: "50 Lessons", lessons: ["Modern Indian History", "Physical & Human Geography"] },
          { id: "m3", title: "Module 3 (Months 7–9): Indian Economy, Environment & CSAT", lessonsCount: "50 Lessons", lessons: ["Fiscal Policy", "Ecology & Biodiversity"] },
          { id: "m4", title: "Module 4 (Months 10–12): Mains Answer Writing & Test Series", lessonsCount: "50 Lessons", lessons: ["Full Length Test Series", "Essay Writing Bootcamp"] }
        ]
      }
    },
    car_1: {
      id: "car_1",
      tag: "JOB GUARANTEE",
      title: "Full Stack Placement Guarantee Bootcamp",
      subtitle: "Live Full Stack Projects, Resume Review & Placement Support",
      rating: "5.0",
      reviews: "3.1K",
      students: "11.4K",
      totalLength: "120 Days",
      level: "Job Seekers",
      about: [
        "🚀 Course Overview\nIntensive job placement bootcamp with 1-on-1 resume reviews, mock interviews, referral assistance, and production-grade project portfolio.",
        "🎯 Who Should Join?\nFinal year students and graduates seeking software developer roles in top tech companies.",
        "🏆 Career Outcomes\nLand Full Stack Developer roles with interview referral support."
      ].join("\n\n"),
      whatYouWillLearn: [
        "Full Stack Development with MERN & TypeScript",
        "System Design (LLD & HLD Fundamentals)",
        "Data Structures & Algorithms Problem Solving",
        "1-on-1 Resume & LinkedIn Optimization",
        "Mock Technical & HR Interview Practice"
      ],
      price: "₹3,499",
      originalPrice: "₹11,999",
      discountPill: "70% OFF",
      mentor: {
        name: "Rahul Dev",
        role: "Placement Lead & Senior Tech Educator",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
      },
      curriculum: {
        name: "Ananya Sharma",
        role: "Senior Data Scientist & AI Educator",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
      },
      curriculum: {
        totalLessons: "45 Lessons",
        totalModules: "3 Modules",
        modules: [
          {
            id: "m1",
            title: "Module 1 (Days 1–20): Python Core & Programming Basics",
            lessonsCount: "15 Lessons",
            lessons: ["Lesson 1.1: Python Syntax, Variables & Control Flow", "Lesson 1.2: Lists, Dictionaries & Functions", "Lesson 1.3: File Handling & Modules"]
          },
          {
            id: "m2",
            title: "Module 2 (Days 21–40): NumPy & Pandas Data Analytics",
            lessonsCount: "15 Lessons",
            lessons: ["Lesson 2.1: NumPy Arrays & Vectorized Computations", "Lesson 2.2: Pandas DataFrames & Filtering", "Lesson 2.3: Data Visualization & EDA"]
          },
          {
            id: "m3",
            title: "Module 3 (Days 41–60): Machine Learning Models & Capstone",
            lessonsCount: "15 Lessons",
            lessons: ["Lesson 3.1: Scikit-Learn Regression & Classification", "Lesson 3.2: Model Evaluation & Hyperparameters", "Lesson 3.3: Capstone Python Analytics Defense"]
          }
        ]
      }
    }
  };

  staticCourseRegistry.b_ac1 = staticCourseRegistry.b_neet;
  staticCourseRegistry.ac_1 = staticCourseRegistry.b_neet;
  staticCourseRegistry.b_ac2 = staticCourseRegistry.b_jee;
  staticCourseRegistry.ac_2 = staticCourseRegistry.b_jee;
  staticCourseRegistry.b_ac3 = staticCourseRegistry.ac_3;
  staticCourseRegistry.inf_2 = staticCourseRegistry.p2;
  staticCourseRegistry.inf_3 = staticCourseRegistry.b1;
  staticCourseRegistry.gov_2 = staticCourseRegistry.gov_1;
  staticCourseRegistry.gov_3 = staticCourseRegistry.gov_1;
  staticCourseRegistry.car_2 = staticCourseRegistry.p2;
  staticCourseRegistry.car_3 = staticCourseRegistry.b1;
  staticCourseRegistry.c1 = staticCourseRegistry.p2;
  staticCourseRegistry.c2 = staticCourseRegistry.p2;

  const matchedStatic = staticCourseRegistry[courseId];
  if (matchedStatic) {
    return res.json(matchedStatic);
  }

  const cIdLower = String(courseId).toLowerCase();
  if (cIdLower.includes("python") || cIdLower.includes("data") || cIdLower.includes("p2") || cIdLower.includes("c1") || cIdLower.includes("py")) {
    return res.json(staticCourseRegistry.p2);
  }

  const courseTitles = {
    p1: "Full Stack Web Development",
    p2: "Data Science with Python",
    p3: "Machine Learning A-Z",
    b1: "Full Stack Development",
    b2: "Data Science & AI Masterclass",
    b3: "System Design & Architecture",
    c1: "Python Basics",
    c2: "Data Structures in Python",
    c3: "Java for Beginners"
  };

  const courseSubtitles = {
    p1: "HTML, CSS, JavaScript, React, Node.js & MongoDB",
    p2: "Python, Pandas, NumPy, Scikit-Learn & Data Analysis",
    p3: "Supervised, Unsupervised, Deep Learning & Neural Networks",
    b1: "Frontend, Backend, DevOps, Microservices & Projects",
    b2: "Data Science, Machine Learning, Deep Learning & LLMs",
    b3: "High-Level Design, Low-Level Design, Caching & Kafka"
  };

  const title = courseTitles[courseId] || "Full Stack Web Development";
  const subtitle = courseSubtitles[courseId] || "HTML, CSS, JavaScript, React, Node.js & MongoDB";

  const defaultDetails = {
    id: courseId || "p1",
    tag: "POPULAR BATCH",
    title,
    subtitle,
    rating: "4.9",
    reviews: "1.5K",
    students: "5.4K",
    totalLength: "45 Days",
    level: "All Skill Levels",
    about: [
      `🚀 Course Overview\nMaster ${title} with live interactive guidance, daily practical exercises, and industry-standard capstone projects. ${subtitle}`,
      `🎯 Who Should Join?\nDesigned for learners seeking real-world practical skills with 1-on-1 live mentor doubt clearance and structured assignments.`,
      `🏆 Career & Exam Outcomes\nWork on live industry projects, build your portfolio, and earn an official TCM Verified Certificate upon completion.`
    ].join("\n\n"),
    whatYouWillLearn: [
      `Master core fundamentals and advanced concepts of ${title}`,
      "Build real-world production-grade projects",
      "Hands-on practical labs and daily doubt clearance",
      "Industry best practices & clean code architecture",
      "Certificate of completion & placement support"
    ],
    features: [
      { id: "f1", icon: "youtube-subscription", label: "Lifetime Access", color: "#5B3CF5", bg: "#F0EDFF" },
      { id: "f2", icon: "certificate", label: "Certificate Included", color: "#2E7D32", bg: "#ECF9E9" },
      { id: "f3", icon: "account-group", label: "Community Access", color: "#E7A900", bg: "#FFF6DA" },
      { id: "f4", icon: "download", label: "Downloadable Resources", color: "#2F79B9", bg: "#EAF5FF" }
    ],
    curriculum: {
      totalLessons: "30 Lessons",
      totalModules: "3 Modules",
      modules: [
        {
          id: "m1",
          title: `Module 1 (Days 1–15): ${title} Fundamentals`,
          lessonsCount: "10 Lessons",
          expanded: true,
          lessons: [
            { id: "l1", title: "1.1 Course Orientation & Setup", duration: "15 mins", type: "video" },
            { id: "l2", title: `1.2 Core Principles of ${title}`, duration: "30 mins", type: "video" },
            { id: "l3", title: "1.3 Hands-on Practical Lab 1", duration: "45 mins", type: "video" }
          ]
        },
        {
          id: "m2",
          title: `Module 2 (Days 16–30): Advanced Concepts & Integration`,
          lessonsCount: "10 Lessons",
          expanded: false,
          lessons: [
            { id: "l4", title: "2.1 Advanced Logic & Patterns", duration: "35 mins", type: "video" },
            { id: "l5", title: "2.2 Real-World Case Study", duration: "40 mins", type: "video" },
            { id: "l6", title: "2.3 Hands-on Practical Lab 2", duration: "50 mins", type: "video" }
          ]
        },
        {
          id: "m3",
          title: `Module 3 (Days 31–45): Capstone Project & Certification`,
          lessonsCount: "10 Lessons",
          expanded: false,
          lessons: [
            { id: "l7", title: "3.1 Live Capstone Architecture", duration: "45 mins", type: "video" },
            { id: "l8", title: "3.2 Final Project Review & Deployment", duration: "60 mins", type: "video" },
            { id: "l9", title: "3.3 Certificate Award & Career Review", duration: "20 mins", type: "video" }
          ]
        }
      ]
    },
    price: "₹1,499",
    originalPrice: "₹4,999",
    discountPill: "70% OFF"
  };

  return res.json(defaultDetails);
});

homeRouter.get("/continue-learning", requireAuth, (req, res) => {
  const userId = req.user?.id || "seed-user";
  if (!req.app.locals.userReflections) {
    req.app.locals.userReflections = {};
  }

  const userReflectionState = req.app.locals.userReflections[userId] || {
    reflectionRequired: true,
    reflectionSubmitted: false,
    nextClassUnlocked: false,
    lastCompletedClass: {
      id: "cls_prev",
      title: "Module 3: Database & Node.js API Integration",
      instructor: "Rahul Dev",
      completedAt: "Yesterday • 10:00 AM – 11:30 AM"
    }
  };

  return res.json({
    reflection: userReflectionState,
    liveClass: {
      id: "lc1",
      tag: userReflectionState.nextClassUnlocked ? "🔴 LIVE CLASS UNLOCKED" : "🔒 NEXT CLASS LOCKED",
      time: "Today • 10:00 AM – 11:30 AM",
      title: "Full Stack Web Development - Module 4: Deployment & DevOps",
      instructor: "Rahul Dev",
      verified: true,
      joiningCount: 342,
      joiningText: "342 learners ready",
      meetingUrl: userReflectionState.nextClassUnlocked ? "https://meet.jit.si/tcm-live-fullstack" : null,
      avatars: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"
      ]
    },
    userProgress: {
      courseProgress: 65,
      dayStreak: 7,
      xpPoints: userReflectionState.reflectionSubmitted ? 1300 : 1280,
      certificates: 3
    },
    learningJourney: [
      { id: "m1", moduleNum: "Module 1", title: "Frontend Foundations", icon: "flag-variant", status: "completed" },
      { id: "m2", moduleNum: "Module 2", title: "Backend Development", icon: "code-tags", status: "completed" },
      { id: "m3", moduleNum: "Module 3", title: "Database & APIs", icon: "database", sub: "Class Reflection Completed", status: "completed" },
      { id: "m4", moduleNum: "Module 4", title: "Deployment & DevOps", icon: userReflectionState.nextClassUnlocked ? "door-open" : "lock-outline", sub: userReflectionState.nextClassUnlocked ? "Live class ready to join!" : "Locked (Reflection Required)", status: userReflectionState.nextClassUnlocked ? "in_progress" : "locked" },
      { id: "m5", moduleNum: "Module 5", title: "Testing & Best Practices", icon: "shield-check-outline", status: "upcoming" }
    ],
    whatsNext: [
      {
        id: "wn1",
        title: userReflectionState.nextClassUnlocked ? "Next Live Class" : "🔒 Next Class Locked",
        sub: userReflectionState.nextClassUnlocked ? "Today, 10:00 AM\nwith Rahul Dev" : "Submit Class Reflection\nto reveal joining link",
        btn: userReflectionState.nextClassUnlocked ? "Join Live >" : "Locked 🔒",
        icon: userReflectionState.nextClassUnlocked ? "calendar-clock" : "lock-clock",
        bg: userReflectionState.nextClassUnlocked ? "#F4F0FF" : "#FFF3F3",
        color: userReflectionState.nextClassUnlocked ? "#5B3CF5" : "#D32F2F",
        meetingUrl: userReflectionState.nextClassUnlocked ? "https://meet.jit.si/tcm-live-fullstack" : null
      },
      {
        id: "wn2",
        title: "Mentor Q&A",
        sub: "Tomorrow, 4:00 PM\nAsk. Learn. Grow.",
        btn: "Join Session >",
        icon: "forum-outline",
        bg: "#FFF7EE",
        color: "#E76F51"
      },
      {
        id: "wn3",
        title: "Assignment Due",
        sub: "React Components\nDue in 2 days",
        btn: "View Details >",
        icon: "file-document-outline",
        bg: "#EFF6FF",
        color: "#2F79B9"
      }
    ]
  });
});

homeRouter.post("/class-reflection", requireAuth, (req, res) => {
  const userId = req.user?.id || "seed-user";
  const { speakingOpp, questionsAsked, doubtsCleared, mentorInteraction, rating, feedbackNote } = req.body;

  if (!req.app.locals.userReflections) {
    req.app.locals.userReflections = {};
  }

  const reflectionEntry = {
    reflectionRequired: false,
    reflectionSubmitted: true,
    nextClassUnlocked: true,
    submittedAt: new Date().toISOString(),
    feedback: { speakingOpp, questionsAsked, doubtsCleared, mentorInteraction, rating, feedbackNote }
  };

  req.app.locals.userReflections[userId] = reflectionEntry;

  return res.json({
    success: true,
    message: "Class Reflection submitted! Next live class & meeting link are now unlocked 🎉",
    bonusXP: 20,
    reflection: reflectionEntry
  });
});

homeRouter.get("/category-courses/:categoryKey", async (req, res) => {
  const { categoryKey } = req.params;
  const memoryStore = req.app.locals.memoryStore;

  const keyMap = {
    inform: ["TCM Information Tech", "Information Tech", "Coding", "MERN", "AI", "DevOps", "Tech", "Programming", "Web Dev"],
    academy: ["TCM Academy", "Academy", "NEET", "JEE", "Boards", "Academic", "Physics", "Maths"],
    govt: ["TCM Government", "Government", "UPSC", "SSC", "Banking", "Railway", "Govt Exam Prep"],
    career: ["TCM Career", "Career", "Placement", "Internship", "Jobs"]
  };

  const matchedKeywords = keyMap[categoryKey] || [categoryKey];

  let allCourses = (memoryStore?.courses || []).concat(req.app.locals.globalCourses || []);
  try {
    const dbCourses = await Course.find().lean();
    dbCourses.forEach((dbC) => {
      if (!allCourses.some((c) => String(c.id || c.customId || c._id) === String(dbC.customId || dbC.id || dbC._id))) {
        allCourses.push(dbC);
      }
    });
  } catch (e) {}

  const realCourses = allCourses.filter((course) => {
    const cCat = (course.category || "").toLowerCase();
    const cTitle = (course.title || "").toLowerCase();
    const cTags = (course.tags || course.subtitle || "").toLowerCase();

    return matchedKeywords.some((kw) => {
      const kwLower = kw.toLowerCase();
      return cCat.includes(kwLower) || cTitle.includes(kwLower) || cTags.includes(kwLower);
    });
  });

  return res.json({
    categoryKey,
    courses: realCourses.map((c) => ({
      id: c.customId || c.id || c._id,
      title: c.title,
      tags: c.tags || c.subtitle || `${c.category || "TCM"} • Live Batch`,
      rating: c.rating ? String(c.rating) : "5.0",
      reviews: c.reviewsCount || c.reviews || "1",
      lessons: c.modules?.length ? `${c.modules.length} Modules` : c.duration || "Live Batch",
      image: c.imageUrl || c.image || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=500&q=80",
      price: c.price || "₹1,499"
    }))
  });
});

homeRouter.get("/popular-courses", requireAuth, async (req, res) => {
  const memoryStore = req.app.locals.memoryStore;
  let allCourses = (memoryStore?.courses || []).concat(req.app.locals.globalCourses || []);

  try {
    const dbCourses = await Course.find().sort({ createdAt: -1 }).lean();
    dbCourses.forEach((dbC) => {
      if (!allCourses.some((c) => String(c.id || c.customId || c._id) === String(dbC.customId || dbC.id || dbC._id))) {
        allCourses.push(dbC);
      }
    });
  } catch (e) {}

  const realPopularCourses = allCourses.map((c) => ({
    id: c.customId || c.id || c._id,
    title: c.title,
    subtitle: c.subtitle || `Master ${c.title} with expert live guidance`,
    instructor: c.mentor?.name || c.mentorName || "TCM Mentor",
    instructorRole: c.mentor?.role || c.mentorRole || "TCM Educator",
    instructorAvatar: c.mentor?.avatarUrl || c.mentorAvatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    verified: true,
    rating: c.rating ? String(c.rating) : "5.0",
    reviews: c.reviewsCount || c.reviews || "1",
    price: c.price || "₹1,499",
    originalPrice: c.originalPrice || "₹4,999",
    discount: c.discountPill || "70% OFF",
    learners: `${c.studentsCount || "100+"} Learners`,
    type: "Live Batch",
    image: c.imageUrl || c.image || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80",
    badge: "🔴 LIVE",
    category: (c.category || "dev").toLowerCase().includes("tech") ? "dev" : (c.category || "dev").toLowerCase().includes("academy") ? "academic" : "dev"
  }));

  return res.json({
    categories: [
      { id: "all", name: "All", icon: "widgets-outline" },
      { id: "dev", name: "Development", icon: "code-tags" },
      { id: "design", name: "Design", icon: "pencil-outline" },
      { id: "data", name: "Data", icon: "chart-bar" },
      { id: "biz", name: "Business", icon: "briefcase-outline" },
      { id: "mkt", name: "Marketing", icon: "bullhorn-outline" }
    ],
    courses: realPopularCourses,
    stats: [
      { id: "s1", title: `${realPopularCourses.length || 1}+`, sub: "Live Courses", icon: "broadcast", color: "#5B3CF5", bg: "#F0EDFF" },
      { id: "s2", title: "50K+", sub: "Active Learners", icon: "account-group", color: "#2E7D32", bg: "#ECF9E9" },
      { id: "s3", title: "200+", sub: "Expert Mentors", icon: "star-face", color: "#E7A900", bg: "#FFF6DA" },
      { id: "s4", title: "Certificate", sub: "On Completion", icon: "certificate", color: "#2F79B9", bg: "#EAF5FF" }
    ]
  });
});

homeRouter.get("/all-mentors", requireAuth, async (req, res) => {
  const memoryStore = req.app.locals.memoryStore;
  let mentorList = [];

  // 1. Check memoryStore mentors & users
  if (memoryStore) {
    if (Array.isArray(memoryStore.mentors)) {
      mentorList.push(...memoryStore.mentors);
    }
    if (Array.isArray(memoryStore.users)) {
      memoryStore.users.filter((u) => u.role === "mentor" || u.isMentor).forEach((mUser) => {
        if (!mentorList.some((m) => String(m.id || m._id || m.userId) === String(mUser.id || mUser._id))) {
          mentorList.push(mUser);
        }
      });
    }
  }

  // 2. Query MongoDB Mentor & User models
  try {
    const [dbMentors, dbMentorUsers] = await Promise.all([
      Mentor.find().lean(),
      User.find({ role: "mentor" }).lean()
    ]);

    dbMentors.forEach((m) => {
      if (!mentorList.some((existing) => String(existing._id || existing.id || existing.userId) === String(m._id || m.userId))) {
        mentorList.push(m);
      }
    });

    for (const mUser of dbMentorUsers) {
      const uIdStr = mUser._id.toString();
      if (!mentorList.some((existing) => String(existing._id || existing.id || existing.userId) === uIdStr)) {
        mentorList.push(mUser);
      }
      // Auto-sync missing Mentor collection document in MongoDB
      try {
        const hasDoc = dbMentors.some((m) => m.userId === uIdStr || m.email === mUser.email);
        if (!hasDoc) {
          await Mentor.create({
            userId: uIdStr,
            email: mUser.email,
            name: mUser.name,
            title: `${mUser.mentorCategory || "TCM"} Senior Mentor`,
            mentorCategory: mUser.mentorCategory || "TCM Information Tech",
            rating: 5.0,
            learners: "1.2K+",
            skills: ["Mentorship", "Live Sessions", mUser.mentorCategory || "TCM"]
          });
        }
      } catch (syncErr) {}
    }
  } catch (e) {}

  if (req.user && (req.user.role === "mentor" || req.user.isMentor) && !mentorList.some((u) => String(u._id || u.id || u.userId) === String(req.user._id || req.user.id))) {
    mentorList.unshift(req.user);
  }

  return res.json({
    mentors: mentorList.map((u) => ({
      id: u._id || u.id || u.userId,
      name: u.name || "TCM Educator",
      role: u.title || `${u.mentorCategory || "TCM"} Mentor & Educator`,
      category: u.mentorCategory || "TCM Specialization",
      avatarUrl: u.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      rating: u.rating ? String(u.rating) : "5.0",
      reviews: u.reviewsCount || "12",
      experience: u.yearsExperience || "5+ Yrs Exp",
      verified: true,
      bio: u.bio || `Expert educator in ${u.mentorCategory || "TCM Specialization"}`
    }))
  });
});

homeRouter.get("/search", requireAuth, (req, res) => {
  const query = (req.query.q || "").toLowerCase().trim();

  const allPosts = [
    {
      id: "sr1",
      authorName: "Rahul Dev",
      authorRole: "Senior Full Stack Developer",
      authorAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      category: "Development",
      text: "Mastering React Native Architecture & Performance: 10 clean patterns for scalable mobile apps.",
      timeLabel: "2h ago"
    },
    {
      id: "sr2",
      authorName: "Ananya Sharma",
      authorRole: "Python Developer",
      authorAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
      category: "Python",
      text: "Python Data Structures Cheat Sheet: Arrays, Linked Lists, Trees & Graph Traversals explained simply.",
      timeLabel: "5h ago"
    },
    {
      id: "sr3",
      authorName: "Karan Singh",
      authorRole: "Senior UI/UX Designer",
      authorAvatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
      category: "Design",
      text: "Glassmorphism & Micro-animations in modern design systems: A step-by-step UI guide.",
      timeLabel: "1d ago"
    }
  ];

  const allCourses = [
    {
      id: "p1",
      title: "Full Stack Web Development",
      subtitle: "MERN Stack (MongoDB, Express, React, Node.js)",
      rating: "4.8",
      price: "₹699",
      image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "p2",
      title: "Python Programming",
      subtitle: "From Basics to Advanced",
      rating: "4.7",
      price: "₹499",
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "p3",
      title: "UI/UX Design Mastery",
      subtitle: "Design Beautiful, Functional Experiences",
      rating: "4.9",
      price: "₹599",
      image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=400&q=80"
    }
  ];

  const allMentors = [
    {
      id: "m1",
      name: "Rahul Dev",
      title: "Senior Full Stack Developer",
      rating: "4.9",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
    },
    {
      id: "m2",
      name: "Ananya Sharma",
      title: "Python & Machine Learning Specialist",
      rating: "4.8",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
    },
    {
      id: "m3",
      name: "Karan Singh",
      title: "Principal UI/UX Designer",
      rating: "4.9",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"
    }
  ];

  if (!query) {
    return res.json({ posts: [], courses: [], mentors: [] });
  }

  const posts = allPosts.filter((p) => p.text.toLowerCase().includes(query) || p.authorName.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
  const courses = allCourses.filter((c) => c.title.toLowerCase().includes(query) || c.subtitle.toLowerCase().includes(query));
  const mentors = allMentors.filter((m) => m.name.toLowerCase().includes(query) || m.title.toLowerCase().includes(query));

  return res.json({ posts, courses, mentors });
});

homeRouter.get("/mentor/:mentorId", requireAuth, async (req, res) => {
  const mentorId = req.params.mentorId || "m1";
  const memoryStore = req.app.locals.memoryStore;

  let matchedUser = null;

  // 1. Check req.user
  if (req.user && (String(req.user._id || req.user.id) === String(mentorId) || req.user.email === mentorId)) {
    matchedUser = req.user;
  }

  // 2. Check memoryStore mentors & users
  if (!matchedUser && memoryStore) {
    if (Array.isArray(memoryStore.mentors)) {
      matchedUser = memoryStore.mentors.find((m) => String(m._id || m.id || m.userId) === String(mentorId) || m.email === mentorId);
    }
    if (!matchedUser && Array.isArray(memoryStore.users)) {
      matchedUser = memoryStore.users.find((u) => String(u._id || u.id) === String(mentorId) || u.email === mentorId);
    }
  }

  // 3. Check MongoDB database (Mentor & User models)
  if (!matchedUser) {
    try {
      matchedUser = await Mentor.findOne({ $or: [{ _id: mentorId }, { userId: mentorId }, { email: mentorId }] }).lean();
    } catch (e) {}
    if (!matchedUser) {
      try {
        matchedUser = await User.findById(mentorId).lean();
      } catch (e) {}
    }
  }

  // 4. Fallback to any registered mentor or current user if mentorId is generic
  if (!matchedUser) {
    try {
      matchedUser = (await Mentor.findOne().lean()) || (await User.findOne({ role: "mentor" }).lean()) || req.user;
    } catch (e) {
      matchedUser = req.user;
    }
  }

  const cat = matchedUser?.mentorCategory || "TCM Information Tech";
  const userSubjects = matchedUser?.subjects?.length
    ? matchedUser.subjects.map((sub, sIdx) =>
        typeof sub === "string"
          ? { id: `sub_${sIdx}`, title: sub, desc: `${cat} Curriculum & Live Sessions`, icon: "code-tags", bg: "#F0EDFF" }
          : sub
      )
    : [{ id: "sub1", title: cat, desc: `Core ${cat} Curriculum & Live Sessions`, icon: "code-tags", bg: "#F0EDFF" }];

  const userExp = matchedUser?.experiences?.length
    ? matchedUser.experiences.map((exp, eIdx) => ({
        id: exp.id || `exp_${eIdx}`,
        role: exp.role || `${cat} Mentor`,
        company: exp.company || "TCM Academy",
        durationPill: exp.durationPill || "2+ Years",
        icon: exp.icon || "school",
        iconColor: exp.iconColor || "#5B3CF5"
      }))
    : [
        {
          id: "exp1",
          role: `${cat} Senior Mentor`,
          company: "TCM Academy • 2023 - Present",
          durationPill: "2+ Years",
          icon: "school",
          iconColor: "#5B3CF5"
        }
      ];

  // Fetch mentor's created courses
  const allCourses = (memoryStore?.courses || []).concat(req.app.locals.globalCourses || []);
  const matchedUserIdStr = String(matchedUser._id || matchedUser.id || "");
  const mentorCourses = allCourses.filter(
    (c) =>
      c.mentorId === matchedUserIdStr ||
      c.mentorName === matchedUser.name ||
      c.mentor?.name === matchedUser.name
  );

  return res.json({
    id: matchedUser._id || matchedUser.id || mentorId,
    name: matchedUser.name || "TCM Educator",
    verified: true,
    badge: `🎓 ${cat} Specialization`,
    role: `${cat} Mentor & Educator`,
    rating: "5.0",
    reviewsCount: "12",
    studentsCount: "1.2K+",
    tags: [
      { label: cat, bg: "#F0EDFF", color: "#5B3CF5" },
      { label: "Live Educator", bg: "#ECF9E9", color: "#2E7D32" }
    ],
    bio: matchedUser.bio || `Specialist in ${cat}. Empowering students with live guidance & practical mentorship.`,
    avatarUrl: matchedUser.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    stats: [
      { title: matchedUser.yearsExperience || "5+", sub: "Years Exp.", icon: "school-outline", bg: "#F0EDFF" },
      { title: `${mentorCourses.length || 1}+`, sub: "Live Courses", icon: "play-circle-outline", bg: "#F0EDFF" },
      { title: "1.2K+", sub: "Students", icon: "account-group-outline", bg: "#F0EDFF" },
      { title: "100%", sub: "Satisfaction", icon: "medal-outline", bg: "#F0EDFF" }
    ],
    about: matchedUser.bio || `Specializing in ${cat}. I love breaking down complex topics into simple, actionable steps to help students succeed in exams and real-world projects.`,
    subjects: userSubjects,
    experiences: userExp,
    certifications: matchedUser.certifications || ["Certified Technical Instructor", "Full Stack Systems Architect"],
    interests: matchedUser.interests || ["System Architecture", "AI & Machine Learning", "Student Mentorship"],
    courses: mentorCourses,
    ratingsOverview: {
        score: "5.0",
        reviewsLabel: "(1 Review)",
        breakdown: [
          { star: "5 Stars", percent: 100 },
          { star: "4 Stars", percent: 0 },
          { star: "3 Stars", percent: 0 },
          { star: "2 Stars", percent: 0 },
          { star: "1 Star", percent: 0 }
        ],
        featuredReview: {
          authorName: "TCM Student",
          authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
          timeAgo: "1 day ago",
          text: "Excellent mentor! The sessions are super clear and easy to understand."
        }
      }
    });
});

homeRouter.post("/user/:targetId/friend-request", requireAuth, async (req, res) => {
  const { targetId } = req.params;
  const { action = "send" } = req.body;
  const senderId = String(req.user._id || req.user.id);
  const memoryStore = req.app.locals.memoryStore;

  if (!req.app.locals.friendRequests) {
    req.app.locals.friendRequests = {};
  }
  if (!req.app.locals.userNotifications) {
    req.app.locals.userNotifications = {};
  }

  const reqKey = [senderId, String(targetId)].sort().join("_");
  let friendStatus = "none";
  let isMutual = false;

  if (action === "send") {
    friendStatus = "pending_sent";
    req.app.locals.friendRequests[reqKey] = {
      senderId,
      senderName: req.user.name || "TCM Member",
      senderAvatar: req.user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      targetId: String(targetId),
      status: "pending",
      createdAt: new Date()
    };

    // Push in-app notification to receiver
    const receiverIdStr = String(targetId);
    if (!req.app.locals.userNotifications[receiverIdStr]) {
      req.app.locals.userNotifications[receiverIdStr] = [];
    }

    const notifObj = {
      id: `notif_${Date.now()}`,
      type: "friend_request",
      title: "New Friend Request 📩",
      subtitle: `${req.user.name || "A learner"} sent you a friend request. Accept to connect & start chatting!`,
      avatarUrl: req.user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      time: "Just now",
      unread: true,
      section: "Today",
      senderId,
      senderName: req.user.name || "TCM Member",
      targetId: String(targetId)
    };

    req.app.locals.userNotifications[receiverIdStr].unshift(notifObj);
  } else if (action === "accept") {
    friendStatus = "friends";
    isMutual = true;
    if (req.app.locals.friendRequests[reqKey]) {
      req.app.locals.friendRequests[reqKey].status = "friends";
    }

    // Push confirmation notification back to sender
    const existingReq = req.app.locals.friendRequests[reqKey];
    const originalSender = existingReq?.senderId === senderId ? existingReq?.targetId : existingReq?.senderId || targetId;
    const senderIdStr = String(originalSender);

    if (!req.app.locals.userNotifications[senderIdStr]) {
      req.app.locals.userNotifications[senderIdStr] = [];
    }

    req.app.locals.userNotifications[senderIdStr].unshift({
      id: `notif_${Date.now()}`,
      type: "friend_accepted",
      title: "Request Accepted! 🎉",
      subtitle: `${req.user.name || "User"} accepted your friend request! You can now send direct messages.`,
      avatarUrl: req.user.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      time: "Just now",
      unread: true,
      section: "Today",
      targetMentorId: String(req.user._id)
    });
  } else if (action === "cancel" || action === "unfriend" || action === "decline") {
    friendStatus = "none";
    isMutual = false;
    delete req.app.locals.friendRequests[reqKey];
  }

  return res.json({ success: true, friendStatus, isMutual });
});

homeRouter.get("/notifications", requireAuth, (req, res) => {
  const userId = String(req.user?._id || req.user?.id || "seed-user");
  if (!req.app.locals.userNotifications) {
    req.app.locals.userNotifications = {};
  }

  let notifications = req.app.locals.userNotifications[userId] || [];

  if (notifications.length === 0) {
    notifications = [
      {
        id: "n1",
        type: "mentor",
        title: "Live Masterclass starting in 15m 🚀",
        subtitle: "Full Stack MERN Architecture live session with Rahul Dev is about to start.",
        time: "15m ago",
        unread: true,
        section: "Today",
        icon: "video",
        iconBg: "#F0EDFF",
        iconColor: "#5B3CF5"
      },
      {
        id: "n2",
        type: "sessions",
        title: "Reflection Submitted ✨",
        subtitle: "You unlocked Module 4 DevOps & Deployment. 50 XP awarded to your wallet!",
        time: "1h ago",
        unread: false,
        section: "Today",
        icon: "award",
        iconBg: "#ECF9E9",
        iconColor: "#2E7D32"
      }
    ];
  }

  const unreadCount = notifications.filter((n) => n.unread).length;
  return res.json({ notifications, unreadCount });
});

homeRouter.post("/notifications/:notificationId/action", requireAuth, (req, res) => {
  const { notificationId } = req.params;
  const { action = "accept" } = req.body;
  const userId = String(req.user?._id || req.user?.id);

  if (!req.app.locals.userNotifications) {
    req.app.locals.userNotifications = {};
  }

  const userNotifs = req.app.locals.userNotifications[userId] || [];
  const targetNotif = userNotifs.find((n) => n.id === notificationId);

  if (targetNotif) {
    targetNotif.unread = false;
    targetNotif.actionTaken = action;

    if (action === "accept" && targetNotif.senderId) {
      targetNotif.subtitle = `You accepted ${targetNotif.senderName || "User"}'s friend request. You can now chat! 🎉`;
      const reqKey = [userId, String(targetNotif.senderId)].sort().join("_");
      if (!req.app.locals.friendRequests) req.app.locals.friendRequests = {};
      req.app.locals.friendRequests[reqKey] = { status: "friends" };

      if (!req.app.locals.globalFriendStore) req.app.locals.globalFriendStore = {};
      const senderIdStr = String(targetNotif.senderId);
      req.app.locals.globalFriendStore[`${userId}_${senderIdStr}`] = true;
      req.app.locals.globalFriendStore[`${senderIdStr}_${userId}`] = true;

      try {
        User.findByIdAndUpdate(userId, { $addToSet: { friends: senderIdStr } }).exec();
        User.findByIdAndUpdate(senderIdStr, { $addToSet: { friends: userId } }).exec();
      } catch (e) {}

      // Push confirmation to sender
      if (!req.app.locals.userNotifications[senderIdStr]) {
        req.app.locals.userNotifications[senderIdStr] = [];
      }
      req.app.locals.userNotifications[senderIdStr].unshift({
        id: `notif_${Date.now()}`,
        type: "friend_accepted",
        title: "Request Accepted! 🎉",
        subtitle: `${req.user.name || "Learner"} accepted your friend request. You can now send direct messages!`,
        avatarUrl: req.user.avatarUrl || "",
        time: "Just now",
        unread: true,
        section: "Today"
      });
    } else if (action === "decline") {
      targetNotif.subtitle = `Friend request declined.`;
    }
  }

  return res.json({ success: true, message: `Action ${action} executed successfully.` });
});

function getOrCreateUserWallet(req, userId) {
  if (!req.app.locals.wallets) {
    req.app.locals.wallets = {};
  }
  const uId = String(userId || req.user?.id || "u1");
  if (!req.app.locals.wallets[uId]) {
    const rawName = (req.user?.name || "LEARNER").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const prefix = rawName.substring(0, 3).padEnd(3, "X");
    const referralCode = `${prefix}25X`.substring(0, 6);
    req.app.locals.wallets[uId] = {
      totalBalance: 0.0,
      availableBalance: 0.0,
      totalEarned: 0.0,
      totalWithdrawn: 0.0,
      tcmCoins: 0,
      pendingBalance: 0.0,
      referralCode,
      transactions: []
    };
  }
  return req.app.locals.wallets[uId];
}

homeRouter.get("/wallet", requireAuth, (req, res) => {
  const wallet = getOrCreateUserWallet(req, req.user._id || req.user.id);
  res.json({ wallet });
});

homeRouter.post("/wallet/withdraw", requireAuth, (req, res) => {
  const wallet = getOrCreateUserWallet(req, req.user._id || req.user.id);
  const { amount = 0, upiId = "" } = req.body;
  const amt = parseFloat(amount);

  if (!amt || amt <= 0 || amt > wallet.availableBalance) {
    return res.status(400).json({ message: "Invalid or insufficient withdrawal amount." });
  }

  wallet.availableBalance -= amt;
  wallet.totalBalance -= amt;
  wallet.totalWithdrawn += amt;
  wallet.transactions.unshift({
    id: `tx_${Date.now()}`,
    type: "debit",
    title: "Withdrawal Requested",
    subtitle: `Transferred to UPI: ${upiId || "Bank"}`,
    amount: `- ₹${amt.toFixed(2)}`,
    date: "Just now",
    icon: "wallet",
    iconBg: "#FFF3E0",
    iconColor: "#EF6C00"
  });

  res.json({ wallet, message: "Withdrawal initiated successfully." });
});

homeRouter.post("/wallet/add-money", requireAuth, (req, res) => {
  const wallet = getOrCreateUserWallet(req, req.user._id || req.user.id);
  const { amount = 0 } = req.body;
  const amt = parseFloat(amount);

  if (!amt || amt <= 0) {
    return res.status(400).json({ message: "Invalid amount." });
  }

  wallet.availableBalance += amt;
  wallet.totalBalance += amt;
  wallet.totalEarned += amt;
  wallet.transactions.unshift({
    id: `tx_${Date.now()}`,
    type: "credit",
    title: "Added Funds",
    subtitle: "UPI / GPay Payment Success",
    amount: `+ ₹${amt.toFixed(2)}`,
    date: "Just now",
    icon: "wallet-plus",
    iconBg: "#E8F5E9",
    iconColor: "#2E7D32"
  });

  res.json({ wallet, message: "Money added to wallet." });
});

homeRouter.get("/doubts", requireAuth, (req, res) => {
  if (!req.app.locals.doubtThreads) {
    req.app.locals.doubtThreads = [];
  }
  res.json({ success: true, doubts: req.app.locals.doubtThreads });
});

homeRouter.post("/doubts", requireAuth, (req, res) => {
  const { title, subject = "General", tags = [] } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Doubt title is required." });
  }

  if (!req.app.locals.doubtThreads) {
    req.app.locals.doubtThreads = [];
  }

  const newDoubt = {
    id: `d_${Date.now()}`,
    title: title.trim(),
    subject,
    authorName: req.user?.name || "Learner",
    authorAvatar: req.user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    status: "Pending",
    repliesCount: 0,
    createdAt: "Just now",
    tags: Array.isArray(tags) ? tags : ["Question"]
  };

  req.app.locals.doubtThreads.unshift(newDoubt);
  res.json({ success: true, doubt: newDoubt, doubts: req.app.locals.doubtThreads });
});

// Helper for Doubt Rooms store initialization (starts empty for real user data)
function getDefaultDoubtRooms(req) {
  if (!req.app.locals.doubtRoomStore) {
    req.app.locals.doubtRoomStore = {};
  }
  return req.app.locals.doubtRoomStore;
}

// 1. GET /home/doubt-rooms - List all active Doubt Rooms & Knowledge Base highlights
homeRouter.get("/doubt-rooms", requireAuth, (req, res) => {
  const store = getDefaultDoubtRooms(req);
  const rooms = Object.values(store).map((r) => ({
    roomId: r.roomId,
    title: r.title,
    category: r.category,
    creatorRole: r.creatorRole,
    assignedMentor: r.assignedMentor,
    membersCount: r.membersCount,
    onlineCount: r.onlineCount,
    isSolved: r.isSolved,
    lastMessage: r.messages?.[r.messages.length - 1]?.text || "Study discussion room active"
  }));

  const kbItems = req.app.locals.knowledgeBaseStore || [];
  return res.json({ success: true, rooms, knowledgeBase: kbItems });
});

// 2. POST /home/doubt-rooms - Create a new Doubt Room (Mentor or Student created)
homeRouter.post("/doubt-rooms", requireAuth, (req, res) => {
  const { title, category = "NEET", isPrivate = false, description = "" } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Room title is required." });
  }

  const store = getDefaultDoubtRooms(req);
  const userRole = (req.user?.role || "").toLowerCase().includes("mentor") || req.user?.isMentor ? "mentor" : "student";
  const currentUserId = String(req.user._id || req.user.id);
  const newRoomId = `${category.toUpperCase().replace(/\s+/g, "")}-DOUBT-${Math.floor(100 + Math.random() * 900)}`;

  const newRoom = {
    roomId: newRoomId,
    title: title.trim(),
    category,
    description: description.trim(),
    isPrivate: Boolean(isPrivate),
    creatorId: currentUserId,
    creatorRole: userRole,
    admins: [currentUserId],
    members: [currentUserId],
    assignedMentor: userRole === "mentor" ? {
      id: currentUserId,
      name: req.user?.name || "Mentor",
      role: req.user?.role || "TCM Mentor",
      avatarUrl: req.user?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      online: true
    } : null,
    membersCount: 1,
    onlineCount: 1,
    pinnedAnnouncement: {
      text: `Welcome to ${title.trim()}! Keep discussions on-topic and respectful.`,
      authorName: req.user?.name || "Room Admin"
    },
    isSolved: false,
    messages: [
      {
        id: `msg_welcome_${Date.now()}`,
        authorName: req.user?.name || "Room Creator",
        authorRole: "Admin",
        authorAvatar: req.user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
        time: "Just now",
        text: `Welcome to ${title.trim()}! ${isPrivate ? "🔒 (Private Room)" : "🌐 (Public Room)"}`,
        type: "text"
      }
    ]
  };

  store[newRoomId] = newRoom;
  return res.json({ success: true, room: newRoom });
});

// POST /home/doubt-rooms/:roomId/join - Join or Request to Join a Doubt Room
homeRouter.post("/doubt-rooms/:roomId/join", requireAuth, (req, res) => {
  const { roomId } = req.params;
  const store = getDefaultDoubtRooms(req);
  const room = store[roomId];
  if (!room) return res.status(404).json({ message: "Doubt Room not found." });

  const userId = String(req.user._id || req.user.id);
  if (!room.members) room.members = [];
  if (!room.joinRequests) room.joinRequests = [];

  // Already a member
  if (room.members.includes(userId)) {
    return res.json({ success: true, room, status: "joined" });
  }

  // If room is private, submit a join request for admin approval
  if (room.isPrivate) {
    const existingReq = room.joinRequests.find((r) => String(r.userId) === userId);
    if (!existingReq) {
      room.joinRequests.push({
        userId,
        userName: req.user?.name || "Student Learner",
        userAvatar: req.user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
        requestedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
    }
    return res.json({ success: true, room, status: "requested", message: "Join request sent to Room Admin for approval." });
  }

  // Public room: instant join
  room.members.push(userId);
  room.membersCount = (room.membersCount || 0) + 1;
  return res.json({ success: true, room, status: "joined" });
});

// POST /home/doubt-rooms/:roomId/manage - Admin management (approve/decline requests, promote admin, remove member, update info)
homeRouter.post("/doubt-rooms/:roomId/manage", requireAuth, (req, res) => {
  const { roomId } = req.params;
  const { action, targetUserId, description, roomAvatar, isPrivate } = req.body;
  const store = getDefaultDoubtRooms(req);
  const room = store[roomId];
  if (!room) return res.status(404).json({ message: "Doubt Room not found." });

  const currentUserId = String(req.user._id || req.user.id);
  const isAdmin = (room.admins || []).includes(currentUserId) || room.creatorId === currentUserId;

  if (!isAdmin) {
    return res.status(403).json({ message: "Only room admins can manage settings." });
  }

  if (!room.joinRequests) room.joinRequests = [];
  if (!room.members) room.members = [];

  if (action === "approve_request" && targetUserId) {
    room.joinRequests = room.joinRequests.filter((r) => String(r.userId) !== String(targetUserId));
    if (!room.members.includes(String(targetUserId))) {
      room.members.push(String(targetUserId));
      room.membersCount = (room.membersCount || 0) + 1;
    }
  } else if (action === "decline_request" && targetUserId) {
    room.joinRequests = room.joinRequests.filter((r) => String(r.userId) !== String(targetUserId));
  } else if (action === "promote_admin" && targetUserId) {
    if (!room.admins) room.admins = [room.creatorId];
    if (!room.admins.includes(targetUserId)) {
      room.admins.push(targetUserId);
    }
  } else if (action === "remove_member" && targetUserId) {
    room.members = (room.members || []).filter((m) => String(m) !== String(targetUserId));
    room.membersCount = Math.max(1, (room.membersCount || 1) - 1);
  } else if (action === "update_info") {
    if (description !== undefined) room.description = description;
    if (roomAvatar !== undefined) room.roomAvatar = roomAvatar;
    if (isPrivate !== undefined) room.isPrivate = Boolean(isPrivate);
  }

  return res.json({ success: true, room });
});

// 3. GET /home/doubt-rooms/:roomId - Fetch Doubt Room details & chat messages
homeRouter.get("/doubt-rooms/:roomId", requireAuth, (req, res) => {
  const { roomId } = req.params;
  const store = getDefaultDoubtRooms(req);
  const room = store[roomId];

  if (!room) {
    return res.status(404).json({ message: "Doubt Room not found." });
  }

  return res.json({ success: true, room });
});

// 4. POST /home/doubt-rooms/:roomId/messages - Send room message (Text, Code, Reaction, Reply)
homeRouter.post("/doubt-rooms/:roomId/messages", requireAuth, (req, res) => {
  const { roomId } = req.params;
  const { text, codeSnippet, attachmentUrl, attachmentType, replyToId, reactionEmoji } = req.body;
  const store = getDefaultDoubtRooms(req);
  const room = store[roomId];

  if (!room) {
    return res.status(404).json({ message: "Doubt Room not found." });
  }

  // Handle reaction toggle if reactionEmoji and replyToId are provided
  if (reactionEmoji && replyToId) {
    const targetMsg = room.messages.find((m) => m.id === replyToId);
    if (targetMsg) {
      if (!targetMsg.reactions) targetMsg.reactions = [];
      const existing = targetMsg.reactions.find((r) => r.emoji === reactionEmoji);
      if (existing) {
        existing.count += 1;
        existing.label = String(existing.count);
      } else {
        targetMsg.reactions.push({ emoji: reactionEmoji, count: 1, label: "1" });
      }
      return res.json({ success: true, room });
    }
  }

  if (!text && !codeSnippet && !attachmentUrl) {
    return res.status(400).json({ message: "Message content cannot be empty." });
  }

  const isUserMentor = (req.user?.role || "").toLowerCase().includes("mentor") || req.user?.isMentor;
  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    authorName: req.user?.name || "Learner",
    authorRole: isUserMentor ? "Admin" : undefined,
    authorAvatar: req.user?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    text: text ? text.trim() : "",
    codeSnippet: codeSnippet ? codeSnippet.trim() : undefined,
    attachmentUrl: attachmentUrl || undefined,
    attachmentType: attachmentType || undefined,
    reactions: [],
    isSelf: true,
    isAdmin: isUserMentor,
    type: codeSnippet ? "code" : attachmentUrl ? "file" : "text",
    canAskAi: text && text.includes("?")
  };

  room.messages.push(newMsg);
  return res.json({ success: true, message: newMsg, room });
});

// 5. POST /home/doubt-rooms/:roomId/ask-ai - AI Tutor participant answer & escalation
homeRouter.post("/doubt-rooms/:roomId/ask-ai", requireAuth, async (req, res) => {
  const { roomId } = req.params;
  const { messageId, doubtText } = req.body;
  const store = getDefaultDoubtRooms(req);
  const room = store[roomId];

  if (!room) {
    return res.status(404).json({ message: "Doubt Room not found." });
  }

  const aiAnswerText = `🤖 **TCM AI Explanation**:\n\nRegarding "${doubtText || "your question"}":\n\n1. **Core Concept**: In ${room.category || "this topic"}, electronegativity decreases down the group because atomic radius increases, placing valence electrons farther from the nucleus.\n2. **Key Factor**: The increased shielding effect from inner shell electrons reduces effective nuclear pull.\n\n*Need further clarification? You can tap "Need Mentor Help" below to loop in ${room.assignedMentor?.name || "your mentor"}!*`;

  const aiMsg = {
    id: `msg_ai_${Date.now()}`,
    authorName: "TCM AI Tutor 🤖",
    authorRole: "AI Assistant",
    authorAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    text: aiAnswerText,
    reactions: [{ emoji: "💡", count: 3, label: "3" }],
    isAi: true,
    type: "ai_response",
    canRequestMentorHelp: true
  };

  room.messages.push(aiMsg);
  return res.json({ success: true, aiMessage: aiMsg, room });
});

// 6. POST /home/doubt-rooms/:roomId/polls - Create poll inside room
homeRouter.post("/doubt-rooms/:roomId/polls", requireAuth, (req, res) => {
  const { roomId } = req.params;
  const { question, options = ["Yes, I want to learn again", "No, I understood"] } = req.body;
  const store = getDefaultDoubtRooms(req);
  const room = store[roomId];

  if (!room) {
    return res.status(404).json({ message: "Doubt Room not found." });
  }

  const pollMsg = {
    id: `msg_poll_${Date.now()}`,
    type: "poll",
    pollId: `poll_${Date.now()}`,
    authorName: req.user?.name || "Physics Guru",
    authorRole: (req.user?.role || "").toLowerCase().includes("mentor") ? "Admin" : "Member",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    question: question || "Who wants to learn this topic again in a live session?",
    options: options.map((optText, index) => ({
      id: `opt_${index + 1}`,
      text: optText,
      count: index === 0 ? 4 : 1,
      percentage: index === 0 ? 80 : 20,
      isVoted: false
    })),
    totalVotes: 5,
    endsIn: "24h 00m"
  };

  room.messages.push(pollMsg);
  return res.json({ success: true, pollMessage: pollMsg, room });
});

// 7. POST /home/doubt-rooms/:roomId/polls/:pollId/vote - Vote on poll
homeRouter.post("/doubt-rooms/:roomId/polls/:pollId/vote", requireAuth, (req, res) => {
  const { roomId, pollId } = req.params;
  const { optionId } = req.body;
  const store = getDefaultDoubtRooms(req);
  const room = store[roomId];

  if (!room) {
    return res.status(404).json({ message: "Doubt Room not found." });
  }

  const pollMsg = room.messages.find((m) => m.type === "poll" && (m.pollId === pollId || m.id === pollId));
  if (!pollMsg) {
    return res.status(404).json({ message: "Poll not found." });
  }

  pollMsg.options.forEach((opt) => {
    if (opt.id === optionId) {
      opt.count += 1;
      opt.isVoted = true;
    }
  });

  const total = pollMsg.options.reduce((sum, o) => sum + o.count, 0);
  pollMsg.totalVotes = total;
  pollMsg.options.forEach((opt) => {
    opt.percentage = Math.round((opt.count / total) * 100);
  });

  // Auto-Trigger Mentor Alert if any option gets 5 or more votes
  const highDemandOpt = pollMsg.options.find((o) => o.count >= 5 && o.text.toLowerCase().includes("yes"));
  if (highDemandOpt) {
    const mentorId = room.assignedMentor?.id || "m1";
    if (!req.app.locals.userNotifications) req.app.locals.userNotifications = {};
    if (!req.app.locals.userNotifications[mentorId]) req.app.locals.userNotifications[mentorId] = [];

    const autoAlert = {
      id: `notif_auto_rev_${Date.now()}`,
      type: "mentor",
      title: "⚡ Revision Session Recommended!",
      subtitle: `In '${room.title}', ${highDemandOpt.count}+ students voted for a Live Revision Class on: "${pollMsg.question}"`,
      time: "Just now",
      unread: true,
      section: "Today",
      icon: "video",
      iconBg: "#F0EDFF",
      iconColor: "#5B3CF5"
    };

    req.app.locals.userNotifications[mentorId].unshift(autoAlert);
  }

  return res.json({ success: true, pollMessage: pollMsg, room });
});

// 8. POST /home/doubt-rooms/:roomId/mark-solved - Mark doubt as solved & save to Knowledge Base
homeRouter.post("/doubt-rooms/:roomId/mark-solved", requireAuth, (req, res) => {
  const { roomId } = req.params;
  const { questionText, solutionText } = req.body;
  const store = getDefaultDoubtRooms(req);
  const room = store[roomId];

  if (!room) {
    return res.status(404).json({ message: "Doubt Room not found." });
  }

  room.isSolved = true;

  if (!req.app.locals.knowledgeBaseStore) {
    req.app.locals.knowledgeBaseStore = [];
  }

  const kbEntry = {
    itemId: `kb_${Date.now()}`,
    roomId,
    title: room.title,
    category: room.category,
    questionText: questionText || "P-block element electronegativity vs halogens",
    solutionText: solutionText || "Atomic size increases down group & halogens have maximum effective nuclear pull.",
    authorName: req.user?.name || "Learner",
    solvedByMentorName: room.assignedMentor?.name || "Rahul Sharma",
    upvotes: 1,
    createdAt: "Just now"
  };

  req.app.locals.knowledgeBaseStore.unshift(kbEntry);
  return res.json({ success: true, message: "Doubt marked as Solved and added to Knowledge Base! 🎉", knowledgeBaseItem: kbEntry });
});

// 9. GET /home/knowledge-base/search - Search solved Knowledge Base items
homeRouter.get("/knowledge-base/search", requireAuth, (req, res) => {
  const query = (req.query.q || "").toLowerCase().trim();
  const kbItems = req.app.locals.knowledgeBaseStore || [];

  if (!query) {
    return res.json({ success: true, items: kbItems });
  }

  const filtered = kbItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query) ||
      item.questionText.toLowerCase().includes(query) ||
      item.solutionText.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
  );

  return res.json({ success: true, items: filtered });
});
