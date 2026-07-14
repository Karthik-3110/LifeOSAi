import "dotenv/config";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { validateEnv } from "./src/config/env.js";
import { getFirebaseAdmin } from "./src/config/firebaseAdmin.js";

const PORT = Number(process.env.PORT || 5000);

const startServer = async () => {
  try {
    validateEnv();
    getFirebaseAdmin();
    await connectDB();

    app.listen(PORT, () => {
      console.log(`LifeOS API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
