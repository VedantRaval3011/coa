'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { fixHtmlDocument, getFixedFilename, FixResult, FixerOptions, extractCurrentValues } from '@/lib/htmlFixer';

interface ProcessedFile {
    originalName: string;
    fixedName: string;
    result: FixResult;
    fixedBlob: Blob | null;
}

export default function HtmlFixer() {
    // Auth state
    const [userRole, setUserRole] = useState<'admin' | 'employee' | null>(null);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    const [files, setFiles] = useState<File[]>([]);
    const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [originalHtml, setOriginalHtml] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'original' | 'fixed'>('fixed');
    const [selectedFileIndex, setSelectedFileIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modal state
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    // Custom options state
    const [customAddress1, setCustomAddress1] = useState('');
    const [customAddress2, setCustomAddress2] = useState('');
    const [customProductName, setCustomProductName] = useState('');
    const [customGenericName, setCustomGenericName] = useState('');
    const [customRemarks, setCustomRemarks] = useState('');
    const [addDisclaimer, setAddDisclaimer] = useState(true);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');

        if (password === 'admin@coa') {
            setUserRole('admin');
            setShowAuthModal(false);
            if (pendingAction) {
                const action = pendingAction;
                setPendingAction(null);
                action();
            }
        } else if (password === 'emp@coa') {
            setUserRole('employee');
            setShowAuthModal(false);
            if (pendingAction) {
                const action = pendingAction;
                setPendingAction(null);
                action();
            }
        } else {
            setAuthError('Invalid credentials. Please try again.');
        }
    };

    const checkAuthAndExecute = (action: () => void) => {
        if (userRole) {
            action();
        } else {
            setPendingAction(() => action);
            setShowAuthModal(true);
        }
    };

    const handleLogout = () => {
        setUserRole(null);
        setPassword('');
        clearAll();
    };

    const handleFiles = useCallback(async (newFiles: File[]) => {
        if (newFiles.length === 0) return;

        setFiles(newFiles);
        setProcessedFiles([]);
        setSelectedFileIndex(0);

        try {
            const content = await newFiles[0].text();
            setOriginalHtml(content);
            const defaults = extractCurrentValues(content);

            setCustomAddress1(defaults.address1);
            setCustomAddress2(defaults.address2);
            setCustomProductName(defaults.productName);
            setCustomGenericName(defaults.genericName || '');
            setCustomRemarks(defaults.remarks || '');
        } catch (error) {
            console.error("Failed to read file", error);
        }
    }, []);

    const handleFileChange = async (index: number) => {
        setSelectedFileIndex(index);
        try {
            const content = await files[index].text();
            setOriginalHtml(content);
            // Optionally update defaults on switch? User said "upload then populate", usually one set.
        } catch (error) {
            console.error("Failed to read file", error);
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter(
            file => file.name.endsWith('.htm') || file.name.endsWith('.html') || file.name.endsWith('.txt')
        );
        handleFiles(droppedFiles);
    }, [handleFiles]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        handleFiles(selectedFiles);
    }, [handleFiles]);

    // Live preview update using Blob URL for better stability
    useEffect(() => {
        if (!originalHtml) {
            setPreviewUrl(null);
            return;
        }

        const options: FixerOptions = {
            customAddress1: customAddress1.trim() || undefined,
            customAddress2: customAddress2.trim() || undefined,
            customProductName: customProductName.trim() || undefined,
            customGenericName: customGenericName.trim() || undefined,
            customRemarks: customRemarks,
            addDisclaimer: addDisclaimer
        };


        const htmlToUse = previewType === 'fixed'
            ? fixHtmlDocument(originalHtml, options).fixedHtml
            : originalHtml;

        const blob = new Blob([htmlToUse], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [originalHtml, customAddress1, customAddress2, customProductName, customGenericName, customRemarks, addDisclaimer, previewType]);

    const processFiles = async () => {
        setIsProcessing(true);
        const results: ProcessedFile[] = [];

        // Build options from state
        const options: FixerOptions = {
            customAddress1: customAddress1.trim() || undefined,
            customAddress2: customAddress2.trim() || undefined,
            customProductName: customProductName.trim() || undefined,
            customGenericName: customGenericName.trim() || undefined,
            customRemarks: customRemarks,
            addDisclaimer: addDisclaimer
        };

        for (const file of files) {
            try {
                const content = await file.text();
                const result = fixHtmlDocument(content, options);
                const fixedBlob = new Blob([result.fixedHtml], { type: 'text/html' });

                results.push({
                    originalName: file.name,
                    fixedName: getFixedFilename(file.name),
                    result,
                    fixedBlob
                });
            } catch (error) {
                results.push({
                    originalName: file.name,
                    fixedName: getFixedFilename(file.name),
                    result: {
                        success: false,
                        fixedHtml: '',
                        appliedFixes: [],
                        errors: [`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`]
                    },
                    fixedBlob: null
                });
            }
        }

        setProcessedFiles(results);
        setIsProcessing(false);
    };

    const downloadFile = (processedFile: ProcessedFile) => {
        checkAuthAndExecute(() => {
            if (!processedFile.fixedBlob) return;

            const url = URL.createObjectURL(processedFile.fixedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = processedFile.fixedName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    };

    const downloadAll = () => {
        checkAuthAndExecute(() => {
            processedFiles.forEach(pf => {
                if (pf.fixedBlob) {
                    const url = URL.createObjectURL(pf.fixedBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = pf.fixedName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            });
        });
    };


    const generatePdf = async (processedFile: ProcessedFile) => {
        checkAuthAndExecute(async () => {
            if (!processedFile.result.fixedHtml) return;

            try {
                // Create a temporary container to render the HTML
                const container = document.createElement('div');
                container.style.position = 'absolute';
                container.style.left = '-9999px';
                container.style.top = '0';
                // Set width to approx A4 width in pixels (screen resolution) to ensure proper layout
                // Oracle reports are usually fixed width around 750-800px
                container.style.width = '794px'; 
                
                // Extract body content if present, to avoid nesting html/body tags
                const htmlContent = processedFile.result.fixedHtml;
                // Simple check to extract body innerHTML if possible, otherwise use full string (browser handles it mostly)
                const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                container.innerHTML = bodyMatch ? bodyMatch[1] : htmlContent;
                
                // Calculate required height based on absolute positioned elements
                // Oracle reports use "top: XXXpt"
                let maxHeightPt = 0;
                const topMatches = htmlContent.matchAll(/top:\s*([\d.]+)pt/g);
                for (const match of topMatches) {
                    const val = parseFloat(match[1]);
                    if (!isNaN(val) && val > maxHeightPt) {
                        maxHeightPt = val;
                    }
                }
                
                // Convert pt to px (approx 1.33 px per pt) + padding
                // We reduce padding to avoid creating an empty extra page due to slight overflow
                const heightPx = Math.ceil(maxHeightPt * 1.33) + 40;
                container.style.height = `${Math.max(heightPx, 1123)}px`; // Minimum A4 height (~1123px at 96dpi)
                container.style.backgroundColor = 'white'; // Ensure background

                document.body.appendChild(container);

                // Use html2canvas to capture the container
                const canvas = await html2canvas(container, {
                    scale: 2, // Higher scale for better quality
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    height: Math.max(heightPx, 1123),
                    windowHeight: Math.max(heightPx, 1123),
                });

                document.body.removeChild(container);

                if (canvas.width === 0 || canvas.height === 0) {
                    console.error("Canvas has 0 dimensions");
                    alert("Could not generate PDF: canvas is empty.");
                    return;
                }

                // Convert to JPEG instead of PNG to avoid "wrong PNG signature" errors in some jsPDF versions
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = pdfWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                if (!Number.isFinite(imgWidth) || !Number.isFinite(imgHeight)) {
                    console.error("Invalid PDF dimensions", { imgWidth, imgHeight, cvW: canvas.width, cvH: canvas.height });
                    alert("Failed to calculate PDF dimensions.");
                    return;
                }

                let heightLeft = imgHeight;
                let position = 0;

                // Add first page
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;

                // Add subsequent pages if content overflows
                // We use a threshold (5mm) to avoid adding a new page for tiny amounts of whitespace height
                while (heightLeft > 5) {
                    position -= pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pdfHeight;
                }

                const pdfName = processedFile.fixedName.replace(/\.(htm|html|txt)$/i, '.pdf');
                pdf.save(pdfName);
            } catch (error) {
                console.error('PDF Generation failed', error);
                alert('Failed to generate PDF. See console for details.');
            }
        });
    };

    const showPreview = async (processedFile: ProcessedFile, type: 'original' | 'fixed') => {
        const fileIndex = files.findIndex(f => f.name === processedFile.originalName);
        if (fileIndex !== -1) {
            setSelectedFileIndex(fileIndex);
            const content = await files[fileIndex].text();
            setOriginalHtml(content);
            setPreviewType(type);
        }
    };

    const clearAll = () => {
        setFiles([]);
        setProcessedFiles([]);
        setPreviewUrl(null);
        setOriginalHtml(null);
        setSelectedFileIndex(0);
        setCustomAddress1('');
        setCustomAddress2('');
        setCustomProductName('');
        setCustomGenericName('');
        setCustomRemarks('');
        setAddDisclaimer(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const totalFixes = processedFiles.reduce((acc, pf) => acc + pf.result.appliedFixes.length, 0);
    const successCount = processedFiles.filter(pf => pf.result.success).length;



    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
            <div className="max-w-[1700px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                                HTML Fixer Tool
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-tighter font-bold border ${userRole === 'admin'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : userRole === 'employee'
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                    : 'hidden'
                                }`}>
                                {userRole} Access
                            </span>
                        </div>
                        <p className="text-gray-400 mt-2">
                            Fix Oracle Reports generated COA HTML files automatically
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {userRole && (
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors text-sm"
                            >
                                Logout
                            </button>
                        )}
                        <Link
                            href="/"
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </div>

                {files.length === 0 ? (
                    /* Initial Upload View */
                    <div className="max-w-4xl mx-auto">
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                border-2 border-dashed rounded-3xl p-20 text-center cursor-pointer transition-all duration-300
                                ${isDragOver
                                    ? 'border-purple-400 bg-purple-500/20 scale-[1.02]'
                                    : 'border-white/10 bg-white/5 hover:border-purple-500 hover:bg-white/10'
                                }
                            `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".htm,.html,.txt"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div className="text-8xl mb-6">📄</div>
                            <h3 className="text-2xl font-bold mb-3">Upload COA HTML Files</h3>
                            <p className="text-gray-400 text-lg">Drop files here or click to browse</p>
                            <p className="text-gray-500 mt-4 text-sm italic">Supports .htm, .html, and .txt files from Oracle Reports</p>
                        </div>
                    </div>
                ) : (
                    /* Dashboard Split View */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* Left Column: Controls (5/12) */}
                        <div className="lg:col-span-5 space-y-6">

                            {/* Customization Card */}
                            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <span className="p-2 bg-purple-500/20 rounded-lg text-purple-400">⚙️</span>
                                    Customization Options
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                            Address Line 1 (PLOT NO.)
                                        </label>
                                        <input
                                            type="text"
                                            value={customAddress1}
                                            onChange={(e) => setCustomAddress1(e.target.value)}
                                            placeholder="Extracted automatically from file..."
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                            Address Line 2 (REG.OFF.)
                                        </label>
                                        <input
                                            type="text"
                                            value={customAddress2}
                                            onChange={(e) => setCustomAddress2(e.target.value)}
                                            placeholder="Extracted automatically from file..."
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                            Product Name
                                        </label>
                                        <input
                                            type="text"
                                            value={customProductName}
                                            onChange={(e) => setCustomProductName(e.target.value)}
                                            placeholder="Extracted automatically from file..."
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                            Generic Name
                                        </label>
                                        <input
                                            type="text"
                                            value={customGenericName}
                                            onChange={(e) => setCustomGenericName(e.target.value)}
                                            placeholder="Extracted automatically from file..."
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                            Remarks
                                        </label>
                                        <input
                                            type="text"
                                            value={customRemarks}
                                            onChange={(e) => setCustomRemarks(e.target.value)}
                                            placeholder="Add remarks..."
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={addDisclaimer}
                                                    onChange={(e) => setAddDisclaimer(e.target.checked)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-10 h-6 rounded-full transition-colors ${addDisclaimer ? 'bg-purple-500' : 'bg-white/10'}`}></div>
                                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${addDisclaimer ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                            </div>
                                            <span className="text-gray-300 group-hover:text-white transition-colors">
                                                Add disclaimer: &quot;This document has been generated as per client requirement&quot;
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button
                                        onClick={processFiles}
                                        disabled={isProcessing}
                                        className={`
                                            flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                                            ${isProcessing
                                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-[1.02] hover:shadow-purple-500/25 active:scale-95'
                                            }
                                        `}
                                    >
                                        {isProcessing ? 'Processing...' : '🚀 Apply Fixes to All'}
                                    </button>
                                    <button
                                        onClick={clearAll}
                                        className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>

                            {/* Files List / Selection */}
                            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl overflow-hidden">
                                <h2 className="text-xl font-bold mb-4">Files to Process</h2>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {files.map((file, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleFileChange(idx)}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedFileIndex === idx
                                                ? 'bg-purple-500/20 border-purple-500/50'
                                                : 'bg-white/5 border-white/5 hover:border-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium truncate pr-4">{file.name}</span>
                                                <span className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Results Table */}
                            {processedFiles.length > 0 && (
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl overflow-hidden">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold">Results</h2>
                                        <button
                                            onClick={downloadAll}
                                            className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded-lg border border-green-500/20"
                                        >
                                            Download All
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {processedFiles.map((pf, idx) => (
                                            <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-purple-500/30 transition-all">
                                                <div className="flex items-center justify-between">
                                                    <div className="truncate pr-4">
                                                        <p className="text-sm font-medium text-white truncate">{pf.originalName}</p>
                                                        <p className="text-[10px] text-gray-500 italic">→ {pf.fixedName}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => showPreview(pf, 'fixed')}
                                                            className="p-2 bg-white/10 hover:bg-purple-500 hover:text-white rounded-lg transition-colors text-[10px]"
                                                        >
                                                            👁️
                                                        </button>
                                                        <button
                                                            onClick={() => downloadFile(pf)}
                                                            className="p-2 bg-white/10 hover:bg-green-500 hover:text-white rounded-lg transition-colors text-[10px]"
                                                        >
                                                            ⬇️
                                                        </button>
                                                       
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Info Card */}
                            <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl p-5 border border-white/5">
                                <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-widest">Active Fixes</h3>
                                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400">
                                    <div className="flex items-center gap-2">✅ Border height</div>
                                    <div className="flex items-center gap-2">✅ Footer offset</div>
                                    <div className="flex items-center gap-2">✅ Image paths</div>
                                    <div className="flex items-center gap-2">✅ Micro symbol</div>
                                    <div className="flex items-center gap-2">✅ Multi-page print</div>
                                    <div className="flex items-center gap-2">✅ Column dividers</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Live Preview (7/12) */}
                        <div className="lg:col-span-7 sticky top-8">
                            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col h-[85vh]">
                                <div className="bg-slate-800/80 px-6 py-3 flex items-center justify-between border-b border-white/10">
                                    <div className="flex items-center gap-3">
                                        <span className="w-3 h-3 rounded-full bg-red-400"></span>
                                        <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                                        <span className="w-3 h-3 rounded-full bg-green-400"></span>
                                        <h3 className="ml-2 text-sm font-bold text-gray-300">Live Preview</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-white/10 rounded-lg p-1 flex gap-1 mr-2">
                                            <button
                                                onClick={() => setPreviewType('original')}
                                                className={`px-3 py-1 rounded text-xs transition-colors ${previewType === 'original' ? 'bg-purple-500 text-white' : 'hover:bg-white/5 text-gray-400'}`}
                                            >
                                                Original
                                            </button>
                                            <button
                                                onClick={() => setPreviewType('fixed')}
                                                className={`px-3 py-1 rounded text-xs transition-colors ${previewType === 'fixed' ? 'bg-purple-500 text-white' : 'hover:bg-white/5 text-gray-400'}`}
                                            >
                                                Fixed
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => {
                                                checkAuthAndExecute(() => {
                                                    const options: FixerOptions = {
                                                        customAddress1: customAddress1.trim() || undefined,
                                                        customAddress2: customAddress2.trim() || undefined,
                                                        customProductName: customProductName.trim() || undefined,
                                                        customGenericName: customGenericName.trim() || undefined,
                                                        customRemarks: customRemarks,
                                                        addDisclaimer: addDisclaimer
                                                    };
                                                    const result = fixHtmlDocument(originalHtml || '', options);
                                                    const blob = new Blob([result.fixedHtml], { type: 'text/html' });
                                                    const fileName = files[selectedFileIndex] ? getFixedFilename(files[selectedFileIndex].name) : 'fixed.html';

                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = fileName;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                    URL.revokeObjectURL(url);
                                                });
                                            }}
                                            className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg border border-green-500/20 text-xs font-bold transition-all flex items-center gap-1"
                                            title="Download Current Preview"
                                        >
                                            <span className="text-sm">⬇️</span> Download HTML
                                        </button>
                                        <button
                                            onClick={() => {
                                                checkAuthAndExecute(() => {
                                                    // Create a temporary processed file object for the current preview
                                                    const options: FixerOptions = {
                                                        customAddress1: customAddress1.trim() || undefined,
                                                        customAddress2: customAddress2.trim() || undefined,
                                                        customProductName: customProductName.trim() || undefined,
                                                        customGenericName: customGenericName.trim() || undefined,
                                                        customRemarks: customRemarks,
                                                        addDisclaimer: addDisclaimer
                                                    };
                                                    const result = fixHtmlDocument(originalHtml || '', options);
                                                    
                                                    const pf: ProcessedFile = {
                                                        originalName: files[selectedFileIndex]?.name || 'document.htm',
                                                        fixedName: getFixedFilename(files[selectedFileIndex]?.name || 'document.htm'),
                                                        result: result,
                                                        fixedBlob: new Blob([result.fixedHtml], { type: 'text/html' })
                                                    };
                                                    generatePdf(pf);
                                                });
                                            }}
                                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/20 text-xs font-bold transition-all flex items-center gap-1"
                                            title="Download PDF"
                                        >
                                            <span className="text-sm">📄</span> PDF
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white relative">
                                    {previewUrl ? (
                                        <iframe
                                            src={previewUrl}
                                            className="w-full h-full border-none"
                                            title="Live Preview"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 italic">
                                            Generating preview...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Authentication Modal */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
                        {/* Background effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 pointer-events-none"></div>
                        
                        <div className="relative relative-z-10">
                            <div className="text-center mb-6">
                                <div className="text-4xl mb-3">🔒</div>
                                <h3 className="text-xl font-bold text-white">Download Authorization</h3>
                                <p className="text-gray-400 text-xs mt-1">Please enter password to download</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-center text-lg tracking-widest"
                                        autoFocus
                                    />
                                </div>

                                {authError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                                        {authError}
                                    </div>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAuthModal(false);
                                            setPendingAction(null);
                                            setAuthError('');
                                        }}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl transition-colors font-medium text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-[1.02] text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all font-bold text-sm"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
