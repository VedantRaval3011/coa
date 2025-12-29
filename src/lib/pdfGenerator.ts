import jsPDF from 'jspdf';
import { ParsedXMLData, CertificateData } from './xmlParser';

export interface PDFOptions {
  title?: string;
  includeRawXml?: boolean;
  includeTable?: boolean;
  includeStructure?: boolean;
  generateCertificate?: boolean;
}

export function generatePDF(data: ParsedXMLData, options: PDFOptions = {}): jsPDF {
  const { generateCertificate = true } = options;

  if (generateCertificate && data.certificateData) {
    return generateCertificatePDF(data.certificateData, options);
  }

  return generateBasicPDF(data, options);
}

function generateCertificatePDF(certData: CertificateData, options: PDFOptions): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Colors
  const black: [number, number, number] = [0, 0, 0];
  const darkGray: [number, number, number] = [50, 50, 50];

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number): boolean => {
    if (yPos + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper to draw text with word wrapping
  const drawWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number = 4
  ): number => {
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return lines.length * lineHeight;
  };

  // ============ HEADER SECTION ============
  // Company Logo placeholder (circle with cross - medical symbol)
  pdf.setDrawColor(...black);
  pdf.setLineWidth(0.5);
  pdf.circle(margin + 12, yPos + 12, 10);
  pdf.circle(margin + 12, yPos + 12, 8);
  
  // Simple cross inside
  pdf.line(margin + 12, yPos + 6, margin + 12, yPos + 18);
  pdf.line(margin + 6, yPos + 12, margin + 18, yPos + 12);

  // Company Name (large, bold, right of logo)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(...black);
  const companyName = certData.companyInfo.name || options.title || 'COMPANY NAME';
  pdf.text(companyName, margin + 30, yPos + 10);

  // Company Address
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...darkGray);
  
  let addressY = yPos + 16;
  if (certData.companyInfo.address) {
    pdf.text(certData.companyInfo.address, margin + 30, addressY);
    addressY += 3.5;
  }
  if (certData.companyInfo.regOffice) {
    pdf.text(`REG.OFF.: ${certData.companyInfo.regOffice}`, margin + 30, addressY);
    addressY += 3.5;
  }
  if (certData.companyInfo.phone) {
    pdf.text(`Phone: ${certData.companyInfo.phone}`, margin + 30, addressY);
    addressY += 3.5;
  }
  if (certData.companyInfo.email || certData.companyInfo.website) {
    const contactLine = [
      certData.companyInfo.email ? `Email: ${certData.companyInfo.email}` : '',
      certData.companyInfo.website ? `Website: ${certData.companyInfo.website}` : '',
    ].filter(Boolean).join(' | ');
    pdf.text(contactLine, margin + 30, addressY);
  }

  yPos += 32;

  // Horizontal line
  pdf.setDrawColor(...black);
  pdf.setLineWidth(0.3);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // ============ DOCUMENT TITLE SECTION ============
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...black);
  pdf.text(certData.documentInfo.title, pageWidth / 2, yPos, { align: 'center' });

  // Page info on the right
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(certData.documentInfo.pageInfo, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;

  // Regulation text
  pdf.setFontSize(8);
  pdf.text(certData.documentInfo.regulation, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;

  // Main title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(certData.documentInfo.subtitle, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // ============ PRODUCT INFO SECTION ============
  // Draw the main product info box
  const productBoxHeight = 50;
  pdf.setDrawColor(...black);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, yPos, contentWidth, productBoxHeight);

  // Split into two columns
  const leftColWidth = contentWidth * 0.55;
  const rightColWidth = contentWidth * 0.45;
  
  // Vertical line to separate columns
  pdf.line(margin + leftColWidth, yPos, margin + leftColWidth, yPos + productBoxHeight);

  // Left column content
  const leftX = margin + 3;
  let leftY = yPos + 5;
  
  pdf.setFontSize(9);
  
  const drawLabelValue = (label: string, value: string, x: number, y: number, labelWidth: number = 35): number => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, x, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`: ${value}`, x + labelWidth, y);
    return y + 5;
  };

  leftY = drawLabelValue('Product Name', certData.productInfo.productName, leftX, leftY, 28);
  leftY = drawLabelValue('Packing', certData.productInfo.packing, leftX, leftY, 28);
  leftY = drawLabelValue('Generic Name', certData.productInfo.genericName, leftX, leftY, 28);
  
  // Horizontal separator in left column
  leftY += 2;
  pdf.line(margin, leftY - 1, margin + leftColWidth, leftY - 1);
  leftY += 3;

  // Product details grid
  const drawGridRow = (items: Array<{ label: string; value: string }>, startX: number, y: number): number => {
    let x = startX;
    for (const item of items) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text(item.label, x, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`: ${item.value}`, x + 25, y);
      x += 55;
    }
    return y + 5;
  };

  leftY = drawGridRow([
    { label: 'Product Code', value: certData.productInfo.productCode },
    { label: 'Mfg. Dt.', value: certData.productInfo.mfgDate },
  ], leftX, leftY);

  leftY = drawGridRow([
    { label: 'Batch No.', value: certData.productInfo.batchNo },
    { label: 'Exp. Dt.', value: certData.productInfo.expDate },
  ], leftX, leftY);

  leftY = drawGridRow([
    { label: 'Actual Batch Size', value: certData.productInfo.actualBatchSize },
    { label: 'Test Packing', value: certData.productInfo.testPacking },
  ], leftX, leftY);

  drawGridRow([
    { label: 'Packing Batch Size', value: certData.productInfo.packingBatchSize },
    { label: 'Mfg. Lic No.', value: certData.productInfo.mfgLicNo },
  ], leftX, leftY);

  // Right column content
  const rightX = margin + leftColWidth + 3;
  let rightY = yPos + 5;

  rightY = drawLabelValue('A.R. No.', certData.productInfo.arNo, rightX, rightY, 30);
  rightY += 2;
  pdf.line(margin + leftColWidth, rightY - 1, pageWidth - margin, rightY - 1);
  rightY += 3;

  rightY = drawLabelValue('Rel. Dt.', certData.productInfo.relDate, rightX, rightY, 30);
  rightY = drawLabelValue('T.R. Slip No.', certData.productInfo.trSlipNo, rightX, rightY, 30);
  rightY = drawLabelValue('T.R. Slip Dt.', certData.productInfo.trSlipDate, rightX, rightY, 30);
  rightY = drawLabelValue('Analysis Date', certData.productInfo.analysisDate, rightX, rightY, 30);
  rightY = drawLabelValue('Specification No.', certData.productInfo.specificationNo, rightX, rightY, 35);

  yPos += productBoxHeight + 3;

  // Remarks and Location/Make section
  const remarksBoxHeight = 18;
  pdf.rect(margin, yPos, leftColWidth, remarksBoxHeight);
  pdf.rect(margin + leftColWidth, yPos, rightColWidth, remarksBoxHeight);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Remarks :', margin + 3, yPos + 5);
  pdf.setFont('helvetica', 'normal');
  if (certData.productInfo.remarks) {
    pdf.text(certData.productInfo.remarks, margin + 25, yPos + 5);
  }

  // Location and Make
  let locY = yPos + 6;
  locY = drawLabelValue('Location', certData.productInfo.location, rightX, locY, 22);
  drawLabelValue('Make', certData.productInfo.make, rightX, locY, 22);

  yPos += remarksBoxHeight + 5;

  // ============ TEST RESULTS TABLE ============
  checkPageBreak(30);

  // Table headers
  const colWidths = {
    sr: 12,
    test: 60,
    result: 60,
    specification: contentWidth - 12 - 60 - 60,
  };

  const tableHeaderHeight = 8;
  
  // Draw header background
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPos, contentWidth, tableHeaderHeight, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(...black);

  let headerX = margin;
  pdf.text('Sr.', headerX + 3, yPos + 5.5);
  headerX += colWidths.sr;
  
  pdf.text('Test', headerX + 3, yPos + 5.5);
  headerX += colWidths.test;
  
  pdf.text('Result', headerX + 3, yPos + 5.5);
  headerX += colWidths.result;
  
  pdf.text('Specification', headerX + 3, yPos + 5.5);

  // Draw header borders
  pdf.setDrawColor(...black);
  pdf.line(margin, yPos, margin, yPos + tableHeaderHeight);
  pdf.line(margin + colWidths.sr, yPos, margin + colWidths.sr, yPos + tableHeaderHeight);
  pdf.line(margin + colWidths.sr + colWidths.test, yPos, margin + colWidths.sr + colWidths.test, yPos + tableHeaderHeight);
  pdf.line(margin + colWidths.sr + colWidths.test + colWidths.result, yPos, margin + colWidths.sr + colWidths.test + colWidths.result, yPos + tableHeaderHeight);
  pdf.line(pageWidth - margin, yPos, pageWidth - margin, yPos + tableHeaderHeight);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  pdf.line(margin, yPos + tableHeaderHeight, pageWidth - margin, yPos + tableHeaderHeight);

  yPos += tableHeaderHeight;

  // Table rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);

  for (const test of certData.testResults) {
    // Calculate row height based on content
    const testLines = pdf.splitTextToSize(test.test, colWidths.test - 6);
    const resultLines = pdf.splitTextToSize(test.result, colWidths.result - 6);
    const specLines = pdf.splitTextToSize(test.specification, colWidths.specification - 6);
    const maxLines = Math.max(testLines.length, resultLines.length, specLines.length);
    const rowHeight = Math.max(8, maxLines * 4 + 4);

    checkPageBreak(rowHeight);

    // Draw row
    let rowX = margin;
    
    // Sr. No.
    pdf.text(test.srNo, rowX + 3, yPos + 5);
    pdf.line(rowX, yPos, rowX, yPos + rowHeight);
    rowX += colWidths.sr;

    // Test
    pdf.text(testLines, rowX + 3, yPos + 5);
    pdf.line(rowX, yPos, rowX, yPos + rowHeight);
    rowX += colWidths.test;

    // Result
    pdf.text(resultLines, rowX + 3, yPos + 5);
    pdf.line(rowX, yPos, rowX, yPos + rowHeight);
    rowX += colWidths.result;

    // Specification
    pdf.text(specLines, rowX + 3, yPos + 5);
    pdf.line(rowX, yPos, rowX, yPos + rowHeight);
    pdf.line(pageWidth - margin, yPos, pageWidth - margin, yPos + rowHeight);

    // Bottom border of row
    pdf.line(margin, yPos + rowHeight, pageWidth - margin, yPos + rowHeight);

    yPos += rowHeight;

    // Handle sub-tests
    if (test.subTests && test.subTests.length > 0) {
      for (const subTest of test.subTests) {
        const subTestLines = pdf.splitTextToSize(`  ${subTest.srNo}  ${subTest.test}`, colWidths.test - 6);
        const subResultLines = pdf.splitTextToSize(subTest.result, colWidths.result - 6);
        const subSpecLines = pdf.splitTextToSize(subTest.specification, colWidths.specification - 6);
        const subMaxLines = Math.max(subTestLines.length, subResultLines.length, subSpecLines.length);
        const subRowHeight = Math.max(6, subMaxLines * 4 + 2);

        checkPageBreak(subRowHeight);

        rowX = margin;
        pdf.line(rowX, yPos, rowX, yPos + subRowHeight);
        rowX += colWidths.sr;

        pdf.text(subTestLines, rowX + 3, yPos + 4);
        pdf.line(rowX, yPos, rowX, yPos + subRowHeight);
        rowX += colWidths.test;

        pdf.text(subResultLines, rowX + 3, yPos + 4);
        pdf.line(rowX, yPos, rowX, yPos + subRowHeight);
        rowX += colWidths.result;

        pdf.text(subSpecLines, rowX + 3, yPos + 4);
        pdf.line(rowX, yPos, rowX, yPos + subRowHeight);
        pdf.line(pageWidth - margin, yPos, pageWidth - margin, yPos + subRowHeight);
        pdf.line(margin, yPos + subRowHeight, pageWidth - margin, yPos + subRowHeight);

        yPos += subRowHeight;
      }
    }
  }

  // Footer
  yPos = pageHeight - 15;
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  pdf.text('This is a computer-generated document.', pageWidth / 2, yPos, { align: 'center' });
  pdf.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, yPos + 4, { align: 'center' });

  return pdf;
}

function generateBasicPDF(data: ParsedXMLData, options: PDFOptions): jsPDF {
  const {
    title = 'XML Export',
    includeRawXml = true,
    includeTable = true,
  } = options;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const primaryColor: [number, number, number] = [99, 102, 241];
  const textColor: [number, number, number] = [50, 50, 50];
  const lightGray: [number, number, number] = [240, 240, 245];

  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Title
  pdf.setFillColor(...primaryColor);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margin, 28);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on ${new Date().toLocaleString()}`, margin, 36);

  yPos = 55;

  if (includeTable && data.flattenedData.length > 0) {
    pdf.setTextColor(...textColor);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Parsed Data', margin, yPos);
    yPos += 10;

    pdf.setFillColor(...lightGray);
    pdf.rect(margin, yPos, contentWidth, 10, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text('Property', margin + 5, yPos + 7);
    pdf.text('Value', margin + contentWidth / 2, yPos + 7);
    yPos += 12;

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...textColor);
    pdf.setFontSize(9);

    for (const item of data.flattenedData) {
      checkPageBreak(8);

      if (data.flattenedData.indexOf(item) % 2 === 0) {
        pdf.setFillColor(250, 250, 255);
        pdf.rect(margin, yPos - 4, contentWidth, 8, 'F');
      }

      const keyText = item.key.length > 40 ? item.key.substring(0, 37) + '...' : item.key;
      const indent = Math.min(item.depth * 2, 10);
      pdf.text(keyText, margin + 5 + indent, yPos);

      const valueText = item.value.length > 50 ? item.value.substring(0, 47) + '...' : item.value;
      pdf.text(valueText, margin + contentWidth / 2, yPos);

      yPos += 6;
    }

    yPos += 10;
  }

  if (includeRawXml) {
    checkPageBreak(30);
    
    pdf.setTextColor(...textColor);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Raw XML Content', margin, yPos);
    yPos += 10;

    pdf.setFontSize(7);
    pdf.setFont('courier', 'normal');
    pdf.setTextColor(80, 80, 100);

    const lines = data.rawXml.split('\n');
    for (const line of lines) {
      checkPageBreak(5);
      const truncatedLine = line.length > 100 ? line.substring(0, 97) + '...' : line;
      pdf.text(truncatedLine, margin + 2, yPos);
      yPos += 4;
    }
  }

  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(8);
  pdf.text('Generated by XML to PDF Converter', pageWidth / 2, pageHeight - 10, { align: 'center' });

  return pdf;
}

export function downloadPDF(pdf: jsPDF, filename: string = 'export.pdf'): void {
  pdf.save(filename);
}
