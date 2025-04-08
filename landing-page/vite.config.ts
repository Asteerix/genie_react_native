import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import type { UserConfig, Plugin } from 'vite';

// PWA Configuration
const pwaConfig: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
  manifest: {
    name: 'Genie - Smart Wishlist & Gift Registry App',
    short_name: 'Genie',
    description: 'Create and manage wishlists, organize group gifts, and find perfect presents for any occasion.',
    theme_color: '#1A1A1A',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    screenshots: [
      {
        src: '/assets/screens/my-profile.jpg',
        sizes: '1280x720',
        type: 'image/jpeg',
        platform: 'wide',
        label: 'Profile Management in Genie App'
      },
      {
        src: '/assets/screens/shopping.jpg',
        sizes: '1280x720',
        type: 'image/jpeg',
        platform: 'wide',
        label: 'Shopping Experience in Genie App'
      }
    ],
    categories: ['lifestyle', 'social', 'shopping'],
    shortcuts: [
      {
        name: 'Create Wishlist',
        url: '/create-wishlist',
        description: 'Create a new wishlist'
      },
      {
        name: 'My Events',
        url: '/events',
        description: 'View your events'
      }
    ],
    related_applications: [
      {
        platform: 'play',
        url: 'https://play.google.com/store/apps/details?id=com.genie.app',
        id: 'com.genie.app'
      },
      {
        platform: 'itunes',
        url: 'https://apps.apple.com/app/id835599320'
      }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,avif,jpg,jpeg}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      },
      {
        urlPattern: /^https:\/\/cdn\.gpteng\.co\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'cdn-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 // 24 hours
          }
        }
      }
    ]
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }): UserConfig => {
  const plugins = [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA(pwaConfig),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ];

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: plugins.filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: [
              'react',
              'react-dom',
              'react-router-dom',
              'framer-motion',
            ],
            ui: [
              '@radix-ui/react-accordion',
              '@radix-ui/react-dialog',
              '@radix-ui/react-popover',
              '@radix-ui/react-avatar',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-tabs'
            ],
          },
          assetFileNames: (assetInfo): string => {
            if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
            let extType = assetInfo.name.split('.')[1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              extType = 'img';
            }
            return `assets/${extType}/[name]-[hash][extname]`;
          },
        },
      },
      sourcemap: mode === 'development',
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      reportCompressedSize: true,
    },
    optimizeDeps: {
      include: [
        'react', 
        'react-dom', 
        'framer-motion',
        'react-router-dom',
        '@radix-ui/react-accordion',
        '@radix-ui/react-dialog',
        '@radix-ui/react-popover',
        '@radix-ui/react-avatar',
        '@radix-ui/react-tooltip',
        '@radix-ui/react-tabs'
      ],
      exclude: ['@vite/client', '@vite/env']
    },
    preview: {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Content-Security-Policy': "default-src 'self' https:; script-src 'self' 'unsafe-inline' https: cdn.gpteng.co; style-src 'self' 'unsafe-inline' https: fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https: fonts.gstatic.com; connect-src 'self' https:;",
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
      }
    }
  };
});
