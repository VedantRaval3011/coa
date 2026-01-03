'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
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

    // Custom options state
    const [customAddress1, setCustomAddress1] = useState('');
    const [customAddress2, setCustomAddress2] = useState('');
    const [customProductName, setCustomProductName] = useState('');
    const [customGenericName, setCustomGenericName] = useState('');
    const [addDisclaimer, setAddDisclaimer] = useState(true);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');

        if (password === 'admin@coa') {
            setUserRole('admin');
        } else if (password === 'emp@coa') {
            setUserRole('employee');
        } else {
            setAuthError('Invalid credentials. Please try again.');
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
            addDisclaimer: addDisclaimer
        };


        const htmlToUse = previewType === 'fixed'
            ? fixHtmlDocument(originalHtml, options).fixedHtml
            : originalHtml;

        const blob = new Blob([htmlToUse], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [originalHtml, customAddress1, customAddress2, customProductName, customGenericName, addDisclaimer, previewType]);

    const processFiles = async () => {
        setIsProcessing(true);
        const results: ProcessedFile[] = [];

        // Build options from state
        const options: FixerOptions = {
            customAddress1: customAddress1.trim() || undefined,
            customAddress2: customAddress2.trim() || undefined,
            customProductName: customProductName.trim() || undefined,
            customGenericName: customGenericName.trim() || undefined,
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
        if (!processedFile.fixedBlob) return;

        const url = URL.createObjectURL(processedFile.fixedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = processedFile.fixedName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadAll = () => {
        processedFiles.forEach(pf => {
            if (pf.fixedBlob) {
                downloadFile(pf);
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
        setAddDisclaimer(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const totalFixes = processedFiles.reduce((acc, pf) => acc + pf.result.appliedFixes.length, 0);
    const successCount = processedFiles.filter(pf => pf.result.success).length;

    if (!userRole) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="text-6xl mb-4 text-purple-400">🛡️</div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                            HTML Fixer Access
                        </h1>
                        <p className="text-gray-400 mt-2">Enter your credentials to continue</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                                Access Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-center text-xl tracking-[0.5em]"
                                autoFocus
                            />
                        </div>

                        {authError && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                                {authError}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 shadow-purple-500/20"
                        >
                            Log In
                        </button>
                    </form>

                    <div className="mt-8 text-center text-gray-500 text-xs flex flex-col gap-2">
                        <p>Authorized Personnel Only</p>
                        <Link href="/" className="text-purple-400 hover:underline">← Back to Main Website</Link>
                    </div>
                </div>
            </div>
        );
    }

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
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                }`}>
                                {userRole} Access
                            </span>
                        </div>
                        <p className="text-gray-400 mt-2">
                            Fix Oracle Reports generated COA HTML files automatically
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors text-sm"
                        >
                            Logout
                        </button>
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
                                                const options: FixerOptions = {
                                                    customAddress1: customAddress1.trim() || undefined,
                                                    customAddress2: customAddress2.trim() || undefined,
                                                    customProductName: customProductName.trim() || undefined,
                                                    customGenericName: customGenericName.trim() || undefined,
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
                                            }}
                                            className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg border border-green-500/20 text-xs font-bold transition-all flex items-center gap-1"
                                            title="Download Current Preview"
                                        >
                                            <span className="text-sm">⬇️</span> Download
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
        </div>
    );
}
