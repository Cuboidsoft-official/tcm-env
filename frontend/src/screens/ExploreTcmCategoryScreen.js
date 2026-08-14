import { useState, useRef, useEffect } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Feather, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { getCategoryCourses } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

const comingSoonBatches = {
  inform: [
    {
      id: "cs_inf1",
      tag: "⏳ LAUNCHING SOON",
      title: "AI & LLM Application Engineering 2026",
      subtitle: "LangChain • RAG • Vector DBs • OpenAI & Gemini APIs",
      date: "Starts 15th Aug 2026",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=500&q=80",
      cardBg: "#F0EDFF"
    },
    {
      id: "cs_inf2",
      tag: "⚡ UPCOMING BATCH",
      title: "Cloud Native Microservices Bootcamp",
      subtitle: "Golang • gRPC • Kubernetes • Distributed Systems",
      date: "Starts 1st Sept 2026",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80",
      cardBg: "#EBF5FF"
    }
  ],
  academy: [
    {
      id: "cs_ac1",
      tag: "⏳ LAUNCHING SOON",
      title: "NEET Organic Chemistry Booster 2026",
      subtitle: "Mechanisms • Reactions • Mock Tests • Top Faculty",
      date: "Starts 20th Aug 2026",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=500&q=80",
      cardBg: "#EAF7EC"
    },
    {
      id: "cs_ac2",
      tag: "⚡ UPCOMING BATCH",
      title: "JEE Mathematics Problem Solving 360°",
      subtitle: "Calculus • Algebra • Geometry • Previous 15 Yrs Papers",
      date: "Starts 1st Sept 2026",
      image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=500&q=80",
      cardBg: "#EBF5FF"
    }
  ],
  govt: [
    {
      id: "cs_gv1",
      tag: "⏳ LAUNCHING SOON",
      title: "UPSC Answer Writing & CSAT Masterclass",
      subtitle: "GS Papers 1-4 • Daily Answer Practice • Evaluation",
      date: "Starts 25th Aug 2026",
      image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=500&q=80",
      cardBg: "#FFF8EC"
    },
    {
      id: "cs_gv2",
      tag: "⚡ UPCOMING BATCH",
      title: "SSC CGL Tier II Complete Selection Batch",
      subtitle: "Maths • English • Computer Knowledge • Speed Mocks",
      date: "Starts 5th Sept 2026",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=500&q=80",
      cardBg: "#EBF5FF"
    }
  ],
  career: [
    {
      id: "cs_cr1",
      tag: "⏳ LAUNCHING SOON",
      title: "Full Stack Placement Track (Assured Drives)",
      subtitle: "Frontend • Backend • Mock Interviews • Hiring Partners",
      date: "Starts 10th Sept 2026",
      image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=500&q=80",
      cardBg: "#EBF5FF"
    }
  ]
};

const categoryDetails = {
  inform: {
    id: "inform",
    badge: "🔥 MOST POPULAR BATCHES 2026",
    badgeBg: "#EEECFE",
    badgeColor: "#5B3CF5",
    title: "TCM One Inform Tech",
    subtitle: "Full Stack Web Dev, Python, AI/ML & DevOps",
    categoryKey: "TCM Information Tech",
    icon: "play",
    iconBg: "#EEECFE",
    iconColor: "#5B3CF5",
    heroImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000",
    tickerText: "🔥 TCM ONE INFORM TECH: Live Interactive Batches 2026 • Full Stack MERN • DevOps & K8s • System Design • 100% Placement Guidance • Daily Live Doubt Clearance",
    banners: [
      {
        id: "b_inf1",
        tag: "🔴 LIVE BATCH 2026",
        title: "Full Stack MERN\nMastery Batch",
        subtitle: "React • Node.js • Express • MongoDB • Redux",
        buttonText: "Explore Batch →",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80",
        cardBg: "#F0EDFF",
        borderColor: "#E5E1FF"
      },
      {
        id: "b_inf2",
        tag: "⚡ DEVOPS & CLOUD",
        title: "Docker, K8s &\nAWS Masterclass",
        subtitle: "CI/CD • Kubernetes • Terraform • Microservices",
        buttonText: "Join DevOps →",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
        cardBg: "#EBF5FF",
        borderColor: "#D6EAFF"
      },
      {
        id: "b_inf3",
        tag: "🚀 SYSTEM DESIGN",
        title: "System Design &\nArchitecture",
        subtitle: "HLD • LLD • Scalable Backend • Redis • Kafka",
        buttonText: "Learn Design →",
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
        cardBg: "#F6F4FF",
        borderColor: "#EBE5FF"
      }
    ],
    courses: [
      {
        id: "inf_1",
        title: "Full Stack MERN Developer 2026",
        tags: "React, Node.js, Express, MongoDB, Redux",
        rating: "4.9",
        reviews: "1.4K",
        lessons: "36 Live Classes",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=500&q=80"
      },
      {
        id: "inf_2",
        title: "DevOps, Docker & Kubernetes Masterclass",
        tags: "Docker, K8s, CI/CD, AWS, Terraform",
        rating: "4.8",
        reviews: "920",
        lessons: "28 Lessons",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80"
      },
      {
        id: "inf_3",
        title: "System Design & Microservices",
        tags: "HLD, LLD, Scalable Backend, Redis, Kafka",
        rating: "4.9",
        reviews: "1.2K",
        lessons: "30 Lessons",
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=500&q=80"
      },
      {
        id: "inf_4",
        title: "DSA in Java & C++ (Zero to Hero)",
        tags: "Trees, Graphs, DP, Dynamic Programming",
        rating: "4.9",
        reviews: "1.8K",
        lessons: "42 Lessons",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=500&q=80"
      }
    ],
    mentors: [
      {
        id: "m1",
        name: "Rahul Dev",
        role: "Senior Tech Lead @ TCM",
        exp: "8+ Yrs Exp",
        rating: "4.9",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "m3",
        name: "Aman Verma",
        role: "Frontend Architect",
        exp: "7+ Yrs Exp",
        rating: "4.8",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
      }
    ]
  },

  academy: {
    id: "academy",
    badge: "ACADEMIC EXCELLENCE",
    badgeBg: "#EAF7EC",
    badgeColor: "#2E7D32",
    title: "TCM One Academy",
    subtitle: "NEET, JEE Main & Advanced, Board Exams & Specialized Academic Batches",
    icon: "school",
    iconBg: "#EAF7EC",
    iconColor: "#2E7D32",
    tickerText: "TCM ONE ACADEMY: NEET Ultimate Crash Course 2026 • JEE Main & Advanced Rank Booster • Class 12th Board Exam Topper Batch • 5000+ MCQs & Mock Tests",
    banners: [
      {
        id: "b_ac1",
        tag: "NEET 2026 LIVE",
        title: "NEET Ultimate\nCrash Course 2026",
        subtitle: "Physics • Chemistry • Biology • 5000+ MCQs & Mock Tests",
        buttonText: "Join NEET Batch →",
        image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
        cardBg: "#EAF7EC",
        borderColor: "#D2EBD5"
      },
      {
        id: "b_ac2",
        tag: "JEE MAIN & ADV",
        title: "JEE Rank Booster\nBatch 2026",
        subtitle: "Advanced Maths • Physics • Organic Chemistry • IITian Mentors",
        buttonText: "Enroll for JEE →",
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80",
        cardBg: "#EBF5FF",
        borderColor: "#D6EAFF"
      },
      {
        id: "b_ac3",
        tag: "BOARD TOPPER",
        title: "Class 12th Board\nPhysics & Maths",
        subtitle: "NCERT Complete Coverage • 10-Yr Solved Papers",
        buttonText: "Start Learning →",
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
        cardBg: "#FFF8EC",
        borderColor: "#FEE8C6"
      }
    ],
    courses: [
      {
        id: "ac_1",
        title: "NEET Ultimate Crash Course 2026",
        tags: "Physics, Chemistry, Biology, 5000+ MCQs",
        rating: "4.9",
        reviews: "3.2K",
        lessons: "50 Live Classes",
        image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=500&q=80"
      },
      {
        id: "ac_2",
        title: "JEE Main & Advanced Rank Booster",
        tags: "Advanced Maths, Physics, Organic Chem",
        rating: "4.9",
        reviews: "2.8K",
        lessons: "45 Live Classes",
        image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=500&q=80"
      },
      {
        id: "ac_3",
        title: "Class 12th Board Exam Topper Batch",
        tags: "NCERT Complete Coverage, Sample Papers",
        rating: "4.8",
        reviews: "1.9K",
        lessons: "32 Lessons",
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=500&q=80"
      },
      {
        id: "ac_4",
        title: "Foundation Science for Class 9th & 10th",
        tags: "Physics, Chemistry, Biology Foundations",
        rating: "4.7",
        reviews: "1.1K",
        lessons: "25 Lessons",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=500&q=80"
      }
    ],
    mentors: [
      {
        id: "m_neet",
        name: "Dr. Aakash Verma",
        role: "NEET Specialist & Biology HOD",
        exp: "10+ Yrs Exp",
        rating: "4.9",
        avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "m_jee",
        name: "Prof. Vikram Sharma",
        role: "IITian • JEE Physics Expert",
        exp: "12+ Yrs Exp",
        rating: "4.9",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80"
      }
    ]
  },

  govt: {
    id: "govt",
    badge: "GOVT EXAM PREP",
    badgeBg: "#FFF8EC",
    badgeColor: "#E7A900",
    title: "TCM One Government",
    subtitle: "UPSC Civil Services, SSC CGL & CHSL, Banking, Railways & Govt Competition Exams",
    icon: "bank",
    iconBg: "#FFF8EC",
    iconColor: "#E7A900",
    tickerText: "TCM ONE GOVERNMENT: UPSC CSE 2026 Foundation Batch • SSC CGL Tier I & II Complete Course • IBPS PO / SBI PO Banking Special • Railway RRB NTPC • Daily Current Affairs & Mock Tests",
    banners: [
      {
        id: "b_gv1",
        tag: "UPSC CSE 2026",
        title: "UPSC Civil Services\nTarget 2026",
        subtitle: "GS Paper I-IV • CSAT • Essay Writing • Optional Subjects",
        buttonText: "Join UPSC Batch →",
        image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80",
        cardBg: "#FFF8EC",
        borderColor: "#FEE8C6"
      },
      {
        id: "b_gv2",
        tag: "SSC CGL & CHSL",
        title: "SSC CGL Complete\nSelection Batch 2026",
        subtitle: "Quantitative Aptitude • Reasoning • English • General Awareness",
        buttonText: "Enroll for SSC →",
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
        cardBg: "#EBF5FF",
        borderColor: "#D6EAFF"
      },
      {
        id: "b_gv3",
        tag: "BANKING & RAILWAYS",
        title: "SBI PO & IBPS\nBanking Special",
        subtitle: "Data Interpretation • Puzzles • Financial Awareness • Mock Tests",
        buttonText: "Start Prep →",
        image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
        cardBg: "#EAF7EC",
        borderColor: "#D2EBD5"
      }
    ],
    courses: [
      {
        id: "gv_1",
        title: "UPSC Civil Services IAS/IPS Foundation 2026",
        tags: "GS 1-4, CSAT, Daily Current Affairs & Answer Writing",
        rating: "4.9",
        id: "gv_2",
        title: "SSC CGL & CHSL Complete Target Batch",
        tags: "Quant, Reasoning, English, General Awareness",
        rating: "4.9",
        reviews: "3.8K",
        lessons: "50 Live Classes",
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=500&q=80"
      },
      {
        id: "gv_3",
        title: "Bank PO (SBI PO & IBPS PO) Masterclass",
        tags: "Advanced Puzzles, DI, Banking Awareness, Mocks",
        rating: "4.8",
        reviews: "2.9K",
        lessons: "40 Live Classes",
        image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=500&q=80"
      },
      {
        id: "gv_4",
        title: "Railway RRB NTPC & Group D Crash Course",
        tags: "General Science, Mathematics, Reasoning",
        rating: "4.7",
        reviews: "2.1K",
        lessons: "30 Lessons",
        image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=500&q=80"
      }
    ],
    mentors: [
      {
        id: "m_upsc",
        name: "Dr. Rajeshwar Sen",
        role: "Ex-IAS • UPSC Polity & Mains HOD",
        exp: "15+ Yrs Exp",
        rating: "4.9",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "m_bank",
        name: "Vikramaditya Singh",
        role: "Ex-Bank Manager • Quant Expert",
        exp: "11+ Yrs Exp",
        rating: "4.9",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
      }
    ]
  },
  guide: {
    id: "govt",
    badge: "🏛️ GOVT EXAM PREP",
    badgeBg: "#FFF8EC",
    badgeColor: "#E7A900",
    title: "TCM One Government",
    subtitle: "UPSC Civil Services, SSC CGL & CHSL, Banking, Railways & Govt Competition Exams",
    icon: "bank",
    iconBg: "#FFF8EC",
    iconColor: "#E7A900",
    tickerText: "🏛️ TCM ONE GOVERNMENT: UPSC CSE 2026 Foundation Batch • SSC CGL Tier I & II Complete Course • IBPS PO / SBI PO Banking Special • Railway RRB NTPC • Daily Current Affairs & Mock Tests",
    banners: [
      {
        id: "b_gv1",
        tag: "🏛️ UPSC CSE 2026",
        title: "UPSC Civil Services\nTarget 2026",
        subtitle: "GS Paper I-IV • CSAT • Essay Writing • Optional Subjects",
        buttonText: "Join UPSC Batch →",
        image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80",
        cardBg: "#FFF8EC",
        borderColor: "#FEE8C6"
      }
    ],
    courses: [
      {
        id: "gv_1",
        title: "UPSC Civil Services IAS/IPS Foundation 2026",
        tags: "GS 1-4, CSAT, Daily Current Affairs & Answer Writing",
        rating: "4.9",
        reviews: "4.2K",
        lessons: "60 Live Classes",
        image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=500&q=80"
      }
    ],
    mentors: [
      {
        id: "m_upsc",
        name: "Dr. Rajeshwar Sen",
        role: "Ex-IAS • UPSC Polity & Mains HOD",
        exp: "15+ Yrs Exp",
        rating: "4.9",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
      }
    ]
  },

  career: {
    id: "career",
    badge: "🔵 PLACEMENT & INTERNSHIP HUB",
    badgeBg: "#EBF5FF",
    badgeColor: "#2F79B9",
    title: "TCM One Career",
    subtitle: "Internships, Direct Job Openings, Off-Campus Drives & Placement Guarantee",
    icon: "briefcase",
    iconBg: "#EBF5FF",
    iconColor: "#2F79B9",
    tickerText: "🔵 TCM ONE CAREER: TCM One Placement Guarantee Batch (Assured 5+ Interviews, CTC ₹6-18 LPA) • Remote React Internships • Direct Job Referrals to 150+ Hiring Partners",
    banners: [
      {
        id: "b_cr1",
        tag: "💼 PLACEMENT GUARANTEE",
        title: "TCM Placement\nGuarantee Batch",
        subtitle: "Assured 5+ Tech Interviews • CTC ₹6-18 LPA • Top MNCs",
        buttonText: "Apply Now →",
        image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=600&q=80",
        cardBg: "#EBF5FF",
        borderColor: "#D6EAFF"
      },
      {
        id: "b_cr2",
        tag: "🌐 REMOTE INTERNSHIP",
        title: "React Frontend\nDeveloper Intern",
        subtitle: "3 Months • Stipend ₹25,000/mo • PPO Opportunity",
        buttonText: "Apply Intern →",
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
        cardBg: "#F0EDFF",
        borderColor: "#E5E1FF"
      },
      {
        id: "b_cr3",
        tag: "🚀 DIRECT HIRING",
        title: "Backend Node.js\nSoftware Engineer",
        subtitle: "Full-Time • Bangalore • CTC ₹8-12 LPA • Hiring Now",
        buttonText: "View Jobs →",
        image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
        cardBg: "#EAF7EC",
        borderColor: "#D2EBD5"
      }
    ],
    courses: [
      {
        id: "cr_1",
        title: "TCM Placement Guarantee Batch 2026",
        tags: "Assured 5+ Interviews, CTC ₹6-18 LPA",
        rating: "4.9",
        reviews: "1.6K",
        lessons: "Full Bootcamp",
        image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=500&q=80"
      },
      {
        id: "cr_2",
        title: "Frontend React Developer Internship",
        tags: "Remote • Stipend ₹25,000/mo • 3 Months",
        rating: "4.8",
        reviews: "450 Applied",
        lessons: "Active Hiring",
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=500&q=80"
      },
      {
        id: "cr_3",
        title: "Backend Node.js Software Engineer",
        tags: "Full-Time • Bangalore • CTC ₹8-12 LPA",
        rating: "4.9",
        reviews: "320 Applied",
        lessons: "Hiring Now",
        image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=500&q=80"
      },
      {
        id: "cr_4",
        title: "Data Analyst & AI Intern Drive",
        tags: "Hybrid • Gurgaon • Stipend ₹20,000/mo",
        rating: "4.7",
        reviews: "600 Applied",
        lessons: "Off-Campus Drive",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80"
      }
    ],
    mentors: [
      {
        id: "m_hr",
        name: "Rohan Malhotra",
        role: "Head of Placements @ TCM",
        exp: "9+ Yrs Exp",
        rating: "4.9",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80"
      },
      {
        id: "m1",
        name: "Rahul Dev",
        role: "Technical Hiring Lead",
        exp: "8+ Yrs Exp",
        rating: "4.9",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
      }
    ]
  }
};

export default function ExploreTcmCategoryScreen({ session, categoryKey = "inform", onBack, onSelectCourse, onSelectUser }) {
  const { theme } = useTheme();
  const cat = categoryDetails[categoryKey] || categoryDetails.inform;
  const comingSoonList = comingSoonBatches[categoryKey] || comingSoonBatches.inform;
  const [realCourses, setRealCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Animated Ticker Marquee for moving header text
  const tickerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchCategoryRealCourses();
  }, [session?.token, categoryKey]);

  async function fetchCategoryRealCourses() {
    setLoadingCourses(true);
    try {
      const res = await getCategoryCourses(session?.token, categoryKey);
      if (res && Array.isArray(res.courses)) {
        setRealCourses(res.courses);
      } else {
        setRealCourses([]);
      }
    } catch (err) {
      setRealCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }

  useEffect(() => {
    tickerAnim.setValue(0);
    const animation = Animated.loop(
      Animated.timing(tickerAnim, {
        toValue: -width * 1.5,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );
    animation.start();
    return () => animation.stop();
  }, [categoryKey]);

  function handleScrollBanner(event) {
    const slide = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
    if (slide !== activeBannerIndex && slide >= 0 && slide < (cat.banners?.length || 1)) {
      setActiveBannerIndex(slide);
    }
  }

  const themedSurface = { backgroundColor: theme.cardBg, borderColor: theme.border };
  const themedSoftSurface = {
    backgroundColor: theme.isDark ? theme.inputBg || "#131927" : "#F8F7FF",
    borderColor: theme.border
  };
  const themedBadgeSurface = { backgroundColor: theme.badgeBg, borderColor: theme.border };
  const accentColor = theme.isDark ? theme.primaryDark || theme.primary : cat.iconColor;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. Top Header Bar with Moving Marquee Info Ticker */}
      <View style={[styles.topHeader, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.badgeBg }]}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </Pressable>

        <View style={styles.titleWrap}>
          <View style={[styles.badgePill, { backgroundColor: theme.isDark ? "#1E1B4B" : cat.badgeBg }]}>
            <Text style={[styles.badgeText, { color: theme.isDark ? "#A78BFA" : cat.badgeColor }]}>{cat.badge}</Text>
          </View>
          <Text style={[styles.screenTitle, { color: theme.text }]}>{cat.title}</Text>
        </View>

        <View style={[styles.categoryIconWrap, { backgroundColor: theme.isDark ? "#1E1B4B" : cat.iconBg }]}>
          <MaterialCommunityIcons name={cat.icon} size={22} color={theme.isDark ? "#A78BFA" : cat.iconColor} />
        </View>
      </View>

      {/* 🌟 Moving Text Header Announcement Ticker Bar */}
      <View style={[styles.tickerContainer, themedSurface]}>
        <View style={[styles.tickerBadge, { backgroundColor: theme.badgeBg }]}>
          <MaterialCommunityIcons name="bullhorn-outline" size={14} color={theme.primary} />
          <Text style={[styles.tickerBadgeText, { color: theme.primary }]}>INFO</Text>
        </View>
        <View style={styles.tickerClip}>
          <Animated.Text
            style={[
              styles.tickerText,
              {
                color: theme.subtext,
                transform: [{ translateX: tickerAnim }]
              }
            ]}
            numberOfLines={1}
          >
            {cat.tickerText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {cat.tickerText}
          </Animated.Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 2. Reused Hero Carousel Banner (Matching LearnScreen Design) */}
        {cat.banners && cat.banners.length > 0 ? (
          <View style={styles.bannerContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScrollBanner}
              scrollEventThrottle={16}
            >
              {cat.banners.map((banner) => (
                <View
                  key={banner.id}
                  style={[
                    styles.bannerCard,
                    theme.isDark ? themedSurface : { backgroundColor: banner.cardBg, borderColor: banner.borderColor }
                  ]}
                >
                  <View style={styles.bannerLeft}>
                    <View style={[styles.newBatchPill, theme.isDark ? themedBadgeSurface : { backgroundColor: cat.badgeBg }]}>
                      <Text style={[styles.newBatchText, { color: theme.isDark ? accentColor : cat.badgeColor }]}>{banner.tag}</Text>
                    </View>

                    <Text style={[styles.bannerTitle, { color: theme.text }]}>{banner.title}</Text>
                    <Text style={[styles.bannerSubtitle, { color: theme.subtext }]}>{banner.subtitle}</Text>

                    <Pressable
                      onPress={() => (onSelectCourse ? onSelectCourse(banner.id) : Alert.alert(banner.title.replace("\n", " "), "Opening specialized batch details..."))}
                      style={[styles.exploreBtn, { backgroundColor: theme.isDark ? theme.primary : cat.iconColor }]}
                    >
                      <Text style={styles.exploreBtnText}>{banner.buttonText}</Text>
                    </Pressable>
                  </View>

                  <View style={styles.bannerRight}>
                    <Image source={{ uri: banner.image }} style={styles.bannerGraphic} />
                    <View style={[styles.techBadgeReact, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                      <MaterialCommunityIcons name="star-decagram" size={18} color="#00D8FF" />
                    </View>
                    <View style={[styles.techBadgeNode, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                      <MaterialCommunityIcons name="lightning-bolt" size={18} color="#FFB800" />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Carousel Pagination Dots */}
            <View style={styles.dotsRow}>
              {cat.banners.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: theme.isDark ? "#334155" : "#C8C4E6" },
                    i === activeBannerIndex && [styles.activeDot, { backgroundColor: theme.isDark ? theme.primary : cat.iconColor }]
                  ]}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* 3. Specialized Courses Section - REAL DATA OR COMING SOON FALLBACK */}
        {realCourses.length > 0 ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Featured Real Courses & Batches</Text>
              <Text style={[styles.totalCountText, { color: theme.subtext }]}>{realCourses.length} Live Available</Text>
            </View>

            <View style={styles.coursesGrid}>
              {realCourses.map((course) => (
                <Pressable
                  key={course.id}
                  onPress={() => (onSelectCourse ? onSelectCourse(course.id) : Alert.alert(course.title, "Opening course details..."))}
                  style={({ pressed }) => [styles.courseCard, themedSurface, pressed && styles.pressed]}
                >
                  <Image source={{ uri: course.image }} style={styles.courseImage} />
                  <View style={styles.courseBody}>
                    <View style={styles.ratingRow}>
                      <FontAwesome name="star" size={12} color="#FFB800" />
                      <Text style={[styles.ratingText, { color: theme.text }]}>{course.rating}</Text>
                      <Text style={[styles.reviewsText, { color: theme.subtext }]}>({course.reviews})</Text>
                      <View style={[styles.lessonsBadge, { backgroundColor: theme.badgeBg }]}>
                        <Text style={[styles.lessonsText, { color: theme.primary }]}>{course.lessons}</Text>
                      </View>
                    </View>
                    <Text style={[styles.courseTitle, { color: theme.text }]} numberOfLines={2}>{course.title}</Text>
                    <Text style={[styles.courseTags, { color: theme.subtext }]} numberOfLines={1}>{course.tags}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Empty State Card when no mentor has uploaded courses in this category */}
            <View style={[styles.emptyCoursesCard, themedSoftSurface]}>
              <View style={[styles.emptyIconWrap, { backgroundColor: theme.badgeBg }]}>
                <MaterialCommunityIcons name="book-open-page-variant-outline" size={30} color={theme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Live Courses Published Yet</Text>
              <Text style={[styles.emptySub, { color: theme.subtext }]}>
                Mentors have not published live courses in {cat.title} yet. Pre-register for upcoming batches below or create a course if you are a mentor!
              </Text>
            </View>

            {/* Coming Soon & Pre-Registration Batches Carousel */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Batches & Coming Soon</Text>
              <Text style={[styles.totalCountText, { color: theme.subtext }]}>{comingSoonList.length} Upcoming</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
              {comingSoonList.map((batch) => (
                <View key={batch.id} style={[styles.comingSoonCard, theme.isDark ? themedSurface : { backgroundColor: batch.cardBg }]}>
                  <Image source={{ uri: batch.image }} style={styles.comingSoonImg} />
                  <View style={styles.comingSoonBody}>
                    <View style={[styles.comingSoonTagPill, { backgroundColor: theme.badgeBg }]}>
                      <Text style={[styles.comingSoonTagText, { color: theme.primary }]}>{batch.tag}</Text>
                    </View>
                    <Text numberOfLines={2} style={[styles.comingSoonTitle, { color: theme.text }]}>{batch.title}</Text>
                    <Text numberOfLines={1} style={[styles.comingSoonSub, { color: theme.subtext }]}>{batch.subtitle}</Text>
                    <Text style={styles.comingSoonDate}>📅 {batch.date}</Text>

                    <Pressable
                      onPress={() => Alert.alert("Pre-Registered! 🎉", `You will be notified immediately when a mentor launches "${batch.title.replace('\n', ' ')}" live!`)}
                      style={styles.notifyBtn}
                    >
                      <Feather name="bell" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                      <Text style={styles.notifyBtnText}>Notify Me / Pre-Register</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* 4. Dedicated Mentors Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Mentors & Advisors</Text>
          <Text style={[styles.totalCountText, { color: theme.subtext }]}>{cat.mentors.length} Mentors</Text>
        </View>

        <View style={styles.mentorsRow}>
          {cat.mentors.map((mentor) => (
            <Pressable
              key={mentor.id}
              onPress={() => (onSelectUser ? onSelectUser({ id: mentor.id, name: mentor.name, role: mentor.role }) : Alert.alert(mentor.name, mentor.role))}
              style={({ pressed }) => [styles.mentorCard, themedSurface, pressed && styles.pressed]}
            >
              <Image source={{ uri: mentor.avatar }} style={styles.mentorAvatar} />
              <View style={styles.mentorContent}>
                <Text style={[styles.mentorName, { color: theme.text }]}>{mentor.name}</Text>
                <Text style={[styles.mentorRole, { color: theme.subtext }]}>{mentor.role}</Text>
                <View style={styles.mentorMeta}>
                  <View style={styles.ratingRow}>
                    <FontAwesome name="star" size={11} color="#FFB800" />
                    <Text style={[styles.ratingText, { color: theme.text }]}>{mentor.rating}</Text>
                  </View>
                  <Text style={[styles.expText, { color: theme.primary }]}>{mentor.exp}</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color="#9E9EB2" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 0
  },

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center"
  },
  titleWrap: {
    flex: 1,
    marginLeft: 10
  },
  badgePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 9
  },
  screenTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725"
  },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },

  // Ticker Marquee Announcement Bar
  tickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  tickerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8
  },
  tickerBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    color: "#5B3CF5",
    marginLeft: 3
  },
  tickerClip: {
    flex: 1,
    overflow: "hidden"
  },
  tickerText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#4A4A6A",
    width: width * 2
  },

  scrollContent: {
    paddingBottom: 100
  },

  // Hero Carousel Banner (Reused LearnScreen Design System)
  bannerContainer: {
    marginBottom: 18
  },
  bannerCard: {
    width: width - 40,
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    ...shadow.medium
  },
  bannerLeft: {
    flex: 1.1,
    paddingRight: 8
  },
  newBatchPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8
  },
  newBatchText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.6
  },
  bannerTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#181725",
    lineHeight: 20,
    marginBottom: 4
  },
  bannerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#52506E",
    marginBottom: 14,
    lineHeight: 16
  },
  exploreBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    ...shadow.soft
  },
  exploreBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: "#FFFFFF"
  },

  bannerRight: {
    flex: 0.9,
    height: 125,
    position: "relative",
    alignItems: "center",
    justifyContent: "center"
  },
  bannerGraphic: {
    width: "100%",
    height: "100%",
    borderRadius: 14
  },
  techBadgeReact: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FFFFFF",
    padding: 5,
    borderRadius: 10,
    ...shadow.soft
  },
  techBadgeNode: {
    position: "absolute",
    bottom: -6,
    left: -6,
    backgroundColor: "#FFFFFF",
    padding: 5,
    borderRadius: 10,
    ...shadow.soft
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C8C4E6"
  },
  activeDot: {
    width: 18,
    backgroundColor: "#5B3CF5"
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 4
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#181725"
  },
  totalCountText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "#7C7C9A"
  },

  emptyCoursesCard: {
    backgroundColor: "#F8F7FF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEAFA",
    marginBottom: 16,
    ...shadow.soft
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEECFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#181725",
    marginBottom: 4,
    textAlign: "center"
  },
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    textAlign: "center",
    lineHeight: 16,
    maxWidth: "90%"
  },

  comingSoonCard: {
    width: 230,
    borderRadius: 18,
    overflow: "hidden",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E1FF",
    marginBottom: 16,
    ...shadow.soft
  },
  comingSoonImg: {
    width: "100%",
    height: 100
  },
  comingSoonBody: {
    padding: 12
  },
  comingSoonTagPill: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6
  },
  comingSoonTagText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "#5B3CF5"
  },
  comingSoonTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725",
    marginBottom: 4,
    lineHeight: 17
  },
  comingSoonSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#52506E",
    marginBottom: 6
  },
  comingSoonDate: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: "#7C7C9A",
    marginBottom: 10
  },
  notifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B3CF5",
    paddingVertical: 9,
    borderRadius: 10
  },
  notifyBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#FFFFFF"
  },

  coursesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 18
  },
  courseCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  courseImage: {
    width: "100%",
    height: 95
  },
  courseBody: {
    padding: 10
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4
  },
  ratingText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#181725",
    marginLeft: 3
  },
  reviewsText: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: "#7C7C9A",
    marginLeft: 2
  },
  lessonsBadge: {
    marginLeft: "auto",
    backgroundColor: "#F4F3FA",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4
  },
  lessonsText: {
    fontFamily: fonts.medium,
    fontSize: 8,
    color: "#5B3CF5"
  },
  courseTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725",
    lineHeight: 16,
    marginBottom: 2
  },
  courseTags: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A"
  },

  mentorsRow: {
    gap: 8,
    marginBottom: 20
  },
  mentorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  mentorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10
  },
  mentorContent: {
    flex: 1
  },
  mentorName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725"
  },
  mentorRole: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    marginTop: 1
  },
  mentorMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8
  },
  expText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: "#5B3CF5"
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  }
});
