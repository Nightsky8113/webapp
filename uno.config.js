import { defineConfig, presetUno, presetIcons } from 'unocss';

export default defineConfig({
    presets: [
        presetUno(), // Tailwind互換のユーティリティ
        presetIcons({
            scale: 1.2,
            cdn: 'https://esm.sh/'
        })
    ],
    shortcuts: {
        // カスタムショートカット
        'btn-primary': 'bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors',
        'btn-secondary': 'bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors',
        'card': 'bg-white rounded-lg shadow-md overflow-hidden',
        'card-hover': 'card hover:shadow-lg transition-shadow cursor-pointer',
    },
    theme: {
        colors: {
            primary: '#3b82f6',
            secondary: '#64748b',
            accent: '#ef4444',
        }
    }
});