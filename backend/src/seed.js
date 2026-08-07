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

console.log("Seeded TCM starter data (dummy posts removed)");
process.exit(0);

console.log("Seeded TCM starter data");
process.exit(0);
