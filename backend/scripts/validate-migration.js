import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MIGRATION_MONGO_URI;
if (!uri) throw new Error("Missing MIGRATION_MONGO_URI");

await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
const db = mongoose.connection.db;
const database = mongoose.connection.name;
const productionDatabase = process.env.MIGRATION_PRODUCTION_DATABASE || "tcm_ac";
if (database === productionDatabase && process.env.MIGRATION_CONFIRM_PRODUCTION !== "YES") {
  await mongoose.disconnect();
  throw new Error(`Refusing production validation without MIGRATION_CONFIRM_PRODUCTION=YES: ${database}`);
}

const expected = process.env.MIGRATION_EXPECTED_COUNTS_JSON ? JSON.parse(process.env.MIGRATION_EXPECTED_COUNTS_JSON) : {};
const counts = {};
const countMismatches = [];
for (const [collection, expectedCount] of Object.entries(expected)) {
  counts[collection] = await db.collection(collection).countDocuments();
  if (counts[collection] !== Number(expectedCount)) countMismatches.push({ collection, expected: Number(expectedCount), actual: counts[collection] });
}

const collectionNames = (await db.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name);
const duplicateLegacyIdentities = [];
for (const collection of collectionNames) {
  const legacyIdentity = collection === "enrollments"
    ? { mysql: "$legacyIds.mysql", enrollmentType: "$enrollmentType" }
    : "$legacyIds.mysql";
  const duplicateCount = (await db.collection(collection).aggregate([
    { $match: { sourceSystem: "thecodemunk-hostinger", "legacyIds.mysql": { $exists: true } } },
    { $group: { _id: legacyIdentity, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: "count" }
  ]).toArray())[0]?.count || 0;
  if (duplicateCount) duplicateLegacyIdentities.push({ collection, duplicateCount });
}

const orphanCount = async (collection, localField, foreignCollection) => {
  if (!collectionNames.includes(collection) || !collectionNames.includes(foreignCollection)) return 0;
  return (await db.collection(collection).aggregate([
    { $match: { [localField]: { $ne: null } } },
    { $lookup: { from: foreignCollection, localField, foreignField: "_id", as: "target" } },
    { $match: { target: { $size: 0 } } },
    { $count: "count" }
  ]).toArray())[0]?.count || 0;
};
const orphanStringUserIdCount = async (collection) => {
  if (!collectionNames.includes(collection) || !collectionNames.includes("users")) return 0;
  return (await db.collection(collection).aggregate([
    { $match: { userId: { $ne: null }, invalidatedAt: { $exists: false } } },
    { $lookup: {
      from: "users", let: { ownerId: { $toString: "$userId" } },
      pipeline: [{ $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$ownerId"] } } }], as: "target"
    } },
    { $match: { target: { $size: 0 } } },
    { $count: "count" }
  ]).toArray())[0]?.count || 0;
};

const orphanReferences = {
  enrollmentUsers: await orphanCount("enrollments", "userId", "users"),
  enrollmentCourses: await orphanCount("enrollments", "courseId", "courses"),
  enrollmentPrograms: await orphanCount("enrollments", "programId", "programs"),
  progressUsers: await orphanCount("learningprogresses", "userId", "users"),
  progressCourses: await orphanCount("learningprogresses", "courseId", "courses"),
  paymentUsers: await orphanCount("payments", "userId", "users"),
  notificationUsers: await orphanCount("notifications", "userId", "users"),
  pushTokenUsers: await orphanStringUserIdCount("pushtokens"),
  walletTransactionWallets: await orphanCount("wallettransactions", "walletId", "wallets")
};

const walletReconciliation = [];
if (collectionNames.includes("wallets") && collectionNames.includes("wallettransactions")) {
  for (const wallet of await db.collection("wallets").find().toArray()) {
    const latest = await db.collection("wallettransactions").find({ walletId: wallet._id }).sort({ createdAt: -1 }).limit(1).next();
    if (latest && Number(latest.balanceAfter) !== Number(wallet.balance)) {
      walletReconciliation.push({ walletId: String(wallet._id), walletBalance: wallet.balance, latestLedgerBalance: latest.balanceAfter });
    }
  }
}

const passed = countMismatches.length === 0 && duplicateLegacyIdentities.length === 0 &&
  Object.values(orphanReferences).every((count) => count === 0) && walletReconciliation.length === 0;
console.log(JSON.stringify({ database, counts, countMismatches, duplicateLegacyIdentities, orphanReferences, walletReconciliation, passed }, null, 2));
await mongoose.disconnect();
if (!passed) process.exitCode = 1;
