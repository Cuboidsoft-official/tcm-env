import React from "react";
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export const DOMAIN_CATEGORIES = [
  { id: "All", label: "All Skills" },
  { id: "NEET", label: "NEET & Medical" },
  { id: "JEE", label: "JEE & Engineering" },
  { id: "Govt", label: "Govt Exams & UPSC" },
  { id: "Coding", label: "Coding & IT" },
  { id: "Business", label: "Business & Design" }
];

export const PRESET_SKILLS = [
  // Coding & IT
  { name: "JavaScript", strength: 88, category: "Coding" },
  { name: "React", strength: 92, category: "Coding" },
  { name: "Python", strength: 85, category: "Coding" },
  { name: "Data Structures & Algorithms", strength: 82, category: "Coding" },
  { name: "C++", strength: 80, category: "Coding" },
  { name: "Java", strength: 78, category: "Coding" },
  { name: "Node.js", strength: 84, category: "Coding" },
  { name: "SQL & Databases", strength: 86, category: "Coding" },
  { name: "System Design", strength: 75, category: "Coding" },
  { name: "AI & Machine Learning", strength: 70, category: "Coding" },

  // NEET & Medical
  { name: "Biology & Zoology", strength: 88, category: "NEET" },
  { name: "Organic Chemistry", strength: 82, category: "NEET" },
  { name: "Human Anatomy & Physiology", strength: 85, category: "NEET" },
  { name: "Physics for NEET", strength: 78, category: "NEET" },
  { name: "Biochemistry & Genetics", strength: 80, category: "NEET" },
  { name: "Botany & Plant Sciences", strength: 84, category: "NEET" },

  // JEE & Engineering
  { name: "Advanced Mathematics & Calculus", strength: 90, category: "JEE" },
  { name: "Physics & Mechanics", strength: 85, category: "JEE" },
  { name: "Physical Chemistry", strength: 82, category: "JEE" },
  { name: "Coordinate Geometry & Vectors", strength: 88, category: "JEE" },
  { name: "Thermodynamics & Optics", strength: 78, category: "JEE" },

  // Govt Exams & UPSC
  { name: "General Studies & History", strength: 85, category: "Govt" },
  { name: "Quantitative Aptitude", strength: 88, category: "Govt" },
  { name: "Logical Reasoning", strength: 90, category: "Govt" },
  { name: "Indian Polity & Constitution", strength: 82, category: "Govt" },
  { name: "Current Affairs & GK", strength: 86, category: "Govt" },
  { name: "English Comprehension", strength: 84, category: "Govt" },

  // Business & Design
  { name: "Figma & UI/UX Design", strength: 82, category: "Business" },
  { name: "Digital Marketing & SEO", strength: 80, category: "Business" },
  { name: "Business Analytics & Excel", strength: 85, category: "Business" },
  { name: "Financial Accounting", strength: 78, category: "Business" }
];

export function getSkillIconInfo(skillName = "") {
  const s = String(skillName).toLowerCase().trim();

  // NEET & Medical
  if (s.includes("biology") || s.includes("zoology") || s.includes("botany") || s.includes("genetics")) {
    return { library: "MaterialCommunityIcons", icon: "dna", color: "#059669", bg: "#D1FAE5", accent: "#10B981" };
  }
  if (s.includes("anatomy") || s.includes("physiology") || s.includes("medical") || s.includes("neet")) {
    return { library: "MaterialCommunityIcons", icon: "heart-pulse", color: "#E11D48", bg: "#FFE4E6", accent: "#F43F5E" };
  }
  if (s.includes("chemistry") || s.includes("organic") || s.includes("inorganic") || s.includes("biochem")) {
    return { library: "MaterialCommunityIcons", icon: "flask", color: "#7C3AED", bg: "#EDE9FE", accent: "#8B5CF6" };
  }

  // JEE & Engineering / Maths / Physics
  if (s.includes("math") || s.includes("calculus") || s.includes("geometry") || s.includes("algebra") || s.includes("vectors")) {
    return { library: "MaterialCommunityIcons", icon: "calculator", color: "#D97706", bg: "#FEF3C7", accent: "#F59E0B" };
  }
  if (s.includes("physics") || s.includes("mechanics") || s.includes("thermo") || s.includes("optics") || s.includes("jee")) {
    return { library: "MaterialCommunityIcons", icon: "atom", color: "#0284C7", bg: "#E0F2FE", accent: "#0EA5E9" };
  }

  // Government Exams & UPSC
  if (s.includes("polity") || s.includes("constitution") || s.includes("upsc") || s.includes("history") || s.includes("governance")) {
    return { library: "MaterialCommunityIcons", icon: "landmark", color: "#16A34A", bg: "#DCFCE7", accent: "#22C55E" };
  }
  if (s.includes("reasoning") || s.includes("aptitude") || s.includes("quant") || s.includes("logic")) {
    return { library: "MaterialCommunityIcons", icon: "brain", color: "#4F46E5", bg: "#EEF2FF", accent: "#6366F1" };
  }
  if (s.includes("current affairs") || s.includes("gk") || s.includes("news") || s.includes("general studies")) {
    return { library: "MaterialCommunityIcons", icon: "newspaper-variant", color: "#DC2626", bg: "#FEE2E2", accent: "#EF4444" };
  }
  if (s.includes("english") || s.includes("comprehension") || s.includes("grammar")) {
    return { library: "MaterialCommunityIcons", icon: "book-open-variant", color: "#0891B2", bg: "#CFFAFE", accent: "#06B6D4" };
  }

  // Coding & IT
  if (s.includes("react native")) {
    return { library: "MaterialCommunityIcons", icon: "react", color: "#0284C7", bg: "#E0F2FE", accent: "#0284C7" };
  }
  if (s.includes("react")) {
    return { library: "MaterialCommunityIcons", icon: "react", color: "#0EA5E9", bg: "#E0F2FE", accent: "#0EA5E9" };
  }
  if (s.includes("javascript") || s === "js") {
    return { library: "Ionicons", icon: "logo-javascript", color: "#D97706", bg: "#FEF3C7", accent: "#F59E0B" };
  }
  if (s.includes("typescript") || s === "ts") {
    return { library: "MaterialCommunityIcons", icon: "language-typescript", color: "#2563EB", bg: "#DBEAFE", accent: "#3B82F6" };
  }
  if (s.includes("python") || s.includes("data science")) {
    return { library: "Ionicons", icon: "logo-python", color: "#0284C7", bg: "#E0F2FE", accent: "#38BDF8" };
  }
  if (s.includes("node")) {
    return { library: "Ionicons", icon: "logo-nodejs", color: "#16A34A", bg: "#DCFCE7", accent: "#22C55E" };
  }
  if (s.includes("c++") || s.includes("cpp") || s === "c" || s.includes("c language") || s.includes("dsa") || s.includes("data structures")) {
    return { library: "MaterialCommunityIcons", icon: "language-cpp", color: "#1D4ED8", bg: "#DBEAFE", accent: "#3B82F6" };
  }
  if (s.includes("java") && !s.includes("script")) {
    return { library: "FontAwesome5", icon: "java", color: "#EA580C", bg: "#FFEDD5", accent: "#F97316" };
  }
  if (s.includes("html") || s.includes("web")) {
    return { library: "Ionicons", icon: "logo-html5", color: "#E11D48", bg: "#FFE4E6", accent: "#F43F5E" };
  }
  if (s.includes("css") || s.includes("tailwind")) {
    return { library: "Ionicons", icon: "logo-css3", color: "#0284C7", bg: "#E0F2FE", accent: "#38BDF8" };
  }
  if (s.includes("sql") || s.includes("mongo") || s.includes("database") || s.includes("postgres")) {
    return { library: "MaterialCommunityIcons", icon: "database", color: "#059669", bg: "#D1FAE5", accent: "#10B981" };
  }
  if (s.includes("git") || s.includes("github")) {
    return { library: "MaterialCommunityIcons", icon: "git", color: "#DC2626", bg: "#FEE2E2", accent: "#EF4444" };
  }
  if (s.includes("figma") || s.includes("design") || s.includes("ui") || s.includes("ux")) {
    return { library: "MaterialCommunityIcons", icon: "palette", color: "#7C3AED", bg: "#EDE9FE", accent: "#8B5CF6" };
  }
  if (s.includes("system") || s.includes("architecture")) {
    return { library: "MaterialCommunityIcons", icon: "sitemap", color: "#9333EA", bg: "#F3E8FF", accent: "#A855F7" };
  }
  if (s.includes("ai") || s.includes("machine learning") || s.includes("ml")) {
    return { library: "MaterialCommunityIcons", icon: "brain", color: "#9333EA", bg: "#F3E8FF", accent: "#C084FC" };
  }
  if (s.includes("marketing") || s.includes("business") || s.includes("seo") || s.includes("excel")) {
    return { library: "MaterialCommunityIcons", icon: "chart-bar", color: "#2563EB", bg: "#DBEAFE", accent: "#3B82F6" };
  }

  // Fallback icon for any subject or skill
  return { library: "Feather", icon: "award", color: "#0A6836", bg: "#E8F5E9", accent: "#10B981" };
}

export function renderSkillIcon(iconInfo, size = 18, customStyle = {}) {
  const { library, icon, color } = iconInfo;
  if (library === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={icon} size={size} color={color} style={customStyle} />;
  }
  if (library === "Ionicons") {
    return <Ionicons name={icon} size={size} color={color} style={customStyle} />;
  }
  if (library === "FontAwesome5") {
    return <FontAwesome5 name={icon} size={size} color={color} style={customStyle} />;
  }
  return <Feather name={icon || "award"} size={size} color={color} style={customStyle} />;
}

export function getSkillLevel(strength = 0) {
  const val = Number(strength) || 0;
  if (val >= 85) return { title: "Expert", color: "#059669", bg: "#D1FAE5" };
  if (val >= 70) return { title: "Advanced", color: "#2563EB", bg: "#DBEAFE" };
  if (val >= 50) return { title: "Intermediate", color: "#D97706", bg: "#FEF3C7" };
  return { title: "Beginner", color: "#64748B", bg: "#F1F5F9" };
}

export function getSkillsAutocompleteSuggestions(query = "") {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  return PRESET_SKILLS.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6);
}
