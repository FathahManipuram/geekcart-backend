import { Router } from "express";
import { exportSalesReportExcelController, getDashboardController } from "../controllers/dashboard.controller.js";


const router = Router();

router.get("/", getDashboardController);
router.get("/export/excel", exportSalesReportExcelController);
export default router;
