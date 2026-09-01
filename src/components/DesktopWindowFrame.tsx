import React, { useState } from 'react';
import { 
  Minus, 
  Square, 
  X, 
  Layers, 
  Terminal, 
  Download, 
  Settings, 
  FileSpreadsheet, 
  Wifi, 
  WifiOff, 
  Cpu, 
  HardDrive,
  Info,
  HelpCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Code2
} from 'lucide-react';
import { MotorStatus, TcpConnectionConfig } from '../types';

interface DesktopWindowFrameProps {
  children: React.ReactNode;
  motorStatus: MotorStatus;
  tcpConfig: TcpConnectionConfig;
  onOpenCompilerModal: () => void;
  onOpenSettings: () => void;
  onOpenPreview: () => void;
  onOpenTcpLog: () => void;
  onToggleTcp: () => void;
  onEmergencyStop: () => void;
  onZero5M: () => void;
  onHome17M: () => void;
  onPengujianNaik: () => void;
  onPengujianTurun: () => void;
  onCloseApp: () => void;
  onSwitchView: (view: 'GUI' | 'CODE') => void;
  activeView: 'GUI' | 'CODE';
}

export const DesktopWindowFrame: React.FC<DesktopWindowFrameProps> = ({
  children,
  motorStatus,
  tcpConfig,
  onOpenCompilerModal,
  onOpenSettings,
  onOpenPreview,
  onOpenTcpLog,
  onToggleTcp,
  onEmergencyStop,
  onZero5M,
  onHome17M,
  onPengujianNaik,
  onPengujianTurun,
  onCloseApp,
  onSwitchView,
  activeView
}) => {
  const [isMaximized, setIsMaximized] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const closeMenu = () => setActiveMenu(null);

  return (
    <div className={`flex flex-col h-screen w-screen bg-[#0a0c10] text-zinc-200 overflow-hidden font-sans ${isMaximized ? 'p-0' : 'p-2 md:p-4'}`}>
      {/* Desktop Window Container */}
      <div className="flex-1 flex flex-col bg-[#12141c] border border-zinc-700/80 rounded-lg shadow-2xl overflow-hidden min-h-0">
        
        {/* 1. Native Windows 11/10 Desktop Titlebar */}
        <div 
          id="win32-titlebar" 
          className="h-9 bg-[#161922] border-b border-zinc-800 flex items-center justify-between px-3 select-none shrink-0"
        >
          {/* Left: Window Icon & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Win32 App Icon */}
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-black shadow">
              A
            </div>
            <span className="text-xs font-semibold text-zinc-200 truncate">
              OTOMASI PENGUJIAN ATG HORIZONTAL v3.2 [Win32 Native Desktop] - (1 - 17 Meter)
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 font-mono">
              x64 Release .EXE
            </span>
          </div>

          {/* Right: Quick Action & Window Controls */}
          <div className="flex items-center gap-1">
            {/* Quick Button: Build .EXE */}
            <button
              id="btn-quick-build-exe"
              onClick={onOpenCompilerModal}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-[11px] font-medium transition cursor-pointer"
              title="Panduan & Download File Kompilasi .EXE Windows"
            >
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Kompilasi ke .EXE (Windows)</span>
            </button>

            {/* Minimize */}
            <button 
              id="btn-win-minimize"
              onClick={() => alert("Window dimitigasi ke Taskbar Windows.")}
              className="w-8 h-7 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded transition cursor-pointer"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Maximize / Restore */}
            <button 
              id="btn-win-maximize"
              onClick={() => setIsMaximized(!isMaximized)}
              className="w-8 h-7 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded transition cursor-pointer"
              title={isMaximized ? "Restore Window" : "Maximize Window"}
            >
              <Square className="w-3 h-3" />
            </button>

            {/* Close */}
            <button 
              id="btn-win-close"
              onClick={onCloseApp}
              className="w-8 h-7 flex items-center justify-center hover:bg-rose-600 text-zinc-400 hover:text-white rounded transition cursor-pointer"
              title="Close Application"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Windows Native Menu Bar (File, Motor TCP, Metrologi, Tools, Bantuan) */}
        <div 
          id="win32-menubar" 
          className="bg-[#191c26] border-b border-zinc-800/80 px-2 py-0.5 flex items-center gap-1 text-xs select-none relative z-30 shrink-0"
        >
          {/* Menu: File */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              className={`px-2.5 py-1 rounded text-zinc-300 hover:bg-zinc-800 cursor-pointer ${
                activeMenu === 'file' ? 'bg-zinc-800 text-white font-medium' : ''
              }`}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-[#1b1e2a] border border-zinc-700 rounded-md shadow-xl py-1 z-40 text-xs">
                <button 
                  onClick={() => { onOpenPreview(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
                >
                  <span>Lihat & Ekspor Hasil Uji...</span>
                  <span className="text-[10px] text-zinc-500">Ctrl+E</span>
                </button>
                <button 
                  onClick={() => { onOpenSettings(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
                >
                  <span>Pengaturan Metadata & Instansi...</span>
                  <span className="text-[10px] text-zinc-500">Ctrl+P</span>
                </button>
                <div className="my-1 border-t border-zinc-700/60"></div>
                <button 
                  onClick={() => { onOpenCompilerModal(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between text-blue-300 font-medium"
                >
                  <span>Unduh Paket Source & Build .EXE</span>
                  <span className="text-[10px] text-zinc-500">F9</span>
                </button>
                <div className="my-1 border-t border-zinc-700/60"></div>
                <button 
                  onClick={() => { onCloseApp(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-600 hover:text-white text-rose-300"
                >
                  Keluar Aplikasi (Exit)
                </button>
              </div>
            )}
          </div>

          {/* Menu: Motor & TCP */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'motor' ? null : 'motor')}
              className={`px-2.5 py-1 rounded text-zinc-300 hover:bg-zinc-800 cursor-pointer ${
                activeMenu === 'motor' ? 'bg-zinc-800 text-white font-medium' : ''
              }`}
            >
              Motor & TCP
            </button>
            {activeMenu === 'motor' && (
              <div className="absolute left-0 top-full mt-1 w-60 bg-[#1b1e2a] border border-zinc-700 rounded-md shadow-xl py-1 z-40 text-xs">
                <button 
                  onClick={() => { onToggleTcp(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
                >
                  <span>{motorStatus.connected ? 'Putuskan Soket TCP' : 'Hubungkan Soket TCP'}</span>
                  <span className="text-[10px] text-zinc-500">Ctrl+T</span>
                </button>
                <button 
                  onClick={() => { onOpenTcpLog(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Buka Console Traffic Log TCP...
                </button>
                <div className="my-1 border-t border-zinc-700/60"></div>
                <button 
                  onClick={() => { onZero5M(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Gerakkan ke Titik ZERO (5.0 m)
                </button>
                <button 
                  onClick={() => { onHome17M(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Gerakkan ke Titik HOME (17.0 m)
                </button>
                <div className="my-1 border-t border-zinc-700/60"></div>
                <button 
                  onClick={() => { onEmergencyStop(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-600 hover:text-white text-rose-300 font-bold"
                >
                  EMERGENCY STOP (Hentikan Motor)
                </button>
              </div>
            )}
          </div>

          {/* Menu: Sekuens Uji */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'sekuens' ? null : 'sekuens')}
              className={`px-2.5 py-1 rounded text-zinc-300 hover:bg-zinc-800 cursor-pointer ${
                activeMenu === 'sekuens' ? 'bg-zinc-800 text-white font-medium' : ''
              }`}
            >
              Pengujian Metrologi
            </button>
            {activeMenu === 'sekuens' && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-[#1b1e2a] border border-zinc-700 rounded-md shadow-xl py-1 z-40 text-xs">
                <button 
                  onClick={() => { onPengujianNaik(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Mulai Pengujian Naik (1m → 17m)
                </button>
                <button 
                  onClick={() => { onPengujianTurun(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Mulai Pengujian Turun (17m → 1m)
                </button>
              </div>
            )}
          </div>

          {/* Menu: Kompilasi & Build */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'build' ? null : 'build')}
              className={`px-2.5 py-1 rounded text-zinc-300 hover:bg-zinc-800 cursor-pointer ${
                activeMenu === 'build' ? 'bg-zinc-800 text-white font-medium' : ''
              }`}
            >
              Kompilasi .EXE
            </button>
            {activeMenu === 'build' && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-[#1b1e2a] border border-zinc-700 rounded-md shadow-xl py-1 z-40 text-xs">
                <button 
                  onClick={() => { onOpenCompilerModal(); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white font-medium text-blue-300"
                >
                  Panduan Kompilasi GCC / MSVC...
                </button>
                <button 
                  onClick={() => { onSwitchView('CODE'); closeMenu(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Buka Editor Source Code C (Win32)...
                </button>
              </div>
            )}
          </div>

          {/* Menu: Bantuan */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
              className={`px-2.5 py-1 rounded text-zinc-300 hover:bg-zinc-800 cursor-pointer ${
                activeMenu === 'help' ? 'bg-zinc-800 text-white font-medium' : ''
              }`}
            >
              Bantuan
            </button>
            {activeMenu === 'help' && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-[#1b1e2a] border border-zinc-700 rounded-md shadow-xl py-1 z-40 text-xs">
                <button 
                  onClick={() => { 
                    alert("Aplikasi Otomasi Pengujian ATG Horizontal dirancang khusus sebagai aplikasi desktop Windows dengan arsitektur C Win32 API murni & komunikasi TCP/IP untuk kontrol motor stepper pada lintasan 1 - 17 meter.");
                    closeMenu(); 
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Tentang Aplikasi Desktop Win32
                </button>
                <button 
                  onClick={() => { 
                    alert("Batas Kesalahan Izin (BKD) standar metrologi adalah ±1.0 mm untuk pengujian linieritas ATG rentang 1 s.d 17 meter.");
                    closeMenu(); 
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white"
                >
                  Standar Toleransi Metrologi BKD
                </button>
              </div>
            )}
          </div>

          {/* Backdrop to close menus on click outside */}
          {activeMenu && (
            <div 
              className="fixed inset-0 z-30" 
              onClick={closeMenu}
            />
          )}
        </div>

        {/* 3. Main Window Body (App Content) */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0d1017]">
          {children}
        </div>

        {/* 4. Windows Desktop Status Bar (Bottom) */}
        <div 
          id="win32-statusbar" 
          className="h-6 bg-[#13151f] border-t border-zinc-800/90 px-3 flex items-center justify-between text-[11px] text-zinc-400 font-mono select-none shrink-0"
        >
          {/* Status Left */}
          <div className="flex items-center gap-4 truncate">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${motorStatus.connected ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
              <span className="text-zinc-300">
                TCP: {motorStatus.connected ? `${tcpConfig.host}:${tcpConfig.port} (CONNECTED)` : 'OFFLINE'}
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-1 text-zinc-400">
              <span>Motor:</span>
              <span className="text-zinc-200 font-bold">
                {motorStatus.isMoving ? `MOVING (${motorStatus.direction})` : 'IDLE / READY'}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1 text-zinc-400">
              <span>Sensors:</span>
              <span className="text-zinc-200">
                ZERO={motorStatus.zeroSensorActive ? 'ACTIVE(5m)' : '0'} | HOME={motorStatus.homeSensorActive ? 'ACTIVE(17m)' : '0'}
              </span>
            </div>
          </div>

          {/* Status Right (System & Target Platform) */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline-block text-zinc-500">
              Win32 GUI / Winsock2
            </span>
            <span className="px-1.5 py-0.2 bg-zinc-800 rounded text-zinc-300 border border-zinc-700">
              Target: Windows 10/11 x64 (.exe)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
