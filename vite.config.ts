import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react({
        // Enable React Fast Refresh with proper error boundaries
        fastRefresh: true,
        // Exclude node_modules from transformation
        exclude: /node_modules/,
        // Include TypeScript files
        include: "**/*.{tsx,ts,jsx,js}",
      }),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          // Security: Exclude sensitive files from caching
          globIgnores: ['**/node_modules/**/*', 'sw.js', 'workbox-*.js'],
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Tarra Monitoring System',
          short_name: 'TarraMonitor',
          description: 'Enterprise vibration monitoring system',
          theme_color: '#1976d2',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    
    // Path resolution with security considerations
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/store': path.resolve(__dirname, './src/store'),
        '@/config': path.resolve(__dirname, './src/config'),
        '@/assets': path.resolve(__dirname, './src/assets'),
      },
    },
    
    // Development server configuration
    server: {
      port: 3001,
      host: true, // Allow external connections
      strictPort: false,
      // Security headers
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: process.env.NODE_ENV === 'production',
          // Security: Add headers for API requests
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              proxyReq.setHeader('X-Forwarded-Proto', 'https')
              proxyReq.setHeader('X-Forwarded-Host', req.headers.host || '')
            })
          }
        }
      }
    },
    
    // Build configuration with security optimizations
    build: {
      target: 'es2022',
      outDir: 'dist',
      sourcemap: mode !== 'production',
      // Security: Remove console logs in production
      minify: mode === 'production' ? 'terser' : false,
      terserOptions: mode === 'production' ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      } : undefined,
      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            azure: ['@azure/msal-browser', '@azure/msal-react'],
            mui: ['@mui/material', '@mui/icons-material'],
            charts: ['chart.js', 'react-chartjs-2', 'recharts'],
            utils: ['lodash', 'date-fns', 'zod']
          },
        },
      },
    },
    
    // Environment variables configuration
    envPrefix: 'VITE_',
    
    // Security: Define globals carefully
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/material',
        '@mui/icons-material',
        'chart.js',
        'react-chartjs-2'
      ],
      exclude: ['@azure/msal-browser']
    },
    
    // Test configuration
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
