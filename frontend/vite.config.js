import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const target = env.VITE_PROXY_TARGET || (mode === 'production'
    ? 'https://agroscale-backend.onrender.com'
    : 'http://localhost:3002');

  console.log(`[Vite] Mode: '${mode}' | Proxying /api -> ${target}`);

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: target.startsWith('https')
        }
      }
    }
  };
});

