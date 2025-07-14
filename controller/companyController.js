import bcryptjs from "bcryptjs";
import LOGINMAPPING from "../models/LOGINMAPPING.js";
import COMPANY from "../models/COMPANY.js";
import mongoose from "mongoose";
import CMANAGER from "../models/CMANAGER.js";
import DEVELOPER from "../models/DEVELOPER.js";
import UPLOAD from "../models/UPLOAD.js";
import { parse } from "json2csv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getUploadsCountByCId } from "./uploadController.js";
import { getCManagerByCid } from "./cmanagerController.js";

// Get the current file's path
const __filename = fileURLToPath(import.meta.url);

// Get the current directory's path
const __dirname = path.dirname(__filename);

//For get all company with search
export const getAllCompany = async (req, res, next) => {
  try {
    const searchQuery = req.query.searchQuery || "";
    let companies = {};
    if (searchQuery.length > 0) {
      const searchRegx = new RegExp(searchQuery, "i");
      companies["$or"] = [
        { company_name: searchRegx },
        { website: searchRegx },
        { gstno: searchRegx },
        { pancard: searchRegx },
        { email: searchRegx },
        { dataid: searchRegx },
        { mobileno: searchRegx },
        { designation: searchRegx },
      ];
    }

    const company = await COMPANY.find(companies);

    if (company.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    const active = company.filter((item) => item.status === true);
    const disable = company.filter((item) => item.status === false);

    const sortedSuperAdmins = [...active, ...disable];

    res.status(200).json({
      message: "Successfully All companies geted",
      data: sortedSuperAdmins,
    });
  } catch (err) {
    next(err);
  }
};

//For get the company by id
export const getCompanyById = async (req, res, next) => {
  try {
    const company = await COMPANY.findOne({ dataid: req.params.id });
    if (!company)
      return res.status(404).json({ message: "Company not found by id." });

    return res
      .status(200)
      .json({ message: "Successfully Company get by id.", data: company });
  } catch (err) {
    next(err);
  }
};

//For update Company by id
export const updateCompanyById = async (req, res, next) => {
  try {
    const updates = req.body;
    const company = await COMPANY.findOne({ dataid: req.params.id });
    if (!company)
      return res.status(404).json({ message: "Company not found by id" });

    const updatedCompany = await COMPANY.findOneAndUpdate(
      { dataid: req.params.id },
      { $set: req.body },
      { new: true }
    );

    if (updates.email) {
      const loginMapping = await LOGINMAPPING.findOneAndUpdate(
        { dataid: req.params.id },
        { email: updates.email },
        { new: true }
      );

      if (!loginMapping) {
        return res
          .status(400)
          .json({ message: "loginMapping not found by id." });
      }
    }

    return res.status(200).json({
      data: updatedCompany,
      message: "Successfully Company update by id.",
    });
  } catch (err) {
    next(err);
  }
};

//For Enable Company by id
export const enableCompanyById = async (req, res, next) => {
  try {
    const company = await COMPANY.findOne({ dataid: req.params.id });
    if (!company)
      return res.status(404).json({ message: "Company not found by id" });

    await COMPANY.findOneAndUpdate(
      { dataid: req.params.id },
      { $set: { status: true } }
    );

    await LOGINMAPPING.findOneAndUpdate(
      { dataid: req.params.id },
      { $set: { status: true } }
    );

    return res.status(200).json({ message: "Sucecssfully Company Enabled." });
  } catch (err) {
    next(err);
  }
};

//For Disable Company by id
export const disableCompanyById = async (req, res, next) => {
  try {
    const company = await COMPANY.findOne({ dataid: req.params.id });
    if (!company)
      return res.status(404).json({ message: "Company not found by id" });

    await COMPANY.findOneAndUpdate(
      { dataid: req.params.id },
      { $set: { status: false } }
    );

    await LOGINMAPPING.findOneAndUpdate(
      { dataid: req.params.id },
      { $set: { status: false } }
    );

    return res.status(200).json({ message: "Successfully Company Disabled" });
  } catch (err) {
    next(err);
  }
};

//For Enable All Selective Company
export const enableAllSelectiveId = async (req, res, next) => {
  try {
    const { companies } = req.body;
    await Promise.all(
      companies.map(async (item) => {
        const company = await COMPANY.findByIdAndUpdate(item, {
          $set: { status: true },
        });
        if (!company) {
          return res.status(404).json({ message: "Company not found" });
        }

        const loginMapping = await LOGINMAPPING.findOneAndUpdate(
          { dataid: company.dataid },
          {
            $set: { status: true },
            new: true,
          }
        );
      })
    );

    res.status(200).json({ message: "All Selective company enabled." });
  } catch (err) {
    next(err);
  }
};

//For Disable All Selective Company
export const disableAllSelectiveId = async (req, res, next) => {
  try {
    const { companies } = req.body;
    await Promise.all(
      companies.map(async (item) => {
        console.log(item);
        const company = await COMPANY.findByIdAndUpdate(item, {
          $set: { status: false },
        });
        if (!company) {
          return res.status(404).json({ message: "Company not found" });
        }

        const loginMapping = await LOGINMAPPING.findOneAndUpdate(
          { dataid: company.dataid },
          {
            $set: { status: false },
            new: true,
          }
        );
      })
    );
    res.status(200).json({ message: "All selective company disabled" });
  } catch (err) {
    next(err);
  }
};

export const exportCompany = async (req, res, next) => {
  try {
    const { companies } = req.body;

    // Fetch companies from database
    const selectedCompanies = await COMPANY.find({ _id: { $in: companies } });

    // Remove unwanted fields
    const companiesWithoutId = selectedCompanies.map((company) => {
      const { _id, __v, logo, added_by, updatedAt, ...cleanCompany } =
        company.toObject();
      return cleanCompany;
    });

    // Convert JSON to CSV format
    const csv = parse(companiesWithoutId);

    // Set response headers to force file download
    res.header("Content-Type", "text/csv");
    res.attachment("companies.csv"); // Sets filename for download
    return res.status(200).send(csv); // Send CSV file content
  } catch (error) {
    next(error);
  }
};

export const handleFileUpload = async (req, res, next) => {
  try {
    const { companyid } = req.params;

    if (!req.file) {
      // Use req.file for single file uploads
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Check if company logo already exists
    const companyLogo = await COMPANY.findOne({ dataid: companyid });

    if (companyLogo && companyLogo.logo && companyLogo.logo.filepath) {
      // Get the existing logo file path
      const existingFilePath = path.join(
        __dirname,
        "..",
        companyLogo.logo.filepath
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
      filepath: `uploads/company/logo/${req.file.filename}`, // Ensure path matches destination
      filename: req.file.filename,
    };

    const updatedCompany = await COMPANY.findOneAndUpdate(
      { dataid: companyid },
      { $set: { logo: logoDetails } },
      { new: true } // Return the updated document
    );

    if (!updatedCompany) {
      return res.status(404).json({ error: "Company not found" });
    }

    res.status(200).json({
      message: "Logo uploaded successfully",
      logoDetails: logoDetails,
      partner: updatedCompany,
    });
  } catch (err) {
    next(err);
  }
};

export const totalcompany = async (req, res, next) => {
  try {
    // Use Mongoose's countDocuments method to get the total count
    const totalCompanies = await COMPANY.countDocuments();
    return res.status(200).json({
      message: "Total number of Comapny",
      totalCompanies: totalCompanies,
    });
  } catch (err) {
    next(err);
  }
};

export const getCreadits = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comapny = await COMPANY.findById(id);

    if (!comapny) {
      return res.status(404).json({ message: "comapny not found" });
    }

    res.status(200).json({ credit_balance: comapny.credit_balance });
  } catch (err) {
    next(err);
  }
};

export const getGoldenCoins = async (req, res, next) => {
  try {
    const { id } = req.params;

    const company = await COMPANY.findById(id);

    if (!company) {
      return res.status(404).json({ message: "company not foound" });
    }

    res.status(200).json({ gold_coins: company.gold_balance });
  } catch (err) {
    next(err);
  }
};

export const getLatestCompanies = async (req, res, next) => {
  try {
    // Fetch the latest companies
    const latestCompanies = await COMPANY.find()
      .sort({ createdAt: -1 })
      .limit(10);

    // Use Promise.all to process all companies in parallel
    const companyData = await Promise.all(
      latestCompanies.map(async (company) => {
        const uploadCounts = await getUploadsCountByCId(company._id); // Use helper function
        const managerDetails = await getCManagerByCid(company._id); // Assuming this is another helper

        return {
          ...company.toObject(), // Convert Mongoose document to plain object
          uploadCounts,
          managerDetails: managerDetails, // Adjust as per your response structure
        };
      })
    );

    return res.status(200).json({
      data: companyData,
      message: "Latest company details retrieved.",
    });
  } catch (err) {
    next(err);
  }
};

export const assignDeveloper = async (req, res, next) => {
  try {
    const { developerId } = req.params;
    const { companies } = req.body;

    // Validate input
    if (!developerId) {
      return res.status(404).json({ message: "Developer ID not provided." });
    }

    if (!Array.isArray(companies) || companies.length === 0) {
      return res
        .status(400)
        .json({ message: "No companies selected or invalid input." });
    }

    // Find the developer
    const developer = await DEVELOPER.findById(developerId);

    if (!developer) {
      return res.status(404).json({ message: "Developer not found." });
    }

    // Assign the developer to companies
    await Promise.all(
      companies.map(async (item) => {
        const company = await COMPANY.findById(item);
        if (company) {
          await COMPANY.findByIdAndUpdate(item, {
            $set: { developer: developerId },
          });
        }
      })
    );

    // Find companies to add (avoid duplicates)
    const newCompanies = companies.filter(
      (companyId) => !developer.companies.includes(companyId)
    );

    // Update the developer's companies list
    await DEVELOPER.findByIdAndUpdate(developerId, {
      $addToSet: { companies: { $each: newCompanies } },
    });

    return res
      .status(200)
      .json({ message: "Developer assigned to companies successfully." });
  } catch (err) {
    next(err);
  }
};

export const getCompaniesByDeveloperId = async (req, res, next) => {
  try {
    const { developerId } = req.params;

    if (!developerId)
      return res.status(404).json({ message: "Develoepr id is not found" });

    const developer = await DEVELOPER.findById(developerId);

    if (!developer)
      return res.status(404).json({ message: "developer not found" });

    const companies = await COMPANY.find({
      developer: { $nin: developerId }, // `$nin` ensures the ID is not in the array
    });

    return res
      .status(200)
      .json({ data: companies, message: "All companies retrived" });
  } catch (err) {
    next(err);
  }
};

// Controller to get manager count assigned to a specific company

export const getCountByCompany = async (req, res) => {
  const { companyId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: "Invalid company ID" });
    }

    const managerCount = await CMANAGER.countDocuments({ assignto: companyId });
    const totalPhotoshoot = await UPLOAD.countDocuments({ company: companyId });
    const completedPhotoshoot = await UPLOAD.countDocuments({
      company: companyId,
      isphotoshootcomplete: true,
    });
    const pendingPhotoshoot = totalPhotoshoot - completedPhotoshoot;

    res.status(200).json({
      managerCount,
      totalPhotoshoot,
      completedPhotoshoot,
      pendingPhotoshoot,
    });
  } catch (error) {
    console.error("Error in getManagerCountByCompany:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

