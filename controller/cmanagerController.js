import bcryptjs from "bcryptjs";
import COMPANY from "../models/COMPANY.js";
import CMANAGER from "../models/CMANAGER.js";
import UPLOAD from "../models/UPLOAD.js";
import CREDITTRANSACTION from "../models/CREDITTRANSACTION.js";
import LOGINMAPPING from "../models/LOGINMAPPING.js";
import { parse } from "json2csv";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get all cmanager entries
export const getAllCmanagers = async (req, res) => {
  try {
    let searchQuery = req.query.searchQuery || "";

    let query = {};

    if (searchQuery.length > 0) {
      const searchRegx = new RegExp(searchQuery, "i");

      query["$or"] = [
        { name: searchRegx }, // Search by name
        { email: searchRegx }, // Search by email
        { mobileno: searchRegx }, // Search by mobile number
        { dataid: searchRegx }, // Search by dataid
        { credit_balance: parseFloat(searchQuery) }, // Search by credit_balance
      ];
    }

    const cmanagers = await CMANAGER.find(query).populate(
      "assignto",
      "categoryName"
    );

    if (cmanagers.length === 0) {
      return res.status(404).json({ message: "No cmanagers found" });
    }

    const sortedCmanagers = cmanagers.sort((a, b) => b.createdAt - a.createdAt);

    return res.status(202).json({
      success: true,
      data: sortedCmanagers,
      message: "All cmanagers found",
    });
  } catch (error) {
    console.error("Error from getAllCmanagers:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error in getAllCmanagers",
      error: error.message,
    });
  }
};

// Get a single cmanager by ID
export const getCmanagerById = async (req, res) => {
  try {
    const { id } = req.params;
    const cmanager = await CMANAGER.findById(id);

    if (!cmanager) {
      return res
        .status(404)
        .json({ success: false, message: "Cmanager not found" });
    }

    res.status(200).json({ success: true, data: cmanager });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching cmanager", error });
  }
};

// Update a cmanager entry
export const updateCmanager = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Step 1: Update Cmanager Data
    const updatedCmanager = await CMANAGER.findOneAndUpdate(
      { dataid: id },
      updates,
      { new: true }
    );

    if (!updatedCmanager) {
      return res
        .status(404)
        .json({ success: false, message: "Cmanager not found" });
    }

    // Step 2: Check if email or password needs to be updated
    let updateFields = {};
    if (updates.email) {
      updateFields.email = updates.email;
    }
    // If there's anything to update in LOGINMAPPING, proceed
    if (Object.keys(updateFields).length > 0) {
      const updatedLoginMapping = await LOGINMAPPING.findOneAndUpdate(
        { dataid: id },
        updateFields,
        { new: true }
      );

      if (!updatedLoginMapping) {
        return res
          .status(404)
          .json({ success: false, message: "LoginMapping not found" });
      }
    }

    res.status(200).json({
      success: true,
      message: "Cmanager updated successfully",
      data: updatedCmanager,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating Cmanager",
      erro: error.message,
    });
  }
};

// Enable a specific cmanager
export const enableCmanager = async (req, res) => {
  try {
    const { id } = req.params;

    const cmanager = await CMANAGER.findByIdAndUpdate(
      id,
      { status: true }, // Assuming isEnabled is a field in CMANAGER schema
      { new: true }
    );

    if (!cmanager) {
      return res
        .status(404)
        .json({ success: false, message: "Cmanager not found" });
    }

    await LOGINMAPPING.findOneAndUpdate(
      { dataid: cmanager.dataid },
      { $set: { status: true } }
    );

    return res.status(200).json({
      success: true,
      message: "Cmanager enabled successfully",
      data: cmanager,
    });
  } catch (err) {
    console.error("Error from enableCmanager:", err.message);
    res.status(500).json({
      success: false,
      message: "Error enabling cmanager",
      error: err.message,
    });
  }
};

// Disable a specific cmanager
export const disableCmanager = async (req, res) => {
  try {
    const { id } = req.params;

    const cmanager = await CMANAGER.findByIdAndUpdate(
      id,
      { status: false }, // Assuming isEnabled is a field in CMANAGER schema
      { new: true }
    );

    if (!cmanager) {
      return res
        .status(404)
        .json({ success: false, message: "Cmanager not found" });
    }

    await LOGINMAPPING.findOneAndUpdate(
      { dataid: cmanager.dataid },
      { $set: { status: false } }
    );

    return res.status(200).json({
      success: true,
      message: "Cmanager disabled successfully",
      data: cmanager,
    });
  } catch (err) {
    console.error("Error from disableCmanager:", err.message);
    res.status(500).json({
      success: false,
      message: "Error disabling cmanager",
      error: err.message,
    });
  }
};

// Disable selective cmanagers by their IDs
export const disableSelectiveCManagerId = async (req, res, next) => {
  try {
    const { cmanagerIds } = req.body;

    if (!Array.isArray(cmanagerIds) || cmanagerIds.length === 0) {
      return res.status(400).json({ message: "No cmanager IDs provided" });
    }

    await Promise.all(
      cmanagerIds.map(async (id) => {
        const cmanager = await CMANAGER.findByIdAndUpdate(
          id,
          { $set: { status: false } },
          { new: true }
        );

        if (!cmanager) {
          return res.status(404).json({
            message: `CManager not found with ID: ${id}`,
          });
        }
        await LOGINMAPPING.findOneAndUpdate(
          { dataid: cmanager.dataid },
          { $set: { status: false } }
        );
      })
    );

    res.status(200).json({ message: "CManagers disabled successfully" });
  } catch (err) {
    console.error("Error in disableSelectiveCManagerId:", err.message);
    next(err);
  }
};

export const enableSelectiveCManagerId = async (req, res, next) => {
  try {
    const { cmanagerIds } = req.body;

    if (!Array.isArray(cmanagerIds) || cmanagerIds.length === 0) {
      return res.status(400).json({ message: "No cmanager IDs provided" });
    }

    await Promise.all(
      cmanagerIds.map(async (id) => {
        const cmanager = await CMANAGER.findByIdAndUpdate(
          id,
          { $set: { status: true } },
          { new: true }
        );

        if (!cmanager) {
          return res.status(404).json({
            message: `CManager not found with ID: ${id}`,
          });
        }
        await LOGINMAPPING.findOneAndUpdate(
          { dataid: cmanager.dataid },
          { $set: { status: true } }
        );
      })
    );

    res.status(200).json({ message: "CManagers enabled successfully" });
  } catch (err) {
    console.error("Error in enableSelectiveCManagerId:", err.message);
    next(err);
  }
};

// total categories count
export const totalCategory = async (req, res, next) => {
  try {
    const totalCategories = await Category.countDocuments();
    return res.status(200).json({
      message: "Total number of Categories",
      totalCategories: totalCategories,
    });
  } catch (err) {
    next(err);
  }
};

// Disable all Cmanagers /// ⭐⭐⭐⭐⭐
export const disableAllCmanagers = async (req, res) => {
  try {
    const result = await CMANAGER.updateMany({}, { status: false }); // Update all entries

    if (result.modifiedCount === 0) {
      return res.status(200).json({
        success: true,
        message: "No cmanagers to disable",
      });
    }

    await LOGINMAPPING.updateMany({}, { status: false });

    return res.status(200).json({
      success: true,
      message: `Disabled all cmanagers. Total updated: ${result.nModified}`,
    });
  } catch (err) {
    console.error("Error from disableAllCmanagers:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error disabling all cmanagers",
      error: err.message,
    });
  }
};

export const exportCmanagers = async (req, res, next) => {
  try {
    // Extract the array of cmanager IDs from the request body
    const { cmanagers } = req.body;

    // Fetch the cmanagers that match the provided IDs
    const selectedCmanagers = await CMANAGER.find({
      _id: { $in: cmanagers },
    }).populate("assignto", "name");

    // Transform the cmanagers data by excluding certain fields
    const cmanagersWithoutSensitiveData = selectedCmanagers.map((cmanager) => {
      const { _id, __v, photo, createdAt, updatedAt, ...filteredData } =
        cmanager.toObject();

      return {
        ...filteredData,
        assignto: cmanager.assignto?.name || "Unassigned", // Include the name of the company from the populated field
      };
    });

    // Convert the transformed data into a CSV format
    const csv = parse(cmanagersWithoutSensitiveData);

    // Set the appropriate headers for CSV download
    res.header("Content-Type", "text/csv");
    res.attachment("cmanagers.csv"); // Set the filename for the downloaded file

    // Send the CSV content as a response
    res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting cmanagers:", error.message);
    next(error); // Pass errors to the error-handling middleware
  }
};

export const totalcoins = async (req, res, next) => {
  try {
    const { managerid } = req.params;

    const cmanager = await CMANAGER.findById(managerid);

    if (!cmanager) {
      return res.status(404).json({ message: "cmanager not found" });
    }

    const company = await COMPANY.findById(cmanager.assignto);

    if (!company) return res.status(404).json({ message: "company not found" });

    res.status(200).json({ credit_balance: company.credit_balance });
  } catch (err) {
    next(err);
  }
};

export const getGoldCoins = async (req, res, next) => {
  try {
    const { managerid } = req.params;

    const cmanager = await CMANAGER.findById(managerid);

    if (!cmanager) {
      return res.status(404).json({ message: "cmanager not found" });
    }

    const company = await COMPANY.findById(cmanager.assignto);

    if (!company) return res.status(404).json({ message: "company not found" });

    res.status(200).json({ gold_coins: company.gold_balance });
  } catch (err) {
    next(err);
  }
};

export const getCountByCompanyId = async (req, res, next) => {
  try {
    const { companyid } = req.params;
    const managercount = await CMANAGER.find({
      assignto: companyid,
    }).countDocuments();
    return res
      .status(200)
      .json({ data: managercount, message: "maanger count retrived." });
  } catch (err) {
    next(err);
  }
};

export const getManagerByCompanyId = async (req, res, next) => {
  try {
    const { companyid } = req.params;
    const managers = await CMANAGER.find({ assignto: companyid });
    return res
      .status(200)
      .json({ data: managers, message: "Managers details retrived." });
  } catch (err) {
    next(err);
  }
};

//Helper function  for get manager
export const getCManagerByCid = async (companyid) => {
  const manager = await CMANAGER.find({ assignto: companyid });
  return manager;
};

export const getCountByManagerId = async (req, res) => {
  try {
    const { managerId } = req.params;

    // Find uploads created by the given manager ID
    const uploads = await UPLOAD.find({ createdBy: managerId });
    const totalUploads = uploads.length;
    const completedPhotoshoots = uploads.filter(
      (upload) => upload.isphotoshootcomplete
    ).length;
    const pendingPhotoshoots = totalUploads - completedPhotoshoots;

    res.status(200).json({
      totalUploads,
      completedPhotoshoots,
      pendingPhotoshoots,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getModalsTransaction = async (req, res, next) => {
  try {
    const { managerId } = req.params;

    if (!managerId)
      return res.status(200).json({
        message: "manager id is not provided",
      });

    const transactions = await CREDITTRANSACTION.find({
      fromId: managerId,
    }).populate("toId");

    return res
      .status(200)
      .json({ message: "Transactions retrived", data: transactions });
  } catch (err) {
    next(err);
  }
};

// Upload CManager profile photo
export const handleCManagerFileUpload = async (req, res, next) => {
  try {
    const { cmdataid } = req.params; // Get CManager's unique ID from params

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Check if the CManager already has a profile photo
    const existingCManager = await CMANAGER.findOne({ dataid: cmdataid });

    if (
      existingCManager &&
      existingCManager.photo &&
      existingCManager.photo.filepath
    ) {
      // Get the existing photo file path
      const existingFilePath = path.join(
        __dirname,
        "..",
        existingCManager.photo.filepath
      );

      // Check if the file exists and remove it
      if (fs.existsSync(existingFilePath)) {
        fs.unlinkSync(existingFilePath);
      }
    }

    // Prepare the file details
    const photoDetails = {
      filetype: req.file.mimetype,
      fileSize: req.file.size.toString(),
      filepath: `uploads/cmanager/logo/${req.file.filename}`, // Ensure correct upload path
      filename: req.file.filename,
    };

    // Update CManager's profile with the new photo details
    const updatedCManager = await CMANAGER.findOneAndUpdate(
      { dataid: cmdataid },
      { $set: { photo: photoDetails } },
      { new: true } // Return the updated document
    );

    if (!updatedCManager) {
      return res.status(404).json({ error: "CManager not found", data: [] });
    }

    res.status(200).json({
      message: "Profile photo uploaded successfully",
      photoDetails: photoDetails,
      data: updatedCManager,
    });
  } catch (err) {
    next(err);
  }
};
