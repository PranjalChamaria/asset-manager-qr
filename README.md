# Asset Command


## 🚀 Overview

**Asset Command** is a self-contained, enterprise-grade desktop application designed for secure, offline asset management. Built for environments with strict data privacy requirements or unreliable internet access, all data remains strictly local to your machine. 

It features a modern, responsive UI built with React and Tailwind CSS, powered by an embedded local SQLite database and served via an Electron shell.

## ✨ Features

- **🔒 100% Offline & Private:** Zero cloud telemetry, zero remote database calls. Your data lives on your hard drive in a local SQLite database (`assets.db`).
- **⚡ Blazing Fast:** With an embedded `better-sqlite3` database running in the same process as the app, queries resolve in microseconds. 
- **🖥️ Desktop Native:** Bundled as a standalone Windows executable (`.exe`). No server setup, no dependencies to install. Just double click and run.
- **🎨 Modern UI:** Sleek, responsive interface built with React, Vite, Tailwind CSS, and shadcn/ui.
- **📊 Comprehensive Asset Tracking:** Track asset codes, models, purchase dates, warranty info, vendor details, and physical locations.
- **🔄 Auto-Sequencing:** Automatically generates sequential, unique asset codes (e.g. `AST-0001`).

## 🏗️ Architecture

Asset Command represents a complex migration from a cloud-first SSR framework to a robust local desktop architecture.

* **Frontend:** React 18, Vite, TanStack Router, Tailwind CSS, shadcn/ui
* **Backend:** Express.js running directly inside the Electron Main Process
* **Database:** SQLite3 (`better-sqlite3`) embedded locally
* **Packaging:** Electron Builder (compiling NSIS Windows Installers)

### Why this architecture?
By migrating away from a cloud-bound framework (like Next.js or Nitro) to an **Electron + Express + SQLite** stack, the application achieves true offline autonomy. 
1. **No ASAR Path Issues:** The Express server is booted via dynamic `import()` within the Electron main process, completely bypassing filesystem extraction bugs common in packaged Electron apps.
2. **Native SQLite Performance:** Native Node.js addons (`better-sqlite3`) are explicitly rebuilt (`electron-rebuild`) for the precise Electron ABI version, ensuring rock-solid stability and zero crashes on Windows.

## 🛠️ Development Setup

If you want to contribute or build the application from source, you'll need Node.js (v18 or higher) installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
Start both the Vite frontend server and the Express backend server concurrently within an Electron wrapper:
```bash
npm run dev:electron
```

### 3. Build for Production (Windows Installer)
To compile a standalone `.exe` installer for distribution:
```bash
npm run build:electron
```
*This command automatically compiles the frontend, builds the backend, aligns the native SQLite binaries with Electron's ABI, and packages the final `.exe` installer into the `release/` directory.*

## 📂 Data Storage

Your database is stored in the standard Windows AppData directory, ensuring it persists across application updates:
* `C:\Users\<YourUsername>\AppData\Roaming\asset-command\data\assets.db`

> **Note:** To back up your data, simply copy the `assets.db` file to a secure location.

## 📄 License

This project is licensed under the MIT License.
