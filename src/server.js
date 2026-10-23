import "dotenv/config";
import http from "http";

import app from "../src/app.js";
import connectDB from "./infrastructure/database/connection.js";
import initializeSocket from "./socket/index.js";

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const StartServer = async () => {
  try {
    // 1. Connect to Database first
    await connectDB();

    // 2. Initialize Socket.io
    initializeSocket(server);

    // 3. Start Listening
    server.listen(PORT, "0.0.0.0", () => {
    });
  } catch (error) {
    console.error("Server failed to start: ", error);
    process.exit(1);
  }
};

StartServer();

// --- PRODUCTION SAFETY HANDLERS ---

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! Shutting down...", err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...", err);
  process.exit(1);
});

// Graceful shutdown for containerized environments (Docker, Render, K8s)
const gracefulShutdown = (signal) => {
  server.close(() => {
    process.exit(0);
  });

  // Force shutdown if cleanup takes too long (e.g., 10 seconds)
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { server };