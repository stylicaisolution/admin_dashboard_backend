import multer from "multer";
import fs from "fs";
import path from "path";

// Dynamic storage configuration
export const storage = (comeFrom) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath;

      // Determine the upload directory based on `comeFrom`
      if (comeFrom === "partner") {
        uploadPath = "uploads/partner/logo";
      } else if (comeFrom === "company") {
        uploadPath = "uploads/company/logo";
      } else if (comeFrom === "superadmin") {
        uploadPath = "uploads/superadmin/logo";
      } else if (comeFrom === "models") {
        uploadPath = "uploads/models/";
      } else if (comeFrom === "developer") {
        uploadPath = "uploads/developer/logo";
      } else if (comeFrom === "cmanager") {
        uploadPath = "uploads/cmanager/logo";
      } 
      else {
        uploadPath = "uploads/partner/logo";
      }

      // Ensure the directory exists, create if it doesn't
      fs.mkdirSync(uploadPath, { recursive: true });

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${file.originalname.replace(
        /[^a-zA-Z0-9.\-]/g,
        ""
      )}`; // Sanitizes the file name
      cb(null, uniqueSuffix);
    },
  });

// File filter for validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
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

// Multer upload configurations for different use cases
export const upload = multer({
  storage: storage("partner"),
  fileFilter,
});

export const uploadAdmin = multer({
  storage: storage("superadmin"),
  fileFilter,
});

export const uploadCompany = multer({
  storage: storage("company"),
  fileFilter,
});

export const uploadCManager = multer({
  storage: storage("cmanager"),
  fileFilter,
});

export const uploadDeveloper = multer({
  storage: storage("developer"),
  fileFilter,
});

export const uploadMiscellaneous = multer({
  storage: storage("models"),
  fileFilter,
});
