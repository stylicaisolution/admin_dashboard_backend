import mongoose from "mongoose";

const cmanagerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    dataid: {
      type: String,
      required: true,
    },
    photo: {
      filetype: String,
      filename: String,
      filepath: String,
      fileSize: String,
    },
    mobileno: {
      type: String,
      required: true,
    },
    credit_balance: {
      type: Number,
      default: 1,
    },
    assignto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("cmanager", cmanagerSchema);
