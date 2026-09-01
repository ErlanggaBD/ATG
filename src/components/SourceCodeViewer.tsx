import React, { useState } from 'react';
import { C_PROJECT_FILES, CSourceFile } from '../data/cCodeSource';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  Archive, 
  Code, 
  ExternalLink,
  BookOpen,
  Terminal,
  FileCheck
} from 'lucide-react';
import JSZip from 'jszip';

export const SourceCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CSourceFile>(C_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadSingleFile = () => {
    const blob = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("Otomasi_Pengujian_ATG_Win32_C");

      C_PROJECT_FILES.forEach((f) => {
        folder?.file(f.filename, f.code);
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = "Otomasi_Pengujian_ATG_Horizontal_C_Win32.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal membuat zip:", err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#0d1017] text-zinc-200 overflow-hidden select-none">
      {/* Left Sidebar: File Tree & Project Actions */}
      <div className="w-full md:w-72 bg-[#12141c] border-r border-zinc-800 p-3 flex flex-col justify-between shrink-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-zinc-200">
                STRUKTUR PROYEK C
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{C_PROJECT_FILES.length} Files</span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-snug">
            Source code lengkap berbasis C (Win32 API murni + Winsock2) untuk Windows. Siap dikompilasi dengan MinGW/MSVC.
          </p>

          {/* File list */}
          <div className="space-y-1">
            {C_PROJECT_FILES.map((file) => {
              const isSelected = selectedFile.filename === file.filename;
              return (
                <button
                  key={file.filename}
                  id={`btn-file-${file.filename.replace('.', '-')}`}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-bold shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      file.filename.endsWith('.c') ? 'bg-blue-400' :
                      file.filename.endsWith('.h') ? 'bg-emerald-400' :
                      file.filename.endsWith('.bat') ? 'bg-amber-400' : 'bg-purple-400'
                    }`}></span>
                    <span className="truncate">{file.filename}</span>
                  </div>
                  {isSelected && <FileCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Download ZIP Package Action */}
        <div className="mt-4 pt-3 border-t border-zinc-800 space-y-2">
          <button
            id="btn-download-full-c-zip"
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition cursor-pointer"
          >
            <Archive className="w-4 h-4" />
            <span>{isZipping ? 'Membuat ZIP...' : 'Download Full C Project (.ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Main Code Viewer Window */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0c10]">
        {/* Header Bar */}
        <div className="bg-[#12141c] border-b border-zinc-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-blue-400">
              {selectedFile.filename}
            </div>
            <span className="text-xs text-zinc-400 hidden sm:inline-block">
              {selectedFile.description}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Button */}
            <button
              id="btn-copy-code"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 transition cursor-pointer"
              title="Salin kode ke Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>

            {/* Single Download */}
            <button
              id="btn-download-single-file"
              onClick={handleDownloadSingleFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 transition cursor-pointer"
              title="Download file ini"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-[#0a0c12]">
          <pre className="font-mono text-xs text-zinc-300 leading-relaxed tab-size-4 select-text">
            <code>{selectedFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
