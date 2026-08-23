import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, frontendRoot, "");

  return {
    base: process.env.VITE_BASE ?? env.VITE_BASE ?? "/",
    plugins: [react()],
    resolve: {
      alias: {
        "@shared": path.resolve(frontendRoot, "../shared"),
      },
    },
    server: {
      fs: { allow: [path.resolve(frontendRoot, "..")] },
    },
  };
});
