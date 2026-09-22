import mongoose from "mongoose";

const legacyFields = {
  legacyIds: { mysql: Number }, sourceSystem: { type: String, default: "app" }, migrationBatchId: { type: String, index: true }, schemaVersion: { type: Number, default: 1 }
};
const postSchema = new mongoose.Schema({
  ...legacyFields, authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, title: { type: String, required: true },
  slug: { type: String, required: true, index: true }, excerpt: String, content: String, coverImage: String, category: String,
  tags: [String], status: { type: String, enum: ["draft", "published"], default: "draft", index: true }, views: { type: Number, default: 0 }, publishedAt: Date
}, { timestamps: true });
const testimonialSchema = new mongoose.Schema({
  ...legacyFields, name: { type: String, required: true }, role: String, content: { type: String, required: true }, rating: Number,
  image: String, status: { type: String, enum: ["active", "inactive"], default: "active" }, sortOrder: Number
}, { timestamps: true });
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, value: mongoose.Schema.Types.Mixed, sourceSystem: { type: String, default: "app" }, migrationBatchId: { type: String, index: true }
}, { timestamps: true });
for (const schema of [postSchema, testimonialSchema]) schema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });

export const CmsPost = mongoose.models.CmsPost || mongoose.model("CmsPost", postSchema);
export const Testimonial = mongoose.models.Testimonial || mongoose.model("Testimonial", testimonialSchema);
export const AppSetting = mongoose.models.AppSetting || mongoose.model("AppSetting", settingSchema);
