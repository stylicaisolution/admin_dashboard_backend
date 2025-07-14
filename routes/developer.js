import express from "express";
import {
  getAllDevelopers,
  getDeveloperById,
  updateDeveloper,
  deleteDeveloper,
  enableDeveloperById,
  disableDeveloperById,
  enableAllDevelopers,
  disableAllDevelopers,
  exportCSV,
  handleFileUpload,
  getDeveloperByCompanyId,
  uploadPhotos,
  getCountByDeveloper,
  removePhoto
} from "../controller/developerController.js";
import { uploadDeveloper } from "../utils/storageMulter.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const { foldername } = req.params;

      if (!foldername) {
        return cb(new Error("refPath is required to determine upload folder."));
      }

      const updateFolderName = `uploads/models/${foldername}`

      cb(null, updateFolderName);
    } catch (err) {
      cb(err);
    }
  },
  filename: async (req, file, cb) => {
    try {
      const timestamp = Date.now();
      const uniqueFileName = `photoshoot-${timestamp}-${Math.random()
        .toString(36)
        .substring(2, 8)}-${file.originalname.replace(/[^a-zA-Z0-9.\-]/g, "")}`;
  
      cb(null, uniqueFileName);
    } catch (err) {
      cb(err);
    }
  },
});

// File filter for allowed image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/webp", "image/jpeg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only WEBP, JPEG, and PNG are allowed."));
  }
};

const upload = multer({ storage, fileFilter });

const router = express.Router();

//For get all developers
router.get("/", getAllDevelopers);

//For get developer by mongoid
router.get("/:id", getDeveloperById);

//For update developer
router.put("/:id", updateDeveloper);
 
//For delete developer
router.delete("/:id", deleteDeveloper);

//For enable developer by id
router.patch("/:id/enable", enableDeveloperById);

//For disable developer by id
router.patch("/:id/disable", disableDeveloperById);

//For enable all developer
router.patch("/enable-all", enableAllDevelopers);

//For disable all developer
router.patch("/disable-all", disableAllDevelopers);

//counting developer
router.get("/count/:developerid",getCountByDeveloper)


//For export developer
router.post("/export/csv", exportCSV);

//For upload image of developer
router.put(
  "/uploadDeveloperImage/:devdataid",
  uploadDeveloper.single("image"),
  handleFileUpload
);

//For get developer by company id
router.get("/getbycompanyid/:companyid", getDeveloperByCompanyId);

// Developer uploads AI Shooted Images
router.post(
  "/uploadAIimagesbyDeveloper/:foldername",
  upload.array("photos", 4), // Allow up to 4 images in a single upload
  uploadPhotos
);

//For Delete any photo of photoshoot
router.put('/removephoto/:uploadId',removePhoto)

export default router;

