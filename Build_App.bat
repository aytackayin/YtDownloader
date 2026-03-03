@echo off
echo ==================================================
echo YtDownloader - Build Distribution
echo ==================================================

echo [*] Building Python Sidecar (Frozen EXE)...
pyinstaller --onefile --windowed --name python-sidecar-x86_64-pc-windows-msvc --distpath src-tauri/binaries --workpath src-tauri/python/build --specpath src-tauri/python src-tauri/python/main.py

if %errorlevel% neq 0 (
    echo [!] Python Sidecar build failed.
    echo [*] Ensure you have installed dependencies with Setup_Project.bat first.
    pause
    exit /b %errorlevel%
)

echo [*] Building Tauri Application (Production)...
npm run tauri build

if %errorlevel% neq 0 (
    echo [!] Tauri build failed.
    pause
    exit /b %errorlevel%
)

echo [*] Preparing distribution files in 'YtDownloader Render' directory...
if not exist "C:\Users\Itouch\Desktop\YtDownloader Render" mkdir "C:\Users\Itouch\Desktop\YtDownloader Render"

copy "src-tauri\target\release\bundle\nsis\YtDownloader_1.0.0_x64-setup.exe" "C:\Users\Itouch\Desktop\YtDownloader Render\YtDownloader_Setup.exe" /Y
copy "src-tauri\target\release\bundle\msi\YtDownloader_1.0.0_x64_en-US.msi" "C:\Users\Itouch\Desktop\YtDownloader Render\YtDownloader_Installer.msi" /Y

echo ==================================================
echo [OK] Done! Check the 'Render' folder for your setup files.
echo ==================================================
pause
