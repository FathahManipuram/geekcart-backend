import { Router } from "express";
import { exportSalesExcelController, exportSalesPdfController, getSalesReportController } from "../controllers/sales.controller.js";

const router= Router()

router.get("/", getSalesReportController)
router.get("/export/excel", exportSalesExcelController);
router.get("/export/pdf", exportSalesPdfController);

export default router