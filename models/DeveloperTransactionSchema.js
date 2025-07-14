import mongoose from "mongoose";

const developerTransactionSchema = new mongoose.Schema(
  {
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Developer",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Manager" }], // Managers during this transaction
    photoshoot: [{ type: String }], // Photos uploaded during this transaction
    status: { type: String, enum: ["active", "archived"], default: "active" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model(
  "DeveloperTransaction",
  developerTransactionSchema
);
