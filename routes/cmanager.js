import express from "express";
import multer from "multer";
import {
  disableAllCmanagers,
  disableCmanager,
  enableCmanager,
  getAllCmanagers,
  getCmanagerById,
  totalCategory,
  updateCmanager,
  totalcoins,
  getCountByCompanyId,
  getManagerByCompanyId,
  disableSelectiveCManagerId,
  enableSelectiveCManagerId,
  exportCmanagers,
  getCountByManagerId,
  getModalsTransaction,
  handleCManagerFileUpload,
  getGoldCoins,
} from "../controller/cmanagerController.js";
import { uploadCManager } from "../utils/storageMulter.js";

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Set the folder where files will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Rename file to avoid conflicts
  },
});
const upload = multer({ storage });

// Routes
// router.get("/total/:dataid", totalcoins);
// Get all cmanager entries
router.get("/", getAllCmanagers);

// Route to export cmanagers as CSV
router.post("/export", exportCmanagers);

// Get a single cmanager entry by ID
router.get("/:id", getCmanagerById);

// Update a cmanager entry
router.put("/:id", updateCmanager);

//enable Specific categorie
router.put("/enable-one/:id", enableCmanager);

//disable Specific categorie
router.put("/disable-one/:id", disableCmanager);

//Enable selective cmanager
router.post("/enableall", enableSelectiveCManagerId);

//Disable selective cmanager
router.post("/disableall", disableSelectiveCManagerId);

// total category Count
router.get("/total", totalCategory);

// Route to disable all cmanagers
router.patch("/disable-all", disableAllCmanagers);

//Get total creadits
router.get("/getcredits/:managerid", totalcoins);

//Get total gold coins
router.get("/getgoldcoins/:managerid", getGoldCoins);

//Get total counts of manager by companyid
router.get("/getmanagercountbycompanyid/:companyid", getCountByCompanyId);

//Get manager details by company id
router.get("/getmanagerdetailsbycompanyid/:companyid", getManagerByCompanyId);

//Get count of photoshoot from managerid
router.get("/count/:managerId", getCountByManagerId);

//Get transaction history for manager
router.get("/getmanagertransaction/:managerId", getModalsTransaction);

// Route to upload CManager profile photo
router.put(
  "/uploadCManagerImage/:cmdataid",
  uploadCManager.single("image"), // Upload middleware
  handleCManagerFileUpload
);

export default router;
