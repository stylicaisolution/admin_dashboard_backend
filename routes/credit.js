import express from "express";
import {
  transferCredit,
  transactionByCompany,
  transactionBySuperadmin,
  transactionByPartner,
  PandCaddedBySuperadmin,
  creditsTransfer,
  getAllTransactions,
  getCompanyTransactions,
} from "../controller/creditController.js";

const router = express.Router();
router.put("/tranferparticular", creditsTransfer);
//Enable selective Company
router.post("/", transferCredit);

// //company
router.get("/tbc", transactionByCompany);

// // partner
router.get("/tbp", transactionByPartner);

// // Super Admin
router.get("/tbsa", transactionBySuperadmin);

// For the testing
router.put("/test/:superadminId", PandCaddedBySuperadmin);

//For get all transactions 
router.get("/",getAllTransactions)

//For get all company transactions
router.get('/companytransactions/:companyId',getCompanyTransactions)

export default router;
