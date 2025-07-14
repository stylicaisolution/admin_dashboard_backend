import mongoose from "mongoose";

const creditTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
  },
  fromRole: {
    type: String,
    enum: ["superadmin", "partner", "company", "cmanager"],
    required: true,
  },
  fromId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "fromRole",
    required: true,
  },
  toRole: {
    type: String,
    enum: ["partner", "company", "cmanager", "Upload"],
    required: true,
  },
  toId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "toRole",
  },
  coin_type: {
    type: String,
    enum:[
      'gold',
      'blue'
    ]
  },
  amount: { type: Number, required: true },
  transactionType: { type: String, enum: ["credit", "debit"], required: true },
  purpose: { type: String, enum: ["transfer", "expense"] },
  notes: {
    type: String,
    required: true,
  },
  //   photoId: { type: mongoose.Schema.Types.ObjectId, ref: "Photo" },
  timestamp: { type: Date, default: Date.now },
});


export default mongoose.model('credittransaction',creditTransactionSchema)