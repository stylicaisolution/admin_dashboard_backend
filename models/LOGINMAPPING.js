import mongoose from 'mongoose';

const loginmappingSchema = new mongoose.Schema(
  {
    mongoid: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'user_type' // Dynamically reference based on the 'user_type' field
    },
    dataid: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    user_type: {
      type: String,
      required: true,
      enum: ['superadmin', 'partner', 'company','cmanager','developer'] // Enumerating allowed user types
    },
    status: {
      type: Boolean,
      default: true
    },
  },
  { timestamps: true }
);

export default mongoose.model('loginmapping', loginmappingSchema);
