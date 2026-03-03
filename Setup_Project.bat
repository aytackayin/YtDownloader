@echo off
echo ==================================================
echo YtDownloader - Project Environment Setup
echo ==================================================

echo [*] Installing Node.js dependencies...
npm install

echo [*] Installing Python dependencies (Sidecar)...
pip install -r src-tauri/python/requirements.txt
pip install pyinstaller

echo [*] Ensuring yt-dlp is up to date...
pip install -U yt-dlp

echo [*] Checking Rust environment...
rustc --version
if %errorlevel% neq 0 (
    echo [!] Rust is not installed. Please install it from https://rustup.rs/
) else (
    echo [*] Rust is already installed.
)

echo ==================================================
echo [OK] Project dependencies have been handled!
echo Next: Run Build_App.bat to generate distribution files.
echo ==================================================
pause
