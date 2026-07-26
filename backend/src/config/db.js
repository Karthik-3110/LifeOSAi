import mongoose from "mongoose";

let connectionPromise;

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is required to start the API");
  }

  // Mongoose owns the underlying pool. Sharing the connection promise also
  // prevents concurrent startup/request paths from opening duplicate pools.
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  mongoose.set("strictQuery", true);
  connectionPromise = mongoose.connect(mongoUri, {
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_MS || 8000),
  })
    .then((connection) => {
      console.log(`MongoDB connected: ${connection.connection.host}`);
      return connection;
    })
    .catch((error) => {
      connectionPromise = undefined;
      throw error;
    });

  return connectionPromise;
};
