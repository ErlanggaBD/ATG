import React from 'react';
import { AtgTestRow } from '../types';
import { 
  CheckSquare, 
  Square, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sliders, 
  AlertCircle, 
  CheckCircle, 
  Crosshair,
  Lock,
  Unlock
} from 'lucide-react';

interface TestingTableProps {
  rows: AtgTestRow[];
  onRowChange: (index: number, updated: Partial<AtgTestRow>) => void;
  onToggleAll: (checked: boolean) => void;
  isEditAlgEnabled: boolean;
  isEditStdEnabled: boolean;
  onMoveToMeter: (meter: number) => void;
  currentMotorPos: number;
  batasKesalahanMm: number;
}

export const TestingTable: React.FC<TestingTableProps> = ({
  rows,
  onRowChange,
  onToggleAll,
  isEditAlgEnabled,
  isEditStdEnabled,
  onMoveToMeter,
  currentMotorPos,
  batasKesalahanMm
}) => {
  const allChecked = rows.every((r) => r.selected);
  const someChecked = rows.some((r) => r.selected);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0d1017] overflow-hidden">
      {/* Table Top Action Bar */}
      <div className="bg-[#12151e] border-b border-zinc-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              id="chk-select-all"
              onClick={() => onToggleAll(!allChecked)}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white font-medium cursor-pointer"
            >
              {allChecked ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-zinc-500" />
              )}
              <span>Pilih Semua Titik (1-17m)</span>
            </button>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">
              Aktif: <strong className="text-blue-400">{rows.filter((r) => r.selected).length}</strong> dari 17 Titik
            </span>
          </div>
        </div>

        {/* Lock / Unlock State Indicators */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 border ${
            isEditAlgEnabled 
              ? 'bg-blue-950/70 border-blue-600/60 text-blue-300' 
              : 'bg-zinc-850 border-zinc-700 text-zinc-400'
          }`}>
            {isEditAlgEnabled ? <Unlock className="w-3 h-3 text-blue-400" /> : <Lock className="w-3 h-3 text-zinc-500" />}
            ALG: {isEditAlgEnabled ? 'Mode Edit Aktif' : 'Terkunci'}
          </span>

          <span className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 border ${
            isEditStdEnabled 
              ? 'bg-emerald-950/70 border-emerald-600/60 text-emerald-300' 
              : 'bg-zinc-850 border-zinc-700 text-zinc-400'
          }`}>
            {isEditStdEnabled ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-zinc-500" />}
            Standar: {isEditStdEnabled ? 'Mode Edit Aktif' : 'Terkunci'}
          </span>

          <span className="text-zinc-500 text-[11px]">
            Toleransi BKD: <strong className="text-zinc-300 font-mono">±{batasKesalahanMm.toFixed(1)} mm</strong>
          </span>
        </div>
      </div>

      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table id="tbl-atg-points" className="w-full text-left border-collapse text-xs select-none">
          {/* Header Row */}
          <thead className="bg-[#151922] text-zinc-300 sticky top-0 z-20 border-b border-zinc-800 shadow-sm">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">Uji</th>
              <th className="py-2.5 px-2 w-16 text-center font-bold">Meter</th>
              <th className="py-2.5 px-2 text-center bg-blue-950/30 border-l border-r border-blue-900/30 text-blue-300" colSpan={4}>
                PEMBACAAN ALG (AUTOMATIC LIQUID GAUGE)
              </th>
              <th className="py-2.5 px-2 text-center bg-emerald-950/30 border-r border-emerald-900/30 text-emerald-300" colSpan={3}>
                PEMBACAAN STANDAR (PITA/LASER)
              </th>
              <th className="py-2.5 px-2 text-center w-24">Deviasi (mm)</th>
              <th className="py-2.5 px-2 text-center w-20">Status BKD</th>
              <th className="py-2.5 px-2 text-center w-16">Aksi</th>
            </tr>
            <tr className="text-[10px] text-zinc-400 bg-[#12151e] border-b border-zinc-800/80">
              <th className="py-1 px-2 text-center">Check</th>
              <th className="py-1 px-2 text-center">Posisi</th>
              <th className="py-1 px-2 text-center text-blue-200">Naik (mm)</th>
              <th className="py-1 px-2 text-center text-blue-200">Turun (mm)</th>
              <th className="py-1 px-2 text-center text-blue-200">Disk. Sblm</th>
              <th className="py-1 px-2 text-center text-blue-200">Disk. Ssdh</th>
              <th className="py-1 px-2 text-center text-emerald-200">Std Naik</th>
              <th className="py-1 px-2 text-center text-emerald-200">Std Turun</th>
              <th className="py-1 px-2 text-center text-emerald-200">Cek (N/T)</th>
              <th className="py-1 px-2 text-center">Koreksi</th>
              <th className="py-1 px-2 text-center">Hasil</th>
              <th className="py-1 px-2 text-center">Motor</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {rows.map((row, idx) => {
              const isAtCurrentPos = Math.abs(currentMotorPos - row.meter) < 0.1;
              const isSpecial5M = row.meter === 5;
              const isSpecial17M = row.meter === 17;

              // Parse numeric deviation
              const algN = parseFloat(row.algNaik) || 0;
              const stdN = parseFloat(row.stdNaik) || (row.meter * 1000);
              const devNaik = algN - stdN;

              const algT = parseFloat(row.algTurun) || 0;
              const stdT = parseFloat(row.stdTurun) || (row.meter * 1000);
              const devTurun = algT - stdT;

              const isPass = Math.abs(devNaik) <= batasKesalahanMm && Math.abs(devTurun) <= batasKesalahanMm;

              return (
                <tr
                  key={row.meter}
                  id={`row-meter-${row.meter}`}
                  className={`transition-colors ${
                    isAtCurrentPos 
                      ? 'bg-blue-950/40 border-l-4 border-l-blue-500' 
                      : row.selected 
                        ? 'hover:bg-zinc-850/50 bg-[#0f121a]' 
                        : 'opacity-40 bg-zinc-950'
                  }`}
                >
                  {/* Checkbox Titik Uji */}
                  <td className="py-1.5 px-3 text-center">
                    <input
                      type="checkbox"
                      id={`chk-point-${row.meter}`}
                      checked={row.selected}
                      onChange={(e) => onRowChange(idx, { selected: e.target.checked })}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </td>

                  {/* Meter Column with tags for Zero & Home */}
                  <td className="py-1.5 px-2 text-center">
                    <div className="flex items-center justify-center gap-1 font-sans">
                      <span className="font-bold text-xs text-zinc-100">{row.meter} m</span>
                      {isSpecial5M && (
                        <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          ZERO
                        </span>
                      )}
                      {isSpecial17M && (
                        <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          HOME
                        </span>
                      )}
                    </div>
                  </td>

                  {/* FIELD PEMBACAAN ALG: Naik */}
                  <td className="py-1.5 px-1.5">
                    <input
                      type="text"
                      id={`input-alg-naik-${row.meter}`}
                      disabled={!isEditAlgEnabled}
                      value={row.algNaik}
                      onChange={(e) => onRowChange(idx, { algNaik: e.target.value })}
                      className={`w-full text-center px-1.5 py-1 rounded text-xs border transition ${
                        isEditAlgEnabled 
                          ? 'bg-zinc-900 text-blue-300 border-zinc-700 focus:border-blue-500 focus:bg-zinc-850' 
                          : 'bg-zinc-900/50 text-zinc-300 border-transparent cursor-default'
                      }`}
                    />
                  </td>

                  {/* FIELD PEMBACAAN ALG: Turun */}
                  <td className="py-1.5 px-1.5">
                    <input
                      type="text"
                      id={`input-alg-turun-${row.meter}`}
                      disabled={!isEditAlgEnabled}
                      value={row.algTurun}
                      onChange={(e) => onRowChange(idx, { algTurun: e.target.value })}
                      className={`w-full text-center px-1.5 py-1 rounded text-xs border transition ${
                        isEditAlgEnabled 
                          ? 'bg-zinc-900 text-blue-300 border-zinc-700 focus:border-blue-500 focus:bg-zinc-850' 
                          : 'bg-zinc-900/50 text-zinc-300 border-transparent cursor-default'
                      }`}
                    />
                  </td>

                  {/* FIELD PEMBACAAN ALG: Diskriminasi Sebelum */}
                  <td className="py-1.5 px-1.5">
                    <input
                      type="text"
                      id={`input-alg-disk-sblm-${row.meter}`}
                      disabled={!isEditAlgEnabled}
                      value={row.algDiskSebelum}
                      onChange={(e) => onRowChange(idx, { algDiskSebelum: e.target.value })}
                      className={`w-full text-center px-1.5 py-1 rounded text-xs border transition ${
                        isEditAlgEnabled 
                          ? 'bg-zinc-900 text-blue-300 border-zinc-700 focus:border-blue-500 focus:bg-zinc-850' 
                          : 'bg-zinc-900/50 text-zinc-300 border-transparent cursor-default'
                      }`}
                    />
                  </td>

                  {/* FIELD PEMBACAAN ALG: Diskriminasi Setelah */}
                  <td className="py-1.5 px-1.5 border-r border-zinc-800">
                    <input
                      type="text"
                      id={`input-alg-disk-ssdh-${row.meter}`}
                      disabled={!isEditAlgEnabled}
                      value={row.algDiskSetelah}
                      onChange={(e) => onRowChange(idx, { algDiskSetelah: e.target.value })}
                      className={`w-full text-center px-1.5 py-1 rounded text-xs border transition ${
                        isEditAlgEnabled 
                          ? 'bg-zinc-900 text-blue-300 border-zinc-700 focus:border-blue-500 focus:bg-zinc-850' 
                          : 'bg-zinc-900/50 text-zinc-300 border-transparent cursor-default'
                      }`}
                    />
                  </td>

                  {/* FIELD PEMBACAAN STANDAR: Naik */}
                  <td className="py-1.5 px-1.5">
                    <input
                      type="text"
                      id={`input-std-naik-${row.meter}`}
                      disabled={!isEditStdEnabled}
                      value={row.stdNaik}
                      onChange={(e) => onRowChange(idx, { stdNaik: e.target.value })}
                      className={`w-full text-center px-1.5 py-1 rounded text-xs border transition ${
                        isEditStdEnabled 
                          ? 'bg-zinc-900 text-emerald-300 border-zinc-700 focus:border-emerald-500 focus:bg-zinc-850' 
                          : 'bg-zinc-900/50 text-zinc-300 border-transparent cursor-default'
                      }`}
                    />
                  </td>

                  {/* FIELD PEMBACAAN STANDAR: Turun */}
                  <td className="py-1.5 px-1.5">
                    <input
                      type="text"
                      id={`input-std-turun-${row.meter}`}
                      disabled={!isEditStdEnabled}
                      value={row.stdTurun}
                      onChange={(e) => onRowChange(idx, { stdTurun: e.target.value })}
                      className={`w-full text-center px-1.5 py-1 rounded text-xs border transition ${
                        isEditStdEnabled 
                          ? 'bg-zinc-900 text-emerald-300 border-zinc-700 focus:border-emerald-500 focus:bg-zinc-850' 
                          : 'bg-zinc-900/50 text-zinc-300 border-transparent cursor-default'
                      }`}
                    />
                  </td>

                  {/* FIELD PEMBACAAN STANDAR: Radio/Checkbox (Naik, Turun) */}
                  <td className="py-1.5 px-1 text-center border-r border-zinc-800">
                    <div className="flex items-center justify-center gap-2">
                      <label className="flex items-center gap-0.5 cursor-pointer text-[10px] text-zinc-400 hover:text-emerald-300">
                        <input
                          type="checkbox"
                          checked={row.stdNaikChecked}
                          onChange={(e) => onRowChange(idx, { stdNaikChecked: e.target.checked })}
                          className="w-3 h-3 rounded bg-zinc-900 border-zinc-700 text-emerald-600 focus:ring-0"
                        />
                        <span>N</span>
                      </label>
                      <label className="flex items-center gap-0.5 cursor-pointer text-[10px] text-zinc-400 hover:text-emerald-300">
                        <input
                          type="checkbox"
                          checked={row.stdTurunChecked}
                          onChange={(e) => onRowChange(idx, { stdTurunChecked: e.target.checked })}
                          className="w-3 h-3 rounded bg-zinc-900 border-zinc-700 text-emerald-600 focus:ring-0"
                        />
                        <span>T</span>
                      </label>
                    </div>
                  </td>

                  {/* DEVIASI / KOREKSI */}
                  <td className="py-1.5 px-2 text-center text-[11px]">
                    <div className="flex flex-col items-center">
                      <span className={devNaik > 0 ? 'text-rose-400' : devNaik < 0 ? 'text-amber-400' : 'text-zinc-300'}>
                        N: {devNaik >= 0 ? `+${devNaik.toFixed(2)}` : devNaik.toFixed(2)}
                      </span>
                      <span className={devTurun > 0 ? 'text-rose-400' : devTurun < 0 ? 'text-amber-400' : 'text-zinc-300'}>
                        T: {devTurun >= 0 ? `+${devTurun.toFixed(2)}` : devTurun.toFixed(2)}
                      </span>
                    </div>
                  </td>

                  {/* STATUS BKD */}
                  <td className="py-1.5 px-2 text-center">
                    {isPass ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                        LULUS
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-rose-950/60 text-rose-400 border border-rose-800/60">
                        PERIKSA
                      </span>
                    )}
                  </td>

                  {/* AKSI: PINDAHKAN MOTOR KE TITIK INI */}
                  <td className="py-1.5 px-2 text-center">
                    <button
                      id={`btn-goto-${row.meter}`}
                      onClick={() => onMoveToMeter(row.meter)}
                      className="p-1 rounded bg-zinc-800 hover:bg-blue-600 text-zinc-300 hover:text-white transition cursor-pointer"
                      title={`Gerakkan motor stepper ke ${row.meter} meter`}
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
