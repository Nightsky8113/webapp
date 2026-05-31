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
        open: true,
        // 開発環境でのCSPを設定（ViteのHMR用にunsafe-evalを許可）
        headers: {
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https: ws: wss:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self';"
        }
    },
    build: {
        outDir: 'dist',
        sourcemap: false // 本番環境ではソースマップを無効化（CSPエラーを回避）
    }
});