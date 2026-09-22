import "dotenv/config";
import crypto from "node:crypto";
import mysql from "mysql2/promise";
import mongoose from "mongoose";

/**
 * TCM MySQL -> Mongo migration runner.
 * Safe default: inventory/dry-run only. Writes require MIGRATION_MODE=staging
 * or MIGRATION_MODE=production. Production additionally requires
 * MIGRATION_CONFIRM_PRODUCTION=YES.
 */

const mode = process.env.MIGRATION_MODE || "dry-run";
const batchId = process.env.MIGRATION_BATCH_ID || `mysql-${new Date().toISOString().replace(/[-:.TZ]/g, "")}`;
const sourceSystem = "thecodemunk-hostinger";
if (!["dry-run", "staging", "production"].includes(mode)) throw new Error(`Unsupported MIGRATION_MODE: ${mode}`);
if (mode === "production" && process.env.MIGRATION_CONFIRM_PRODUCTION !== "YES") {
  throw new Error("Production migration requires MIGRATION_CONFIRM_PRODUCTION=YES");
}
const sourceConfig = {
  host: process.env.MIGRATION_MYSQL_HOST || process.env.DB_HOST,
  port: Number(process.env.MIGRATION_MYSQL_PORT || process.env.DB_PORT || 3306),
  database: process.env.MIGRATION_MYSQL_DATABASE || process.env.DB_DATABASE,
  user: process.env.MIGRATION_MYSQL_USER || process.env.DB_USERNAME,
  password: process.env.MIGRATION_MYSQL_PASSWORD || process.env.DB_PASSWORD
};
for (const [key, value] of Object.entries(sourceConfig)) {
  if (value === undefined || value === "") throw new Error(`Missing MySQL source setting: ${key}`);
}
if (!process.env.MIGRATION_MONGO_URI) throw new Error("Missing MIGRATION_MONGO_URI");

const mysqlPool = mysql.createPool({
  ...sourceConfig,
  waitForConnections: true,
  connectionLimit: 2,
  charset: "utf8mb4"
});
await mongoose.connect(process.env.MIGRATION_MONGO_URI, { serverSelectionTimeoutMS: 10000 });
const targetDatabase = mongoose.connection.name;
const productionDatabase = process.env.MIGRATION_PRODUCTION_DATABASE || "tcm_ac";
if (mode === "staging" && targetDatabase === productionDatabase) {
  throw new Error(`Refusing staging migration into production database: ${targetDatabase}`);
}
const db = mongoose.connection.db;
const now = new Date();
const report = { batchId, mode, sourceSystem, targetDatabase, startedAt: now.toISOString(), source: {}, writes: {}, identityMatches: [], conflicts: [] };
async function ensureMigrationIndexes() {
  const legacyIndex = async (collection, extraKeys = {}) => db.collection(collection).createIndex(
    { "legacyIds.mysql": 1, sourceSystem: 1, ...extraKeys },
    { unique: true, partialFilterExpression: { "legacyIds.mysql": { $type: "number" } } }
  );
  const standardCollections = [
    "categories", "courses", "programs", "learningprogresses", "payments", "orders", "withdrawals", "wallets", "wallettransactions",
    "leads", "leadforms", "contactmessages", "newslettersubscribers", "events", "eventregistrations", "livesessions", "liveclasslinks",
    "applications", "portfolioprojects", "portfolioskills", "portfolioachievements", "notifications", "pushtokens", "dailytasks",
    "cmsposts", "testimonials", "certificates", "coursereviews", "legacychatgroups", "legacychatgroupmembers", "legacychatmessages",
    "helprequests", "peercookies"
  ];
  await db.collection("users").createIndex({ "legacyIds.mysql": 1 }, { unique: true, sparse: true });
  for (const collection of standardCollections) await legacyIndex(collection);
  await legacyIndex("enrollments", { enrollmentType: 1 });
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("pushtokens").createIndex({ token: 1 }, { unique: true });
  await db.collection("appsettings").createIndex({ key: 1 }, { unique: true });
  await db.collection("wallets").createIndex({ userId: 1 }, { unique: true });
  await db.collection("learningprogresses").createIndex({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });
  await db.collection("eventregistrations").createIndex({ eventId: 1, userId: 1 }, { unique: true });
  await db.collection("applications").createIndex({ userId: 1, programId: 1 }, { unique: true });
}
if (mode !== "dry-run") {
  await ensureMigrationIndexes();
  report.indexesEnsured = true;
}
if (mode !== "dry-run") {
  await db.collection("migrationbatches").updateOne(
    { batchId },
    { $set: { batchId, mode, sourceSystem, sourceSnapshot: process.env.MIGRATION_SOURCE_SNAPSHOT || "live", status: "running", startedAt: now, updatedAt: now } },
    { upsert: true }
  );
}

const safeTable = (table) => table.replace(/[^a-zA-Z0-9_]/g, "");
const sourceRows = async (table) => {
  const [rows] = await mysqlPool.query(`SELECT * FROM \`${safeTable(table)}\``);
  return rows;
};
const sourceCount = async (table) => {
  const [[row]] = await mysqlPool.query(`SELECT COUNT(*) AS count FROM \`${safeTable(table)}\``);
  return Number(row.count);
};
const legacy = (id) => ({ mysql: Number(id) });
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const privateFingerprint = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
const normalizeDate = (value) => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};
const splitList = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
const parseJson = (value, fallback = null) => {
  if (value == null || value === "") return fallback;
  try { return typeof value === "string" ? JSON.parse(value) : value; }
  catch { return fallback; }
};
const migrated = (sourceId) => ({
  legacyIds: legacy(sourceId), sourceSystem, migrationBatchId: batchId, schemaVersion: 1
});
const addConflict = (entity, sourceId, reason, details = {}) => {
  report.conflicts.push({ entity, sourceId: Number(sourceId), reason, ...details });
};
async function upsertLegacy(collectionName, sourceId, document) {
  if (mode === "dry-run") return { planned: 1, upserted: 0 };
  await db.collection(collectionName).updateOne(
    { sourceSystem, "legacyIds.mysql": Number(sourceId) },
    { $set: document },
    { upsert: true }
  );
  return { planned: 0, upserted: 1 };
}

let sourceUsersCache;
const targetUserCache = new Map();
const targetCourseCache = new Map();
const targetProgramCache = new Map();
const targetEventCache = new Map();
async function sourceUsersById() {
  if (!sourceUsersCache) sourceUsersCache = new Map((await sourceRows("users")).map((row) => [Number(row.id), row]));
  return sourceUsersCache;
}

async function targetUserFor(mysqlUserId) {
  const sourceId = Number(mysqlUserId);
  if (targetUserCache.has(sourceId)) return targetUserCache.get(sourceId);
  const sourceUser = (await sourceUsersById()).get(Number(mysqlUserId));
  if (!sourceUser) return null;
  const user = await db.collection("users").findOne({
    $or: [
      { "legacyIds.mysql": sourceId },
      { email: normalizeEmail(sourceUser.email) }
    ]
  });
  targetUserCache.set(sourceId, user);
  return user;
}

async function targetCourseFor(mysqlCourseId) {
  const sourceId = Number(mysqlCourseId);
  if (!targetCourseCache.has(sourceId)) targetCourseCache.set(sourceId, await db.collection("courses").findOne({ "legacyIds.mysql": sourceId }));
  return targetCourseCache.get(sourceId);
}

async function targetProgramFor(mysqlProgramId) {
  const sourceId = Number(mysqlProgramId);
  if (!targetProgramCache.has(sourceId)) targetProgramCache.set(sourceId, await db.collection("programs").findOne({ "legacyIds.mysql": sourceId }));
  return targetProgramCache.get(sourceId);
}

async function targetEventFor(mysqlEventId) {
  const sourceId = Number(mysqlEventId);
  if (!targetEventCache.has(sourceId)) targetEventCache.set(sourceId, await db.collection("events").findOne({ "legacyIds.mysql": sourceId }));
  return targetEventCache.get(sourceId);
}

async function inventoryTable(table) {
  try { report.source[table] = await sourceCount(table); }
  catch (error) { report.source[table] = { unavailable: error.code || error.message }; }
}

async function migrateUsers() {
  const rows = await sourceRows("users");
  const collection = db.collection("users");
  let inserted = 0, matched = 0, conflicts = 0;
  for (const row of rows) {
    const sourceId = Number(row.id);
    const email = normalizeEmail(row.email);
    if (!email) {
      conflicts += 1;
      report.conflicts.push({ entity: "user", sourceId, reason: "missing_email" });
      continue;
    }
    const existingByLegacy = await collection.findOne({ "legacyIds.mysql": sourceId });
    const existingByEmail = email ? await collection.findOne({ email }) : null;
    if (existingByLegacy && existingByEmail && String(existingByLegacy._id) !== String(existingByEmail._id)) {
      conflicts += 1;
      report.conflicts.push({ entity: "user", sourceId, reason: "legacy_and_email_match_different_users", emailFingerprint: privateFingerprint(email) });
      continue;
    }
    const preserveTarget = existingByLegacy && (
      existingByLegacy.migrationMergePolicy === "preserve_target" || existingByLegacy.sourceSystems?.includes("app")
    );
    if ((existingByEmail && !existingByLegacy) || preserveTarget) {
      const targetUser = existingByLegacy || existingByEmail;
      report.identityMatches.push({ entity: "user", sourceId, match: existingByLegacy ? "linked_legacy_id" : "normalized_email", emailFingerprint: privateFingerprint(email), targetId: String(targetUser._id) });
      if (mode !== "dry-run") {
        await collection.updateOne(
          { _id: targetUser._id },
          {
            $set: { "legacyIds.mysql": sourceId, migrationBatchId: batchId, schemaVersion: 1, migrationMergePolicy: "preserve_target" },
            $addToSet: { sourceSystems: sourceSystem }
          }
        );
      }
      matched += 1;
      continue;
    }
    if (mode === "dry-run") {
      if (existingByLegacy) matched += 1; else inserted += 1;
      continue;
    }
    const document = {
      name: String(row.name || "Student").trim(), email, passwordHash: row.password_hash,
      role: row.role || "student", isApproved: row.status ? row.status === "active" : true,
      contactNumber: row.phone || row.contact_number || "", referralCode: row.referral_id || undefined,
      avatarUrl: row.avatar || undefined, verified: Boolean(row.email_verified), onboarded: Boolean(row.onboarded),
      studentId: row.student_id || undefined, lastLoginAt: normalizeDate(row.last_login_at),
      referredBy: row.referral_code || "", legacyIds: legacy(sourceId), sourceSystem,
      sourceSystems: [sourceSystem],
      migrationBatchId: batchId, schemaVersion: 1,
      migrationMergePolicy: "source_owned",
      createdAt: normalizeDate(row.created_at) || now,
      updatedAt: normalizeDate(row.updated_at) || normalizeDate(row.created_at) || now
    };
    const filter = existingByLegacy ? { _id: existingByLegacy._id } : { "legacyIds.mysql": sourceId };
    const result = await collection.updateOne(filter, { $set: document }, { upsert: true });
    if (result.upsertedCount) inserted += 1; else matched += 1;
  }
  report.writes.users = { inserted, matched, conflicts };
}

async function migrateCourses() {
  const [categories, courses, modules, lessons] = await Promise.all([sourceRows("categories"), sourceRows("courses"), sourceRows("course_modules"), sourceRows("course_lessons")]);
  const categoryById = new Map(categories.map((row) => [Number(row.id), row]));
  const modulesByCourse = new Map();
  const moduleById = new Map();
  for (const row of modules) {
    const module = { id: `mysql-module-${row.id}`, legacyIds: legacy(row.id), title: row.title || row.name || "Untitled module", summary: row.summary || "", order: Number(row.position ?? 0), lessons: [] };
    const list = modulesByCourse.get(Number(row.course_id)) || [];
    list.push(module); modulesByCourse.set(Number(row.course_id), list); moduleById.set(Number(row.id), module);
  }
  for (const row of lessons) {
    const module = moduleById.get(Number(row.module_id));
    if (module) module.lessons.push({ id: `mysql-lesson-${row.id}`, legacyIds: legacy(row.id), title: row.title || "Untitled lesson", type: row.type || "reading", durationMinutes: row.duration_minutes == null ? undefined : Number(row.duration_minutes), order: Number(row.position ?? 0), isPreview: Boolean(row.is_preview) });
  }
  const collection = db.collection("courses");
  let inserted = 0, matched = 0;
  for (const row of courses) {
    const sourceId = Number(row.id);
    const category = categoryById.get(Number(row.category_id));
    const document = {
      customId: `mysql-course-${sourceId}`, title: row.title || row.name || "Untitled course",
      slug: row.slug, subtitle: row.subtitle || row.description || "", description: row.description || "",
      category: category?.name || "General", categoryId: category ? `mysql-category-${category.id}` : undefined,
      level: row.level || "All Levels", price: row.price == null ? undefined : `₹${row.price}`,
      originalPrice: row.original_price == null ? undefined : `₹${row.original_price}`,
      duration: row.duration || "", imageUrl: row.thumbnail || undefined, language: row.language || undefined,
      rating: Number(row.rating || 0), reviewsCount: String(row.reviews_count || 0), studentsCount: String(row.students_count || 0),
      certificate: Boolean(row.certificate), publicationStatus: row.status || "draft",
      totalSeats: Number(row.total_seats || 0), seatsLeft: Number(row.seats_left || 0), seatsFilled: Number(row.seats_filled || 0),
      schedule: row.schedule || "", startsAt: normalizeDate(row.starts_at),
      isFeatured: Boolean(row.is_featured), isBestseller: Boolean(row.is_bestseller),
      modules: (modulesByCourse.get(sourceId) || []).sort((a, b) => a.order - b.order).map((module) => ({ ...module, lessons: module.lessons.sort((a, b) => a.order - b.order) })),
      legacyIds: legacy(sourceId), sourceSystem, migrationBatchId: batchId, schemaVersion: 1,
      createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.updated_at) || normalizeDate(row.created_at) || now
    };
    const existing = await collection.findOne({ "legacyIds.mysql": sourceId });
    if (mode === "dry-run") { if (existing) matched += 1; else inserted += 1; continue; }
    const result = await collection.updateOne({ "legacyIds.mysql": sourceId }, { $set: document }, { upsert: true });
    if (result.upsertedCount) inserted += 1; else matched += 1;
  }
  report.writes.courses = { inserted, matched, sourceModules: modules.length, sourceLessons: lessons.length };
}

async function migrateProfiles() {
  const rows = await sourceRows("student_profiles");
  let planned = 0, updated = 0, unresolved = 0;
  for (const row of rows) {
    const sourceUser = (await sourceUsersById()).get(Number(row.user_id));
    if (!sourceUser) {
      unresolved += 1;
      report.conflicts.push({ entity: "student_profile", sourceId: Number(row.user_id), reason: "missing_source_user" });
      continue;
    }
    if (mode === "dry-run") { planned += 1; continue; }
    const targetUser = await targetUserFor(row.user_id);
    if (!targetUser) { unresolved += 1; continue; }
    const sourceProfile = {
      headline: row.headline || "", bio: row.bio || "", location: row.location || "",
      college: row.college || "", graduationYear: row.graduation_year || undefined,
      experienceLevel: row.experience_level || "beginner", goal: row.goal || "",
      githubUrl: row.github_url || "", linkedinUrl: row.linkedin_url || "",
      websiteUrl: row.website_url || "", twitterUrl: row.twitter_url || "", banner: row.banner || ""
    };
    const profileUpdates = {};
    for (const [field, value] of Object.entries(sourceProfile)) {
      const existingValue = targetUser.profile?.[field];
      if (value !== undefined && (existingValue === undefined || existingValue === null || existingValue === "")) profileUpdates[`profile.${field}`] = value;
    }
    await db.collection("users").updateOne(
      { _id: targetUser._id },
      { $set: { ...profileUpdates, migrationBatchId: batchId } }
    );
    updated += 1;
  }
  report.writes.studentProfiles = { planned, updated, unresolvedReferences: unresolved };
}

async function migrateEnrollments() {
  const rows = await sourceRows("enrollments");
  const sourceUsers = await sourceUsersById();
  const sourceCourses = new Set((await sourceRows("courses")).map((row) => Number(row.id)));
  let planned = 0, upserted = 0, unresolved = 0;
  for (const row of rows) {
    if (!sourceUsers.has(Number(row.user_id)) || !sourceCourses.has(Number(row.course_id))) { unresolved += 1; continue; }
    if (mode === "dry-run") { planned += 1; continue; }
    const [user, course] = await Promise.all([targetUserFor(row.user_id), targetCourseFor(row.course_id)]);
    if (!user || !course) { unresolved += 1; continue; }
    await db.collection("enrollments").updateOne(
      { sourceSystem, "legacyIds.mysql": Number(row.id), enrollmentType: "course" },
      { $set: {
        userId: user._id, courseId: course._id, legacyIds: legacy(row.id), sourceSystem, enrollmentType: "course",
        status: row.status || "active", progressPercent: Number(row.progress || 0),
        enrolledAt: normalizeDate(row.enrolled_at), completedAt: normalizeDate(row.completed_at),
        sourceOrderLegacyId: row.order_id == null ? undefined : Number(row.order_id),
        migrationBatchId: batchId, schemaVersion: 1
      }, $unset: { programId: "" } },
      { upsert: true }
    );
    upserted += 1;
  }
  report.writes.enrollments = { planned, upserted, unresolvedReferences: unresolved };
}

async function migrateLearningProgress() {
  const [rows, lessons, modules] = await Promise.all([sourceRows("lesson_progress"), sourceRows("course_lessons"), sourceRows("course_modules")]);
  const lessonById = new Map(lessons.map((row) => [Number(row.id), row]));
  const moduleById = new Map(modules.map((row) => [Number(row.id), row]));
  const sourceUsers = await sourceUsersById();
  let planned = 0, upserted = 0, unresolved = 0;
  for (const row of rows) {
    const lesson = lessonById.get(Number(row.lesson_id));
    const module = lesson && moduleById.get(Number(lesson.module_id));
    if (!sourceUsers.has(Number(row.user_id)) || !lesson || !module) { unresolved += 1; continue; }
    if (mode === "dry-run") { planned += 1; continue; }
    const [user, course] = await Promise.all([targetUserFor(row.user_id), targetCourseFor(module.course_id)]);
    if (!user || !course) { unresolved += 1; continue; }
    await db.collection("learningprogresses").updateOne(
      { userId: user._id, courseId: course._id, lessonId: `mysql-lesson-${lesson.id}` },
      { $set: {
        userId: user._id, courseId: course._id, lessonId: `mysql-lesson-${lesson.id}`,
        legacyIds: legacy(row.id), status: row.completed ? "completed" : "in_progress",
        progressPercent: row.completed ? 100 : 0, completedAt: normalizeDate(row.completed_at),
        sourceSystem, migrationBatchId: batchId, schemaVersion: 1
      } },
      { upsert: true }
    );
    upserted += 1;
  }
  report.writes.learningProgress = { planned, upserted, unresolvedReferences: unresolved };
}

async function migratePayments() {
  const rows = await sourceRows("payment_submissions");
  const sourceUsers = await sourceUsersById();
  let planned = 0, upserted = 0, unresolved = 0;
  for (const row of rows) {
    if (!sourceUsers.has(Number(row.user_id))) {
      unresolved += 1;
      report.conflicts.push({ entity: "payment", sourceId: Number(row.id), reason: "missing_source_user", sourceUserId: Number(row.user_id) });
      continue;
    }
    if (mode === "dry-run") { planned += 1; continue; }
    const user = await targetUserFor(row.user_id);
    if (!user) { unresolved += 1; continue; }
    await db.collection("payments").updateOne(
      { sourceSystem, "legacyIds.mysql": Number(row.id) },
      { $set: {
        userId: user._id, legacyIds: legacy(row.id), sourceSystem,
        itemType: row.item_type, itemLegacyId: Number(row.item_id), itemTitle: row.item_title,
        amount: Number(row.amount), currency: "INR", method: row.payment_method,
        paymentDate: normalizeDate(row.payment_date), transactionReference: row.transaction_ref || undefined,
        evidencePath: row.screenshot || undefined, referralCode: row.referral_code || undefined,
        referrerLegacyId: row.referrer_id == null ? undefined : Number(row.referrer_id),
        status: row.status, adminNote: row.admin_note || "", receiptNumber: row.receipt_number || undefined,
        reviewedAt: normalizeDate(row.reviewed_at), createdAt: normalizeDate(row.created_at) || now,
        updatedAt: normalizeDate(row.updated_at) || normalizeDate(row.created_at) || now,
        migrationBatchId: batchId, schemaVersion: 1
      } },
      { upsert: true }
    );
    upserted += 1;
  }
  report.writes.payments = { planned, upserted, unresolvedReferences: unresolved };
}

async function migrateWallets() {
  const [walletRows, transactionRows] = await Promise.all([sourceRows("wallets"), sourceRows("wallet_transactions")]);
  const sourceUsers = await sourceUsersById();
  let plannedWallets = 0, upsertedWallets = 0, plannedTransactions = 0, upsertedTransactions = 0, unresolved = 0;
  for (const row of walletRows) {
    if (!sourceUsers.has(Number(row.user_id))) { unresolved += 1; continue; }
    if (mode === "dry-run") { plannedWallets += 1; continue; }
    const user = await targetUserFor(row.user_id);
    if (!user) { unresolved += 1; continue; }
    await db.collection("wallets").updateOne(
      { userId: user._id },
      { $set: { userId: user._id, legacyIds: legacy(row.id), currency: "INR", balance: Number(row.balance), sourceSystem, migrationBatchId: batchId, schemaVersion: 1, createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.updated_at) || now } },
      { upsert: true }
    );
    upsertedWallets += 1;
  }
  for (const row of transactionRows) {
    if (!sourceUsers.has(Number(row.user_id))) { unresolved += 1; continue; }
    if (mode === "dry-run") { plannedTransactions += 1; continue; }
    const user = await targetUserFor(row.user_id);
    const wallet = user && await db.collection("wallets").findOne({ userId: user._id });
    if (!user || !wallet) { unresolved += 1; continue; }
    await db.collection("wallettransactions").updateOne(
      { sourceSystem, "legacyIds.mysql": Number(row.id) },
      { $set: {
        walletId: wallet._id, userId: user._id, legacyIds: legacy(row.id), sourceSystem,
        type: row.type, amount: Number(row.amount), balanceAfter: Number(row.balance_after),
        description: row.description, referenceId: row.ref_id || undefined,
        idempotencyKey: `${sourceSystem}:wallet_transaction:${row.id}`,
        migrationBatchId: batchId, schemaVersion: 1, createdAt: normalizeDate(row.created_at) || now
      } },
      { upsert: true }
    );
    upsertedTransactions += 1;
  }
  report.writes.wallets = { planned: plannedWallets, upserted: upsertedWallets };
  report.writes.walletTransactions = { planned: plannedTransactions, upserted: upsertedTransactions, unresolvedReferences: unresolved };
}

async function migrateCatalogAndPrograms() {
  const [categoryRows, programRows, programCourseRows, programEnrollmentRows] = await Promise.all([
    sourceRows("categories"), sourceRows("programs"), sourceRows("program_courses"), sourceRows("program_enrollments")
  ]);
  let categoryPlanned = 0, categoryUpserted = 0;
  for (const row of categoryRows) {
    const result = await upsertLegacy("categories", row.id, {
      ...migrated(row.id), name: row.name, slug: row.slug, description: row.description || "", icon: row.icon || "",
      audience: row.audience || "general", sortOrder: Number(row.sort_order || 0), status: row.status || "active",
      createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.created_at) || now
    });
    categoryPlanned += result.planned; categoryUpserted += result.upserted;
  }
  const courseIdsByProgram = new Map();
  for (const row of programCourseRows) {
    const list = courseIdsByProgram.get(Number(row.program_id)) || [];
    list.push(Number(row.course_id)); courseIdsByProgram.set(Number(row.program_id), list);
  }
  let programPlanned = 0, programUpserted = 0, unresolvedCourses = 0;
  for (const row of programRows) {
    let courseIds = [];
    if (mode !== "dry-run") {
      const courseTargets = await Promise.all((courseIdsByProgram.get(Number(row.id)) || []).map(targetCourseFor));
      unresolvedCourses += courseTargets.filter((course) => !course).length;
      courseIds = courseTargets.filter(Boolean).map((course) => course._id);
    }
    const result = await upsertLegacy("programs", row.id, {
      ...migrated(row.id), title: row.title, slug: row.slug, subtitle: row.subtitle || "", description: row.description || "",
      type: row.type, icon: row.icon || "", thumbnail: row.thumbnail || "", level: row.level, mode: row.mode,
      duration: row.duration || "", schedule: row.schedule || "", price: Number(row.price || 0),
      originalPrice: row.original_price == null ? undefined : Number(row.original_price), totalSeats: Number(row.total_seats || 0),
      seatsLeft: Number(row.seats_left || 0), highlights: String(row.highlights || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      startDate: normalizeDate(row.start_date), endDate: normalizeDate(row.end_date), isFeatured: Boolean(row.is_featured),
      publicationStatus: row.status || "draft", courseIds,
      createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.updated_at) || normalizeDate(row.created_at) || now
    });
    programPlanned += result.planned; programUpserted += result.upserted;
  }
  const sourceUsers = await sourceUsersById();
  const sourcePrograms = new Set(programRows.map((row) => Number(row.id)));
  let enrollmentPlanned = 0, enrollmentUpserted = 0, unresolvedEnrollments = 0;
  for (const row of programEnrollmentRows) {
    if (!sourceUsers.has(Number(row.user_id)) || !sourcePrograms.has(Number(row.program_id))) {
      unresolvedEnrollments += 1; addConflict("program_enrollment", row.id, "missing_source_reference"); continue;
    }
    if (mode === "dry-run") { enrollmentPlanned += 1; continue; }
    const [user, program] = await Promise.all([targetUserFor(row.user_id), targetProgramFor(row.program_id)]);
    if (!user || !program) { unresolvedEnrollments += 1; continue; }
    await db.collection("enrollments").updateOne(
      { sourceSystem, "legacyIds.mysql": Number(row.id), enrollmentType: "program" },
      { $set: { ...migrated(row.id), enrollmentType: "program", userId: user._id, programId: program._id, status: row.status, enrolledAt: normalizeDate(row.enrolled_at), updatedAt: normalizeDate(row.enrolled_at) || now }, $unset: { courseId: "" } },
      { upsert: true }
    );
    enrollmentUpserted += 1;
  }
  report.writes.categories = { planned: categoryPlanned, upserted: categoryUpserted };
  report.writes.programs = { planned: programPlanned, upserted: programUpserted, sourceCourseLinks: programCourseRows.length, unresolvedCourseLinks: unresolvedCourses };
  report.writes.programEnrollments = { planned: enrollmentPlanned, upserted: enrollmentUpserted, unresolvedReferences: unresolvedEnrollments };
}

async function migrateCommerce() {
  const [orderRows, withdrawalRows] = await Promise.all([sourceRows("orders"), sourceRows("withdrawal_requests")]);
  const sourceUsers = await sourceUsersById();
  let orderPlanned = 0, orderUpserted = 0, withdrawalPlanned = 0, withdrawalUpserted = 0, unresolved = 0;
  for (const row of orderRows) {
    if (!sourceUsers.has(Number(row.user_id))) { unresolved += 1; addConflict("order", row.id, "missing_source_user", { sourceUserId: Number(row.user_id) }); continue; }
    if (mode === "dry-run") { orderPlanned += 1; continue; }
    const user = await targetUserFor(row.user_id);
    if (!user) { unresolved += 1; continue; }
    const result = await upsertLegacy("orders", row.id, {
      ...migrated(row.id), userId: user._id, orderNumber: row.order_number, itemType: row.item_type, itemLegacyId: Number(row.item_id),
      itemTitle: row.item_title || "", amount: Number(row.amount || 0), currency: row.currency || "INR", status: row.status,
      paymentMethod: row.payment_method || "", paymentReference: row.payment_ref || "",
      createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.updated_at) || normalizeDate(row.created_at) || now
    });
    orderUpserted += result.upserted;
  }
  for (const row of withdrawalRows) {
    if (!sourceUsers.has(Number(row.user_id))) { unresolved += 1; addConflict("withdrawal", row.id, "missing_source_user", { sourceUserId: Number(row.user_id) }); continue; }
    if (mode === "dry-run") { withdrawalPlanned += 1; continue; }
    const user = await targetUserFor(row.user_id);
    if (!user) { unresolved += 1; continue; }
    const result = await upsertLegacy("withdrawals", row.id, {
      ...migrated(row.id), userId: user._id, amount: Number(row.amount || 0), currency: "INR", payoutMethod: "upi",
      payoutDestination: row.upi_id, status: row.status, adminNote: row.admin_note || "", processedAt: normalizeDate(row.processed_at),
      createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.processed_at) || normalizeDate(row.created_at) || now
    });
    withdrawalUpserted += result.upserted;
  }
  report.writes.orders = { planned: orderPlanned, upserted: orderUpserted };
  report.writes.withdrawals = { planned: withdrawalPlanned, upserted: withdrawalUpserted, unresolvedReferences: unresolved };
}

async function migrateLeadsAndInbound() {
  const [leadRows, formRows, contactRows, subscriberRows] = await Promise.all([
    sourceRows("leads"), sourceRows("lead_forms"), sourceRows("contact_messages"), sourceRows("newsletter_subscribers")
  ]);
  let leadPlanned = 0, leadUpserted = 0, unresolvedUsers = 0;
  for (const row of leadRows) {
    let userId;
    if (row.user_id != null && mode !== "dry-run") {
      const user = await targetUserFor(row.user_id);
      if (user) userId = user._id; else { unresolvedUsers += 1; addConflict("lead", row.id, "missing_source_user", { sourceUserId: Number(row.user_id) }); }
    }
    const result = await upsertLegacy("leads", row.id, {
      ...migrated(row.id), userId, name: row.name, email: normalizeEmail(row.email) || undefined, phone: row.phone || "",
      interestType: row.interest_type, interestLegacyId: row.interest_id == null ? undefined : Number(row.interest_id), interestTitle: row.interest_title || "",
      message: row.message || "", acquisitionSource: row.source || "website", status: row.status, whatsappSent: Boolean(row.whatsapp_sent),
      createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.updated_at) || normalizeDate(row.created_at) || now
    });
    leadPlanned += result.planned; leadUpserted += result.upserted;
  }
  let formPlanned = 0, formUpserted = 0;
  for (const row of formRows) {
    let createdBy;
    if (row.created_by != null && mode !== "dry-run") createdBy = (await targetUserFor(row.created_by))?._id;
    const result = await upsertLegacy("leadforms", row.id, {
      ...migrated(row.id), title: row.title, slug: row.slug, description: row.description || "", contextType: row.context_type,
      contextLegacyId: row.context_id == null ? undefined : Number(row.context_id), contextTitle: row.context_title || "",
      fields: parseJson(row.fields_json, []), ctaText: row.cta_text, whatsappRedirect: Boolean(row.whatsapp_redirect),
      thankYouMessage: row.thank_you_message || "", status: row.status, views: Number(row.views || 0), submissions: Number(row.submissions || 0), createdBy,
      createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.updated_at) || normalizeDate(row.created_at) || now
    });
    formPlanned += result.planned; formUpserted += result.upserted;
  }
  for (const row of contactRows) await upsertLegacy("contactmessages", row.id, {
    ...migrated(row.id), name: row.name, email: normalizeEmail(row.email), subject: row.subject || "", message: row.message, status: row.status,
    createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.created_at) || now
  });
  for (const row of subscriberRows) await upsertLegacy("newslettersubscribers", row.id, {
    ...migrated(row.id), email: normalizeEmail(row.email), subscribedAt: normalizeDate(row.created_at) || now, createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.created_at) || now
  });
  report.writes.leads = { planned: leadPlanned, upserted: leadUpserted, unresolvedUsers };
  report.writes.leadForms = { planned: formPlanned, upserted: formUpserted };
  report.writes.contactMessages = { planned: mode === "dry-run" ? contactRows.length : 0, upserted: mode === "dry-run" ? 0 : contactRows.length };
  report.writes.newsletterSubscribers = { planned: mode === "dry-run" ? subscriberRows.length : 0, upserted: mode === "dry-run" ? 0 : subscriberRows.length };
}

async function migrateEventsAndSessions() {
  const [eventRows, registrationRows, sessionRows, linkRows] = await Promise.all([
    sourceRows("events"), sourceRows("event_registrations"), sourceRows("live_sessions"), sourceRows("live_class_links")
  ]);
  let eventPlanned = 0, eventUpserted = 0;
  for (const row of eventRows) {
    let instructorId;
    if (row.instructor_id != null && mode !== "dry-run") instructorId = (await targetUserFor(row.instructor_id))?._id;
    const result = await upsertLegacy("events", row.id, {
      ...migrated(row.id), instructorId, title: row.title, slug: row.slug, description: row.description || "", category: row.category,
      accessType: row.type, status: row.status, price: Number(row.price || 0), eventDate: normalizeDate(row.event_date), eventTime: row.event_time || "",
      mode: row.mode, location: row.location || "", banner: row.banner || "", totalSeats: Number(row.total_seats || 0),
      seatsFilled: Number(row.seats_filled || 0), recordingUrl: row.recording_url || "",
      createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.updated_at) || normalizeDate(row.created_at) || now
    });
    eventPlanned += result.planned; eventUpserted += result.upserted;
  }
  let registrationPlanned = 0, registrationUpserted = 0, unresolved = 0;
  for (const row of registrationRows) {
    if (mode === "dry-run") { registrationPlanned += 1; continue; }
    const [event, user] = await Promise.all([targetEventFor(row.event_id), targetUserFor(row.user_id)]);
    if (!event || !user) { unresolved += 1; addConflict("event_registration", row.id, "missing_source_reference"); continue; }
    await upsertLegacy("eventregistrations", row.id, {
      ...migrated(row.id), eventId: event._id, userId: user._id, status: row.status, registeredAt: normalizeDate(row.registered_at),
      createdAt: normalizeDate(row.registered_at) || now, updatedAt: normalizeDate(row.registered_at) || now
    });
    registrationUpserted += 1;
  }
  let sessionPlanned = 0, sessionUpserted = 0;
  for (const row of sessionRows) {
    let programId, courseId;
    if (mode !== "dry-run") {
      if (row.program_id != null) programId = (await targetProgramFor(row.program_id))?._id;
      if (row.course_id != null) courseId = (await targetCourseFor(row.course_id))?._id;
    }
    const result = await upsertLegacy("livesessions", row.id, {
      ...migrated(row.id), programId, courseId, title: row.title, description: row.description || "", host: row.host || "",
      sessionDate: normalizeDate(row.session_date), startTime: row.start_time || "", endTime: row.end_time || "",
      meetingUrl: row.meeting_url || "", recordingUrl: row.recording_url || "", status: row.status,
      createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.created_at) || now
    });
    sessionPlanned += result.planned; sessionUpserted += result.upserted;
  }
  for (const row of linkRows) {
    let sentBy;
    if (mode !== "dry-run") sentBy = (await targetUserFor(row.sent_by))?._id;
    await upsertLegacy("liveclasslinks", row.id, {
      ...migrated(row.id), title: row.title, meetingUrl: row.meeting_url, description: row.description || "", target: row.target,
      targetLegacyId: row.target_id == null ? undefined : Number(row.target_id), scheduledAt: normalizeDate(row.scheduled_at),
      recipientCount: Number(row.recipient_count || 0), sentBy, createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.created_at) || now
    });
  }
  report.writes.events = { planned: eventPlanned, upserted: eventUpserted };
  report.writes.eventRegistrations = { planned: registrationPlanned, upserted: registrationUpserted, unresolvedReferences: unresolved };
  report.writes.liveSessions = { planned: sessionPlanned, upserted: sessionUpserted };
  report.writes.liveClassLinks = { planned: mode === "dry-run" ? linkRows.length : 0, upserted: mode === "dry-run" ? 0 : linkRows.length };
}

async function migrateApplicationsAndPortfolios() {
  const [applicationRows, projectRows, skillRows, achievementRows] = await Promise.all([
    sourceRows("internship_applications"), sourceRows("portfolio_projects"), sourceRows("portfolio_skills"), sourceRows("portfolio_achievements")
  ]);
  let applicationsPlanned = 0, applicationsUpserted = 0, unresolved = 0;
  for (const row of applicationRows) {
    if (mode === "dry-run") { applicationsPlanned += 1; continue; }
    const [user, program] = await Promise.all([targetUserFor(row.user_id), targetProgramFor(row.program_id)]);
    if (!user || !program) { unresolved += 1; addConflict("application", row.id, "missing_source_reference"); continue; }
    await upsertLegacy("applications", row.id, {
      ...migrated(row.id), userId: user._id, programId: program._id, fullName: row.full_name, email: normalizeEmail(row.email),
      phone: row.phone || "", college: row.college || "", skills: splitList(row.skills), motivation: row.why || "",
      portfolioUrl: row.portfolio_url || "", resumePath: row.resume_file || "", status: row.status, notes: row.notes || "",
      reviewedAt: normalizeDate(row.reviewed_at), createdAt: normalizeDate(row.created_at) || now,
      updatedAt: normalizeDate(row.updated_at) || normalizeDate(row.created_at) || now
    });
    applicationsUpserted += 1;
  }
  const migrateOwned = async (rows, entity, collection, transform) => {
    let planned = 0, upserted = 0, missing = 0;
    for (const row of rows) {
      if (mode === "dry-run") { planned += 1; continue; }
      const user = await targetUserFor(row.user_id);
      if (!user) { missing += 1; addConflict(entity, row.id, "missing_source_user", { sourceUserId: Number(row.user_id) }); continue; }
      await upsertLegacy(collection, row.id, {
        ...migrated(row.id), userId: user._id, ...transform(row), createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.created_at) || now
      });
      upserted += 1;
    }
    return { planned, upserted, unresolvedReferences: missing };
  };
  report.writes.applications = { planned: applicationsPlanned, upserted: applicationsUpserted, unresolvedReferences: unresolved };
  report.writes.portfolioProjects = await migrateOwned(projectRows, "portfolio_project", "portfolioprojects", (row) => ({
    title: row.title, description: row.description || "", techStack: splitList(row.tech_stack), repositoryUrl: row.repo_url || "",
    liveUrl: row.live_url || "", image: row.image || "", isFeatured: Boolean(row.is_featured), sortOrder: Number(row.sort_order || 0)
  }));
  report.writes.portfolioSkills = await migrateOwned(skillRows, "portfolio_skill", "portfolioskills", (row) => ({ name: row.name, level: Number(row.level || 0) }));
  report.writes.portfolioAchievements = await migrateOwned(achievementRows, "portfolio_achievement", "portfolioachievements", (row) => ({
    title: row.title, issuer: row.issuer || "", description: row.description || "", evidenceUrl: row.url || "", achievedOn: normalizeDate(row.achieved_on)
  }));
}

async function migrateEngagement() {
  const [notificationRows, tokenRows, taskRows] = await Promise.all([sourceRows("notifications"), sourceRows("fcm_tokens"), sourceRows("daily_tasks")]);
  const migrateUserRows = async (rows, entity, collection, transform) => {
    let planned = 0, upserted = 0, unresolved = 0;
    const operations = [];
    for (const row of rows) {
      if (mode === "dry-run") { planned += 1; continue; }
      const user = await targetUserFor(row.user_id);
      if (!user) { unresolved += 1; addConflict(entity, row.id, "missing_source_user", { sourceUserId: Number(row.user_id) }); continue; }
      operations.push({ updateOne: {
        filter: { sourceSystem, "legacyIds.mysql": Number(row.id) },
        update: { $set: { ...migrated(row.id), userId: user._id, ...transform(row) } },
        upsert: true
      } });
      upserted += 1;
    }
    if (operations.length) {
      for (let offset = 0; offset < operations.length; offset += 500) {
        await db.collection(collection).bulkWrite(operations.slice(offset, offset + 500), { ordered: false });
      }
    }
    return { planned, upserted, unresolvedReferences: unresolved };
  };
  report.writes.notifications = await migrateUserRows(notificationRows, "notification", "notifications", (row) => ({
    audienceRole: row.role || "", title: row.title, body: row.body || "", icon: row.icon || "", clickUrl: row.click_url || "",
    readAt: row.is_read ? normalizeDate(row.created_at) || now : undefined,
    createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.created_at) || now
  }));
  let tokenPlanned = 0, tokenUpserted = 0, tokenMatched = 0, tokenUnresolved = 0, tokenConflicts = 0;
  for (const row of tokenRows) {
    if (mode === "dry-run") { tokenPlanned += 1; continue; }
    const user = await targetUserFor(row.user_id);
    if (!user) {
      tokenUnresolved += 1; addConflict("push_token", row.id, "missing_source_user", { sourceUserId: Number(row.user_id) }); continue;
    }
    const [existingByLegacy, existingByToken] = await Promise.all([
      db.collection("pushtokens").findOne({ sourceSystem, "legacyIds.mysql": Number(row.id) }),
      db.collection("pushtokens").findOne({ token: row.token })
    ]);
    if (existingByLegacy && existingByToken && String(existingByLegacy._id) !== String(existingByToken._id)) {
      tokenConflicts += 1; addConflict("push_token", row.id, "legacy_and_token_match_different_documents"); continue;
    }
    const existing = existingByLegacy || existingByToken;
    if (existingByToken && String(existingByToken.userId) !== String(user._id)) {
      tokenConflicts += 1; addConflict("push_token", row.id, "token_owned_by_different_user"); continue;
    }
    const document = {
      ...migrated(row.id), userId: String(user._id), token: row.token, platform: existing?.platform || "unknown",
      registeredAt: existing?.registeredAt || normalizeDate(row.created_at) || now, lastSeenAt: normalizeDate(row.updated_at),
      createdAt: existing?.createdAt || normalizeDate(row.created_at) || now,
      updatedAt: normalizeDate(row.updated_at) || normalizeDate(row.created_at) || now
    };
    const result = await db.collection("pushtokens").updateOne(existing ? { _id: existing._id } : { sourceSystem, "legacyIds.mysql": Number(row.id) }, { $set: document }, { upsert: true });
    if (result.upsertedCount) tokenUpserted += 1; else tokenMatched += 1;
  }
  report.writes.pushTokens = { planned: tokenPlanned, upserted: tokenUpserted, matched: tokenMatched, unresolvedReferences: tokenUnresolved, conflicts: tokenConflicts };
  if (mode !== "dry-run") {
    const validUserIds = new Set((await db.collection("users").find({}, { projection: { _id: 1 } }).toArray()).map(({ _id }) => String(_id)));
    const activeTokens = await db.collection("pushtokens").find({ invalidatedAt: { $exists: false } }, { projection: { _id: 1, userId: 1 } }).toArray();
    const orphanTokenIds = activeTokens.filter((token) => !validUserIds.has(String(token.userId))).map(({ _id }) => _id);
    if (orphanTokenIds.length) {
      await db.collection("pushtokens").updateMany(
        { _id: { $in: orphanTokenIds } },
        { $set: { invalidatedAt: now, invalidationReason: "missing_user_after_migration", migrationBatchId: batchId } }
      );
    }
    report.writes.pushTokens.invalidatedOrphans = orphanTokenIds.length;
  }
  let taskPlanned = 0, taskUpserted = 0, taskUnresolved = 0;
  for (const row of taskRows) {
    if (mode === "dry-run") { taskPlanned += 1; continue; }
    const [user, course] = await Promise.all([targetUserFor(row.user_id), row.course_id == null ? null : targetCourseFor(row.course_id)]);
    if (!user) { taskUnresolved += 1; addConflict("daily_task", row.id, "missing_source_user", { sourceUserId: Number(row.user_id) }); continue; }
    await upsertLegacy("dailytasks", row.id, {
      ...migrated(row.id), userId: user._id, courseId: course?._id, courseTitle: row.course_title || "", title: row.title,
      description: row.description || "", difficulty: row.difficulty, estimatedMinutes: Number(row.estimated_time || 0), tags: parseJson(row.tags, []),
      motivation: row.motivation || "", status: row.status, completedAt: normalizeDate(row.completed_at), weekStart: normalizeDate(row.week_start),
      generatedAt: normalizeDate(row.generated_at), notifiedAt: normalizeDate(row.notified_at), createdAt: normalizeDate(row.created_at) || now,
      updatedAt: normalizeDate(row.completed_at) || normalizeDate(row.created_at) || now
    });
    taskUpserted += 1;
  }
  report.writes.dailyTasks = { planned: taskPlanned, upserted: taskUpserted, unresolvedReferences: taskUnresolved };
}

async function migrateCmsAndCredentials() {
  const [postRows, testimonialRows, settingRows, certificateRows, reviewRows] = await Promise.all([
    sourceRows("posts"), sourceRows("testimonials"), sourceRows("settings"), sourceRows("certificates"), sourceRows("course_reviews")
  ]);
  for (const row of postRows) {
    let authorId;
    if (row.author_id != null && mode !== "dry-run") authorId = (await targetUserFor(row.author_id))?._id;
    await upsertLegacy("cmsposts", row.id, {
      ...migrated(row.id), authorId, title: row.title, slug: row.slug, excerpt: row.excerpt || "", content: row.content || "",
      coverImage: row.cover_image || "", category: row.category || "General", tags: splitList(row.tags), status: row.status,
      views: Number(row.views || 0), publishedAt: normalizeDate(row.published_at), createdAt: normalizeDate(row.created_at) || now,
      updatedAt: normalizeDate(row.updated_at) || normalizeDate(row.created_at) || now
    });
  }
  for (const row of testimonialRows) await upsertLegacy("testimonials", row.id, {
    ...migrated(row.id), name: row.name, role: row.role || "", content: row.content, rating: Number(row.rating || 0), image: row.image || "",
    status: row.status, sortOrder: Number(row.sort_order || 0), createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.created_at) || now
  });
  for (const row of settingRows) {
    if (mode !== "dry-run") await db.collection("appsettings").updateOne(
      { key: row.key },
      { $set: { key: row.key, value: parseJson(row.value, row.value), sourceSystem, migrationBatchId: batchId, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
  }
  let certificatePlanned = 0, certificateUpserted = 0, reviewPlanned = 0, reviewUpserted = 0, unresolved = 0;
  for (const row of certificateRows) {
    if (mode === "dry-run") { certificatePlanned += 1; continue; }
    const [user, course] = await Promise.all([targetUserFor(row.user_id), row.course_id == null ? null : targetCourseFor(row.course_id)]);
    if (!user) { unresolved += 1; addConflict("certificate", row.id, "missing_source_user"); continue; }
    await upsertLegacy("certificates", row.id, {
      ...migrated(row.id), userId: user._id, courseId: course?._id, certificateNumber: row.certificate_number, title: row.title,
      url: row.url || "", issuedAt: normalizeDate(row.issued_at), createdAt: normalizeDate(row.issued_at) || now, updatedAt: normalizeDate(row.issued_at) || now
    });
    certificateUpserted += 1;
  }
  for (const row of reviewRows) {
    if (mode === "dry-run") { reviewPlanned += 1; continue; }
    const [user, course] = await Promise.all([targetUserFor(row.user_id), targetCourseFor(row.course_id)]);
    if (!user || !course) { unresolved += 1; addConflict("course_review", row.id, "missing_source_reference"); continue; }
    await upsertLegacy("coursereviews", row.id, {
      ...migrated(row.id), userId: user._id, courseId: course._id, rating: Number(row.rating || 0), comment: row.comment || "", status: row.status,
      createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.created_at) || now
    });
    reviewUpserted += 1;
  }
  report.writes.cmsPosts = { planned: mode === "dry-run" ? postRows.length : 0, upserted: mode === "dry-run" ? 0 : postRows.length };
  report.writes.testimonials = { planned: mode === "dry-run" ? testimonialRows.length : 0, upserted: mode === "dry-run" ? 0 : testimonialRows.length };
  report.writes.settings = { planned: mode === "dry-run" ? settingRows.length : 0, upserted: mode === "dry-run" ? 0 : settingRows.length };
  report.writes.certificates = { planned: certificatePlanned, upserted: certificateUpserted };
  report.writes.courseReviews = { planned: reviewPlanned, upserted: reviewUpserted, unresolvedReferences: unresolved };
}

async function migrateLegacyCollaboration() {
  const [groupRows, memberRows, messageRows, helpRows, cookieRows] = await Promise.all([
    sourceRows("chat_groups"), sourceRows("chat_group_members"), sourceRows("chat_messages"), sourceRows("help_requests"), sourceRows("peer_cookies")
  ]);
  const sourceGroupIds = new Set(groupRows.map((row) => Number(row.id)));
  const targetGroups = new Map();
  let unresolved = 0;
  for (const row of groupRows) {
    if (mode === "dry-run") continue;
    const creator = await targetUserFor(row.created_by);
    if (!creator) { unresolved += 1; addConflict("chat_group", row.id, "missing_source_creator"); continue; }
    await upsertLegacy("legacychatgroups", row.id, {
      ...migrated(row.id), name: row.name, createdBy: creator._id, type: row.type,
      createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.created_at) || now
    });
    targetGroups.set(Number(row.id), await db.collection("legacychatgroups").findOne({ sourceSystem, "legacyIds.mysql": Number(row.id) }));
  }
  for (const row of memberRows) {
    if (!sourceGroupIds.has(Number(row.group_id))) {
      unresolved += 1; addConflict("chat_group_member", row.id, "missing_source_group", { sourceGroupId: Number(row.group_id) }); continue;
    }
    if (mode === "dry-run") continue;
    const [group, user] = await Promise.all([targetGroups.get(Number(row.group_id)) || db.collection("legacychatgroups").findOne({ "legacyIds.mysql": Number(row.group_id) }), targetUserFor(row.user_id)]);
    if (!group || !user) { unresolved += 1; addConflict("chat_group_member", row.id, "missing_source_reference"); continue; }
    await upsertLegacy("legacychatgroupmembers", row.id, {
      ...migrated(row.id), groupId: group._id, userId: user._id, joinedAt: normalizeDate(row.joined_at), createdAt: normalizeDate(row.joined_at) || now, updatedAt: normalizeDate(row.joined_at) || now
    });
  }
  for (const row of messageRows) {
    if (!sourceGroupIds.has(Number(row.group_id))) { unresolved += 1; addConflict("chat_message", row.id, "missing_source_group"); continue; }
    if (mode === "dry-run") continue;
    const [group, user] = await Promise.all([targetGroups.get(Number(row.group_id)) || db.collection("legacychatgroups").findOne({ "legacyIds.mysql": Number(row.group_id) }), targetUserFor(row.user_id)]);
    if (!group || !user) { unresolved += 1; addConflict("chat_message", row.id, "missing_source_reference"); continue; }
    await upsertLegacy("legacychatmessages", row.id, {
      ...migrated(row.id), groupId: group._id, userId: user._id, body: row.body || "", filePath: row.file_path || "",
      fileName: row.file_name || "", fileType: row.file_type || undefined, createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.created_at) || now
    });
  }
  for (const row of helpRows) {
    if (mode === "dry-run") continue;
    const [fromUser, toUser] = await Promise.all([targetUserFor(row.from_user_id), targetUserFor(row.to_user_id)]);
    if (!fromUser || !toUser) { unresolved += 1; addConflict("help_request", row.id, "missing_source_user"); continue; }
    const group = row.group_id == null ? null : targetGroups.get(Number(row.group_id));
    await upsertLegacy("helprequests", row.id, {
      ...migrated(row.id), fromUserId: fromUser._id, toUserId: toUser._id, message: row.message || "", status: row.status,
      groupId: group?._id, createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.created_at) || now
    });
  }
  for (const row of cookieRows) {
    if (mode === "dry-run") continue;
    const [fromUser, toUser] = await Promise.all([targetUserFor(row.from_user_id), targetUserFor(row.to_user_id)]);
    if (!fromUser || !toUser) { unresolved += 1; addConflict("peer_cookie", row.id, "missing_source_user"); continue; }
    await upsertLegacy("peercookies", row.id, {
      ...migrated(row.id), fromUserId: fromUser._id, toUserId: toUser._id, sourceHelpRequestLegacyId: Number(row.request_id),
      cookies: Number(row.cookies || 0), review: row.review || "", createdAt: normalizeDate(row.created_at) || now, updatedAt: normalizeDate(row.created_at) || now
    });
  }
  report.writes.legacyCollaboration = {
    planned: mode === "dry-run" ? groupRows.length + memberRows.length + messageRows.length + helpRows.length + cookieRows.length : 0,
    upserted: mode === "dry-run" ? 0 : groupRows.length + memberRows.length + messageRows.length + helpRows.length + cookieRows.length - unresolved,
    unresolvedReferences: unresolved
  };
}

for (const table of [
  "users", "student_profiles", "categories", "courses", "course_modules", "course_lessons", "course_notes", "course_reviews",
  "programs", "program_courses", "program_enrollments", "enrollments", "lesson_progress", "daily_tasks", "certificates",
  "payment_submissions", "orders", "wallets", "wallet_transactions", "withdrawal_requests",
  "leads", "lead_forms", "contact_messages", "newsletter_subscribers", "internship_applications",
  "portfolio_projects", "portfolio_skills", "portfolio_achievements", "events", "event_registrations", "live_sessions", "live_class_links",
  "notifications", "fcm_tokens", "posts", "testimonials", "settings",
  "chat_groups", "chat_group_members", "chat_messages", "help_requests", "peer_cookies"
]) await inventoryTable(table);
await migrateUsers();
await migrateCourses();
await migrateProfiles();
await migrateCatalogAndPrograms();
await migrateEnrollments();
await migrateLearningProgress();
await migratePayments();
await migrateWallets();
await migrateCommerce();
await migrateLeadsAndInbound();
await migrateEventsAndSessions();
await migrateApplicationsAndPortfolios();
await migrateEngagement();
await migrateCmsAndCredentials();
await migrateLegacyCollaboration();
report.finishedAt = new Date().toISOString();
if (mode !== "dry-run") {
  for (const conflict of report.conflicts) {
    await db.collection("migrationconflicts").updateOne(
      { batchId, entity: conflict.entity, sourceId: String(conflict.sourceId), reason: conflict.reason },
      { $set: { ...conflict, batchId, sourceId: String(conflict.sourceId), sourceSystem, resolution: "unresolved", updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  }
  await db.collection("migrationbatches").updateOne(
    { batchId },
    { $set: { status: "completed", completedAt: new Date(), counts: report.writes, conflictCount: report.conflicts.length, updatedAt: new Date() } }
  );
}
console.log(JSON.stringify(report, null, 2));
await mysqlPool.end();
await mongoose.disconnect();
