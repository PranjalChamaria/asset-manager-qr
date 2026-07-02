const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { app, BrowserWindow, shell, ipcMain } = require('electron');

const APP_NAME = 'Asset Command';
const BACKEND_PORT = 4000;
const DEV_FRONTEND_URL = 'http://127.0.0.1:8080';

let mainWindow;

// ─── Paths ────────────────────────────────────────────────────────────────────

function getAppDataDir() {
  return app.getPath('userData');
}

function getDatabaseDir() {
  return path.join(getAppDataDir(), 'data');
}

/**
 * In packaged apps the app root is the directory containing the ASAR archive.
 * In development __dirname is .../electron/ so we go up one level.
 */
function getAppRoot() {
  return path.resolve(__dirname, '..');
}

// ─── Backend (Express + SQLite) ───────────────────────────────────────────────

function startBackend() {
  const appRoot = getAppRoot();

  // In packaged builds electron-builder copies server/dist into resources.
  // In development we run server/dist directly from the project root.
  const serverScript = path.join(appRoot, 'server', 'dist', 'index.js');

  if (!fs.existsSync(serverScript)) {
    console.error('[backend] Server script not found:', serverScript);
    console.error('[backend] Run: npm run build:server');
    return;
  }

  console.log('[backend] Starting in main process:', serverScript);

  process.env.NODE_ENV = app.isPackaged ? 'production' : 'development';
  process.env.PORT = String(BACKEND_PORT);
  process.env.ASSET_MANAGER_DATA_DIR = getDatabaseDir();
  
  // Let the migration runner find SQL files from extraResources in packaged builds
  process.env.ASSET_MANAGER_RESOURCES_DIR = app.isPackaged
    ? path.join(process.resourcesPath, 'server-resources')
    : path.join(appRoot, 'server');

  // Server is ESM, so we use dynamic import() to load it from this CJS file
  import('file://' + serverScript.replace(/\\/g, '/')).catch(err => {
    console.error('[backend] Failed to load server:', err);
  });
}

function stopBackend() {
  // The backend runs in the main process, so it will exit when the app quits.
}

// ─── Wait for backend to be ready ────────────────────────────────────────────

/**
 * Poll an HTTP URL until it responds (or timeout).
 */
function waitForHttp(url, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function attempt() {
      const req = http.get(url, (res) => {
        resolve();
        res.resume();
      });
      req.on('error', () => retry());
      req.setTimeout(500, () => { req.destroy(); retry(); });
    }

    function retry() {
      if (Date.now() - start >= timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(attempt, 300);
    }

    attempt();
  });
}

// ─── Window ───────────────────────────────────────────────────────────────────

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 760,
    show: false,
    title: APP_NAME,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (app.isPackaged) {
    // Production: wait for Express backend, then load static SPA.
    try {
      await waitForHttp(`http://127.0.0.1:${BACKEND_PORT}/api/health`);
      console.log('[electron] Backend is ready');
    } catch (err) {
      console.error('[electron] Backend readiness timeout:', err.message);
    }
    const indexPath = path.join(getAppRoot(), 'dist', 'index.html');
    console.log('[electron] Loading (production):', indexPath);
    mainWindow.loadFile(indexPath);
  } else {
    // Development: wait for BOTH the Express backend (system Node) and the
    // Vite dev server before loading — either can start in any order.
    try {
      await Promise.all([
        waitForHttp(`http://127.0.0.1:${BACKEND_PORT}/api/health`),
        waitForHttp(DEV_FRONTEND_URL),
      ]);
      console.log('[electron] Backend + Vite dev server are ready');
    } catch (err) {
      console.error('[electron] Dev readiness timeout:', err.message);
    }
    console.log('[electron] Loading (development):', DEV_FRONTEND_URL);
    mainWindow.loadURL(DEV_FRONTEND_URL);
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ─── IPC ─────────────────────────────────────────────────────────────────────

ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-data-path', () => getAppDataDir());

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.on('ready', async () => {
  app.setName(APP_NAME);

  if (app.isPackaged) {
    // Production: Electron spawns the backend using its own embedded Node.
    // better-sqlite3 is rebuilt for Electron's ABI during `npm run build:electron`.
    startBackend();
  } else {
    // Development: backend is started separately with system Node via
    // `npm run dev:server` (or `npm run dev:electron` which includes it).
    // This avoids the Node ABI mismatch between system Node and Electron's Node.
    console.log('[electron] Dev mode: expecting backend already running on port', BACKEND_PORT);
  }

  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

process.on('SIGINT', () => {
  stopBackend();
  app.quit();
});

process.on('SIGTERM', () => {
  stopBackend();
  app.quit();
});
