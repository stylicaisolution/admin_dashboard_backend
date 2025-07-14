import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    categoryType: {
      type: String,
      enum: ["male", "female", "kids"],
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    // allocated_manager: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "cmanager",
    // },
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
      //   required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
