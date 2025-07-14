import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import SUPERADMIN from "../models/SUPERADMIN.js";
import PARTNER from "../models/PARTNER.js";
import LOGINMAPPING from "../models/LOGINMAPPING.js";
import COMPANY from "../models/COMPANY.js";
import CMANAGER from "../models/CMANAGER.js";
import DEVELOPER from "../models/DEVELOPER.js";
import mongoose from "mongoose";

const generateUserId = (userType) => {
  const validTypes = [
    "developer",
    "company",
    "superadmin",
    "partner",
    "cmanager",
  ];
  if (!validTypes.includes(userType)) {
    throw new Error("Invalid user type.");
  }

  // Generate a random unique number and string mix
  const randomPart = Math.random().toString(36).substring(2, 7); // Random alphanumeric string
  const uniqueNumber = Date.now().toString().slice(-5); // Get last 5 digits of current timestamp

  // Combine userType with unique parts
  return `${userType}${uniqueNumber}${randomPart}`;
};

export const superadminRegister = async (req, res, next) => {
  try {
    const { username, email, mobileno, password } = req.body;
    if (!username || !mobileno || !email || !password)
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });

    const user = await SUPERADMIN.findOne({ email });

    const existEmail = await LOGINMAPPING.findOne({ email });

    if (existEmail)
      return res.status(409).json({ message: "Email already exist." });

    if (user) return res.status(409).json({ message: "Email already exist." });

    const salt = bcryptjs.genSaltSync(10);
    const hash = bcryptjs.hashSync(password, salt);

    const dataid = generateUserId("superadmin");

    const newUser = new SUPERADMIN({
      username,
      mobileno,
      email,
      dataid,
    });
    await newUser.save();

    const newsuperadmin = new LOGINMAPPING({
      mongoid: newUser._id,
      dataid,
      email,
      password: hash,
      user_type: "superadmin",
    });

    await newsuperadmin.save();

    return res
      .status(200)
      .json({ message: "Superadmin Created.", data: newUser });
  } catch (err) {
    next(err);
  }
};

export const cmanagerRegister = async (req, res, next) => {
  try {
    // Extract fields from request body
    const { name, email, mobileno, password, assignto, credit_balance } =
      req.body;

    // Validate required fields
    if (!name || !email || !mobileno || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    // Check if email already exists
    const existingCmanager = await CMANAGER.findOne({ email });
    if (existingCmanager) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const existManager = await LOGINMAPPING.findOne({ email });

    if (existManager)
      return res.status(409).json({ message: "Email already exists." });

    // Generate hashed password
    const salt = bcryptjs.genSaltSync(10);
    const hash = bcryptjs.hashSync(password, salt);

    // Generate a unique data ID for the Cmanager
    const dataid = generateUserId("cmanager");

    // Create a new Cmanager record
    const newCmanager = new CMANAGER({
      name,
      email,
      mobileno,
      dataid,
      assignto,
      credit_balance,
    });

    await newCmanager.save();

    // Create a corresponding entry in LOGINMAPPING
    const newLoginMapping = new LOGINMAPPING({
      mongoid: newCmanager._id,
      dataid,
      email,
      password: hash,
      user_type: "cmanager", // Assign the appropriate user type
    });

    await newLoginMapping.save();

    return res
      .status(200)
      .json({ message: "Cmanager created successfully.", data: newCmanager });
  } catch (err) {
    next(err); // Pass errors to the error-handling middleware
  }
};

export const developerRegister = async (req, res, next) => {
  try {
    // Extract fields from request body
    const { name, email, mobileno, password, added_by } = req.body;

    // Validate required fields
    if (!name || !email || !mobileno || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    // Check if email already exists
    const existingDeveloper = await DEVELOPER.findOne({ email });
    if (existingDeveloper) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const existDeveloper = await LOGINMAPPING.findOne({ email });
    if (existDeveloper) {
      return res.status(409).json({ message: "Email already exists." });
    }

    // Generate hashed password
    const salt = bcryptjs.genSaltSync(10);
    const hash = bcryptjs.hashSync(password, salt);

    const dataid = generateUserId("developer");

    // Create a new Cmanager record
    const newDeveloper = new DEVELOPER({
      name,
      email,
      mobileno,
      dataid,
      added_by,
    });

    await newDeveloper.save();

    // Create a corresponding entry in LOGINMAPPING
    const newLoginMapping = new LOGINMAPPING({
      mongoid: newDeveloper._id,
      dataid,
      email,
      password: hash,
      user_type: "developer", // Assign the appropriate user type
    });

    await newLoginMapping.save();

    return res
      .status(200)
      .json({ message: "developer created successfully.", data: newDeveloper });
  } catch (err) {
    next(err); // Pass errors to the error-handling middleware
  }
};

// Function to update the password
export const updatePassword = async (req, res, next) => {
  const { newPassword } = req.body; // Only newPassword in the request body
  const id = req.params.id;

  if (!newPassword) {
    return res.status(400).json({ message: "New password is required" });
  }

  try {
    // Hash the new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    await LOGINMAPPING.findByIdAndUpdate(id, { password: hashedPassword });

    // Send success response
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

// Function to update the profile password
export const updateProfilePassword = async (req, res, next) => {
  let { currentPassword, newPassword } = req.body;
  const { id } = req.params; // Get user ID from params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  // Trim the passwords to remove any leading/trailing spaces
  currentPassword = currentPassword?.trim();
  newPassword = newPassword?.trim();

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current password and new password are required" });
  }

  try {
    const user = await LOGINMAPPING.findOne({ mongoid: id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password
    const isMatch = await bcryptjs.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash and update password
    const hashedNewPassword = await bcryptjs.hash(newPassword, 10);
    const updatedUser = await LOGINMAPPING.findOneAndUpdate(
      { mongoid: id },
      { password: hashedNewPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update password" });
    }

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    next(error);
  }
};

export const createPartner = async (req, res, next) => {
  try {
    const {
      org_name,
      website,
      gstno,
      added_by,
      pancard,
      designation,
      email,
      mobileno,
      password,
    } = req.body;

    const dataid = generateUserId("partner");

    // Validate input data
    const errors = validatePartnerData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation Error", errors });
    }

    //Check for duplicacy email in logginmapping
    const existPartner = await LOGINMAPPING.findOne({ email });

    if (existPartner)
      return res
        .status(409)
        .json({ message: "User already exists with the same email." });

    // Check for duplicate partner
    const existingPartner = await PARTNER.find({
      email,
    });

    if (existingPartner.length > 0) {
      return res.status(409).json({
        message: "Partner already exists with the same  email.",
      });
    }

    // Handle file upload (if a file is uploaded)
    let logoDetails = null;
    if (req.file) {
      logoDetails = {
        filetype: req.file.mimetype,
        filesize: req.file.size.toString(),
        filepath: `uploads/partner/logo/${req.file.filename}`,
        filename: req.file.filename,
      };
    }

    // Create new partner document
    const newPartner = new PARTNER({
      dataid,
      org_name,
      website,
      gstno,
      pancard,
      designation,
      email,
      mobileno,
      logo: logoDetails, // Add logo details
      added_by,
    });

    // Save the partner document
    await newPartner.save();

    // Create login mapping for the partner
    const salt = bcryptjs.genSaltSync(10);
    const hash = bcryptjs.hashSync(password, salt);

    const newLOGINMAPPING = await LOGINMAPPING.create({
      mongoid: newPartner._id,
      dataid,
      email,
      password: hash,
      user_type: "partner",
    });

    if (!newLOGINMAPPING) {
      return res.status(500).json({
        message: "Login Mapping not created for the new partner.",
      });
    }

    // Return success response
    return res.status(200).json({
      data: newPartner,
      message: "Partner and login mapping created successfully.",
    });
  } catch (error) {
    console.error("Error in createPartner:", error.message);
    next(error);
  }
};

export const validatePartnerData = (data) => {
  const errors = [];

  if (!data.org_name) {
    errors.push("Organization name is required and must be a string.");
  }

  if (!data.designation || typeof data.designation !== "string") {
    errors.push("Designation is required and must be a string.");
  }
  if (!data.mobileno || !/^\d{10}$/.test(data.mobileno)) {
    errors.push(
      "Mobile number is required and must be a valid 10-digit number."
    );
  }

  return errors;
};

export const companyRegister = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      company_name,
      website,
      gstno,
      designation,
      added_user_type,
      password,
      credit_balance,
      gold_balance,
      added_user_id,
      pancard,
      email,
      mobileno,
    } = req.body;

    if (
      !first_name ||
      !last_name ||
      !company_name ||
      !password ||
      !added_user_type ||
      !added_user_id ||
      !email ||
      !mobileno
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    const developer = await DEVELOPER.findOne().sort({ createdAt: 1 }).exec();

    if (!developer) {
      return res
        .status(404)
        .json({ message: "No developer found. Cannot assign a company." });
    }

    const company = await COMPANY.findOne({ email });
    const existCompany = await LOGINMAPPING.findOne({ email });

    if (existCompany || company) {
      return res
        .status(409)
        .json({ message: "Company already exists with the same email." });
    }

    const dataid = generateUserId("company");

    const newcompany = new COMPANY({
      dataid,
      first_name,
      last_name,
      company_name,
      website,
      gstno,
      designation,
      pancard,
      credit_balance,
      gold_balance,
      email,
      mobileno,
      added_by: {
        userid: added_user_id,
        role: added_user_type,
      },
      developer: developer._id,
    });

    await newcompany.save();

    developer.companies.push(newcompany._id);
    await developer.save();

    const salt = bcryptjs.genSaltSync(10);
    const hash = bcryptjs.hashSync(password, salt);

    const newLoginMapping = new LOGINMAPPING({
      mongoid: newcompany._id,
      dataid,
      password: hash,
      email,
      user_type: "company",
    });

    await newLoginMapping.save();

    res.status(200).json({
      message: "New Company Created.",
      data: newcompany,
    });
  } catch (err) {
    next(err);
  }
};

export const Login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });

    const user = await LOGINMAPPING.findOne({ email: username });

    if (!user)
      return res
        .status(404)
        .json({ message: "Invaild Credentials try again." });

    if (!user.status)
      return res.status(401).json({
        message:
          "Your account is Disabled. Contact Some higher authority to enable your account.",
      });
    const isPasswordCorrect = await bcryptjs.compare(password, user.password);

    if (!isPasswordCorrect)
      return res.status(404).json({ message: "Password is incorrect." });

    const token = jwt.sign(
      { mongoid: user.mongoid, dataid: user.dataid, userType: user.user_type },
      process.env.JWT
    );

    const { dataid, email, user_type, mongoid } = user._doc;

    res
      .cookie("user_data", token, {
        expires: new Date(Date.now() + 2592000000),
        httpOnly: true,
        domain:
          process.env.NODE_ENV === "production" ? ".stylic.ai" : undefined,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      })
      .status(200)
      .json({ email, user_type, dataid, mongoid });
  } catch (err) {
    next(err);
  }
};

export const validateUser = async (req, res, next) => {
  try {
    const token = req.cookies.user_data;

    if (!token) return res.status(401).json({ message: "No token found." });

    const decoded = jwt.verify(token, process.env.JWT);

    const user = await LOGINMAPPING.findOne({ dataid: decoded.dataid });

    if (!user) return res.status(401).json({ message: "User not found." });

    const { dataid, email, user_type, mongoid } = user._doc;
    res.status(200).json({ email, user_type, dataid, mongoid });
  } catch (err) {
    next(err);
  }
};

export const Logout = async (req, res, next) => {
  try {
    res
      .clearCookie("user_data", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        domain:
          process.env.NODE_ENV === "production" ? ".stylic.ai" : undefined,
      })
      .status(200)
      .json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

export const getTotalDashboardCounts = async (req, res, next) => {
  try {
    // Use await to resolve the promises returned by the find method
    const totalPartners = await LOGINMAPPING.find({
      user_type: "partner",
    }).countDocuments();
    const totalCompanies = await LOGINMAPPING.find({
      user_type: "company",
    }).countDocuments();
    const totalDeveloper = await LOGINMAPPING.find({
      user_type: "developer",
    }).countDocuments();

    // Send the response with resolved counts
    return res.status(200).json({
      message: "All counts retrieved.",
      data: {
        totalPartners,
        totalCompanies,
        totalDeveloper,
      },
    });
  } catch (err) {
    // Pass the error to the next middleware
    next(err);
  }
};

export const changePassword = async (req, res) => {
  const { id } = req.params; // Get the ID from the params
  const { password } = req.body; // Get the password from the request body

  try {
    // Check if the ID matches any document in the `loginmapping` collection
    const loginMapping = await LOGINMAPPING.findOne({ mongoid: id });

    if (!loginMapping) {
      return res
        .status(404)
        .json({ error: "No record found with the provided ID." });
    }

    // Hash the new password using bcrypt
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Update the password field with the hashed password
    loginMapping.password = hashedPassword;
    await loginMapping.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the password." });
  }
};
