import ExcelJS from "exceljs";

export const exportSalesExcel = async (report, filters = {}) => {
  const summary = report?.summary || {};
  const orders = report?.orders || [];

  const { type, startDate, endDate } = filters;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  // Title Block
  worksheet.mergeCells("A1:J1");
  const title = worksheet.getCell("A1");
  title.value = "GeekCart Sales Report";
  title.font = { size: 18, bold: true, color: { argb: "FF1E293B" } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 30;

  // ==========================
  // Summary Grid Section (Updated)
  // ==========================
  worksheet.getCell("A3").value = "Generated On";
  worksheet.getCell("B3").value = new Date().toLocaleString("en-IN");

  // ✅ NEW: Calculate and display the Reporting Date Filter dynamically
  worksheet.getCell("A4").value = "Reporting Period";

  if (type === "custom" && startDate && endDate) {
    const start = new Date(startDate).toLocaleDateString("en-IN");
    const end = new Date(endDate).toLocaleDateString("en-IN");
    worksheet.getCell("B4").value = `${start} to ${end}`;
  } else {
    // Capitalize filter type string safely (e.g., "monthly" -> "Monthly")
    worksheet.getCell("B4").value = type
      ? type.charAt(0).toUpperCase() + type.slice(1)
      : "All Time";
  }

  // Shift previous summary parameters down safely by 1 row index
  worksheet.getCell("A5").value = "Total Orders";
  worksheet.getCell("B5").value = summary.overallSalesCount ?? 0;

  worksheet.getCell("A6").value = "Items Sold";
  worksheet.getCell("B6").value = summary.itemsSold ?? 0;

  worksheet.getCell("A7").value = "Gross Sales";
  worksheet.getCell("B7").value = Number(summary.grossSales || 0);

  worksheet.getCell("D5").value = "Offer Discount";
  worksheet.getCell("E5").value = Number(summary.offerDiscount || 0);

  worksheet.getCell("D6").value = "Coupon Discount";
  worksheet.getCell("E6").value = Number(summary.couponDiscount || 0);

  worksheet.getCell("D7").value = "Net Sales";
  worksheet.getCell("E7").value = Number(summary.netSales || 0);

  // Update Summary Label Bold Targets (A3 through D7)
  ["A3", "A4", "A5", "A6", "A7", "D5", "D6", "D7"].forEach((cell) => {
    worksheet.getCell(cell).font = { bold: true, color: { argb: "FF475569" } };
  });

  // Update Currency Format mappings
  ["B7", "E5", "E6", "E7"].forEach((cell) => {
    worksheet.getCell(cell).numFmt = "₹#,##0.00";
  });

  // ==========================
  // Table Header (Shifted down to Row 9)
  // ==========================
  worksheet.addRow([]); // Blank spacing row 8

  const headerRow = worksheet.addRow([
    "Order No",
    "Customer",
    "Date",
    "Items",
    "Gross",
    "Offer Discount",
    "Coupon Discount",
    "Net Total",
    "Payment",
    "Status",
  ]); // Header is now Row 9
  headerRow.height = 24;

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Freeze summary updated to split at row 9
  worksheet.views = [{ state: "frozen", ySplit: 9 }];
  worksheet.autoFilter = { from: "A9", to: "J9" };

  // ==========================
  // Populate Transactional Rows (Starts at 10)
  // ==========================
  const startRowIndex = 10;
  orders.forEach((order) => {
    const totalItemsInOrder =
      order.items?.reduce(
        (total, item) => total + (Number(item.quantity) || 0),
        0,
      ) || 0;

    worksheet.addRow([
      order.orderNumber ? String(order.orderNumber) : "-",
      order.user?.fullName ?? "-",
      order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("en-IN")
        : "-",
      totalItemsInOrder,
      Number(order.subtotal || 0),
      Number(order.discount || 0),
      Number(order.coupon?.discountAmount || 0),
      Number(order.totalAmount || 0),
      order.paymentMethod || "-",
      order.orderStatus || "-",
    ]);
  });

  const endRowIndex = worksheet.lastRow
    ? worksheet.lastRow.number
    : startRowIndex;

  // ==========================
  // Dynamic Totals Row Updates
  // ==========================
  const totalRow = worksheet.addRow([
    "TOTALS",
    "",
    "",
    {
      formula: `=SUM(D${startRowIndex}:D${endRowIndex})`,
      result: summary.itemsSold || 0,
    },
    {
      formula: `=SUM(E${startRowIndex}:E${endRowIndex})`,
      result: summary.grossSales || 0,
    },
    {
      formula: `=SUM(F${startRowIndex}:F${endRowIndex})`,
      result: summary.offerDiscount || 0,
    },
    {
      formula: `=SUM(G${startRowIndex}:G${endRowIndex})`,
      result: summary.couponDiscount || 0,
    },
    {
      formula: `=SUM(H${startRowIndex}:H${endRowIndex})`,
      result: summary.netSales || 0,
    },
    "",
    "",
  ]);
  totalRow.height = 22;

  // Style totals row
  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { bold: true, size: 11, color: { argb: "FF0F172A" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "double", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    if ([4, 5, 6, 7, 8].includes(colNumber)) {
      cell.numFmt = "₹#,##0.00";
      cell.alignment = { horizontal: "right" };
    }
  });

  // ==========================
  // Grid Formatting Range Adjustment
  // ==========================
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= startRowIndex && rowNumber <= endRowIndex) {
      const isEven = rowNumber % 2 === 0;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (isEven) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F9FAFB" },
          };
        }
        if ([1, 3, 4, 9, 10].includes(colNumber)) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
        if ([5, 6, 7, 8].includes(colNumber)) {
          cell.numFmt = "₹#,##0.00";
          cell.alignment = { horizontal: "right", vertical: "middle" };
        }
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    }
  });

  // ==========================
  // Auto Width Calculation
  // ==========================
  worksheet.columns.forEach((column) => {
    let maxLength = 16; // Bumped slightly to display longer date ranges clearly
    column.eachCell({ includeEmpty: false }, (cell) => {
      const textValue =
        cell.value && typeof cell.value === "object" && cell.value.formula
          ? cell.value.result?.toString() || ""
          : cell.value?.toString() || "";
      maxLength = Math.max(maxLength, textValue.length + 5);
    });
    column.width = maxLength;
  });

  return workbook.xlsx.writeBuffer();
};
