import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// Get all routes for pre-rendering
const routes = [
  "/",
  "/landing",
  "/signup",
  "/login",
  "/dashboard"
];

export default defineConfig(({ command }) => ({
  base: '/',
  server: {
    host: "::",
    port: Number(process.env.VITE_PORT) || 5173,
    ...(command === 'serve' && {
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {  
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
      }
    })
  },
  plugins: [
    react({
      // Enable SSG with React SWC
      plugins: []
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
}));
