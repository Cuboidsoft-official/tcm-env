import mongoose from "mongoose";

const migrationConflictSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    sourceTable: String,
    sourceId: { type: String, required: true },
    targetCollection: String,
    targetId: String,
    reason: { type: String, required: true },
    sourceRecord: { type: mongoose.Schema.Types.Mixed, default: {} },
    resolution: {
      type: String,
      enum: ["unresolved", "accepted_source", "accepted_target", "merged", "ignored"],
      default: "unresolved",
      index: true
    },
    resolvedBy: String,
    resolvedAt: Date,
    notes: String
  },
  { timestamps: true }
);

migrationConflictSchema.index({ entity: 1, sourceId: 1, resolution: 1 });

export const MigrationConflict = mongoose.models.MigrationConflict || mongoose.model("MigrationConflict", migrationConflictSchema);
