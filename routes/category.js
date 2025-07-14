import express from "express";
import {
  createCategory,
  getAllcategory,
  getSpecificCategory,
  enableCategory,
  disableCategory,
  totalCategory,
} from "../controller/categoryController.js";

const router = express.Router();

//create category
router.post("/createCtegory", createCategory);

// Get all categories of that company
router.get("/", getAllcategory);
// get Specific category
router.put("/:id", getSpecificCategory);

//enable Specific categorie
router.put("/enable-one/:id", enableCategory);

// //disable Specific categorie
router.put("/disable-one/:id", disableCategory);

// total category Count
router.get("/total", totalCategory);
export default router;
