# Asset Command

A desktop app for managing physical assets across departments and branches. Runs completely offline. Data stays on your machine.

---

## What it does

- Add and manage assets with details like category, brand, serial number, vendor, department, branch, purchase info, and warranty dates
- Auto-generates a unique code for each asset on creation
- Generates a QR code and CODE128 barcode for every asset, printable as a 4×1.5 inch label
- Search across code, name, brand, serial number, vendor, department, and branch in real time
- Warranty countdown with colour warnings: amber at 30 days left, red when expired
- Soft delete with a recycle bin. Deleted assets can be restored or permanently removed
- Password prompt on edit, delete, and purge to prevent accidental changes

---

## Tech stack

| | |
|---|---|
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| Routing | TanStack Router |
| Data fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| QR codes | `qrcode` |
| Barcodes | `jsbarcode` (CODE128) |
| Build tool | Vite 8 |
| Language | TypeScript 5 |
| Backend | Express.js |
| Database | SQLite via `better-sqlite3` |
| Desktop | Electron v31 |
| Installer | Electron Builder (Windows NSIS) |

---

## Getting started (development)

You need Node.js 18+ installed.

```bash
npm install
npm run build:server   # compile the backend once
npm run dev:electron   # start everything
```

This opens the Electron window with the Vite dev server and Express backend running together.

---

## Building the installer

Close the app if it's open, then run:

```bash
npm run build:electron
```

The finished installer will be at `release/Asset Command-Setup-1.0.0.exe`. Installs on any Windows machine with no admin rights needed.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev:electron` | Run in development mode (full app) |
| `npm run build:electron` | Build the Windows installer |
| `npm run build:server` | Compile the backend TypeScript |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |

---

## Data storage

The database is a single SQLite file stored at:

```
C:\Users\<YourUsername>\AppData\Roaming\asset-command\data\assets.db
```

To back up your data, copy that file. To restore, replace it. The database sets itself up automatically on first launch.

---

## Admin password

Edit, delete, and purge operations require a password. The default is `admin123`. To change it, update the password check in `src/components/AssetsPage.tsx`.

---

## Printing labels

Click any asset row to open its label. Each label has a QR code, asset name, asset code, and a barcode. Hit **Print label** to print it (the page is sized to exactly 4×1.5 inches with no margin), or **Download label** to save it as a JPEG.

---

## License

MIT
