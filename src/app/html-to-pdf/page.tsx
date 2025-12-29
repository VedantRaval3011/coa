'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function HtmlToPdfPage() {
    const [htmlContent, setHtmlContent] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    const [pdfOptions, setPdfOptions] = useState({
        orientation: 'portrait' as 'portrait' | 'landscape',
        format: 'a4' as 'a4' | 'letter' | 'legal',
        scale: 2,
        preserveStyles: true,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Sample HTML templates
    const sampleTemplates = [
        {
            name: 'Certificate Template',
            html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; background: #fff; }
    .certificate { border: 3px double #333; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .company-name { font-size: 28px; font-weight: bold; color: #1a365d; margin-bottom: 5px; }
    .subtitle { font-size: 14px; color: #666; }
    .title { text-align: center; margin: 30px 0; }
    .title h1 { font-size: 24px; color: #1a365d; text-transform: uppercase; letter-spacing: 2px; }
    .content { margin: 20px 0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .info-item { display: flex; }
    .info-label { font-weight: bold; width: 120px; }
    .info-value { color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #333; padding: 10px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    .footer { margin-top: 40px; display: flex; justify-content: space-between; }
    .signature { text-align: center; }
    .signature-line { border-top: 1px solid #333; width: 150px; margin: 40px auto 5px; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="company-name">PHARMA INDUSTRIES LTD.</div>
      <div class="subtitle">Quality Assurance Department</div>
    </div>
    <div class="title">
      <h1>Certificate of Analysis</h1>
    </div>
    <div class="content">
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Product Name:</span><span class="info-value">Paracetamol 500mg</span></div>
        <div class="info-item"><span class="info-label">Batch No:</span><span class="info-value">PCM-2024-001</span></div>
        <div class="info-item"><span class="info-label">Mfg Date:</span><span class="info-value">01-Dec-2024</span></div>
        <div class="info-item"><span class="info-label">Exp Date:</span><span class="info-value">30-Nov-2026</span></div>
      </div>
      <table>
        <thead>
          <tr><th>Sr.</th><th>Test</th><th>Specification</th><th>Result</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>Description</td><td>White Powder</td><td>Complies</td></tr>
          <tr><td>2</td><td>Assay</td><td>98.0% - 102.0%</td><td>99.8%</td></tr>
          <tr><td>3</td><td>pH</td><td>5.0 - 7.0</td><td>6.2</td></tr>
        </tbody>
      </table>
    </div>
    <div class="footer">
      <div class="signature">
        <div class="signature-line"></div>
        <div>QC Manager</div>
      </div>
      <div class="signature">
        <div class="signature-line"></div>
        <div>QA Manager</div>
      </div>
    </div>
  </div>
</body>
</html>`,
        },
        {
            name: 'Invoice Template',
            html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background: #fff; color: #333; }
    .invoice { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .logo { font-size: 32px; font-weight: bold; color: #4f46e5; }
    .invoice-info { text-align: right; }
    .invoice-number { font-size: 24px; font-weight: bold; color: #4f46e5; }
    .invoice-date { color: #666; margin-top: 5px; }
    .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .address-block h3 { margin: 0 0 10px 0; color: #4f46e5; font-size: 14px; text-transform: uppercase; }
    .address-block p { margin: 0; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #4f46e5; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    .amount { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .totals-row.total { font-size: 18px; font-weight: bold; color: #4f46e5; border-top: 2px solid #4f46e5; border-bottom: none; padding-top: 15px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">ACME Corp</div>
      <div class="invoice-info">
        <div class="invoice-number">INV-2024-0042</div>
        <div class="invoice-date">December 23, 2024</div>
      </div>
    </div>
    <div class="addresses">
      <div class="address-block">
        <h3>Bill To</h3>
        <p><strong>John Smith</strong><br>123 Business Street<br>New York, NY 10001<br>USA</p>
      </div>
      <div class="address-block">
        <h3>Ship To</h3>
        <p><strong>John Smith</strong><br>456 Delivery Lane<br>New York, NY 10002<br>USA</p>
      </div>
    </div>
    <table>
      <thead>
        <tr><th>Description</th><th>Qty</th><th>Rate</th><th class="amount">Amount</th></tr>
      </thead>
      <tbody>
        <tr><td>Web Development Services</td><td>40</td><td>$75.00</td><td class="amount">$3,000.00</td></tr>
        <tr><td>UI/UX Design</td><td>20</td><td>$85.00</td><td class="amount">$1,700.00</td></tr>
        <tr><td>Hosting (Annual)</td><td>1</td><td>$299.00</td><td class="amount">$299.00</td></tr>
      </tbody>
    </table>
    <div class="totals">
      <div class="totals-row"><span>Subtotal</span><span>$4,999.00</span></div>
      <div class="totals-row"><span>Tax (10%)</span><span>$499.90</span></div>
      <div class="totals-row total"><span>Total</span><span>$5,498.90</span></div>
    </div>
    <div class="footer">Thank you for your business!</div>
  </div>
</body>
</html>`,
        },
        {
            name: 'Report Template',
            html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; padding: 40px; background: #fff; line-height: 1.8; }
    .report { max-width: 800px; margin: 0 auto; }
    .cover { text-align: center; padding: 60px 0; border-bottom: 3px solid #1a365d; margin-bottom: 40px; }
    .cover h1 { font-size: 36px; color: #1a365d; margin-bottom: 10px; }
    .cover .subtitle { font-size: 18px; color: #666; }
    .cover .date { margin-top: 30px; color: #888; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #1a365d; font-size: 22px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    .section p { text-align: justify; color: #444; }
    .highlight { background: #f7fafc; border-left: 4px solid #4f46e5; padding: 15px 20px; margin: 20px 0; }
    .stats { display: flex; gap: 20px; margin: 30px 0; }
    .stat-box { flex: 1; background: #1a365d; color: white; padding: 20px; text-align: center; border-radius: 8px; }
    .stat-number { font-size: 32px; font-weight: bold; }
    .stat-label { font-size: 14px; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="report">
    <div class="cover">
      <h1>Annual Performance Report</h1>
      <div class="subtitle">Fiscal Year 2024</div>
      <div class="date">December 2024</div>
    </div>
    <div class="section">
      <h2>Executive Summary</h2>
      <p>This report provides a comprehensive overview of our organizational performance during the fiscal year 2024. Key achievements include significant growth in revenue, expansion into new markets, and successful implementation of strategic initiatives.</p>
      <div class="highlight">
        <strong>Key Insight:</strong> Revenue increased by 35% compared to the previous fiscal year, exceeding our initial projections by 12%.
      </div>
    </div>
    <div class="stats">
      <div class="stat-box"><div class="stat-number">$12.5M</div><div class="stat-label">Total Revenue</div></div>
      <div class="stat-box"><div class="stat-number">+35%</div><div class="stat-label">YoY Growth</div></div>
      <div class="stat-box"><div class="stat-number">1,250</div><div class="stat-label">New Customers</div></div>
    </div>
    <div class="section">
      <h2>Conclusion</h2>
      <p>The fiscal year 2024 has been marked by exceptional performance across all key metrics. Our strategic focus on innovation and customer satisfaction has yielded remarkable results, positioning us well for continued growth in the coming year.</p>
    </div>
  </div>
</body>
</html>`,
        },
    ];

    const handleFileUpload = useCallback(async (file: File) => {
        if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
            setError('Please upload a valid HTML file (.html or .htm)');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const content = await file.text();
            setHtmlContent(content);
            setFileName(file.name);
            setActiveTab('preview');
        } catch (err) {
            setError(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileUpload(file);
        }
    }, [handleFileUpload]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    }, [handleFileUpload]);

    const loadTemplate = useCallback((template: typeof sampleTemplates[0]) => {
        setHtmlContent(template.html);
        setFileName(`${template.name}.html`);
        setActiveTab('preview');
    }, []);

    const handleExportPDF = useCallback(async () => {
        if (!htmlContent) return;

        setIsLoading(true);
        setError(null);

        try {
            // Get PDF dimensions in pixels at 96 DPI
            const pdfDimensions = {
                a4: { width: 794, height: 1123 }, // 210mm x 297mm at 96 DPI
                letter: { width: 816, height: 1056 }, // 8.5in x 11in at 96 DPI
                legal: { width: 816, height: 1344 }, // 8.5in x 14in at 96 DPI
            };

            // Margin in pixels (10mm at 96 DPI ≈ 38px)
            const marginPx = 38;

            const dims = pdfDimensions[pdfOptions.format];
            const fullWidth = pdfOptions.orientation === 'portrait' ? dims.width : dims.height;
            // Reduce container width to account for margins on both sides
            const containerWidth = fullWidth - (marginPx * 2);

            // Create an iframe to render the content in isolation
            const iframe = document.createElement('iframe');

            // Position carefully to be off-screen but "visible" to the DOM
            iframe.style.position = 'fixed';
            iframe.style.left = '-10000px';
            iframe.style.top = '0';
            iframe.style.width = `${containerWidth}px`;
            iframe.style.height = '100vh';
            iframe.style.border = 'none';
            iframe.style.zIndex = '-1000';

            document.body.appendChild(iframe);

            // Get iframe document
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) {
                throw new Error('Could not create iframe document');
            }

            // Write content to iframe
            iframeDoc.open();

            // If the content is a full HTML document, write it directly
            // Otherwise wrap it
            const isFullDocument = htmlContent.trim().toLowerCase().startsWith('<!doctype') ||
                htmlContent.trim().toLowerCase().startsWith('<html');

            if (isFullDocument) {
                iframeDoc.write(htmlContent);
            } else {
                iframeDoc.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { margin: 0; padding: 0; background: #fff; }
                            * { box-sizing: border-box; }
                        </style>
                    </head>
                    <body>
                        ${htmlContent}
                    </body>
                    </html>
                `);
            }

            // Inject PDF-specific styles to ensure print consistency and proper alignment
            const style = iframeDoc.createElement('style');
            style.textContent = `
                @page { 
                    margin: 0; 
                    size: ${pdfOptions.format} ${pdfOptions.orientation};
                }
                html, body { 
                    margin: 0 !important;
                    padding: 0 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    overflow-x: hidden !important;
                }
                /* Ensure all content fits within container */
                body > * {
                    max-width: 100% !important;
                    box-sizing: border-box !important;
                }
                /* Table alignment fixes */
                table {
                    width: 100% !important;
                    max-width: 100% !important;
                    table-layout: fixed !important;
                    border-collapse: collapse !important;
                    word-wrap: break-word !important;
                }
                th, td {
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                    vertical-align: top !important;
                    padding: 6px 8px !important;
                }
                /* Prevent page breaks inside these elements */
                table, tr, thead, tbody, th, td, 
                .certificate, .invoice, .report,
                .info-grid, .info-item, .header, .footer {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }
                /* Allow breaks before these elements if needed */
                tbody tr {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }
                /* Ensure tables stay together when possible */
                table {
                    page-break-before: auto !important;
                    page-break-after: auto !important;
                }
                /* Ensure nothing clips content - important for Oracle Reports HTML */
                html, body {
                    overflow: visible !important;
                }
                /* Ensure images don't overflow - but preserve absolute positioning for Oracle Reports */
                img {
                    max-width: 100% !important;
                }
            `;
            iframeDoc.head.appendChild(style);

            iframeDoc.close();

            // Wait for fonts and images to load
            await new Promise(async (resolve) => {
                // Wait for document load
                if (iframe.contentWindow && iframe.contentWindow.document.readyState !== 'complete') {
                    await new Promise(r => iframe.onload = r);
                }

                // Wait for fonts
                try {
                    if (iframeDoc.fonts) { // Check if fonts API is available
                        await iframeDoc.fonts.ready;
                    }
                } catch (e) {
                    console.warn('Font loading check failed', e);
                }

                // Wait for images
                const images = Array.from(iframeDoc.images);
                const imagePromises = images.map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(r => {
                        img.onload = r;
                        img.onerror = r;
                    });
                });

                await Promise.all(imagePromises);

                // Small buffer for final layout settlement
                setTimeout(resolve, 500);
            });

            // Adjust height to fit content
            const contentHeight = Math.max(
                iframeDoc.body.scrollHeight,
                iframeDoc.documentElement.scrollHeight,
                dims.height // Minimum one page
            );

            iframe.style.height = `${contentHeight}px`;

            // Capture with html2canvas - use documentElement for full page capture
            const canvas = await html2canvas(iframeDoc.documentElement, {
                scale: pdfOptions.scale,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                width: containerWidth,
                height: contentHeight,
                windowWidth: containerWidth,
                windowHeight: contentHeight,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
            });

            // Clean up
            document.body.removeChild(iframe);

            // Create PDF
            const pdf = new jsPDF({
                orientation: pdfOptions.orientation,
                unit: 'mm',
                format: pdfOptions.format,
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Margin in mm (matches the pixel margin we used for rendering)
            const marginMm = 10;

            // Calculate image dimensions with margins
            const imgWidth = pageWidth - (marginMm * 2);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Convert canvas to image data
            const imgData = canvas.toDataURL('image/png', 1.0);

            // Available height per page (accounting for top and bottom margins)
            const availableHeight = pageHeight - (marginMm * 2);

            // Add image to PDF, handling multiple pages
            let heightLeft = imgHeight;
            let position = marginMm; // Start with top margin
            let pageNumber = 0;

            while (heightLeft > 0) {
                if (pageNumber > 0) {
                    pdf.addPage();
                    position = marginMm - (pageNumber * availableHeight); // Reset position for new page
                }

                pdf.addImage(imgData, 'PNG', marginMm, position, imgWidth, imgHeight);

                heightLeft -= availableHeight;
                pageNumber++;
            }

            // Download with explicit .pdf extension
            let outputName = fileName ? fileName.replace(/\.(html?|htm)$/i, '') : 'html-export';

            // Sanitize filename
            outputName = outputName.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();

            if (!outputName || outputName.length === 0) {
                outputName = 'document';
            }

            // Ensure .pdf extension
            outputName = outputName.replace(/\.pdf$/i, '');
            outputName = outputName + '.pdf';

            // Create blob and download
            const pdfBlob = pdf.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = outputName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (err) {
            setError(`Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    }, [htmlContent, fileName, pdfOptions]);

    const handleReset = useCallback(() => {
        setHtmlContent('');
        setFileName('');
        setError(null);
        setActiveTab('editor');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    // Update iframe preview when HTML changes
    useEffect(() => {
        if (iframeRef.current && htmlContent) {
            const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
            if (iframeDoc) {
                iframeDoc.open();
                iframeDoc.write(htmlContent);
                iframeDoc.close();
            }
        }
    }, [htmlContent, activeTab]);

    return (
        <div className="gradient-bg min-h-screen relative overflow-hidden">
            {/* Animated orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <header className="py-6 px-8">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="mr-4">
                                <button className="btn-secondary text-sm py-2 px-3 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back
                                </button>
                            </Link>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">HTML to PDF Converter</h1>
                                <p className="text-xs text-gray-400">Convert HTML documents to PDF</p>
                            </div>
                        </div>
                        {htmlContent && (
                            <button onClick={handleReset} className="btn-secondary text-sm py-2 px-4">
                                Clear & Start Over
                            </button>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 px-8 py-8">
                    <div className="max-w-7xl mx-auto">
                        {!htmlContent ? (
                            /* Upload Section */
                            <div className="fade-in">
                                <div className="text-center mb-12">
                                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                        Convert <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">HTML to PDF</span>
                                    </h2>
                                    <p className="text-lg text-gray-400 max-w-lg mx-auto">
                                        Upload an HTML file, paste your code, or use a template to generate a PDF
                                    </p>
                                </div>

                                {/* Upload Zone */}
                                <div
                                    className={`upload-zone p-12 cursor-pointer max-w-2xl mx-auto mb-8 ${isDragging ? 'drag-active' : ''}`}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".html,.htm"
                                        onChange={handleInputChange}
                                        className="hidden"
                                    />

                                    <div className="flex flex-col items-center gap-6">
                                        {isLoading ? (
                                            <div className="spinner" />
                                        ) : (
                                            <>
                                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center border border-rose-500/30">
                                                    <svg className="w-10 h-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xl font-semibold text-white mb-2">
                                                        {isDragging ? 'Drop your file here' : 'Drag & drop your HTML file'}
                                                    </p>
                                                    <p className="text-gray-400">
                                                        or <span className="text-rose-400 underline">browse</span> to upload
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Supports .html and .htm files
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Or Separator */}
                                <div className="flex items-center gap-4 max-w-2xl mx-auto mb-8">
                                    <div className="flex-1 h-px bg-white/10"></div>
                                    <span className="text-gray-500 text-sm">OR</span>
                                    <div className="flex-1 h-px bg-white/10"></div>
                                </div>

                                {/* Paste HTML */}
                                <div className="glass-card p-6 max-w-2xl mx-auto mb-8">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                        </svg>
                                        Paste HTML Code
                                    </h3>
                                    <textarea
                                        value={htmlContent}
                                        onChange={(e) => setHtmlContent(e.target.value)}
                                        placeholder="<!DOCTYPE html>&#10;<html>&#10;  <head>&#10;    <title>My Document</title>&#10;  </head>&#10;  <body>&#10;    <h1>Hello World</h1>&#10;  </body>&#10;</html>"
                                        className="w-full h-40 bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-rose-500 focus:outline-none resize-none"
                                    />
                                    {htmlContent && (
                                        <button
                                            onClick={() => setActiveTab('preview')}
                                            className="mt-4 btn-primary bg-gradient-to-r from-rose-500 to-orange-500"
                                        >
                                            Preview HTML
                                        </button>
                                    )}
                                </div>

                                {/* Templates */}
                                <div className="max-w-4xl mx-auto">
                                    <h3 className="text-lg font-semibold text-white mb-4 text-center">Or start with a template</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {sampleTemplates.map((template, index) => (
                                            <button
                                                key={index}
                                                onClick={() => loadTemplate(template)}
                                                className="glass-card p-6 text-left hover:border-rose-500/50 transition-all group"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <h4 className="text-white font-medium mb-1">{template.name}</h4>
                                                <p className="text-sm text-gray-400">Click to load this template</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3 max-w-2xl mx-auto">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {error}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Editor/Preview Section */
                            <div className="fade-in space-y-6">
                                {/* File Info & Export */}
                                <div className="glass-card p-6 flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{fileName || 'Custom HTML'}</h3>
                                            <p className="text-sm text-gray-400">
                                                {htmlContent.length.toLocaleString()} characters
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-wrap">
                                        {/* PDF Options */}
                                        <select
                                            value={pdfOptions.orientation}
                                            onChange={(e) => setPdfOptions({ ...pdfOptions, orientation: e.target.value as 'portrait' | 'landscape' })}
                                            className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-rose-500 focus:outline-none"
                                        >
                                            <option value="portrait">Portrait</option>
                                            <option value="landscape">Landscape</option>
                                        </select>
                                        <select
                                            value={pdfOptions.format}
                                            onChange={(e) => setPdfOptions({ ...pdfOptions, format: e.target.value as 'a4' | 'letter' | 'legal' })}
                                            className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-rose-500 focus:outline-none"
                                        >
                                            <option value="a4">A4</option>
                                            <option value="letter">Letter</option>
                                            <option value="legal">Legal</option>
                                        </select>
                                        <button
                                            onClick={handleExportPDF}
                                            className="btn-primary bg-gradient-to-r from-rose-500 to-orange-500"
                                            disabled={isLoading}
                                        >
                                            <span className="flex items-center gap-2">
                                                {isLoading ? (
                                                    <div className="spinner w-4 h-4" />
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                )}
                                                Export PDF
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="glass-card overflow-hidden">
                                    <div className="flex border-b border-white/10">
                                        <button
                                            onClick={() => setActiveTab('editor')}
                                            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'editor'
                                                ? 'text-white bg-white/5 border-b-2 border-rose-500'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                                </svg>
                                                HTML Editor
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('preview')}
                                            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'preview'
                                                ? 'text-white bg-white/5 border-b-2 border-rose-500'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                Live Preview
                                            </span>
                                        </button>
                                    </div>

                                    <div className="p-6">
                                        {activeTab === 'editor' ? (
                                            <div>
                                                <textarea
                                                    value={htmlContent}
                                                    onChange={(e) => setHtmlContent(e.target.value)}
                                                    className="w-full h-[500px] bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-rose-500 focus:outline-none resize-none"
                                                    spellCheck={false}
                                                />
                                            </div>
                                        ) : (
                                            <div ref={previewRef} className="bg-white rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
                                                <iframe
                                                    ref={iframeRef}
                                                    className="w-full border-0"
                                                    style={{ minHeight: '500px', height: '100%' }}
                                                    title="HTML Preview"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {/* Footer */}
                <footer className="py-6 px-8 border-t border-white/5">
                    <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
                        HTML to PDF Converter • Built with Next.js
                    </div>
                </footer>
            </div>
        </div>
    );
}
