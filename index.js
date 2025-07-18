import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the current file's path
const __filename = fileURLToPath(import.meta.url);

// Get the current directory's path
const __dirname = path.dirname(__filename);

// For importing routes
import authRoute from "./routes/auth.js";
import superRoute from "./routes/superadmin.js";
import partnerRoute from "./routes/partner.js";
import companyRoute from "./routes/company.js";
import categoryRoute from "./routes/category.js";
import cmanagerRoute from "./routes/cmanager.js";
import creditRoute from "./routes/credit.js";
import uploadRoute from "./routes/upload.js";
import developerRoute from "./routes/developer.js";
import mailRoute from "./routes/mail.js";
import devTransactionRoute from "./routes/devTransaction.js";

// App configuration
dotenv.config();

const port = process.env.PORT || 8000;

const app = express();

// Serve static files from the uploads directory
app.use(
  "/uploads/partner/logo",
  express.static(path.join(__dirname, "uploads/partner/logo"))
);

app.use(
  "/uploads/company/logo",
  express.static(path.join(__dirname, "uploads/company/logo"))
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://www.stylic.ai",
      "https://stylic.ai",
      "http://localhost:3001",
      "https://app.stylic.ai",
      "https://www.app.stylic.ai",
      "http://localhost:8000",
      "http://localhost:8080"
    ];
    // Allow requests with no origin (like mobile apps or CURL)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  credentials: true,
};

app.options("*", cors(corsOptions)); // Allow OPTIONS for all routes

// Middleware for using CORS
app.use(cors(corsOptions));

// Middleware to parse JSON
app.use(express.json({limit:"50mb"}));

// Middleware to read cookies data
app.use(cookieParser());
app.use(express.urlencoded({limit:"50mb", extended: true }));

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB successfully");
  } catch (err) {
    throw err;
  }
};

app.get("/", (req, res) => {
  res.send("Bahut maza aa raha hai 🥳");
});

// Notify MongoDB connection status
mongoose.connection.on("connected", () => {
  console.log("MongoDB connected successfully");
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

// Middleware
app.use("/api/auth", authRoute);
app.use("/api/superadmin", superRoute);
app.use("/api/partner", partnerRoute);
app.use("/api/company", companyRoute);
app.use("/api/category", categoryRoute);
app.use("/api/cmanager", cmanagerRoute);
app.use("/api/transactions", creditRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/developer", developerRoute);
app.use("/api/mail", mailRoute);
app.use("/api/devtransaction", devTransactionRoute);


// Middleware to catch errors
app.use((err, req, res, next) => {
  const errStatus = err.status || 500;
  const errMsg = err.message || "Something went wrong!";

  return res.status(errStatus).json({
    success: "false",
    status: errStatus,
    message: errMsg,
    stack: err.stack,
  });
});

app.listen(port, () => {
  connectDb();
  console.log(`App is listening on port: ${port}`);
});
