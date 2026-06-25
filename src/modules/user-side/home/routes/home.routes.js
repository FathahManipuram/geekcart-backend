import { Router } from "express";
import { getHomeDataController } from "../contollers/home.controller.js";


const router = Router();

router.get("/", getHomeDataController);
export default router;
