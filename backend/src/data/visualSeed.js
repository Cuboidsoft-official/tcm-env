export function createVisualSeedData(passwordHash = "") {
  const user = {
    _id: "seed-user",
    name: "Ayushman Chaurasiya",
    email: "student@tcm.com",
    passwordHash,
    role: "student",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    handle: "ayushman",
    verified: true,
    memberBadge: "TCM One Member",
    bio: "Building TCM One to help curious minds learn, grow & create impact.",
    location: "India",
    joinedDate: "Joined Jan 2024",
    website: "thecodemunk.in",
    stats: {
      postsCount: 64,
      followers: "1.24K",
      following: 356,
      reputation: "4.8K"
    },
    quickTools: {
      savedCount: 48,
      draftsCount: 5,
      deletedCount: 12
    },
    progress: 70,
    isApproved: true
  };

  const adminUser = {
    _id: "seed-admin",
    name: "Admin User",
    email: "admin@tcm.com",
    passwordHash,
    role: "admin",
    isApproved: true,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    handle: "admin",
    verified: true,
    memberBadge: "TCM One Administrator",
    bio: "TCM One Platform Administrator"
  };

  const partnerUser = {
    _id: "seed-partner",
    name: "Future Tech Institute",
    instituteName: "Future Tech Institute",
    email: "partner@tcm.com",
    passwordHash,
    role: "partner",
    isApproved: true,
    avatarUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=300&q=80",
    partnerCategory: "TCM Partner Institute",
    location: "Bilaspur, Chhattisgarh",
    rating: 5.0,
    reviewsCount: "0 Reviews",
    totalRevenue: "₹0",
    monthlyRevenue: "₹0",
    totalStudentsCount: 0,
    activeMentorsCount: 0,
    contactNumber: "",
    existingCourses: [],
    verified: true,
    memberBadge: "TCM Partner Institute",
    recentStudents: []
  };

  const stories = [
    {
      _id: "story-upsc",
      name: "UPSC",
      icon: "bank",
      iconColor: "#41415F",
      backgroundColor: "#FFF1E8",
      ringColors: ["#FF465F", "#FF9B54"],
      badge: "none",
      order: 1
    },
    {
      _id: "story-jee",
      name: "JEE",
      icon: "school",
      iconColor: "#17143C",
      backgroundColor: "#F6F4FF",
      ringColors: ["#5B3CF5", "#8E74FF"],
      badge: "none",
      order: 2
    },
    {
      _id: "story-neet",
      name: "NEET",
      icon: "stethoscope",
      iconColor: "#17143C",
      backgroundColor: "#FFF7FB",
      ringColors: ["#F72D96", "#FE74BD"],
      badge: "none",
      order: 3
    },
    {
      _id: "story-coding",
      name: "Coding",
      icon: "code-tags",
      iconColor: "#FFFFFF",
      backgroundColor: "#17143C",
      ringColors: ["#00A6A6", "#5B3CF5"],
      badge: "none",
      order: 4
    },
    {
      _id: "story-ai",
      name: "AI / ML",
      icon: "robot",
      iconColor: "#FFFFFF",
      backgroundColor: "#5C2DAA",
      ringColors: ["#8E74FF", "#C16BFF"],
      badge: "none",
      order: 5
    },
    {
      _id: "story-design",
      name: "Design",
      icon: "palette",
      iconColor: "#FFFFFF",
      backgroundColor: "#C83945",
      ringColors: ["#FF8A8A", "#FFD1D1"],
      badge: "none",
      order: 6
    },
    {
      _id: "story-more",
      name: "More",
      icon: "dots-horizontal",
      iconColor: "#5E5A76",
      backgroundColor: "#F4F3FA",
      ringColors: ["#F4F3FA", "#EDEBF5"],
      badge: "none",
      order: 7
    }
  ];

  const mentors = [];

  const learn = {
    heroBanners: [],
    continueLearning: [],
    popularCourses: [],
    topCategories: [
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
        name: "Exam Prep",
        coursesCount: "73 Courses",
        icon: "book-open-outline",
        color: "#9C27B0",
        bgColor: "#FBEAFE"
      }
    ],
    explore: [
      {
        id: "inform-tech",
        title: "TCM One Inform Tech",
        subtitle: "Live Classes, Notes,\nAssignments & More",
        icon: "play-circle",
        color: "#5B3CF5",
        backgroundColor: "#F0EDFF"
      },
      {
        id: "academy",
        title: "TCM One Academy",
        subtitle: "Premium Courses,\nSpecialized Programs",
        icon: "school",
        color: "#2E7D32",
        backgroundColor: "#ECF9E9"
      },
      {
        id: "guide",
        title: "TCM One Guide",
        subtitle: "Guidance, Career Paths,\nMentorship",
        icon: "book-open-page-variant",
        color: "#E7A900",
        backgroundColor: "#FFF6DA"
      },
      {
        id: "career",
        title: "TCM One Career",
        subtitle: "Internships, Jobs,\nPlacements",
        icon: "briefcase",
        color: "#2F79B9",
        backgroundColor: "#EAF5FF"
      }
    ],
    support: {
      title: "Stuck on something?",
      subtitle: "Send a Help Request and get support"
    }
  };

  const posts = [];

  return { user, users: [user, adminUser, partnerUser], stories, posts, mentors, learn };
}
