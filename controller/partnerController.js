import bcryptjs from "bcryptjs";
import LOGINMAPPING from "../models/LOGINMAPPING.js";
import mongoose from "mongoose";
import PARTNER from "../models/PARTNER.js";
import COMPANY from "../models/COMPANY.js";
import UPLOAD from "../models/UPLOAD.js";
import { parse } from "json2csv";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
// Get the current file's path
const __filename = fileURLToPath(import.meta.url);

// Get the current directory's path
const __dirname = path.dirname(__filename);

// Get All  The partners
export const getAllpartner = async (req, res, next) => {
  try {
    let searchQuery = req.query.searchQuery || "";

    let query = {};

    if (searchQuery.length > 0) {
      const searchRegx = new RegExp(searchQuery, "i");
      query["$or"] = [
        { org_name: searchRegx },
        { website: searchRegx },
        { gstno: searchRegx },
        { pancard: searchRegx },
        { email: searchRegx },
        { userid: searchRegx },
        { mobileno: searchRegx },
        { designation: searchRegx },
      ];
    }

    const partners = await PARTNER.find(query);

    if (partners.length === 0) {
      return res.status(404).json({ message: "Partner not found" });
    }

    const active = partners.filter((partner) => partner.status === true);

    const disable = partners.filter((partner) => partner.status === false);
    const sortedpartners = [...active, ...disable];

    return res
      .status(202)
      .json({ data: sortedpartners, message: "All Partner found" });
  } catch (err) {
    next(err);
  }
};

// Route to get a specific partner by ID
export const getpartnerByid = async (req, res, next) => {
  try {
    const { id } = req.params;

    const partner = await PARTNER.findOne({ dataid: id });

    if (!partner) {
      return res.status(404).json({ message: "specific Partner not found" });
    }

    return res.status(202).json({ partner, message: "Partner Found" });
  } catch (error) {
    next(error);
  }
};

// Update specific partner
export const updatePartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // inncase from here want to add the logo
    // if (req.file) {
    //   const logoDetails = {
    //     filetype: req.file.mimetype,
    //     filesize: req.file.size.toString(), // File size in bytes (converted to string)
    //     filepath: `uploads/partner/logo/${req.file.filename}`, // Correct relative path
    //     filename: req.file.filename,
    //   };
    //   updateData.logo = logoDetails;
    // }

    const updatedPartner = await PARTNER.findOneAndUpdate(
      { dataid: id },
      updateData,
      {
        new: true,
      }
    );

    if (!updatedPartner) {
      return res.status(404).json({ message: "Specific Partner not found" });
    }

    if (updateData.email) {
      const loginMapping = await LOGINMAPPING.findOneAndUpdate(
        { dataid: id },
        { email: updateData.email },
        { new: true }
      );

      if (!loginMapping) {
        return res.status(404).json({
          message: "Loginmapping update Not Happen Something Went Wrong",
        });
      }
    }

    return res.status(200).json({
      data: updatedPartner,
      message: "Partner updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// enable partners
export const enablePartner = async (req, res, next) => {
  try {
    const { partners } = req.body;

    if (partners.length === 0) {
      return res.status(400).json({ message: "Select partners from the list" });
    }

    for (const item of partners) {
      const partner = await PARTNER.findByIdAndUpdate(
        item,
        { $set: { status: true } },
        { new: true }
      );

      if (!partner) {
        return res
          .status(404)
          .json({ message: `Partner with ID ${item} not found` });
      }

      const loginMapping = await LOGINMAPPING.findOneAndUpdate(
        { dataid: partner.dataid },
        { $set: { status: true } },
        { new: true }
      );

      if (!loginMapping) {
        console.warn(`Login mapping not found for partner ID: ${item}`);
      }
    }

    res.status(200).json({ message: "Partners enabled successfully" });
  } catch (error) {
    next(error);
  }
};

// Disable partners
export const disablePartner = async (req, res, next) => {
  try {
    const { partners } = req.body;

    if (partners.length === 0) {
      return res.status(400).json({ message: "Select partners from list" });
    }

    for (const item of partners) {
      const partner = await PARTNER.findByIdAndUpdate(
        item,
        { $set: { status: false } },
        { new: true } // Ensures you get the updated document
      );

      if (!partner) {
        return res
          .status(404)
          .json({ message: `Partner with ID ${item} not found` });
      }

      const loginMapping = await LOGINMAPPING.findOneAndUpdate(
        { dataid: partner.dataid }, // Use updated partner's dataid
        { $set: { status: false } },
        { new: true }
      );

      if (!loginMapping) {
        console.warn(`Login mapping not found for partner ID: ${item}`);
      }
    }

    res.status(200).json({ message: "Partners disabled successfully" });
  } catch (error) {
    next(error);
  }
};

//For Enable Company by id
export const enablePartnerById = async (req, res, next) => {
  try {
    const partner = await PARTNER.findOne({ dataid: req.params.id });
    if (!partner)
      return res.status(404).json({ message: "Partner not found by id" });

    await PARTNER.findOneAndUpdate(
      { dataid: req.params.id },
      { $set: { status: true } }
    );

    await LOGINMAPPING.findOneAndUpdate(
      { dataid: req.params.id },
      { $set: { status: true } }
    );

    return res.status(200).json({ message: "Sucecssfully Partner Enabled." });
  } catch (err) {
    next(err);
  }
};

//For Disable Company by id
export const disablePartnerById = async (req, res, next) => {
  try {
    const partner = await PARTNER.findOne({ dataid: req.params.id });
    if (!partner)
      return res.status(404).json({ message: "Partner not found by id" });

    await PARTNER.findOneAndUpdate(
      { dataid: req.params.id },
      { $set: { status: false } }
    );

    await LOGINMAPPING.findOneAndUpdate(
      { dataid: req.params.id },
      { $set: { status: false } }
    );

    return res.status(200).json({ message: "Successfully Partner Disabled" });
  } catch (err) {
    next(err);
  }
};

// Export partners
export const exportPartners = async (req, res, next) => {
  try {
    const { partners } = req.body;

    if (!partners || partners.length === 0) {
      return res.status(400).json({ message: "No partner IDs provided." });
    }

    // Fetch the selected partners from the database
    const selectedPartners = await PARTNER.find({ _id: { $in: partners } });

    // Remove unnecessary fields
    const partnersWithoutId = selectedPartners.map((partner) => {
      const { _id, dataid, __v, updatedAt, logo, added_by, ...rest } =
        partner.toObject();
      return rest;
    });

    // Convert data to CSV format
    const csv = parse(partnersWithoutId);

    // Set the appropriate headers to trigger a file download
    res.header("Content-Type", "text/csv");
    res.attachment("partners.csv"); // Set the filename for download
    res.status(200).send(csv); // Send the CSV data directly
  } catch (error) {
    next(error);
  }
};

export const getCompaniesByPartnerId = async (req, res, next) => {
  try {
    const { id: partnerId } = req.params;

    let query = {
      "added_by.userid": new ObjectId(partnerId), // Convert to ObjectId
      "added_by.role": "partner",
    };

    const companies = await COMPANY.find(query); // Correct usage

    res
      .status(200)
      .json({ data: companies, message: "Companies retrieved successfully" });
  } catch (error) {
    next(error);
  }
};

// Logo for Patner
export const handleFileUpload = async (req, res, next) => {
  try {
    const { partnerid } = req.params;

    if (!req.file) {
      // Use req.file for single file uploads
      return res.status(400).json({ error: "No file uploaded" });
    }

    //Check if partner logo alredy exists
    const partnerLogo = await PARTNER.findOne({ dataid: partnerid });

    if (partnerLogo && partnerLogo.logo && partnerLogo.logo.filepath) {
      // Get the existing logo file path
      const existingFilePath = path.join(
        __dirname,
        "..",
        partnerLogo.logo.filepath
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
      filepath: `uploads/partner/logo/${req.file.filename}`, // Ensure path matches destination
      filename: req.file.filename,
    };

    const updatedPartner = await PARTNER.findOneAndUpdate(
      { dataid: partnerid },
      { $set: { logo: logoDetails } },
      { new: true } // Return the updated document
    );

    if (!updatedPartner) {
      return res.status(404).json({ error: "Partner not found" });
    }

    res.status(200).json({
      message: "Logo uploaded successfully",
      logoDetails: logoDetails,
      partner: updatedPartner,
    });
  } catch (err) {
    next(err);
  }
};

// Total Count of Partners
export const totalpartner = async (req, res, next) => {
  try {
    // Use Mongoose's countDocuments method to get the total count
    const totalCompanies = await PARTNER.countDocuments();
    return res.status(200).json({
      message: "Total number of Partner",
      totalCompanies: totalCompanies,
    });
  } catch (err) {
    next(err);
  }
};

export const getTotalCreadits = async (req, res, next) => {
  try {
    const { id } = req.params;
    const partner = await PARTNER.findById(id);

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    res.status(200).json({ credit_balance: partner.credit_balance });
  } catch (err) {
    next(err);
  }
};

export const getTotalGoldCoins = async (req, res, next) => {
  try {
    const { id } = req.params;

    const partner = await PARTNER.findById(id);

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    res.status(200).json({ gold_coins: partner.gold_balance });
  } catch (err) {
    next(err);
  }
};

// Controller to get dashboard count
export const getCountByPartner = async (req, res) => {
  const { partnerId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({ message: "Invalid partner ID" });
    }

    const companies = await COMPANY.find({ "added_by.userid": partnerId });
    const totalCompanies = companies.length;
    const companyIds = companies.map((company) => company._id);

    let totalPhotoshoot = 0;
    let completedPhotoshoot = 0;
    let pendingPhotoshoot = 0;

    for (const companyId of companyIds) {
      const companyTotal = await UPLOAD.countDocuments({ company: companyId });
      const companyCompleted = await UPLOAD.countDocuments({
        company: companyId,
        isphotoshootcomplete: true,
      });
      totalPhotoshoot += companyTotal;
      completedPhotoshoot += companyCompleted;
    }
    pendingPhotoshoot = totalPhotoshoot - completedPhotoshoot;

    res.status(200).json({
      totalCompanies,
      totalPhotoshoot,
      completedPhotoshoot,
      pendingPhotoshoot,
    });
  } catch (error) {
    console.error("Error in getDashboardCount:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
