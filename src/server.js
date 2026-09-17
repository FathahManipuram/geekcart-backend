import "dotenv/config";
import http from "http";

import app from "../src/app.js";
import connectDB from "./infrastructure/database/connection.js";
import initializeSocket from "./socket/index.js";

const PORT = process.env.PORT || 5000;
const server= http.createServer(app)


const StartServer = async () => {
  try {
    await connectDB();
    initializeSocket(server);
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Server failed to start: ", error);
    process.exit(1);
  }
};
StartServer();
export { server };
