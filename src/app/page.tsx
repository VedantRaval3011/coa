'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { parseXML, ParsedXMLData, highlightXML, CertificateData } from '@/lib/xmlParser';
import { generatePDF, downloadPDF } from '@/lib/pdfGenerator';

export default function Home() {
  const [xmlData, setXmlData] = useState<ParsedXMLData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfOptions, setPdfOptions] = useState({
    includeRawXml: false,
    includeTable: true,
    includeStructure: false,
    generateCertificate: true,
  });
  const [activeTab, setActiveTab] = useState<'certificate' | 'table' | 'preview'>('certificate');
  const [editedCertData, setEditedCertData] = useState<CertificateData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError('Please upload a valid XML file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const parsed = parseXML(content);
      setXmlData(parsed);
      setEditedCertData(parsed.certificateData || null);
      setFileName(file.name);
    } catch (err) {
      setError(`Failed to parse XML: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setXmlData(null);
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

  const handleExportPDF = useCallback(() => {
    if (!xmlData) return;

    setIsLoading(true);
    try {
      // Use edited certificate data if available
      const dataToExport = {
        ...xmlData,
        certificateData: editedCertData || xmlData.certificateData,
      };

      const pdf = generatePDF(dataToExport, {
        title: fileName.replace('.xml', '') || 'XML Export',
        ...pdfOptions,
      });
      downloadPDF(pdf, `${fileName.replace('.xml', '')}_certificate.pdf`);
    } catch (err) {
      setError(`Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [xmlData, fileName, pdfOptions, editedCertData]);

  const handleReset = useCallback(() => {
    setXmlData(null);
    setFileName('');
    setError(null);
    setEditedCertData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const updateCertField = useCallback((
    section: 'companyInfo' | 'productInfo' | 'documentInfo',
    field: string,
    value: string
  ) => {
    if (!editedCertData) return;

    setEditedCertData({
      ...editedCertData,
      [section]: {
        ...editedCertData[section],
        [field]: value,
      },
    });
  }, [editedCertData]);

  const updateTestResult = useCallback((index: number, field: string, value: string) => {
    if (!editedCertData) return;

    const newResults = [...editedCertData.testResults];
    newResults[index] = { ...newResults[index], [field]: value };

    setEditedCertData({
      ...editedCertData,
      testResults: newResults,
    });
  }, [editedCertData]);

  const addTestResult = useCallback(() => {
    if (!editedCertData) return;

    const newSrNo = String(editedCertData.testResults.length + 1);
    setEditedCertData({
      ...editedCertData,
      testResults: [
        ...editedCertData.testResults,
        { srNo: newSrNo, test: '', result: '', specification: '' },
      ],
    });
  }, [editedCertData]);

  const removeTestResult = useCallback((index: number) => {
    if (!editedCertData) return;

    const newResults = editedCertData.testResults.filter((_, i) => i !== index);
    // Update serial numbers
    newResults.forEach((item, i) => {
      item.srNo = String(i + 1);
    });

    setEditedCertData({
      ...editedCertData,
      testResults: newResults,
    });
  }, [editedCertData]);

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">XML to PDF Converter</h1>
                <p className="text-xs text-gray-400">Certificate of Analysis Generator</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/html-to-pdf">
                <button className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  HTML to PDF
                </button>
              </Link>
              {xmlData && (
                <button onClick={handleReset} className="btn-secondary text-sm py-2 px-4">
                  Upload New File
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {!xmlData ? (
              /* Upload Section */
              <div className="fade-in">
                <div className="text-center mb-12">
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Generate <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Certificate of Analysis</span>
                  </h2>
                  <p className="text-lg text-gray-400 max-w-lg mx-auto">
                    Upload your XML file to generate a professional Certificate of Analysis document
                  </p>
                </div>

                <div
                  className={`upload-zone p-12 cursor-pointer max-w-2xl mx-auto ${isDragging ? 'drag-active' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xml"
                    onChange={handleInputChange}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center gap-6">
                    {isLoading ? (
                      <div className="spinner" />
                    ) : (
                      <>
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                          <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-semibold text-white mb-2">
                            {isDragging ? 'Drop your file here' : 'Drag & drop your XML file'}
                          </p>
                          <p className="text-gray-400">
                            or <span className="text-indigo-400 underline">browse</span> to upload
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Supports .xml files
                        </div>
                      </>
                    )}
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
              /* Results Section */
              <div className="fade-in space-y-6">
                {/* File Info & Export */}
                <div className="glass-card p-6 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center success-check">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{fileName}</h3>
                      <p className="text-sm text-gray-400">
                        {xmlData.flattenedData.length} fields • {editedCertData?.testResults.length || 0} test results
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdfOptions.generateCertificate}
                        onChange={(e) => setPdfOptions({ ...pdfOptions, generateCertificate: e.target.checked })}
                        className="w-4 h-4 rounded border-2 border-indigo-500/50 bg-transparent"
                      />
                      <span className="text-sm text-gray-300">Certificate Format</span>
                    </label>
                    <button onClick={handleExportPDF} className="btn-primary" disabled={isLoading}>
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
                      onClick={() => setActiveTab('certificate')}
                      className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'certificate'
                        ? 'text-white bg-white/5 border-b-2 border-indigo-500'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Certificate Editor
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('table')}
                      className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'table'
                        ? 'text-white bg-white/5 border-b-2 border-indigo-500'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        All Data
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'preview'
                        ? 'text-white bg-white/5 border-b-2 border-indigo-500'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Raw XML
                      </span>
                    </button>
                  </div>

                  <div className="p-6">
                    {activeTab === 'certificate' && editedCertData ? (
                      <div className="space-y-8">
                        {/* Company Information */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Company Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Company Name</label>
                              <input
                                type="text"
                                value={editedCertData.companyInfo.name}
                                onChange={(e) => updateCertField('companyInfo', 'name', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Address</label>
                              <input
                                type="text"
                                value={editedCertData.companyInfo.address}
                                onChange={(e) => updateCertField('companyInfo', 'address', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Phone</label>
                              <input
                                type="text"
                                value={editedCertData.companyInfo.phone}
                                onChange={(e) => updateCertField('companyInfo', 'phone', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Email</label>
                              <input
                                type="text"
                                value={editedCertData.companyInfo.email}
                                onChange={(e) => updateCertField('companyInfo', 'email', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Website</label>
                              <input
                                type="text"
                                value={editedCertData.companyInfo.website}
                                onChange={(e) => updateCertField('companyInfo', 'website', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Product Information */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Product Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Product Name</label>
                              <input
                                type="text"
                                value={editedCertData.productInfo.productName}
                                onChange={(e) => updateCertField('productInfo', 'productName', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Product Code</label>
                              <input
                                type="text"
                                value={editedCertData.productInfo.productCode}
                                onChange={(e) => updateCertField('productInfo', 'productCode', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Batch No.</label>
                              <input
                                type="text"
                                value={editedCertData.productInfo.batchNo}
                                onChange={(e) => updateCertField('productInfo', 'batchNo', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Packing</label>
                              <input
                                type="text"
                                value={editedCertData.productInfo.packing}
                                onChange={(e) => updateCertField('productInfo', 'packing', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Generic Name</label>
                              <input
                                type="text"
                                value={editedCertData.productInfo.genericName}
                                onChange={(e) => updateCertField('productInfo', 'genericName', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Batch Size</label>
                              <input
                                type="text"
                                value={editedCertData.productInfo.actualBatchSize}
                                onChange={(e) => updateCertField('productInfo', 'actualBatchSize', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Mfg. Date</label>
                              <input
                                type="text"
                                value={editedCertData.productInfo.mfgDate}
                                onChange={(e) => updateCertField('productInfo', 'mfgDate', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Exp. Date</label>
                              <input
                                type="text"
                                value={editedCertData.productInfo.expDate}
                                onChange={(e) => updateCertField('productInfo', 'expDate', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Mfg. Lic No.</label>
                              <input
                                type="text"
                                value={editedCertData.productInfo.mfgLicNo}
                                onChange={(e) => updateCertField('productInfo', 'mfgLicNo', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Location</label>
                              <input
                                type="text"
                                value={editedCertData.productInfo.location}
                                onChange={(e) => updateCertField('productInfo', 'location', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Make</label>
                              <input
                                type="text"
                                value={editedCertData.productInfo.make}
                                onChange={(e) => updateCertField('productInfo', 'make', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">A.R. No.</label>
                              <input
                                type="text"
                                value={editedCertData.productInfo.arNo}
                                onChange={(e) => updateCertField('productInfo', 'arNo', e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Test Results */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              Test Results
                            </h3>
                            <button
                              onClick={addTestResult}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add Test
                            </button>
                          </div>

                          <div className="data-table overflow-auto max-h-[400px]">
                            <table className="w-full">
                              <thead className="sticky top-0">
                                <tr>
                                  <th className="w-16">Sr.</th>
                                  <th>Test</th>
                                  <th>Result</th>
                                  <th>Specification</th>
                                  <th className="w-16">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {editedCertData.testResults.map((test, index) => (
                                  <tr key={index}>
                                    <td className="text-center text-gray-400">{test.srNo}</td>
                                    <td>
                                      <input
                                        type="text"
                                        value={test.test}
                                        onChange={(e) => updateTestResult(index, 'test', e.target.value)}
                                        className="w-full bg-transparent border-b border-white/10 px-2 py-1 text-white focus:border-indigo-500 focus:outline-none"
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="text"
                                        value={test.result}
                                        onChange={(e) => updateTestResult(index, 'result', e.target.value)}
                                        className="w-full bg-transparent border-b border-white/10 px-2 py-1 text-white focus:border-indigo-500 focus:outline-none"
                                      />
                                    </td>
                                    <td>
                                      <input
                                        type="text"
                                        value={test.specification}
                                        onChange={(e) => updateTestResult(index, 'specification', e.target.value)}
                                        className="w-full bg-transparent border-b border-white/10 px-2 py-1 text-white focus:border-indigo-500 focus:outline-none"
                                      />
                                    </td>
                                    <td className="text-center">
                                      <button
                                        onClick={() => removeTestResult(index)}
                                        className="text-red-400 hover:text-red-300 transition-colors"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : activeTab === 'table' ? (
                      <div className="data-table overflow-auto max-h-[500px]">
                        <table className="w-full">
                          <thead className="sticky top-0">
                            <tr>
                              <th>Property</th>
                              <th>Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {xmlData.flattenedData.map((item, index) => (
                              <tr key={index}>
                                <td className="font-mono text-indigo-300" style={{ paddingLeft: `${20 + item.depth * 16}px` }}>
                                  {item.key}
                                </td>
                                <td className="text-gray-300">{item.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="xml-preview p-4">
                        <pre
                          className="text-sm"
                          dangerouslySetInnerHTML={{ __html: highlightXML(xmlData.rawXml) }}
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
            XML to PDF Certificate Generator • Built with Next.js
          </div>
        </footer>
      </div>
    </div>
  );
}
