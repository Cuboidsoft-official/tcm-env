import mongoose from "mongoose";

const shared = {
  legacyIds: { mysql: Number },
  sourceSystem: { type: String, default: "app" },
  migrationBatchId: { type: String, index: true },
  schemaVersion: { type: Number, default: 1 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }
};

const projectSchema = new mongoose.Schema({
  ...shared, title: { type: String, required: true }, description: String, techStack: [String],
  repositoryUrl: String, liveUrl: String, image: String, isFeatured: { type: Boolean, default: false }, sortOrder: { type: Number, default: 0 }
}, { timestamps: true });
const skillSchema = new mongoose.Schema({ ...shared, name: { type: String, required: true }, level: { type: Number, min: 0, max: 100, default: 50 } }, { timestamps: true });
const achievementSchema = new mongoose.Schema({
  ...shared, title: { type: String, required: true }, issuer: String, description: String, evidenceUrl: String, achievedOn: Date
}, { timestamps: true });

for (const schema of [projectSchema, skillSchema, achievementSchema]) {
  schema.index({ sourceSystem: 1, "legacyIds.mysql": 1 }, { unique: true, sparse: true });
}

export const PortfolioProject = mongoose.models.PortfolioProject || mongoose.model("PortfolioProject", projectSchema);
export const PortfolioSkill = mongoose.models.PortfolioSkill || mongoose.model("PortfolioSkill", skillSchema);
export const PortfolioAchievement = mongoose.models.PortfolioAchievement || mongoose.model("PortfolioAchievement", achievementSchema);
