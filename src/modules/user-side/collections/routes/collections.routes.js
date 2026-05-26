import { Router } from "express";
import { getCollectionsController } from "../controllers/collections.controller.js";

const router= Router()

router.get("/", getCollectionsController);


export default router