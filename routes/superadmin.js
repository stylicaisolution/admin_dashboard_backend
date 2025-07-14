import express from "express";
import {
  disableAllSuperadmin,
  totalsuperadmin,
  getCompaniesBySuperadmin,
  exportsuperadmins,
  disableSuperAdminById,
  enableSuperAdminById,
  getAllsuperadmin,
  getsuperadminByid,
  updateBydataid,
  handleFileUpload,
} from "../controller/superController.js";

import { uploadAdmin } from "../utils/storageMulter.js";


const router = express.Router();
//Get all superadmin
router.get("/", getAllsuperadmin);

//Get all disable
router.put("/disableall", disableAllSuperadmin);

//Export total no of superadmin registered
router.get("/total", totalsuperadmin);

//Get superadmin by id
router.get("/:id", getsuperadminByid);

//Update username,email,mobileno by id
router.put("/update/:id", updateBydataid);

//Enable selective superadmin
router.put("/enable/:id", enableSuperAdminById);

//Disable selective superaadmin
router.put("/disable/:id", disableSuperAdminById);

//export superadmin files
router.put("/export", exportsuperadmins);

//get all partners by the specific superadmin
router.get("/companylists/:id", getCompaniesBySuperadmin);

// upload photo
router.post(
  "/uploadprofile/:adminid",
  uploadAdmin.single("logo"),
  handleFileUpload
);
export default router;