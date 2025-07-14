import mongoose from "mongoose";
import { type } from "os";

const partnerSchema = new mongoose.Schema(
  {
    dataid:{
      type:String,
      required:true,
    },
    org_name:{
      type:String,
      required:true
    },
    website:{
      type:String,
    },
    gstno:{
      type:String,
     
    },
    pancard:{
      type:String,
     
    },
    designation:{
      type:String,
      required:true
    },
    email:{
      type:String,
      required:true
    },
    mobileno:{
      type:String,
      required:true
    },
    status:{
      type:Boolean,
      default:true
    },
    logo:{
      filetype:String,
      filename:String,
      filepath:String,
      fileSize:String
    },
    added_by:{
      type:mongoose.Schema.Types.ObjectId, refPath:"superadmin"
    },
    credit_balance:{
      type:Number,
      default:0
    },
    gold_balance:{
      type:Number,
      default:0
    }
  },
  { timestamps: true }
);

export default mongoose.model("partner",partnerSchema)
