import mongoose from "mongoose";

const migrationBatchSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, unique: true, index: true },
    sourceSystem: { type: String, required: true, index: true },
    sourceSnapshot: { type: String, required: true },
    mode: { type: String, enum: ["dry-run", "staging", "production"], required: true },
    status: {
      type: String,
      enum: ["planned", "running", "completed", "failed", "rolled_back"],
      default: "planned",
      index: true
    },
    startedAt: Date,
    completedAt: Date,
    counts: { type: Map, of: Number, default: {} },
    error: String,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const MigrationBatch = mongoose.models.MigrationBatch || mongoose.model("MigrationBatch", migrationBatchSchema);
