import express from "express";
import {
  disableAllSelectiveId,
  disableCompanyById,
  enableAllSelectiveId,
  enableCompanyById,
  exportCompany,
  getAllCompany,
  getCompanyById,
  updateCompanyById,
  handleFileUpload,
  totalcompany,
  getCreadits,
  getLatestCompanies,
  assignDeveloper,
  getCompaniesByDeveloperId,
  getCountByCompany,
  getGoldenCoins
} from "../controller/companyController.js";
import { uploadCompany } from "../utils/storageMulter.js";

const router = express.Router();

//For get latest 10 companies
router.get("/getlatest",getLatestCompanies)

//Export total no of company registered
router.get('/total',totalcompany)
//For get all company  with search
router.get("/", getAllCompany);

//Get company by id
router.get("/:id", getCompanyById);

//Update company by id
router.put("/:id", updateCompanyById);

//Enable partner by id
router.put("/enable-one/:id", enableCompanyById);

//Disable partner by id
router.put("/disable-one/:id", disableCompanyById);

//Enable selective Company
router.post("/enableall", enableAllSelectiveId);

//Disable selective Company
router.post("/disableall", disableAllSelectiveId);

//Exporrt Selective Company
router.post("/export-data", exportCompany);

//upload Comapany Logo
router.post(
  "/upload-logo/:companyid",
  uploadCompany.single("logo"),
  handleFileUpload
);

//For get creadits
router.get("/getcredits/:id", getCreadits);

//For get gold coins
router.get("/getgoldcoins/:id",getGoldenCoins)

//For assign developer to all companies
router.put('/assigndeveloper/:developerId',assignDeveloper)

//For get companies on developer id
router.get('/getallnotassigncompanies/:developerId',getCompaniesByDeveloperId)

// Route to get count by company
router.get("/count/:companyId", getCountByCompany);


export default router;
