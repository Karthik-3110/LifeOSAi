import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middleware/errorHandler.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import routes from "./routes/index.js";

const app = express();
// Render forwards the original client IP through one trusted proxy.
app.set("trust proxy", 1);
// Keep local development available even when Render's production URL is configured.
const localOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const configuredOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...localOrigins, ...configuredOrigins])];

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
// Semester source files are encoded client-side for the authenticated analysis API.
// Individual files are capped and validated again by the controller.
app.use(express.json({ limit: "170mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// This route intentionally bypasses auth, rate limiting, and external
// services so landing-page warmups remain cheap and reliable.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiRateLimiter, routes);
app.use(errorHandler);

export default app;
