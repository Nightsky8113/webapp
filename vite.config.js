import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

import UnoCSS from 'unocss/vite';

export default defineConfig({
    plugins: [
        react(), 
        UnoCSS()
    ],
    server: {
        port: 3000,
        open: true
    },
    build: {
        outDir: 'dist',
        sourcemap: false // 本番環境ではソースマップを無効化（CSPエラーを回避）
    }
});