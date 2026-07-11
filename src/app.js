import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "../src/routes/index.js";
import { errorMiddleware } from "./common/middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URLS.split(","),
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1", routes);

app.use(errorMiddleware);

export default app;
