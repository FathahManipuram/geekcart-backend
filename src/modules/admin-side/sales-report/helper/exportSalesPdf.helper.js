import PDFDocument from "pdfkit";

export const exportSalesPdf = (report, filters = {}) => {
  return new Promise((resolve, reject) => {
    const summary = report?.summary || {};
    const orders = report?.orders || [];
    const { type, startDate, endDate } = filters;

    const doc = new PDFDocument({
      margin: 30,
      size: "A4",
      layout: "landscape",
      bufferPages: true,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // LAYOUT CONSTANTS

    const PAGE_WIDTH = doc.page.width;
    const PAGE_HEIGHT = doc.page.height;
    const MARGIN = 30;
    const USABLE_WIDTH = PAGE_WIDTH - MARGIN * 2;

    const colWidths = {
      orderNo: 60,
      customer: 85,
      date: 55,
      orderedQty: 40,
      cancelledQty: 40,
      returnedQty: 40,
      gross: 70,
      offer: 65,
      coupon: 65,
      refundedAmt: 70,
      net: 70,
      payment: 62,
      status: 60,
    };

    const colX = {};
    let currentX = MARGIN;
    Object.keys(colWidths).forEach((key) => {
      colX[key] = currentX;
      currentX += colWidths[key];
    });

    // Dynamic accumulators
    const runningTotals = {
      orderedQty: 0,
      cancelledQty: 0,
      returnedQty: 0,
      gross: 0,
      offer: 0,
      coupon: 0,
      refundedAmt: 0,
      net: 0,
    };

    // HELPER FUNCTIONS FOR RENDERING

    const drawHeaderBlock = () => {
      doc
        .fillColor("#1E293B")
        .font("Helvetica-Bold")
        .fontSize(22)
        .text("GeekCart Sales Report", MARGIN, 35);

      doc.fontSize(9).font("Helvetica").fillColor("#64748B");
      doc.text(
        `Generated On: ${new Date().toLocaleString("en-IN")}`,
        MARGIN,
        60,
      );

      let periodText = "All Time";
      if (type === "custom" && startDate && endDate) {
        periodText = `${new Date(startDate).toLocaleDateString("en-IN")} to ${new Date(endDate).toLocaleDateString("en-IN")}`;
      } else if (type) {
        periodText = type.charAt(0).toUpperCase() + type.slice(1);
      }
      doc.text(`Reporting Period: ${periodText}`, MARGIN, 72);
    };

    const drawSummaryGrid = (calculatedTotals) => {
      const topY = 95;
      const boxWidth = 118;
      const boxHeight = 45;
      const spacing = 12;

      const kpiItems = [
        { label: "Total Orders", val: orders.length, isCurrency: false },
        {
          label: "Items Sold (Net)",
          val: summary.itemsSold ?? calculatedTotals.orderedQty,
          isCurrency: false,
        },
        { label: "Gross Sales", val: calculatedTotals.gross, isCurrency: true },
        {
          label: "Offer Discount",
          val: calculatedTotals.offer,
          isCurrency: true,
        },
        {
          label: "Coupon Discount",
          val: calculatedTotals.coupon,
          isCurrency: true,
        },
        { label: "Net Sales", val: calculatedTotals.net, isCurrency: true }, // ✅ Perfectly balanced
      ];

      kpiItems.forEach((kpi, idx) => {
        const x = MARGIN + idx * (boxWidth + spacing);
        doc
          .rect(x, topY, boxWidth, boxHeight)
          .fillAndStroke("#F8FAFC", "#E2E8F0");
        doc
          .fillColor("#64748B")
          .font("Helvetica-Bold")
          .fontSize(8)
          .text(kpi.label.toUpperCase(), x + 8, topY + 10);

        const textVal = kpi.isCurrency
          ? `Rs. ${Number(kpi.val).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
          : String(kpi.val);

        doc
          .fillColor("#0F172A")
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(textVal, x + 8, topY + 24);
      });
    };

    const drawTableHeader = (y) => {
      doc.rect(MARGIN, y, USABLE_WIDTH, 24).fill("#1E3A8A");
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(7.5);

      const headers = [
        { label: "Order No", key: "orderNo", align: "center" },
        { label: "Customer", key: "customer", align: "left" },
        { label: "Date", key: "date", align: "center" },
        { label: "Ord Qty", key: "orderedQty", align: "center" },
        { label: "Can Qty", key: "cancelledQty", align: "center" },
        { label: "Ret Qty", key: "returnedQty", align: "center" },
        { label: "Gross Sub", key: "gross", align: "right" },
        { label: "Offer Disc", key: "offer", align: "right" },
        { label: "Cpn Disc", key: "coupon", align: "right" },
        { label: "Refunded", key: "refundedAmt", align: "right" },
        { label: "Net Total", key: "net", align: "right" },
        { label: "Payment", key: "payment", align: "center" },
        { label: "Status", key: "status", align: "center" },
      ];

      headers.forEach((h) => {
        const paddingX = h.align === "right" ? 4 : 0;
        doc.text(h.label, colX[h.key], y + 8, {
          width: colWidths[h.key] - paddingX,
          align: h.align,
        });
      });
    };

    // INITIAL SETUP & PROCESSING

    drawHeaderBlock();

    orders.forEach((order) => {
      const orderedQty =
        order.items?.reduce((t, item) => t + (Number(item.quantity) || 0), 0) ||
        0;
      const cancelledQty =
        order.items?.reduce(
          (t, item) =>
            item.itemStatus === "CANCELLED"
              ? t + (Number(item.quantity) || 0)
              : t,
          0,
        ) || 0;
      const returnedQty =
        order.items?.reduce(
          (t, item) =>
            ["RETURN_COMPLETED", "RETURNED"].includes(item.itemStatus)
              ? t + (Number(item.quantity) || 0)
              : t,
          0,
        ) || 0;

      const grossNum = Number(order.subtotal) || 0;
      const offerNum = Number(order.discount) || 0;
      const couponNum = Number(order.coupon?.discountAmount) || 0;
      const refundedAmtNum =
        order.items?.reduce(
          (acc, item) => acc + (Number(item.refundAmount) || 0),
          0,
        ) || 0;

      const netNum = Math.max(
        0,
        (Number(order.totalAmount) || 0) - refundedAmtNum,
      );

      runningTotals.orderedQty += orderedQty;
      runningTotals.cancelledQty += cancelledQty;
      runningTotals.returnedQty += returnedQty;
      runningTotals.gross += grossNum;
      runningTotals.offer += offerNum;
      runningTotals.coupon += couponNum;
      runningTotals.refundedAmt += refundedAmtNum;
      runningTotals.net += netNum;
    });

    drawSummaryGrid(runningTotals);

    let currentY = 160;
    drawTableHeader(currentY);
    currentY += 24;

    // TRANSACTIONS PRINTING LOOP

    orders.forEach((order, index) => {
      const orderedQty =
        order.items?.reduce((t, item) => t + (Number(item.quantity) || 0), 0) ||
        0;
      const cancelledQty =
        order.items?.reduce(
          (t, item) =>
            item.itemStatus === "CANCELLED"
              ? t + (Number(item.quantity) || 0)
              : t,
          0,
        ) || 0;
      const returnedQty =
        order.items?.reduce(
          (t, item) =>
            ["RETURN_COMPLETED", "RETURNED"].includes(item.itemStatus)
              ? t + (Number(item.quantity) || 0)
              : t,
          0,
        ) || 0;

      const orderNo = order.orderNumber ? String(order.orderNumber) : "-";
      const customer = order.user?.fullName || "-";
      const dateStr = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("en-IN")
        : "-";

      const grossNum = Number(order.subtotal) || 0;
      const offerNum = Number(order.discount) || 0;
      const couponNum = Number(order.coupon?.discountAmount) || 0;
      const refundedAmtNum =
        order.items?.reduce(
          (acc, item) => acc + (Number(item.refundAmount) || 0),
          0,
        ) || 0;
      const netNum = Math.max(
        0,
        (Number(order.totalAmount) || 0) - refundedAmtNum,
      );

      const payment = order.paymentMethod || "-";
      const status = order.orderStatus || "-";

      doc.font("Helvetica").fontSize(7.5);

      const orderNoHeight = doc.heightOfString(orderNo, {
        width: colWidths.orderNo,
      });
      const customerHeight = doc.heightOfString(customer, {
        width: colWidths.customer - 4,
      });
      const rowHeight = Math.max(orderNoHeight, customerHeight, 14) + 10;

      const BOTTOM_SAFETY_MARGIN = 50;
      if (currentY + rowHeight > PAGE_HEIGHT - BOTTOM_SAFETY_MARGIN) {
        doc.addPage();
        currentY = MARGIN;
        drawTableHeader(currentY);
        currentY += 24;
      }

      if (index % 2 === 1) {
        doc.rect(MARGIN, currentY, USABLE_WIDTH, rowHeight).fill("#F9FAFB");
      }

      const textPaddingTop = (rowHeight - 7.5) / 2;
      doc.fillColor("#334155");

      doc.text(orderNo, colX.orderNo, currentY + textPaddingTop, {
        width: colWidths.orderNo,
        align: "center",
      });
      doc.text(customer, colX.customer + 2, currentY + textPaddingTop, {
        width: colWidths.customer - 4,
        align: "left",
      });
      doc.text(dateStr, colX.date, currentY + textPaddingTop, {
        width: colWidths.date,
        align: "center",
      });
      doc.text(String(orderedQty), colX.orderedQty, currentY + textPaddingTop, {
        width: colWidths.orderedQty,
        align: "center",
      });
      doc.text(
        String(cancelledQty),
        colX.cancelledQty,
        currentY + textPaddingTop,
        { width: colWidths.cancelledQty, align: "center" },
      );
      doc.text(
        String(returnedQty),
        colX.returnedQty,
        currentY + textPaddingTop,
        { width: colWidths.returnedQty, align: "center" },
      );

      doc.text(grossNum.toFixed(2), colX.gross, currentY + textPaddingTop, {
        width: colWidths.gross - 4,
        align: "right",
      });
      doc.text(offerNum.toFixed(2), colX.offer, currentY + textPaddingTop, {
        width: colWidths.offer - 4,
        align: "right",
      });
      doc.text(couponNum.toFixed(2), colX.coupon, currentY + textPaddingTop, {
        width: colWidths.coupon - 4,
        align: "right",
      });
      doc.text(
        refundedAmtNum.toFixed(2),
        colX.refundedAmt,
        currentY + textPaddingTop,
        { width: colWidths.refundedAmt - 4, align: "right" },
      );
      doc.text(netNum.toFixed(2), colX.net, currentY + textPaddingTop, {
        width: colWidths.net - 4,
        align: "right",
      });

      doc.text(payment, colX.payment, currentY + textPaddingTop, {
        width: colWidths.payment,
        align: "center",
      });
      doc.text(status, colX.status, currentY + textPaddingTop, {
        width: colWidths.status,
        align: "center",
      });

      doc
        .moveTo(MARGIN, currentY + rowHeight)
        .lineTo(PAGE_WIDTH - MARGIN, currentY + rowHeight)
        .strokeColor("#E2E8F0")
        .lineWidth(0.5)
        .stroke();

      currentY += rowHeight;
    });

    // TOTALS ROW

    if (currentY + 22 > PAGE_HEIGHT - 50) {
      doc.addPage();
      currentY = MARGIN;
      drawTableHeader(currentY);
      currentY += 24;
    }

    doc.rect(MARGIN, currentY, USABLE_WIDTH, 22).fill("#F1F5F9");
    doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(7.5);

    doc.text("TOTALS", colX.orderNo + 4, currentY + 7, {
      width: colWidths.orderNo,
      align: "left",
    });
    doc.text(String(runningTotals.orderedQty), colX.orderedQty, currentY + 7, {
      width: colWidths.orderedQty,
      align: "center",
    });
    doc.text(
      String(runningTotals.cancelledQty),
      colX.cancelledQty,
      currentY + 7,
      { width: colWidths.cancelledQty, align: "center" },
    );
    doc.text(
      String(runningTotals.returnedQty),
      colX.returnedQty,
      currentY + 7,
      { width: colWidths.returnedQty, align: "center" },
    );

    doc.text(
      `Rs. ${runningTotals.gross.toFixed(2)}`,
      colX.gross,
      currentY + 7,
      { width: colWidths.gross - 4, align: "right" },
    );
    doc.text(
      `Rs. ${runningTotals.offer.toFixed(2)}`,
      colX.offer,
      currentY + 7,
      { width: colWidths.offer - 4, align: "right" },
    );
    doc.text(
      `Rs. ${runningTotals.coupon.toFixed(2)}`,
      colX.coupon,
      currentY + 7,
      { width: colWidths.coupon - 4, align: "right" },
    );
    doc.text(
      `Rs. ${runningTotals.refundedAmt.toFixed(2)}`,
      colX.refundedAmt,
      currentY + 7,
      { width: colWidths.refundedAmt - 4, align: "right" },
    );
    doc.text(`Rs. ${runningTotals.net.toFixed(2)}`, colX.net, currentY + 7, {
      width: colWidths.net - 4,
      align: "right",
    });

    doc
      .moveTo(MARGIN, currentY)
      .lineTo(PAGE_WIDTH - MARGIN, currentY)
      .strokeColor("#000000")
      .lineWidth(0.75)
      .stroke();
    doc
      .moveTo(MARGIN, currentY + 22)
      .lineTo(PAGE_WIDTH - MARGIN, currentY + 22)
      .strokeColor("#000000")
      .lineWidth(1.5)
      .stroke();

    // FOOTER

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .moveTo(MARGIN, PAGE_HEIGHT - 30)
        .lineTo(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 30)
        .strokeColor("#CBD5E1")
        .lineWidth(0.5)
        .stroke();
      doc.fillColor("#94A3B8").font("Helvetica").fontSize(8);
      doc.text(
        "GeekCart E-Commerce Platform — Private Sales Audit Ledger",
        MARGIN,
        PAGE_HEIGHT - 24,
      );
      doc.text(
        `Page ${i + 1} of ${range.count}`,
        PAGE_WIDTH - MARGIN - 100,
        PAGE_HEIGHT - 24,
        { width: 100, align: "right" },
      );
    }

    doc.end();
  });
};
