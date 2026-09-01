export interface CSourceFile {
  filename: string;
  language: string;
  description: string;
  code: string;
}

export const C_PROJECT_FILES: CSourceFile[] = [
  {
    filename: "main.c",
    language: "c",
    description: "Inisialisasi Window Win32, Dark Theme UI, Menu Pengujian Kiri, Tabel 1-17 Meter, dan Toolbar Kontrol Motor",
    code: `/**
 * ============================================================================
 * PROJEK : OTOMASI PENGUJIAN ATG HORIZONTAL
 * MODUL  : main.c (Win32 GUI Application Entry Point)
 * DESKRIPSI: Aplikasi Desktop Windows untuk Pengujian & Kalibrasi Automatic 
 *            Tank Gauge (ATG) Panjang 1 - 17 Meter menggunakan Motor Stepper
 *            dengan Komunikasi Soket TCP/IP.
 * KOMPILER: GCC (MinGW-w64) atau MSVC (Microsoft Visual C++)
 * ============================================================================
 */

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <windowsx.h>
#include <commctrl.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "resource.h"
#include "tcp_client.h"
#include "motor_controller.h"
#include "excel_export.h"

#pragma comment(lib, "comctl32.lib")
#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "gdi32.lib")
#pragma comment(lib, "user32.lib")

/* Global Handles & Variables */
HINSTANCE g_hInstance = NULL;
HWND g_hWndMain = NULL;
HWND g_hWndTableContainer = NULL;
HWND g_hLblStatus = NULL;
HWND g_hLblTimestamp = NULL;
HWND g_hLblPosisi = NULL;

/* GDI Dark Theme Brushes & Colors */
HBRUSH g_hBrushBgDark = NULL;       /* Background utama (#121212) */
HBRUSH g_hBrushCardDark = NULL;     /* Panel card (#1e1e1e) */
HBRUSH g_hBrushInputDark = NULL;    /* Field input (#2a2a2a) */
COLORREF g_colTextWhite = RGB(240, 240, 240);
COLORREF g_colTextMuted = RGB(160, 160, 160);
COLORREF g_colAccentBlue = RGB(33, 150, 243);
COLORREF g_colAccentGreen = RGB(76, 175, 80);
COLORREF g_colAccentOrange = RGB(255, 152, 0);
COLORREF g_colAccentRed = RGB(244, 67, 54);

/* Struktur Data Titik Uji Baris 1 s.d 17 */
AtgTestPointRow g_TestRows[TOTAL_METER_ROWS];
char g_szLastCalibrationTimestamp[64] = "Belum Dikalibrasi";
char g_szActiveTestMode[64] = "IDLE";
BOOL g_bEditAlgEnabled = FALSE;
BOOL g_bEditStdEnabled = FALSE;

/* Forward Declarations */
LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam);
void InitApplicationData(void);
void CreateUserInterface(HWND hWnd);
void CreateLeftTestingMenu(HWND hWnd, int x, int y, int width, int height);
void CreateDataTableGrid(HWND hWnd, int x, int y, int width, int height);
void CreateBottomToolbar(HWND hWnd, int x, int y, int width, int height);
void UpdateTimestampLabel(void);
void RefreshTableFromData(void);
void GatherTableData(void);

/* Handler Tombol Sesuai Spesifikasi */
void OnButtonKalibrasiClicked(void);
void OnButtonTeraUlangClicked(void);
void OnButtonEvaluasiAkurasiClicked(void);
void OnButtonEvaluasiDiskriminasiClicked(void);
void OnButtonPengaturanClicked(void);
void OnButtonPreviewClicked(void);
void OnButtonCloseClicked(void);
void OnButtonZeroClicked(void);
void OnButtonHomeClicked(void);
void OnButtonPengujianNaikClicked(void);
void OnButtonPengujianTurunClicked(void);
void OnButtonEditAlgClicked(void);
void OnButtonEditStdClicked(void);

/**
 * Entry Point WinMain
 */
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow)
{
    g_hInstance = hInstance;
    
    /* Inisialisasi Common Controls untuk UI modern */
    INITCOMMONCONTROLSEX icex;
    icex.dwSize = sizeof(INITCOMMONCONTROLSEX);
    icex.dwICC = ICC_WIN95_CLASSES | ICC_STANDARD_CLASSES;
    InitCommonControlsEx(&icex);

    /* Inisialisasi Brush Tema Gelap */
    g_hBrushBgDark = CreateSolidBrush(RGB(18, 18, 18));
    g_hBrushCardDark = CreateSolidBrush(RGB(30, 30, 30));
    g_hBrushInputDark = CreateSolidBrush(RGB(42, 42, 42));

    /* Inisialisasi Data Uji Default (Meter 1 - 17) */
    InitApplicationData();

    /* Inisialisasi Subsistem TCP/IP Socket */
    if (!TcpClient_Initialize("192.168.1.100", 8080)) {
        OutputDebugStringA("[TCP] Warning: Gagal inisialisasi socket default.\\n");
    }

    /* Daftarkan Window Class */
    WNDCLASSEX wcex;
    ZeroMemory(&wcex, sizeof(WNDCLASSEX));
    wcex.cbSize = sizeof(WNDCLASSEX);
    wcex.style = CS_HREDRAW | CS_VREDRAW;
    wcex.lpfnWndProc = WndProc;
    wcex.hInstance = hInstance;
    wcex.hCursor = LoadCursor(NULL, IDC_ARROW);
    wcex.hbrBackground = g_hBrushBgDark;
    wcex.lpszClassName = "OtomasiAtgHorizontalWindowClass";
    wcex.hIcon = LoadIcon(NULL, IDI_APPLICATION);

    if (!RegisterClassEx(&wcex)) {
        MessageBoxA(NULL, "Gagal mendaftarkan Window Class!", "Fatal Error", MB_ICONERROR);
        return 1;
    }

    /* Buat Main Window */
    g_hWndMain = CreateWindowEx(
        0,
        "OtomasiAtgHorizontalWindowClass",
        "OTOMASI PENGUJIAN ATG HORIZONTAL - Sistem Kontrol & Kalibrasi Metrologi",
        WS_OVERLAPPEDWINDOW | WS_CLIPCHILDREN,
        CW_USEDEFAULT, CW_USEDEFAULT, 1280, 800,
        NULL, NULL, hInstance, NULL
    );

    if (!g_hWndMain) {
        MessageBoxA(NULL, "Gagal membuat jendela utama!", "Fatal Error", MB_ICONERROR);
        return 1;
    }

    ShowWindow(g_hWndMain, nCmdShow);
    UpdateWindow(g_hWndMain);

    /* Main Message Loop */
    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    /* Cleanup Resources */
    TcpClient_Cleanup();
    DeleteObject(g_hBrushBgDark);
    DeleteObject(g_hBrushCardDark);
    DeleteObject(g_hBrushInputDark);

    return (int)msg.wParam;
}

/**
 * Inisialisasi Nilai Default Data 17 Baris Meter
 */
void InitApplicationData(void)
{
    for (int i = 0; i < TOTAL_METER_ROWS; i++) {
        g_TestRows[i].nMeter = i + 1;
        g_TestRows[i].bTitikUjiChecked = TRUE;
        
        /* Default nilai pembacaan awal (placeholder / kalkulasi standar) */
        sprintf(g_TestRows[i].szAlgNaik, "%.3f", (double)(i + 1) * 1000.0);
        sprintf(g_TestRows[i].szAlgTurun, "%.3f", (double)(i + 1) * 1000.0);
        sprintf(g_TestRows[i].szAlgDiskSebelum, "%.3f", (double)(i + 1) * 1000.0);
        sprintf(g_TestRows[i].szAlgDiskSetelah, "%.3f", (double)(i + 1) * 1000.0);
        
        sprintf(g_TestRows[i].szStdNaik, "%.3f", (double)(i + 1) * 1000.0);
        sprintf(g_TestRows[i].szStdTurun, "%.3f", (double)(i + 1) * 1000.0);
        
        g_TestRows[i].bStdNaikChecked = TRUE;
        g_TestRows[i].bStdTurunChecked = TRUE;
    }
}

/**
 * Callback Prosedur Jendela (Window Procedure)
 */
LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam)
{
    switch (message)
    {
    case WM_CREATE:
        CreateUserInterface(hWnd);
        SetTimer(hWnd, TIMER_MOTOR_STATUS, 500, NULL); /* Poll status per 500ms */
        break;

    case WM_TIMER:
        if (wParam == TIMER_MOTOR_STATUS) {
            /* Perbarui label status posisi dari modul motor/TCP */
            double currentPos = Motor_GetCurrentPosition();
            char szPos[64];
            sprintf(szPos, "Posisi Motor: %.3f m | Status TCP: %s", 
                currentPos, 
                TcpClient_IsConnected() ? "TERHUBUNG (192.168.1.100:8080)" : "TERPUTUS");
            if (g_hLblPosisi) {
                SetWindowTextA(g_hLblPosisi, szPos);
            }
        }
        break;

    case WM_COMMAND:
    {
        int wmId = LOWORD(wParam);
        int wmEvent = HIWORD(wParam);

        switch (wmId)
        {
        /* 4 Tombol Menu Pengujian (Kiri) */
        case IDC_BTN_KALIBRASI:
            OnButtonKalibrasiClicked();
            break;
        case IDC_BTN_TERA_ULANG:
            OnButtonTeraUlangClicked();
            break;
        case IDC_BTN_EVAL_AKURASI:
            OnButtonEvaluasiAkurasiClicked();
            break;
        case IDC_BTN_EVAL_DISKRIMINASI:
            OnButtonEvaluasiDiskriminasiClicked();
            break;

        /* Toolbar Kontrol & Ekspor (Bawah) */
        case IDC_BTN_PENGATURAN:
            OnButtonPengaturanClicked();
            break;
        case IDC_BTN_PREVIEW:
            OnButtonPreviewClicked();
            break;
        case IDC_BTN_CLOSE:
            OnButtonCloseClicked();
            break;
        case IDC_BTN_ZERO:
            OnButtonZeroClicked();
            break;
        case IDC_BTN_HOME:
            OnButtonHomeClicked();
            break;
        case IDC_BTN_UJI_NAIK:
            OnButtonPengujianNaikClicked();
            break;
        case IDC_BTN_UJI_TURUN:
            OnButtonPengujianTurunClicked();
            break;
        case IDC_BTN_EDIT_ALG:
            OnButtonEditAlgClicked();
            break;
        case IDC_BTN_EDIT_STD:
            OnButtonEditStdClicked();
            break;

        default:
            return DefWindowProc(hWnd, message, wParam, lParam);
        }
        break;
    }

    /* Pewarnaan Dark Theme untuk Elemen Standar Win32 */
    case WM_CTLCOLORSTATIC:
    {
        HDC hdcStatic = (HDC)wParam;
        SetTextColor(hdcStatic, g_colTextWhite);
        SetBkMode(hdcStatic, TRANSPARENT);
        return (LRESULT)g_hBrushBgDark;
    }

    case WM_CTLCOLOREDIT:
    {
        HDC hdcEdit = (HDC)wParam;
        SetTextColor(hdcEdit, g_colTextWhite);
        SetBkColor(hdcEdit, RGB(42, 42, 42));
        return (LRESULT)g_hBrushInputDark;
    }

    case WM_CTLCOLORBTN:
    {
        return (LRESULT)g_hBrushBgDark;
    }

    case WM_SIZE:
    {
        /* Responsive repositioning saat window di-resize */
        int width = LOWORD(lParam);
        int height = HIWORD(lParam);
        
        int menuWidth = 260;
        int toolbarHeight = 90;
        int tableHeight = height - toolbarHeight - 60;
        int tableWidth = width - menuWidth - 40;

        if (g_hWndTableContainer) {
            MoveWindow(g_hWndTableContainer, menuWidth + 30, 50, tableWidth, tableHeight, TRUE);
        }
        break;
    }

    case WM_DESTROY:
        KillTimer(hWnd, TIMER_MOTOR_STATUS);
        PostQuitMessage(0);
        break;

    default:
        return DefWindowProc(hWnd, message, wParam, lParam);
    }
    return 0;
}

/**
 * Membuat Seluruh Tata Letak Antarmuka Pengguna
 */
void CreateUserInterface(HWND hWnd)
{
    RECT rc;
    GetClientRect(hWnd, &rc);
    int clientWidth = rc.right - rc.left;
    int clientHeight = rc.bottom - rc.top;

    /* Header Banner Status */
    HWND hHeader = CreateWindowEx(
        0, "STATIC", 
        "OTOMASI PENGUJIAN ATG HORIZONTAL (1 - 17 METER) | SISTEM KONTROL STEPPER",
        WS_CHILD | WS_VISIBLE | SS_LEFT | SS_CENTERIMAGE,
        20, 10, clientWidth - 40, 30,
        hWnd, NULL, g_hInstance, NULL
    );

    /* 1. Bagian Kiri: Menu Pengujian */
    CreateLeftTestingMenu(hWnd, 20, 50, 250, clientHeight - 160);

    /* 2. Bagian Tengah & Kanan: Tabel 1-17 Meter */
    CreateDataTableGrid(hWnd, 290, 50, clientWidth - 310, clientHeight - 160);

    /* 3. Bagian Bawah: Toolbar Kontrol & Manajemen */
    CreateBottomToolbar(hWnd, 20, clientHeight - 95, clientWidth - 40, 85);
}

/**
 * 1. Bagian Kiri (Menu Pengujian): 4 Tombol Besar dengan Identitas Uji
 */
void CreateLeftTestingMenu(HWND hWnd, int x, int y, int width, int height)
{
    /* Container Groupbox / Panel Menu */
    HWND hGroup = CreateWindowEx(
        0, "BUTTON", "MENU PENGUJIAN",
        WS_CHILD | WS_VISIBLE | BS_GROUPBOX,
        x, y, width, height,
        hWnd, NULL, g_hInstance, NULL
    );

    int btnWidth = width - 30;
    int btnHeight = 70;
    int spacing = 15;
    int startY = y + 30;

    /* Tombol 1: KALIBRASI */
    CreateWindowEx(
        0, "BUTTON", "[ * ]  1. KALIBRASI\\n(Mode Standar Nol & Span)",
        WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON | BS_MULTILINE,
        x + 15, startY + 0 * (btnHeight + spacing), btnWidth, btnHeight,
        hWnd, (HMENU)IDC_BTN_KALIBRASI, g_hInstance, NULL
    );

    /* Tombol 2: TERA ULANG */
    CreateWindowEx(
        0, "BUTTON", "[ @ ]  2. TERA ULANG\\n(Verifikasi Periodik Lapangan)",
        WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON | BS_MULTILINE,
        x + 15, startY + 1 * (btnHeight + spacing), btnWidth, btnHeight,
        hWnd, (HMENU)IDC_BTN_TERA_ULANG, g_hInstance, NULL
    );

    /* Tombol 3: EVALUASI TIPE AKURASI */
    CreateWindowEx(
        0, "BUTTON", "[ # ]  3. EVALUASI AKURASI\\n(Pengujian Titik Acuan 1-17m)",
        WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON | BS_MULTILINE,
        x + 15, startY + 2 * (btnHeight + spacing), btnWidth, btnHeight,
        hWnd, (HMENU)IDC_BTN_EVAL_AKURASI, g_hInstance, NULL
    );

    /* Tombol 4: EVALUASI TIPE DISKRIMINASI */
    CreateWindowEx(
        0, "BUTTON", "[ % ]  4. EVALUASI DISKRIMINASI\\n(Uji Kepekaan Ambang Sinyal)",
        WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON | BS_MULTILINE,
        x + 15, startY + 3 * (btnHeight + spacing), btnWidth, btnHeight,
        hWnd, (HMENU)IDC_BTN_EVAL_DISKRIMINASI, g_hInstance, NULL
    );

    /* Info Status Mode Aktif */
    g_hLblStatus = CreateWindowEx(
        0, "STATIC", "Mode Aktif: [SIAP / STANDBY]",
        WS_CHILD | WS_VISIBLE | SS_CENTER,
        x + 15, startY + 4 * (btnHeight + spacing) + 10, btnWidth, 40,
        hWnd, NULL, g_hInstance, NULL
    );
}

/**
 * 2. Bagian Tengah & Kanan: Tabel Bersusun Meter 1 sampai 17
 */
void CreateDataTableGrid(HWND hWnd, int x, int y, int width, int height)
{
    /* Container Scrollable Grid untuk 17 Baris */
    g_hWndTableContainer = CreateWindowEx(
        WS_EX_CLIENTEDGE, "STATIC", "",
        WS_CHILD | WS_VISIBLE | WS_VSCROLL | WS_BORDER,
        x, y, width, height,
        hWnd, NULL, g_hInstance, NULL
    );

    /* Sub-header Kolom Tabel */
    int curY = 10;
    int rowHeight = 28;
    
    /* Header Kolom */
    CreateWindowEx(0, "STATIC", "Titik Uji", WS_CHILD | WS_VISIBLE, 10, curY, 70, 20, g_hWndTableContainer, NULL, g_hInstance, NULL);
    CreateWindowEx(0, "STATIC", "Meter", WS_CHILD | WS_VISIBLE, 85, curY, 50, 20, g_hWndTableContainer, NULL, g_hInstance, NULL);
    CreateWindowEx(0, "STATIC", "ALG: Naik (mm)", WS_CHILD | WS_VISIBLE, 140, curY, 100, 20, g_hWndTableContainer, NULL, g_hInstance, NULL);
    CreateWindowEx(0, "STATIC", "ALG: Turun (mm)", WS_CHILD | WS_VISIBLE, 245, curY, 100, 20, g_hWndTableContainer, NULL, g_hInstance, NULL);
    CreateWindowEx(0, "STATIC", "Disk. Sblm (mm)", WS_CHILD | WS_VISIBLE, 350, curY, 100, 20, g_hWndTableContainer, NULL, g_hInstance, NULL);
    CreateWindowEx(0, "STATIC", "Disk. Ssdh (mm)", WS_CHILD | WS_VISIBLE, 455, curY, 100, 20, g_hWndTableContainer, NULL, g_hInstance, NULL);
    CreateWindowEx(0, "STATIC", "Std: Naik (mm)", WS_CHILD | WS_VISIBLE, 560, curY, 100, 20, g_hWndTableContainer, NULL, g_hInstance, NULL);
    CreateWindowEx(0, "STATIC", "Std: Turun (mm)", WS_CHILD | WS_VISIBLE, 665, curY, 100, 20, g_hWndTableContainer, NULL, g_hInstance, NULL);
    CreateWindowEx(0, "STATIC", "Cek Std", WS_CHILD | WS_VISIBLE, 770, curY, 80, 20, g_hWndTableContainer, NULL, g_hInstance, NULL);

    curY += 25;

    /* Loop Membuat 17 Baris Kontrol Input */
    for (int i = 0; i < TOTAL_METER_ROWS; i++) {
        char szMeterLabel[16];
        sprintf(szMeterLabel, "%d m", i + 1);

        /* Checkbox Titik Uji */
        g_TestRows[i].hChkTitikUji = CreateWindowEx(
            0, "BUTTON", "",
            WS_CHILD | WS_VISIBLE | BS_AUTOCHECKBOX,
            25, curY, 20, 20,
            g_hWndTableContainer, (HMENU)(INT_PTR)(IDC_TABLE_BASE + i * 10 + 0), g_hInstance, NULL
        );
        Button_SetCheck(g_TestRows[i].hChkTitikUji, BST_CHECKED);

        /* Label Nomor Meter */
        CreateWindowEx(
            0, "STATIC", szMeterLabel,
            WS_CHILD | WS_VISIBLE | SS_CENTER,
            80, curY + 2, 50, 20,
            g_hWndTableContainer, NULL, g_hInstance, NULL
        );

        /* Field Pembacaan ALG (Naik) */
        g_TestRows[i].hEditAlgNaik = CreateWindowEx(
            WS_EX_CLIENTEDGE, "EDIT", g_TestRows[i].szAlgNaik,
            WS_CHILD | WS_VISIBLE | ES_AUTOHSCROLL,
            140, curY, 95, 22,
            g_hWndTableContainer, (HMENU)(INT_PTR)(IDC_TABLE_BASE + i * 10 + 1), g_hInstance, NULL
        );

        /* Field Pembacaan ALG (Turun) */
        g_TestRows[i].hEditAlgTurun = CreateWindowEx(
            WS_EX_CLIENTEDGE, "EDIT", g_TestRows[i].szAlgTurun,
            WS_CHILD | WS_VISIBLE | ES_AUTOHSCROLL,
            245, curY, 95, 22,
            g_hWndTableContainer, (HMENU)(INT_PTR)(IDC_TABLE_BASE + i * 10 + 2), g_hInstance, NULL
        );

        /* Field Pembacaan ALG (Diskriminasi Sebelum) */
        g_TestRows[i].hEditAlgDiskSebelum = CreateWindowEx(
            WS_EX_CLIENTEDGE, "EDIT", g_TestRows[i].szAlgDiskSebelum,
            WS_CHILD | WS_VISIBLE | ES_AUTOHSCROLL,
            350, curY, 95, 22,
            g_hWndTableContainer, (HMENU)(INT_PTR)(IDC_TABLE_BASE + i * 10 + 3), g_hInstance, NULL
        );

        /* Field Pembacaan ALG (Diskriminasi Setelah) */
        g_TestRows[i].hEditAlgDiskSetelah = CreateWindowEx(
            WS_EX_CLIENTEDGE, "EDIT", g_TestRows[i].szAlgDiskSetelah,
            WS_CHILD | WS_VISIBLE | ES_AUTOHSCROLL,
            455, curY, 95, 22,
            g_hWndTableContainer, (HMENU)(INT_PTR)(IDC_TABLE_BASE + i * 10 + 4), g_hInstance, NULL
        );

        /* Field Pembacaan Standar (Naik) */
        g_TestRows[i].hEditStdNaik = CreateWindowEx(
            WS_EX_CLIENTEDGE, "EDIT", g_TestRows[i].szStdNaik,
            WS_CHILD | WS_VISIBLE | ES_AUTOHSCROLL,
            560, curY, 95, 22,
            g_hWndTableContainer, (HMENU)(INT_PTR)(IDC_TABLE_BASE + i * 10 + 5), g_hInstance, NULL
        );

        /* Field Pembacaan Standar (Turun) */
        g_TestRows[i].hEditStdTurun = CreateWindowEx(
            WS_EX_CLIENTEDGE, "EDIT", g_TestRows[i].szStdTurun,
            WS_CHILD | WS_VISIBLE | ES_AUTOHSCROLL,
            665, curY, 95, 22,
            g_hWndTableContainer, (HMENU)(INT_PTR)(IDC_TABLE_BASE + i * 10 + 6), g_hInstance, NULL
        );

        /* Radio / Checkbox Pembacaan Standar */
        g_TestRows[i].hChkStdNaik = CreateWindowEx(
            0, "BUTTON", "N",
            WS_CHILD | WS_VISIBLE | BS_AUTOCHECKBOX,
            770, curY, 30, 20,
            g_hWndTableContainer, (HMENU)(INT_PTR)(IDC_TABLE_BASE + i * 10 + 7), g_hInstance, NULL
        );
        Button_SetCheck(g_TestRows[i].hChkStdNaik, BST_CHECKED);

        g_TestRows[i].hChkStdTurun = CreateWindowEx(
            0, "BUTTON", "T",
            WS_CHILD | WS_VISIBLE | BS_AUTOCHECKBOX,
            805, curY, 30, 20,
            g_hWndTableContainer, (HMENU)(INT_PTR)(IDC_TABLE_BASE + i * 10 + 8), g_hInstance, NULL
        );
        Button_SetCheck(g_TestRows[i].hChkStdTurun, BST_CHECKED);

        curY += rowHeight;
    }
}

/**
 * 3. Bagian Bawah: Toolbar Kontrol Motor & Manajemen Data
 */
void CreateBottomToolbar(HWND hWnd, int x, int y, int width, int height)
{
    /* Label Timestamp Kalibrasi Terakhir & Status Posisi */
    g_hLblTimestamp = CreateWindowEx(
        0, "STATIC", "Kalibrasi Terakhir: 2026-08-27 09:30 WIB | Status: Siap Pengujian",
        WS_CHILD | WS_VISIBLE | SS_LEFT,
        x, y - 22, 500, 20,
        hWnd, NULL, g_hInstance, NULL
    );

    g_hLblPosisi = CreateWindowEx(
        0, "STATIC", "Posisi Motor: 0.000 m | TCP: 192.168.1.100:8080",
        WS_CHILD | WS_VISIBLE | SS_RIGHT,
        x + width - 450, y - 22, 450, 20,
        hWnd, NULL, g_hInstance, NULL
    );

    int btnH = 38;
    int curX = x;
    int pad = 8;

    /* 1. Tombol PENGATURAN (ikon gerigi) */
    CreateWindowEx(0, "BUTTON", "[#] PENGATURAN", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
        curX, y, 115, btnH, hWnd, (HMENU)IDC_BTN_PENGATURAN, g_hInstance, NULL);
    curX += 115 + pad;

    /* 2. Tombol PREVIEW (ikon dokumen) */
    CreateWindowEx(0, "BUTTON", "[=] PREVIEW", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
        curX, y, 95, btnH, hWnd, (HMENU)IDC_BTN_PREVIEW, g_hInstance, NULL);
    curX += 95 + pad;

    /* 3. Tombol ZERO (ikon garis tengah) -> Pindah Motor ke Area 5 Meter */
    CreateWindowEx(0, "BUTTON", "[-] ZERO (5m)", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
        curX, y, 105, btnH, hWnd, (HMENU)IDC_BTN_ZERO, g_hInstance, NULL);
    curX += 105 + pad;

    /* 4. Tombol HOME (ikon rumah) -> Pindah Motor ke Area 17 Meter */
    CreateWindowEx(0, "BUTTON", "[H] HOME (17m)", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
        curX, y, 110, btnH, hWnd, (HMENU)IDC_BTN_HOME, g_hInstance, NULL);
    curX += 110 + pad;

    /* 5. Tombol PENGUJIAN NAIK (ikon panah atas) */
    CreateWindowEx(0, "BUTTON", "[^] UJI NAIK", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
        curX, y, 105, btnH, hWnd, (HMENU)IDC_BTN_UJI_NAIK, g_hInstance, NULL);
    curX += 105 + pad;

    /* 6. Tombol PENGUJIAN TURUN (ikon panah bawah) */
    CreateWindowEx(0, "BUTTON", "[v] UJI TURUN", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
        curX, y, 110, btnH, hWnd, (HMENU)IDC_BTN_UJI_TURUN, g_hInstance, NULL);
    curX += 110 + pad;

    /* 7. Tombol EDIT ALG (ikon pensil) */
    CreateWindowEx(0, "BUTTON", "[/] EDIT ALG", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
        curX, y, 100, btnH, hWnd, (HMENU)IDC_BTN_EDIT_ALG, g_hInstance, NULL);
    curX += 100 + pad;

    /* 8. Tombol EDIT STD (ikon pensil) */
    CreateWindowEx(0, "BUTTON", "[/] EDIT STD", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
        curX, y, 100, btnH, hWnd, (HMENU)IDC_BTN_EDIT_STD, g_hInstance, NULL);
    curX += 100 + pad;

    /* 9. Tombol CLOSE (ikon X) */
    CreateWindowEx(0, "BUTTON", "[X] CLOSE", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
        x + width - 90, y, 90, btnH, hWnd, (HMENU)IDC_BTN_CLOSE, g_hInstance, NULL);
}

/* ============================================================================
 * IMPLEMENTASI LOGIKA FUNGSI TOMBOL
 * ============================================================================
 */

/**
 * Handler: Tombol KALIBRASI
 * Mengirim sekuens inisialisasi kalibrasi & moving target awal ke controller
 */
void OnButtonKalibrasiClicked(void)
{
    strcpy(g_szActiveTestMode, "MODE KALIBRASI");
    if (g_hLblStatus) SetWindowTextA(g_hLblStatus, "Mode Aktif: [KALIBRASI STANDAR]");

    /* Kirim perintah TCP/IP ke controller */
    TcpClient_SendCommand("CMD:MODE:CALIBRATION\\r\\n");
    
    MessageBoxA(g_hWndMain, 
        "Mode KALIBRASI diaktifkan.\\nPerintah TCP 'CMD:MODE:CALIBRATION' dikirim ke controller motor.", 
        "Kalibrasi ATG", MB_ICONINFORMATION);
}

/**
 * Handler: Tombol TERA ULANG
 * Memulai prosedur tera ulang periodik untuk tangki horizontal
 */
void OnButtonTeraUlangClicked(void)
{
    strcpy(g_szActiveTestMode, "MODE TERA ULANG");
    if (g_hLblStatus) SetWindowTextA(g_hLblStatus, "Mode Aktif: [TERA ULANG PERIODIK]");

    TcpClient_SendCommand("CMD:MODE:REVERIFICATION\\r\\n");

    MessageBoxA(g_hWndMain, 
        "Mode TERA ULANG diaktifkan.\\nPerintah TCP 'CMD:MODE:REVERIFICATION' dikirim ke controller motor.", 
        "Tera Ulang ATG", MB_ICONINFORMATION);
}

/**
 * Handler: Tombol EVALUASI TIPE AKURASI
 * Melakukan pergerakan bertahap 1-17 meter untuk mencatat pembacaan akurasi
 */
void OnButtonEvaluasiAkurasiClicked(void)
{
    strcpy(g_szActiveTestMode, "MODE EVALUASI AKURASI");
    if (g_hLblStatus) SetWindowTextA(g_hLblStatus, "Mode Aktif: [EVALUASI AKURASI 1-17M]");

    TcpClient_SendCommand("CMD:MODE:EVAL_ACCURACY\\r\\n");

    MessageBoxA(g_hWndMain, 
        "Mode EVALUASI AKURASI dimulai.\\nMotor akan bergerak berurutan di titik uji aktif.", 
        "Evaluasi Akurasi", MB_ICONINFORMATION);
}

/**
 * Handler: Tombol EVALUASI TIPE DISKRIMINASI
 * Menguji ambang batas perubahan terkecil pada sensor ATG
 */
void OnButtonEvaluasiDiskriminasiClicked(void)
{
    strcpy(g_szActiveTestMode, "MODE EVALUASI DISKRIMINASI");
    if (g_hLblStatus) SetWindowTextA(g_hLblStatus, "Mode Aktif: [EVALUASI DISKRIMINASI]");

    TcpClient_SendCommand("CMD:MODE:EVAL_DISCRIMINATION\\r\\n");

    MessageBoxA(g_hWndMain, 
        "Mode EVALUASI DISKRIMINASI dimulai.\\nUji penambahan beban kecil (sebelum/setelah).", 
        "Evaluasi Diskriminasi", MB_ICONINFORMATION);
}

/**
 * Handler: Tombol PENGATURAN (ikon gerigi)
 * Membuka dialog konfigurasi ekspor Excel & konfigurasi IP/Port controller
 */
void OnButtonPengaturanClicked(void)
{
    /* Tampilkan dialog pengaturan parameter Excel / TCP */
    MessageBoxA(g_hWndMain, 
        "KONFIGURASI PARAMETER:\\n\\n"
        "- Target File: D:\\\\Laporan_ATG\\\\Hasil_Uji_ATG.csv\\n"
        "- IP Controller: 192.168.1.100 : 8080\\n"
        "- Pulsa per mm: 200 pulse/mm\\n"
        "- Kecepatan Motor: 50 mm/s\\n"
        "- Batas Kesalahan Izin (BKD): ± 1.0 mm", 
        "Pengaturan Sistem & Ekspor Excel", MB_ICONINFORMATION);
}

/**
 * Handler: Tombol PREVIEW (ikon dokumen)
 * Membaca data tabel saat ini dan melakukan preview ekspor Excel / CSV
 */
void OnButtonPreviewClicked(void)
{
    GatherTableData();
    
    char szSummary[1024];
    sprintf(szSummary, 
        "PREVIEW LAPORAN PENGUJIAN ATG HORIZONTAL:\\n\\n"
        "Total Titik Uji: 17 Titik (1m - 17m)\\n"
        "Titik Uji 1m : ALG Naik=%s mm, Std=%s mm\\n"
        "Titik Uji 5m (Zero Area): ALG Naik=%s mm, Std=%s mm\\n"
        "Titik Uji 17m (Home Area): ALG Naik=%s mm, Std=%s mm\\n\\n"
        "Apakah Anda ingin mengekspor data ini ke format Excel (.csv)?",
        g_TestRows[0].szAlgNaik, g_TestRows[0].szStdNaik,
        g_TestRows[4].szAlgNaik, g_TestRows[4].szStdNaik,
        g_TestRows[16].szAlgNaik, g_TestRows[16].szStdNaik);

    if (MessageBoxA(g_hWndMain, szSummary, "Preview Laporan Excel", MB_YESNO | MB_ICONQUESTION) == IDYES) {
        if (ExcelExport_SaveToCsv("Hasil_Uji_ATG_Horizontal.csv", g_TestRows, TOTAL_METER_ROWS)) {
            MessageBoxA(g_hWndMain, "Data berhasil diekspor ke 'Hasil_Uji_ATG_Horizontal.csv'!", "Ekspor Berhasil", MB_ICONINFORMATION);
        } else {
            MessageBoxA(g_hWndMain, "Gagal menulis file ekspor Excel.", "Error Ekspor", MB_ICONERROR);
        }
    }
}

/**
 * Handler: Tombol CLOSE (ikon X)
 * Menghentikan motor secara aman dan menutup aplikasi
 */
void OnButtonCloseClicked(void)
{
    if (MessageBoxA(g_hWndMain, "Apakah Anda yakin ingin menutup aplikasi Otomasi Pengujian ATG?", 
        "Konfirmasi Tutup", MB_YESNO | MB_ICONQUESTION) == IDYES) 
    {
        Motor_StopEmergency();
        DestroyWindow(g_hWndMain);
    }
}

/**
 * Handler: Tombol ZERO (ikon garis tengah)
 * Mengirim perintah TCP/IP memindahkan motor ke area 5 meter
 */
void OnButtonZeroClicked(void)
{
    /* Kirim perintah TCP/IP ke controller untuk menuju posisi 5 meter */
    Motor_MoveToZeroArea5M();
    
    UpdateTimestampLabel();
    MessageBoxA(g_hWndMain, 
        "Perintah ZERO dikirim via TCP/IP.\\nMotor stepper bergerak menuju Area 5.000 Meter.", 
        "Perintah Motor ZERO (5m)", MB_ICONINFORMATION);
}

/**
 * Handler: Tombol HOME (ikon rumah)
 * Mengirim perintah TCP/IP memindahkan motor ke area 17 meter
 */
void OnButtonHomeClicked(void)
{
    /* Kirim perintah TCP/IP ke controller untuk menuju posisi 17 meter (Home) */
    Motor_MoveToHomeArea17M();

    UpdateTimestampLabel();
    MessageBoxA(g_hWndMain, 
        "Perintah HOME dikirim via TCP/IP.\\nMotor stepper bergerak menuju Area 17.000 Meter (Home).", 
        "Perintah Motor HOME (17m)", MB_ICONINFORMATION);
}

/**
 * Handler: Tombol PENGUJIAN NAIK (ikon panah atas)
 * Memulai rangkaian pengujian bergerak dari 1m bertahap naik ke 17m
 */
void OnButtonPengujianNaikClicked(void)
{
    Motor_StartSequenceNaik();
    MessageBoxA(g_hWndMain, 
        "Sekuens PENGUJIAN NAIK dimulai (1m -> 17m).\\nMotor akan singgah di setiap titik uji yang dicentang.", 
        "Pengujian Naik", MB_ICONINFORMATION);
}

/**
 * Handler: Tombol PENGUJIAN TURUN (ikon panah bawah)
 * Memulai rangkaian pengujian bergerak dari 17m bertahap turun ke 1m
 */
void OnButtonPengujianTurunClicked(void)
{
    Motor_StartSequenceTurun();
    MessageBoxA(g_hWndMain, 
        "Sekuens PENGUJIAN TURUN dimulai (17m -> 1m).\\nMotor akan singgah di setiap titik uji yang dicentang.", 
        "Pengujian Turun", MB_ICONINFORMATION);
}

/**
 * Handler: Tombol EDIT ALG (ikon pensil/edit)
 * Mengaktifkan / Mengunci mode pengeditan field pembacaan ALG
 */
void OnButtonEditAlgClicked(void)
{
    g_bEditAlgEnabled = !g_bEditAlgEnabled;
    for (int i = 0; i < TOTAL_METER_ROWS; i++) {
        Edit_SetReadOnly(g_TestRows[i].hEditAlgNaik, !g_bEditAlgEnabled);
        Edit_SetReadOnly(g_TestRows[i].hEditAlgTurun, !g_bEditAlgEnabled);
        Edit_SetReadOnly(g_TestRows[i].hEditAlgDiskSebelum, !g_bEditAlgEnabled);
        Edit_SetReadOnly(g_TestRows[i].hEditAlgDiskSetelah, !g_bEditAlgEnabled);
    }
    
    char msg[64];
    sprintf(msg, "Mode Edit Field ALG sekarang: %s", g_bEditAlgEnabled ? "AKTIF (Bisa Diedit)" : "TERKUNCI (Read-Only)");
    MessageBoxA(g_hWndMain, msg, "Edit Pembacaan ALG", MB_ICONINFORMATION);
}

/**
 * Handler: Tombol EDIT STD (ikon pensil/edit)
 * Mengaktifkan / Mengunci mode pengeditan field pembacaan Standar
 */
void OnButtonEditStdClicked(void)
{
    g_bEditStdEnabled = !g_bEditStdEnabled;
    for (int i = 0; i < TOTAL_METER_ROWS; i++) {
        Edit_SetReadOnly(g_TestRows[i].hEditStdNaik, !g_bEditStdEnabled);
        Edit_SetReadOnly(g_TestRows[i].hEditStdTurun, !g_bEditStdEnabled);
    }

    char msg[64];
    sprintf(msg, "Mode Edit Field Standar sekarang: %s", g_bEditStdEnabled ? "AKTIF (Bisa Diedit)" : "TERKUNCI (Read-Only)");
    MessageBoxA(g_hWndMain, msg, "Edit Pembacaan Standar", MB_ICONINFORMATION);
}

/**
 * Memperbarui Label Waktu Kalibrasi Terakhir
 */
void UpdateTimestampLabel(void)
{
    time_t now = time(NULL);
    struct tm *t = localtime(&now);
    strftime(g_szLastCalibrationTimestamp, sizeof(g_szLastCalibrationTimestamp), "%Y-%m-%d %H:%M:%S", t);
    
    char buffer[128];
    sprintf(buffer, "Kalibrasi Terakhir: [%s] | Status: Aktif", g_szLastCalibrationTimestamp);
    if (g_hLblTimestamp) {
        SetWindowTextA(g_hLblTimestamp, buffer);
    }
}

/**
 * Mengambil Seluruh Input Textbox dari UI ke Array Struktur Data
 */
void GatherTableData(void)
{
    for (int i = 0; i < TOTAL_METER_ROWS; i++) {
        g_TestRows[i].bTitikUjiChecked = (Button_GetCheck(g_TestRows[i].hChkTitikUji) == BST_CHECKED);
        
        GetWindowTextA(g_TestRows[i].hEditAlgNaik, g_TestRows[i].szAlgNaik, sizeof(g_TestRows[i].szAlgNaik));
        GetWindowTextA(g_TestRows[i].hEditAlgTurun, g_TestRows[i].szAlgTurun, sizeof(g_TestRows[i].szAlgTurun));
        GetWindowTextA(g_TestRows[i].hEditAlgDiskSebelum, g_TestRows[i].szAlgDiskSebelum, sizeof(g_TestRows[i].szAlgDiskSebelum));
        GetWindowTextA(g_TestRows[i].hEditAlgDiskSetelah, g_TestRows[i].szAlgDiskSetelah, sizeof(g_TestRows[i].szAlgDiskSetelah));
        
        GetWindowTextA(g_TestRows[i].hEditStdNaik, g_TestRows[i].szStdNaik, sizeof(g_TestRows[i].szStdNaik));
        GetWindowTextA(g_TestRows[i].hEditStdTurun, g_TestRows[i].szStdTurun, sizeof(g_TestRows[i].szStdTurun));
        
        g_TestRows[i].bStdNaikChecked = (Button_GetCheck(g_TestRows[i].hChkStdNaik) == BST_CHECKED);
        g_TestRows[i].bStdTurunChecked = (Button_GetCheck(g_TestRows[i].hChkStdTurun) == BST_CHECKED);
    }
}
`
  },
  {
    filename: "resource.h",
    language: "c",
    description: "Definisi Identifier (Control ID, Timer ID, Konstanta Baris Uji)",
    code: `/**
 * ============================================================================
 * PROJEK : OTOMASI PENGUJIAN ATG HORIZONTAL
 * MODUL  : resource.h (Resource & Control ID Constants)
 * ============================================================================
 */

#ifndef RESOURCE_H
#define RESOURCE_H

#define TOTAL_METER_ROWS            17

/* Timer Identifiers */
#define TIMER_MOTOR_STATUS          1001
#define TIMER_SEQUENCE_STEP         1002

/* 4 Tombol Menu Pengujian (Kiri) */
#define IDC_BTN_KALIBRASI           2001
#define IDC_BTN_TERA_ULANG          2002
#define IDC_BTN_EVAL_AKURASI        2003
#define IDC_BTN_EVAL_DISKRIMINASI   2004

/* Toolbar Bawah (Kontrol Motor & Data) */
#define IDC_BTN_PENGATURAN          3001
#define IDC_BTN_PREVIEW             3002
#define IDC_BTN_CLOSE               3003
#define IDC_BTN_ZERO                3004  /* Area 5 meter */
#define IDC_BTN_HOME                3005  /* Area 17 meter */
#define IDC_BTN_UJI_NAIK            3006
#define IDC_BTN_UJI_TURUN           3007
#define IDC_BTN_EDIT_ALG            3008
#define IDC_BTN_EDIT_STD            3009

/* Base ID untuk Baris Tabel 1 s.d 17 */
#define IDC_TABLE_BASE              4000

#endif /* RESOURCE_H */
`
  },
  {
    filename: "tcp_client.h",
    language: "c",
    description: "Header Modul Komunikasi Soket TCP/IP Winsock2",
    code: `/**
 * ============================================================================
 * PROJEK : OTOMASI PENGUJIAN ATG HORIZONTAL
 * MODUL  : tcp_client.h (Winsock2 TCP/IP Client Module)
 * ============================================================================
 */

#ifndef TCP_CLIENT_H
#define TCP_CLIENT_H

#include <windows.h>
#include <winsock2.h>
#include <ws2tcpip.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    char szHost[64];
    int nPort;
    BOOL bConnected;
    SOCKET hSocket;
    CRITICAL_SECTION csLock;
} TcpClientContext;

/* Fungsi Inisialisasi & Koneksi */
BOOL TcpClient_Initialize(const char* host, int port);
BOOL TcpClient_Connect(void);
void TcpClient_Disconnect(void);
void TcpClient_Cleanup(void);

/* Fungsi Pengiriman & Penerimaan */
BOOL TcpClient_SendCommand(const char* command);
int  TcpClient_ReceiveData(char* buffer, int maxLen);
BOOL TcpClient_IsConnected(void);

/* Callback / Thread Receiver Status Motor */
DWORD WINAPI TcpClient_ReceiverThread(LPVOID lpParam);

#ifdef __cplusplus
}
#endif

#endif /* TCP_CLIENT_H */
`
  },
  {
    filename: "tcp_client.c",
    language: "c",
    description: "Implementasi Soket TCP/IP Winsock2 Client dengan Background Receiver Thread",
    code: `/**
 * ============================================================================
 * PROJEK : OTOMASI PENGUJIAN ATG HORIZONTAL
 * MODUL  : tcp_client.c (Winsock2 TCP/IP Socket Client Implementation)
 * ============================================================================
 */

#include "tcp_client.h"
#include <stdio.h>
#include <string.h>

static TcpClientContext g_TcpCtx;
static HANDLE g_hReceiverThread = NULL;
static BOOL g_bRunning = FALSE;

BOOL TcpClient_Initialize(const char* host, int port)
{
    WSADATA wsaData;
    int res = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (res != 0) {
        printf("[TCP] WSAStartup gagal: %d\\n", res);
        return FALSE;
    }

    InitializeCriticalSection(&g_TcpCtx.csLock);
    strncpy(g_TcpCtx.szHost, host, sizeof(g_TcpCtx.szHost) - 1);
    g_TcpCtx.nPort = port;
    g_TcpCtx.bConnected = FALSE;
    g_TcpCtx.hSocket = INVALID_SOCKET;

    return TcpClient_Connect();
}

BOOL TcpClient_Connect(void)
{
    EnterCriticalSection(&g_TcpCtx.csLock);

    if (g_TcpCtx.bConnected && g_TcpCtx.hSocket != INVALID_SOCKET) {
        LeaveCriticalSection(&g_TcpCtx.csLock);
        return TRUE;
    }

    g_TcpCtx.hSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (g_TcpCtx.hSocket == INVALID_SOCKET) {
        printf("[TCP] Gagal membuat socket: %d\\n", WSAGetLastError());
        LeaveCriticalSection(&g_TcpCtx.csLock);
        return FALSE;
    }

    /* Set timeout 2000ms */
    DWORD timeout = 2000;
    setsockopt(g_TcpCtx.hSocket, SOL_SOCKET, SO_RCVTIMEO, (const char*)&timeout, sizeof(timeout));
    setsockopt(g_TcpCtx.hSocket, SOL_SOCKET, SO_SNDTIMEO, (const char*)&timeout, sizeof(timeout));

    struct sockaddr_in clientService;
    clientService.sin_family = AF_INET;
    clientService.sin_addr.s_addr = inet_addr(g_TcpCtx.szHost);
    clientService.sin_port = htons((u_short)g_TcpCtx.nPort);

    if (connect(g_TcpCtx.hSocket, (SOCKADDR*)&clientService, sizeof(clientService)) == SOCKET_ERROR) {
        printf("[TCP] Gagal terhubung ke %s:%d. Error: %d\\n", 
               g_TcpCtx.szHost, g_TcpCtx.nPort, WSAGetLastError());
        closesocket(g_TcpCtx.hSocket);
        g_TcpCtx.hSocket = INVALID_SOCKET;
        g_TcpCtx.bConnected = FALSE;
        LeaveCriticalSection(&g_TcpCtx.csLock);
        return FALSE;
    }

    g_TcpCtx.bConnected = TRUE;
    printf("[TCP] Berhasil terhubung ke Controller Motor pada %s:%d\\n", 
           g_TcpCtx.szHost, g_TcpCtx.nPort);

    /* Jalankan Receiver Thread */
    g_bRunning = TRUE;
    g_hReceiverThread = CreateThread(NULL, 0, TcpClient_ReceiverThread, NULL, 0, NULL);

    LeaveCriticalSection(&g_TcpCtx.csLock);
    return TRUE;
}

void TcpClient_Disconnect(void)
{
    EnterCriticalSection(&g_TcpCtx.csLock);
    g_bRunning = FALSE;

    if (g_TcpCtx.hSocket != INVALID_SOCKET) {
        shutdown(g_TcpCtx.hSocket, SD_BOTH);
        closesocket(g_TcpCtx.hSocket);
        g_TcpCtx.hSocket = INVALID_SOCKET;
    }
    g_TcpCtx.bConnected = FALSE;
    LeaveCriticalSection(&g_TcpCtx.csLock);
}

void TcpClient_Cleanup(void)
{
    TcpClient_Disconnect();
    if (g_hReceiverThread) {
        WaitForSingleObject(g_hReceiverThread, 1000);
        CloseHandle(g_hReceiverThread);
        g_hReceiverThread = NULL;
    }
    DeleteCriticalSection(&g_TcpCtx.csLock);
    WSACleanup();
}

BOOL TcpClient_SendCommand(const char* command)
{
    EnterCriticalSection(&g_TcpCtx.csLock);

    if (!g_TcpCtx.bConnected || g_TcpCtx.hSocket == INVALID_SOCKET) {
        printf("[TCP] Gagal kirim: Socket belum terhubung.\\n");
        LeaveCriticalSection(&g_TcpCtx.csLock);
        return FALSE;
    }

    int bytesSent = send(g_TcpCtx.hSocket, command, (int)strlen(command), 0);
    if (bytesSent == SOCKET_ERROR) {
        printf("[TCP] Send gagal: %d\\n", WSAGetLastError());
        g_TcpCtx.bConnected = FALSE;
        LeaveCriticalSection(&g_TcpCtx.csLock);
        return FALSE;
    }

    printf("[TCP TX] >> %s", command);
    LeaveCriticalSection(&g_TcpCtx.csLock);
    return TRUE;
}

int TcpClient_ReceiveData(char* buffer, int maxLen)
{
    EnterCriticalSection(&g_TcpCtx.csLock);
    if (!g_TcpCtx.bConnected || g_TcpCtx.hSocket == INVALID_SOCKET) {
        LeaveCriticalSection(&g_TcpCtx.csLock);
        return -1;
    }

    int bytesRecv = recv(g_TcpCtx.hSocket, buffer, maxLen - 1, 0);
    if (bytesRecv > 0) {
        buffer[bytesRecv] = '\\0';
    }
    LeaveCriticalSection(&g_TcpCtx.csLock);
    return bytesRecv;
}

BOOL TcpClient_IsConnected(void)
{
    return g_TcpCtx.bConnected;
}

DWORD WINAPI TcpClient_ReceiverThread(LPVOID lpParam)
{
    char recvBuffer[512];
    while (g_bRunning) {
        int bytes = TcpClient_ReceiveData(recvBuffer, sizeof(recvBuffer));
        if (bytes > 0) {
            printf("[TCP RX] << %s\\n", recvBuffer);
            /* Parse status pesan seperti "POS:5.000,STAT:READY" di sini */
        }
        Sleep(50);
    }
    return 0;
}
`
  },
  {
    filename: "motor_controller.h",
    language: "c",
    description: "Header Abstraksi Kontrol Motor Stepper (ZERO 5M, HOME 17M, JOG, SEQUENCES)",
    code: `/**
 * ============================================================================
 * PROJEK : OTOMASI PENGUJIAN ATG HORIZONTAL
 * MODUL  : motor_controller.h (Stepper Motor Controller Abstraction)
 * ============================================================================
 */

#ifndef MOTOR_CONTROLLER_H
#define MOTOR_CONTROLLER_H

#include <windows.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    MOTOR_IDLE,
    MOTOR_MOVING_UP,
    MOTOR_MOVING_DOWN,
    MOTOR_HOMING,
    MOTOR_ZEROING,
    MOTOR_ERROR
} MotorState;

/* Fungsi Kontrol Motor Utama */
BOOL Motor_MoveToPosition(double targetMeter);
BOOL Motor_MoveToZeroArea5M(void);      /* Mengirim perintah ke area 5m */
BOOL Motor_MoveToHomeArea17M(void);     /* Mengirim perintah ke area 17m */
BOOL Motor_StartSequenceNaik(void);     /* Uji naik 1m -> 17m */
BOOL Motor_StartSequenceTurun(void);    /* Uji turun 17m -> 1m */
void Motor_StopEmergency(void);

/* Getter Status */
double Motor_GetCurrentPosition(void);
MotorState Motor_GetState(void);

#ifdef __cplusplus
}
#endif

#endif /* MOTOR_CONTROLLER_H */
`
  },
  {
    filename: "motor_controller.c",
    language: "c",
    description: "Implementasi Protokol Kontrol Pergerakan Motor Stepper via TCP/IP",
    code: `/**
 * ============================================================================
 * PROJEK : OTOMASI PENGUJIAN ATG HORIZONTAL
 * MODUL  : motor_controller.c (Motor Motion Commands Implementation)
 * ============================================================================
 */

#include "motor_controller.h"
#include "tcp_client.h"
#include <stdio.h>

static double g_CurrentPosMeter = 0.0;
static MotorState g_MotorState = MOTOR_IDLE;

BOOL Motor_MoveToPosition(double targetMeter)
{
    if (targetMeter < 0.0 || targetMeter > 17.5) {
        printf("[MOTOR] Error: Posisi target di luar batas lintasan (0 - 17.5m)\\n");
        return FALSE;
    }

    char cmd[64];
    sprintf(cmd, "CMD:MOVE_POS:%.3f\\r\\n", targetMeter);
    
    if (TcpClient_SendCommand(cmd)) {
        g_MotorState = (targetMeter > g_CurrentPosMeter) ? MOTOR_MOVING_UP : MOTOR_MOVING_DOWN;
        g_CurrentPosMeter = targetMeter; /* Simulasi / update posisi */
        return TRUE;
    }
    return FALSE;
}

/**
 * Memindahkan motor stepper ke titik acuan ZERO (Area 5 Meter)
 */
BOOL Motor_MoveToZeroArea5M(void)
{
    printf("[MOTOR] Mengirim perintah GOTO ZERO (5.000m)...\\n");
    char cmd[] = "CMD:GOTO_ZERO_5M\\r\\n";
    if (TcpClient_SendCommand(cmd)) {
        g_MotorState = MOTOR_ZEROING;
        g_CurrentPosMeter = 5.000;
        return TRUE;
    }
    return FALSE;
}

/**
 * Memindahkan motor stepper ke titik acuan HOME (Area 17 Meter)
 */
BOOL Motor_MoveToHomeArea17M(void)
{
    printf("[MOTOR] Mengirim perintah GOTO HOME (17.000m)...\\n");
    char cmd[] = "CMD:GOTO_HOME_17M\\r\\n";
    if (TcpClient_SendCommand(cmd)) {
        g_MotorState = MOTOR_HOMING;
        g_CurrentPosMeter = 17.000;
        return TRUE;
    }
    return FALSE;
}

/**
 * Memulai sekuens pengujian bertahap Naik (1 meter ke 17 meter)
 */
BOOL Motor_StartSequenceNaik(void)
{
    printf("[MOTOR] Memulai sekuens Pengujian Naik...\\n");
    return TcpClient_SendCommand("CMD:SEQ_START_UP:1TO17\\r\\n");
}

/**
 * Memulai sekuens pengujian bertahap Turun (17 meter ke 1 meter)
 */
BOOL Motor_StartSequenceTurun(void)
{
    printf("[MOTOR] Memulai sekuens Pengujian Turun...\\n");
    return TcpClient_SendCommand("CMD:SEQ_START_DOWN:17TO1\\r\\n");
}

/**
 * Emergency Stop untuk menghentikan motor secara instan
 */
void Motor_StopEmergency(void)
{
    printf("[MOTOR] EMERGENCY STOP DITEKAN!\\n");
    TcpClient_SendCommand("CMD:EMERGENCY_STOP\\r\\n");
    g_MotorState = MOTOR_IDLE;
}

double Motor_GetCurrentPosition(void)
{
    return g_CurrentPosMeter;
}

MotorState Motor_GetState(void)
{
    return g_MotorState;
}
`
  },
  {
    filename: "excel_export.h",
    language: "c",
    description: "Header Modul Ekspor Data Tabel ke Format CSV & Excel Spreadsheet XML",
    code: `/**
 * ============================================================================
 * PROJEK : OTOMASI PENGUJIAN ATG HORIZONTAL
 * MODUL  : excel_export.h (Data Export to Excel / CSV)
 * ============================================================================
 */

#ifndef EXCEL_EXPORT_H
#define EXCEL_EXPORT_H

#include <windows.h>
#include "resource.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    int nMeter;
    BOOL bTitikUjiChecked;
    
    HWND hChkTitikUji;
    HWND hEditAlgNaik;
    HWND hEditAlgTurun;
    HWND hEditAlgDiskSebelum;
    HWND hEditAlgDiskSetelah;
    
    HWND hEditStdNaik;
    HWND hEditStdTurun;
    HWND hChkStdNaik;
    HWND hChkStdTurun;

    char szAlgNaik[32];
    char szAlgTurun[32];
    char szAlgDiskSebelum[32];
    char szAlgDiskSetelah[32];

    char szStdNaik[32];
    char szStdTurun[32];
    BOOL bStdNaikChecked;
    BOOL bStdTurunChecked;
} AtgTestPointRow;

/* Fungsi Ekspor Data */
BOOL ExcelExport_SaveToCsv(const char* filePath, const AtgTestPointRow* rows, int totalRows);
BOOL ExcelExport_SaveToXmlSpreadsheet(const char* filePath, const AtgTestPointRow* rows, int totalRows);

#ifdef __cplusplus
}
#endif

#endif /* EXCEL_EXPORT_H */
`
  },
  {
    filename: "excel_export.c",
    language: "c",
    description: "Implementasi Generator File CSV dan Excel XML Spreadsheet dengan Formula Deviasi",
    code: `/**
 * ============================================================================
 * PROJEK : OTOMASI PENGUJIAN ATG HORIZONTAL
 * MODUL  : excel_export.c (Excel CSV & XML Exporter Implementation)
 * ============================================================================
 */

#include "excel_export.h"
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

/**
 * Mengekspor data tabel pengujian ke file CSV yang dapat dibuka langsung di Microsoft Excel
 */
BOOL ExcelExport_SaveToCsv(const char* filePath, const AtgTestPointRow* rows, int totalRows)
{
    FILE* fp = fopen(filePath, "w");
    if (!fp) {
        printf("[EXPORT] Gagal membuka file untuk penulisan: %s\\n", filePath);
        return FALSE;
    }

    time_t now = time(NULL);
    struct tm* t = localtime(&now);
    char szDate[64];
    strftime(szDate, sizeof(szDate), "%Y-%m-%d %H:%M:%S", t);

    /* Header Dokumen Metrologi */
    fprintf(fp, "LAPORAN HASIL PENGUJIAN OTOMASI ATG HORIZONTAL\\n");
    fprintf(fp, "Tanggal Ekspor,%s\\n", szDate);
    fprintf(fp, "Rentang Ukur,1 meter s.d 17 meter\\n");
    fprintf(fp, "Standar Uji,Pita Ukur / Laser Tracker Metrologi\\n\\n");

    /* Header Kolom Tabel */
    fprintf(fp, "No,Titik Uji (m),Status Uji,ALG Naik (mm),ALG Turun (mm),ALG Disk. Sebelum (mm),ALG Disk. Setelah (mm),Std Naik (mm),Std Turun (mm),Deviasi Naik (mm),Deviasi Turun (mm),Status BKD\\n");

    /* Iterasi Seluruh Baris 1 s.d 17 */
    for (int i = 0; i < totalRows; i++) {
        double dAlgNaik = atof(rows[i].szAlgNaik);
        double dAlgTurun = atof(rows[i].szAlgTurun);
        double dStdNaik = atof(rows[i].szStdNaik);
        double dStdTurun = atof(rows[i].szStdTurun);

        double devNaik = dAlgNaik - dStdNaik;
        double devTurun = dAlgTurun - dStdTurun;
        
        const char* statusBkd = (abs((int)(devNaik * 100)) <= 100 && abs((int)(devTurun * 100)) <= 100) ? "LULUS" : "PERIKSA";

        fprintf(fp, "%d,%d,%s,%s,%s,%s,%s,%s,%s,%.3f,%.3f,%s\\n",
            i + 1,
            rows[i].nMeter,
            rows[i].bTitikUjiChecked ? "Diuja" : "Dilewati",
            rows[i].szAlgNaik,
            rows[i].szAlgTurun,
            rows[i].szAlgDiskSebelum,
            rows[i].szAlgDiskSetelah,
            rows[i].szStdNaik,
            rows[i].szStdTurun,
            devNaik,
            devTurun,
            statusBkd
        );
    }

    /* Footer Ringkasan */
    fprintf(fp, "\\nCatatan:,Posisi 5m = Titik Zero Acuan | Posisi 17m = Titik Home Acuan\\n");
    fprintf(fp, "Operator Penguji,____________________\\n");
    fprintf(fp, "Penyelia Teknis,____________________\\n");

    fclose(fp);
    printf("[EXPORT] File CSV berhasil disimpan di %s\\n", filePath);
    return TRUE;
}

/**
 * Ekspor ke Excel XML (SpreadsheetML) untuk styling tabel profesional
 */
BOOL ExcelExport_SaveToXmlSpreadsheet(const char* filePath, const AtgTestPointRow* rows, int totalRows)
{
    FILE* fp = fopen(filePath, "w");
    if (!fp) return FALSE;

    fprintf(fp, "<?xml version=\\"1.0\\"?>\\n");
    fprintf(fp, "<?mso-application progid=\\"Excel.Sheet\\"?>\\n");
    fprintf(fp, "<Workbook xmlns=\\"urn:schemas-microsoft-com:office:spreadsheet\\"\\n");
    fprintf(fp, " xmlns:ss=\\"urn:schemas-microsoft-com:office:spreadsheet\\">\\n");
    fprintf(fp, " <Worksheet ss:Name=\\"Hasil Pengujian ATG\\">\\n");
    fprintf(fp, "  <Table>\\n");
    
    /* Header Baris */
    fprintf(fp, "   <Row><Cell><Data ss:Type=\\"String\\">OTOMASI PENGUJIAN ATG HORIZONTAL (1-17m)</Data></Cell></Row>\\n");
    
    for (int i = 0; i < totalRows; i++) {
        fprintf(fp, "   <Row>\\n");
        fprintf(fp, "    <Cell><Data ss:Type=\\"Number\\">%d</Data></Cell>\\n", rows[i].nMeter);
        fprintf(fp, "    <Cell><Data ss:Type=\\"String\\">%s</Data></Cell>\\n", rows[i].szAlgNaik);
        fprintf(fp, "    <Cell><Data ss:Type=\\"String\\">%s</Data></Cell>\\n", rows[i].szStdNaik);
        fprintf(fp, "   </Row>\\n");
    }

    fprintf(fp, "  </Table>\\n");
    fprintf(fp, " </Worksheet>\\n");
    fprintf(fp, "</Workbook>\\n");

    fclose(fp);
    return TRUE;
}
`
  },
  {
    filename: "build.bat",
    language: "batch",
    description: "Script Batch Kompilasi Cepat Menggunakan GCC / MinGW di Windows",
    code: `@echo off
echo ============================================================================
echo  MEMULAI KOMPILASI OTOMASI PENGUJIAN ATG HORIZONTAL (Win32 C)
echo ============================================================================

where gcc >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] GCC/MinGW tidak ditemukan di PATH sistem.
    echo Silakan install MinGW-w64 atau jalankan via MSYS2 / Developer Command Prompt.
    pause
    exit /b 1
)

echo Mengompilasi source code C...
gcc -Wall -Wextra -O2 main.c tcp_client.c motor_controller.c excel_export.c -o OtomasiATG.exe -lcomctl32 -lws2_32 -lgdi32 -mwindows

if %ERRORLEVEL% EQU 0 (
    echo [SUKSES] File executable 'OtomasiATG.exe' berhasil dibuat!
    echo Menjalankan aplikasi...
    start OtomasiATG.exe
) else (
    echo [GAGAL] Terjadi kesalahan saat proses kompilasi.
)

pause
`
  },
  {
    filename: "Makefile",
    language: "makefile",
    description: "Makefile untuk build automasi dengan MinGW32 / MinGW-w64",
    code: `# Makefile untuk Otomasi Pengujian ATG Horizontal
CC = gcc
CFLAGS = -Wall -Wextra -O2 -I.
LDFLAGS = -lcomctl32 -lws2_32 -lgdi32 -mwindows

SRCS = main.c tcp_client.c motor_controller.c excel_export.c
OBJS = $(SRCS:.c=.o)
TARGET = OtomasiATG.exe

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(OBJS) -o $(TARGET) $(LDFLAGS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET) Hasil_Uji_ATG_Horizontal.csv

run: $(TARGET)
	./$(TARGET)
`
  },
  {
    filename: "build_msvc.bat",
    language: "batch",
    description: "Script Kompilasi menggunakan Microsoft Visual C++ (MSVC / cl.exe)",
    code: `@echo off
echo ============================================================================
echo  KOMPILASI DENGAN MICROSOFT VISUAL C++ (MSVC)
echo ============================================================================
cl.exe /O2 /Fe:Otomasi_ATG_Horizontal.exe main.c tcp_client.c motor_controller.c excel_export.c ws2_32.lib comctl32.lib gdi32.lib user32.lib /link /SUBSYSTEM:WINDOWS
if %ERRORLEVEL% EQU 0 (
    echo [SUKSES] Otomasi_ATG_Horizontal.exe berhasil dibuat.
    start Otomasi_ATG_Horizontal.exe
) else (
    echo [GAGAL] Kompilasi MSVC gagal. Buka via Developer Command Prompt for VS.
)
pause
`
  },
  {
    filename: "CMakeLists.txt",
    language: "cmake",
    description: "CMake Configuration untuk kompilasi multi-platform / CLion / VSCode",
    code: `cmake_minimum_required(VERSION 3.15)
project(OtomasiAtgHorizontal C)

set(CMAKE_C_STANDARD 99)

set(SOURCES
    main.c
    tcp_client.c
    motor_controller.c
    excel_export.c
)

add_executable(OtomasiATG WIN32 \${SOURCES})

target_link_libraries(OtomasiATG
    ws2_32
    comctl32
    gdi32
    user32
)
`
  },
  {
    filename: "app.manifest",
    language: "xml",
    description: "Windows Application Manifest untuk Per-Monitor DPI Awareness & Common Controls v6",
    code: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <assemblyIdentity version="3.2.0.0" processorArchitecture="*" name="OtomasiAtgHorizontal" type="win32"/>
  <description>Otomasi Pengujian ATG Horizontal Desktop Application</description>
  <dependency>
    <dependentAssembly>
      <assemblyIdentity type="win32" name="Microsoft.Windows.Common-Controls" version="6.0.0.0" processorArchitecture="*" publicKeyToken="6595b64144ccf1df" language="*"/>
    </dependentAssembly>
  </dependency>
  <application xmlns="urn:schemas-microsoft-com:asm.v3">
    <windowsSettings>
      <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true/pm</dpiAware>
      <dpiAwareness xmlns="http://schemas.microsoft.com/SMI/2016/WindowsSettings">PerMonitorV2</dpiAwareness>
    </windowsSettings>
  </application>
</assembly>
`
  },
  {
    filename: "README.md",
    language: "markdown",
    description: "Dokumentasi Lengkap, Spesifikasi Protokol TCP/IP, dan Panduan Kompilasi",
    code: `# OTOMASI PENGUJIAN ATG HORIZONTAL (Win32 C Desktop App)

Aplikasi Desktop Windows berbasis bahasa C murni (Pure Win32 API + Winsock2) untuk mengontrol pergerakan motor stepper dan melakukan kalibrasi/evaluasi alat ukur panjang Automatic Tank Gauge (ATG) pada lintasan horizontal 1 s.d. 17 meter.

---

## 1. Fitur Utama
1. **Konektivitas Soket TCP/IP**:
   - Komunikasi asynchronous dengan modul controller motor stepper.
   - Perintah pengiriman: Move to Zero (5m), Move to Home (17m), Uji Naik, Uji Turun, Emergency Stop.
   - Background thread listener untuk pembacaan status posisi realtime.
2. **Tema Gelap (Dark Mode Win32)**:
   - Palette warna industri modern (\`#121212\` background, \`#1e1e1e\` panel cards, aksen biru/hijau/oranye).
   - Penanganan pesan \`WM_CTLCOLORSTATIC\`, \`WM_CTLCOLOREDIT\`, dan \`WM_CTLCOLORBTN\`.
3. **4 Menu Pengujian Kiri**:
   - **KALIBRASI** (\`IDC_BTN_KALIBRASI\`)
   - **TERA ULANG** (\`IDC_BTN_TERA_ULANG\`)
   - **EVALUASI TIPE AKURASI** (\`IDC_BTN_EVAL_AKURASI\`)
   - **EVALUASI TIPE DISKRIMINASI** (\`IDC_BTN_EVAL_DISKRIMINASI\`)
4. **Tabel Checklist Meter 1 s.d 17**:
   - 17 Baris dengan Checkbox Titik Uji.
   - Field 'Pembacaan ALG' (Naik, Turun, Diskriminasi Sebelum, Diskriminasi Setelah).
   - Field 'Pembacaan Standar' (Naik, Turun) beserta Checkbox/Radio Status.
   - Mode Lock / Edit dengan tombol \`EDIT ALG\` dan \`EDIT STD\`.
5. **Toolbar Bawah**:
   - \`PENGATURAN\` (ikon gerigi) untuk konfigurasi Excel & TCP.
   - \`PREVIEW\` (ikon dokumen) untuk preview laporan.
   - \`ZERO\` untuk bergerak ke area 5 meter.
   - \`HOME\` untuk bergerak ke area 17 meter.
   - \`PENGUJIAN NAIK\` & \`PENGUJIAN TURUN\`.
   - Label \`Kalibrasi Terakhir: [Timestamp]\`.
   - \`CLOSE\` untuk keluar aman.
6. **Ekspor Data Excel**:
   - Menghasilkan file \`.csv\` dan Spreadsheet XML yang kompatibel dengan Microsoft Excel.

---

## 2. Cara Kompilasi ke Desktop .EXE di Windows

### Opsi A: Menggunakan GCC / MinGW (Paling Mudah)
\`\`\`bash
# Cukup jalankan build.bat atau:
gcc -Wall -Wextra -O2 main.c tcp_client.c motor_controller.c excel_export.c -o Otomasi_ATG_Horizontal.exe -lcomctl32 -lws2_32 -lgdi32 -user32 -mwindows
\`\`\`

### Opsi B: Menggunakan MSVC (Microsoft Visual Studio)
\`\`\`cmd
# Jalankan di Developer Command Prompt:
build_msvc.bat
\`\`\`

### Opsi C: Menggunakan CMake
\`\`\`bash
mkdir build && cd build
cmake ..
cmake --build . --config Release
\`\`\`

---

## 3. Format Protokol Perintah TCP/IP
| Perintah ASCII | Fungsi |
| :--- | :--- |
| \`CMD:GOTO_ZERO_5M\\r\\n\` | Memindahkan motor ke titik acuan 5.000 meter |
| \`CMD:GOTO_HOME_17M\\r\\n\` | Memindahkan motor ke titik acuan 17.000 meter (Home) |
| \`CMD:MOVE_POS:<meter>\\r\\n\` | Menggerakkan motor ke posisi spesifik (contoh \`CMD:MOVE_POS:8.000\`) |
| \`CMD:SEQ_START_UP:1TO17\\r\\n\` | Memulai sekuens pengujian naik dari 1m ke 17m |
| \`CMD:SEQ_START_DOWN:17TO1\\r\\n\` | Memulai sekuens pengujian turun dari 17m ke 1m |
| \`CMD:EMERGENCY_STOP\\r\\n\` | Menghentikan pergerakan motor seketika |
`
  }
];
