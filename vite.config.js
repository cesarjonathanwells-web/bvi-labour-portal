import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Inline the registration code directly into index.html so the browser
      // never has to fetch a separate /registerSW.js file (which the plugin
      // doesn't always emit under Vite 8 + legacy-peer-deps).
      injectRegister: 'inline',
      includeAssets: ['favicon.svg', 'icons.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'BVI Labour Portal',
        short_name: 'BVI Labour',
        description:
          'Official digital portal for the BVI Department of Labour and Workforce Development. Apply for work permits, search jobs, file disputes, and more.',
        start_url: '/',
        display: 'standalone',
        theme_color: '#003366',
        background_color: '#f0f4f8',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
