import COMPANY from "../models/COMPANY.js";
import CMANAGER from "../models/CMANAGER.js";
import { parse } from "json2csv";
import Developer from "../models/DEVELOPER.js";
import Upload from "../models/UPLOAD.js";
import CREDITTRANSACTION from "../models/CREDITTRANSACTION.js";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

import { fileURLToPath } from "url";
import { convertToWebpPhotoshoot } from "../utils/imageUtils.js";
import LOGINMAPPING from "../models/LOGINMAPPING.js";

const generateTransactionId = (mongoid) => {
  const timestamp = Date.now().toString(36); // Encodes timestamp to base-36 for compactness
  const randomString = Math.random().toString(36).substring(2, 8); // Generates a random 6-character string
  return `${mongoid}-${timestamp}-${randomString}`;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Get all developers
export const getAllDevelopers = async (req, res, next) => {
  let { searchQuery } = req.query || "";
  let query = {};

  if (searchQuery.length > 0) {
    const searchRegx = new RegExp(searchQuery, "i");
    query["$or"] = [
      { name: searchRegx },
      { email: searchRegx },
      { mobileno: searchRegx },
    ];
  }
  try {
    const developers = await Developer.find(query);
    res.status(200).json(developers);
  } catch (error) {
    next(error); // Pass error to middleware
  }
};

// Get developer by ID
export const getDeveloperById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: "Developer not found" });

    const developer = await Developer.findById(id);

    if (!developer)
      return res.status(400).json({ message: "Developer not found" });

    res.status(200).json(developer);
  } catch (error) {
    next(error);
  }
};

// Update developer
export const updateDeveloper = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    if (!id)
      return res.status(400).json({ message: "Developer ID is required." });

    const developer = await Developer.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!developer)
      return res.status(400).json({ message: "Developer not found." });

    res.status(200).json(developer);
  } catch (error) {
    next(error);
  }
};

// Delete developer
export const deleteDeveloper = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id)
      return res.status(400).json({ message: "Developer ID is required." });

    const developer = await Developer.findByIdAndDelete(id);

    if (!developer)
      return res.status(400).json({ message: "Developer not found." });

    res
      .status(200)
      .json({ message: "Developer deleted successfully", data: developer });
  } catch (error) {
    next(error);
  }
};

// Enable developer by ID
export const enableDeveloperById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id)
      return res.status(400).json({ message: "Developer ID is required." });

    const developer = await Developer.findByIdAndUpdate(
      id,
      { status: true },
      { new: true }
    );

    if (!developer)
      return res.status(400).json({ message: "Developer not found." });

    await LOGINMAPPING.findOneAndUpdate(
      { dataid: developer.dataid },
      { $set: { status: true } },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Developer enabled successfully", developer });
  } catch (error) {
    next(error);
  }
};

// Disable developer by ID
export const disableDeveloperById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id)
      return res.status(400).json({ message: "Developer ID is required." });

    const developer = await Developer.findByIdAndUpdate(
      id,
      { status: false },
      { new: true }
    );

    if (!developer)
      return res.status(400).json({ message: "Developer not found." });

    await LOGINMAPPING.findOneAndUpdate(
      { dataid: developer.dataid },
      { $set: { status: false } },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Developer disabled successfully", developer });
  } catch (error) {
    next(error);
  }
};

// Enable all developers
export const enableAllDevelopers = async (req, res, next) => {
  try {
    await Developer.updateMany({}, { status: true });
    res.status(200).json({ message: "All developers enabled successfully" });
    await LOGINMAPPING.updateMany({}, { status: true });
  } catch (error) {
    next(error);
  }
};

// Disable all developers
export const disableAllDevelopers = async (req, res, next) => {
  try {
    const { developers } = req.body;

    await Promise.all(
      developers.map(async (item) => {
        const dev = await Developer.findByIdAndUpdate(item, {
          $set: { status: false },
        });

        if (!dev) {
          return res.status(404).json({
            message: ` some Developers not found ${item} from your selection`,
          });
        }

        await LOGINMAPPING.findOneAndUpdate(
          { dataid: dev.dataid },
          { $set: { status: false } }
        );
      })
    );
    res.status(200).json({ message: "Developers Disable" });
  } catch (error) {
    res.status(500).json({
      message: "Error in disable Developers",
      message2: error.message,
    });
  }
};

// Export data as CSV
export const exportCSV = async (req, res, next) => {
  try {
    const { developers } = req.body;

    if (!developers || developers.length === 0) {
      return res.status(400).json({ message: "No developer IDs provided." });
    }

    // Fetch the selected partners from the database
    const selectedDevelopers = await Developer.find({
      _id: { $in: developers },
    });

    // Remove unnecessary fields
    const developersWithoutId = selectedDevelopers.map((developer) => {
      const { _id, dataid, __v, updatedAt, logo, added_by, ...rest } =
        developer.toObject();
      return rest;
    });

    // Convert data to CSV format
    const csv = parse(developersWithoutId);

    // Set the appropriate headers to trigger a file download
    res.header("Content-Type", "text/csv");
    res.attachment("developers.csv"); // Set the filename for download
    res.status(200).send(csv); // Send the CSV data directly
  } catch (error) {
    next(error);
  }
};

// upload developer profile photo
export const handleFileUpload = async (req, res, next) => {
  try {
    const { devdataid } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    //Check if partner logo alredy exists
    const devLogo = await Developer.findOne({ dataid: devdataid });

    if (devLogo && devLogo.logo && devLogo.logo.filepath) {
      // Get the existing logo file path
      const existingFilePath = path.join(
        __dirname,
        "..",
        devLogo.logo.filepath
      );

      // Check if the file exists and remove it
      if (fs.existsSync(existingFilePath)) {
        fs.unlinkSync(existingFilePath);
      }
    }

    // Prepare the file details
    const logoDetails = {
      filetype: req.file.mimetype,
      filesize: req.file.size.toString(),
      filepath: `uploads/developer/logo/${req.file.filename}`, // Ensure path matches destination
      filename: req.file.filename,
    };

    const updatedDeveloper = await Developer.findOneAndUpdate(
      { dataid: devdataid },
      { $set: { profile: logoDetails } },
      { new: true } // Return the updated document
    );

    if (!updatedDeveloper) {
      return res.status(404).json({ error: "Developer not found", data: [] });
    }

    res.status(200).json({
      message: "Logo uploaded successfully",
      logoDetails: logoDetails,
      data: updatedDeveloper,
    });
  } catch (err) {
    next(err);
  }
};

export const getDeveloperByCompanyId = async (req, res, next) => {
  try {
    const { companyid } = req.params;

    if (!companyid)
      return res.status(404).json({ message: "company id is not found" });

    const company = await COMPANY.findById(companyid);

    if (!company) return res.status(404).json({ message: "Company not found" });

    const developer = await Developer.findById(company.developer);

    if (!developer) {
      return res
        .status(200)
        .json({ message: "There are no developers", data: [] });
    }

    const developers = [];
    developers.push(developer);

    return res
      .status(200)
      .json({ message: "developer retrived successfully", data: developers });
  } catch (err) {
    next(err);
  }
};

// upload AI generated Photos by the Developer
// check who upload photoShoot company or Manager
const findModelById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid ID in findModelById");
  }

  const company = await COMPANY.findById(id);
  if (company) return "company";

  const manager = await CMANAGER.findById(id);
  if (manager) return "cmanager";

  throw new Error("ID not found in COMPANY or CMANAGER");
};

// Developer uploads photos
export const uploadPhotos = async (req, res) => {
  try {
    const { foldername } = req.params;
    const { developerId } = req.body;
    const photos = req.files;

    console.log("Photos in controller--->", photos);

    // Validate inputs
    if (!developerId || !foldername || !photos || photos.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid input data or no photos uploaded." });
    }

    // Find the upload document matching the refPath
    const upload = await Upload.findOne({ folderName: foldername })
      .populate("createdBy")
      .populate("company");

    if (!upload) {
      return res.status(404).json({ message: "Upload not found." });
    }

    const developer = await Developer.findById(developerId);
    if (!developer) {
      return res
        .status(404)
        .json({ message: "Developer not found or unauthorized." });
    }

    // Convert photos to webp
    const photoesFilePath = await Promise.all(
      photos.map(async (photo) => {
        return await convertToWebpPhotoshoot(photo.path);
      })
    );

    console.log("Photos file path", photoesFilePath);

    // Update the `photoshoot` array in both `upload` and `developer` documents
    upload.photoshoot.push(...photoesFilePath);
    await upload.save();

    const managerOrCompanyId = upload.createdBy._id; // Company or Manager

    let managerOrCompany = "";
    try {
      managerOrCompany = await findModelById(managerOrCompanyId);
      console.log(managerOrCompany);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const existTransaction = await CREDITTRANSACTION.find({
      fromId: managerOrCompanyId,
      toId: upload._id,
    });

    if (existTransaction.length === 0) {
      developer.photoshoot.push(upload._id);

      // Record the transaction
      const transaction = new CREDITTRANSACTION({
        transactionId: generateTransactionId(upload._id),
        fromRole: managerOrCompany,
        fromId: managerOrCompanyId,
        toRole: "Upload",
        toId: upload._id,
        amount: 1,
        coin_type: upload.photoshootType === "multiple" ? "gold" : "blue",
        transactionType: "debit",
        purpose: "expense",
        notes: `One credit expense on photoshoot`,
      });

      let photoshootType = upload.photoshootType;
      let company = upload.company;

      if (photoshootType === "multiple") {
        if (company.gold_balance <= 0) {
          return res.status(400).json({ message: "Not enough gold coin." });
        }

        company.gold_balance -= 1;
        await company.save();
      } else if (photoshootType === "single") {
        if (company.credit_balance <= 0) {
          return res.status(400).json({ message: "Not enough blue coin." });
        }

        company.credit_balance -= 1;
        await company.save();
      }

      await developer.save();
      await transaction.save();
    }

    // Respond with success
    res.status(200).json({
      message: "Photos uploaded successfully.",
    });
  } catch (error) {
    console.error("Error in uploadPhotos:", error);
    res.status(500).json({ message: "Server error.", error });
  }
};

export const deleteuploadedPhoto = async (req, res) => {
  try {
    const { foldername } = req.body;
    const upload = await Upload.findOne({ folderName: foldername });

    if (!upload) {
      return res.status(404).json({ message: "Upload not found." });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error.", message2: error.message });
  }
};

export const getCountByDeveloper = async (req, res) => {
  const { developerid } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(developerid)) {
      return res.status(400).json({ message: "Invalid Developer ID" });
    }

    const developer = await Developer.findById(developerid);
    if (!developer)
      return res.status(404).json({ message: "Developer not found." });

    const companies = developer.companies;
    if (!companies.length) {
      return res.status(200).json({
        totalPhotoshoot: 0,
        completedPhotoshoot: 0,
        pendingPhotoshoot: 0,
      });
    }

    // Fetch all companies at once (Avoids multiple DB calls)
    const existingCompanies = await COMPANY.find({ _id: { $in: companies } });

    if (!existingCompanies.length) {
      return res.status(200).json({
        totalPhotoshoot: 0,
        completedPhotoshoot: 0,
        pendingPhotoshoot: 0,
      });
    }

    let total = 0;
    let pending = 0;

    // Fetch all uploads for these companies in one query
    const uploads = await Upload.find({ company: { $in: companies } });

    total = uploads.length;
    pending = uploads.filter((up) => !up.isphotoshootcomplete).length;
    const completed = total - pending;

    res.status(200).json({
      totalPhotoshoot: total,
      completedPhotoshoot: completed,
      pendingPhotoshoot: pending,
    });
  } catch (error) {
    console.error("Error in getCountByDeveloper:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const removePhoto = async (req, res, next) => {
  try {
    const { uploadId } = req.params;
    const { filePath } = req.body;

    if (!uploadId || !filePath)
      return res.status(400).json({ message: "please provide all details." });

    let absolutePath = path.join(__dirname, "..", filePath);

    //Check if the file exist or not
    fs.access(absolutePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ message: "File not found" });
      }

      // Delete the file
      fs.unlink(absolutePath, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error deleting file", error: err });
        }
      });
    });

    const updateUpload = await Upload.findByIdAndUpdate(
      uploadId,
      { $pull: { photoshoot: filePath } },
      { new: true }
    );

    if (!updateUpload)
      return res.status(404).json({ message: "Upload folder not found" });

    return res.status(200).json({ message: "Photo deleted successfully." });
  } catch (err) {
    next(err);
  }
};
