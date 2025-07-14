import {
  uploadImage,
  uploadBackImage,
  getLastTransactionsByManagerOrCompany,
  getUploadsCount,
  getUploadsCountByCompanyId,
  downloadPhotosByFolderName,
  downloadPhotoByFileName,
  getPhotoShoots,
  getModalsForDeveloperId,
  changeUploadStatus,
  uploadImageByCompany,
  getAllUploadsByCompany,
} from "../controller/uploadController.js";

import { checkCoinForCmanager, checkCoinForCompany } from "../utils/checkBalance.js";

import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const getNextModelFolder = (baseDirectory) => {
  try {
    const folders = fs.readdirSync(baseDirectory).filter((folder) => {
      return (
        folder.startsWith("model") &&
        fs.statSync(path.join(baseDirectory, folder)).isDirectory()
      );
    });

    let nextFolderNumber = 1;
    if (folders.length > 0) {
      const lastFolder = folders.reduce(
        (max, folder) => {
          const number = parseInt(folder.replace("model", ""), 10);
          return number > max.number ? { name: folder, number } : max;
        },
        { name: "", number: -Infinity }
      ).name;

      const lastNumber = parseInt(lastFolder.replace("model", ""), 10);
      if (!isNaN(lastNumber)) {
        nextFolderNumber = lastNumber + 1;
      }
    }
    return `model${nextFolderNumber}`;
  } catch (err) {
    console.error("Error reading model folders:", err.message);
    throw new Error("Failed to determine the next model folder.");
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseDirectory = "uploads/models";
    const folderName = getNextModelFolder(baseDirectory);
    const folderPath = path.join(baseDirectory, folderName);

    fs.mkdirSync(folderPath, { recursive: true });
    req.folderName = folderName;
    req.modelFolderPath = folderPath;
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueFileName = `${Date.now()}-${file.originalname.replace(
      /[^a-zA-Z0-9.\-]/g,
      ""
    )}`;
    cb(null, uniqueFileName);
  },
});

const existStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { foldername } = req.params;
    const existDirectory = `uploads/models/${foldername}`;
    cb(null, existDirectory);
  },
  filename: (req, file, cb) => {
    const uniqueFileName = `${Date.now()}-${file.originalname.replace(
      /[^a-zA-Z0-9.\-]/g,
      ""
    )}`;

    cb(null, uniqueFileName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/*",
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/webp",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(
      new Error(
        "Invalid file type. Only PNG, JPG, JPEG, and WEBP are allowed."
      ),
      false
    );
  }
};

const uploadModel = multer({
  storage,
  fileFilter,
});

const existModel = multer({
  storage: existStorage,
  fileFilter,
});

const router = express.Router();

router.get(
  "/getalluploadimagetransaction/:id",
  getLastTransactionsByManagerOrCompany
);

router.get("/getalluploadsbycompany/:id",getAllUploadsByCompany)

router.post(
  "/back-image/:foldername",
  existModel.single("image"),
  uploadBackImage
);

// Define the route for manager uploads
router.post("/:managerid",uploadModel.single("image"),checkCoinForCmanager, uploadImage);

// Upload Image  by the Company Itslf
router.post(
  "/uploadImageByCompany/:companyId",
  uploadModel.single("image"),
  checkCoinForCompany,
  uploadImageByCompany
);

//For getting uploads count
router.get("/getuploadscount", getUploadsCount);

//For getting uploads count by company id
router.get(
  "/getuploadscountbycompanyid/:companyid",
  getUploadsCountByCompanyId
);

//For downloading all files present in folder
router.get("/download/folder/:folderName", downloadPhotosByFolderName);

//For downloading single photo from folder
router.post("/download/:folderName", downloadPhotoByFileName);

//For getting photoshoot
router.get("/getphotoshoots/:foldername", getPhotoShoots);

//For getting photoshoots for developer id
router.get("/getuploadsbydeveloperid/:developerid", getModalsForDeveloperId);

//For change account status of uploads
router.put("/changestatusofupload/:uploadid", changeUploadStatus);

export default router;
