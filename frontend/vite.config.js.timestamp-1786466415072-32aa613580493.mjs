// vite.config.js
import { defineConfig } from "file:///vercel/share/v0-project/node_modules/vite/dist/node/index.js";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import react from "file:///vercel/share/v0-project/node_modules/@vitejs/plugin-react/dist/index.js";
var backendPortFile = resolve(process.cwd(), "../backend/.sais-port");
function resolveBackendTarget() {
  try {
    const port = Number(readFileSync(backendPortFile, "utf8").trim());
    return `http://localhost:${port}`;
  } catch {
    return process.env.VITE_BACKEND_URL || "http://localhost:3000";
  }
}
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 5174,
    strictPort: false,
    // Proxy /api calls to the backend during development so CORS is avoided locally.
    proxy: {
      "/api": {
        target: resolveBackendTarget(),
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: true
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvdmVyY2VsL3NoYXJlL3YwLXByb2plY3QvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi92ZXJjZWwvc2hhcmUvdjAtcHJvamVjdC9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vdmVyY2VsL3NoYXJlL3YwLXByb2plY3QvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjsvKiBnbG9iYWwgcHJvY2VzcyAqL1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcblxuY29uc3QgYmFja2VuZFBvcnRGaWxlID0gcmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnLi4vYmFja2VuZC8uc2Fpcy1wb3J0Jyk7XG5cbmZ1bmN0aW9uIHJlc29sdmVCYWNrZW5kVGFyZ2V0KCkge1xuICB0cnkge1xuICAgIGNvbnN0IHBvcnQgPSBOdW1iZXIocmVhZEZpbGVTeW5jKGJhY2tlbmRQb3J0RmlsZSwgJ3V0ZjgnKS50cmltKCkpO1xuICAgIHJldHVybiBgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9YDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHByb2Nlc3MuZW52LlZJVEVfQkFDS0VORF9VUkwgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCc7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiAnMC4wLjAuMCcsXG4gICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxuICAgIHBvcnQ6IDUxNzQsXG4gICAgc3RyaWN0UG9ydDogZmFsc2UsXG4gICAgLy8gUHJveHkgL2FwaSBjYWxscyB0byB0aGUgYmFja2VuZCBkdXJpbmcgZGV2ZWxvcG1lbnQgc28gQ09SUyBpcyBhdm9pZGVkIGxvY2FsbHkuXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6IHJlc29sdmVCYWNrZW5kVGFyZ2V0KCksXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICBzZXR1cEZpbGVzOiAnLi9zcmMvdGVzdC9zZXR1cC5qcycsXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGVBQWU7QUFDeEIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBRWxCLElBQU0sa0JBQWtCLFFBQVEsUUFBUSxJQUFJLEdBQUcsdUJBQXVCO0FBRXRFLFNBQVMsdUJBQXVCO0FBQzlCLE1BQUk7QUFDRixVQUFNLE9BQU8sT0FBTyxhQUFhLGlCQUFpQixNQUFNLEVBQUUsS0FBSyxDQUFDO0FBQ2hFLFdBQU8sb0JBQW9CLElBQUk7QUFBQSxFQUNqQyxRQUFRO0FBQ04sV0FBTyxRQUFRLElBQUksb0JBQW9CO0FBQUEsRUFDekM7QUFDRjtBQUVBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsSUFDZCxNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUE7QUFBQSxJQUVaLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVEscUJBQXFCO0FBQUEsUUFDN0IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxFQUNiO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixhQUFhO0FBQUEsSUFDYixZQUFZO0FBQUEsRUFDZDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
