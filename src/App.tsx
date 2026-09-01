/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  AtgTestRow, 
  TestType, 
  MotorStatus, 
  TcpConnectionConfig, 
  ExportSettings, 
  TcpLogMessage 
} from './types';
import { Header } from './components/Header';
import { MotorTrackVisualizer } from './components/MotorTrackVisualizer';
import { TestingMenuLeft } from './components/TestingMenuLeft';
import { TestingTable } from './components/TestingTable';
import { BottomToolbar } from './components/BottomToolbar';
import { SettingsModal } from './components/SettingsModal';
import { PreviewModal } from './components/PreviewModal';
import { TcpLogDrawer } from './components/TcpLogDrawer';
import { SourceCodeViewer } from './components/SourceCodeViewer';
import { DesktopWindowFrame } from './components/DesktopWindowFrame';
import { DesktopCompilerModal } from './components/DesktopCompilerModal';

// Generate 17 Default Rows
const createInitialRows = (): AtgTestRow[] => {
  return Array.from({ length: 17 }, (_, i) => {
    const meter = i + 1;
    const nominalMm = meter * 1000;
    return {
      meter,
      selected: true,
      algNaik: nominalMm.toFixed(3),
      algTurun: nominalMm.toFixed(3),
      algDiskSebelum: (nominalMm - 0.2).toFixed(3),
      algDiskSetelah: (nominalMm + 0.3).toFixed(3),
      stdNaik: nominalMm.toFixed(3),
      stdTurun: nominalMm.toFixed(3),
      stdNaikChecked: true,
      stdTurunChecked: true
    };
  });
};

export default function App() {
  // Views
  const [activeView, setActiveView] = useState<'GUI' | 'CODE'>('GUI');

  // Active Test Mode
  const [activeTestMode, setActiveTestMode] = useState<TestType>('KALIBRASI');

  // 17 Data Rows
  const [rows, setRows] = useState<AtgTestRow[]>(createInitialRows);

  // Edit Toggles
  const [isEditAlgEnabled, setIsEditAlgEnabled] = useState(false);
  const [isEditStdEnabled, setIsEditStdEnabled] = useState(false);

  // Timestamp
  const [lastCalibrationTimestamp, setLastCalibrationTimestamp] = useState('2026-08-27 09:30:00 WIB');

  // TCP Config
  const [tcpConfig, setTcpConfig] = useState<TcpConnectionConfig>({
    host: '192.168.1.100',
    port: 8080,
    timeoutMs: 3000,
    autoReconnect: true
  });

  // Motor Status
  const [motorStatus, setMotorStatus] = useState<MotorStatus>({
    connected: true,
    currentPositionMeter: 0.000,
    targetPositionMeter: 0.000,
    isMoving: false,
    direction: 'IDLE',
    speedMmPerSec: 50,
    homeSensorActive: false,
    zeroSensorActive: false,
    limitMaxSensorActive: false,
    stepperTempCelsius: 38.5
  });

  // Export Settings
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    operatorName: 'Budi Santoso, S.T.',
    nomorSeriAtg: 'ATG-HOR-2026-889',
    merkModelAtg: 'ATG Horizontal Metrology Grade 17M',
    instansiPemilik: 'Balai Standardisasi Metrologi Legal',
    lokasiPengujian: 'Laboratorium Uji Panjang ATG',
    batasKesalahanIzinMm: 1.0,
    suhuRuangan: 20.2,
    kelembapan: 58,
    formatEkspor: 'CSV',
    fileNamePrefix: 'Hasil_Uji_ATG_Horizontal'
  });

  // TCP Log Traffic
  const [tcpLogs, setTcpLogs] = useState<TcpLogMessage[]>([
    {
      id: '1',
      timestamp: '09:30:00',
      direction: 'SYS',
      payload: 'WSAStartup 2.2 Initialized. Soket TCP siap.',
      status: 'INFO'
    },
    {
      id: '2',
      timestamp: '09:30:01',
      direction: 'TX',
      payload: 'CONNECT 192.168.1.100:8080',
      status: 'OK'
    },
    {
      id: '3',
      timestamp: '09:30:01',
      direction: 'RX',
      payload: 'ACK:CONNECTED;DEV=ATG_STEPPER_CTRL_V3;POS=0.000;STAT=READY',
      status: 'OK'
    }
  ]);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTcpLogOpen, setIsTcpLogOpen] = useState(false);
  const [isCompilerModalOpen, setIsCompilerModalOpen] = useState(false);

  // Sequence state
  const [isRunningSequence, setIsRunningSequence] = useState(false);
  const sequenceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to add TCP Log
  const addTcpLog = (direction: 'TX' | 'RX' | 'SYS', payload: string, status: 'OK' | 'ERR' | 'INFO' = 'OK') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setTcpLogs((prev) => [
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: timeStr,
        direction,
        payload,
        status
      },
      ...prev.slice(0, 99)
    ]);
  };

  // Motor movement simulation effect
  useEffect(() => {
    if (!motorStatus.isMoving) return;

    const interval = setInterval(() => {
      setMotorStatus((prev) => {
        const diff = prev.targetPositionMeter - prev.currentPositionMeter;
        if (Math.abs(diff) < 0.05) {
          // Reached target
          const finalPos = prev.targetPositionMeter;
          addTcpLog('RX', `ACK:POS_REACHED;POS=${finalPos.toFixed(3)}m;LIMIT_HOME=${finalPos >= 16.9 ? '1' : '0'};LIMIT_ZERO=${Math.abs(finalPos - 5.0) < 0.1 ? '1' : '0'}`);
          return {
            ...prev,
            currentPositionMeter: finalPos,
            isMoving: false,
            direction: 'IDLE',
            zeroSensorActive: Math.abs(finalPos - 5.0) < 0.1,
            homeSensorActive: finalPos >= 16.9,
            limitMaxSensorActive: finalPos >= 17.2
          };
        }

        const step = diff > 0 ? 0.3 : -0.3;
        const newPos = prev.currentPositionMeter + step;
        return {
          ...prev,
          currentPositionMeter: newPos,
          zeroSensorActive: Math.abs(newPos - 5.0) < 0.2,
          homeSensorActive: newPos >= 16.8
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [motorStatus.isMoving]);

  // Handler: Move motor to specific meter
  const handleMoveToMeter = (meter: number) => {
    addTcpLog('TX', `CMD:MOVE_POS:${meter.toFixed(3)}\\r\\n`);
    setMotorStatus((prev) => ({
      ...prev,
      targetPositionMeter: meter,
      isMoving: true,
      direction: meter > prev.currentPositionMeter ? 'UP' : 'DOWN'
    }));
  };

  // Handler: ZERO (Area 5m)
  const handleZero5M = () => {
    addTcpLog('TX', `CMD:GOTO_ZERO_5M\\r\\n`);
    setMotorStatus((prev) => ({
      ...prev,
      targetPositionMeter: 5.000,
      isMoving: true,
      direction: 5.000 > prev.currentPositionMeter ? 'UP' : 'DOWN'
    }));
    updateTimestamp();
  };

  // Handler: HOME (Area 17m)
  const handleHome17M = () => {
    addTcpLog('TX', `CMD:GOTO_HOME_17M\\r\\n`);
    setMotorStatus((prev) => ({
      ...prev,
      targetPositionMeter: 17.000,
      isMoving: true,
      direction: 17.000 > prev.currentPositionMeter ? 'UP' : 'DOWN'
    }));
    updateTimestamp();
  };

  // Handler: Pengujian Naik (1m -> 17m)
  const handlePengujianNaik = () => {
    if (isRunningSequence) return;
    setIsRunningSequence(true);
    addTcpLog('TX', 'CMD:SEQ_START_UP:1TO17\\r\\n');

    let currentStep = 1;
    handleMoveToMeter(1);

    if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current);

    sequenceIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep > 17) {
        if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current);
        setIsRunningSequence(false);
        addTcpLog('RX', 'ACK:SEQ_COMPLETE_UP;TOTAL_POINTS=17;STATUS=SUCCESS');
        return;
      }
      handleMoveToMeter(currentStep);
    }, 1500);
  };

  // Handler: Pengujian Turun (17m -> 1m)
  const handlePengujianTurun = () => {
    if (isRunningSequence) return;
    setIsRunningSequence(true);
    addTcpLog('TX', 'CMD:SEQ_START_DOWN:17TO1\\r\\n');

    let currentStep = 17;
    handleMoveToMeter(17);

    if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current);

    sequenceIntervalRef.current = setInterval(() => {
      currentStep--;
      if (currentStep < 1) {
        if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current);
        setIsRunningSequence(false);
        addTcpLog('RX', 'ACK:SEQ_COMPLETE_DOWN;TOTAL_POINTS=17;STATUS=SUCCESS');
        return;
      }
      handleMoveToMeter(currentStep);
    }, 1500);
  };

  // Handler: Emergency Stop
  const handleEmergencyStop = () => {
    if (sequenceIntervalRef.current) clearInterval(sequenceIntervalRef.current);
    setIsRunningSequence(false);
    addTcpLog('TX', 'CMD:EMERGENCY_STOP\\r\\n', 'ERR');
    setMotorStatus((prev) => ({
      ...prev,
      isMoving: false,
      direction: 'IDLE',
      targetPositionMeter: prev.currentPositionMeter
    }));
    addTcpLog('RX', 'ACK:EMERGENCY_STOP_ACTIVE;MOTOR_HALTED', 'ERR');
  };

  // Handler: Update Row Data
  const handleRowChange = (index: number, updated: Partial<AtgTestRow>) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updated };
      return next;
    });
  };

  // Handler: Toggle All Checkboxes
  const handleToggleAll = (checked: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  // Handler: Timestamp
  const updateTimestamp = () => {
    const now = new Date();
    const str = now.toISOString().replace('T', ' ').substring(0, 19) + ' WIB';
    setLastCalibrationTimestamp(str);
  };

  // Handler: Toggle TCP Connection
  const handleToggleTcp = () => {
    setMotorStatus((prev) => {
      const nextConn = !prev.connected;
      addTcpLog('SYS', nextConn ? `Terhubung ke ${tcpConfig.host}:${tcpConfig.port}` : 'Koneksi TCP diputus manual.');
      return { ...prev, connected: nextConn };
    });
  };

  // Handler: Select Menu Kiri
  const handleSelectTestMode = (mode: TestType) => {
    setActiveTestMode(mode);
    addTcpLog('TX', `CMD:SET_MODE:${mode}\\r\\n`);
    updateTimestamp();
  };

  // Handler: Presets
  const handleFillPresetData = (type: TestType) => {
    setRows((prev) =>
      prev.map((r) => {
        const nominal = r.meter * 1000;
        if (type === 'EVALUASI_AKURASI') {
          // Add realistic micrometer/millimeter deviation
          const noiseNaik = (Math.sin(r.meter) * 0.45).toFixed(3);
          const noiseTurun = (Math.cos(r.meter) * 0.35).toFixed(3);
          return {
            ...r,
            algNaik: (nominal + parseFloat(noiseNaik)).toFixed(3),
            algTurun: (nominal + parseFloat(noiseTurun)).toFixed(3),
            stdNaik: nominal.toFixed(3),
            stdTurun: nominal.toFixed(3)
          };
        } else {
          return {
            ...r,
            algNaik: nominal.toFixed(3),
            algTurun: nominal.toFixed(3),
            stdNaik: nominal.toFixed(3),
            stdTurun: nominal.toFixed(3)
          };
        }
      })
    );
    addTcpLog('SYS', `Data preset untuk ${type} berhasil dimuat ke tabel.`);
  };

  // Handler: Export CSV File
  const handleExportCsv = () => {
    let csv = `LAPORAN HASIL PENGUJIAN OTOMASI ATG HORIZONTAL (1 - 17 METER)\n`;
    csv += `Tanggal Pengujian,${lastCalibrationTimestamp}\n`;
    csv += `Alat Uji (DUT),${exportSettings.merkModelAtg}\n`;
    csv += `Nomor Seri,${exportSettings.nomorSeriAtg}\n`;
    csv += `Operator Penguji,${exportSettings.operatorName}\n`;
    csv += `Instansi Pemilik,${exportSettings.instansiPemilik}\n`;
    csv += `Batas Kesalahan Izin (BKD),±${exportSettings.batasKesalahanIzinMm} mm\n\n`;

    csv += `No,Titik Uji (m),Status,ALG Naik (mm),ALG Turun (mm),ALG Disk. Sebelum (mm),ALG Disk. Setelah (mm),Std Naik (mm),Std Turun (mm),Deviasi Naik (mm),Deviasi Turun (mm),Hasil BKD\n`;

    rows.forEach((r, idx) => {
      const algN = parseFloat(r.algNaik) || 0;
      const stdN = parseFloat(r.stdNaik) || (r.meter * 1000);
      const devN = algN - stdN;

      const algT = parseFloat(r.algTurun) || 0;
      const stdT = parseFloat(r.stdTurun) || (r.meter * 1000);
      const devT = algT - stdT;

      const isPass = Math.abs(devN) <= exportSettings.batasKesalahanIzinMm && Math.abs(devT) <= exportSettings.batasKesalahanIzinMm;

      csv += `${idx + 1},${r.meter},${r.selected ? 'Diuja' : 'Dilewati'},${r.algNaik},${r.algTurun},${r.algDiskSebelum},${r.algDiskSetelah},${r.stdNaik},${r.stdTurun},${devN.toFixed(3)},${devT.toFixed(3)},${isPass ? 'LULUS' : 'PERIKSA'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportSettings.fileNamePrefix}_${exportSettings.nomorSeriAtg}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addTcpLog('SYS', `File CSV '${link.download}' berhasil diekspor.`);
  };

  // Handler: Close App
  const handleCloseApp = () => {
    if (confirm("Apakah Anda ingin menutup aplikasi dan menghentikan seluruh pergerakan motor stepper?")) {
      handleEmergencyStop();
      addTcpLog('SYS', 'Aplikasi ditutup.');
    }
  };

  return (
    <DesktopWindowFrame
      motorStatus={motorStatus}
      tcpConfig={tcpConfig}
      onOpenCompilerModal={() => setIsCompilerModalOpen(true)}
      onOpenSettings={() => setIsSettingsOpen(true)}
      onOpenPreview={() => setIsPreviewOpen(true)}
      onOpenTcpLog={() => setIsTcpLogOpen(true)}
      onToggleTcp={handleToggleTcp}
      onEmergencyStop={handleEmergencyStop}
      onZero5M={handleZero5M}
      onHome17M={handleHome17M}
      onPengujianNaik={handlePengujianNaik}
      onPengujianTurun={handlePengujianTurun}
      onCloseApp={handleCloseApp}
      onSwitchView={setActiveView}
      activeView={activeView}
    >
      {/* Header Bar */}
      <Header
        motorStatus={motorStatus}
        tcpConfig={tcpConfig}
        activeView={activeView}
        setActiveView={setActiveView}
        onToggleTcp={handleToggleTcp}
        onEmergencyStop={handleEmergencyStop}
        onOpenTcpLog={() => setIsTcpLogOpen(true)}
        onOpenCompilerModal={() => setIsCompilerModalOpen(true)}
        activeTestMode={activeTestMode}
      />

      {activeView === 'GUI' ? (
        <>
          {/* Motor Linear Track Visualizer (0 - 17m) */}
          <MotorTrackVisualizer
            motorStatus={motorStatus}
            onMoveToMeter={handleMoveToMeter}
          />

          {/* Main Work Area: Left Menu + Center/Right 1-17m Table */}
          <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* 1. Bagian Kiri: 4 Tombol Menu Pengujian */}
            <TestingMenuLeft
              activeTestMode={activeTestMode}
              onSelectTestMode={handleSelectTestMode}
              isRunningSequence={isRunningSequence}
              onFillPresetData={handleFillPresetData}
            />

            {/* 2. Bagian Tengah & Kanan: Tabel Bersusun 1-17 Meter */}
            <TestingTable
              rows={rows}
              onRowChange={handleRowChange}
              onToggleAll={handleToggleAll}
              isEditAlgEnabled={isEditAlgEnabled}
              isEditStdEnabled={isEditStdEnabled}
              onMoveToMeter={handleMoveToMeter}
              currentMotorPos={motorStatus.currentPositionMeter}
              batasKesalahanMm={exportSettings.batasKesalahanIzinMm}
            />
          </main>

          {/* 3. Bagian Bawah: Toolbar Kontrol Motor & Manajemen Data */}
          <BottomToolbar
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenPreview={() => setIsPreviewOpen(true)}
            onCloseApp={handleCloseApp}
            onZero5M={handleZero5M}
            onHome17M={handleHome17M}
            onPengujianNaik={handlePengujianNaik}
            onPengujianTurun={handlePengujianTurun}
            lastCalibrationTimestamp={lastCalibrationTimestamp}
            isEditAlg={isEditAlgEnabled}
            onToggleEditAlg={() => setIsEditAlgEnabled(!isEditAlgEnabled)}
            isEditStd={isEditStdEnabled}
            onToggleEditStd={() => setIsEditStdEnabled(!isEditStdEnabled)}
            isRunningSequence={isRunningSequence}
          />
        </>
      ) : (
        /* Source Code Viewer (Win32 C Codebase Explorer) */
        <SourceCodeViewer />
      )}

      {/* Modals & Drawers */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        exportSettings={exportSettings}
        onSaveExportSettings={setExportSettings}
        tcpConfig={tcpConfig}
        onSaveTcpConfig={setTcpConfig}
      />

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        rows={rows}
        exportSettings={exportSettings}
        lastCalibrationTimestamp={lastCalibrationTimestamp}
        onExportCsv={handleExportCsv}
      />

      <DesktopCompilerModal
        isOpen={isCompilerModalOpen}
        onClose={() => setIsCompilerModalOpen(false)}
      />

      <TcpLogDrawer
        isOpen={isTcpLogOpen}
        onClose={() => setIsTcpLogOpen(false)}
        logs={tcpLogs}
        onClearLogs={() => setTcpLogs([])}
        onSendRawCommand={(cmd) => {
          addTcpLog('TX', `${cmd}\\r\\n`);
          addTcpLog('RX', `ACK:${cmd.replace('CMD:', '')};STAT=OK`);
        }}
        isConnected={motorStatus.connected}
      />
    </DesktopWindowFrame>
  );
}
