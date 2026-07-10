import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
  },
  css: {
    postcss: "./postcss.config.js",
  },
  server: {
    port: 5173,
    host: true,
    open: false,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true,
      },
      "/uploads": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
});
