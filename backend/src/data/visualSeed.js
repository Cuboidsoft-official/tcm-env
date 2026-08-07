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
    memberBadge: "TCM Member",
    bio: "Building TCM to help curious minds learn, grow & create impact.",
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
    progress: 70
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

  const mentors = [
    {
      _id: "mentor-ankit",
      name: "Ankit Sharma",
      title: "Full Stack Developer",
      rating: 4.8,
      learners: 1200,
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80",
      skills: ["React", "Node.js", "MongoDB"]
    },
    {
      _id: "mentor-priya",
      name: "Priya Verma",
      title: "Data Science Expert",
      rating: 4.9,
      learners: 980,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
      skills: ["Python", "ML", "Analytics"]
    },
    {
      _id: "mentor-rohit",
      name: "Rohit Singh",
      title: "DSA & System Design",
      rating: 4.7,
      learners: 750,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
      skills: ["DSA", "Java", "System Design"]
    }
  ];

  const learn = {
    heroBanners: [
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
      },
      {
        id: "b3",
        tag: "ADVANCED",
        title: "System Design\n& Architecture",
        subtitle: "HLD • LLD • Scalable Backend • Microservices",
        buttonText: "Start Learning →",
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80"
      }
    ],
    continueLearning: [
      {
        id: "c1",
        title: "Python Basics",
        progress: 60,
        icon: "language-python",
        iconColor: "#FFC107",
        bgColor: "#FFF8E1"
      },
      {
        id: "c2",
        title: "Data Structures in Python",
        progress: 45,
        icon: "code-tags",
        iconColor: "#5B3CF5",
        bgColor: "#F0EDFF"
      },
      {
        id: "c3",
        title: "Java for Beginners",
        progress: 30,
        icon: "language-java",
        iconColor: "#E76F51",
        bgColor: "#FFF2EE"
      }
    ],
    popularCourses: [
      {
        id: "p1",
        title: "Full Stack Web Development",
        tags: "HTML, CSS, JS, React, Node.js",
        rating: "4.8",
        reviews: "1.2K",
        lessons: "32 Lessons",
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=500&q=80",
        bookmarked: false
      },
      {
        id: "p2",
        title: "Data Science with Python",
        tags: "Python, Pandas, NumPy, ML",
        rating: "4.7",
        reviews: "856",
        lessons: "28 Lessons",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80",
        bookmarked: true
      },
      {
        id: "p3",
        title: "Machine Learning A-Z",
        tags: "ML, Deep Learning, Python",
        rating: "4.9",
        reviews: "642",
        lessons: "24 Lessons",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80",
        bookmarked: false
      }
    ],
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
    ],
    support: {
      title: "Stuck on something?",
      subtitle: "Send a Help Request and get support"
    }
  };

  const posts = [];

  return { user, users: [user], stories, posts, mentors, learn };
}
