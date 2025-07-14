import express from "express";
import {
  createPartner,
  superadminRegister,
  validateUser,
  Login,
  Logout,
  cmanagerRegister,
  developerRegister,
  updatePassword,
  getTotalDashboardCounts,
  changePassword,
  updateProfilePassword
} from "../controller/authController.js";
const router = express.Router();
import { companyRegister } from "../controller/authController.js";
import { upload } from "../utils/storageMulter.js";

// for partner reg
router.post("/pregistration", upload.single("logo"), createPartner);

// //For register new user
router.post("/super-register", superadminRegister);

//For Register Company
router.post("/company-register", companyRegister);

//For validation user 
router.get("/validate", validateUser);

//For login user 
router.post("/login", Login);

//For logout user
router.post("/logout", Logout);

//For register cmanager
router.post("/cmanager-register",cmanagerRegister);

//FOR register developer
router.post("/developer-register",developerRegister);

//For Setting New Password
router.put("/update-password/:id", updatePassword);

//For getting dashboard counts
router.get('/getdashboardcount', getTotalDashboardCounts)

//For changing password if user exists
router.put('/change-password/:id', changePassword)


//For update profile password
router.put("/update-profile-password/:id", updateProfilePassword);

export default router;
  