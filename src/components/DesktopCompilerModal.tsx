import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Download, 
  Archive, 
  Copy, 
  Check, 
  Cpu, 
  HardDrive, 
  Layers, 
  FileCode2, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FolderGit2
} from 'lucide-react';
import { C_PROJECT_FILES } from '../data/cCodeSource';
import JSZip from 'jszip';

interface DesktopCompilerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopCompilerModal: React.FC<DesktopCompilerModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [activeTab, setActiveTab] = useState<'GCC' | 'MSVC' | 'IDE' | 'TAURI'>('GCC');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 1500);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("Otomasi_Pengujian_ATG_Win32_C");

      C_PROJECT_FILES.forEach((f) => {
        folder?.file(f.filename, f.code);
      });

      // Also include an easy one-click batch launcher
      folder?.file("JALANKAN_KOMPILASI.bat", `@echo off
echo ============================================================================
echo  KOMPILASI OTOMASI PENGUJIAN ATG HORIZONTAL KE DESKTOP .EXE
echo ============================================================================
gcc -Wall -Wextra -O2 main.c tcp_client.c motor_controller.c excel_export.c -o Otomasi_ATG_Horizontal.exe -lcomctl32 -lws2_32 -lgdi32 -mwindows
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUKSES] File executable desktop 'Otomasi_ATG_Horizontal.exe' berhasil dibuat!
    echo Menjalankan aplikasi desktop...
    start Otomasi_ATG_Horizontal.exe
) else (
    echo.
    echo [GAGAL] Kompilasi gagal. Pastikan MinGW / GCC sudah terpasang.
)
pause
`);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = "Otomasi_Pengujian_ATG_Horizontal_Win32_Desktop.zip";
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

  const gccCommand = `gcc -Wall -Wextra -O2 main.c tcp_client.c motor_controller.c excel_export.c -o Otomasi_ATG_Horizontal.exe -lcomctl32 -lws2_32 -lgdi32 -luser32 -mwindows`;
  
  const msvcCommand = `cl.exe /O2 /Fe:Otomasi_ATG_Horizontal.exe main.c tcp_client.c motor_controller.c excel_export.c ws2_32.lib comctl32.lib gdi32.lib user32.lib /link /SUBSYSTEM:WINDOWS`;

  const cmakeCommand = `mkdir build && cd build\ncmake ..\ncmake --build . --config Release`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#12141d] border border-zinc-700 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#181a26] border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Kompilasi ke Desktop App (.EXE Windows)
              </h2>
              <p className="text-xs text-zinc-400">
                Cara menjalankan aplikasi ini secara offline dan native sebagai file executable (.exe) di Windows
              </p>
            </div>
          </div>

          <button
            id="btn-close-compiler-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-zinc-300">
          
          {/* Main Download Call to Action */}
          <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-600/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-zinc-100">
                  Unduh Paket Komplit Source Code Desktop (.ZIP)
                </span>
              </div>
              <p className="text-zinc-400 text-xs">
                Termasuk <span className="font-mono text-blue-300">main.c</span>, <span className="font-mono text-blue-300">tcp_client.c</span>, modul motor stepper, <span className="font-mono text-emerald-300">build.bat</span>, dan <span className="font-mono text-amber-300">Makefile</span>.
              </p>
            </div>

            <button
              id="btn-download-desktop-zip-modal"
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{isZipping ? 'Menyiapkan ZIP...' : 'Download Paket Desktop (.ZIP)'}</span>
            </button>
          </div>

          {/* Compiler Tabs */}
          <div className="space-y-3">
            <div className="flex border-b border-zinc-800 gap-1 pb-1">
              <button
                onClick={() => setActiveTab('GCC')}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'GCC'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>1. GCC / MinGW (Rekomendasi)</span>
              </button>

              <button
                onClick={() => setActiveTab('MSVC')}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'MSVC'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>2. Visual Studio (MSVC)</span>
              </button>

              <button
                onClick={() => setActiveTab('IDE')}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'IDE'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>3. Code::Blocks / Dev-C++</span>
              </button>

              <button
                onClick={() => setActiveTab('TAURI')}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'TAURI'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>4. Installer Windows (.msi)</span>
              </button>
            </div>

            {/* Tab 1: GCC / MinGW */}
            {activeTab === 'GCC' && (
              <div className="bg-[#0e1017] border border-zinc-800 rounded-lg p-4 space-y-3">
                <p className="text-zinc-300 font-medium">
                  Langkah Kompilasi 1-Klik menggunakan GCC / MinGW-w64 di Windows:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-zinc-400 pl-1">
                  <li>Ekstrak file <span className="font-mono text-zinc-200">Otomasi_Pengujian_ATG_Horizontal_Win32_Desktop.zip</span> ke folder di PC Anda.</li>
                  <li>Buka folder tersebut di Command Prompt / PowerShell atau cukup <strong className="text-emerald-400">klik dua kali file build.bat</strong>.</li>
                  <li>Atau jalankan perintah berikut secara langsung di Command Prompt:</li>
                </ol>

                <div className="relative bg-[#06070a] border border-zinc-800 rounded-md p-3 font-mono text-xs text-blue-300">
                  <code>{gccCommand}</code>
                  <button
                    onClick={() => copyToClipboard(gccCommand, 'gcc')}
                    className="absolute right-2 top-2 p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                    title="Salin Perintah"
                  >
                    {copiedCmd === 'gcc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded px-2.5 py-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Output menghasilkan <strong className="font-mono">Otomasi_ATG_Horizontal.exe</strong> mandiri tanpa dependensi runtime tambahan.</span>
                </div>
              </div>
            )}

            {/* Tab 2: MSVC */}
            {activeTab === 'MSVC' && (
              <div className="bg-[#0e1017] border border-zinc-800 rounded-lg p-4 space-y-3">
                <p className="text-zinc-300 font-medium">
                  Kompilasi menggunakan Visual Studio Developer Command Prompt:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-zinc-400 pl-1">
                  <li>Buka <span className="font-mono text-zinc-200">x64 Native Tools Command Prompt for VS</span> dari Start Menu Windows.</li>
                  <li>Arahkan ke folder source code (<span className="font-mono text-zinc-200">cd path\to\project</span>).</li>
                  <li>Jalankan perintah kompilasi Microsoft C Compiler:</li>
                </ol>

                <div className="relative bg-[#06070a] border border-zinc-800 rounded-md p-3 font-mono text-xs text-blue-300">
                  <code>{msvcCommand}</code>
                  <button
                    onClick={() => copyToClipboard(msvcCommand, 'msvc')}
                    className="absolute right-2 top-2 p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                    title="Salin Perintah"
                  >
                    {copiedCmd === 'msvc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: IDE (Code::Blocks / Dev-C++) */}
            {activeTab === 'IDE' && (
              <div className="bg-[#0e1017] border border-zinc-800 rounded-lg p-4 space-y-3">
                <p className="text-zinc-300 font-medium">
                  Membuka di IDE C/C++ seperti Code::Blocks, Dev-C++, atau CLion:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-zinc-400 pl-1">
                  <li>Buat New Project bertipe <strong>"Win32 GUI Application"</strong> (C Language).</li>
                  <li>Tambahkan file <span className="font-mono text-zinc-200">main.c</span>, <span className="font-mono text-zinc-200">tcp_client.c</span>, <span className="font-mono text-zinc-200">motor_controller.c</span>, <span className="font-mono text-zinc-200">excel_export.c</span>, dan file header <span className="font-mono text-zinc-200">.h</span>.</li>
                  <li>Di menu <em>Project Build Options &gt; Linker Settings</em>, tambahkan library:
                    <div className="mt-1 font-mono text-amber-300 bg-black/40 px-2 py-1 rounded">
                      -lws2_32 -lcomctl32 -lgdi32 -luser32
                    </div>
                  </li>
                  <li>Klik tombol <strong>Build and Run (F9)</strong>.</li>
                </ol>
              </div>
            )}

            {/* Tab 4: Installer Windows */}
            {activeTab === 'TAURI' && (
              <div className="bg-[#0e1017] border border-zinc-800 rounded-lg p-4 space-y-3">
                <p className="text-zinc-300 font-medium">
                  Membuat File Installer Desktop Modern (.MSI / .EXE) menggunakan Tauri / Electron:
                </p>
                <p className="text-zinc-400">
                  Jika Anda ingin membungkus simulator visual interaktif ini menjadi aplikasi desktop installer mandiri:
                </p>
                <div className="relative bg-[#06070a] border border-zinc-800 rounded-md p-3 font-mono text-xs text-emerald-300">
                  <code>npm install -g @tauri-apps/cli<br />npm run build<br />tauri build</code>
                </div>
                <p className="text-zinc-400">
                  Akan menghasilkan file instalasi <span className="font-mono text-zinc-200">Otomasi-ATG-Horizontal-Setup.msi</span> yang siap diinstall di PC Windows mana saja.
                </p>
              </div>
            )}
          </div>

          {/* Architecture Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-[#161822] border border-zinc-800 rounded-lg p-3">
              <span className="text-zinc-400 block text-[11px]">Runtime Engine</span>
              <span className="font-bold text-zinc-200">Pure Win32 API & Winsock2</span>
            </div>
            <div className="bg-[#161822] border border-zinc-800 rounded-lg p-3">
              <span className="text-zinc-400 block text-[11px]">Target Sistem Operasi</span>
              <span className="font-bold text-zinc-200">Windows 11 / 10 / 8 / 7 (x64)</span>
            </div>
            <div className="bg-[#161822] border border-zinc-800 rounded-lg p-3">
              <span className="text-zinc-400 block text-[11px]">Penggunaan Memori (RAM)</span>
              <span className="font-bold text-emerald-400">&lt; 15 MB (Sangat Ringan)</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#181a26] border-t border-zinc-800 px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            Source code C murni dapat langsung di-compile di PC Windows mana saja.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
