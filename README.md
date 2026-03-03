# YtDownloader

A modern, fast, and user-friendly YouTube video downloader application built with **Tauri**, **React**, and **Python**.

![Initial Release](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Key Features

- **Multi-Platform Support**: Download videos, Shorts, and entire Playlists from **YouTube** and **Instagram**.
- **Queue Management**: Add multiple videos to your list and manage them dynamically.
- **Smart Organization**: Automatically organizes downloaded videos into subfolders based on the uploader's name.
- **Format & Resolution Selection**: Choose the best quality for your needs, from 144p to 4K and beyond.
- **Modern UI**: A sleek, responsive interface with custom tooltips designed for the best user experience.
- **Multi-Language Support**: Fully translated into **English** and **Turkish**.
- **Cross-Platform**: Built on Tauri for high performance and native feeling.

## 🛠️ Technology Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend/Desktop**: Tauri (Rust-based bridge)
- **Logic**: Python (integrated via sidecar for powerful media handling)

## 📦 Installation & Setup

### 🔽 Download & Run
For a quick start without any setup:
1. Download the latest installer from the [Releases](https://github.com/aytackayin/YtDownloader/releases) page.
2. Run the installer and follow the on-screen instructions.
3. Launch **YtDownloader** and start downloading!

### 🛠️ Development & Building from Source
If you want to contribute or build the app yourself:

**Prerequisites:**
- [Node.js](https://nodejs.org/)
- [Rust](https://www.rust-lang.org/)
- [Python 3.10+](https://www.python.org/downloads/)

**Setup Steps:**
1. **Clone the repository:**
   ```bash
   git clone https://github.com/aytackayin/YtDownloader.git
   cd YtDownloader
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Python Setup (Sidecar logic):**
   ```bash
   pip install -r src-tauri/python/requirements.txt
   ```
4. **Run in Development Mode:**
   ```bash
   npm run tauri dev
   ```
5. **Build for Production:**
   ```bash
   npm run tauri build
   ```

## 📸 Screenshots

![Preview](PREVIEW.png)

### 🔐 SHA256 Checksum
You can verify the integrity of the downloaded files using the following SHA256 hashes:

| File | SHA256 Checksum |
| :--- | :--- |
| **ytdownloader.exe** | `213b0eabc4efa6a248083a5cb9a7f16391714b26c48ba276e7838bd58e5f9fa5` |
| **YtDownloader_1.0.0_x64-setup.exe** | `bd0c5777e124aa17a70448495d237f761883b21b387a2be66e6a26a461b1dd6c` |
| **YtDownloader_1.0.0_x64_en-US.msi** | `1329eab320be38043f053e33b6c46ea6044d9eeea720d5df89417ae2816393d7` |

## 🔒 Security Transparency (VirusTotal Scan)

To ensure transparency and user trust, all distributed binaries are publicly scanned using VirusTotal.

Users can independently verify each release file using the links and SHA-256 hashes below.

---

### 📦 Release Files Scan Results

#### 🖥️ Portable Version

**File:** `ytdownloader.exe`  
**VirusTotal Report:**  
https://www.virustotal.com/gui/file/213b0eabc4efa6a248083a5cb9a7f16391714b26c48ba276e7838bd58e5f9fa5?nocache=1  

**SHA-256:** 213b0eabc4efa6a248083a5cb9a7f16391714b26c48ba276e7838bd58e5f9fa5

---

#### 📦 MSI Installer

**File:** `YtDownloader_1.0.0_x64_en-US.msi`  
**VirusTotal Report:**  
https://www.virustotal.com/gui/file/1329eab320be38043f053e33b6c46ea6044d9eeea720d5df89417ae2816393d7?nocache=1  

**SHA-256:** 1329eab320be38043f053e33b6c46ea6044d9eeea720d5df89417ae2816393d7

---

#### ⚙️ Setup Installer (EXE)

**File:** `YtDownloader_1.0.0_x64-setup.exe`  
**VirusTotal Report:**  
https://www.virustotal.com/gui/file/bd0c5777e124aa17a70448495d237f761883b21b387a2be66e6a26a461b1dd6c?nocache=1  

**SHA-256:** bd0c5777e124aa17a70448495d237f761883b21b387a2be66e6a26a461b1dd6c

---

### 🛡️ Verification Notice

All binaries are built directly from the public source code available in this repository.

If any antivirus software reports warnings, users are encouraged to:

- Verify the file hashes listed above  
- Review the VirusTotal multi-engine scan results  
- Build the project from source for full verification  

Security and transparency are priorities of this project.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.

---
Developed by **AytaçKAYIN**
