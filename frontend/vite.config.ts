import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(frontendRoot, "../shared"),
    },
  },
  server: {
    fs: { allow: [path.resolve(frontendRoot, "..")] },
  },
});
