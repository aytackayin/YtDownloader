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

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.

---
Developed by **AytaçKAYIN**
