const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { app, BrowserWindow, shell, ipcMain } = require('electron');

const APP_NAME = 'Asset Manager';
const FRONTEND_HOST = '127.0.0.1';
const FRONTEND_PORT = 8080;
const FRONTEND_URL = process.env.VITE_DEV_SERVER_URL || `http://${FRONTEND_HOST}:${FRONTEND_PORT}`;

let mainWindow;
let backendProcess;
let frontendProcess;

function getAppDataDir() {
  return app.getPath('userData');
}

function getDatabaseDir() {
  return path.join(getAppDataDir(), 'data');
}

function startBackend() {
  if (backendProcess) {
    return;
  }

  const appRoot = path.resolve(__dirname, '..');
  const scriptPath = path.join(appRoot, 'server', 'dist', 'index.js');
  const nodeExecutable = process.execPath;

  console.log('[backend] Starting backend process');
  console.log('[backend] Node executable:', nodeExecutable);
  console.log('[backend] Backend script:', scriptPath);
  console.log('[backend] Working directory:', appRoot);

  backendProcess = spawn(nodeExecutable, [scriptPath], {
    cwd: appRoot,
    env: {
      ...process.env,
      ASSET_MANAGER_DATA_DIR: getDatabaseDir(),
      PORT: process.env.PORT || '4000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  backendProcess.stdout.on('data', (data) => {
    process.stdout.write(`[backend] ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    process.stderr.write(`[backend] ${data}`);
  });

  backendProcess.on('error', (error) => {
    console.error('[backend] spawn error:', error);
  });

  backendProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[backend] exited with code ${code}`);
    }
    backendProcess = null;
  });
}

function stopBackend() {
  if (!backendProcess) {
    return;
  }

  backendProcess.kill('SIGTERM');
  backendProcess = null;
}

function stopFrontend() {
  if (!frontendProcess) {
    return;
  }

  frontendProcess.kill('SIGTERM');
  frontendProcess = null;
}

function startFrontend() {
  if (frontendProcess) {
    return;
  }

  const appRoot = path.resolve(__dirname, '..');
  const nodeExecutable = process.execPath;
  const isDev = !app.isPackaged;

  if (isDev) {
    // Development startup: Electron starts the Vite dev server automatically.
    const viteEntry = path.join(appRoot, 'node_modules', 'vite', 'bin', 'vite.js');
    console.log('[frontend] Development mode: starting Vite dev server');
    console.log('[frontend] Vite entry:', viteEntry);
    console.log('[frontend] Frontend URL:', FRONTEND_URL);

    frontendProcess = spawn(nodeExecutable, [viteEntry, 'dev', '--host', FRONTEND_HOST, '--port', String(FRONTEND_PORT), '--strictPort'], {
      cwd: appRoot,
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } else {
    // Production startup: Electron loads the built frontend from the packaged app without needing Vite.
    const builtFrontendEntry = path.join(appRoot, '.output', 'server', 'index.mjs');
    console.log('[frontend] Production mode: starting built frontend server');
    console.log('[frontend] Built frontend entry:', builtFrontendEntry);
    console.log('[frontend] Frontend URL:', FRONTEND_URL);

    if (!fs.existsSync(builtFrontendEntry)) {
      console.error('[frontend] Built frontend entry not found:', builtFrontendEntry);
      return;
    }

    frontendProcess = spawn(nodeExecutable, [builtFrontendEntry], {
      cwd: appRoot,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        HOST: FRONTEND_HOST,
        PORT: String(FRONTEND_PORT),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  frontendProcess.stdout.on('data', (data) => {
    process.stdout.write(`[frontend] ${data}`);
  });

  frontendProcess.stderr.on('data', (data) => {
    process.stderr.write(`[frontend] ${data}`);
  });

  frontendProcess.on('error', (error) => {
    console.error('[frontend] spawn error:', error);
  });

  frontendProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[frontend] exited with code ${code}`);
    }
    frontendProcess = null;
  });
}

function createWindow() {
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

  startFrontend();
  setTimeout(() => {
    if (!mainWindow?.isDestroyed()) {
      mainWindow.loadURL(FRONTEND_URL);
    }
  }, 1000);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-data-path', () => app.getPath('userData'));

app.on('ready', () => {
  app.setName(APP_NAME);
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  stopFrontend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
  stopFrontend();
});

process.on('SIGINT', () => {
  stopBackend();
  stopFrontend();
  app.quit();
});

process.on('SIGTERM', () => {
  stopBackend();
  stopFrontend();
  app.quit();
});
