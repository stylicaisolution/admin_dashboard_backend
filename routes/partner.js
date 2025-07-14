import express from "express";
import { upload } from "../utils/storageMulter.js";

import {
  getAllpartner,
  getpartnerByid,
  updatePartner,
  enablePartner,
  disablePartner,
  exportPartners,
  getCompaniesByPartnerId,
  enablePartnerById,
  disablePartnerById,
  handleFileUpload,
  totalpartner,
  getTotalCreadits,
  getCountByPartner,
  getTotalGoldCoins,
} from "../controller/partnerController.js";

const router = express.Router();

const app = express();

//Export total no of partner registered
router.get("/total", totalpartner);

//enable partners
router.put("/enablePartner", enablePartner);

// disable partners
router.put("/disablepartner", disablePartner);

//enable partners by Specific Partner Id
router.put("/enablepartner/:id", enablePartnerById);

// disable partners by Specific Partner Id
router.put("/disablepartner/:id", disablePartnerById);

// Get All partner
router.get("/getAllpartner", getAllpartner);

// Get Specific partner by ID
router.get("/getpartner/:id", getpartnerByid);

// Update partner
router.put("/updatepartner/:id", upload.single("logo"), updatePartner);

// Export partner csv File
router.put("/downloadpartner", exportPartners);

// Company list for specific partner
router.get("/getcompany/:id", getCompaniesByPartnerId);

router.post("/upload-logo/:partnerid", upload.single("logo"), handleFileUpload);

//For get total coins
router.get("/getcredits/:id", getTotalCreadits);

//For get total gold coins
router.get("/getgoldcoins/:id", getTotalGoldCoins);

//For getting count added by partner
router.get("/count/:partnerId", getCountByPartner);

export default router;
