import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: ".",
  build: {
    outDir: "./dist",
    emptyOutDir: true,
  },
  plugins: [react()],
  server: {
    proxy: {
      "^/api/.*": {
        target: process.env.CLOUDFLARE_ENDPOINT ?? "http://127.0.0.1:8787",
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
