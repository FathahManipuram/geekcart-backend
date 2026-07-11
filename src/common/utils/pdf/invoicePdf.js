import PDFDocument from "pdfkit";
import { formatCurrency } from "./pdfHelpers.js";

export const generateInvoicePdf = ({ order, res }) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${order.orderNumber}.pdf`,
  );

  doc.pipe(res);

  // HEADER
  doc
    .fontSize(30)
    .fillColor("#805630")
    .font("Helvetica-Bold")
    .text("GEEKCART", 50, 50);

  doc
    .fillColor("#666666")
    .font("Helvetica")
    .fontSize(10)
    .text("Premium Mens' Fashion Store", 50, 85)
    .text("support@geekcart.com", 50, 100)
    .text("Kerala, India", 50, 115);

  doc
    .fillColor("#000000")
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("INVOICE", 430, 55);

  doc.moveTo(50, 140).lineTo(550, 140).strokeColor("#dddddd").stroke();

  // DETAILS GRID
  const startY = 160;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#666666")
    .text("INVOICE DETAILS", 50, startY);
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#000000")
    .text(`Invoice No: `, 50, startY + 20)
    .text(`INV-${order.orderNumber}`, 50, startY + 40)
    .text(
      `Date: ${new Date(order.createdAt).toLocaleDateString()}`,
      50,
      startY + 60,
    )
    .text(`Payment Method: ${order.paymentMethod || "-"}`, 50, startY + 80);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#666666")
    .text("BILLING ADDRESS", 220, startY);
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#000000")
    .text(order.user?.fullName || "-", 220, startY + 20)
    .text(order.user?.email || "-", 220, startY + 40);

  const address = order.shippingAddress;
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#666666")
    .text("SHIPPING ADDRESS", 380, startY);
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#000000")
    .text(address?.fullName || "-", 380, startY + 20)
    .text(address?.addressLine || "-", 380, startY + 40)
    .text(`${address?.city || ""}, ${address?.state || ""}`, 380, startY + 80)
    .text(
      `${address?.country || ""} - ${address?.pincode || ""}`,
      380,
      startY + 100,
    );

  doc
    .fontSize(11)
    .fillColor("#000000")
    .text(`Order Status: ${order.orderStatus}`, 50, startY + 110);
  doc
    .fillColor(order.paymentStatus === "PAID" ? "green" : "red")
    .text(`Payment Status: ${order.paymentStatus}`, 220, startY + 110);

  doc.moveTo(50, 295).lineTo(550, 295).strokeColor("#dddddd").stroke();

  // PRODUCT TABLE
  let tableY = 320;
  doc.rect(50, tableY - 8, 500, 25).fillAndStroke("#f5f5f5", "#dddddd");

  doc
    .fillColor("#000000")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("PRODUCT", 55, tableY)
    .text("QTY", 320, tableY)
    .text("PRICE", 390, tableY)
    .text("TOTAL", 480, tableY);

  let currentY = tableY + 35;

  // Track exact accumulated financial deductions
  let cancellationRefund = 0;
  let returnRefund = 0;

  order.items.forEach((item) => {
    if (currentY > 720) {
      doc.addPage();
      currentY = 60;

      doc.rect(50, currentY - 8, 500, 25).fillAndStroke("#f5f5f5", "#dddddd");
      doc
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("PRODUCT", 55, currentY)
        .text("QTY", 320, currentY)
        .text("PRICE", 390, currentY)
        .text("TOTAL", 480, currentY);
      currentY += 35;
    }

    doc.font("Helvetica");

    const originalPrice = item.price ?? 0;
    const unitPrice = item.salePrice ?? originalPrice;
    const rowTotal = unitPrice * item.quantity;

    const isItemCancelled = item.itemStatus === "CANCELLED";
    const isItemReturned = item.itemStatus === "RETURN_COMPLETED";

    // FIX: Using ?? instead of || so that an intentional 0 value isn't ignored
    if (isItemCancelled) {
      cancellationRefund += item.refundAmount ?? rowTotal;
    } else if (isItemReturned) {
      returnRefund += item.refundAmount ?? rowTotal;
    }

    doc
      .fontSize(11)
      .fillColor("#000000")
      .text(item.name, 50, currentY, { width: 220 });

    let dynamicStatusText = `${item.color || "-"} / ${item.size || "-"}`;
    if (isItemCancelled) dynamicStatusText += "  [ CANCELLED ]";
    if (isItemReturned) dynamicStatusText += "  [ RETURNED ]";

    doc
      .fontSize(9)
      .fillColor("#666666")
      .text(dynamicStatusText, 50, currentY + 15);

    doc
      .fontSize(11)
      .fillColor("#000000")
      .text(String(item.quantity), 320, currentY);

    if (item.salePrice && item.salePrice < originalPrice) {
      doc
        .fontSize(9)
        .fillColor("#999999")
        .text(formatCurrency(originalPrice), 390, currentY - 5);

      doc
        .moveTo(390, currentY - 1)
        .lineTo(430, currentY - 1)
        .strokeColor("#999999")
        .lineWidth(0.5)
        .stroke();

      doc
        .fontSize(11)
        .fillColor("#000000")
        .text(formatCurrency(unitPrice), 390, currentY + 8);
    } else {
      doc
        .fontSize(11)
        .fillColor("#000000")
        .text(formatCurrency(unitPrice), 390, currentY);
    }

    doc.text(formatCurrency(rowTotal), 470, currentY);

    doc
      .moveTo(50, currentY + 35)
      .lineTo(550, currentY + 35)
      .strokeColor("#eeeeee")
      .lineWidth(1)
      .stroke();
    currentY += 55;
  });

  // SUMMARY BLOCK
  const subtotal = order.subtotal || 0;
  const productDiscount = order.discount || 0;
  const couponDiscount = order.coupon?.discountAmount || 0;
  const couponCode = order.coupon?.code || "";
  const shipping = order.deliveryCharge || 0;
  const tax = order.tax || 0;
  const grandTotal = order.totalAmount || 0;

  const totalDeductions = cancellationRefund + returnRefund;
  const netPaid = Math.max(0, grandTotal - totalDeductions);

  if (currentY > 520) {
    doc.addPage();
    currentY = 60;
  }

  let summaryY = currentY + 15;

  // Subtotal
  doc
    .fontSize(11)
    .font("Helvetica")
    .fillColor("#000000")
    .text("Subtotal", 350, summaryY);
  doc.text(formatCurrency(subtotal), 470, summaryY);
  summaryY += 18;

  // Product Discount
  doc.text("Product Discount", 350, summaryY);
  doc.text(`- ${formatCurrency(productDiscount)}`, 470, summaryY);
  summaryY += 18;

  // Coupon Discount
  if (couponDiscount > 0) {
    doc.fillColor("#000000").text("Coupon Discount", 350, summaryY);
    doc.text(`- ${formatCurrency(couponDiscount)}`, 470, summaryY);
    summaryY += 16;

    if (couponCode) {
      doc
        .fontSize(9)
        .fillColor("#666666")
        .text(`Code: ${couponCode}`, 350, summaryY);
      summaryY += 16;
    }
    doc.fontSize(11).fillColor("#000000");
  }

  // Delivery Charge
  doc.text("Delivery Charge", 350, summaryY);
  doc.text(formatCurrency(shipping), 470, summaryY);
  summaryY += 18;

  // Estimated Tax
  doc.text("Estimated Tax", 350, summaryY);
  doc.text(formatCurrency(tax), 470, summaryY);
  summaryY += 22;

  // Divider Line
  doc
    .moveTo(350, summaryY)
    .lineTo(550, summaryY)
    .strokeColor("#666666")
    .lineWidth(1)
    .stroke();
  summaryY += 12;

  // ORIGINAL GRAND TOTAL
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#000000")
    .text("Grand Total", 350, summaryY);
  doc.text(formatCurrency(grandTotal), 470, summaryY);

  // REFUND SECTION
  if (totalDeductions > 0) {
    summaryY += 30;

    doc
      .moveTo(320, summaryY)
      .lineTo(550, summaryY)
      .strokeColor("#000000")
      .lineWidth(1)
      .stroke();
    summaryY += 15;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#666666")
      .text("REFUNDS", 350, summaryY);
    summaryY += 20;

    doc.font("Helvetica").fontSize(11);

    if (cancellationRefund > 0) {
      doc.fillColor("#dc2626").text("Cancelled items reduction", 350, summaryY);
      doc.text(` - ${formatCurrency(cancellationRefund)}`, 470, summaryY);
      summaryY += 20;
    }

    if (returnRefund > 0) {
      doc.fillColor("#dc2626").text("Returned items reduction", 350, summaryY);
      doc.text(`- ${formatCurrency(returnRefund)}`, 470, summaryY);
      summaryY += 20;
    }

    doc
      .moveTo(350, summaryY + 5)
      .lineTo(550, summaryY + 5)
      .strokeColor("#dddddd")
      .stroke();
    summaryY += 15;

    // NET PAID BALANCE
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#16a34a")
      .text("Final Net Amount", 350, summaryY);
    doc.text(formatCurrency(netPaid), 470, summaryY);
  }

  // FOOTER
  const footerY = 760;
  doc
    .moveTo(50, footerY)
    .lineTo(550, footerY)
    .strokeColor("#dddddd")
    .lineWidth(1)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#666666")
    .text(
      "Thank you for shopping with GeekCart  |  support@geekcart.com",
      50,
      footerY + 12,
      {
        align: "center",
        width: 500,
      },
    );

  doc.end();
};
