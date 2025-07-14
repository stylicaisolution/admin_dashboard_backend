import express from "express";
import { assignDeveloper } from "../controller/developerTransactionsController.js";

const router = express.Router();
router.put("/assignDeveloperToCompany/:devId", assignDeveloper);

export default router;
