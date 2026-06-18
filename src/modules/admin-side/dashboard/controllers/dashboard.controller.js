import { HTTP_STATUS } from "../../../../common/constants/statusCode.js";
import { successResponse } from "../../../../common/helpers/response.js";
import { exportSalesReportExcelService, getDashboardService } from "../services/dashboard.service.js";

export const getDashboardController = async (req, res, next) => {
  try {
    const result = await getDashboardService();
    return successResponse(res, HTTP_STATUS.OK, result.message, result.data);
  } catch (err) {
    next(err);
  }
};

export const exportSalesReportExcelController = async (req, res, next) => {
  try {
    const { reportType, startDate, endDate } = req.query;

    const { workbook, fileName } = await exportSalesReportExcelService({
      reportType,
      startDate,
      endDate,
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);

    res.end();
  } catch (error) {
    next(error);
  }
};