import DeveloperTransaction from "../models/DeveloperTransactionSchema.js";
import Developer from "../models/DEVELOPER.js";

// assign developer to company by superadmin
export const assignDeveloper = async (req, res) => {
  try {
    const { devId } = req.params;
    const { companies } = req.body;

    if (!companies || !Array.isArray(companies)) {
      return res.status(400).json({ message: "Companies should be an array" });
    }

    const developer = await Developer.findById(devId);
    if (!developer)
      return res.status(404).json({ message: "Developer not found" });

    await Promise.all(
      companies.map(async (company) => {
        const devtransactions = await DeveloperTransaction.create({
          developer: devId,
          company: company,
          managers: [],
          status: "active",
        });

        await Developer.findByIdAndUpdate(devId, {
          $push: { devTransaction: devtransactions._id },
        });
      })
    );

    res.status(200).json({ message: "Developer assigned successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error assigning developer" });
  }
};
