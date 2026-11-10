import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig(({ mode }) => {
  // `--mode artifact`: one self-contained HTML file running in demo mode (no service worker, no Supabase).
  if (mode === 'artifact') {
    return {
      base: './',
      plugins: [react(), viteSingleFile()],
      define: {
        'import.meta.env.VITE_SUPABASE_URL': '""',
        'import.meta.env.VITE_SUPABASE_ANON_KEY': '""',
      },
      resolve: {
        alias: { 'virtual:pwa-register': fileURLToPath(new URL('./src/stubs/pwa-register.ts', import.meta.url)) },
      },
      build: { outDir: 'dist-artifact', assetsInlineLimit: 100_000_000 },
    }
  }

  return {
    // Relative base so the same build works at a domain root or under /repo-name/ on GitHub Pages.
    base: './',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Duit: daily budget & expense tracker',
          short_name: 'Duit',
          description: 'Know what you can spend today. Track expenses in ringgit, send money and grow savings goals.',
          lang: 'en-MY',
          theme_color: '#f7f5fc',
          background_color: '#f7f5fc',
          display: 'standalone',
          orientation: 'portrait',
          start_url: './',
          scope: './',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [{ name: 'Send money', url: './#/transfer' }],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: 'index.html',
        },
      }),
    ],
  }
})
