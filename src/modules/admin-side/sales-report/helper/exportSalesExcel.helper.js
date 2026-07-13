import ExcelJS from "exceljs";

export const exportSalesExcel = async (report, filters = {}) => {
  const summary = report?.summary || {};
  const orders = report?.orders || [];

  const { type, startDate, endDate } = filters;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  worksheet.mergeCells("A1:N1");
  const title = worksheet.getCell("A1");
  title.value = "GeekCart Sales Report";
  title.font = { size: 18, bold: true, color: { argb: "FF1E293B" } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 30;

  // Table Rows Calculation
  const startRowIndex = 10;
  const endRowIndex =
    startRowIndex + (orders.length > 0 ? orders.length - 1 : 0);
  const totalsRowIndex = endRowIndex + 1;

  // Summary
  worksheet.getCell("A3").value = "Generated On";
  worksheet.getCell("B3").value = new Date().toLocaleString("en-IN");

  worksheet.getCell("A4").value = "Reporting Period";
  if (type === "custom" && startDate && endDate) {
    const start = new Date(startDate).toLocaleDateString("en-IN");
    const end = new Date(endDate).toLocaleDateString("en-IN");
    worksheet.getCell("B4").value = `${start} to ${end}`;
  } else {
    worksheet.getCell("B4").value = type
      ? type.charAt(0).toUpperCase() + type.slice(1)
      : "All Time";
  }

  worksheet.getCell("A5").value = "Total Orders";
  worksheet.getCell("B5").value = summary.overallSalesCount ?? 0;

  worksheet.getCell("A6").value = "Items Sold (Net)";
  worksheet.getCell("B6").value = {
    formula:
      orders.length > 0 ? `=SUM(D${startRowIndex}:D${endRowIndex})` : "0",
    result: summary.itemsSold ?? 0,
  };

  worksheet.getCell("A7").value = "Gross Sales";
  worksheet.getCell("B7").value = {
    formula:
      orders.length > 0
        ? `=SUM(G${startRowIndex}:G${endRowIndex})+SUM(H${startRowIndex}:H${endRowIndex})`
        : "0",
    result: Number(
      (summary.grossSales || 0) + (summary.totalDeliveryCharges || 0),
    ),
  };

  worksheet.getCell("D5").value = "Offer Discount";
  worksheet.getCell("E5").value = {
    formula:
      orders.length > 0 ? `=SUM(I${startRowIndex}:I${endRowIndex})` : "0",
    result: Number(summary.offerDiscount || 0),
  };

  worksheet.getCell("D6").value = "Coupon Discount";
  worksheet.getCell("E6").value = {
    formula:
      orders.length > 0 ? `=SUM(J${startRowIndex}:J${endRowIndex})` : "0",
    result: Number(summary.couponDiscount || 0),
  };

  worksheet.getCell("D7").value = "Net Sales";
  worksheet.getCell("E7").value = {
    formula: orders.length > 0 ? `=L${totalsRowIndex}` : "0",
    result: orders.length > 0 ? undefined : 0,
  };

  ["A3", "A4", "A5", "A6", "A7", "D5", "D6", "D7"].forEach((cell) => {
    worksheet.getCell(cell).font = { bold: true, color: { argb: "FF475569" } };
  });

  ["B7", "E5", "E6", "E7"].forEach((cell) => {
    worksheet.getCell(cell).numFmt = "₹#,##0.00";
  });

  // Table Header
  worksheet.addRow([]);

  const headerRow = worksheet.addRow([
    "Order No",
    "Customer",
    "Date",
    "Ordered Qty",
    "Cancelled Qty",
    "Returned Qty",
    "Gross Subtotal",
    "Delivery Charge",
    "Offer Discount",
    "Coupon Discount",
    "Refunded Amt",
    "Net Total",
    "Payment",
    "Status",
  ]);
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

  worksheet.views = [{ state: "frozen", ySplit: 9 }];
  worksheet.autoFilter = { from: "A9", to: "N9" };

  // Transaction
  orders.forEach((order) => {
    const totalOrderedQty =
      order.items?.reduce(
        (acc, item) => acc + (Number(item.quantity) || 0),
        0,
      ) || 0;

    const totalCancelledQty =
      order.items?.reduce((acc, item) => {
        return item.itemStatus === "CANCELLED"
          ? acc + (Number(item.quantity) || 0)
          : acc;
      }, 0) || 0;

    const totalReturnedQty =
      order.items?.reduce((acc, item) => {
        return ["RETURN_COMPLETED", "RETURNED"].includes(item.itemStatus)
          ? acc + (Number(item.quantity) || 0)
          : acc;
      }, 0) || 0;

    const totalRefundedAmt =
      order.items?.reduce(
        (acc, item) => acc + (Number(item.refundAmount) || 0),
        0,
      ) || 0;

    const grossNum = Number(order.subtotal || 0);
    const deliveryNum = Number(order.deliveryCharge || 0);
    const offerNum = Number(order.discount || 0);
    const couponNum = Number(order.coupon?.discountAmount || 0);

    const computedNetTotal = Math.max(
      0,
      grossNum + deliveryNum - offerNum - couponNum - totalRefundedAmt,
    );

    worksheet.addRow([
      order.orderNumber ? String(order.orderNumber) : "-",
      order.user?.fullName ?? "-",
      order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("en-IN")
        : "-",
      totalOrderedQty,
      totalCancelledQty,
      totalReturnedQty,
      grossNum,
      deliveryNum,
      offerNum,
      couponNum,
      totalRefundedAmt,
      computedNetTotal,
      order.paymentMethod || "-",
      order.orderStatus || "-",
    ]);
  });

  // Totals Row
  const totalRow = worksheet.addRow([
    "TOTALS",
    "",
    "",
    {
      formula: `=SUM(D${startRowIndex}:D${endRowIndex})`,
      result: summary.totalOrdered || 0,
    },
    {
      formula: `=SUM(E${startRowIndex}:E${endRowIndex})`,
      result: summary.totalCancelled || 0,
    },
    {
      formula: `=SUM(F${startRowIndex}:F${endRowIndex})`,
      result: summary.totalReturned || 0,
    },
    {
      formula: `=SUM(G${startRowIndex}:G${endRowIndex})`,
      result: summary.grossSales || 0,
    },
    {
      formula: `=SUM(H${startRowIndex}:H${endRowIndex})`,
      result: summary.totalDeliveryCharges || 0,
    },
    {
      formula: `=SUM(I${startRowIndex}:I${endRowIndex})`,
      result: summary.offerDiscount || 0,
    },
    {
      formula: `=SUM(J${startRowIndex}:J${endRowIndex})`,
      result: summary.couponDiscount || 0,
    },
    {
      formula: `=SUM(K${startRowIndex}:K${endRowIndex})`,
      result: summary.totalRefunded || 0,
    },
    { formula: `=SUM(L${startRowIndex}:L${endRowIndex})` },
    "",
    "",
  ]);
  totalRow.height = 22;

  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { bold: true, size: 11, color: { argb: "FF0F172A" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "double", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };

    if ([4, 5, 6].includes(colNumber)) {
      cell.numFmt = "#,##0";
      cell.alignment = { horizontal: "center" };
    }

    if ([7, 8, 9, 10, 11, 12].includes(colNumber)) {
      cell.numFmt = "₹#,##0.00";
      cell.alignment = { horizontal: "right" };
    }
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= startRowIndex && rowNumber <= endRowIndex) {
      const isEven = rowNumber % 2 === 0;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (isEven) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF9FAFB" },
          };
        }
        if ([1, 3, 4, 5, 6, 13, 14].includes(colNumber)) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
        }
        if ([7, 8, 9, 10, 11, 12].includes(colNumber)) {
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

  worksheet.columns.forEach((column) => {
    let maxLength = 16;
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
