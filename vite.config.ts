import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

// Clean SPA build — no SSR, no Nitro, no Cloudflare, no TanStack Start.
// The Express + SQLite backend lives in server/ and runs as a separate process
// (managed by Electron in production, or via `npm run server` in development).
export default defineConfig({
  // base "./" is required so asset paths resolve correctly when loaded via
  // file:// in the packaged Electron app.
  base: "./",

  plugins: [
    TanStackRouterVite({
      // Point to src/routes so the plugin can auto-generate routeTree.gen.ts
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Vite SPA output lands in dist/
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },

  server: {
    port: 8080,
    host: "127.0.0.1",
    strictPort: true,
  },
});
