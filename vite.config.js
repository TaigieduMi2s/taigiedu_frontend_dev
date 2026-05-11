import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    // If you want to bind the server to all network interfaces
    port: 3000,
    host: true,
    // Specify which hosts are allowed to access the preview server
    allowedHosts: ['dev.taigiedu.com', 'www.taigiedu.com']
  },

  base: process.env.VITE_BASE_PATH || '/',
  server: {
    host: true, // 添加這行
    port: 3000, // 可以指定端口
    open: true, // 自動打開瀏覽器
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/backend': {
        target: 'https://dev.taigiedu.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
})


//   // server: {
//   //   historyApiFallback: true
//   // },
//   // 添加基礎路由配置
//   base: '/',
//   // 添加服務器配置
//   server: {
//     historyApiFallback: true,
//     middleware: (app) => {
//       app.use((req, res, next) => {
//         // 如果請求的是 HTML 文件，返回 index.html
//         if (req.headers.accept?.includes('text/html')) {
//           req.url = '/index.html'
//         }
//         if (req.url.includes('file-preview')) {
//           req.url = '/index.html';
//         }
//         next()
//       })
//     }
//   }
// })
