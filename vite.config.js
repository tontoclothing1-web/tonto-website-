import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // src/lib/api.js defaults to same-origin '/api'. Proxy it to the local backend
  // so the storefront works with VITE_API_URL unset; leave it alone when the dev
  // explicitly points at another host.
  const apiTarget = env.VITE_API_URL || 'http://localhost:5001/api';
  const proxyEnabled = !env.VITE_API_URL || /localhost|127\.0\.0\.1/.test(env.VITE_API_URL);

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      port: 3000,
      open: false,
      watch: {
        ignored: ['**/public/assets/videos/**', '**/*.mp4', '**/*.zip', '**/.git/**']
      },
      proxy: proxyEnabled
        ? { '/api': { target: apiTarget.replace(/\/api.*$/, ''), changeOrigin: true } }
        : undefined
    },
    build: {
      target: 'es2022',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
          }
        }
      }
    }
  };
});
