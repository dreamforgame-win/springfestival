
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 这里的 base 设为 './' 确保资源路径是相对的，适配 GitHub Pages 非根目录部署
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
