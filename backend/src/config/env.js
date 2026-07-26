// Firebase credentials are checked on the first authenticated request. Keeping
// them out of the startup gate allows the health endpoint to stay lightweight.
const requiredEnvVars = ["MONGO_URI"];

export const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Create backend/.env from backend/.env.example.`
    );
  }
};
