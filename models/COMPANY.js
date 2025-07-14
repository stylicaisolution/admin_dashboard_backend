import mongoose from "mongoose";


const companySchema = new mongoose.Schema({
    dataid:{
        type:String,
        required:true
    },
    first_name:{
        type:String,
        required:true
    },
    last_name:{
      type:String,
      required:true
    },
    company_name:{
        type:String,
        required:true
    },
    website:{
        type:String,
    },
    gstno:{
        type:String,
        
    },
    designation:{
        type:String,
    },
    pancard:{
        type:String,
       
    },
    status:{
        type:Boolean,
        default:true
    },
    email:{
        type:String,
        required:true
    },
    mobileno:{
        type:String,
        required:true
    },
    logo:{
        filetype:String,
        filename:String,
        filepath:String,
        fileSize:String
    },
    added_by:{
        userid:{type:mongoose.Schema.Types.ObjectId,refPath:"added_by.role"},
        role:{type:String, enum:['superadmin','partner']}
    },
    credit_balance:{
        type:Number,
        default:0
    },
    gold_balance:{
       type:Number,
       default:0
    },
    developer:{
           type: mongoose.Schema.Types.ObjectId,
           ref: "Developer", // Refers to the Developer model
    },
},{timestamps:true})


export default mongoose.model('company',companySchema)