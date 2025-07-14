import Upload from "../models/UPLOAD.js";
import fs from "fs/promises";
// for unique folderId
export const generateFolderId = (imageName) => {
  if (!imageName || typeof imageName !== "string") {
    throw new Error("Invalid image name. It must be a non-empty string.");
  }

  const sanitizedImageName = imageName
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const generateRandomChar = (type) => {
    if (type === "lowercase")
      return String.fromCharCode(97 + Math.floor(Math.random() * 26));
    if (type === "uppercase")
      return String.fromCharCode(65 + Math.floor(Math.random() * 26));
    if (type === "number") return Math.floor(Math.random() * 10).toString();
    if (type === "special") {
      const specialChars = "!@#$%^&*()_+{}[]|:;<>?,./~";
      return specialChars[Math.floor(Math.random() * specialChars.length)];
    }
  };

  let uniquePart = "";
  uniquePart += generateRandomChar("lowercase");
  uniquePart += generateRandomChar("uppercase");
  uniquePart += generateRandomChar("number");
  uniquePart += generateRandomChar("special");

  for (let i = 0; i < 6; i++) {
    uniquePart += Math.random()
      .toString(36)
      .charAt(Math.floor(Math.random() * 36));
  }

  return `stylic_garment-${sanitizedImageName}-${datePart}-${uniquePart}`;
};

// for the cretion of the new folder get last from upload and than create new folder
// export const generateNextModelFolder = async (baseDirectory) => {
//   const folders = await fs.readdir(baseDirectory);
//   const lastFolder = folders
//     .filter((folder) => folder.startsWith("model"))
//     .sort()
//     .pop();

//   let folderNumber = 1;

//   if (lastFolder) {
//     const lastNumber = parseInt(lastFolder.replace("model", ""), 10);
//     folderNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
//   }

//   const lastUpload = await Upload.findOne().sort({ createdAt: -1 });
//   if (lastUpload && lastUpload.folderName.startsWith("model")) {
//     const dbLastNumber = parseInt(
//       lastUpload.folderName.replace("model", ""),
//       10
//     );
//     folderNumber = Math.max(folderNumber, dbLastNumber + 1);
//   }

//   return `model${folderNumber}`;
// };
