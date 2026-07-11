import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import {
  exportSalesExcelService,
  exportSalesPdfService,
  getSalesReportService,
} from "../services/sales.services.js";

export const getSalesReportController = async (req, res, next) => {
  try {
    const result = await getSalesReportService(req.query);

    return successResponse(res, HTTP_STATUS.OK, result.messages, result.data);
  } catch (err) {
    next(err);
  }
};

export const exportSalesExcelController = async (req, res, next) => {
  try {
    const result = await exportSalesExcelService(req.query);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.data.fileName}"`,
    );

    return res.send(result.data.buffer);
  } catch (err) {
    next(err);
  }
};

export const exportSalesPdfController = async (req, res, next) => {
  try {
    const result = await exportSalesPdfService(req.query);

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.data.fileName}"`,
    );

    return res.send(result.data.buffer);
  } catch (err) {
    next(err);
  }
};
