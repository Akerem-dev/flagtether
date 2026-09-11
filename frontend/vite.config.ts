import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendTarget = "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "^/api/": {
        target: backendTarget,
        changeOrigin: true,
      },
      "^/swagger-ui": {
        target: backendTarget,
        changeOrigin: true,
      },
      "^/v3/api-docs": {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
});
