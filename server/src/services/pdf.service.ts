import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { storage } from "../config/storage.js";

interface CertificateData {
  certificateNumber: string;
  studentName: string;
  courseName: string;
  instructorName: string;
  issueDate: Date;
}

// Generates a simple, professional certificate PDF and saves it to local storage.
// Swap the fs.writeFileSync target for a Cloudinary/S3 upload in production.
export function generateCertificatePdf(data: CertificateData): Promise<string> {
  return new Promise((resolve, reject) => {
    const filename = `certificate-${data.certificateNumber}.pdf`;
    const filepath = path.join(storage.uploadDir, filename);

    const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(3).stroke("#4338CA");
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).lineWidth(1).stroke("#818CF8");

    doc.fontSize(12).fillColor("#6B7280").text("LMS PLATFORM", 0, 70, { align: "center" });
    doc.fontSize(34).fillColor("#111827").text("Certificate of Completion", 0, 100, { align: "center" });

    doc.moveDown(2);
    doc.fontSize(14).fillColor("#6B7280").text("This certifies that", { align: "center" });
    doc.fontSize(26).fillColor("#4338CA").text(data.studentName, { align: "center" });

    doc.moveDown(1);
    doc.fontSize(14).fillColor("#6B7280").text("has successfully completed the course", { align: "center" });
    doc.fontSize(20).fillColor("#111827").text(data.courseName, { align: "center" });

    doc.moveDown(3);
    const y = doc.y;
    doc.fontSize(11).fillColor("#6B7280")
      .text(`Instructor: ${data.instructorName}`, 100, y)
      .text(`Issue Date: ${data.issueDate.toDateString()}`, 100, y + 18)
      .text(`Certificate No: ${data.certificateNumber}`, 100, y + 36);

    doc.end();

    // Resolve with a usable URL (not just the bare filename) so
    // certificate.service can store certificateUrl directly.
    stream.on("finish", () => resolve(storage.getFileUrl(filename)));
    stream.on("error", reject);
  });
}