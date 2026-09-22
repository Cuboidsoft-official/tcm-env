import "dotenv/config";
import { isDeepStrictEqual } from "node:util";
import mongoose from "mongoose";

const uri = process.env.MIGRATION_MONGO_URI;
const baselineDatabase = process.env.MIGRATION_BASELINE_DATABASE;
if (!uri) throw new Error("Missing MIGRATION_MONGO_URI");
if (!baselineDatabase) throw new Error("Missing MIGRATION_BASELINE_DATABASE");

await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
const targetDb = mongoose.connection.db;
const baselineDb = mongoose.connection.client.db(baselineDatabase);
if (targetDb.databaseName === baselineDb.databaseName) {
  await mongoose.disconnect();
  throw new Error("Target and baseline databases must be different");
}

const collections = (await baselineDb.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name);
const missing = [];
const changed = [];
const allowedUserFields = new Set(["legacyIds", "sourceSystems", "migrationBatchId", "schemaVersion", "migrationMergePolicy"]);
const baselineSubset = (baseline, target, topLevel = true) => {
  for (const [key, value] of Object.entries(baseline)) {
    if (topLevel && allowedUserFields.has(key)) continue;
    const targetValue = target?.[key];
    const nestedObject = value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date) && value._bsontype === undefined;
    if (nestedObject ? !baselineSubset(value, targetValue, false) : !isDeepStrictEqual(value, targetValue)) return false;
  }
  return true;
};

let compared = 0;
for (const collection of collections) {
  for await (const baseline of baselineDb.collection(collection).find()) {
    const target = await targetDb.collection(collection).findOne({ _id: baseline._id });
    compared += 1;
    if (!target) { missing.push({ collection, id: String(baseline._id) }); continue; }
    let equal;
    if (collection === "users") equal = baselineSubset(baseline, target);
    else if (collection === "pushtokens" && target.invalidationReason === "missing_user_after_migration") {
      const { invalidatedAt, invalidationReason, migrationBatchId, ...preservedTarget } = target;
      equal = isDeepStrictEqual(baseline, preservedTarget);
    } else equal = isDeepStrictEqual(baseline, target);
    if (!equal) changed.push({ collection, id: String(baseline._id) });
  }
}

const passed = missing.length === 0 && changed.length === 0;
console.log(JSON.stringify({ baselineDatabase, targetDatabase: targetDb.databaseName, collections: collections.length, compared, missing, changed, passed }, null, 2));
await mongoose.disconnect();
if (!passed) process.exitCode = 1;
