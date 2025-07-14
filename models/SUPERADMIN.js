import mongoose from "mongoose";

const superadminSchema = new mongoose.Schema(
  {
    photo: {
      filetype: String,
      filename: String,
      filepath: String,
      fileSize: String,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    mobileno: {
      type: String,
      required: true,
    },
    dataid: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    credit_balance: {
      type: Number,
      default: 999999999,
    },
    gold_balance: {
      type: Number,
      default: 999999999,
    }
  },
  { timestamps: true }
);

export default mongoose.model("superadmin", superadminSchema);
