import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { connectDatabase } from "./config/db.js";
import { createVisualSeedData } from "./data/visualSeed.js";
import { CommunityPost } from "./models/CommunityPost.js";
import { Mentor } from "./models/Mentor.js";
import { Story } from "./models/Story.js";
import { User } from "./models/User.js";

dotenv.config();

function withoutMemoryId(item) {
  const { _id, ...payload } = item;
  return payload;
}

try {
  await connectDatabase();
} catch (error) {
  console.warn("MongoDB seed skipped: database is not reachable from this machine.");
  console.warn("Start the backend to use the in-memory visual seed data for development.");
  process.exit(0);
}

await User.deleteMany({});
await Mentor.deleteMany({});
await Story.deleteMany({});
await CommunityPost.deleteMany({});

const passwordHash = await bcrypt.hash("password123", 12);
const seed = createVisualSeedData(passwordHash);

await User.create(withoutMemoryId(seed.user));
await Mentor.insertMany(seed.mentors.map(withoutMemoryId));
await Story.insertMany(seed.stories.map(withoutMemoryId));
await CommunityPost.insertMany(seed.posts.map(withoutMemoryId));

console.log("Seeded TCM starter data");
process.exit(0);

await User.create({
  name: "Aayushman",
  email: "student@tcm.com",
  passwordHash,
  role: "student",
  avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
  progress: 70
});

await Mentor.insertMany([
  {
    name: "Ankit Sharma",
    title: "Full Stack Developer",
    rating: 4.8,
    learners: 1200,
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80",
    skills: ["React", "Node.js", "MongoDB"]
  },
  {
    name: "Priya Verma",
    title: "Data Science Expert",
    rating: 4.9,
    learners: 980,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    skills: ["Python", "ML", "Analytics"]
  },
  {
    name: "Rohit Singh",
    title: "DSA & System Design",
    rating: 4.7,
    learners: 750,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
    skills: ["DSA", "Java", "System Design"]
  }
]);

await Story.insertMany([
  {
    name: "UPSC",
    icon: "bank",
    iconColor: "#41415F",
    backgroundColor: "#FFF1E8",
    ringColors: ["#FF465F", "#FF9B54"],
    order: 1
  },
  {
    name: "JEE",
    icon: "school",
    iconColor: "#17143C",
    backgroundColor: "#F6F4FF",
    ringColors: ["#5B3CF5", "#8E74FF"],
    order: 2
  },
  {
    name: "NEET",
    icon: "stethoscope",
    iconColor: "#17143C",
    backgroundColor: "#FFF7FB",
    ringColors: ["#F72D96", "#FE74BD"],
    order: 3
  },
  {
    name: "Coding",
    icon: "code-tags",
    iconColor: "#FFFFFF",
    backgroundColor: "#17143C",
    ringColors: ["#00A6A6", "#5B3CF5"],
    order: 4
  },
  {
    name: "AI",
    icon: "robot-happy-outline",
    iconColor: "#FFFFFF",
    backgroundColor: "#34315E",
    ringColors: ["#1595FF", "#FF5A52"],
    order: 5
  },
  {
    name: "Design",
    icon: "palette",
    iconColor: "#FFFFFF",
    backgroundColor: "#C94872",
    ringColors: ["#FF2D75", "#FF9B54"],
    order: 6
  }
]);

await CommunityPost.insertMany([
  {
    authorName: "Ankit Sharma",
    authorRole: "Java Developer & Mentor",
    authorAvatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80",
    verified: true,
    category: "Coding",
    text: "5 Java mistakes every developer makes.\nAvoid these if you want to level up as a developer.",
    media: {
      kind: "video",
      label: "Coding Tips",
      labelIcon: "code-tags",
      title: "5\nJAVA\nMISTAKES",
      subtitle: "EVERY DEVELOPER\nMAKES",
      duration: "0:58"
    },
    metrics: {
      likes: 248,
      comments: 42,
      shares: 18
    },
    tags: ["#Java", "#Programming", "#TCM", "#CodingTips"],
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    authorName: "Priya Verma",
    authorRole: "UPSC Aspirant",
    authorAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    verified: true,
    category: "UPSC",
    text: "Polity Revision Notes - Fundamental Rights\nIndian Constitution - Important for Prelims & Mains",
    media: {
      kind: "notes",
      label: "UPSC Notes",
      labelIcon: "file-document-outline",
      title: "Fundamental Rights",
      subtitle: "Handwritten Notes.pdf",
      fileName: "Fundamental Rights Handwritten Notes.pdf",
      fileSize: "3.4 MB",
      imageUrl: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=480&q=80"
    },
    metrics: {
      likes: 315,
      comments: 27,
      shares: 31
    },
    tags: ["#UPSC", "#Polity", "#Notes", "#Revision"],
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    authorName: "Rahul Singh",
    authorRole: "Full Stack Developer",
    authorAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
    verified: true,
    category: "Web Dev",
    text: "Just finished my Portfolio Website.\nBuilt using Next.js & Tailwind CSS.",
    media: {
      kind: "showcase",
      label: "Project Showcase",
      labelIcon: "laptop",
      title: "Hi, I'm Rahul",
      subtitle: "Full Stack Developer",
      imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=960&q=80"
    },
    metrics: {
      likes: 314,
      comments: 76,
      shares: 29
    },
    tags: ["#Nextjs", "#TailwindCSS", "#Portfolio"],
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
  }
]);

console.log("Seeded TCM starter data");
process.exit(0);
