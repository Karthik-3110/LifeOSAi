import "dotenv/config";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { validateEnv } from "./src/config/env.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    validateEnv();

    // The public health endpoint is available immediately. Firebase stays lazy
    // until an authenticated request needs it, and MongoDB warms in parallel.
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 LifeOS API running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
    });

    void connectDB().catch((error) => {
      console.error("❌ MongoDB connection failed", error);
    });
  } catch (error) {
    console.error("❌ Failed to start server");
    console.error(error);
    process.exit(1);
  }
};

startServer();
