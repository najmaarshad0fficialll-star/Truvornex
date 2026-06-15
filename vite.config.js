
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
    logLevel: 'error',
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5000,
        allowedHosts: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});