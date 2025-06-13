const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const path = require("path");

// Routes
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const cloudinary  = require("./config/cloudinary");

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });
dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://profitpilot78:profitpilot78@profitpilot.tynigac.mongodb.net/blog_app"
    );
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

app.post("/api/upload",upload.single('image'), async (req, res) => {
  try {
    let imageUrl = "";
    
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: "auto",
        folder: "blog_images",
      });
      imageUrl = result.secure_url;
    }

    res
      .status(200)
      .json({ message: "File uploaded successfully", returnUrl: imageUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});



const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
