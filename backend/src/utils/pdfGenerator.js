/**
 * PDF Certificate Generator using pdf-lib
 */
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

/**
 * Generate a Certificate of Social Responsibility PDF
 * @param {Object} data - Certificate data
 * @returns {string} Path to generated PDF
 */
exports.generateCertificate = async (data) => {
  const { certificateNumber, userName, issueAddressed, location, date, hours } = data;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  // Background - subtle gradient effect with rectangles
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.96, 0.97, 1) });

  // Border
  const borderWidth = 3;
  page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40,
    borderColor: rgb(0.15, 0.31, 0.68), borderWidth, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60,
    borderColor: rgb(0.23, 0.39, 0.84), borderWidth: 1 });

  // Header accent line
  page.drawRectangle({ x: 100, y: height - 100, width: width - 200, height: 4, color: rgb(0.23, 0.39, 0.84) });

  // Title
  page.drawText('CERTIFICATE', { x: 250, y: height - 140, size: 36, font: helveticaBold, color: rgb(0.12, 0.24, 0.55) });
  page.drawText('OF SOCIAL RESPONSIBILITY', { x: 210, y: height - 175, size: 20, font: helvetica, color: rgb(0.3, 0.3, 0.3) });

  // CivicLens logo text
  page.drawText('CivicLens AI', { x: 345, y: height - 210, size: 14, font: helveticaBold, color: rgb(0.23, 0.39, 0.84) });

  // Body
  const centerX = width / 2;
  page.drawText('This certificate is proudly presented to', { x: 270, y: height - 260, size: 13, font: timesItalic, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(userName, { x: centerX - (userName.length * 8), y: height - 300, size: 28, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });

  // Underline for name
  const nameWidth = helveticaBold.widthOfTextAtSize(userName, 28);
  page.drawRectangle({ x: centerX - nameWidth / 2 - 10, y: height - 305, width: nameWidth + 20, height: 1, color: rgb(0.23, 0.39, 0.84) });

  page.drawText('For outstanding contribution to civic improvement:', { x: 220, y: height - 340, size: 12, font: helvetica, color: rgb(0.3, 0.3, 0.3) });

  // Issue addressed
  const issueText = issueAddressed.length > 60 ? issueAddressed.substring(0, 60) + '...' : issueAddressed;
  page.drawText(`"${issueText}"`, { x: 150, y: height - 370, size: 14, font: timesItalic, color: rgb(0.15, 0.15, 0.15) });

  // Details
  page.drawText(`Location: ${location || 'N/A'}`, { x: 200, y: height - 410, size: 11, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`Date: ${date}`, { x: 200, y: height - 430, size: 11, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(`Hours Contributed: ${hours}`, { x: 200, y: height - 450, size: 11, font: helvetica, color: rgb(0.3, 0.3, 0.3) });

  // Footer accent
  page.drawRectangle({ x: 100, y: 80, width: width - 200, height: 2, color: rgb(0.23, 0.39, 0.84) });
  page.drawText(`Certificate ID: ${certificateNumber}`, { x: 310, y: 60, size: 9, font: helvetica, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('Verified by CivicLens AI — Building Better Cities Together', { x: 240, y: 45, size: 9, font: timesItalic, color: rgb(0.5, 0.5, 0.5) });

  // Save
  const pdfBytes = await pdfDoc.save();
  const outputDir = path.join(__dirname, '../../uploads/certificates');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const filename = `certificate_${certificateNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, pdfBytes);

  return `/uploads/certificates/${filename}`;
};
