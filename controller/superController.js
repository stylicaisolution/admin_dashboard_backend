//get all superadmin
import LOGINMAPPING from "../models/LOGINMAPPING.js";
import { parse } from "json2csv";
import SUPERADMIN from "../models/SUPERADMIN.js";

export const getAllsuperadmin = async (req, res, next) => {
  try {
    const superadmin = await SUPERADMIN.find();
    if (!superadmin) {
      return res.status(404).json({ message: "No superadmin found" });
    }
    const active = superadmin.filter((admin) => admin.status === true);
    const disable = superadmin.filter((admin) => admin.status === false);
    const sortedSuperAdmins = [...active, ...disable];

    res.status(200).json(sortedSuperAdmins);
  } catch (err) {
    next(err);
  }
};

export const getsuperadminByid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const superadmin = await SUPERADMIN.findOne({ dataid: id });
    if (!superadmin)
      return res.status(404).json({ message: "No superadmin found" });
    return res.status(200).json({ superadmin });
  } catch (err) {
    next(err);
  }
};

export const updateBydataid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updateSuper = await SUPERADMIN.findOneAndUpdate(
      { dataid: id },
      { $set: req.body },
      { new: true }
    );

    if (!updateSuper)
      return res
        .status(400)
        .json({ message: "Admin Information not updated, Try again"});

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
    return res
      .status(200)
      .json({ message: "Superadmin Information updated", data: updateSuper });
  } catch (err) {
    next(err);
  }
};

export const enableSuperAdminById = async (req, res, next) => {
  try {
    const superaadmin = await SUPERADMIN.findOne({ dataid: req.params.id });

    if (!superaadmin)
      return res.status(404).json({ message: "superaadmin not found by id" });

    await SUPERADMIN.findOneAndUpdate(
      { dataid: req.params.id },
      { $set: { status: true } }
    );

    await LOGINMAPPING.findOneAndUpdate(
      { dataid: req.params.id },
      { $set: { status: true } }
    );

    return res
      .status(200)
      .json({ message: "Sucecssfully superaadmin Enabled." });
  } catch (err) {
    next(err);
  }
};
export const disableSuperAdminById = async (req, res, next) => {
  try {
    const superadmin = await SUPERADMIN.findOne({ dataid: req.params.id });
    if (!superadmin)
      return res.status(404).json({ message: "superadmin not found by id" });

    await SUPERADMIN.findOneAndUpdate(
      { dataid: req.params.id },
      { $set: { status: false } }
    );

    await LOGINMAPPING.findOneAndUpdate(
      { dataid: req.params.id },
      { $set: { status: false } }
    );

    return res
      .status(200)
      .json({ message: "Successfully superadmin Disabled" });
  } catch (err) {
    next(err);
  }
};

export const disableAllSuperadmin = async (req, res) => {
  try {
    const { superadmin } = req.body;
    await Promise.all(
      superadmin.map(async (item) => {
        const admin = await SUPERADMIN.findByIdAndUpdate(item, {
          $set: { status: false },
        });

        if (!admin) {
          return res.status(404).json({
            message: ` some Superadmin not found ${item} from your selection`,
          });
        }

        await LOGINMAPPING.findOneAndUpdate(
          { dataid: admin.dataid },
          { $set: { status: false } }
        );
      })
    );
    res.status(200).json({ message: "superadmin Disable" });
  } catch (error) {
    res.status(500).json({
      message: "Error in disable superadmin",
      message2: error.message,
    });
  }
};
export const exportsuperadmins = async (req, res, next) => {
  try {
    const { superadmins } = req.body;

    const selectedpartner = await SUPERADMIN.find({
      _id: { $in: superadmins },
    });

    const adminWithoutId = selectedpartner.map((admin) => {
      const { _id, __v, updatedAt, ...adminWithoutId } = admin.toObject();
      return adminWithoutId;
    });

    const csv = parse(adminWithoutId);

    // Set the appropriate headers to trigger a file download in the browser
    res.header("Content-Type", "text/csv");
    res.attachment("admin.csv"); // The filename for the downloaded file
    res.status(200).json({ csv, message: "csv sent from  export Superadmins" });
  } catch (err) {
    next(err);
  }
};

export const getCompaniesBySuperadmin = async (req, res, next) => {
  try {
    const { id: superadminId } = req.params;

    const companies = await COMPANY.find({
      "added_by.userid": superadminId,
      "added_by.role": "superadmin",
    });

    if (companies.length === 0) {
      return res
        .status(404)
        .json({ message: "No companies found for this partner" });
    }

    res
      .status(200)
      .json({ companies, message: "Companies retrieved successfully" });
  } catch (error) {
    next(error);
  }
};

export const totalsuperadmin = async (req, res, next) => {
  try {
    // Use Mongoose's countDocuments method to get the total count
    const totalCompanies = await SUPERADMIN.countDocuments();
    return res.status(200).json({ message: "Total number of Superadmin" });
  } catch (err) {
    next(err);
  }
};

export const handleFileUpload = async (req, res, next) => {
  try {
    const { adminid } = req.params;

    if (!req.file) {
      // Use req.file for single file uploads
      return res.status(400).json({ error: "No file uploaded" });
    }

    //Check if partner logo alredy exists
    const adminLogo = await SUPERADMIN.findOne({ dataid: adminid });

    if (adminLogo && adminLogo.logo && adminLogo.logo.filepath) {
      // Get the existing logo file path
      const existingFilePath = path.join(
        __dirname,
        "..",
        adminLogo.logo.filepath
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
      filepath: `uploads/superadmin/logo/${req.file.filename}`, // Ensure path matches destination
      filename: req.file.filename,
    };

    const updatedAdmin = await SUPERADMIN.findOneAndUpdate(
      { dataid: adminid },
      { $set: { photo: logoDetails } },
      { new: true } // Return the updated document
    );

    if (!updatedAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.status(200).json({
      message: "Logo uploaded successfully",
      logoDetails: logoDetails,
      partner: updatedAdmin,
    });
  } catch (err) {
    next(err);
  }
};
