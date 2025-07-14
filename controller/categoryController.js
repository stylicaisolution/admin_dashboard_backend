import mongoose from "mongoose";
import Category from "../models/CATEGORY.js";

// create a new category
export const createCategory = async (req, res, next) => {
  try {
    const { categoryName, categoryType, added_by } = req.body;
    if (!categoryName || !categoryType || !added_by) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const objectId = new mongoose.Types.ObjectId(added_by);

    const cName = categoryName.toLowerCase();
    const existigCategory = await Category.findOne({
      $and: [
        {
          categoryType: categoryType,
        },
        { categoryName: cName },
      ],
    });

    if (existigCategory) {
      return res
        .status(400)
        .json({ message: "Category already exists please enter new one" });
    }

    const category = new Category({
      categoryName,
      categoryType,
      objectId,
    });

    await category.save();

    if (!category) {
      return res.status(404).json({ message: "Category not created " });
    }

    return res
      .status(200)
      .json({ message: "Category created successfully ", data: category });
  } catch (err) {
    next(err);
  }
};

// Get all Category to show case
export const getAllcategory = async (req, res, next) => {
  try {
    let searchQuery = req.query.searchQuery || "";

    let query = {};

    if (searchQuery.length > 0) {
      const searchRegx = new RegExp(searchQuery, "i");
      query["$or"] = [
        { categoryName: searchRegx },
        { categoryType: searchRegx },
      ];
    }

    const categories = await Category.find(query);
    if (categories.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    const active = categories.filter((category) => category.status === true);

    const disable = categories.filter((category) => category.status === false);
    const sortedcategories = [...active, ...disable];

    return res
      .status(202)
      .json({ data: sortedcategories, message: "All Categories found" });
  } catch (err) {
    next(err);
  }
};

// get Specific Category By Id
export const getSpecificCategory = async (req, res,next) => {
  try {
    const cid = req.params.id;

    const category = await Category.findById(cid);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res
      .status(202)
      .json({ category, message: "Specific category Founded! " });
  } catch (err) {
    next(err)
  }
};

// Specific Category Enable
export const enableCategory = async (req, res,next) => {
  try {
  } catch (err) {
    next(err)
  }
};

// Specific Category Disable
export const disableCategory = async (req, res,next) => {
  try {
  } catch (err) {
    next(err)
  }
};

// total categories count
export const totalCategory = async (req, res, next) => {
  try {
    const totalCategories = await Category.countDocuments();
    return res.status(200).json({
      message: "Total number of Categories",
      totalCategories: totalCategories,
    });
  } catch (err) {
    next(err);
  }
};
