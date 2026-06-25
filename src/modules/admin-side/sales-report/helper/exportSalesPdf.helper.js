import PDFDocument from "pdfkit";

export const exportSalesPdf = (report, filters = {}) => {
  return new Promise((resolve, reject) => {
    const summary = report?.summary || {};
    const orders = report?.orders || [];
    const { type, startDate, endDate } = filters;

    // Create a landscape A4 document to fit all columns comfortably
    const doc = new PDFDocument({
      margin: 30, // Relaxed margins to expand layout breathing room
      size: "A4",
      layout: "landscape",
      bufferPages: true,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ==========================================
    // CONFIGURATIONS & LAYOUT CONSTANTS
    // ==========================================
    const PAGE_WIDTH = doc.page.width;
    const PAGE_HEIGHT = doc.page.height;
    const MARGIN = 30;
    const USABLE_WIDTH = PAGE_WIDTH - MARGIN * 2; // Expanded to 781 points

    // Explicit table column widths summing up exactly to USABLE_WIDTH (781 pt)
    const colWidths = {
      orderNo: 75,
      customer: 105,
      date: 65,
      items: 45,
      gross: 75,
      offer: 75,
      coupon: 75,
      net: 80,
      payment: 90,
      status: 96,
    };

    // Calculate X offsets dynamically based on sequential column widths
    const colX = { orderNo: MARGIN };
    let currentX = MARGIN;
    const keys = Object.keys(colWidths);
    for (let i = 0; i < keys.length - 1; i++) {
      currentX += colWidths[keys[i]];
      colX[keys[i + 1]] = currentX;
    }

    // ==========================================
    // HELPER FUNCTIONS FOR RENDERING
    // ==========================================

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

    const drawSummaryGrid = () => {
      const topY = 95;
      const boxWidth = 118;
      const boxHeight = 45;
      const spacing = 12;

      const kpiItems = [
        {
          label: "Total Orders",
          val: summary.overallSalesCount ?? 0,
          isCurrency: false,
        },
        { label: "Items Sold", val: summary.itemsSold ?? 0, isCurrency: false },
        {
          label: "Gross Sales",
          val: summary.grossSales ?? 0,
          isCurrency: true,
        },
        {
          label: "Offer Discount",
          val: summary.offerDiscount ?? 0,
          isCurrency: true,
        },
        {
          label: "Coupon Discount",
          val: summary.couponDiscount ?? 0,
          isCurrency: true,
        },
        { label: "Net Sales", val: summary.netSales ?? 0, isCurrency: true },
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

        // ✅ Using global 'INR' standard syntax safely to display across all PDF engines cleanly
        const textVal = kpi.isCurrency
          ? `INR ${Number(kpi.val).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
          : String(kpi.val);

        doc
          .fillColor("#0F172A")
          .font("Helvetica-Bold")
          .fontSize(10.5)
          .text(textVal, x + 8, topY + 24);
      });
    };

    const drawTableHeader = (y) => {
      doc.rect(MARGIN, y, USABLE_WIDTH, 22).fill("#1E3A8A");
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);

      const headers = [
        { label: "Order No", key: "orderNo", align: "center" },
        { label: "Customer", key: "customer", align: "left" },
        { label: "Date", key: "date", align: "center" },
        { label: "Items", key: "items", align: "center" },
        { label: "Gross", key: "gross", align: "right" },
        { label: "Offer Disc", key: "offer", align: "right" },
        { label: "Coupon Disc", key: "coupon", align: "right" },
        { label: "Net Total", key: "net", align: "right" },
        { label: "Payment", key: "payment", align: "center" },
        { label: "Status", key: "status", align: "center" },
      ];

      headers.forEach((h) => {
        doc.text(h.label, colX[h.key], y + 6, {
          width: colWidths[h.key],
          align: h.align,
        });
      });
    };

    // ==========================================
    // INITIAL SETUP
    // ==========================================
    drawHeaderBlock();
    drawSummaryGrid();

    let currentY = 160;
    drawTableHeader(currentY);
    currentY += 22;

    // ==========================================
    // TRANSACTIONS PROCESSING LOOP
    // ==========================================
    orders.forEach((order, index) => {
      const itemsCount =
        order.items?.reduce((t, item) => t + (Number(item.quantity) || 0), 0) ||
        0;
      const orderNo = order.orderNumber ? String(order.orderNumber) : "-";
      const customer = order.user?.fullName || "-";
      const dateStr = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("en-IN")
        : "-";

      const gross = (Number(order.subtotal) || 0).toFixed(2);
      const offer = (Number(order.discount) || 0).toFixed(2);
      const coupon = (Number(order.coupon?.discountAmount) || 0).toFixed(2);
      const net = (Number(order.totalAmount) || 0).toFixed(2);

      const payment = order.paymentMethod || "-";
      const status = order.orderStatus || "-";

      doc.font("Helvetica").fontSize(8);

      const orderNoHeight = doc.heightOfString(orderNo, {
        width: colWidths.orderNo,
      });
      const customerHeight = doc.heightOfString(customer, {
        width: colWidths.customer - 6,
      });
      const rowHeight = Math.max(orderNoHeight, customerHeight, 14) + 12;

      const BOTTOM_SAFETY_MARGIN = 50;
      if (currentY + rowHeight > PAGE_HEIGHT - BOTTOM_SAFETY_MARGIN) {
        doc.addPage();
        currentY = MARGIN;
        drawTableHeader(currentY);
        currentY += 22;
      }

      if (index % 2 === 1) {
        doc.rect(MARGIN, currentY, USABLE_WIDTH, rowHeight).fill("#F9FAFB");
      }

      const textPaddingTop = (rowHeight - 8) / 2;

      doc.fillColor("#334155");
      doc.text(orderNo, colX.orderNo, currentY + textPaddingTop, {
        width: colWidths.orderNo,
        align: "center",
      });
      doc.text(customer, colX.customer + 4, currentY + textPaddingTop, {
        width: colWidths.customer - 6,
        align: "left",
      });
      doc.text(dateStr, colX.date, currentY + textPaddingTop, {
        width: colWidths.date,
        align: "center",
      });
      doc.text(String(itemsCount), colX.items, currentY + textPaddingTop, {
        width: colWidths.items,
        align: "center",
      });

      doc.text(gross, colX.gross, currentY + textPaddingTop, {
        width: colWidths.gross - 4,
        align: "right",
      });
      doc.text(offer, colX.offer, currentY + textPaddingTop, {
        width: colWidths.offer - 4,
        align: "right",
      });
      doc.text(coupon, colX.coupon, currentY + textPaddingTop, {
        width: colWidths.coupon - 4,
        align: "right",
      });
      doc.text(net, colX.net, currentY + textPaddingTop, {
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

    // ==========================================
    // TOTALS ROW
    // ==========================================
    if (currentY + 22 > PAGE_HEIGHT - 50) {
      doc.addPage();
      currentY = MARGIN;
      drawTableHeader(currentY);
      currentY += 22;
    }

    doc.rect(MARGIN, currentY, USABLE_WIDTH, 22).fill("#F1F5F9");
    doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(8.5);

    doc.text("TOTALS", colX.orderNo + 4, currentY + 6, {
      width: colWidths.orderNo,
      align: "left",
    });
    doc.text(String(summary.itemsSold || 0), colX.items, currentY + 6, {
      width: colWidths.items,
      align: "center",
    });
    doc.text(
      (Number(summary.grossSales) || 0).toFixed(2),
      colX.gross,
      currentY + 6,
      { width: colWidths.gross - 4, align: "right" },
    );
    doc.text(
      (Number(summary.offerDiscount) || 0).toFixed(2),
      colX.offer,
      currentY + 6,
      { width: colWidths.offer - 4, align: "right" },
    );
    doc.text(
      (Number(summary.couponDiscount) || 0).toFixed(2),
      colX.coupon,
      currentY + 6,
      { width: colWidths.coupon - 4, align: "right" },
    );
    doc.text(
      (Number(summary.netSales) || 0).toFixed(2),
      colX.net,
      currentY + 6,
      { width: colWidths.net - 4, align: "right" },
    );

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

    // ==========================================
    // FOOTER
    // ==========================================
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
