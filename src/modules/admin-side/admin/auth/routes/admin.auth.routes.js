import { Router } from "express";
import { adminLoginController } from "../controllers/admin.auth.controller";

const router = Router();

router.post("/admin/login", adminLoginController);
