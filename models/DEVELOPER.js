import mongoose from "mongoose";

const developerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    mobileno: { type: String },
    dataid: {
      type: String,
      required: true,
    },
    profile: {
      filetype: String, 
      filename: String,
      filepath: String,
      fileSize: String,
    },
    assign_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Superadmin",
    },
    companies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
      },
    ],
    photoshoot: [{ type: String }],
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Developer", developerSchema);
