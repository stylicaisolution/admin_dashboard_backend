import SuperAdmin from "../models/SUPERADMIN.js";
import Partner from "../models/PARTNER.js";
import Company from "../models/COMPANY.js";
import CManager from "../models/CMANAGER.js";
import CREDITTRANSACTION from "../models/CREDITTRANSACTION.js";
import mongoose from "mongoose";
import CMANAGER from "../models/CMANAGER.js";

const modelMap = {
  superadmin: SuperAdmin,
  partner: Partner,
  company: Company,
  cmanager: CManager,
};

export const transferCredit = async (req, res, next) => {
  try {
    // fetch data
    const {
      fromRole,
      fromId,
      toRole,
      toId,
      amount,
      notes,
      transactionId,
      action,
      coinType
    } = req.body;

    if (
      !fromRole ||
      !fromId ||
      !toRole ||
      !toId ||
      !amount ||
      !notes ||
      !action ||
      !coinType
    ) {
      return res
        .status(400)
        .json({ message: "Some fields are missing! All fields are required." });
    }

    if (action && action !== "Assign" && action !== "Remove") {
      return res
        .status(400)
        .json({ message: "Action type must be 'Assign' or 'Remove'" });
    }

    // find sender and receiver
    const sender = await modelMap[fromRole.toLowerCase()].findById(fromId);
    const receiver = await modelMap[toRole.toLowerCase()].findById(toId);

    if (!sender || !receiver) {
      return res.status(400).json({
        message: "This type of sender or receiver not found.",
        message2: "Insert valid sender or receiver.",
      });
    }

    // Handle action (Assign or Remove)
    if (action === "Assign") {
      if (coinType === "blue") {
        // Balance Checking for credit_balance
        if (sender.credit_balance < amount) {
          return res.status(400).json({
            message: "Insufficient balance. Please be within your credit limit.",
          });
        }
        // Deduct from credit balance
        sender.credit_balance = sender.credit_balance - amount;
        receiver.credit_balance = receiver.credit_balance + amount;
      } else if (coinType === "gold") {
        console.log("coin type ",coinType)
        // Balance Checking for gold_coin
        if (sender.gold_balance < amount) {
          return res.status(400).json({
            message: "Insufficient gold coins.",
          });
        }
        // Deduct from gold_coin
        sender.gold_balance = sender.gold_balance - amount;
        receiver.gold_balance = receiver.gold_balance + amount;
      } else {
        return res.status(400).json({
          message: "Invalid coin type. Must be 'Blue' or 'Gold'.",
        });
      }

      await sender.save();
      await receiver.save();

    }

    if (action === "Remove") {
      if (coinType === "blue") {
        sender.credit_balance = sender.credit_balance + amount;
        receiver.credit_balance = receiver.credit_balance - amount;
      } else if (coinType === "gold") {
        sender.gold_balance = sender.gold_balance + amount;
        receiver.gold_balance = receiver.gold_balance - amount;
      }

      await sender.save();
      await receiver.save();
    }

    // Create a transaction record
    const transaction = await CREDITTRANSACTION.create({
      fromRole,
      fromId,
      toRole,
      toId,
      amount,
      coin_type:coinType,
      notes,
      transactionId: transactionId || "",
      transactionType: action === "Assign" ? "debit" : "credit",
      purpose: "transfer",
    });

    res.status(200).json({
      data: transaction,
      message: "Transaction done successfully",
    });
  } catch (err) {
    next(err);
  }
};


export const transactionByCompany = async (req, res, next) => {
  try {
    const { fromId } = req.body;
    if (!fromId) {
      return res
        .status(400)
        .json({ message: "Company ID (companyId) is required." });
    }

    const transactions = await CREDITTRANSACTION.find({ fromId });
    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for this company." });
    }

    return res
      .status(200)
      .json({
        message: "Transactions fetched successfully.",
        transactions,
      })
      .sort({ timestamp: -1 });
  } catch (err) {
    next(err);
  }
};

export const transactionBySuperadmin = async (req, res, next) => {
  try {
    const { fromId } = req.body;

    if (!fromId) {
      return res
        .status(400)
        .json({ message: "Superadmin ID (fromId) is required." });
    }

    // Fetch transactions in descending order by timestamp
    const transactions = await CREDITTRANSACTION.find({ fromId }).sort({
      timestamp: -1,
    });

    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for this superadmin." });
    }

    return res.status(200).json({
      message: "Transactions fetched successfully.",
      transactions,
    });
  } catch (err) {
    next(err);
  }
};

export const transactionByPartner = async (req, res, next) => {
  try {
    const { fromId } = req.body; // Assuming partnerId is sent in the request body
    if (!fromId) {
      return res
        .status(400)
        .json({ message: "Partner ID (partnerId) is required." });
    }

    // Query the database for transactions by the partner
    const transactions = await CREDITTRANSACTION.find({ fromId }).sort({
      timestamp: -1,
    });
    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for this partner." });
    }

    const responsetbp = res.status(200).json({
      message: "Transactions fetched successfully.",
      transactions,
    });

    return responsetbp;
  } catch (err) {
    next(err);
  }
};

export const PandCaddedBySuperadmin = async (req, res, next) => {
  try {
    const { superadminId } = req.params;

    if (!superadminId) {
      return res
        .status(400)
        .json({ message: "Superadmin ID (superadminId) is required." });
    }

    // Fetch companies and partners added by the given superadmin
    const companies = await Company.find({ added_by: superadminId });
    const partners = await Partner.find({ added_by: superadminId });

    if (companies.length === 0 && partners.length === 0) {
      return res.status(404).json({
        message: "No companies or partners found for this superadmin.",
      });
    }

    return res.status(200).json({
      message: "Companies and partners fetched successfully.",
      companies,
      partners,
    });
  } catch (err) {
    next(err);
  }
};

export const creditsTransfer = async (req, res, next) => {
  try {
    const { fromId, toId } = req.body;
    if (!fromId || !toId) {
      return res.status(400).json({ message: "fromId and toId are required." });
    }

    const fromObjectId = new mongoose.Types.ObjectId(fromId);
    const toObjectId = new mongoose.Types.ObjectId(toId);

    const transfer = await CREDITTRANSACTION.find({
      fromId: fromObjectId,
      toId: toObjectId,
    });

    if (transfer.length === 0) {
      return res.status(200).json({
        message: "No transfers are available for this one",
        transfer: transfer,
      });
    }

    return res.status(200).json({
      message: "Transfer found successfully!",
      transfer: transfer,
    });
  } catch (err) {
    next(err);
  }
};


export const getAllTransactions = async (req, res, next)=>{
  try{
    const transactions = await CREDITTRANSACTION.find().populate("fromId").populate("toId")

    return res.status(200).json({message:'All transaction retrived.',data:transactions})
  }catch(err){
    next(err)
  }
}


export const getCompanyTransactions = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    // Get all transactions from the company
    const companyTransactions = await CREDITTRANSACTION.find({
      fromId: companyId,
      fromRole: "company"
    }).lean().populate('fromId').populate("toId");

    // Get all managers assigned to this company
    const managers = await CMANAGER.find({ assignto: companyId }).lean();

    const managerIds = managers.map((manager) => manager._id);

    // Get all transactions where fromId is one of the managerIds
    const allManagerTransactions = await CREDITTRANSACTION.find({
      fromId: { $in: managerIds },
      fromRole: "cmanager"
    }).lean().populate('fromId').populate("toId");

    // Merge and sort transactions by timestamp (latest first)
    const allTransactions = [...companyTransactions, ...allManagerTransactions]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.status(200).json({ message: "All transactions retrieved.", data: allTransactions });

  } catch (err) {
    next(err);
  }
};