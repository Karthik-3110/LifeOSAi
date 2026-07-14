import "dotenv/config";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { validateEnv } from "./src/config/env.js";
import { getFirebaseAdmin } from "./src/config/firebaseAdmin.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Validate environment variables
    validateEnv();

    // Initialize Firebase Admin
    getFirebaseAdmin();
    console.log("✅ Firebase Admin initialized");

    // Connect MongoDB
    await connectDB();
    console.log("✅ MongoDB connected");

    // Health Check Route
    app.get("/", (req, res) => {
      res.status(200).json({
        success: true,
        name: "LifeOS AI Backend",
        status: "Running",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      });
    });

    // Start Server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 LifeOS API running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server");
    console.error(error);
    process.exit(1);
  }
};

startServer();
