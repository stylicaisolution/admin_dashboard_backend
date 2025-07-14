import COMPANY from "../models/COMPANY.js"
import CMANAGER from "../models/CMANAGER.js"
import Upload from "../models/UPLOAD.js"
import CREDITTRANSACTION from "../models/CREDITTRANSACTION.js"

import fs from "fs";
import path from "path";


const deleteUploadedFile = (file) => {
  if (file) {
      try {
          const filePath = file.path;
          const folderPath = path.dirname(filePath);

          // Delete the uploaded file
          if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Deleted file: ${filePath}`);
          }

          // Check if folder is empty and delete it
          if (fs.existsSync(folderPath) && fs.readdirSync(folderPath).length === 0) {
              fs.rmdirSync(folderPath);
              console.log(`Deleted empty folder: ${folderPath}`);
          }
      } catch (error) {
          console.error("Error while deleting file/folder:", error);
      }
  }
};

export const checkCoinForCmanager = async (req, res, next) => {
  try {

      const { photoshootType } = req.body;
      const { managerid } = req.params;

      if (!photoshootType || !managerid) {
          deleteUploadedFile(req.file);
          return res.status(400).json({ message: "Please provide all required fields.", status: 400 });
      }

      const manager = await CMANAGER.findById(managerid);
      if (!manager) {
          deleteUploadedFile(req.file);
          return res.status(404).json({ message: "Manager not found.", status: 404 });
      }

      const company = await COMPANY.findById(manager.assignto);
      if (!company) {
          deleteUploadedFile(req.file);
          return res.status(404).json({ message: "Company is not found.", status: 404 });
      }

      const cmanagers = await CMANAGER.find({ assignto: company._id });
      const cmanagerIds = cmanagers.map((item) => item._id);

      // All Company uploads
      const companyUploads = await Upload.find({ createdBy: company._id });

      // Completed Company uploads
      const completedCompanyUploads = await CREDITTRANSACTION.find({
          fromId: company._id,
          fromRole: "company",
          toRole: "Upload"
      });

      // All cmanager uploads
      const cmanagerUploads = await Upload.find({ createdBy: { $in: cmanagerIds } });

      // Completed cmanager uploads
      const completedCmanagerUploads = await CREDITTRANSACTION.find({
          fromId: { $in: cmanagerIds },
          fromRole: "cmanager",
          toRole: "Upload"
      });

      let pendingCompanyUploads = Math.abs(companyUploads.length - completedCompanyUploads.length);
      let pendingCmanagerUploads = Math.abs(cmanagerUploads.length - completedCmanagerUploads.length);
      let totalPendings = pendingCmanagerUploads + pendingCompanyUploads;
      
      console.log(totalPendings);

      if (photoshootType === "single") {
          if (company.credit_balance - totalPendings > 0) {
              return next();
          } else {
              deleteUploadedFile(req.file);
              return res.status(400).json({ message: "No sufficient blue coins.", status: 400 });
          }
      } else if (photoshootType === "multiple") {
          if (company.gold_balance - totalPendings > 0) {
              return next();
          } else {
              deleteUploadedFile(req.file);
              return res.status(400).json({ message: "No sufficient gold coins.", status: 400 });
          }
      } else {
          deleteUploadedFile(req.file);
          return res.status(400).json({ message: "Category type is invalid.", status: 400 });
      }
  } catch (err) {
      deleteUploadedFile(req.file);
      return res.status(500).json({ message: "Something went wrong.", status: 500 });
  }
};


export const checkCoinForCompany = async (req, res, next) => {
  try {
      const { photoshootType } = req.body;
      const { companyId } = req.params;

      if (!photoshootType || !companyId) {
          deleteUploadedFile(req.file);
          return res.status(400).json({ message: "Category type or companyId is missing.", status: 400 });
      }

      const company = await COMPANY.findById(companyId);
      if (!company) {
          deleteUploadedFile(req.file);
          return res.status(404).json({ message: "Company is not found.", status: 404 });
      }

      const cmanagers = await CMANAGER.find({ assignto: company._id });
      const cmanagerIds = cmanagers.map((item) => item._id);

      // All Company uploads
      const companyUploads = await Upload.find({ createdBy: company._id });

      // Completed Company uploads
      const completedCompanyUploads = await CREDITTRANSACTION.find({
          fromId: company._id,
          fromRole: "company",
          toRole: "Upload"
      });

      // All cmanager uploads
      const cmanagerUploads = await Upload.find({ createdBy: { $in: cmanagerIds } });

      // Completed cmanager uploads
      const completedCmanagerUploads = await CREDITTRANSACTION.find({
          fromId: { $in: cmanagerIds },
          fromRole: "cmanager",
          toRole: "Upload"
      });

      let pendingCompanyUploads = Math.abs(companyUploads.length - completedCompanyUploads.length);
      console.log(pendingCompanyUploads);

      let pendingCmanagerUploads = Math.abs(cmanagerUploads.length - completedCmanagerUploads.length);
      console.log(pendingCmanagerUploads);

      let totalPendings = pendingCmanagerUploads + pendingCompanyUploads;
      console.log(totalPendings);

      if (photoshootType === "single") {
          if (company.credit_balance - totalPendings > 0) {
              return next();
          } else {
              deleteUploadedFile(req.file);
              return res.status(400).json({ message: "No sufficient blue coins.", status: 400 });
          }
      } else if (photoshootType === "multiple") {
          if (company.gold_balance - totalPendings > 0) {
              return next();
          } else {
              deleteUploadedFile(req.file);
              return res.status(400).json({ message: "No sufficient gold coins.", status: 400 });
          }
      } else {
          deleteUploadedFile(req.file);
          return res.status(400).json({ message: "Category type is invalid.", status: 400 });
      }
  } catch (err) {
      deleteUploadedFile(req.file);
      return res.status(500).json({ message: "Something went wrong.", status: 500 });
  }
};
