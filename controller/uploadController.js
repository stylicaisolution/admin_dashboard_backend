import Upload from "../models/UPLOAD.js";
import CMANAGER from "../models/CMANAGER.js";
import DEVELOPER from "../models/DEVELOPER.js";
import COMPANY from "../models/COMPANY.js";
import { convertToWebP, convertToWebPBackImage } from "../utils/imageUtils.js";
import { generateFolderId } from "../utils/folderUtils.js";
import path from "path";
import archiver from "archiver";
import fs from "fs";

export const uploadImage = async (req, res) => {
  try {
    const {
      categoryName,
      categoryType,
      backgroundOption,
      photoshootType,
      AgeGroup,
      description,
    } = req.body;
    const { managerid } = req.params;

    if (!categoryName || !categoryType || !AgeGroup) {
      return res
        .status(400)
        .json({ message: "category type or category name missing" });
    }

    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }

    // Get company mongoid
    const manager = await CMANAGER.findById(managerid);

    //Get company data
    const company = await COMPANY.findById(manager.assignto);

    if (!company)
      return res.status(404).json({ message: "Company not found." });

    if (!company.developer)
      return res
        .status(404)
        .json({ message: "Developer is not assigned to your company." });

    if (!manager)
      return res.status(404).json({ message: "Manager not found." });

    // Convert image to WebP format
    const convertedFilePath = await convertToWebP(req.file.path);

    // Generate next model folder name
    const folderName = req.folderName;
    const folderId = generateFolderId(req.file.originalname);

    // Save upload details to MongoDB
    const uploadData = new Upload({
      categoryName,
      categoryType,
      AgeGroup,
      description,
      backgroundOption,
      folderName,
      folderId,
      photoshootType,
      frontImage: {
        fileType: "image/webp",
        fileName: "front.webp",
        filePath: convertedFilePath,
        fileSize: req.file.size,
      },
      createdBy: managerid,
      createdByModel: "cmanager",
      company: manager.assignto,
      photoshoot: [convertedFilePath],
    });

    await uploadData.save();

    // Send success response
    res.status(200).send({
      message: "Image uploaded successfully!",
      uploadDetails: uploadData,
    });
  } catch (err) {
    console.error("Error uploading image:", err);
    res
      .status(500)
      .send({ message: "Image upload failed", error: err.message });
  }
};

export const uploadImageByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      categoryName,
      categoryType,
      backgroundOption,
      photoshootType,
      AgeGroup,
      description,
    } = req.body;

    // const platform = platforms.split(",").map(item => item.trim());
    if (!categoryName || !categoryType) {
      return res
        .status(400)
        .json({ message: "category type or category name missing" });
    }

    if (!req.file) {
      //|| req.file.image.length > 1
      return res.status(400).send({
        message: "No file uploaded || Or more Than One File get Uploaded",
      });
    }

    const company = await COMPANY.findById(companyId);

    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    if (!company.developer)
      return res
        .status(404)
        .json({ message: "Developer is not assigned to your company." });

    const convertedFilePath = await convertToWebP(req.file.path);

    const folderName = req.folderName;
    const existingUpload = await Upload.findOne({ folderName });

    if (existingUpload) {
      return res.status(400).json({
        message: "Folder name already exists. Please choose a different name.",
      });
    }

    const folderId = generateFolderId(req.file.originalname);

    const uploadData = new Upload({
      categoryName,
      // platforms: platform,
      categoryType,
      backgroundOption,
      folderName,
      folderId,
      AgeGroup,
      description,
      photoshootType,
      frontImage: {
        fileType: "image/webp",
        fileName: "front.webp",
        filePath: convertedFilePath,
        fileSize: req.file.size,
      },
      createdBy: companyId,
      createdByModel: "company",
      company: companyId,
      photoshoot: [convertedFilePath],
    });

    await uploadData.save();

    res
      .status(200)
      .json({ message: "Upload Image Successfully", data: uploadData });
  } catch (err) {
    console.error("Error uploading image:", err);
    res.status(500).json({
      message: err.message,
      message2: "Someting Went Wrong in UploadImageByCompany",
    });
  }
};

export const getLastTransactionsByManagerOrCompany = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Manager ID is required" });
    }

    const lastTransactions = await Upload.find({ createdBy: id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "Transactions retrieved successfully",
      data: lastTransactions,
    });
  } catch (err) {
    console.error("Error fetching last transactions:", err);
    res.status(500).json({
      message: "Error fetching last transactions",
      error: err.message,
    });
  }
};

export const getAllUploadsByCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Company id is required." });
    }
    const allUploads = await Upload.find({ company: id })
      .populate("createdBy", "name") // Only fetch name and email
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ message: "All transaction retrived.", data: allUploads });
  } catch (err) {
    next(err);
  }
};

export const uploadBackImage = async (req, res) => {
  try {
    // here managerid should be managerid or maybe companyid too cause need to chnage in frontend here it not rename as  id instead of managerid
    const { managerid } = req.body;
    const { foldername } = req.params;

    if (!managerid || !foldername) {
      return res.status(400).json({
        message: "managerid or filePath is missing",
      });
    }
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }

    const uploadDocument = await Upload.findOne({
      createdBy: managerid,
      folderName: foldername,
    });

    if (!uploadDocument) {
      return res.status(404).json({
        message: "No matching upload document found for the provided filePath",
      });
    }

    let existBackImage = false;
    const existFilePath = path.join(path.dirname(req.file.path), "back.webp");

    // Check if back.webp already exists and remove it
    if (fs.existsSync(existFilePath)) {
      fs.unlinkSync(existFilePath);
      existBackImage = true;
    }

    fs.readdir(path.dirname(req.file.path), (err, files) => {
      if (err) {
        return console.error("Error reading folder:", err);
      }
      files.forEach((file) => {});
    });

    const convertedFilePath = await convertToWebPBackImage(req.file.path);

    // Update the upload document with backImage details
    uploadDocument.backImage = {
      fileType: "image/webp",
      fileName: "back.webp",
      filePath: convertedFilePath,
      fileSize: req.file.size,
    };

    if (!existBackImage) uploadDocument.photoshoot.push(convertedFilePath);

    // Save the updated document
    await uploadDocument.save();

    // Send success response
    res.status(200).send({
      message: "Back image uploaded successfully",
      uploadDetails: uploadDocument,
    });
  } catch (err) {
    console.error("Error in uploadBackImage:", err);
    res.status(500).json({
      message: "Error in uploadBackImage",
      error: err.message,
    });
  }
};

export const getUploadsCount = async (req, res, next) => {
  try {
    const totalUploads = await Upload.find().countDocuments();
    const pending = await Upload.find({
      isphotoshootcomplete: false,
    }).countDocuments();
    const completed = await Upload.find({
      isphotoshootcomplete: true,
    }).countDocuments();

    return res.status(200).json({
      message: "All uploads count retrived",
      data: {
        totalUploads,
        pending,
        completed,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getUploadsCountByCompanyId = async (req, res, next) => {
  try {
    const { companyid } = req.params;

    const totaluploads = await Upload.find({ company: companyid });
    const pendinguploads = await Upload.find({
      company: companyid,
      isphotoshootcomplete: false,
    });
    const completeuploads = await Upload.find({
      company: companyid,
      isphotoshootcomplete: true,
    });

    return res.status(200).json({
      message: "Uploads count retrived by company id.",
      data: {
        totaluploads,
        pendinguploads,
        completeuploads,
      },
    });
  } catch (err) {
    next(err);
  }
};

//Helper function
export const getUploadsCountByCId = async (companyId) => {
  const totaluploads = await Upload.countDocuments({ company: companyId });
  const pendinguploads = await Upload.countDocuments({
    company: companyId,
    isphotoshootcomplete: false,
  });
  const completeuploads = await Upload.countDocuments({
    company: companyId,
    isphotoshootcomplete: true,
  });

  return {
    totaluploads,
    pendinguploads,
    completeuploads,
  };
};

// Controller to download photos by folderName
export const downloadPhotosByFolderName = async (req, res) => {
  const { folderName } = req.params; // Get folderName from route parameters

  try {
    // Find the folder by folderName
    const folder = await Upload.findOne({ folderName });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const { frontImage, backImage, photoshoot } = folder;

    // Collect all file paths ensuring uniqueness
    const filePaths = new Set();

    if (frontImage) filePaths.add(frontImage.filePath);
    if (backImage) filePaths.add(backImage.filePath);
    if (photoshoot && photoshoot.length > 0) {
      photoshoot.forEach((photo) => filePaths.add(photo));
    }

    // Convert Set back to array
    const uniqueFilePaths = Array.from(filePaths);

    if (uniqueFilePaths.length === 0) {
      return res.status(404).json({ message: "No photos found in the folder" });
    }

    // Create a ZIP file
    const zipFileName = `${folderName}.zip`;
    const zipFilePath = path.resolve("./", zipFileName);

    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      res.download(zipFilePath, zipFileName, (err) => {
        if (err) {
          console.error(err);
        }
        // Delete the ZIP file after download
        fs.unlinkSync(zipFilePath);
      });
    });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(output);

    // Append files to the ZIP
    for (const filePath of uniqueFilePaths) {
      const absolutePath = path.resolve("./", filePath); // Ensure the correct file path
      if (fs.existsSync(absolutePath)) {
        archive.file(absolutePath, { name: path.basename(filePath) });
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while downloading photos" });
  }
};

// Controller to download single photo from folder
// Controller to download single photo from folder with folderName in params and filePath in body
export const downloadPhotoByFileName = (req, res) => {
  try {
    // Get folder name from request parameters
    const { folderName } = req.params;

    // Get the file path from the request body
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: "File path is required" });
    }

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Send the file for download
    res.download(filePath, (err) => {
      if (err) {
        console.error("Error while downloading file:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
};

//For getting photoshoots of folder
export const getPhotoShoots = async (req, res, next) => {
  try {
    const { foldername } = req.params;

    const folder = await Upload.findOne({ folderName: foldername });

    if (!folder)
      return res.status(404).json({ message: "Foder not found by foldername" });

    return res.status(200).json({
      message: "Photoshoots retrived",
      data: folder.photoshoot,
      folderStatus: folder.isphotoshootcomplete,
    });
  } catch (err) {
    next(err);
  }
};

//For getting modals for developer
export const getModalsForDeveloperId = async (req, res, next) => {
  try {
    const { developerid } = req.params;

    const develoepr = await DEVELOPER.findById(developerid);

    if (!develoepr)
      return res.status(404).json({ message: "Dveloper not found" });

    const companies = develoepr.companies;

    const uploads = await Promise.all(
      companies.map(async (company) => {
        const uploadsFolders = await Upload.find({ company })
          .populate("company")
          .populate("createdBy");

        return uploadsFolders;
      })
    );

    const flatUploads = uploads.flat();

    return res
      .status(200)
      .json({ message: "All Uploads retrived.", data: flatUploads });
  } catch (err) {
    next(err);
  }
};

export const changeUploadStatus = async (req, res, next) => {
  try {
    const { uploadid } = req.params;

    const upload = await Upload.findById(uploadid);
    if (!upload) {
      return res.status(404).json({ message: "Upload not found" });
    }

    await Upload.findByIdAndUpdate(uploadid, {
      $set: { isphotoshootcomplete: !upload.isphotoshootcomplete },
    });

    return res
      .status(200)
      .json({ message: "Photo shoot updated successfully" });
  } catch (err) {
    next(err);
  }
};
